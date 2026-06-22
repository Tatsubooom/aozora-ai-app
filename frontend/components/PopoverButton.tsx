// src/components/PopoverButton.tsx
import React from 'react';

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
    // 表示フラグがfalseの場合は何も描画しない（nullを返す）
    if (!showButton) return null;

    return (
        <button
            onClick={handleExplainClick}
            style={{
                position: 'absolute',
                left: `${buttonPos.x}px`,
                top: `${buttonPos.y}px`,
                transform: 'translateX(-50%)',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 1000,
                whiteSpace: 'nowrap',
            }}
        >
            AIに解説を依頼
        </button>
    );
};