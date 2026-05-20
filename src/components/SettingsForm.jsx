import React, { useState, useEffect } from 'react';

export default function SettingsForm() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI.getGeminiKey().then((key) => {
      if (key) setApiKey(key);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await window.electronAPI.setGeminiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = async () => {
    setApiKey('');
    await window.electronAPI.setGeminiKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return null;

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Settings</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Configuration for AI-powered features.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Gemini API Key
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            Used to scan credit reports. Stored encrypted on this machine and never transmitted elsewhere.
            Get a key at <span className="font-mono">aistudio.google.com</span>.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
            placeholder="Paste your Gemini API key here"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-4 py-2 text-sm font-medium rounded-md bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Save Key
          </button>
          {apiKey && (
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">Saved.</span>
          )}
        </div>
      </div>
    </div>
  );
}
