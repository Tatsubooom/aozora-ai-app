# アクセスコードの管理スクリプト（管理者がローカルで実行する）
#
#   python admin_access.py create --note "田中さん" [--days 7] [--limit 30]   コードを発行（表示は一度きり）
#   python admin_access.py list                                              発行済みコードの一覧
#   python admin_access.py revoke <末尾4文字 or ID先頭>                       コードを無効化
#
# 事前に GOOGLE_APPLICATION_CREDENTIALS=credentials.json を設定しておくこと
# Firestore にはコードのハッシュだけを保存する（コード本体はどこにも残らないので、発行時に控えること）
import argparse
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from google.cloud import firestore

db = firestore.Client(project="aozora-ai-app")
col = db.collection("access_codes")

# 読み間違えやすい 0/O, 1/I/L を除いた31文字 × 16桁 ≒ 79ビット
ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def normalize(code: str) -> str:
    # Go側 hashCode と同じ正規化
    return code.upper().replace("-", "").replace(" ", "").replace("　", "")


def code_id(code: str) -> str:
    return hashlib.sha256(normalize(code).encode()).hexdigest()


def create(args):
    body = "".join(secrets.choice(ALPHABET) for _ in range(16))
    code = "AOZR-" + "-".join(body[i:i + 4] for i in range(0, 16, 4))
    expires = datetime.now(timezone.utc) + timedelta(days=args.days)
    col.document(code_id(code)).set({
        "note": args.note,
        "hint": body[-4:],
        "expires_at": expires,
        "revoked": False,
        "daily_limit": args.limit,  # 0 ならサーバー既定値（DAILY_EXPLAIN_LIMIT）
        "created_at": datetime.now(timezone.utc),
    })
    print(f"アクセスコード: {code}")
    print(f"  対象: {args.note or '(メモなし)'} / 期限: {expires.astimezone():%Y-%m-%d %H:%M} / "
          f"1日の上限: {args.limit or 'サーバー既定値'}")
    print("  ※ このコードは再表示できません。控えてから配布してください")


def list_codes(_):
    now = datetime.now(timezone.utc)
    for d in col.order_by("created_at").stream():
        v = d.to_dict()
        exp = v["expires_at"]
        state = "無効化" if v.get("revoked") else ("期限切れ" if exp < now else "有効")
        print(f'…{v.get("hint", "????")}  {state:<4}  期限:{exp.astimezone():%Y-%m-%d}  '
              f'上限:{v.get("daily_limit") or "既定"}  {v.get("note", "")}  (id:{d.id[:8]})')


def revoke(args):
    key = args.key.upper()
    hits = [d for d in col.stream()
            if d.to_dict().get("hint") == key or d.id.startswith(args.key.lower())]
    if len(hits) != 1:
        print(f"該当が{len(hits)}件あります。list でIDを確認して、ID先頭で指定してください")
        return
    hits[0].reference.update({"revoked": True})
    print(f'無効化しました: …{hits[0].to_dict().get("hint")} {hits[0].to_dict().get("note", "")}')


p = argparse.ArgumentParser()
sub = p.add_subparsers(required=True)
c = sub.add_parser("create"); c.set_defaults(fn=create)
c.add_argument("--note", default="", help="誰に渡したかのメモ")
c.add_argument("--days", type=int, default=7, help="有効日数（既定7日）")
c.add_argument("--limit", type=int, default=0, help="1日の解説回数の上限。0でサーバー既定値")
sub.add_parser("list").set_defaults(fn=list_codes)
r = sub.add_parser("revoke"); r.set_defaults(fn=revoke)
r.add_argument("key", help="コード末尾4文字 または ID先頭")
args = p.parse_args()
args.fn(args)
