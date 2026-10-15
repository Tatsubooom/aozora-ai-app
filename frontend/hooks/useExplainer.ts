import type { AccessState } from '@/hooks/useAccess';
import type { LocalAIState } from '@/hooks/useLocalAI';

export type ExplainSource = 'local' | 'cloud';

// 解説の振り分け: 端末内AIが使えるならそれ（無料）、無ければアクセスコードでクラウドAI
export const useExplainer = (access: AccessState, localAI: LocalAIState) => {
  const source: ExplainSource | null = localAI.usable ? 'local' : access.hasSession ? 'cloud' : null;

  const explain = async (text: string, context: string): Promise<string> => {
    if (source === 'local') return localAI.explain(text, context);

    const res = await access.authFetch('/api/explanation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }),
    });
    const data = await res.json();
    if (typeof data.remaining === 'number') access.setRemaining(data.remaining);
    if (res.status === 429) access.setRemaining(0);
    if (!res.ok) throw new Error(data.error ?? '解説の取得に失敗しました');
    return data.message;
  };

  return { source, canExplain: source !== null, explain };
};

export type ExplainerState = ReturnType<typeof useExplainer>;
