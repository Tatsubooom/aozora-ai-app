package main

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	"golang.org/x/text/encoding/japanese"
	"golang.org/x/text/transform"
)

type NovelStore struct {
	fs     *firestore.Client
	bucket *storage.BucketHandle
}

type WorkMeta struct {
	Title    string `firestore:"title"`
	Author   string `firestore:"author"`
	Year     string `firestore:"year"`
	ZipURL   string `firestore:"zip_url"`
	Encoding string `firestore:"encoding"`
	Length   int    `firestore:"length"`
	Cached   bool   `firestore:"cached"`
}

func NewNovelStore(ctx context.Context, projectID, bucketName string) (*NovelStore, error) {
	fs, err := firestore.NewClient(ctx, projectID)
	if err != nil {
		return nil, err
	}
	st, err := storage.NewClient(ctx)
	if err != nil {
		return nil, err
	}
	return &NovelStore{fs: fs, bucket: st.Bucket(bucketName)}, nil
}

// メタデータ取得（NotFound は呼び出し側で判定）
func (s *NovelStore) GetMeta(ctx context.Context, id string) (*WorkMeta, error) {
	snap, err := s.fs.Collection("works").Doc(id).Get(ctx)
	if err != nil {
		return nil, err
	}
	var w WorkMeta
	if err := snap.DataTo(&w); err != nil {
		return nil, err
	}
	return &w, nil
}

// 本文取得（無ければDLしてキャッシュ）。まず統合版
func (s *NovelStore) GetText(ctx context.Context, id, zipURL string) ([]byte, error) {
	obj := s.bucket.Object("works/" + id + ".txt")

	// 1. キャッシュ確認
	if r, err := obj.NewReader(ctx); err == nil {
		defer r.Close()
		return io.ReadAll(r)
	} else if !errors.Is(err, storage.ErrObjectNotExist) {
		return nil, err
	}

	// 2. zip DL → 展開 → Shift_JIS変換
	text, err := downloadAndDecode(zipURL)
	if err != nil {
		return nil, err
	}

	// 3. Storage保存
	w := obj.NewWriter(ctx)
	if _, err := w.Write(text); err != nil {
		return nil, err
	}
	if err := w.Close(); err != nil {
		return nil, err
	}

	// 4. Firestore更新（cached / length）
	s.fs.Collection("works").Doc(id).Set(ctx, map[string]interface{}{
		"cached": true, "length": utf8.RuneCount(text), "cachedAt": time.Now(),
	}, firestore.MergeAll)

	return text, nil
}

// zip取得＋展開＋Shift_JIS→UTF-8（HTTP以外の依存がなくテストしやすい）
func downloadAndDecode(zipURL string) ([]byte, error) {
	resp, err := http.Get(zipURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	zipBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	zr, err := zip.NewReader(bytes.NewReader(zipBytes), int64(len(zipBytes)))
	if err != nil {
		return nil, err
	}
	for _, f := range zr.File {
		if strings.HasSuffix(f.Name, ".txt") {
			rc, err := f.Open()
			if err != nil {
				return nil, err
			}
			defer rc.Close()
			return io.ReadAll(transform.NewReader(rc, japanese.ShiftJIS.NewDecoder()))
		}
	}
	return nil, errors.New("zip内に.txtが見つかりません")
}
