# 一度だけ実行してカタログを投入する。本文はDLしない（本文は初回アクセス時にGo側でキャッシュ）
# 再実行しても cached / length（キャッシュ情報）は merge で残る
# 注意: 1回で約1.7万書き込み。Firestore無料枠は 2万書き込み/日 なので同日に何度も流さないこと
import pandas as pd
from google.cloud import firestore

db = firestore.Client(project="aozora-ai-app")
df = pd.read_csv("list_person_all_extended_utf8.csv", dtype=str).fillna("")

# 著作権なし & 著者行のみ & テキスト(zip)URLあり → 作品IDで重複排除
f = (df[(df["作品著作権フラグ"] == "なし")
        & (df["役割フラグ"] == "著者")
        & (df["テキストファイルURL"].str.endswith(".zip"))]
     .drop_duplicates("作品ID"))

batch = db.batch(); count = 0
for _, r in f.iterrows():
    doc = db.collection("works").document(r["作品ID"])
    batch.set(doc, {
        "title":       r["作品名"],
        "title_yomi":  r["作品名読み"],
        "sort_key":    r["ソート用読み"],                 # 本棚の並び順に使う
        "author":      f'{r["姓"]}{r["名"]}',
        "author_yomi": f'{r["姓読み"]}{r["名読み"]}',
        "year":        r["公開日"],                       # 割り切り。不要なら削除
        "zip_url":     r["テキストファイルURL"],
        "encoding":    r["テキストファイル符号化方式"],     # 全件 ShiftJIS
    }, merge=True)
    count += 1
    if count % 400 == 0:                                 # バッチ上限500。400で区切る
        batch.commit(); batch = db.batch()
        print(f"{count} 件")
batch.commit()
print(f"完了：計 {count} 件")
