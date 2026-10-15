import React from 'react';
import { Button } from '@/components/ui/button';
import type { AccessState } from '@/hooks/useAccess';

export type ExplanationPanelProps = {
  access: AccessState;
  isLoading: boolean;
  explanation: string;
  explainedText: string;
};

// アクセスコード入力フォーム
const AccessCodeForm = ({ redeem }: { redeem: AccessState['redeem'] }) => {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await redeem(code);
    setSubmitting(false);
    if (result === true) setCode('');
    else setError(result);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        AI解説を使うには、管理者から配布されたアクセスコードを入力してください。
      </p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="AOZR-XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 py-1.5 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <Button type="submit" size="sm" disabled={submitting || code.trim() === ''}>
          確認
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
};

const SourceLabel = ({ access }: { access: AccessState }) => {
  if (access.info) {
    return (
      <p className="text-xs text-muted-foreground">
        クラウドAIで解説します（本日の残り {access.info.remaining}/{access.info.daily_limit}回・
        コード期限 {new Date(access.info.expires_at).toLocaleDateString('ja-JP')}）
      </p>
    );
  }
  return null;
};

export const ExplanationPanel = ({
  access,
  isLoading,
  explanation,
  explainedText,
}: ExplanationPanelProps) => {
  return (
    <div className="flex flex-col gap-4">
      {access.ready && !access.hasSession && (
        <AccessCodeForm redeem={access.redeem} />
      )}
      <SourceLabel access={access} />

      {isLoading && <p>解説を生成中...</p>}
      {explanation ? (
        <div className="rounded-lg border-l-[5px] border-l-cyan-600 bg-cyan-600/10 p-5">
          <h4 className="mt-0 text-cyan-600">解説：「{explainedText}」</h4>
          <p className="m-0 whitespace-pre-wrap leading-relaxed">{explanation}</p>
        </div>
      ) : (
        access.hasSession && !isLoading && (
          <p className="text-sm leading-relaxed text-gray-500">
            文章を選択してボタンを押すと、ここに解説が表示されます。
          </p>
        )
      )}
    </div>
  );
};
