import React from 'react';

// 親から受け取るデータの型定義
type HeaderProps = {
  theme: string;
  toggleTheme: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showHeader: boolean;
  fetchNovel: () => void;
};

export const Header = ({
  theme,
  toggleTheme,
  isSettingsOpen,
  setIsSettingsOpen,
  showHeader,
  fetchNovel
}: HeaderProps) => {
    return (
        <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, height: '64px',
        backgroundColor: 'var(--background)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid rgba(128, 128, 128, 0.3)',
        padding: '0 20px',
        zIndex: 1001,
        transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out, opacity 0.3s, background-color 0.3s',
        opacity: showHeader ? 1 : 0,
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>青空文庫 AI解説リーダー</h3>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '4px',
                border: '1px solid rgba(128, 128, 128, 0.5)',
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
                position: 'relative',
                zIndex: 2
              }}
            >
              設定
            </button>

            {isSettingsOpen && (
              <div 
                onMouseLeave={() => setIsSettingsOpen(false)}
                style={{
                  position: 'absolute',
                  top: '-40px', right: '-40px', padding: '30px', zIndex: 2002,
                }}
              >
                <div style={{
                  backgroundColor: 'var(--background)',
                  padding: '20px',
                  borderRadius: '8px',
                  minWidth: '240px',
                  border: '1px solid rgba(128, 128, 128, 0.3)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid rgba(128, 128, 128, 0.3)', paddingBottom: '8px' }}>
                      設定メニュー
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px' }}>表示モード</span>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={theme === 'dark'}
                          onChange={toggleTheme}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={fetchNovel} 
            style={{ 
              padding: '8px 16px', 
              fontSize: '14px', 
              cursor: 'pointer', 
              borderRadius: '4px',
              border: '1px solid rgba(128, 128, 128, 0.5)',
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
            }}
          >
            小説を読み込む
          </button>
        </div>
      </header>
    );
};