import { useCallback, useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const STORAGE_KEY = 'aozora_session';

type SessionInfo = {
  expires_at: string;
  daily_limit: number;
  remaining: number;
};

// localStorage はプライベートモード等で例外になることがあるので必ず try/catch
const loadToken = () => {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
};
const saveToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* 保存できなくてもこのタブの間は使える */ }
};

const fetchInfo = async (token: string): Promise<SessionInfo | string> => {
  const res = await fetch(`${API}/api/session`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return res.ok ? data : (data.error ?? 'セッションの確認に失敗しました');
};

// アクセスコード → セッショントークンの管理（クラウドAIを使う権限）
export const useAccess = () => {
  const [token, setToken] = useState<string | null>(null);
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [ready, setReady] = useState(false);

  // 保存済みのトークンがまだ有効か確認
  useEffect(() => {
    const saved = loadToken();
    (async () => {
      if (saved) {
        try {
          const r = await fetchInfo(saved);
          if (typeof r === 'string') saveToken(null);
          else {
            setToken(saved);
            setInfo(r);
          }
        } catch { /* オフライン等。次の操作時に再確認 */ }
      }
      setReady(true);
    })();
  }, []);

  const clear = useCallback(() => {
    saveToken(null);
    setToken(null);
    setInfo(null);
  }, []);

  // アクセスコードを入力。成功なら true、失敗ならエラーメッセージ
  const redeem = async (code: string): Promise<true | string> => {
    try {
      const res = await fetch(`${API}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? 'アクセスコードの確認に失敗しました';
      const r = await fetchInfo(data.token);
      if (typeof r === 'string') return r;
      saveToken(data.token);
      setToken(data.token);
      setInfo(r);
      return true;
    } catch {
      return '通信に失敗しました';
    }
  };

  // トークン付き fetch。期限切れ・取り消し（401）ならセッションを破棄
  const authFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${API}${path}`, { ...init, headers });
    if (res.status === 401) clear();
    return res;
  }, [token, clear]);

  const setRemaining = useCallback((n: number) => {
    setInfo((prev) => (prev ? { ...prev, remaining: n } : prev));
  }, []);

  return { hasSession: Boolean(token), info, ready, redeem, logout: clear, authFetch, setRemaining };
};

export type AccessState = ReturnType<typeof useAccess>;
