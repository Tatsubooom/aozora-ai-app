'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PopoverButton } from '@/components/PopoverButton'
import { NovelContent } from '@/components/NovelContent';
import { useNovelReader } from '@/hooks/useNovelReader';
import { formatAozoraRuby } from '@/utils/aozoraParser';

export default function NovelReader() {
  //　各種状態取得
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
    handleExplainClick
  } = useNovelReader();

  
  return (
    //　背景設定
    <div style={{
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
      minHeight: '100vh',
      padding: '20px',
      paddingTop: '84px',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      
      <Header
        theme = {theme}
        toggleTheme = {toggleTheme}
        isSettingsOpen = {isSettingsOpen}
        setIsSettingsOpen = {setIsSettingsOpen}
        showHeader = {showHeader}
        fetchNovel = {fetchNovel}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '72% 28%',
        gap: '20px',
        position: 'relative',
        alignItems: 'flex-start',
      }}>
        
        <div style={{ position: 'relative' }}>
          
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
          novel = {novel}
        />
      </div>
    </div>
  );
}