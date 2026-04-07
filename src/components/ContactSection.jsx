import React from 'react';

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const fieldClass = 'mb-4';

export default function ContactSection({ formData, onChange }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-700 border-b border-gray-200 pb-2 mb-4">
        Contact Information
      </h2>

      <div className={fieldClass}>
        <label className={labelClass}>Debtor Address</label>
        <input
          type="text"
          className={inputClass}
          placeholder="Street address"
          value={formData.debtor_address}
          onChange={(e) => onChange('debtor_address', e.target.value)}
        />
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>City, State, ZIP</label>
        <input
          type="text"
          className={inputClass}
          placeholder="El Cajon, CA 92020"
          value={formData.debtor_city_state_zip}
          onChange={(e) => onChange('debtor_city_state_zip', e.target.value)}
        />
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>Debtor Phone</label>
        <input
          type="text"
          className={inputClass}
          placeholder="619-555-0000"
          value={formData.debtor_phone}
          onChange={(e) => onChange('debtor_phone', e.target.value)}
        />
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>Debtor Email</label>
        <input
          type="email"
          className={inputClass}
          placeholder="client@email.com"
          value={formData.debtor_email}
          onChange={(e) => onChange('debtor_email', e.target.value)}
        />
      </div>

      {formData.is_joint && (
        <>
          <p className="text-sm font-medium text-slate-600 mt-4 mb-3">Co-Debtor Contact</p>

          <div className={fieldClass}>
            <label className={labelClass}>Co-Debtor Address</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Street address"
              value={formData.co_debtor_address}
              onChange={(e) => onChange('co_debtor_address', e.target.value)}
            />
          </div>

          <div className={fieldClass}>
            <label className={labelClass}>Co-Debtor City, State, ZIP</label>
            <input
              type="text"
              className={inputClass}
              placeholder="El Cajon, CA 92020"
              value={formData.co_debtor_city_state_zip}
              onChange={(e) => onChange('co_debtor_city_state_zip', e.target.value)}
            />
          </div>

          <div className={fieldClass}>
            <label className={labelClass}>Co-Debtor Phone</label>
            <input
              type="text"
              className={inputClass}
              placeholder="619-555-0000"
              value={formData.co_debtor_phone}
              onChange={(e) => onChange('co_debtor_phone', e.target.value)}
            />
          </div>

          <div className={fieldClass}>
            <label className={labelClass}>Co-Debtor Email</label>
            <input
              type="email"
              className={inputClass}
              placeholder="co-debtor@email.com"
              value={formData.co_debtor_email}
              onChange={(e) => onChange('co_debtor_email', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
