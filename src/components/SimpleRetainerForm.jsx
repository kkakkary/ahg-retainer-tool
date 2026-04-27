import React, { useState } from 'react';
import PdfPreview from './PdfPreview';
import ButtonBar from './ButtonBar';
import useFormActions from '../hooks/useFormActions';
import { formatCurrency } from '../utils/currency';
import { cardClass, labelClass, inputClass, currencyInputClass, headingClass } from '../styles/formClasses';

export default function SimpleRetainerForm({ title, fields, templateFile, filenamePrefix, isBusinessName, savedFormData, onFormChange, onGenerated }) {
  const initialData = Object.fromEntries(fields.map((f) => [f.key, '']));
  const [localFormData, setLocalFormData] = useState(savedFormData || initialData);
  const formData = localFormData;

  const {
    isGenerating, isPreviewing, previewPdf,
    statusMessage, statusType, savedFilePath,
    firstInputRef, clearStatus, runPreview, runGenerate, makeKeyDownHandler,
  } = useFormActions();

  function handleChange(key, value) {
    const updated = { ...formData, [key]: value };
    setLocalFormData(updated);
    if (onFormChange) onFormChange(updated);
  }

  function handleClear() {
    if (!window.confirm('Clear all fields?')) return;
    setLocalFormData(initialData);
    if (onFormChange) onFormChange(initialData);
    clearStatus();
  }

  function buildPayload() {
    const payload = {};
    for (const { key, type } of fields) {
      const val = formData[key];
      payload[key] = type === 'currency' ? (val ? `$${val}` : '') : val;
    }
    return payload;
  }

  function handlePreview() {
    runPreview(buildPayload, templateFile);
  }

  function handleGenerate() {
    runGenerate(buildPayload, templateFile, filenamePrefix, onGenerated, { isBusinessName });
  }

  const clientNameField = fields.find((f) => f.key === 'Client_Name');
  const isDisabled = isGenerating || (clientNameField ? !formData.Client_Name.trim() : false);

  const handleKeyDown = makeKeyDownHandler(isDisabled, handleGenerate);

  return (
    <div className="flex gap-6 items-start" onKeyDown={handleKeyDown}>
      <div className="w-[420px] flex-shrink-0 space-y-6">
      <div className={`${cardClass} p-8 space-y-6`}>
        <h2 className={headingClass}>{title}</h2>

        {fields.map(({ key, label, type, placeholder }, idx) => {
          const isRequired = key === 'Client_Name';
          if (type === 'currency') {
            return (
              <div key={key} className="space-y-1">
                <label className={labelClass}>
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
                    className={currencyInputClass}
                  />
                </div>
              </div>
            );
          }

          if (type === 'textarea') {
            return (
              <div key={key} className="space-y-1">
                <label className={labelClass}>
                  {label}{isRequired && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <textarea
                  ref={idx === 0 ? firstInputRef : undefined}
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder || ''}
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
              </div>
            );
          }

          return (
            <div key={key} className="space-y-1">
              <label className={labelClass}>
                {label}{isRequired && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                ref={idx === 0 ? firstInputRef : undefined}
                type="text"
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder || ''}
                className={inputClass}
              />
            </div>
          );
        })}
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
