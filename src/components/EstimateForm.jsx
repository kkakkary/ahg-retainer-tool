import React, { useState } from 'react';
import PdfPreview from './PdfPreview';
import ButtonBar from './ButtonBar';
import useFormActions from '../hooks/useFormActions';
import { parseFee, formatMoney } from '../utils/currency';
import { cardClass, labelClass, inputClass, currencyInputClass, headingClass } from '../styles/formClasses';

// Field_1-Field_24 map to the template placeholders in order.
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

const initialFees = Object.fromEntries(FEE_FIELDS.map((f) => [f.key, '']));

export default function EstimateForm({ title, baseFee, baseFeeLabel, templateFile, filenamePrefix, showDiscountedFee, allowNameToggle, savedFormData, onFormChange, onGenerated }) {
  const saved = savedFormData || {};
  const [clientName, setClientName] = useState(saved.clientName || '');
  const [totalDebt, setTotalDebt] = useState(saved.totalDebt || '');
  const [discountedFee, setDiscountedFee] = useState(saved.discountedFee || '');
  const [fees, setFees] = useState(saved.fees || initialFees);
  const [nameType, setNameType] = useState(saved.nameType || 'client');

  function notifyChange(updates) {
    const base = { clientName, totalDebt, fees, nameType };
    if (showDiscountedFee) base.discountedFee = discountedFee;
    if (onFormChange) onFormChange({ ...base, ...updates });
  }

  const {
    isGenerating, isPreviewing, previewPdf,
    statusMessage, statusType, savedFilePath,
    firstInputRef, clearStatus, runPreview, runGenerate, makeKeyDownHandler,
  } = useFormActions();

  const additionalTotal = FEE_FIELDS.reduce((sum, f) => sum + parseFee(fees[f.key]), 0);
  const total = baseFee + additionalTotal;

  function buildPayload() {
    const payload = {
      Client_Name: clientName,
      Debt: totalDebt ? `$${totalDebt}` : '',
    };
    if (showDiscountedFee) {
      payload.Discounted_Fee = discountedFee ? `$${discountedFee}` : '';
    }
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

  function handlePreview() {
    runPreview(buildPayload, templateFile);
  }

  function handleGenerate() {
    const isBusinessName = allowNameToggle ? nameType === 'business' : false;
    runGenerate(buildPayload, templateFile, filenamePrefix, onGenerated, { isBusinessName });
  }

  function handleClear() {
    if (!window.confirm('Clear all fields?')) return;
    setClientName(''); setTotalDebt(''); setDiscountedFee(''); setFees(initialFees); setNameType('client');
    const cleared = { clientName: '', totalDebt: '', fees: initialFees, nameType: 'client' };
    if (showDiscountedFee) cleared.discountedFee = '';
    notifyChange(cleared);
    clearStatus();
  }

  const isDisabled = isGenerating || !clientName.trim();

  const handleKeyDown = makeKeyDownHandler(isDisabled, handleGenerate);

  const nameLabel = allowNameToggle
    ? (nameType === 'business' ? 'Business Name' : 'Client Name')
    : 'Client Name';
  const namePlaceholder = allowNameToggle
    ? (nameType === 'business' ? 'e.g. Acme LLC' : 'e.g. Jane Doe')
    : 'e.g. Jane Doe';

  return (
    <div className="flex gap-6 items-start" onKeyDown={handleKeyDown}>
    <div className="w-[520px] flex-shrink-0 space-y-6">
      {/* Client Name */}
      <div className={`${cardClass} p-6 space-y-4`}>
        <h2 className={headingClass}>{title}</h2>
        <div className="space-y-1">
          {allowNameToggle && (
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 w-fit mb-2">
              <button
                type="button"
                onClick={() => { setNameType('client'); notifyChange({ nameType: 'client' }); }}
                className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  nameType === 'client'
                    ? 'bg-slate-700 text-white dark:bg-slate-500'
                    : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => { setNameType('business'); notifyChange({ nameType: 'business' }); }}
                className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  nameType === 'business'
                    ? 'bg-slate-700 text-white dark:bg-slate-500'
                    : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Business
              </button>
            </div>
          )}
          <label className={labelClass}>{nameLabel} <span className="text-red-500">*</span></label>
          <input
            ref={firstInputRef}
            type="text"
            value={clientName}
            onChange={(e) => { setClientName(e.target.value); notifyChange({ clientName: e.target.value }); }}
            placeholder={namePlaceholder}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Total Debt</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              value={totalDebt}
              onChange={(e) => { setTotalDebt(e.target.value); notifyChange({ totalDebt: e.target.value }); }}
              placeholder="e.g. 25,000.00"
              className={currencyInputClass}
            />
          </div>
        </div>
        {showDiscountedFee && (
          <div className="space-y-1">
            <label className={labelClass}>If Paid Today</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="text"
                value={discountedFee}
                onChange={(e) => { setDiscountedFee(e.target.value); notifyChange({ discountedFee: e.target.value }); }}
                placeholder="e.g. 2,333.00"
                className={currencyInputClass}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fee Fields */}
      <div className={`${cardClass} p-6 space-y-3`}>
        <p className={`text-sm font-semibold ${headingClass}`}>Additional Fees <span className="text-gray-400 font-normal">(leave blank if not applicable)</span></p>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {FEE_FIELDS.map(({ key, label, defaultFee }) => (
            <div key={key} className="flex items-center justify-between py-2 gap-4">
              <label className={`text-sm flex-1 ${labelClass}`}>{label}</label>
              <span className="text-xs text-gray-400 flex-shrink-0">${defaultFee}</span>
              <div className="relative w-32 flex-shrink-0">
                <span className="absolute left-3 top-1.5 text-gray-400 text-sm">$</span>
                <input
                  type="text"
                  value={fees[key]}
                  onChange={(e) => { const v = e.target.value; setFees((prev) => { const updated = { ...prev, [key]: v }; notifyChange({ fees: updated }); return updated; }); }}
                  placeholder={defaultFee}
                  className={`${currencyInputClass} pr-2 py-1.5 text-right`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Base fee + Total */}
        <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-600">
          <span className="text-sm text-gray-700 dark:text-gray-300">{baseFeeLabel || 'Base Fee'} <span className="text-gray-400 font-normal">(Court Filing + Attorney Fee)</span></span>
          <span className="text-sm text-gray-700 dark:text-gray-300 w-32 text-right pr-2">${formatMoney(baseFee)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-300 dark:border-gray-600">
          <span className="text-sm font-semibold text-slate-800 dark:text-gray-100">Total Estimate</span>
          <span className="text-sm font-bold text-slate-800 dark:text-gray-100 w-32 text-right pr-2">
            ${formatMoney(total)}
          </span>
        </div>
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
