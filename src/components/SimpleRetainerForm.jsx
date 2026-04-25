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

export default function SimpleRetainerForm({ title, fields, templateFile, filenamePrefix, savedFormData, onFormChange, onGenerated }) {
  const initialData = Object.fromEntries(fields.map((f) => [f.key, '']));
  const [localFormData, setLocalFormData] = useState(savedFormData || initialData);
  const formData = localFormData;
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(null);
  const [savedFilePath, setSavedFilePath] = useState(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (statusType === 'success') {
      const timer = setTimeout(() => {
        setStatusMessage('');
        setStatusType(null);
        setSavedFilePath(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [statusType]);

  function handleChange(key, value) {
    const updated = { ...formData, [key]: value };
    setLocalFormData(updated);
    if (onFormChange) onFormChange(updated);
  }

  function handleClear() {
    if (!window.confirm('Clear all fields?')) return;
    setLocalFormData(initialData);
    if (onFormChange) onFormChange(initialData);
    setStatusMessage('');
    setStatusType(null);
    setSavedFilePath(null);
    setPreviewPdf(null);
  }

  async function handlePreview() {
    setIsPreviewing(true);
    try {
      const payload = {};
      for (const { key, type } of fields) {
        const val = formData[key];
        payload[key] = type === 'currency' ? (val ? `$${val}` : '') : val;
      }
      const result = await window.electronAPI.generatePreview({ formData: payload, templateFile });
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
      const payload = {};
      for (const { key, type } of fields) {
        const val = formData[key];
        if (type === 'currency') {
          payload[key] = val ? `$${val}` : '';
        } else {
          payload[key] = val;
        }
      }

      const result = await window.electronAPI.generateDocument({
        formData: payload,
        templateFile,
        filenamePrefix,
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

  const clientNameField = fields.find((f) => f.key === 'Client_Name');
  const isDisabled = isGenerating || (clientNameField ? !formData.Client_Name.trim() : false);

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
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>

        {fields.map(({ key, label, type, placeholder }, idx) => {
          const isRequired = key === 'Client_Name';
          if (type === 'currency') {
            return (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {label}{isRequired && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input
                    ref={idx === 0 ? firstInputRef : undefined}
                    type="text"
                    value={formData[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    onBlur={(e) => handleChange(key, formatCurrency(e.target.value))}
                    placeholder={placeholder || ''}
                    className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>
            );
          }

          if (type === 'textarea') {
            return (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {label}{isRequired && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <textarea
                  ref={idx === 0 ? firstInputRef : undefined}
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder || ''}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y"
                />
              </div>
            );
          }

          return (
            <div key={key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {label}{isRequired && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                ref={idx === 0 ? firstInputRef : undefined}
                type="text"
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          );
        })}
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
