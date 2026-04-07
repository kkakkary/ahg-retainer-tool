import React, { useState } from 'react';

const defaultFormData = {
  Client_Name: '',
  Attorney_Fee: '',
  Discounted_Fee: '',
};

export default function Ch7RetainerForm() {
  const [formData, setFormData] = useState(defaultFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(null);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setStatusMessage('');
    setStatusType(null);
    try {
      // Prepend $ to fee fields before sending to main process
      const payload = {
        ...formData,
        Attorney_Fee: formData.Attorney_Fee ? `$${formData.Attorney_Fee}` : '',
        Discounted_Fee: formData.Discounted_Fee ? `$${formData.Discounted_Fee}` : '',
      };
      const result = await window.electronAPI.generateDocument({
        formData: payload,
        templateFile: 'ch7_retainer.docx',
        filenamePrefix: 'Griffin_Ch7Retainer',
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
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-lg space-y-6">
        <h2 className="text-base font-semibold text-amber-800">Chapter 7 Retainer Agreement</h2>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Client Name</label>
          <input
            type="text"
            value={formData.Client_Name}
            onChange={(e) => handleChange('Client_Name', e.target.value)}
            placeholder="e.g. Jane Doe"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Attorney Fee</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              value={formData.Attorney_Fee}
              onChange={(e) => handleChange('Attorney_Fee', e.target.value)}
              placeholder="e.g. 2,433.00"
              className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Discounted Fee</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              value={formData.Discounted_Fee}
              onChange={(e) => handleChange('Discounted_Fee', e.target.value)}
              placeholder="e.g. 2,333.00"
              className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !formData.Client_Name.trim()}
          className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
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
  );
}
