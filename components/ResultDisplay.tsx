import React from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { Button } from './Button';

interface ResultDisplayProps {
  result: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple parser to make markdown-like text look decent without a heavy library
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('## ')) return <h3 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.replace('## ', '')}</h3>;
      if (line.startsWith('### ')) return <h4 key={index} className="text-lg font-semibold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h4>;
      
      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <li key={index} className="ml-4 pl-1 text-gray-700 mb-1 list-disc">
            {line.trim().substring(2).split('**').map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : part
            )}
          </li>
        );
      }

      // Bold text handling within paragraphs
      const parts = line.split('**');
      return (
        <p key={index} className={`mb-2 text-gray-700 leading-relaxed ${line.trim() === '' ? 'h-2' : ''}`}>
          {parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden mt-8 animate-fade-in-up">
      <div className="bg-indigo-50/50 border-b border-indigo-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-indigo-900">Analysis Results</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCopy}
          className="text-indigo-600 hover:bg-indigo-100"
        >
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="p-6 md:p-8 bg-white min-h-[200px]">
        <div className="prose prose-indigo max-w-none">
          {renderContent(result)}
        </div>
      </div>
    </div>
  );
};