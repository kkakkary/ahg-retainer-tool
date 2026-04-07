import React from 'react';
import ClientSection from './ClientSection';
import ContactSection from './ContactSection';
import FeesSection from './FeesSection';
import SignaturesSection from './SignaturesSection';

export default function FormPanel({ formData, onChange }) {
  return (
    <div className="space-y-8">
      <ClientSection formData={formData} onChange={onChange} />
      <hr className="border-gray-200" />
      <ContactSection formData={formData} onChange={onChange} />
      <hr className="border-gray-200" />
      <FeesSection formData={formData} onChange={onChange} />
      <hr className="border-gray-200" />
      <SignaturesSection formData={formData} onChange={onChange} />
    </div>
  );
}
