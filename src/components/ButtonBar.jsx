import React from 'react';
import Spinner from './Spinner';
import { previewBtnClass, generateBtnClass } from '../styles/formClasses';

export default function ButtonBar({ onPreview, onGenerate, onClear, isPreviewing, isGenerating, isDisabled, statusMessage, statusType, savedFilePath }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={onPreview}
        disabled={isPreviewing || isDisabled}
        className={previewBtnClass}
      >
        {isPreviewing ? <><Spinner /> Preview</> : 'Preview'}
      </button>
      <button
        onClick={onGenerate}
        disabled={isDisabled}
        className={generateBtnClass}
      >
        {isGenerating ? <><Spinner /> Generating…</> : 'Generate Document'}
      </button>
      <button
        onClick={onClear}
        className="text-sm text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
      >
        Clear
      </button>
      {statusMessage && (
        <span className={`text-sm transition-opacity duration-300 ${statusType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {statusMessage}
        </span>
      )}
      {savedFilePath && statusType === 'success' && (
        <button
          onClick={() => window.electronAPI.showInFolder(savedFilePath)}
          className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 underline cursor-pointer"
        >
          Show in Finder
        </button>
      )}
    </div>
  );
}
