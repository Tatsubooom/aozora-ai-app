'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PopoverButton } from '@/components/PopoverButton';
import { NovelContent } from '@/components/NovelContent';
import { useNovelReader } from '@/hooks/useNovelReader';

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
  } = useNovelReader();

  return (
    <div className="min-h-screen bg-background pt-[84px] p-5 font-sans text-foreground transition-colors duration-300">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        showHeader={showHeader}
        fetchNovel={fetchNovel}
      />

      <div className="relative grid grid-cols-[72%_28%] items-start gap-5">
        <div className="relative">
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

        <Sidebar
          isNovelLoaded={isNovelLoaded}
          isLoading={isLoading}
          explanation={explanation}
          explainedText={explainedText}
          showHeader={showHeader}
          novel={novel}
        />
      </div>
    </div>
  );
}