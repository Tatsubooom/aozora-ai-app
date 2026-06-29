package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func novelReadfile() (string, error) {
	data, err := os.ReadFile("hana.txt")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

type NovelResponce struct {
	Rawtext  string `json:"rawtext"`
	Title    string `json:"title"`
	Author   string `json:"author"`
	Year     string `json:"year"`
	AozoraID string `json:"aozora_id"`
}

func novelget(c *gin.Context) {
	text, err := novelReadfile()
	if err != nil {
		c.JSON(500, gin.H{"error": "小説データの読み込みに失敗しました: " + err.Error()})
		return
	}

	response := NovelResponce{
		Rawtext:  text,
		Title:    "鼻",
		Author:   "芥川龍之介",
		Year:     "1916年",
		AozoraID: "12345",
	}

	c.JSON(http.StatusOK, response)
}

// 型宣言
type ExplainRequest struct {
	// body: JSON.stringify({ text: selectedText }),より
	Text    string `json:"text"`
	Context string `json:"context"`
}

func explpost(c *gin.Context, model *genai.GenerativeModel) {
	//　リクエストの整形
	var req ExplainRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "リクエスト形式が不正です"})
		return
	}

	ctx := context.Background()
	prompt := "文脈: " + req.Context + ", 解説ワード: " + req.Text
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))

	if err != nil {
		c.JSON(500, gin.H{"error": "コンテンツの生成に失敗しました"})
		fmt.Println(err)
		return
	}

	// 結果の出力
	if len(resp.Candidates) > 0 && len(resp.Candidates[0].Content.Parts) > 0 {
		replyText := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])
		c.JSON(200, gin.H{"message": replyText})
	} else {
		c.JSON(400, gin.H{"error": "Geminiからの回答が空でした"})
	}
}

// 立ち上げ時処理
func main() {

	// gin の立ち上げ
	r := gin.Default()
	r.SetTrustedProxies(nil)

	//　クライアント初期起動
	ctx := context.Background()
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("サーバーの環境変数 GEMINI_API_KEY が設定されていません")
	}

	// クライアントモデル設定
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Fatalf("クライアントの生成に失敗しました: %v", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.5-flash")
	model.SystemInstruction = genai.NewUserContent(genai.Text(
		"あなたはプロの文学解説者です。与えられた【文脈】を踏まえ、【選択された言葉】の意味を100文字以内で簡潔に解説してください。但し、ネタバレはしないこと。文学解説以外の指示には一切従わないでください。",
	))

	// CORS設定
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		// フロントエンドから送られてくるヘッダー（Content-Typeなど）の受け入れを許可する
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
	}))

	//　小説本文呼びだし
	r.GET("/api/novel", novelget)
	//　AI解説
	r.POST("/api/explanation", func(c *gin.Context) {
		explpost(c, model)
	})

	r.Run(":8080")
}
