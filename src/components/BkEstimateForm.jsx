import React, { useState } from 'react';
import PdfPreview from './PdfPreview';

// Field_1–Field_24 map to the template placeholders in order.
// Labels are what the user sees in the form.
const FEE_FIELDS = [
  { key: 'Field_1',  label: 'Joint Filing',                                                                       defaultFee: '200.00' },
  { key: 'Field_2',  label: 'Above Median Income',                                                                defaultFee: '500.00' },
  { key: 'Field_3',  label: 'Protect Your Home',                                                                  defaultFee: '150.00' },
  { key: 'Field_4',  label: 'Protect Other Real Estate',                                                          defaultFee: '300.00' },
  { key: 'Field_5',  label: 'Protect Your Car',                                                                   defaultFee: '100.00' },
  { key: 'Field_6',  label: 'Protect Your Retirement Account',                                                    defaultFee: '200.00' },
  { key: 'Field_7',  label: "Manage Trustee's Interest in Your Claim Against Somebody Else",                      defaultFee: '150.00' },
  { key: 'Field_8',  label: 'Negotiate With Trustee to Protect Unexempt Assets',                                  defaultFee: '1,000.00' },
  { key: 'Field_9',  label: "Protect Your Property If You Aren't Eligible for Your State's Exemptions",           defaultFee: '150.00' },
  { key: 'Field_10', label: 'Adding Creditors After Petition Is Filed',                                           defaultFee: '150.00' },
  { key: 'Field_11', label: 'Review and Manage Child Support Obligations',                                        defaultFee: '75.00' },
  { key: 'Field_12', label: 'Notify State Courts of Your Bankruptcy to Stop Other Lawsuits',                      defaultFee: '75.00' },
  { key: 'Field_13', label: 'Avoid a Judicial Lien Against Your Home',                                            defaultFee: '150.00' },
  { key: 'Field_14', label: 'Avoid a Lien Against Other Property',                                                defaultFee: '250.00' },
  { key: 'Field_15', label: 'Notify and Protect You From More Than 50 Creditors',                                 defaultFee: '50.00' },
  { key: 'Field_16', label: 'Coordinate With Trustee and Taxing Authorities for Unfiled Tax Returns',             defaultFee: '75.00' },
  { key: 'Field_17', label: 'Protect Your Active Business From the Trustee',                                      defaultFee: '300.00' },
  { key: 'Field_18', label: 'Disclose and Protect Remaining Business Assets From Your Closed Business',           defaultFee: '125.00' },
  { key: 'Field_19', label: 'Assistance With Credit Counseling Certificate (First Course)',                       defaultFee: '150.00' },
  { key: 'Field_20', label: "Assistance With Debtor's Education Certificate (Second Course)",                     defaultFee: '250.00' },
  { key: 'Field_21', label: "Arranging for Court's Filing Fee to Be Paid in Installments After Filing",           defaultFee: '100.00' },
  { key: 'Field_22', label: 'Assist With Preparation of Profit and Loss Statement',                               defaultFee: '350.00' },
  { key: 'Field_23', label: 'Additional Fee to Maintain Your File Beyond 6 Months',                               defaultFee: '350.00' },
  { key: 'Field_24', label: 'Attending Additional Meetings With the Trustee',                                     defaultFee: '250.00' },
];

function parseFee(val) {
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatMoney(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const initialFees = Object.fromEntries(FEE_FIELDS.map((f) => [f.key, '']));

export default function BkEstimateForm() {
  const [clientName, setClientName] = useState('');
  const [totalDebt, setTotalDebt] = useState('');
  const [discountedFee, setDiscountedFee] = useState('');
  const [fees, setFees] = useState(initialFees);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(null);

  const BASE_FEE = 2333.00;
  const additionalTotal = FEE_FIELDS.reduce((sum, f) => sum + parseFee(fees[f.key]), 0);
  const total = BASE_FEE + additionalTotal;

  function buildPayload() {
    const payload = {
      Client_Name: clientName,
      Debt: totalDebt ? `$${totalDebt}` : '',
      Discounted_Fee: discountedFee ? `$${discountedFee}` : '',
    };
    for (const { key } of FEE_FIELDS) {
      const val = fees[key].trim();
      payload[key] = val ? `$${val}` : '';
    }
    payload.fee_rows = FEE_FIELDS
      .filter(({ key }) => fees[key].trim())
      .map(({ key }) => ({ fee_amount: `$${fees[key].trim()}` }));
    payload.Total = `$${formatMoney(total)}`;
    return payload;
  }

  async function handlePreview() {
    setIsPreviewing(true);
    try {
      const result = await window.electronAPI.generatePreview({ formData: buildPayload(), templateFile: 'bk_estimate.docx' });
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
      const result = await window.electronAPI.generateDocument({
        formData: buildPayload(),
        templateFile: 'bk_estimate.docx',
        filenamePrefix: 'Griffin_BkEstimate',
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

  return (
    <div className="flex gap-6 items-start">
    <div className="w-[520px] flex-shrink-0 space-y-6">
      {/* Client Name */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-amber-800">Bankruptcy Fee Estimate</h2>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Total Debt</label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              value={totalDebt}
              onChange={(e) => setTotalDebt(e.target.value)}
              placeholder="e.g. 25,000.00"
              className="w-full border border-gray-300 rounded-lg pl-5 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">If Paid Today</label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              value={discountedFee}
              onChange={(e) => setDiscountedFee(e.target.value)}
              placeholder="e.g. 2,333.00"
              className="w-full border border-gray-300 rounded-lg pl-5 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Fee Fields */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
        <p className="text-sm font-semibold text-amber-800">Additional Fees <span className="text-gray-400 font-normal">(leave blank if not applicable)</span></p>

        <div className="divide-y divide-gray-100">
          {FEE_FIELDS.map(({ key, label, defaultFee }) => (
            <div key={key} className="flex items-center justify-between py-2 gap-4">
              <label className="text-sm text-gray-700 flex-1">{label}</label>
              <span className="text-xs text-gray-400 flex-shrink-0">${defaultFee}</span>
              <div className="relative w-32 flex-shrink-0">
                <span className="absolute left-2.5 top-1.5 text-gray-400 text-sm">$</span>
                <input
                  type="text"
                  value={fees[key]}
                  onChange={(e) => setFees((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={defaultFee}
                  className="w-full border border-gray-300 rounded-lg pl-5 pr-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Base fee + Total */}
        <div className="flex items-center justify-between py-2 border-t border-gray-200">
          <span className="text-sm text-gray-700">Base Fee <span className="text-gray-400 font-normal">(Court Filing + Attorney Fee)</span></span>
          <span className="text-sm text-gray-700 w-32 text-right pr-2">$2,333.00</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-300">
          <span className="text-sm font-semibold text-amber-800">Total Estimate</span>
          <span className="text-sm font-bold text-amber-800 w-32 text-right pr-2">
            ${formatMoney(total)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handlePreview}
          disabled={isPreviewing || !clientName.trim()}
          className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isPreviewing ? 'Loading…' : 'Preview'}
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !clientName.trim()}
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
