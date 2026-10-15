# 青空文庫 AI解説リーダー

著作権の切れた青空文庫の作品を読みながら、分からない言葉を選択するだけで AI が文脈に沿って解説してくれる読書サイト。

- 小説の閲覧は誰でも可能（ログイン不要）
- AI解説は **Chrome 内蔵AI（端末内・無料）** を優先し、使えない環境では **管理者が配布したアクセスコード** でクラウドの Gemini を使う

## 主な機能

| 機能 | 内容 |
|---|---|
| 本棚 | Firestore に登録した約1.7万作品を読み順で一覧表示（20件ずつ「もっと見る」） |
| 本文表示 | 青空文庫のテキストを取得してルビ付きで表示。初回アクセス時に Cloud Storage へキャッシュ |
| AI解説 | 文章を選択 →「AIに解説を依頼」で、前後200字の文脈を踏まえて100字以内で解説（ネタバレなし） |
| 端末内AI | Chrome の Prompt API（Gemini Nano）が使える PC では端末上で解説。通信・課金なし、回数無制限 |
| アクセスコード | 管理者が期限付きコードを発行。コードごとに1日の回数上限あり。取り消し可能 |
| スマホ対応 | 長押し選択で解説ボタン、解説は下から出るシートで表示 |

## 構成

```
ブラウザ ──► Firebase Hosting（Next.js 静的エクスポート）
   │              └─ /api/** を Cloud Run に転送
   │
   ├─ 端末内AI（Chrome 内蔵 Gemini Nano）※対応PCのみ
   │
   └─► Cloud Run: aozora-api（Go + Gin）
          ├─ Firestore     works（作品メタデータ）/ access_codes / usage
          ├─ Cloud Storage works/{id}.txt（本文キャッシュ）
          ├─ Gemini API    クラウドAI解説
          └─ 青空文庫      本文 zip を初回のみ取得
```

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js 16 / React 19 / Tailwind CSS v4 / shadcn/ui |
| バックエンド | Go 1.25 / Gin |
| データ | Firestore / Cloud Storage |
| AI | Gemini API（既定 `gemini-2.5-flash`）/ Chrome Prompt API |
| インフラ | Firebase Hosting / Cloud Run / Secret Manager |

## ディレクトリ

```
aozora-ai-app/
├── backend/
│   ├── main.go              ルーティング・AI解説・CORS・環境変数
│   ├── novel.go             作品メタデータ取得 / 本文のDL・変換・キャッシュ / 一覧
│   ├── access.go            アクセスコード・セッション・回数制限・総当たり対策
│   ├── access_test.go
│   ├── admin_access.py      アクセスコード管理（管理者用）
│   ├── seed_firestore.py    青空文庫カタログ → Firestore 投入（初回のみ）
│   ├── list_person_all_extended_utf8.csv  青空文庫の公式カタログ
│   ├── Dockerfile           本番用（distroless）
│   ├── dockerfile.dev       開発用（Air でホットリロード）
│   └── .gcloudignore / .dockerignore  秘密情報をアップロードしないための除外設定
├── frontend/
│   ├── app/page.tsx         画面の組み立て
│   ├── hooks/
│   │   ├── useNovelReader.ts  本文・選択・解説ボタンの状態
│   │   ├── useAccess.ts       アクセスコード / セッション
│   │   ├── useLocalAI.ts      Chrome 内蔵AI
│   │   └── useExplainer.ts    端末内AI / クラウドAI の振り分け
│   ├── components/          Header / Sidebar / BookshelfDrawer / ExplanationPanel など
│   ├── utils/aozoraParser.tsx  ルビ変換・除去
│   └── firebase.json        Hosting 設定（/api/** → Cloud Run）
└── docker-compose.yml
```

## API

| メソッド | パス | 認証 | 内容 |
|---|---|---|---|
| GET | `/api/novels?limit=20&cursor=<ID>` | 不要 | 作品一覧（読み順）。`{ items, next_cursor }` |
| GET | `/api/novel/:id` | 不要 | 作品のメタデータと本文 |
| POST | `/api/session` | 不要 | `{ code }` を確認してセッショントークンを発行 |
| GET | `/api/session` | 必要 | コード期限・本日の残り回数 |
| POST | `/api/explanation` | 必要 | `{ text, context }` → `{ message, remaining }` |

認証は `Authorization: Bearer <セッショントークン>`。

## 環境変数

### backend（`backend/.env` / Cloud Run）

| 変数 | 必須 | 内容 |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Gemini API キー（本番は Secret Manager `gemini-api-key`） |
| `SESSION_SECRET` | ✅ | セッショントークン署名用。32文字以上（本番は Secret Manager `session-secret`） |
| `GCP_PROJECT` | ✅ | `aozora-ai-app` |
| `BUCKET` | ✅ | 本文キャッシュ用の Cloud Storage バケット |
| `GOOGLE_APPLICATION_CREDENTIALS` | ローカルのみ | サービスアカウント鍵のパス（Cloud Run では不要） |
| `DAILY_EXPLAIN_LIMIT` | | コードごとの1日の解説回数（既定 30） |
| `NOVELS_PAGE_SIZE` | | 本棚の1ページの件数（既定 20） |
| `GEMINI_MODEL` | | 使用モデル（既定 `gemini-2.5-flash`） |
| `CORS_ORIGINS` | | 許可するオリジン（カンマ区切り。既定 `http://localhost:3000`） |

`.env` は `KEY=value` の形式で、`=` の前後にスペースを入れないこと。`SESSION_SECRET` は `openssl rand -base64 48` で生成する。

### frontend

| ファイル | `NEXT_PUBLIC_API_URL` |
|---|---|
| `.env.local` | `http://localhost:8080` |
| `.env.production` | 空（Hosting が `/api/**` を Cloud Run に転送するため同一オリジン） |

`.env*` と `credentials.json` は git 管理外。

## ローカル開発

```bash
docker compose up
```

- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:8080（Air でホットリロード）

Docker を使わない場合:

```bash
# backend（.env を読み込んで起動）
cd backend && set -a && . ./.env && set +a && go run .

# frontend
cd frontend && npm install && npm run dev
```

テスト・チェック:

```bash
cd backend  && go vet ./... && go test ./...
cd frontend && npx tsc --noEmit && npx eslint app components hooks && npm run build
```

## アクセスコードの管理

管理者がローカルで実行する（`backend/` で）。

```bash
export GOOGLE_APPLICATION_CREDENTIALS=credentials.json

# 発行（コードは発行時に一度だけ表示される。控えてから配布する）
../.venv/bin/python admin_access.py create --note "田中さん" --days 7
../.venv/bin/python admin_access.py create --note "ヘビーユーザー" --days 30 --limit 100

# 一覧
../.venv/bin/python admin_access.py list

# 無効化（コード末尾4文字 または ID先頭）
../.venv/bin/python admin_access.py revoke GGMT
```

仕組み:

- Firestore（`access_codes/{sha256}`）にはコードのハッシュだけを保存する
- 利用者がコードを入力すると、最長7日（コードの期限が早ければそれまで）のセッショントークンを発行する
- 解説APIはリクエストのたびにコードの取り消し・期限切れを確認する
- 1日の回数は `usage/{コードID}/days/{日付}` で数える（日本時間で日付が切り替わる）
- 総当たり対策として、同じ接続元から15分に10回失敗すると 429 を返す

## データ投入（初回のみ・実行済み）

```bash
cd backend
GOOGLE_APPLICATION_CREDENTIALS=credentials.json ../.venv/bin/python seed_firestore.py
```

著作権の切れた作品（約1.7万件）のメタデータを `works` に merge で書き込む。本文は初回アクセス時に取得してキャッシュする。1回の実行で約1.7万回書き込むので（Firestore の無料枠は1日2万回）、同じ日に何度も実行しないこと。

## デプロイ

### 1. シークレット（初回のみ）

```bash
openssl rand -base64 48 | tr -d '\n' | \
  gcloud secrets create session-secret --data-file=- --project aozora-ai-app
gcloud secrets add-iam-policy-binding session-secret --project aozora-ai-app \
  --member=serviceAccount:778236383564-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

Gemini キーを差し替える場合:

```bash
read -s -p "新しいGeminiキー: " K && printf '%s' "$K" | \
  gcloud secrets versions add gemini-api-key --data-file=- --project aozora-ai-app; unset K
```

### 2. バックエンド（Cloud Run）

```bash
cd backend
gcloud run deploy aozora-api --source . --region asia-northeast1 --project aozora-ai-app \
  --max-instances=1 \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,SESSION_SECRET=session-secret:latest \
  --update-env-vars=DAILY_EXPLAIN_LIMIT=30,NOVELS_PAGE_SIZE=20,GEMINI_MODEL=gemini-2.5-flash \
  --allow-unauthenticated
```

- `--max-instances=1` は外さないこと。費用の暴走を防ぐためと、総当たり対策の集計がメモリ上で行われるため
- アップロードされるのは `.gcloudignore` で絞った Go のソースだけ（`gcloud meta list-files-for-upload .` で確認できる）

### 3. フロントエンド（Firebase Hosting）

```bash
cd frontend
npm run build
firebase deploy --only hosting --project aozora-ai-app
```

### 4. 動作確認

```bash
curl -s "https://aozora-ai-app.web.app/api/novels?limit=1"   # 作品が返る
curl -s -X POST https://aozora-ai-app.web.app/api/explanation \
  -H 'Content-Type: application/json' -d '{"text":"鼻"}'      # 401 が返る
```

## 費用の安全装置

| 対策 | 場所 |
|---|---|
| Google AI Pro 特典の $10/月 Cloud クレジット | [My Benefits](https://developers.google.com/program/my-benefits) で有効化 |
| Gemini API の月額上限 | AI Studio → Spend → Monthly spend cap（反映まで約10分の遅れ） |
| 予算アラート（通知のみ） | Cloud コンソール → お支払い → 予算とアラート |
| インスタンス数の上限 | Cloud Run `--max-instances=1` |
| 利用者の限定・回数制限 | アクセスコード / `DAILY_EXPLAIN_LIMIT` |
| 入力の上限 | 選択語100字・文脈1000字 |

## 端末内AIの対応環境

PC版 Chrome（Windows 10/11・macOS 13+・Linux・Chromebook Plus）で、空き容量22GB以上、GPUメモリ4GB超 または メモリ16GB以上・4コア以上。スマホは非対応。初回は解説欄の「端末内AIを準備する」からモデル（数GB）をダウンロードする。設定メニューでオン・オフを切り替えられる。

## 既知の課題 / TODO

- 本棚は読み順で並べているため、英字タイトルが先頭に来る。検索・著者別の表示が必要
- `year` は青空文庫での公開日で、作品の発表年ではない（サイドバーの「発行年」表記も要修正）
- 解説の文脈は、選択語が本文中で最初に出てくる位置から取っている
- Gemini がエラーになった場合も、回数は1回分消費される
- 総当たり対策のキーは `X-Forwarded-For` 全体を使っており、すり抜けられる。デプロイ後にプロキシの段数を確認して、信頼できる位置の IP を使うよう改善する
- GitHub Actions による CI/CD は未整備
