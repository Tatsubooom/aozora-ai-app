import React from 'react';

export type ExplanationPanelProps = {
  isLoading: boolean;
  explanation: string;
  explainedText: string;
};

// AI解説の表示部（PCはサイドバー、スマホは下から出るシートで共用）
export const ExplanationPanel = ({ isLoading, explanation, explainedText }: ExplanationPanelProps) => {
  return (
    <div className="flex flex-col gap-4">
      {isLoading && <p>解説を生成中...</p>}
      {explanation ? (
        <div className="rounded-lg border-l-[5px] border-l-cyan-600 bg-cyan-600/10 p-5">
          <h4 className="mt-0 text-cyan-600">解説：「{explainedText}」</h4>
          <p className="m-0 whitespace-pre-wrap leading-relaxed">{explanation}</p>
        </div>
      ) : (
        !isLoading && (
          <p className="text-sm leading-relaxed text-gray-500">
            文章を選択してボタンを押すと、ここに解説が表示されます。
          </p>
        )
      )}
    </div>
  );
};
