import React from 'react';
import { formatAozoraRuby } from '@/utils/aozoraParser';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type NovelContentProps = {
  handleMouseUp: () => void;
  isNovelLoaded: boolean;
  novelText: string;
  novelError: string;
};

export const NovelContent = ({
  handleMouseUp,
  isNovelLoaded,
  novelText,
  novelError,
}: NovelContentProps) => {
  return (
    <>
      <Card onMouseUp={handleMouseUp} className="min-h-[80vh]">
        <CardContent
          className={cn(
            'whitespace-pre-wrap text-lg leading-[2.4]',
            !isNovelLoaded && 'text-gray-500'
          )}
        >
          {formatAozoraRuby(novelText)}
        </CardContent>
      </Card>
      {novelError && <p className="font-bold text-red-500">{novelError}</p>}
    </>
  );
};