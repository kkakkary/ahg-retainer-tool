import React, { useState } from 'react';
import Ch7RetainerForm from './components/Ch7RetainerForm';
import BkEstimateForm from './components/BkEstimateForm';
import logo from './assets/logo.png';

const TABS = [
  { id: 'ch7',         label: 'Ch. 7 Retainer',  component: Ch7RetainerForm },
  { id: 'bk_estimate', label: 'BK Fee Estimate',  component: BkEstimateForm },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

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
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-amber-200 px-6 flex gap-1 flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
