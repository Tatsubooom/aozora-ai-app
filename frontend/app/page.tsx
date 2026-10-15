'use client';

import React from 'react';
import { Sidebar, NovelDetailsPanel } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PopoverButton } from '@/components/PopoverButton';
import { NovelContent } from '@/components/NovelContent';
import { ExplanationPanel } from '@/components/ExplanationPanel';
import { useNovelReader } from '@/hooks/useNovelReader';
import { BookshelfDrawer } from '@/components/BookshelfDrawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// AI解説API呼び出し
const explain = async (text: string, context: string) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/explanation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? '解説の取得に失敗しました');
  return data.message as string;
};

export default function NovelReader() {
  const {
    theme,
    toggleTheme,
    isSettingsOpen,
    setIsSettingsOpen,
    showHeader,
    novel,
    isNovelLoaded,
    novelError,
    showButton,
    buttonPos,
    explanation,
    isLoading,
    explainedText,
    fetchNovel,
    handleMouseUp,
    handleExplainClick,
    bookshelfOpend,
    setBookshelfOpend,
    isMobile,
    isExplanationSheetOpen,
    setIsExplanationSheetOpen,
    contentRef,
  } = useNovelReader({ explain });

  const explanationPanel = (
    <ExplanationPanel
      isLoading={isLoading}
      explanation={explanation}
      explainedText={explainedText}
    />
  );

  return (
    <div className="min-h-screen bg-background px-3 pt-[84px] pb-5 font-sans text-foreground transition-colors duration-300 sm:px-5">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        showHeader={showHeader}
        onOpenBookshelf={() => setBookshelfOpend(true)}
      />

      <BookshelfDrawer
        isOpen={bookshelfOpend}
        onClose={() => setBookshelfOpend(false)}
        onSelect={(id) => fetchNovel(id)}  // 選んだらfetch
      />

      <div className="relative grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,1fr)_28%]">
        <div className="relative" ref={contentRef}>
          <NovelContent
            handleMouseUp={handleMouseUp}
            isNovelLoaded={isNovelLoaded}
            novelText={novel.novelText}
            novelError={novelError}
          />

          <PopoverButton
            showButton={showButton}
            buttonPos={buttonPos}
            handleExplainClick={handleExplainClick}
          />
        </div>

        <Sidebar isNovelLoaded={isNovelLoaded} showHeader={showHeader} novel={novel}>
          {explanationPanel}
        </Sidebar>
      </div>

      {/* スマホ：解説は下から出るシートで表示 */}
      {isMobile && (
        <>
          <Button
            className="fixed right-4 bottom-4 z-40 rounded-full shadow-md"
            onClick={() => setIsExplanationSheetOpen(true)}
          >
            解説
          </Button>
          <Sheet open={isExplanationSheetOpen} onOpenChange={setIsExplanationSheetOpen}>
            <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>AI解説</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 pb-6">
                {explanationPanel}
                <NovelDetailsPanel novelLoaded={isNovelLoaded} novel={novel} />
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
