import React, { useState, useEffect, useRef } from 'react';
import PdfPreview from './PdfPreview';

function formatCurrency(val) {
  const stripped = String(val).replace(/[$,\s]/g, '');
  const num = parseFloat(stripped);
  if (!stripped || isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Spinner() {
  return <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}

const defaultFormData = {
  Client_Name: '',
  Attorney_Fee: '',
  Discounted_Fee: '',
};

export default function Ch7RetainerForm({ savedFormData, onFormChange, onGenerated }) {
  const [formData, setFormData] = useState(savedFormData || defaultFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(null);
  const [savedFilePath, setSavedFilePath] = useState(null);
  const firstInputRef = useRef(null);

  useEffect(() => { firstInputRef.current?.focus(); }, []);

  useEffect(() => {
    if (statusType === 'success') {
      const timer = setTimeout(() => { setStatusMessage(''); setStatusType(null); setSavedFilePath(null); }, 8000);
      return () => clearTimeout(timer);
    }
  }, [statusType]);

  function handleChange(field, value) {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (onFormChange) onFormChange(updated);
  }

  function handleClear() {
    if (!window.confirm('Clear all fields?')) return;
    setFormData(defaultFormData);
    if (onFormChange) onFormChange(defaultFormData);
    setStatusMessage(''); setStatusType(null); setSavedFilePath(null); setPreviewPdf(null);
  }

  async function handlePreview() {
    setIsPreviewing(true);
    try {
      const payload = {
        ...formData,
        Attorney_Fee: formData.Attorney_Fee ? `$${formData.Attorney_Fee}` : '',
        Discounted_Fee: formData.Discounted_Fee ? `$${formData.Discounted_Fee}` : '',
      };
      const result = await window.electronAPI.generatePreview({ formData: payload, templateFile: 'ch7_retainer.docx' });
      if (result.pdfBase64) setPreviewPdf(result.pdfBase64);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setStatusMessage('');
    setStatusType(null);
    try {
      const payload = {
        ...formData,
        Attorney_Fee: formData.Attorney_Fee ? `$${formData.Attorney_Fee}` : '',
        Discounted_Fee: formData.Discounted_Fee ? `$${formData.Discounted_Fee}` : '',
      };
      const result = await window.electronAPI.generateDocument({
        formData: payload,
        templateFile: 'ch7_retainer.docx',
        filenamePrefix: 'Griffin_Ch7Retainer',
      });
      if (result.success) {
        setStatusMessage('Document saved successfully.');
        setStatusType('success');
        setSavedFilePath(result.filePath);
        if (onGenerated) onGenerated();
      } else {
        setStatusMessage(result.error || 'Save cancelled.');
        setStatusType('error');
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
      setStatusType('error');
    } finally {
      setIsGenerating(false);
    }
  }

  const isDisabled = isGenerating || !formData.Client_Name.trim();

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isDisabled) {
      e.preventDefault();
      handleGenerate();
    }
  }

  return (
    <div className="flex gap-6 items-start" onKeyDown={handleKeyDown}>
      <div className="w-[420px] flex-shrink-0 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
        <h2 className="text-base font-semibold text-slate-800">Chapter 7 Retainer Agreement</h2>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
          <input
            ref={firstInputRef}
            type="text"
            value={formData.Client_Name}
            onChange={(e) => handleChange('Client_Name', e.target.value)}
            placeholder="e.g. Jane Doe"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Attorney Fee</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              value={formData.Attorney_Fee}
              onChange={(e) => handleChange('Attorney_Fee', e.target.value)}
              onBlur={(e) => handleChange('Attorney_Fee', formatCurrency(e.target.value))}
              placeholder="e.g. 2,433.00"
              className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Discounted Fee</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              value={formData.Discounted_Fee}
              onChange={(e) => handleChange('Discounted_Fee', e.target.value)}
              onBlur={(e) => handleChange('Discounted_Fee', formatCurrency(e.target.value))}
              placeholder="e.g. 2,333.00"
              className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handlePreview}
          disabled={isPreviewing || isDisabled}
          className="bg-white hover:bg-stone-100 disabled:bg-stone-100 text-slate-700 disabled:text-slate-400 font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 border border-slate-300"
        >
          {isPreviewing ? <><Spinner /> Preview</> : 'Preview'}
        </button>
        <button
          onClick={handleGenerate}
          disabled={isDisabled}
          className="bg-blue-800 hover:bg-blue-900 disabled:bg-slate-400 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {isGenerating ? <><Spinner /> Generating…</> : 'Generate Document'}
        </button>
        <button
          onClick={handleClear}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
        >
          Clear
        </button>
        {statusMessage && (
          <span className={`text-sm transition-opacity duration-300 ${statusType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {statusMessage}
          </span>
        )}
        {savedFilePath && statusType === 'success' && (
          <button
            onClick={() => window.electronAPI.showInFolder(savedFilePath)}
            className="text-sm text-slate-600 hover:text-slate-800 underline cursor-pointer"
          >
            Show in Finder
          </button>
        )}
      </div>
      </div>
      <PdfPreview pdfBase64={previewPdf} />
    </div>
  );
}
