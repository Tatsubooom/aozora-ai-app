import React from 'react';
import { Button } from '@/components/ui/button';

type PopoverButtonProps = {
  showButton: boolean;
  buttonPos: { x: number; y: number };
  handleExplainClick: () => void;
};

export const PopoverButton = ({
  showButton,
  buttonPos,
  handleExplainClick,
}: PopoverButtonProps) => {
  if (!showButton) return null;

  return (
    <Button
      onClick={handleExplainClick}
      className="absolute z-[1000] -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 shadow-md"
      style={{ left: buttonPos.x, top: buttonPos.y }}
    >
      AIに解説を依頼
    </Button>
  );
};