import React from 'react';

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const fieldClass = 'mb-4';

export default function FeesSection({ formData, onChange }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-700 border-b border-gray-200 pb-2 mb-4">
        Fees
      </h2>

      <div className={fieldClass}>
        <label className={labelClass}>Attorney Fee ($)</label>
        <input
          type="text"
          className={inputClass}
          placeholder="2,433.00"
          value={formData.attorney_fee}
          onChange={(e) => onChange('attorney_fee', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Standard fee. Editable if a different arrangement is made.
        </p>
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>Discounted Fee — if paid at signing ($)</label>
        <input
          type="text"
          className={inputClass}
          placeholder="2,333.00"
          value={formData.discounted_fee}
          onChange={(e) => onChange('discounted_fee', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Applies when paid in full at signing.
        </p>
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>Retainer Paid at Signing ($)</label>
        <input
          type="text"
          className={inputClass}
          placeholder="0.00"
          value={formData.retainer_paid}
          onChange={(e) => onChange('retainer_paid', e.target.value)}
        />
      </div>
    </div>
  );
}
