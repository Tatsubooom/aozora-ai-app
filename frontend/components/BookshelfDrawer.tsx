'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// 後でAPIのレスポンス型に差し替える
type NovelSummary = {
  id: string;
  title: string;
  author: string;
  year: string;
};

// ダミーデータ(後でfetchの結果に差し替えるだけでOK)
const DUMMY_NOVELS: NovelSummary[] = [
  { id: '1', title: '鼻', author: '芥川龍之介', year: '1916' },
  { id: '2', title: '羅生門', author: '芥川龍之介', year: '1915' },
  { id: '3', title: '吾輩は猫である', author: '夏目漱石', year: '1905' },
  { id: '4', title: '坊っちゃん', author: '夏目漱石', year: '1906' },
  { id: '5', title: '銀河鉄道の夜', author: '宮沢賢治', year: '1934' },
];

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
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>本棚</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-2">
          {DUMMY_NOVELS.map((novel) => (
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
                {novel.author}　{novel.year}年
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};