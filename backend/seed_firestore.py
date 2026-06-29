# 一度だけ実行してカタログを投入する。本文はDLしない（cached=False で空のまま）
import pandas as pd
from google.cloud import firestore

db = firestore.Client(project="aozora-ai-app")
df = pd.read_csv("list_person_all_extended_utf8.csv", dtype=str)

# 著作権なし & 著者行のみ & テキストURLあり → 作品IDで重複排除
f = (df[(df["作品著作権フラグ"] == "なし")
        & (df["役割フラグ"] == "著者")
        & (df["テキストファイルURL"].notna())]
     .drop_duplicates("作品ID"))

batch = db.batch(); count = 0
for _, r in f.iterrows():
    doc = db.collection("works").document(r["作品ID"])
    batch.set(doc, {
        "title":    r["作品名"],
        "author":   f'{r["姓"] or ""}{r["名"] or ""}',
        "year":     r["公開日"],                    # 割り切り。不要なら削除
        "zip_url":  r["テキストファイルURL"],
        "encoding": r["テキストファイル符号化方式"],  # 大半 ShiftJIS
        "length":   None,                           # キャッシュ時に埋める
        "cached":   False,                          # 本文未取得
    })
    count += 1
    if count % 400 == 0:                            # バッチ上限500。400で区切る
        batch.commit(); batch = db.batch()
        print(f"{count} 件")
batch.commit()
print(f"完了：計 {count} 件")