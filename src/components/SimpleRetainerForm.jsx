import React, { useState } from 'react';
import PdfPreview from './PdfPreview';

/**
 * Generic retainer form component.
 *
 * Props:
 *   title          — heading displayed inside the card
 *   fields         — array of field config objects:
 *                      { key, label, type, placeholder }
 *                    type values:
 *                      'text'     — standard text input
 *                      'currency' — dollar-prefix input
 *                      'textarea' — multi-line textarea
 *                      'plain'    — text input without $ prefix
 *   templateFile   — filename of the .docx template (e.g. 'ch11_retainer.docx')
 *   filenamePrefix — prefix used when saving (e.g. 'Griffin_Ch11Retainer')
 */
export default function SimpleRetainerForm({ title, fields, templateFile, filenamePrefix }) {
  const initialData = Object.fromEntries(fields.map((f) => [f.key, '']));
  const [formData, setFormData] = useState(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(null);

  function handleChange(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
      // Build payload: prepend $ to currency fields
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
        setStatusMessage(`Saved to ${result.filePath}`);
        setStatusType('success');
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

  // The generate button is disabled until Client_Name (or first field) is filled
  const clientNameField = fields.find((f) => f.key === 'Client_Name');
  const isDisabled = isGenerating || (clientNameField ? !formData.Client_Name.trim() : false);

  return (
    <div className="flex gap-6 items-start">
      <div className="w-[420px] flex-shrink-0 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
        <h2 className="text-base font-semibold text-amber-800">{title}</h2>

        {fields.map(({ key, label, type, placeholder }) => {
          if (type === 'currency') {
            return (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input
                    type="text"
                    value={formData[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder || ''}
                    className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            );
          }

          if (type === 'textarea') {
            return (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <textarea
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder || ''}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                />
              </div>
            );
          }

          // 'text' and 'plain' — both render a plain text input
          return (
            <div key={key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <input
                type="text"
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handlePreview}
          disabled={isPreviewing || isDisabled}
          className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isPreviewing ? 'Loading…' : 'Preview'}
        </button>
        <button
          onClick={handleGenerate}
          disabled={isDisabled}
          className="bg-amber-800 hover:bg-amber-900 disabled:bg-amber-400 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating…' : 'Generate Document'}
        </button>
        {statusMessage && (
          <span className={statusType === 'success' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
            {statusMessage}
          </span>
        )}
      </div>
      </div>
      <PdfPreview pdfBase64={previewPdf} />
    </div>
  );
}
