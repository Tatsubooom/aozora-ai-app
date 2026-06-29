import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type SidebarProps = {
  isNovelLoaded: boolean;
  isLoading: boolean;
  explanation: string;
  explainedText: string;
  showHeader: boolean;
  novel: {
    title: string;
    author: string;
    year: string;
    aozoraID: string;
  };
};

const NovelDetailsPanel = ({
  novelLoaded,
  novel,
}: {
  novelLoaded: boolean;
  novel: { title: string; author: string; year: string; aozoraID: string };
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="shrink-0">
        <CollapsibleTrigger asChild>
          <CardHeader className="flex-row items-center justify-between space-y-0 cursor-pointer select-none">
            <CardTitle className="text-base">書誌情報</CardTitle>
            <span className="text-sm text-gray-500">{isOpen ? '閉じる' : '開く'}</span>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {novelLoaded ? (
              <div className="space-y-1">
                <p><strong>タイトル:</strong> {novel.title}</p>
                <p><strong>著者:</strong> {novel.author}</p>
                <p><strong>発行年:</strong> {novel.year}</p>
                <p><strong>青空文庫ID:</strong> {novel.aozoraID}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                小説を読み込むと、ここに著者名や発行年などが表示されます。
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export const Sidebar = ({
  isNovelLoaded,
  isLoading,
  explanation,
  explainedText,
  showHeader,
  novel,
}: SidebarProps) => {
  return (
    <aside
      className={cn(
        'sticky flex flex-col gap-5 transition-[top,height] duration-300 ease-in-out',
        showHeader ? 'top-[84px] h-[calc(100vh-104px)]' : 'top-5 h-[calc(100vh-40px)]'
      )}
    >
      <NovelDetailsPanel novelLoaded={isNovelLoaded} novel={novel} />

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>AI解説</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pr-2.5">
          {isLoading && <p>解説を生成中...</p>}
          {explanation ? (
            <div className="rounded-lg border-l-[5px] border-l-cyan-600 bg-cyan-600/10 p-5">
              <h4 className="mt-0 text-cyan-600">解説：「{explainedText}」</h4>
              <p className="m-0 whitespace-pre-wrap leading-relaxed">{explanation}</p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-gray-500">
              文章を選択してボタンを押すと、ここに解説が表示されます。
            </p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
};