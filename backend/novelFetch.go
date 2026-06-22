package main

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func initDB() {
	// DSN（データソースネーム）にパラメータを付与
	// _journal_mode=WAL(読み書きの並列化)
	// _busy_timeout=5000(ロック時は5秒（5000ms）待機して自動リトライ)
	dsn := "./novel.db?_journal_mode=WAL&_busy_timeout=5000"

	var err error
	db, err = sql.Open("sqlite3", dsn)
	if err != nil {
		log.Fatal("DB接続失敗:", err)
	}

	// プール内カーソル数
	db.SetMaxIdleConns(4)
	// カーソル最大数
	db.SetMaxOpenConns(16)
	//カーソルの寿命
	db.SetConnMaxLifetime(time.Hour)
}

func fetchNovel(id int) {

}
