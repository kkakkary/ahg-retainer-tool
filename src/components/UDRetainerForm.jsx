import React, { useState, useEffect, useRef } from 'react';
import PdfPreview from './PdfPreview';

function Spinner() {
  return <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}

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

  function handleChange(key, value) {
    const updated = { ...formData, [key]: value };
    setFormData(prev => ({ ...prev, [key]: value }));
    if (onFormChange) onFormChange(updated);
  }

  async function handlePreview() {
    setIsPreviewing(true);
    try {
      const selectedStage = STAGES.find(s => s.label === formData.stage);
      const payload = {
        Client_Name: formData.Client_Name,
        Tenant_Name: formData.Tenant_Name,
        Property_Address: formData.Property_Address,
        County: formData.County,
        Retainer_Requested: selectedStage ? selectedStage.value : '',
      };
      const result = await window.electronAPI.generatePreview({ formData: payload, templateFile: 'ud_retainer.docx' });
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
      const selectedStage = STAGES.find(s => s.label === formData.stage);
      const payload = {
        Client_Name:       formData.Client_Name,
        Tenant_Name:       formData.Tenant_Name,
        Property_Address:  formData.Property_Address,
        County:            formData.County,
        Retainer_Requested: selectedStage ? selectedStage.value : '',
      };

      const result = await window.electronAPI.generateDocument({
        formData: payload,
        templateFile: 'ud_retainer.docx',
        filenamePrefix: 'Griffin_UD',
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

  const isDisabled = isGenerating || !formData.Client_Name.trim() || !formData.stage;

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400';
  const labelClass = 'block text-sm font-medium text-gray-700';

  function handleClear() {
    if (!window.confirm('Clear all fields?')) return;
    const empty = { Client_Name: '', Tenant_Name: '', Property_Address: '', County: '', stage: '' };
    setFormData(empty);
    if (onFormChange) onFormChange(empty);
    setStatusMessage(''); setStatusType(null); setSavedFilePath(null);
  }

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
        <h2 className="text-base font-semibold text-slate-800">Unlawful Detainer Retainer Agreement</h2>

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
          <div className="text-sm text-gray-500 bg-slate-50 rounded-lg px-3 py-2">
            Retainer Requested: <span className="font-semibold text-slate-800">{STAGES.find(s => s.label === formData.stage)?.value}</span>
          </div>
        )}
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
