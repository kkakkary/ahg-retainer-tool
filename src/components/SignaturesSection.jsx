import React from 'react';

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const fieldClass = 'mb-4';

export default function SignaturesSection({ formData, onChange }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-700 border-b border-gray-200 pb-2 mb-4">
        Signature Dates
      </h2>

      <div className={fieldClass}>
        <label className={labelClass}>Debtor Signed Date</label>
        <input
          type="date"
          className={inputClass}
          value={formData.debtor_signed_date}
          onChange={(e) => onChange('debtor_signed_date', e.target.value)}
        />
      </div>

      {formData.is_joint && (
        <div className={fieldClass}>
          <label className={labelClass}>Co-Debtor Signed Date</label>
          <input
            type="date"
            className={inputClass}
            value={formData.co_debtor_signed_date}
            onChange={(e) => onChange('co_debtor_signed_date', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
