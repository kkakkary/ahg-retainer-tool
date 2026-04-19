import React, { useState } from 'react';

const STAGES = [
  { label: 'Stage I — Notice',                       value: '$695.00 TOTAL FOR STAGE I' },
  { label: 'Stage II — Filing & Service of Complaint', value: '$2,495.00 TOTAL FOR STAGE II' },
  { label: 'Stage III — Failure to Answer (Default)', value: '$495.00 TOTAL FOR STAGE III' },
  { label: 'Stage IV — Trial',                        value: '$1,385.00 TOTAL FOR STAGE IV' },
  { label: 'Stage V — Sheriff Lockout',               value: '$735.00 TOTAL FOR STAGE V' },
];

export default function UDRetainerForm() {
  const [formData, setFormData] = useState({
    Client_Name: '',
    Tenant_Name: '',
    Property_Address: '',
    County: '',
    stage: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(null);

  function handleChange(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
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

  const isDisabled = isGenerating || !formData.Client_Name.trim() || !formData.stage;

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400';
  const labelClass = 'block text-sm font-medium text-gray-700';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-lg space-y-6">
        <h2 className="text-base font-semibold text-amber-800">Unlawful Detainer Retainer Agreement</h2>

        <div className="space-y-1">
          <label className={labelClass}>Client / Landlord Name</label>
          <input type="text" value={formData.Client_Name} onChange={e => handleChange('Client_Name', e.target.value)} placeholder="e.g. Jane Doe" className={inputClass} />
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
          <label className={labelClass}>Stage</label>
          <select value={formData.stage} onChange={e => handleChange('stage', e.target.value)} className={inputClass}>
            <option value="">— Select a stage —</option>
            {STAGES.map(s => (
              <option key={s.label} value={s.label}>{s.label}</option>
            ))}
          </select>
        </div>

        {formData.stage && (
          <div className="text-sm text-gray-500 bg-amber-50 rounded-lg px-3 py-2">
            Retainer Requested: <span className="font-semibold text-amber-800">{STAGES.find(s => s.label === formData.stage)?.value}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={isDisabled}
          className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
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
  );
}
