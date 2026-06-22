import React, { useState } from 'react';

type SidebarProps = {
  isNovelLoaded: boolean;
  isLoading: boolean;
  explanation: string;
  explainedText: string;
  showHeader: boolean; // ヘッダーの開閉状態（高さの自動調整用）
  novel: {
    title: string;
    author: string;
    year: string;
    aozoraID: string; 
  };
};

// --- 書誌情報パネル ---
const NovelDetailsPanel = ({ 
  novelLoaded, 
  novel 
}: { 
  novelLoaded: boolean; 
  novel: { title: string; author: string; year: string; aozoraID: string; } 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{
      color: 'var(--foreground)',
      fontWeight: 'normal',
      padding: '20px',
      border: '1px solid rgba(128, 128, 128, 0.3)',
      borderRadius: '8px',
      backgroundColor: 'var(--background)',
      flexShrink: 0,
    }}>
      <h3 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          marginTop: 0, 
          borderBottom: isOpen ? '2px solid rgba(128, 128, 128, 0.3)' : 'none', 
          paddingBottom: isOpen ? '10px' : '0',
          marginBottom: isOpen ? '10px' : '0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        <span>書誌情報</span>
        <span style={{ fontSize: '14px', color: 'gray' }}>{isOpen ? '閉じる' : '開く'}</span>
      </h3>
      
      {isOpen && (
        novelLoaded ? (
          <div style={{ lineHeight: '1' }}>
            <p><strong>タイトル:</strong> {novel.title}</p>
            <p><strong>著者:</strong> {novel.author}</p>
            <p><strong>発行年:</strong> {novel.year}</p>
            <p><strong>青空文庫ID:</strong> {novel.aozoraID}</p>
          </div>
        ) : (
          <p style={{ color: 'gray', fontSize: '14px' }}>小説を読み込むと、ここに著者名や発行年などが表示されます。</p>
        )
      )}
    </div>
  );
};

// --- サイドバー本体 ---
export const Sidebar = ({
  isNovelLoaded,
  isLoading,
  explanation,
  explainedText,
  showHeader,
  novel
}: SidebarProps) => {
  return (
    <aside style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px',
      position: 'sticky',
      top: showHeader ? '84px' : '20px',
      transition: 'top 0.3s ease-in-out, height 0.3s ease-in-out',
      height: showHeader ? 'calc(100vh - 104px)' : 'calc(100vh - 40px)',
    }}>
      
      <NovelDetailsPanel novelLoaded={isNovelLoaded} novel = {novel}/>
      
      <div style={{
        color: 'var(--foreground)',
        padding: '20px',
        border: '1px solid rgba(128, 128, 128, 0.3)',
        borderRadius: '8px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <h3 style={{ marginTop: 0, borderBottom: '2px solid rgba(128, 128, 128, 0.3)', paddingBottom: '10px', flexShrink: 0 }}>AI解説</h3>
        
        <div style={{ marginTop: '20px', overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
          {isLoading && <p>解説を生成中...</p>}
          {explanation ? (
            <div style={{ 
              padding: '20px', 
              backgroundColor: 'rgba(0, 172, 193, 0.1)', 
              borderRadius: '8px', 
              borderLeft: '5px solid #00acc1', 
              color: 'var(--foreground)' 
            }}>
              <h4 style={{ marginTop: 0, color: '#00acc1' }}>解説：「{explainedText}」</h4>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{explanation}</p>
            </div>
          ) : (
            <p style={{ color: 'gray', fontSize: '14px', lineHeight: '1.6' }}>
              文章を選択してボタンを押すと、ここに解説が表示されます。
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};