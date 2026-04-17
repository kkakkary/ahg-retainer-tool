import React, { useState, useEffect, useRef } from 'react';
import Ch7RetainerForm from './components/Ch7RetainerForm';
import BkEstimateForm from './components/BkEstimateForm';
import Ch13EstimateForm from './components/Ch13EstimateForm';
import SimpleRetainerForm from './components/SimpleRetainerForm';
import logo from './assets/logo.png';

const TABS = [
  // ── Ch. 7 Retainer (original component) ───────────────────────────────────
  {
    id: 'ch7',
    label: 'Ch. 7 Retainer',
    component: Ch7RetainerForm,
  },

  // ── Business Ch7 ───────────────────────────────────────────────────────────
  {
    id: 'biz_ch7',
    label: 'Business Ch7',
    component: () => (
      <SimpleRetainerForm
        title="Business Chapter 7 Retainer Agreement"
        fields={[
          { key: 'Client_Name',    label: 'Business Name',   type: 'text',     placeholder: 'e.g. Acme LLC' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',    type: 'currency',  placeholder: 'e.g. 2,433.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee',  type: 'currency',  placeholder: 'e.g. 2,333.00' },
        ]}
        templateFile="biz_ch7_retainer.docx"
        filenamePrefix="Griffin_BizCh7Retainer"
      />
    ),
  },

  // ── Ch. 11 Retainer ────────────────────────────────────────────────────────
  {
    id: 'ch11',
    label: 'Ch. 11 Retainer',
    component: () => (
      <SimpleRetainerForm
        title="Chapter 11 Retainer Agreement"
        fields={[
          { key: 'Client_Name',  label: 'Client Name',  type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Attorney_Fee', label: 'Attorney Fee', type: 'currency', placeholder: 'e.g. 10,000.00' },
        ]}
        templateFile="ch11_retainer.docx"
        filenamePrefix="Griffin_Ch11Retainer"
      />
    ),
  },

  // ── Ch. 13 Central (Consumer) ──────────────────────────────────────────────
  {
    id: 'ch13_central_consumer',
    label: 'Ch. 13 Central (Consumer)',
    component: () => (
      <SimpleRetainerForm
        title="Chapter 13 Retainer Agreement — Central District (Consumer)"
        fields={[
          { key: 'Client_Name',    label: 'Client Name',    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',   type: 'currency',  placeholder: 'e.g. 4,000.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee', type: 'currency',  placeholder: 'e.g. 3,500.00' },
        ]}
        templateFile="ch13_central_consumer_retainer.docx"
        filenamePrefix="Griffin_Ch13CentralConsumer"
      />
    ),
  },

  // ── Ch. 13 South (Consumer) ────────────────────────────────────────────────
  {
    id: 'ch13_south_consumer',
    label: 'Ch. 13 South (Consumer)',
    component: () => (
      <SimpleRetainerForm
        title="Chapter 13 Retainer Agreement — Southern District (Consumer)"
        fields={[
          { key: 'Client_Name',    label: 'Client Name',    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',   type: 'currency',  placeholder: 'e.g. 4,000.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee', type: 'currency',  placeholder: 'e.g. 3,500.00' },
        ]}
        templateFile="ch13_south_consumer_retainer.docx"
        filenamePrefix="Griffin_Ch13SouthConsumer"
      />
    ),
  },

  // ── Ch. 13 South (Business) ────────────────────────────────────────────────
  {
    id: 'ch13_south_business',
    label: 'Ch. 13 South (Business)',
    component: () => (
      <SimpleRetainerForm
        title="Chapter 13 Retainer Agreement — Southern District (Business)"
        fields={[
          { key: 'Client_Name',    label: 'Business Name',  type: 'text',     placeholder: 'e.g. Acme LLC' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',   type: 'currency',  placeholder: 'e.g. 4,000.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee', type: 'currency',  placeholder: 'e.g. 3,500.00' },
        ]}
        templateFile="ch13_south_business_retainer.docx"
        filenamePrefix="Griffin_Ch13SouthBusiness"
      />
    ),
  },

  // ── Ch. 13 Estimate ────────────────────────────────────────────────────────
  {
    id: 'ch13_estimate',
    label: 'Ch. 13 Estimate',
    component: Ch13EstimateForm,
  },

  // ── Spanish Ch. 7 ──────────────────────────────────────────────────────────
  {
    id: 'spanish_ch7',
    label: 'Spanish Ch. 7',
    component: () => (
      <SimpleRetainerForm
        title="Chapter 7 Retainer Agreement (Spanish)"
        fields={[
          { key: 'Client_Name',    label: 'Client Name',    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',   type: 'currency',  placeholder: 'e.g. 2,433.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee', type: 'currency',  placeholder: 'e.g. 2,333.00' },
        ]}
        templateFile="spanish_ch7_retainer.docx"
        filenamePrefix="Griffin_SpanishCh7"
      />
    ),
  },

  // ── BK Fee Estimate (original component) ───────────────────────────────────
  {
    id: 'bk_estimate',
    label: 'BK Fee Estimate',
    component: BkEstimateForm,
  },

  // ── Civil - Hourly (Litigation) ────────────────────────────────────────────
  {
    id: 'civil_hourly_lit',
    label: 'Civil - Hourly (Lit)',
    component: () => (
      <SimpleRetainerForm
        title="Civil Retainer Agreement — Hourly (Litigation)"
        fields={[
          { key: 'Client_Name',         label: 'Client Name',                    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Hourly_Rate',         label: 'Hourly Rate',                    type: 'currency', placeholder: 'e.g. 350.00' },
          { key: 'Retainer_Amount',     label: 'Initial Retainer',               type: 'currency', placeholder: 'e.g. 5,000.00' },
          { key: 'Retainer_Replenish',  label: 'Replenish Retainer When Below',  type: 'currency', placeholder: 'e.g. 1,000.00' },
        ]}
        templateFile="civil_hourly_lit_retainer.docx"
        filenamePrefix="Griffin_CivilHourlyLit"
      />
    ),
  },

  // ── Civil - Hourly (Non-Lit) ───────────────────────────────────────────────
  {
    id: 'civil_hourly_nonlit',
    label: 'Civil - Hourly (Non-Lit)',
    component: () => (
      <SimpleRetainerForm
        title="Civil Retainer Agreement — Hourly (Non-Litigation)"
        fields={[
          { key: 'Client_Name',         label: 'Client Name',                   type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Matter_Description',  label: 'Scope of Work',                 type: 'textarea', placeholder: 'e.g. Administration of the Smith Family Trust' },
          { key: 'Contract_Date',       label: 'Contract Date',                 type: 'plain',    placeholder: 'e.g. April 16, 2026' },
          { key: 'Hourly_Rate',         label: 'Hourly Rate',                   type: 'currency', placeholder: 'e.g. 350.00' },
          { key: 'Retainer_Amount',     label: 'Initial Retainer',              type: 'currency', placeholder: 'e.g. 5,000.00' },
          { key: 'Retainer_Replenish',  label: 'Replenish Retainer When Below', type: 'currency', placeholder: 'e.g. 1,000.00' },
          { key: 'Due_Date',            label: 'Deposit Due Date',              type: 'plain',    placeholder: 'e.g. April 30, 2026' },
        ]}
        templateFile="civil_hourly_nonlit_retainer.docx"
        filenamePrefix="Griffin_CivilHourlyNonLit"
      />
    ),
  },

  // ── Civil - Flat Fee ───────────────────────────────────────────────────────
  {
    id: 'civil_flat_fee',
    label: 'Civil - Flat Fee',
    component: () => (
      <SimpleRetainerForm
        title="Civil Retainer Agreement — Flat Fee"
        fields={[
          { key: 'Client_Name',            label: 'Client Name',              type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Matter_Description',     label: 'Scope of Work',            type: 'textarea', placeholder: 'e.g. Proof of claim in Bankruptcy Court' },
          { key: 'Contract_Date',          label: 'Contract Date',            type: 'plain',    placeholder: 'e.g. April 16, 2026' },
          { key: 'Attorney_Fee',           label: 'Attorney Fee',             type: 'currency', placeholder: 'e.g. 5,000.00' },
          { key: 'Attorney_Fee_Replenish', label: 'Replenish Fee When Below', type: 'currency', placeholder: 'e.g. 1,000.00' },
          { key: 'Due_Date',               label: 'Deposit Due Date',         type: 'plain',    placeholder: 'e.g. April 30, 2026' },
        ]}
        templateFile="civil_flat_fee_retainer.docx"
        filenamePrefix="Griffin_CivilFlatFee"
      />
    ),
  },

  // ── Civil - Contingency ────────────────────────────────────────────────────
  {
    id: 'civil_contingency',
    label: 'Civil - Contingency',
    component: () => (
      <SimpleRetainerForm
        title="Civil Retainer Agreement — Contingency"
        fields={[
          { key: 'Client_Name',      label: 'Client Name',        type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Case_Description', label: 'Matter Description',  type: 'textarea', placeholder: 'e.g. Automobile Accident that occurred on...' },
          { key: 'Case_Date',        label: 'Date of Incident',    type: 'plain',    placeholder: 'e.g. November 24, 2020' },
          { key: 'Cost_Deposit',     label: 'Initial Cost Deposit', type: 'currency', placeholder: 'e.g. 500.00' },
        ]}
        templateFile="civil_contingency_retainer.docx"
        filenamePrefix="Griffin_CivilContingency"
      />
    ),
  },

  // ── Family Law ─────────────────────────────────────────────────────────────
  {
    id: 'family_law',
    label: 'Family Law',
    component: () => (
      <SimpleRetainerForm
        title="Family Law Retainer Agreement"
        fields={[
          { key: 'Client_Name',        label: 'Client Name',                    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Hourly_Rate',        label: 'Hourly Rate',                    type: 'currency', placeholder: 'e.g. 350.00' },
          { key: 'Retainer_Amount',    label: 'Initial Retainer',               type: 'currency', placeholder: 'e.g. 5,000.00' },
          { key: 'Retainer_Replenish', label: 'Replenish Retainer When Below',  type: 'currency', placeholder: 'e.g. 1,000.00' },
          { key: 'Effective_Date',     label: 'Effective Date',                 type: 'plain',    placeholder: 'e.g. April 7, 2026' },
        ]}
        templateFile="family_law_retainer.docx"
        filenamePrefix="Griffin_FamilyLaw"
      />
    ),
  },

  // ── Unlawful Detainer ──────────────────────────────────────────────────────
  {
    id: 'ud',
    label: 'UD',
    component: () => (
      <SimpleRetainerForm
        title="Unlawful Detainer Retainer Agreement"
        fields={[
          { key: 'Client_Name',      label: 'Client / Landlord Name', type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Tenant_Name',      label: 'Tenant Name(s)',          type: 'plain',    placeholder: 'e.g. John Smith' },
          { key: 'Property_Address', label: 'Property Address',        type: 'textarea', placeholder: 'e.g. 123 Main St, Chula Vista, CA 91914' },
          { key: 'County',           label: 'County',                  type: 'plain',    placeholder: 'e.g. San Diego County' },
        ]}
        templateFile="ud_retainer.docx"
        filenamePrefix="Griffin_UD"
      />
    ),
  },

  // ── Probate ────────────────────────────────────────────────────────────────
  {
    id: 'probate',
    label: 'Probate',
    component: () => (
      <SimpleRetainerForm
        title="Probate Retainer Agreement"
        fields={[
          { key: 'Client_Name',    label: 'Client Name',      type: 'text', placeholder: 'e.g. Jane Doe' },
          { key: 'Decedent_Name',  label: "Decedent's Name",  type: 'plain', placeholder: 'e.g. John Doe' },
        ]}
        templateFile="probate_retainer.docx"
        filenamePrefix="Griffin_Probate"
      />
    ),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [version, setVersion] = useState('');

  useEffect(() => {
    window.electronAPI.getVersion().then(setVersion);
  }, []);

  const ActiveForm = TABS.find((t) => t.id === activeTab).component;

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-200 px-6 py-3 flex items-center gap-4 shadow-sm flex-shrink-0">
        <img src={logo} alt="Griffin Law Logo" className="h-10 w-auto" />
        <div className="flex flex-col">
          <span className="text-base font-bold text-amber-800 leading-tight">AHG Document Creation Tool</span>
          <span className="text-xs text-amber-600">Law Office of Andrew H. Griffin, III, APC</span>
        </div>
        {version && (
          <span className="ml-auto text-xs text-gray-400">v{version}</span>
        )}
      </header>

      {/* Tab bar — horizontally scrollable when tabs overflow */}
      <div className="bg-white border-b border-amber-200 px-6 flex gap-1 flex-shrink-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-amber-700 hover:border-amber-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active form */}
      <div className="flex-1 overflow-y-auto p-8">
        <ActiveForm />
      </div>
    </div>
  );
}
