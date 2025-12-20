'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';

interface AddTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TopicFormData) => void;
}
interface TopicFormData {
  topic: string;
  promptsPerTopic: number;
  ipAddress: string;
  language: string;
}

const countries = [
  { value: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'us', label: 'United States', flag: '🇺🇸' },
  { value: 'ca', label: 'Canada', flag: '🇨🇦' },
  { value: 'au', label: 'Australia', flag: '🇦🇺' },
  { value: 'in', label: 'India', flag: '🇮🇳' },
];

const languages = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'hindi', label: 'Hindi' },
];
export default function AddTopicDialog({ open, onOpenChange, onSubmit }: AddTopicDialogProps) {
  const [formData, setFormData] = useState<TopicFormData>({
    topic: '',
    promptsPerTopic: 10,
    ipAddress: 'uk',
    language: 'english',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form
    setFormData({
      topic: '',
      promptsPerTopic: 10,
      ipAddress: 'uk',
      language: 'english',
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[600px] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Add new Topic
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-1">
                Create a Topic without mentioning your own brand. Every topic will have prompts
              </Dialog.Description>
            </div>
            
            <Dialog.Close className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
            
            {/* Topic Input */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <input
                id="topic"
                type="text"
                placeholder="e.g. SEO optimization"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-3 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Prompts per topic */}
            <div>
              <label htmlFor="prompts" className="block text-sm font-medium text-gray-700 mb-2">
                Prompts per topic
              </label>
              <input
                id="prompts"
                type="number"
                value={formData.promptsPerTopic}
                onChange={(e) => setFormData({ ...formData, promptsPerTopic: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                min="1"
                max="100"
                required
              />
            </div>

            {/* IP Address Dropdown */}
            <div>
              <label htmlFor="ip" className="block text-sm font-medium text-gray-700 mb-2">
                IP address
              </label>
              <div className="relative">
                <select
                  id="ip"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 appearance-none cursor-pointer"
                >
                  {countries.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.flag} {country.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Language Dropdown */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <div className="relative">
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 appearance-none cursor-pointer"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Add Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
              >
                <span className="text-lg">+</span>
                Add
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}