# frontend

青空文庫 AI解説リーダーのフロントエンド（Next.js 16 / 静的エクスポート → Firebase Hosting）。

プロジェクト全体の説明・環境変数・デプロイ手順はルートの [README](../README.md) を参照。

```bash
npm install
npm run dev     # http://localhost:3000（.env.local の NEXT_PUBLIC_API_URL にバックエンドが必要）
npm run build   # out/ に静的ファイルを出力
```

> Next.js 16 は従来版から破壊的変更がある。コードを書く前に `node_modules/next/dist/docs/` を確認すること（`AGENTS.md`）。
