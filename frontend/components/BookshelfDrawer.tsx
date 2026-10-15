'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import React from 'react';

// GET /api/novels のレスポンス
type NovelSummary = {
  id: string;
  title: string;
  author: string;
  year: string;
};

type NovelListResponse = {
  items: NovelSummary[];
  next_cursor: string;
};

type BookshelfDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void; // 小説を選んだ時に呼ぶ関数
};

export const BookshelfDrawer = ({
  isOpen,
  onClose,
  onSelect,
}: BookshelfDrawerProps) => {
  const [novels, setNovels] = React.useState<NovelSummary[]>([]);
  const [nextCursor, setNextCursor] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loadedOnce, setLoadedOnce] = React.useState(false);

  // cursor 無しなら先頭から、ありなら続きを追加で読み込む
  const load = React.useCallback(async (cursor = '') => {
    setLoading(true);
    setError('');
    try {
      const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/novels${params}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.items)) {
        throw new Error(data.error ?? '一覧の取得に失敗しました');
      }
      const page = data as NovelListResponse;
      setNovels((prev) => (cursor ? [...prev, ...page.items] : page.items));
      setNextCursor(page.next_cursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : '一覧の取得に失敗しました');
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:w-80"
        // 初めて開いた時だけ取得（Firestoreの読み取りを無駄にしない）
        onOpenAutoFocus={() => {
          if (!loadedOnce && !loading) load();
        }}
      >
        <SheetHeader>
          <SheetTitle>本棚</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4 pb-4">
          {novels.map((novel) => (
            <button
              key={novel.id}
              onClick={() => {
                onSelect(novel.id);
                onClose();
              }}
              className="w-full rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-accent"
            >
              <div className="font-medium">{novel.title}</div>
              <div className="text-sm text-muted-foreground">
                {novel.author}
              </div>
            </button>
          ))}

          {loading && <p className="text-sm text-muted-foreground">読み込み中...</p>}
          {error && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-red-500">{error}</p>
              <Button variant="outline" size="sm" onClick={() => load(novels.length ? nextCursor : '')}>
                再試行
              </Button>
            </div>
          )}
          {!loading && !error && loadedOnce && novels.length === 0 && (
            <p className="text-sm text-muted-foreground">作品がありません</p>
          )}
          {!loading && !error && nextCursor && (
            <Button variant="outline" size="sm" onClick={() => load(nextCursor)}>
              もっと見る
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
