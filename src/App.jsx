import React, { useState, useEffect, useRef, useCallback } from 'react';
// Ch7 uses SimpleRetainerForm inline (like all other simple forms)
import EstimateForm from './components/EstimateForm';
import SimpleRetainerForm from './components/SimpleRetainerForm';
import UDRetainerForm from './components/UDRetainerForm';
import LettersToCreditorsForm from './components/LettersToCreditorsForm';
import SettingsForm from './components/SettingsForm';
import logo from './assets/logo.png';

const RETAINER_TABS = [
  // ── BK Fee Estimate ────────────────────────────────────────────────────────
  {
    id: 'bk_estimate',
    label: 'BK Fee Estimate',
    component: (props) => (
      <EstimateForm
        title="Bankruptcy Fee Estimate"
        baseFee={2333.00}
        baseFeeLabel="Base Fee"
        templateFile="bk_estimate.docx"
        filenamePrefix="Griffin_BkEstimate"
        showDiscountedFee
        allowNameToggle
        {...props}
      />
    ),
  },

  // ── Ch. 7 Retainer (original component) ───────────────────────────────────
  {
    id: 'ch7',
    label: 'Ch. 7 Retainer',
    component: (props) => (
      <SimpleRetainerForm
        title="Chapter 7 Retainer Agreement"
        fields={[
          { key: 'Client_Name',    label: 'Client Name',    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',   type: 'currency', placeholder: 'e.g. 2,433.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee', type: 'currency', placeholder: 'e.g. 2,333.00' },
        ]}
        templateFile="ch7_retainer.docx"
        filenamePrefix="Griffin_Ch7Retainer"
        allowNameToggle
        {...props}
      />
    ),
  },

  // ── Business Ch7 ───────────────────────────────────────────────────────────
  {
    id: 'biz_ch7',
    label: 'Business Ch7',
    component: (props) => (
      <SimpleRetainerForm
        title="Business Chapter 7 Retainer Agreement"
        fields={[
          { key: 'Client_Name',    label: 'Business Name',   type: 'text',     placeholder: 'e.g. Acme LLC' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',    type: 'currency',  placeholder: 'e.g. 2,433.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee',  type: 'currency',  placeholder: 'e.g. 2,333.00' },
        ]}
        templateFile="biz_ch7_retainer.docx"
        filenamePrefix="Griffin_BizCh7Retainer"
        isBusinessName
        allowNameToggle
        {...props}
      />
    ),
  },

  // ── Ch. 11 Retainer ────────────────────────────────────────────────────────
  {
    id: 'ch11',
    label: 'Ch. 11 Retainer',
    component: (props) => (
      <SimpleRetainerForm
        title="Chapter 11 Retainer Agreement"
        fields={[
          { key: 'Client_Name',  label: 'Client Name',  type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Attorney_Fee', label: 'Attorney Fee', type: 'currency', placeholder: 'e.g. 10,000.00' },
        ]}
        templateFile="ch11_retainer.docx"
        filenamePrefix="Griffin_Ch11Retainer"
        allowNameToggle
      {...props}
      />
    ),
  },

  // ── Spanish Ch. 7 ──────────────────────────────────────────────────────────
  {
    id: 'spanish_ch7',
    label: 'Spanish Ch. 7',
    component: (props) => (
      <SimpleRetainerForm
        title="Chapter 7 Retainer Agreement (Spanish)"
        fields={[
          { key: 'Client_Name',    label: 'Client Name',    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',   type: 'currency',  placeholder: 'e.g. 2,433.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee', type: 'currency',  placeholder: 'e.g. 2,333.00' },
        ]}
        templateFile="spanish_ch7_retainer.docx"
        filenamePrefix="Griffin_SpanishCh7"
        allowNameToggle
      {...props}
      />
    ),
  },

  // ── Ch. 13 Estimate ────────────────────────────────────────────────────────
  {
    id: 'ch13_estimate',
    label: 'Ch. 13 Estimate',
    component: (props) => (
      <EstimateForm
        title="Chapter 13 Estimate — Central District"
        baseFee={1995.00}
        baseFeeLabel="Base Fee"
        templateFile="ch13_estimate.docx"
        filenamePrefix="Griffin_Ch13Estimate"
        showDiscountedFee={false}
        allowNameToggle
        {...props}
      />
    ),
  },

  // ── Ch. 13 Central (Consumer) ──────────────────────────────────────────────
  {
    id: 'ch13_central_consumer',
    label: 'Ch. 13 Central (Consumer)',
    component: (props) => (
      <SimpleRetainerForm
        title="Chapter 13 Retainer Agreement — Central District (Consumer)"
        fields={[
          { key: 'Client_Name',    label: 'Client Name',    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',   type: 'currency',  placeholder: 'e.g. 4,000.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee', type: 'currency',  placeholder: 'e.g. 3,500.00' },
        ]}
        templateFile="ch13_central_consumer_retainer.docx"
        filenamePrefix="Griffin_Ch13CentralConsumer"
      {...props}
      />
    ),
  },

  // ── Ch. 13 South (Consumer) ────────────────────────────────────────────────
  {
    id: 'ch13_south_consumer',
    label: 'Ch. 13 South (Consumer)',
    component: (props) => (
      <SimpleRetainerForm
        title="Chapter 13 Retainer Agreement — Southern District (Consumer)"
        fields={[
          { key: 'Client_Name',    label: 'Client Name',    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',   type: 'currency',  placeholder: 'e.g. 4,000.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee', type: 'currency',  placeholder: 'e.g. 3,500.00' },
        ]}
        templateFile="ch13_south_consumer_retainer.docx"
        filenamePrefix="Griffin_Ch13SouthConsumer"
      {...props}
      />
    ),
  },

  // ── Ch. 13 South (Business) ────────────────────────────────────────────────
  {
    id: 'ch13_south_business',
    label: 'Ch. 13 South (Business)',
    component: (props) => (
      <SimpleRetainerForm
        title="Chapter 13 Retainer Agreement — Southern District (Business)"
        fields={[
          { key: 'Client_Name',    label: 'Business Name',  type: 'text',     placeholder: 'e.g. Acme LLC' },
          { key: 'Attorney_Fee',   label: 'Attorney Fee',   type: 'currency',  placeholder: 'e.g. 4,000.00' },
          { key: 'Discounted_Fee', label: 'Discounted Fee', type: 'currency',  placeholder: 'e.g. 3,500.00' },
        ]}
        templateFile="ch13_south_business_retainer.docx"
        filenamePrefix="Griffin_Ch13SouthBusiness"
        isBusinessName
      {...props}
      />
    ),
  },

  // ── Civil - Hourly (Litigation) ────────────────────────────────────────────
  {
    id: 'civil_hourly_lit',
    label: 'Civil - Hourly (Lit)',
    component: (props) => (
      <SimpleRetainerForm
        title="Civil Retainer Agreement — Hourly (Litigation)"
        fields={[
          { key: 'Client_Name',         label: 'Client Name',                    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Matter_Description',  label: 'Scope of Work',                  type: 'textarea', placeholder: 'e.g. Defense of breach of contract claim' },
          { key: 'Contract_Date',       label: 'Contract Date',                  type: 'plain',    placeholder: 'e.g. April 16, 2026' },
          { key: 'Hourly_Rate',         label: 'Hourly Rate',                    type: 'currency', placeholder: 'e.g. 350.00' },
          { key: 'Retainer_Amount',     label: 'Initial Retainer',               type: 'currency', placeholder: 'e.g. 5,000.00' },
          { key: 'Retainer_Replenish',  label: 'Replenish Retainer When Below',  type: 'currency', placeholder: 'e.g. 1,000.00' },
          { key: 'Due_Date',            label: 'Deposit Due Date',               type: 'plain',    placeholder: 'e.g. April 30, 2026' },
        ]}
        templateFile="civil_hourly_lit_retainer.docx"
        filenamePrefix="Griffin_CivilHourlyLit"
        allowNameToggle
      {...props}
      />
    ),
  },

  // ── Civil - Hourly (Non-Lit) ───────────────────────────────────────────────
  {
    id: 'civil_hourly_nonlit',
    label: 'Civil - Hourly (Non-Lit)',
    component: (props) => (
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
        allowNameToggle
      {...props}
      />
    ),
  },

  // ── Civil - Flat Fee ───────────────────────────────────────────────────────
  {
    id: 'civil_flat_fee',
    label: 'Civil - Flat Fee',
    component: (props) => (
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
        allowNameToggle
      {...props}
      />
    ),
  },

  // ── Civil - Contingency ────────────────────────────────────────────────────
  {
    id: 'civil_contingency',
    label: 'Civil - Contingency',
    component: (props) => (
      <SimpleRetainerForm
        title="Civil Retainer Agreement — Contingency"
        fields={[
          { key: 'Client_Name',      label: 'Client Name',        type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Case_Description', label: 'Scope of Work',        type: 'textarea', placeholder: 'e.g. Automobile Accident that occurred on...' },
          { key: 'Case_Date',        label: 'Date of Incident',    type: 'plain',    placeholder: 'e.g. November 24, 2020' },
          { key: 'Cost_Deposit',     label: 'Initial Cost Deposit', type: 'currency', placeholder: 'e.g. 500.00' },
        ]}
        templateFile="civil_contingency_retainer.docx"
        filenamePrefix="Griffin_CivilContingency"
        allowNameToggle
      {...props}
      />
    ),
  },

  // ── Family Law ─────────────────────────────────────────────────────────────
  {
    id: 'family_law',
    label: 'Family Law',
    component: (props) => (
      <SimpleRetainerForm
        title="Family Law Retainer Agreement"
        fields={[
          { key: 'Client_Name',        label: 'Client Name',                    type: 'text',     placeholder: 'e.g. Jane Doe' },
          { key: 'Matter_Description', label: 'Scope of Work',                  type: 'textarea', placeholder: 'e.g. Dissolution of Marriage' },
          { key: 'Hourly_Rate',        label: 'Hourly Rate',                    type: 'currency', placeholder: 'e.g. 350.00' },
          { key: 'Retainer_Amount',    label: 'Initial Retainer',               type: 'currency', placeholder: 'e.g. 5,000.00' },
          { key: 'Retainer_Replenish', label: 'Replenish Retainer When Below',  type: 'currency', placeholder: 'e.g. 1,000.00' },
          { key: 'Effective_Date',     label: 'Effective Date',                 type: 'plain',    placeholder: 'e.g. April 7, 2026' },
        ]}
        templateFile="family_law_retainer.docx"
        filenamePrefix="Griffin_FamilyLaw"
      {...props}
      />
    ),
  },

  // ── Unlawful Detainer ──────────────────────────────────────────────────────
  {
    id: 'ud',
    label: 'UD',
    component: UDRetainerForm,
  },

  // ── Probate ────────────────────────────────────────────────────────────────
  {
    id: 'probate',
    label: 'Probate',
    component: (props) => (
      <SimpleRetainerForm
        title="Probate Retainer Agreement"
        fields={[
          { key: 'Client_Name',    label: 'Client Name',      type: 'text', placeholder: 'e.g. Jane Doe' },
          { key: 'Decedent_Name',  label: "Decedent's Name",  type: 'plain', placeholder: 'e.g. John Doe' },
        ]}
        templateFile="probate_retainer.docx"
        filenamePrefix="Griffin_Probate"
        allowNameToggle
      {...props}
      />
    ),
  },

];

const LETTER_TABS = [
  {
    id: 'letters_to_creditors',
    label: 'Letters to Creditors',
    component: LettersToCreditorsForm,
  },
];

const ALL_TABS = [...RETAINER_TABS, ...LETTER_TABS];

export default function App() {
  const [activeTab, setActiveTab] = useState(RETAINER_TABS[0].id);
  const [version, setVersion] = useState('');
  const [formStates, setFormStates] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    window.electronAPI.getVersion().then(setVersion);
    window.electronAPI.getHistory().then(setHistory);
    window.electronAPI.getConfig('darkMode').then((v) => { if (v) setDarkMode(true); });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    window.electronAPI.setConfig('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const label = ALL_TABS.find((t) => t.id === activeTab)?.label || '';
    window.electronAPI.setTitle(`AHG Document Creation Tool — ${label}`);
  }, [activeTab]);

  const updateFormState = (tabId, data) => {
    setFormStates((prev) => ({ ...prev, [tabId]: data }));
  };

  const refreshHistory = () => {
    window.electronAPI.getHistory().then(setHistory);
  };

  const tabBarRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = tabBarRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scrollTabs = (dir) => {
    const el = tabBarRef.current;
    if (el) el.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  const activeTabConfig = ALL_TABS.find((t) => t.id === activeTab);
  const ActiveForm = activeTabConfig.component;

  return (
    <div className="flex flex-col h-screen bg-stone-200 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-slate-800 px-6 py-3 flex items-center gap-4 shadow-md flex-shrink-0">
        <img src={logo} alt="Griffin Law Logo" className="h-10 w-auto brightness-200" />
        <div className="flex flex-col">
          <span className="text-base font-bold text-white leading-tight">AHG Document Creation Tool</span>
          <span className="text-xs text-slate-300">Law Office of Andrew H. Griffin, III, APC</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) setShowSettings(false); refreshHistory(); }}
            className="text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {showHistory ? 'Hide History' : 'Recent Documents'}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀ Light' : '☾ Dark'}
          </button>
          <button
            onClick={() => { setShowSettings(!showSettings); if (!showSettings) setShowHistory(false); }}
            className={`text-xs transition-colors cursor-pointer ${showSettings ? 'text-amber-400' : 'text-slate-300 hover:text-white'}`}
          >
            Settings
          </button>
          {version && (
            <span className="text-xs text-slate-400">v{version}</span>
          )}
        </div>
      </header>

      {/* Retainer forms tab bar */}
      <div className="bg-slate-700 flex-shrink-0 flex items-center relative">
        {canScrollLeft && (
          <button
            onClick={() => scrollTabs(-1)}
            aria-label="Scroll tabs left"
            className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-slate-700 via-slate-700 to-transparent text-slate-400 hover:text-white"
          >
            &#8249;
          </button>
        )}
        <div
          ref={tabBarRef}
          onScroll={checkScroll}
          className="flex gap-1 px-6 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {RETAINER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scrollTabs(1)}
            aria-label="Scroll tabs right"
            className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-slate-700 via-slate-700 to-transparent text-slate-400 hover:text-white"
          >
            &#8250;
          </button>
        )}
      </div>

      {/* Letters / documents tab bar */}
      <div className="bg-slate-600 flex-shrink-0 flex items-center px-6 border-t border-slate-500">
        {LETTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-amber-400 text-white'
                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings panel */}
      <div className={`bg-white dark:bg-gray-800 border-b border-stone-200 dark:border-gray-700 px-6 flex-shrink-0 transition-all duration-200 ease-in-out overflow-hidden ${showSettings ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0 border-b-0'}`}>
        <SettingsForm />
      </div>

      {/* History panel */}
      <div className={`bg-white dark:bg-gray-800 border-b border-stone-200 dark:border-gray-700 px-6 flex-shrink-0 transition-all duration-200 ease-in-out overflow-hidden ${showHistory ? 'max-h-56 py-3 opacity-100' : 'max-h-0 py-0 opacity-0 border-b-0'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Documents</span>
            {history.length > 0 && (
              <button
                onClick={() => { if (window.confirm('Clear all document history?')) { window.electronAPI.clearHistory(); setHistory([]); } }}
                className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-gray-400">No documents generated yet.</p>
          ) : (
            <div className="space-y-1">
              {history.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex gap-3">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{item.clientName}</span>
                    <span className="text-gray-400">{item.formType}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                    <button
                      onClick={() => window.electronAPI.openFile(item.filePath)}
                      className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 underline cursor-pointer"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => window.electronAPI.showInFolder(item.filePath)}
                      className="text-gray-400 hover:text-gray-600 underline cursor-pointer"
                    >
                      Reveal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Active form */}
      <div className="flex-1 overflow-y-auto p-8">
        <ActiveForm
          key={activeTab}
          savedFormData={formStates[activeTab]}
          onFormChange={(data) => updateFormState(activeTab, data)}
          onGenerated={refreshHistory}
        />
      </div>
    </div>
  );
}
