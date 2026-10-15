import React from 'react';
import { Button } from '@/components/ui/button';

type PopoverButtonProps = {
  showButton: boolean;
  buttonPos: { x: number; y: number };
  handleExplainClick: () => void;
  label?: string;
};

export const PopoverButton = ({
  showButton,
  buttonPos,
  handleExplainClick,
  label = 'AIに解説を依頼',
}: PopoverButtonProps) => {
  if (!showButton) return null;

  return (
    <Button
      onClick={handleExplainClick}
      // ボタンを押した瞬間に選択が解除されないようにする
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-[1000] -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 shadow-md"
      style={{ left: buttonPos.x, top: buttonPos.y }}
    >
      {label}
    </Button>
  );
};