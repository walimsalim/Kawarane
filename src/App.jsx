import React, { useState, useRef, useEffect } from 'react';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzæøå';

const FONT_OPTIONS = [
  'Georgia, serif',
  '"Times New Roman", Times, serif',
  '"Courier New", Courier, monospace',
  'Verdana, Geneva, sans-serif',
  'Arial, Helvetica, sans-serif',
  '"Trebuchet MS", "Lucida Grande", sans-serif',
  '"Palatino Linotype", "Book Antiqua", Palatino, serif',
  '"Lucida Console", Monaco, monospace',
  '"Garamond", "Times New Roman", serif',
  '"Tahoma", Geneva, sans-serif',
];

function getRandomFont() {
  return FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)];
}

function getRandomLetter(isUppercase) {
  const random = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return isUppercase ? random.toUpperCase() : random;
}

function App() {
  const [lines, setLines] = useState([{ text: '', font: getRandomFont() }]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#222222');
  const [bgColor, setBgColor] = useState('#f5f2e8');
  const [texture, setTexture] = useState('none');

  const editorRef = useRef(null);
  const writerRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);
    // Flytt caret til slutten etter hver endring i tekst / aktiv linje
    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      if (document.activeElement !== el) return;
  
      const selection = window.getSelection();
      if (!selection) return;
  
      const range = document.createRange();
      // Siste linje i editoren
      const lastLine = el.lastChild;
      if (!lastLine) return;
  
      range.selectNodeContents(lastLine);
      range.collapse(false); // til slutten
  
      selection.removeAllRanges();
      selection.addRange(range);
    }, [lines, currentLineIndex]);

  const handleKeyDown = (e) => {
    const key = e.key;

    // Backspace: vanlig sletting
    if (key === 'Backspace') {
      e.preventDefault();
      setLines((prev) => {
        const copy = [...prev];
        let idx = currentLineIndex;
        let line = copy[idx];

        if (line.text.length > 0) {
          copy[idx] = { ...line, text: line.text.slice(0, -1) };
          return copy;
        }

        // Slett tom linje og gå opp hvis mulig
        if (idx > 0) {
          const newLines = copy.slice(0, idx).concat(copy.slice(idx + 1));
          setCurrentLineIndex(idx - 1);
          return newLines;
        }

        return copy;
      });
      return;
    }

    // Enter: ny linje + ny font
    if (key === 'Enter') {
      e.preventDefault();
      setLines((prev) => {
        const newLines = [...prev];
        const insertIndex = currentLineIndex + 1;
        newLines.splice(insertIndex, 0, { text: '', font: getRandomFont() });
        setCurrentLineIndex(insertIndex);
        return newLines;
      });
      return;
    }

    // Tegn (enkelt‑tegn taster)
    const isSingleChar = key.length === 1;
    const lower = key.toLowerCase();

    // Hvis det er en bokstav i alfabetet vårt → tilfeldig bokstav
    if (isSingleChar && ALPHABET.includes(lower)) {
      e.preventDefault();
      const isUpper =
        key === key.toUpperCase() && key !== key.toLowerCase();

      const randomLetter = getRandomLetter(isUpper);

      setLines((prev) => {
        const copy = [...prev];
        const line = copy[currentLineIndex];
        copy[currentLineIndex] = {
          ...line,
          text: (line.text || '') + randomLetter,
        };
        return copy;
      });
      return;
    }

    // Hvis det er et annet synlig tegn (mellomrom, komma, punktum osv.)
    if (isSingleChar) {
      e.preventDefault();
      setLines((prev) => {
        const copy = [...prev];
        const line = copy[currentLineIndex];
        copy[currentLineIndex] = {
          ...line,
          text: (line.text || '') + key,
        };
        return copy;
      });
      return;
    }

    // Andre taster (piltaster osv.) lar vi bare gå gjennom.
    // Andre taster (piltaster osv.) lar vi bare gå gjennom.
  };

  const handleExportPdf = async () => {
    if (!writerRef.current) return;

    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(writerRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;
    const ratio = Math.min(
      pageWidth / imgWidthPx,
      pageHeight / imgHeightPx
    );

    const imgWidth = imgWidthPx * ratio;
    const imgHeight = imgHeightPx * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save('kawarane.pdf');
  };

  const textureClass = `writer-area texture-${texture}`;

  return (
    <div className="app">
<h1 className="title">Kawarane</h1>

      <div className="controls">
        <div className="control-group">
          <label>
            <span>Skriftstørrelse: {fontSize}px</span>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            <span>Tekstfarge</span>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            <span>Bakgrunnsfarge</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            <span>Bakgrunnstekstur</span>
            <select
              value={texture}
              onChange={(e) => setTexture(e.target.value)}
            >
              <option value="none">Ingen</option>
              <option value="paper">Papir</option>
              <option value="noise">Støy</option>
            </select>
          </label>
        </div>

        <button className="export-button" onClick={handleExportPdf}>
          Export PDF
        </button>
      </div>

      <div className="writer-container">
        <div
          ref={writerRef}
          className={textureClass}
          style={{
            backgroundColor: bgColor,
            color: textColor,
            fontSize: `${fontSize}px`,
          }}
        >
          <div
            ref={editorRef}
            className="writer-editable"
            contentEditable
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning
          >
            {lines.map((line, index) => (
              <div
                key={index}
                style={{
                  fontFamily: line.font,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {line.text === '' ? '\u00A0' : line.text}
              </div>
            ))}
          </div>
        </div>
        <div className="hint">
          Skriv i området over. Bokstaver blir dada-istiske, Enter gir ny font.
        </div>
      </div>
    </div>
  );
}

export default App;