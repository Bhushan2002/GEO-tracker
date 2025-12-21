'use client';

import { PromptAPI } from '@/api/prompt.api';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';

interface AddPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PromptFormData) => void;
}

interface PromptFormData {
  promptText: string;
  topic?: string;
  tags: string[];
 
}

export default function AddTopicDialog({ open, onOpenChange, onSubmit }: AddPromptDialogProps) {
  const [formData, setFormData] = useState<PromptFormData>({
    promptText: "",
    topic: '',
    tags: [],
  });

  const [loading,setLoading] = useState(false);
  const [error,setError] = useState<string | null> (null);

  const handleSubmit = async (e:React.FormEvent)=>{
    e.preventDefault();
    setError(null);
    if(!formData.topic?.trim()){
      setError("topic is required")
      return;
    }
    try{
      setLoading(true);

      await PromptAPI.create({
        promptText: formData.promptText,
        topic: formData.topic,
        tags: [...formData.tags],
     
      });
      setFormData({
      promptText:'',
      topic:'',
      tags:[]
    });
    onOpenChange(false);
    }catch(e: any){
       setError(e.response?.data?.message || "Failed to create topic");
    }finally{
      setLoading(false);
    }
    
  }

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
              <label htmlFor="Prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <input
                id="prompt"
                type="text"
                placeholder="e.g. what is the best insurance? "
                value={formData.promptText}
                onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                className="w-full px-4 py-3 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            {/* topic */}
            <div>
              <label htmlFor="Topic" className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <input
                id="topic"
                type="text"
                placeholder="No Topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-3 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                required
              />
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