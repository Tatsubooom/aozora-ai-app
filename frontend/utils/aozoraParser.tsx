// 1. 青空文庫のルビ（｜文字《ルビ》）消し去り、純粋なテキストにする関数
export const sanitizeAozoraText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/《[^》]+》/g, '') // 《 》と、その中身をすべて削除
    .replace(/｜/g, '');       // ルビの開始位置を示す ｜ を削除
};

// 2. 青空文庫のルビ記法をReactの<ruby>タグに変換する関数
export const formatAozoraRuby = (text: string) => {
  if (!text) return null;
  const regex = /(｜[^《]+《[^》]+》|[一-龠々]+《[^》]+》)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('｜')) {
      const match = part.match(/｜([^《]+)《([^》]+)》/);
      if (match) {
        return (
          <ruby key={index}>
            {match[1]}
            <rt style={{ userSelect: 'none', color: 'gray' }}>{match[2]}</rt>
          </ruby>
        );
      }
    } else if (part.includes('《')) {
      const match = part.match(/([一-龠々]+)《([^》]+)》/);
      if (match) {
        return (
          <ruby key={index}>
            {match[1]}
            <rt style={{ userSelect: 'none', color: 'gray' }}>{match[2]}</rt>
          </ruby>
        );
      }
    }
    return <span key={index}>{part}</span>;
  });
};