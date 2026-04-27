import React, { useState } from 'react';
import PdfPreview from './PdfPreview';
import ButtonBar from './ButtonBar';
import useFormActions from '../hooks/useFormActions';
import { inputClass, labelClass, cardClass, headingClass } from '../styles/formClasses';

const STAGES = [
  { label: 'Stage I — Notice',                       value: '$695.00 TOTAL FOR STAGE I' },
  { label: 'Stage II — Filing & Service of Complaint', value: '$2,495.00 TOTAL FOR STAGE II' },
  { label: 'Stage III — Failure to Answer (Default)', value: '$495.00 TOTAL FOR STAGE III' },
  { label: 'Stage IV — Trial',                        value: '$1,385.00 TOTAL FOR STAGE IV' },
  { label: 'Stage V — Sheriff Lockout',               value: '$735.00 TOTAL FOR STAGE V' },
];

export default function UDRetainerForm({ savedFormData, onFormChange, onGenerated }) {
  const [formData, setFormData] = useState(savedFormData || {
    Client_Name: '',
    Tenant_Name: '',
    Property_Address: '',
    County: '',
    stage: '',
  });

  const {
    isGenerating, isPreviewing, previewPdf,
    statusMessage, statusType, savedFilePath,
    firstInputRef, clearStatus, runPreview, runGenerate, makeKeyDownHandler,
  } = useFormActions();

  function handleChange(key, value) {
    const updated = { ...formData, [key]: value };
    setFormData(prev => ({ ...prev, [key]: value }));
    if (onFormChange) onFormChange(updated);
  }

  function buildPayload() {
    const selectedStage = STAGES.find(s => s.label === formData.stage);
    return {
      Client_Name: formData.Client_Name,
      Tenant_Name: formData.Tenant_Name,
      Property_Address: formData.Property_Address,
      County: formData.County,
      Retainer_Requested: selectedStage ? selectedStage.value : '',
    };
  }

  function handlePreview() {
    runPreview(buildPayload, 'ud_retainer.docx');
  }

  function handleGenerate() {
    runGenerate(buildPayload, 'ud_retainer.docx', 'Griffin_UD', onGenerated);
  }

  const isDisabled = isGenerating || !formData.Client_Name.trim() || !formData.stage;

  function handleClear() {
    if (!window.confirm('Clear all fields?')) return;
    const empty = { Client_Name: '', Tenant_Name: '', Property_Address: '', County: '', stage: '' };
    setFormData(empty);
    if (onFormChange) onFormChange(empty);
    clearStatus();
  }

  const handleKeyDown = makeKeyDownHandler(isDisabled, handleGenerate);

  return (
    <div className="flex gap-6 items-start" onKeyDown={handleKeyDown}>
      <div className="w-[420px] flex-shrink-0 space-y-6">
      <div className={`${cardClass} p-8 space-y-6`}>
        <h2 className={headingClass}>Unlawful Detainer Retainer Agreement</h2>

        <div className="space-y-1">
          <label className={labelClass}>Client / Landlord Name <span className="text-red-500">*</span></label>
          <input ref={firstInputRef} type="text" value={formData.Client_Name} onChange={e => handleChange('Client_Name', e.target.value)} placeholder="e.g. Jane Doe" className={inputClass} />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Tenant Name(s)</label>
          <input type="text" value={formData.Tenant_Name} onChange={e => handleChange('Tenant_Name', e.target.value)} placeholder="e.g. John Smith" className={inputClass} />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Property Address</label>
          <textarea value={formData.Property_Address} onChange={e => handleChange('Property_Address', e.target.value)} placeholder="e.g. 123 Main St, Chula Vista, CA 91914" rows={3} className={`${inputClass} resize-y`} />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>County</label>
          <input type="text" value={formData.County} onChange={e => handleChange('County', e.target.value)} placeholder="e.g. San Diego County" className={inputClass} />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Stage <span className="text-red-500">*</span></label>
          <select value={formData.stage} onChange={e => handleChange('stage', e.target.value)} className={inputClass}>
            <option value="">— Select a stage —</option>
            {STAGES.map(s => (
              <option key={s.label} value={s.label}>{s.label}</option>
            ))}
          </select>
        </div>

        {formData.stage && (
          <div className="text-sm text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-700 rounded-lg px-3 py-2">
            Retainer Requested: <span className="font-semibold text-slate-800 dark:text-gray-100">{STAGES.find(s => s.label === formData.stage)?.value}</span>
          </div>
        )}
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
