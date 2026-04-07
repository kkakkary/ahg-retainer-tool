import React from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${MONTHS[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}

export default function PreviewPanel({ formData }) {
  const formattedDate = formatDate(formData.contract_date);

  const parts = formData.client_name.trim().split(' ');
  const lastName = parts.length > 0 ? parts[parts.length - 1] : '';
  const dateSlug = formData.contract_date ? formData.contract_date.replace(/-/g, '') : '';

  const requiredFields = [
    { label: 'Client Name', filled: !!formData.client_name.trim() },
    { label: 'Address', filled: !!formData.debtor_address.trim() },
    { label: 'Phone', filled: !!formData.debtor_phone.trim() },
    { label: 'Contract Date', filled: !!formData.contract_date },
    { label: 'Retainer Paid', filled: !!formData.retainer_paid.trim() },
  ];

  return (
    <div className="sticky top-0">
      <h2 className="text-base font-semibold text-slate-700 mb-4">Document Preview</h2>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
        <div className="text-center border-b border-gray-100 pb-3">
          <p className="font-semibold text-sm text-slate-800">
            Law Office of Andrew H. Griffin, III, APC
          </p>
          <p className="text-xs text-gray-500">
            275 E. Douglas Ave, Suite 112, El Cajon, CA 92020
          </p>
        </div>

        <PreviewRow label="Date" value={formattedDate || '—'} />
        <PreviewRow label="Client" value={formData.client_name || '—'} />
        {formData.is_joint && (
          <PreviewRow label="Co-Debtor" value={formData.co_debtor_name || '—'} />
        )}
        <PreviewRow
          label="Filing Type"
          value={formData.is_joint ? 'Joint Filing' : 'Individual Filing'}
        />
        <PreviewRow
          label="Attorney Fee"
          value={formData.attorney_fee ? `$${formData.attorney_fee}` : '—'}
        />
        <PreviewRow
          label="Discounted Fee"
          value={formData.discounted_fee ? `$${formData.discounted_fee}` : '—'}
        />
        <PreviewRow
          label="Retainer Paid"
          value={formData.retainer_paid ? `$${formData.retainer_paid}` : '—'}
        />

        {formData.client_name.trim() && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Output filename:</p>
            <p className="text-xs font-mono text-slate-700 mt-1 break-all">
              Griffin_Retainer_{lastName || 'Client'}_{dateSlug || 'DATE'}.docx
            </p>
          </div>
        )}
      </div>

      {/* Completeness indicator */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Required Fields</p>
        {requiredFields.map(({ label, filled }) => (
          <div key={label} className="flex items-center gap-2 text-xs py-0.5">
            <span className={filled ? 'text-green-500' : 'text-gray-300'}>
              {filled ? '✓' : '○'}
            </span>
            <span className={filled ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
          </div>
        ))}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Completion</span>
            <span className="font-medium text-slate-700">
              {requiredFields.filter((f) => f.filled).length}/{requiredFields.length}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-700 rounded-full transition-all"
              style={{
                width: `${(requiredFields.filter((f) => f.filled).length / requiredFields.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
