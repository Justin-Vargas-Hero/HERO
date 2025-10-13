'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';

interface InfoTooltipProps {
  content: string;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        aria-label="More information"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isVisible && (
        <div className="absolute z-50 w-64 p-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg left-full ml-2 top-1/2 -translate-y-1/2">
          {/* Arrow pointing left to the icon */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2">
            {/* Border arrow */}
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-gray-200 border-b-[6px] border-b-transparent"></div>
            {/* White fill arrow (1px offset to cover the border) */}
            <div className="absolute -right-[5px] -top-[6px] w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-white border-b-[6px] border-b-transparent"></div>
          </div>

          <p className="font-inter text-xs leading-relaxed">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}