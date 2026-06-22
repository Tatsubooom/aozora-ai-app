import React from 'react';
import { formatAozoraRuby } from '@/utils/aozoraParser';

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
            <div 
                onMouseUp={handleMouseUp} 
                style={{ 
                    color: isNovelLoaded ? 'inherit' : 'gray', 
                    fontWeight: 'normal', 
                    whiteSpace: 'pre-wrap', 
                    lineHeight: '2.4', 
                    padding: '20px', 
                    border: '1px solid rgba(128, 128, 128, 0.3)',
                    borderRadius: '8px',
                    minHeight: '80vh',
                    boxSizing: 'border-box',
                    fontSize: '18px',
                }}
            >
                {formatAozoraRuby(novelText)}
            </div>
            {novelError && <p style={{ color: 'red', fontWeight: 'bold' }}>{novelError}</p>}
        </>
    );
};