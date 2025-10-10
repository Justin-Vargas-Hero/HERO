'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { searchTickers, getPopularTickers, TickerSymbol } from '@/data/ticker-database';
import { useRouter } from 'next/navigation';

// Clean company name helper
function cleanCompanyName(name: string): string {
  return name.replace(/\.(com|org|net|io|co|ai)$/i, '').trim();
}

interface TickerSearchProps {
  onSelectTicker?: (ticker: TickerSymbol) => void;
  className?: string;
  placeholder?: string;
}

export function TickerSearch({ 
  onSelectTicker, 
  className,
  placeholder = "Search stocks, crypto..."
}: TickerSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<TickerSymbol[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hero_recent_tickers');
    if (saved) {
      try {
        const searches = JSON.parse(saved) as string[];
        // Remove duplicates while preserving order (most recent first)
        const uniqueSearches = [...new Set(searches)];
        setRecentSearches(uniqueSearches);
        // Update localStorage to clean up any duplicates
        localStorage.setItem('hero_recent_tickers', JSON.stringify(uniqueSearches));
      } catch {}
    }
  }, []);

  // Handle search
  useEffect(() => {
    if (query.length > 0) {
      const searchResults = searchTickers(query, 8);
      setResults(searchResults);
      setSelectedIndex(0);
    } else {
      // Show popular/recent when no query
      if (recentSearches.length > 0) {
        const recentTickers = recentSearches
          .slice(0, 4)
          .map(symbol => searchTickers(symbol, 1)[0])
          .filter(Boolean);
        const popular = getPopularTickers(4);
        // Filter out duplicates between recent and popular
        const popularFiltered = popular.filter(p => !recentTickers.some(r => r.symbol === p.symbol));
        setResults([...recentTickers, ...popularFiltered].slice(0, 8));
      } else {
        setResults(getPopularTickers(8));
      }
      setSelectedIndex(0);
    }
  }, [query, recentSearches]);

  // Handle ticker selection - Navigate directly to ticker page
  const handleSelect = useCallback(async (ticker: TickerSymbol) => {
    // Remove any existing instance of this symbol from recent searches
    const filtered = recentSearches.filter(s => s !== ticker.symbol);
    // Add the new search to the front
    const updated = [ticker.symbol, ...filtered].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('hero_recent_tickers', JSON.stringify(updated));
    
    // Clear search
    setQuery('');
    setIsOpen(false);
    
    // Navigate directly to ticker page
    if (onSelectTicker) {
      onSelectTicker(ticker);
    } else {
      router.push(`/ticker/${ticker.symbol}`);
    }
  }, [recentSearches, onSelectTicker, router]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' && query) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, query, results, selectedIndex, handleSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className || ''}`}>
      {/* Search Bar - always fully rounded */}
      <div className="relative bg-hero-gray border border-gray-200 rounded-full">
        <div className="relative flex items-center h-10 px-4">
          <Search className="w-5 h-5 text-gray-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-500 font-inter"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition ml-2"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown - separate container */}
      {isOpen && (results.length > 0 || query.length > 0) && (
        <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-50">
          {/* Results */}
          <div className="max-h-96 overflow-y-auto bg-white">
            {/* Header for popular/recent */}
            {!query && (
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-inter">
                  {recentSearches.length > 0 ? (
                    <>
                      <Clock className="h-3 w-3" />
                      Recent & Popular
                    </>
                  ) : (
                    <>
                      Popular Tickers
                    </>
                  )}
                </div>
              </div>
            )}

            {results.map((ticker, index) => (
              <button
                key={ticker.symbol}
                onClick={() => handleSelect(ticker)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                  selectedIndex === index ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 font-manrope">{ticker.symbol}</span>
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-[300px] font-inter">
                      {cleanCompanyName(ticker.name)}
                    </div>
                  </div>
                </div>
                
                {/* Show if it's a recent search */}
                {recentSearches.includes(ticker.symbol) && (
                  <Clock className="h-3 w-3 text-gray-400" />
                )}
              </button>
            ))}

            {/* No results */}
            {query && results.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 bg-white font-inter">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results for "{query}"</p>
                <p className="text-xs mt-1">Try a different symbol or name</p>
              </div>
            )}
          </div>

          {/* Footer tip */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <p className="text-[10px] text-gray-500 text-center font-inter">
              Press ↑↓ to navigate, Enter to select, Esc to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}