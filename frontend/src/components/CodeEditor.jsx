import React from 'react';

const CodeEditor = ({ value, onChange, language, onLanguageChange }) => {
  const languages = ['javascript', 'python', 'cpp'];
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex space-x-1">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === lang
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'C++'}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400 font-mono uppercase tracking-wider">
          {language}
        </div>
      </div>
      
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck="false"
          className="w-full h-full p-4 font-mono text-sm bg-white focus:outline-none resize-none leading-relaxed"
          placeholder="// Write your solution here..."
        />
      </div>
    </div>
  );
};

export default CodeEditor;
