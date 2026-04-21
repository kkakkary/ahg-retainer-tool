import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfPreview({ pdfBase64 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!pdfBase64 || !containerRef.current) return;

    const binary = atob(pdfBase64);
    const uint8 = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i);

    const container = containerRef.current;
    container.innerHTML = '';

    pdfjsLib.getDocument({ data: uint8 }).promise.then(async (pdf) => {
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.display = 'block';
        canvas.style.marginBottom = '8px';
        canvas.style.borderRadius = '4px';
        container.appendChild(canvas);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      }
    });
  }, [pdfBase64]);

  if (!pdfBase64) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 text-gray-400 text-sm" style={{ minHeight: '400px' }}>
        Click "Preview" to see the document
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-100 rounded-xl border border-gray-200 shadow-sm p-4"
      style={{ maxHeight: 'calc(100vh - 9rem)' }}
    >
      <div ref={containerRef} />
    </div>
  );
}
