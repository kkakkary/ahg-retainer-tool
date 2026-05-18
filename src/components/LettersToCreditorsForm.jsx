import React, { useState, useRef, useEffect } from 'react';
import PdfPreview from './PdfPreview';
import ButtonBar from './ButtonBar';
import { inputClass, labelClass, cardClass, headingClass } from '../styles/formClasses';

const EMPTY_CREDITOR = { name: '', address1: '', address2: '', accounts: '' };

export default function LettersToCreditorsForm({ savedFormData, onFormChange, onGenerated }) {
  const initialState = {
    clientNames: '',
    nameType: 'client',
    creditors: [{ ...EMPTY_CREDITOR }],
  };

  const [formData, setFormData] = useState(savedFormData || initialState);
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

  function update(updated) {
    setFormData(updated);
    if (onFormChange) onFormChange(updated);
  }

  function handleNameTypeChange(type) {
    update({ ...formData, nameType: type });
  }

  function handleCreditorChange(idx, field, value) {
    const updated = formData.creditors.map((c, i) => (i === idx ? { ...c, [field]: value } : c));
    update({ ...formData, creditors: updated });
  }

  function addCreditor() {
    update({ ...formData, creditors: [...formData.creditors, { ...EMPTY_CREDITOR }] });
  }

  function removeCreditor(idx) {
    if (formData.creditors.length <= 1) return;
    update({ ...formData, creditors: formData.creditors.filter((_, i) => i !== idx) });
  }

  function buildPayload() {
    return {
      clientNames: formData.clientNames,
      isBusinessName: formData.nameType === 'business',
      creditors: formData.creditors,
    };
  }

  async function handlePreview() {
    setIsPreviewing(true);
    try {
      const result = await window.electronAPI.previewLettersToCreditors(buildPayload());
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
      const result = await window.electronAPI.generateLettersToCreditors({
        ...buildPayload(),
        filenamePrefix: 'Griffin_LettersToCreditors',
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

  function handleClear() {
    if (!window.confirm('Clear all fields?')) return;
    const empty = { ...initialState, creditors: [{ ...EMPTY_CREDITOR }] };
    setFormData(empty);
    setStatusMessage('');
    setStatusType(null);
    setSavedFilePath(null);
    setPreviewPdf(null);
    if (onFormChange) onFormChange(empty);
  }

  const hasCreditor = formData.creditors.some((c) => c.name.trim());
  const isDisabled = isGenerating || !formData.clientNames.trim() || !hasCreditor;

  const nameLabel = formData.nameType === 'business' ? 'Business Name(s)' : 'Client Name(s)';
  const namePlaceholder = formData.nameType === 'business' ? 'e.g. Acme LLC' : 'e.g. John Doe and Jane Doe';

  return (
    <div className="flex gap-6 items-start">
      <div className="w-[460px] flex-shrink-0 space-y-6">
        <div className={`${cardClass} p-8 space-y-6`}>
          <h2 className={headingClass}>Letters to Creditors</h2>

          {/* Client / Business name */}
          <div className="space-y-1">
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 w-fit mb-2">
              {['client', 'business'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleNameTypeChange(type)}
                  className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer capitalize ${
                    formData.nameType === type
                      ? 'bg-slate-700 text-white dark:bg-slate-500'
                      : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {type === 'client' ? 'Client' : 'Business'}
                </button>
              ))}
            </div>
            <label className={labelClass}>
              {nameLabel} <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              value={formData.clientNames}
              onChange={(e) => update({ ...formData, clientNames: e.target.value })}
              placeholder={namePlaceholder}
              className={inputClass}
            />
          </div>

          {/* Creditors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className={`${labelClass} mb-0`}>
                Creditors <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addCreditor}
                className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded px-2 py-1 cursor-pointer transition-colors"
              >
                + Add Creditor
              </button>
            </div>

            {formData.creditors.map((creditor, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800/60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Creditor {idx + 1}
                  </span>
                  {formData.creditors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCreditor(idx)}
                      className="text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>
                    Creditor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={creditor.name}
                    onChange={(e) => handleCreditorChange(idx, 'name', e.target.value)}
                    placeholder="e.g. Capital One"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Street / Mailing Address</label>
                  <input
                    type="text"
                    value={creditor.address1}
                    onChange={(e) => handleCreditorChange(idx, 'address1', e.target.value)}
                    placeholder="e.g. P.O. Box 30285"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>City, State, ZIP</label>
                  <input
                    type="text"
                    value={creditor.address2}
                    onChange={(e) => handleCreditorChange(idx, 'address2', e.target.value)}
                    placeholder="e.g. Salt Lake City, UT 84130"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Account(s) ending in</label>
                  <input
                    type="text"
                    value={creditor.accounts}
                    onChange={(e) => handleCreditorChange(idx, 'accounts', e.target.value)}
                    placeholder="e.g. -1315 or -1311, 7586, -9112"
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <ButtonBar
          onPreview={handlePreview}
          onGenerate={handleGenerate}
          onClear={handleClear}
          isPreviewing={isPreviewing}
          isGenerating={isGenerating}
          isDisabled={isDisabled}
          statusMessage={statusMessage}
          statusType={statusType}
          savedFilePath={savedFilePath}
        />
      </div>

      <PdfPreview pdfBase64={previewPdf} />
    </div>
  );
}
