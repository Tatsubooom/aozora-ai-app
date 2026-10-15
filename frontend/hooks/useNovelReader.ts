import { useState, useEffect, useCallback, useRef } from 'react';
import { sanitizeAozoraText } from '@/utils/aozoraParser';

type UseNovelReaderOptions = {
  // 選択語と文脈から解説文を返す（端末内AI / クラウドAI の振り分けは useExplainer）
  explain: (text: string, context: string) => Promise<string>;
};

export const useNovelReader = ({ explain }: UseNovelReaderOptions) => {
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
  const [bookshelfOpend, setBookshelfOpend] = useState(false);

  // 解説ボタン及び解説・回答テキスト状態
  const [selectedText, setSelectedText] = useState('');
  const [contextText, setContextText] = useState('');
  const [explainedText, setExplainedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // スマホ表示（解説は下から出るシートで表示）
  const [isMobile, setIsMobile] = useState(false);
  const [isExplanationSheetOpen, setIsExplanationSheetOpen] = useState(false);

  // 解説ボタンの座標の基準になる、本文エリアのコンテナ
  const contentRef = useRef<HTMLDivElement>(null);

  // テーマ切換
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 画面幅の監視（md未満をスマホ扱い）
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
  const fetchNovel = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/novel/${id}`);
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
        setCleanFullText(sanitizeAozoraText(data.rawtext));
        setExplanation('');
        setShowButton(false);
        window.scrollTo({ top: 0 });
      } else {
        setNovelError('エラー: ' + data.error);
      }
    } catch {
      setNovelError('通信失敗');
    }
  };

  // 文字選択時の処理（PCはmouseup、スマホはselectionchangeから呼ぶ）
  const handleSelection = useCallback(() => {
    if (!isNovelLoaded) return;
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setShowButton(false);
      return;
    }

    const text = selection.toString().trim();
    const container = contentRef.current;
    if (text.length === 0 || !container || !container.contains(selection.anchorNode)) {
      setShowButton(false);
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const base = container.getBoundingClientRect();
    const touch = window.matchMedia('(pointer: coarse)').matches;
    setButtonPos({
      x: rect.left + rect.width / 2 - base.left,
      // スマホは選択範囲の上にOSのメニューが出るので、ボタンは下に出す
      y: touch ? rect.bottom - base.top + 12 : rect.top - base.top - 50,
    });
    setSelectedText(text);

    // 選択された文字が、小説全体のどの位置にあるかを検索
    const searchIndex = cleanFullText.indexOf(text);
    const absoluteIndex = searchIndex !== -1 ? searchIndex : 0;

    const start = Math.max(0, absoluteIndex - 200);
    const end = Math.min(cleanFullText.length, absoluteIndex + text.length + 200);
    setContextText(cleanFullText.substring(start, end));

    setShowButton(true);
  }, [isNovelLoaded, cleanFullText]);

  // スマホは長押し選択でmouseupが来ないので、選択の変化を少し待ってから拾う
  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(handleSelection, 400);
    };
    document.addEventListener('selectionchange', onChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('selectionchange', onChange);
    };
  }, [handleSelection]);

  // AI解説API呼び出し
  const handleExplainClick = async () => {
    setShowButton(false);
    setIsLoading(true);
    setExplanation('');
    setExplainedText(selectedText);
    if (isMobile) setIsExplanationSheetOpen(true);
    try {
      setExplanation(await explain(selectedText, contextText));
    } catch (e) {
      setExplanation('エラー: ' + (e instanceof Error ? e.message : 'AI通信エラー'));
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
    bookshelfOpend,
    setBookshelfOpend,
    isMobile,
    isExplanationSheetOpen,
    setIsExplanationSheetOpen,
    contentRef,

    // Function
    fetchNovel,
    handleMouseUp: handleSelection,
    handleExplainClick,
  };
};
