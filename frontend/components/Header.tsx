import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { AccessState } from '@/hooks/useAccess';
import type { LocalAIState } from '@/hooks/useLocalAI';

type HeaderProps = {
  theme: string;
  toggleTheme: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showHeader: boolean;
  onOpenBookshelf: () => void;
  access: AccessState;
  localAI: LocalAIState;
};

export const Header = ({
  theme,
  toggleTheme,
  isSettingsOpen,
  setIsSettingsOpen,
  showHeader,
  onOpenBookshelf,
  access,
  localAI,
}: HeaderProps) => {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[1001] flex h-16 items-center justify-between gap-2 border-b-2 border-border/30 bg-background px-3 sm:px-5 transition-[transform,opacity] duration-300 ease-in-out',
        showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
    >
      <h3 className="m-0 truncate text-base sm:text-lg">青空文庫 AI解説リーダー</h3>

      <div className="flex shrink-0 items-center gap-2">
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
              {localAI.status === 'available' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">端末内AIを使う</span>
                  <Switch checked={localAI.enabled} onCheckedChange={localAI.setEnabled} />
                </div>
              )}
              {access.hasSession && (
                <div className="flex flex-col gap-2 border-t pt-3">
                  <span className="text-xs text-muted-foreground">アクセスコード登録済み</span>
                  <Button variant="outline" size="sm" onClick={access.logout}>コードの登録を解除</Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" onClick={onOpenBookshelf}>
          本棚
        </Button>
      </div>
    </header>
  );
};