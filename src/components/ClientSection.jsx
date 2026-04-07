import React from 'react';

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const fieldClass = 'mb-4';

export default function ClientSection({ formData, onChange }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-700 border-b border-gray-200 pb-2 mb-4">
        Client Information
      </h2>

      <div className={fieldClass}>
        <label className={labelClass}>Contract Date</label>
        <input
          type="date"
          className={inputClass}
          value={formData.contract_date}
          onChange={(e) => onChange('contract_date', e.target.value)}
        />
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>Client Name</label>
        <input
          type="text"
          className={inputClass}
          placeholder="Full legal name"
          value={formData.client_name}
          onChange={(e) => onChange('client_name', e.target.value)}
        />
      </div>

      <div className={fieldClass}>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Joint Filing?</label>
          <button
            type="button"
            onClick={() => onChange('is_joint', !formData.is_joint)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.is_joint ? 'bg-slate-700' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.is_joint ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-500">
            {formData.is_joint ? 'Yes — joint filing' : 'No — individual filing'}
          </span>
        </div>
      </div>

      {formData.is_joint && (
        <div className={fieldClass}>
          <label className={labelClass}>Co-Debtor Name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Full legal name"
            value={formData.co_debtor_name}
            onChange={(e) => onChange('co_debtor_name', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
