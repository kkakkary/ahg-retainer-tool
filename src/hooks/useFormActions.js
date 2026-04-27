import { useState, useEffect, useRef } from 'react';

export default function useFormActions() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(null);
  const [savedFilePath, setSavedFilePath] = useState(null);
  const firstInputRef = useRef(null);

  // Auto-focus first input on mount
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Auto-dismiss success status after 8 seconds
  useEffect(() => {
    if (statusType === 'success') {
      const timer = setTimeout(() => {
        setStatusMessage('');
        setStatusType(null);
        setSavedFilePath(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [statusType]);

  function clearStatus() {
    setStatusMessage('');
    setStatusType(null);
    setSavedFilePath(null);
    setPreviewPdf(null);
  }

  async function runPreview(buildPayload, templateFile) {
    setIsPreviewing(true);
    try {
      const result = await window.electronAPI.generatePreview({ formData: buildPayload(), templateFile });
      if (result.pdfBase64) setPreviewPdf(result.pdfBase64);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function runGenerate(buildPayload, templateFile, filenamePrefix, onGenerated, extraOpts) {
    setIsGenerating(true);
    setStatusMessage('');
    setStatusType(null);
    try {
      const result = await window.electronAPI.generateDocument({
        formData: buildPayload(),
        templateFile,
        filenamePrefix,
        ...extraOpts,
      });

      if (result.success) {
        setStatusMessage('Document saved successfully.');
        setStatusType('success');
        setSavedFilePath(result.filePath);
        if (onGenerated) onGenerated();
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

  function makeKeyDownHandler(isDisabled, handleGenerate) {
    return function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isDisabled) {
        e.preventDefault();
        handleGenerate();
      }
    };
  }

  return {
    isGenerating,
    isPreviewing,
    previewPdf,
    statusMessage,
    statusType,
    savedFilePath,
    firstInputRef,
    clearStatus,
    runPreview,
    runGenerate,
    makeKeyDownHandler,
  };
}
