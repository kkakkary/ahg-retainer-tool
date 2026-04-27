import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const SCALE_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];
const DEFAULT_SCALE = 1.0;

export default function PdfPreview({ pdfBase64 }) {
  const containerRef   = useRef(null);
  const scrollRef      = useRef(null);
  const pdfRef         = useRef(null);
  const textDataRef    = useRef([]);
  const highlightRef   = useRef([]);
  const [scale, setScale]         = useState(DEFAULT_SCALE);
  const [query, setQuery]         = useState('');
  const [matchInfo, setMatchInfo] = useState(null);
  const matchesRef     = useRef([]);
  const activeMatchRef = useRef(-1);
  const inputRef       = useRef(null);

  // ── Render PDF pages + collect text data ──────────────────────────────────
  async function renderPages(pdf, sc) {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    textDataRef.current = [];
    clearHighlights();
    setMatchInfo(null);
    matchesRef.current = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page     = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: sc });

      const wrapper = document.createElement('div');
      wrapper.style.position     = 'relative';
      wrapper.style.width        = viewport.width + 'px';
      wrapper.style.marginBottom = '8px';
      wrapper.style.borderRadius = '4px';
      wrapper.style.overflow     = 'hidden';
      wrapper.dataset.pageIndex  = String(i - 1);
      container.appendChild(wrapper);

      const canvas   = document.createElement('canvas');
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;
      canvas.style.display = 'block';
      canvas.style.width   = '100%';
      wrapper.appendChild(canvas);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

      const textContent = await page.getTextContent();
      const pageItems = [];
      for (const item of textContent.items) {
        if (!item.str) continue;
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        pageItems.push({
          str: item.str,
          x: tx[4],
          y: tx[5] - item.height * sc,
          w: item.width * sc,
          h: item.height * sc,
        });
      }
      textDataRef.current.push({ pageIndex: i - 1, items: pageItems });
    }
  }

  // Load PDF when base64 changes
  useEffect(() => {
    if (!pdfBase64) return;
    setQuery('');
    setMatchInfo(null);
    matchesRef.current = [];

    const binary = atob(pdfBase64);
    const uint8  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i);

    pdfjsLib.getDocument({ data: uint8 }).promise.then((pdf) => {
      pdfRef.current = pdf;
      renderPages(pdf, scale);
    });
  }, [pdfBase64]);

  // Re-render when scale changes (if PDF is already loaded)
  useEffect(() => {
    if (pdfRef.current) renderPages(pdfRef.current, scale);
  }, [scale]);

  // ── Search logic ──────────────────────────────────────────────────────────
  const clearHighlights = useCallback(() => {
    highlightRef.current.forEach(el => el.remove());
    highlightRef.current = [];
  }, []);

  const runSearch = useCallback((q, jumpTo = 0) => {
    clearHighlights();
    matchesRef.current = [];
    activeMatchRef.current = -1;

    if (!q || !containerRef.current) { setMatchInfo(null); return; }

    const lower = q.toLowerCase();
    const allMatches = [];

    for (const { pageIndex, items } of textDataRef.current) {
      let pageText = '';
      const itemOffsets = [];
      for (const item of items) {
        itemOffsets.push({ start: pageText.length, item });
        pageText += item.str;
      }
      const pageLower = pageText.toLowerCase();
      let idx = 0;
      while ((idx = pageLower.indexOf(lower, idx)) !== -1) {
        allMatches.push({ pageIndex, charStart: idx, charEnd: idx + lower.length, itemOffsets });
        idx++;
      }
    }

    matchesRef.current = allMatches;
    const total  = allMatches.length;
    const active = total > 0 ? (jumpTo % total + total) % total : -1;
    activeMatchRef.current = active;
    setMatchInfo(total > 0 ? { current: active + 1, total } : { current: 0, total: 0 });

    const wrappers = containerRef.current.querySelectorAll('[data-page-index]');
    allMatches.forEach((match, mi) => {
      const wrapper = wrappers[match.pageIndex];
      if (!wrapper) return;
      for (const { start, item } of match.itemOffsets) {
        const end = start + item.str.length;
        if (end <= match.charStart || start >= match.charEnd) continue;
        const hl = document.createElement('div');
        hl.style.position        = 'absolute';
        hl.style.left            = item.x + 'px';
        hl.style.top             = item.y + 'px';
        hl.style.width           = item.w + 'px';
        hl.style.height          = (item.h || 12) + 'px';
        hl.style.backgroundColor = mi === active ? 'rgba(255,140,0,0.5)' : 'rgba(255,255,0,0.4)';
        hl.style.pointerEvents   = 'none';
        hl.style.borderRadius    = '2px';
        wrapper.appendChild(hl);
        highlightRef.current.push(hl);
      }
    });

    if (active >= 0 && wrappers[allMatches[active].pageIndex]) {
      wrappers[allMatches[active].pageIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [clearHighlights]);

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (!val) { clearHighlights(); setMatchInfo(null); matchesRef.current = []; }
  }

  function navigate(dir) {
    const total = matchesRef.current.length;
    if (!total) return;
    const next = (activeMatchRef.current + dir + total) % total;
    runSearch(query, next);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter')  { e.preventDefault(); matchesRef.current.length ? navigate(e.shiftKey ? -1 : 1) : runSearch(query, 0); }
    if (e.key === 'Escape') { setQuery(''); clearHighlights(); setMatchInfo(null); matchesRef.current = []; }
  }

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && pdfBase64) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pdfBase64]);

  // ── Zoom helpers ──────────────────────────────────────────────────────────
  function zoomIn()  { setScale(s => SCALE_STEPS[Math.min(SCALE_STEPS.indexOf(s) + 1, SCALE_STEPS.length - 1)]); }
  function zoomOut() { setScale(s => SCALE_STEPS[Math.max(SCALE_STEPS.indexOf(s) - 1, 0)]); }

  if (!pdfBase64) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-sm" style={{ minHeight: '400px' }}>
        Click "Preview" to see the document
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden" style={{ maxHeight: 'calc(100vh - 9rem)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="Find in document… (⌘F)"
          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-slate-400"
        />
        {matchInfo !== null && (
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {matchInfo.total === 0 ? 'No results' : `${matchInfo.current} / ${matchInfo.total}`}
          </span>
        )}
        <button onClick={() => navigate(-1)} disabled={!matchInfo?.total} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 disabled:text-gray-300 dark:disabled:text-gray-600 text-sm px-1" aria-label="Previous match">↑</button>
        <button onClick={() => navigate(1)}  disabled={!matchInfo?.total} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 disabled:text-gray-300 dark:disabled:text-gray-600 text-sm px-1" aria-label="Next match">↓</button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button onClick={zoomOut} disabled={scale === SCALE_STEPS[0]}                  className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 disabled:text-gray-300 dark:disabled:text-gray-600 text-base font-bold px-1" aria-label="Zoom out">−</button>
        <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn}  disabled={scale === SCALE_STEPS[SCALE_STEPS.length - 1]} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 disabled:text-gray-300 dark:disabled:text-gray-600 text-base font-bold px-1" aria-label="Zoom in">+</button>
      </div>

      {/* PDF pages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <div ref={containerRef} />
      </div>
    </div>
  );
}
