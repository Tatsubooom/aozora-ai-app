import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type HeaderProps = {
  theme: string;
  toggleTheme: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showHeader: boolean;
  fetchNovel: (id: string) => void;
};

export const Header = ({
  theme,
  toggleTheme,
  isSettingsOpen,
  setIsSettingsOpen,
  showHeader,
  fetchNovel,
}: HeaderProps) => {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[1001] flex h-16 items-center justify-between border-b-2 border-border/30 bg-background px-5 transition-[transform,opacity] duration-300 ease-in-out',
        showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
    >
      <h3 className="m-0 text-lg">青空文庫 AI解説リーダー</h3>

      <div className="flex items-center gap-2">
        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">設定</Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-60">
            <div className="flex flex-col gap-5">
              <div className="border-b pb-2 text-sm font-bold">設定メニュー</div>
              <div className="flex items-center justify-between">
                <span className="text-sm">表示モード</span>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchNovel('059898')}   // アロー関数で固定IDを渡す
        >
          小説を読み込む
        </Button>
      </div>
    </header>
  );
};