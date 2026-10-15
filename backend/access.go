package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"sync"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// アクセスコード方式の利用制限。
// 管理者が admin_access.py で期限付きのコードを発行 → 利用者がサイトで入力 → 署名付きセッショントークンを返す。
//
// Firestore のコレクション:
//   access_codes/{sha256(コード)}       コード本体は保存せずハッシュだけ持つ
//   usage/{コードID}/days/{YYYY-MM-DD}  その日のAI解説の利用回数（日本時間で日付を切る）

const maxSessionTTL = 7 * 24 * time.Hour // コードの期限が長くても、7日ごとに入力し直してもらう

var (
	errQuotaExceeded = errors.New("本日の利用上限に達しました")
	errCodeInvalid   = errors.New("アクセスコードが正しくありません")
	errCodeExpired   = errors.New("アクセスコードの有効期限が切れています")
	errCodeRevoked   = errors.New("アクセスコードは無効化されています")
)

var jst = time.FixedZone("Asia/Tokyo", 9*60*60)

type AccessCode struct {
	Note       string    `firestore:"note"`
	ExpiresAt  time.Time `firestore:"expires_at"`
	Revoked    bool      `firestore:"revoked"`
	DailyLimit int       `firestore:"daily_limit"` // 0 ならサーバー既定値
}

type Gatekeeper struct {
	fs           *firestore.Client
	secret       []byte
	defaultLimit int
	limiter      *failLimiter
}

func NewGatekeeper(fs *firestore.Client, secret string, defaultLimit int) *Gatekeeper {
	return &Gatekeeper{fs: fs, secret: []byte(secret), defaultLimit: defaultLimit, limiter: newFailLimiter()}
}

// 入力ゆれ（小文字・ハイフン・空白）を吸収してからハッシュ化
func hashCode(code string) string {
	normalized := strings.ToUpper(strings.NewReplacer("-", "", " ", "", "　", "").Replace(code))
	sum := sha256.Sum256([]byte(normalized))
	return hex.EncodeToString(sum[:])
}

func (g *Gatekeeper) lookup(ctx context.Context, id string) (*AccessCode, error) {
	snap, err := g.fs.Collection("access_codes").Doc(id).Get(ctx)
	if status.Code(err) == codes.NotFound {
		return nil, errCodeInvalid
	}
	if err != nil {
		return nil, err
	}
	var ac AccessCode
	if err := snap.DataTo(&ac); err != nil {
		return nil, err
	}
	if ac.Revoked {
		return nil, errCodeRevoked
	}
	if time.Now().After(ac.ExpiresAt) {
		return nil, errCodeExpired
	}
	return &ac, nil
}

func (g *Gatekeeper) limitOf(ac *AccessCode) int {
	if ac.DailyLimit > 0 {
		return ac.DailyLimit
	}
	return g.defaultLimit
}

func isUserError(err error) bool {
	return errors.Is(err, errCodeInvalid) || errors.Is(err, errCodeExpired) || errors.Is(err, errCodeRevoked)
}

// ---- ミドルウェア ----

// RequireSession: Authorization: Bearer <セッショントークン> を検証する。
// トークンが有効でも、コードが取り消し・期限切れなら弾く（毎回Firestoreを1件読む）
func (g *Gatekeeper) RequireSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := strings.CutPrefix(c.GetHeader("Authorization"), "Bearer ")
		if !ok || raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "アクセスコードの入力が必要です"})
			return
		}
		claims := &jwt.RegisteredClaims{}
		_, err := jwt.ParseWithClaims(raw, claims, func(*jwt.Token) (interface{}, error) { return g.secret, nil },
			jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithExpirationRequired())
		if err != nil || claims.Subject == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "セッションの有効期限が切れました。アクセスコードを入力し直してください"})
			return
		}
		ac, err := g.lookup(c.Request.Context(), claims.Subject)
		if isUserError(err) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "利用権限の確認に失敗しました"})
			return
		}
		c.Set("code_id", claims.Subject)
		c.Set("access_code", ac)
		c.Next()
	}
}

// ---- 回数制限 ----

func (g *Gatekeeper) usageDoc(codeID string) *firestore.DocumentRef {
	day := time.Now().In(jst).Format("2006-01-02")
	return g.fs.Collection("usage").Doc(codeID).Collection("days").Doc(day)
}

func (g *Gatekeeper) usedToday(ctx context.Context, codeID string) (int, error) {
	snap, err := g.usageDoc(codeID).Get(ctx)
	if status.Code(err) == codes.NotFound {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	n, _ := snap.Data()["count"].(int64)
	return int(n), nil
}

// ConsumeQuota: 1回分を消費する。上限なら errQuotaExceeded。残り回数を返す
func (g *Gatekeeper) ConsumeQuota(ctx context.Context, codeID string, limit int) (int, error) {
	ref := g.usageDoc(codeID)
	remaining := 0
	err := g.fs.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		used := 0
		snap, err := tx.Get(ref)
		if err == nil {
			n, _ := snap.Data()["count"].(int64)
			used = int(n)
		} else if status.Code(err) != codes.NotFound {
			return err
		}
		if used >= limit {
			return errQuotaExceeded
		}
		remaining = limit - used - 1
		return tx.Set(ref, map[string]interface{}{"count": used + 1, "updatedAt": time.Now()}, firestore.MergeAll)
	})
	return remaining, err
}

// ---- ハンドラ ----

type sessionRequest struct {
	Code string `json:"code"`
}

// POST /api/session  アクセスコードを確認してセッショントークンを発行する
func (g *Gatekeeper) CreateSessionHandler(c *gin.Context) {
	ip := clientIP(c)
	if !g.limiter.allow(ip) {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "試行回数が多すぎます。しばらく待ってから再度お試しください"})
		return
	}

	var req sessionRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Code) == "" || len(req.Code) > 64 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "アクセスコードを入力してください"})
		return
	}

	id := hashCode(req.Code)
	ac, err := g.lookup(c.Request.Context(), id)
	if isUserError(err) {
		g.limiter.fail(ip)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "アクセスコードの確認に失敗しました"})
		return
	}

	exp := time.Now().Add(maxSessionTTL)
	if ac.ExpiresAt.Before(exp) {
		exp = ac.ExpiresAt
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   id,
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(exp),
	}).SignedString(g.secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "セッションの発行に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token})
}

// GET /api/session  現在のセッションの状態（期限・本日の残り回数）
func (g *Gatekeeper) SessionInfoHandler(c *gin.Context) {
	ac := c.MustGet("access_code").(*AccessCode)
	limit := g.limitOf(ac)
	used, err := g.usedToday(c.Request.Context(), c.GetString("code_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "利用状態の取得に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"expires_at":  ac.ExpiresAt,
		"daily_limit": limit,
		"remaining":   max(0, limit-used),
	})
}

// ---- 総当たり対策 ----
// コードは十分長いので総当たりは現実的でないが、念のため失敗回数で制限する。
// Cloud Run は max-instances=1 前提なのでメモリ上の集計で足りる。
// IP単位の制限は X-Forwarded-For の偽装で回避されうるので、全体の上限も併用する。

const (
	failWindow    = 15 * time.Minute
	failPerIP     = 10
	failPerGlobal = 100
)

type failLimiter struct {
	mu     sync.Mutex
	byIP   map[string][]time.Time
	global []time.Time
}

func newFailLimiter() *failLimiter {
	return &failLimiter{byIP: map[string][]time.Time{}}
}

func prune(ts []time.Time, now time.Time) []time.Time {
	i := 0
	for i < len(ts) && now.Sub(ts[i]) > failWindow {
		i++
	}
	return ts[i:]
}

func (l *failLimiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	l.global = prune(l.global, now)
	l.byIP[ip] = prune(l.byIP[ip], now)
	if len(l.byIP[ip]) == 0 {
		delete(l.byIP, ip)
	}
	return len(l.global) < failPerGlobal && len(l.byIP[ip]) < failPerIP
}

func (l *failLimiter) fail(ip string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	l.global = append(l.global, now)
	l.byIP[ip] = append(l.byIP[ip], now)
}

// Firebase Hosting / Cloud Run 経由だと RemoteAddr はGoogleのプロキシになるので、
// X-Forwarded-For の先頭（クライアントIP）を使う
func clientIP(c *gin.Context) string {
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	return c.ClientIP()
}
