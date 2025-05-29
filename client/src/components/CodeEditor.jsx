import { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Box } from '@mui/material';

const languages = [
  { label: 'Python', value: 'python', version: '3.10.0' },
  { label: 'JavaScript', value: 'javascript', version: '16.3.0' },
  { label: 'Java', value: 'java', version: '15.0.2' },
  { label: 'C++', value: 'cpp', version: '10.2.0' },
  { label: 'C', value: 'c', version: '10.2.0' },
  { label: 'Go', value: 'go', version: '1.16.2' },
  { label: 'Ruby', value: 'ruby', version: '3.0.0' },
  { label: 'PHP', value: 'php', version: '8.0.0' },
  { label: 'Rust', value: 'rust', version: '1.52.1' },
  { label: 'TypeScript', value: 'typescript', version: '4.2.3' },
  { label: 'Kotlin', value: 'kotlin', version: '1.4.21' },
  { label: 'Swift', value: 'swift', version: '5.3.3' },
  { label: 'Scala', value: 'scala', version: '2.13.4' },
  { label: 'Perl', value: 'perl', version: '5.32.0' },
  { label: 'R', value: 'r', version: '4.0.4' },
];

const defaultCode = {
  python: `print("Hello, world!")`,
  javascript: `console.log("Hello, world!");`,
  java: `public class Main { public static void main(String[] args) { System.out.println("Hello, world!"); } }`,
  cpp: `#include <iostream>\nint main() { std::cout << "Hello, world!"; return 0; }`,
  c: `#include <stdio.h>\nint main() { printf("Hello, world!\\n"); return 0; }`,
  go: `package main\nimport "fmt"\nfunc main() { fmt.Println("Hello, world!") }`,
  ruby: `puts "Hello, world!"`,
  php: `<?php echo "Hello, world!"; ?>`,
  rust: `fn main() { println!("Hello, world!"); }`,
  typescript: `console.log("Hello, world!");`,
  kotlin: `fun main() { println("Hello, world!") }`,
  swift: `print("Hello, world!")`,
  scala: `object Main extends App { println("Hello, world!") }`,
  perl: `print "Hello, world!\\n";`,
  r: `cat('Hello, world!\\n')`,
};

const apiBaseUrl = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:8080';

export default function CodeEditor({ sessionId }) {
  const [selectedLang, setSelectedLang] = useState(languages[0].value);
  const [code, setCode] = useState(defaultCode[languages[0].value]);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editorHeight, setEditorHeight] = useState(400); // px
  const [isDragging, setIsDragging] = useState(false);
  const resizerRef = useRef(null);
  const containerRef = useRef(null);

  // Load language and code from localStorage on mount or sessionId change
  useEffect(() => {
    if (!sessionId) return;
    const savedLang = localStorage.getItem(`lang-${sessionId}`);
    const lang = savedLang || languages[0].value;
    setSelectedLang(lang);
    const savedCode = localStorage.getItem(`code-${sessionId}-${lang}`);
    setCode(savedCode || defaultCode[lang]);
  }, [sessionId]);

  // Save language to localStorage when changed
  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(`lang-${sessionId}`, selectedLang);
  }, [selectedLang, sessionId]);

  // Save code to localStorage when changed
  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(`code-${sessionId}-${selectedLang}`, code);
  }, [code, selectedLang, sessionId]);

  // Drag logic
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newHeight = e.clientY - containerRect.top - 48; // 48px for selector/buttons
      newHeight = Math.max(120, Math.min(600, newHeight));
      setEditorHeight(newHeight);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const startDrag = () => {
    setIsDragging(true);
  };

  const handleLangChange = (e) => {
    const lang = e.target.value;
    setSelectedLang(lang);
    const savedCode = localStorage.getItem(`code-${sessionId}-${lang}`);
    setCode(savedCode || defaultCode[lang]);
    setOutput('');
  };

  const runCode = async () => {
    setLoading(true);
    setOutput('');
    setError('');
    const langObj = languages.find(l => l.value === selectedLang);
    try {
      const res = await fetch(`${apiBaseUrl}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          version: langObj?.version,
          files: [{ content: code }],
        }),
      });
      if (!res.ok) throw new Error('Network error: ' + res.status);
      const data = await res.json();
      if (data.run && data.run.output !== undefined) {
        setOutput(data.run.output);
      } else if (data.output) {
        setOutput(data.output);
      } else if (data.error) {
        setOutput('Error: ' + data.error);
      } else {
        setOutput('Unknown response: ' + JSON.stringify(data));
      }
    } catch (err) {
      setError('Failed to execute code. Please try again. (' + err.message + ')');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 bg-[#18122B] rounded-tl-3xl p-2 sm:p-4 flex flex-col h-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2 relative">
        <select
          value={selectedLang}
          onChange={handleLangChange}
          className="bg-[#28204a] text-xs px-2 py-1 rounded font-mono text-[#BFAAFF] border border-[#393053] min-w-[100px]"
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-h-[120px] flex flex-col relative">
        <MonacoEditor
          height={editorHeight + 'px'}
          width="100%"
          language={selectedLang === 'cpp' ? 'cpp' : selectedLang}
          value={code}
          theme="vs-dark"
          onChange={value => setCode(value)}
          options={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollbar: { vertical: 'auto', horizontal: 'auto' },
            overviewRulerLanes: 0,
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
          }}
        />
        {/* Resizer bar */}
        <div
          ref={resizerRef}
          onMouseDown={startDrag}
          style={{ cursor: 'row-resize', height: 10 }}
          className="w-full bg-[#28204a] hover:bg-[#393053] transition border-t border-[#393053] flex items-center justify-center select-none"
        >
          <div className="w-12 h-1.5 bg-[#BFAAFF] rounded-full opacity-70" />
        </div>
      </div>
      <button
        className="mt-4 self-start bg-[#BFAAFF] text-white px-4 py-2 rounded-lg shadow-md hover:bg-[#9F91CC] transition font-bold text-sm flex items-center gap-2 min-w-[120px]"
        onClick={runCode}
        disabled={loading}
      >
        {loading && <span className="loader border-2 border-t-2 border-t-white border-white/30 rounded-full w-4 h-4 animate-spin"></span>}
        {loading ? 'Running...' : 'Run Code'}
      </button>
      {error && (
        <div className="mt-2 text-red-400 bg-red-900/40 border border-red-700 rounded px-3 py-2 text-xs font-mono">
          {error}
        </div>
      )}
      <Box
        mt={3}
        width="100%"
        bgcolor="#28204a"
        borderRadius={2}
        p={2}
        fontFamily="JetBrains Mono, monospace"
        fontSize={14}
        color="#BFAAFF"
        boxShadow={3}
        minHeight={90}
        maxHeight={160}
        sx={{ overflowY: 'auto', marginTop: '24px', border: '1px solid #393053' }}
      >
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'inherit' }}>
          {output || ''}
        </div>
      </Box>
      <style>{`.loader { border-right-color: transparent !important; }`}</style>
    </div>
  );
} 