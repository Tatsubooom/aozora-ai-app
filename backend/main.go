package main

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func novelReadfile() (string, error) {
	data, err := os.ReadFile("hana.txt")
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func novelget(c *gin.Context) {
	text, err := novelReadfile()
	if err != nil {
		c.JSON(500, gin.H{"error": "小説データの読み込みに失敗しました: " + err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": text})
}

func explpost(c *gin.Context) {

}

func main() {
	r := gin.Default()
	// CORS設定
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"},
	}))

	//小説本文呼びだし
	r.GET("/api/novel", novelget)
	//AIコール
	r.POST("api/explanation", explpost)
	r.Run(":8080")
}
