'use client';

import React from 'react';
import { Sidebar, NovelDetailsPanel } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PopoverButton } from '@/components/PopoverButton';
import { NovelContent } from '@/components/NovelContent';
import { ExplanationPanel } from '@/components/ExplanationPanel';
import { useNovelReader } from '@/hooks/useNovelReader';
import { useAccess } from '@/hooks/useAccess';
import { useLocalAI } from '@/hooks/useLocalAI';
import { useExplainer } from '@/hooks/useExplainer';
import { BookshelfDrawer } from '@/components/BookshelfDrawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export default function NovelReader() {
  const access = useAccess();
  const localAI = useLocalAI();
  const explainer = useExplainer(access, localAI);
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
  } = useNovelReader({ explain: explainer.explain });

  // 解説手段が無ければAPIを呼ばず、アクセスコード入力 / 端末内AIの準備を案内する
  const onExplain = () => {
    if (explainer.canExplain) return handleExplainClick();
    if (isMobile) setIsExplanationSheetOpen(true);
  };
  const explainLabel = explainer.canExplain ? 'AIに解説を依頼' : 'アクセスコードが必要です';

  const explanationPanel = (
    <ExplanationPanel
      access={access}
      localAI={localAI}
      explainer={explainer}
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
        access={access}
        localAI={localAI}
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
            handleExplainClick={onExplain}
            label={explainLabel}
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
