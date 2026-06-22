import { useState, useEffect } from 'react';
import { sanitizeAozoraText } from '@/utils/aozoraParser';

export const useNovelReader = () => {
  // テーマ
  const [theme, setTheme] = useState('dark');
  
  // settingsの状態
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // ヘッダーのカーソル接触判定
  const [isAtTop, setIsAtTop] = useState(true);
  const [isHoveringTop, setIsHoveringTop] = useState(false);

  // 小説本文表示部の状態
  const [novel, setNovel] = useState({
    novelText : 'ここに小説が表示されます',
    title : '',
    author : '',
    year : '',
    aozoraID : '',
  });

  const [isNovelLoaded, setIsNovelLoaded] = useState(false);
  const [novelError, setNovelError] = useState('');
  const [cleanFullText, setCleanFullText] = useState('')

  // 解説ボタン及び解説・回答テキスト状態
  const [selectedText, setSelectedText] = useState('');
  const [contextText, setContextText] = useState('');
  const [explainedText, setExplainedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // テーマ切換
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // カーソルの位置・スクロールの監視
  useEffect(() => {
    const handleScroll = () => setIsAtTop(window.scrollY < 50);
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 15) setIsHoveringTop(true);
      else if (e.clientY > 74) setIsHoveringTop(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const showHeader = isAtTop || isHoveringTop;

  // 本文取得
  const fetchNovel = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/novel`);
      const data = await res.json();
      if (res.ok) {
        setNovel({
          novelText : data.rawtext,
          title: data.title,
          author: data.author,
          year: data.year,
          aozoraID: data.aozora_id,
        });
        setIsNovelLoaded(true);
        setNovelError('');
        setCleanFullText(sanitizeAozoraText(novel.novelText))
        //console.log(cleanFullText)
      } else {
        setNovelError('エラー: ' + data.error);
      }
    } catch (error) {
      setNovelError('通信失敗');
    }
  };

  // 文字選択時の処理
  const handleMouseUp = () => {
    if (!isNovelLoaded) return;
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setShowButton(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setButtonPos({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 50,
      });
      setSelectedText(text);
      
      // 選択された文字が、小説全体のどの位置にあるかを検索
      const searchIndex = cleanFullText.indexOf(text);
      const absoluteIndex = searchIndex !== -1 ? searchIndex : 0;
      
      const start = Math.max(0, absoluteIndex - 200);
      const end = Math.min(cleanFullText.length, absoluteIndex + text.length + 200);
      
      const extractedContext = cleanFullText.substring(start, end);
      setContextText(extractedContext);
      // ------------------------------------------------------------------

      setShowButton(true);
    } else {
      setShowButton(false);
    }
  };

  // AI解説API呼び出し
  const handleExplainClick = async () => {
    setShowButton(false);
    setIsLoading(true);
    setExplanation('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/explanation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: selectedText,
          context: contextText 
        }),
      });

      //console.log("文脈 : " + contextText)
      //console.log("質問文公正前 : " + selectedText)
      //console.log("AIに送る質問文 : " + sanitizeAozoraText(selectedText))
      setExplainedText(selectedText);
      const data = await res.json();
      if (res.ok) setExplanation(data.message);
      else setExplanation('エラー: ' + data.error);
    } catch (error) {
      setExplanation('AI通信エラー');
    } finally {
      setIsLoading(false);
    }
    };

    return {
    // State
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

    // Function
    fetchNovel,
    handleMouseUp,
    handleExplainClick,
  };
  };