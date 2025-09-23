'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, Filter } from 'lucide-react';

// Fuzzy search utility function
function fuzzySearch(query: string, text: string): { score: number; matches: number[] } {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  let score = 0;
  let matches: number[] = [];
  let queryIndex = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      matches.push(i);
      score += 1;
      queryIndex++;
    }
  }

  // Bonus for exact substring matches
  if (textLower.includes(queryLower)) {
    score += queryLower.length * 2;
  }

  // Bonus for matches at word boundaries
  const words = textLower.split(' ');
  words.forEach(word => {
    if (word.startsWith(queryLower)) {
      score += queryLower.length;
    }
  });

  return {
    score: queryIndex === queryLower.length ? score : 0,
    matches
  };
}

// Levenshtein distance for spell correction
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  tags: string[];
  price: number;
}

interface SearchSuggestion {
  type: 'product' | 'brand' | 'category' | 'filter' | 'history' | 'popular';
  value: string;
  label: string;
  score: number;
  matches?: number[];
  meta?: string;
  action?: () => void;
}

interface SmartSearchProps {
  products: Product[];
  onSearch: (query: string) => void;
  onFilterSuggestion?: (filterType: string, value: string) => void;
  placeholder?: string;
  className?: string;
}

const POPULAR_SEARCHES = [
  'Air Jordan',
  'Nike Dunk',
  'Yeezy',
  'Air Force 1',
  'Chuck Taylor',
  'Basketball shoes',
  'White sneakers',
  'Running shoes'
];

export default function SmartSearch({
  products,
  onSearch,
  onFilterSuggestion,
  placeholder = "Search sneakers, brands, or categories...",
  className = ""
}: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sneaker-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse search history');
      }
    }
  }, []);

  // Generate suggestions based on query
  const generateSuggestions = useMemo(() => {
    if (!query.trim()) {
      // Show popular searches and history when no query
      const suggestions: SearchSuggestion[] = [];

      // Add search history
      searchHistory.slice(0, 3).forEach(historyItem => {
        suggestions.push({
          type: 'history',
          value: historyItem,
          label: historyItem,
          score: 0,
          meta: 'Recent search'
        });
      });

      // Add popular searches
      POPULAR_SEARCHES.slice(0, 5).forEach(popular => {
        if (!searchHistory.includes(popular)) {
          suggestions.push({
            type: 'popular',
            value: popular,
            label: popular,
            score: 0,
            meta: 'Popular search'
          });
        }
      });

      return suggestions;
    }

    const queryLower = query.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Search products
    products.forEach(product => {
      const nameResult = fuzzySearch(query, product.name);
      if (nameResult.score > 0) {
        suggestions.push({
          type: 'product',
          value: product.name,
          label: product.name,
          score: nameResult.score,
          matches: nameResult.matches,
          meta: `${product.brand} • $${product.price}`
        });
      }

      // Search tags
      product.tags.forEach(tag => {
        const tagResult = fuzzySearch(query, tag);
        if (tagResult.score > 0) {
          suggestions.push({
            type: 'filter',
            value: tag,
            label: tag,
            score: tagResult.score,
            matches: tagResult.matches,
            meta: 'Tag',
            action: () => onFilterSuggestion?.('tags', tag)
          });
        }
      });
    });

    // Search brands
    const brands = Array.from(new Set(products.map(p => p.brand)));
    brands.forEach(brand => {
      const brandResult = fuzzySearch(query, brand);
      if (brandResult.score > 0) {
        suggestions.push({
          type: 'brand',
          value: brand,
          label: brand,
          score: brandResult.score,
          matches: brandResult.matches,
          meta: 'Brand',
          action: () => onFilterSuggestion?.('brands', brand)
        });
      }
    });

    // Search categories
    const categories = Array.from(new Set(products.map(p => p.category)));
    categories.forEach(category => {
      const categoryResult = fuzzySearch(query, category);
      if (categoryResult.score > 0) {
        suggestions.push({
          type: 'category',
          value: category,
          label: category,
          score: categoryResult.score,
          matches: categoryResult.matches,
          meta: 'Category',
          action: () => onFilterSuggestion?.('category', category)
        });
      }
    });

    // Spell correction for brands and popular terms
    const allTerms = [...brands, ...categories, ...POPULAR_SEARCHES];
    allTerms.forEach(term => {
      const distance = levenshteinDistance(queryLower, term.toLowerCase());
      if (distance <= 2 && distance > 0 && term.toLowerCase() !== queryLower) {
        suggestions.push({
          type: 'popular',
          value: term,
          label: term,
          score: 10 - distance,
          meta: `Did you mean "${term}"?`
        });
      }
    });

    // Sort by score and remove duplicates
    return suggestions
      .sort((a, b) => b.score - a.score)
      .filter((suggestion, index, self) =>
        index === self.findIndex(s => s.value === suggestion.value && s.type === suggestion.type)
      )
      .slice(0, 8);
  }, [query, products, searchHistory, onFilterSuggestion]);

  // Update suggestions when query changes
  useEffect(() => {
    setSuggestions(generateSuggestions);
    setSelectedIndex(-1);
  }, [generateSuggestions]);

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(true);
    onSearch(value);
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    } else {
      setQuery(suggestion.value);
      onSearch(suggestion.value);
      addToHistory(suggestion.value);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Add to search history
  const addToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('sneaker-search-history', JSON.stringify(newHistory));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex]);
        } else if (query.trim()) {
          addToHistory(query);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

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

  // Highlight matching characters
  const highlightMatches = (text: string, matches?: number[]) => {
    if (!matches || matches.length === 0) return text;

    const chars = text.split('');
    return chars.map((char, index) => (
      <span
        key={index}
        className={matches.includes(index) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : ''}
      >
        {char}
      </span>
    ));
  };

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'history':
        return <Clock className="w-4 h-4 text-slate-400" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4 text-slate-400" />;
      case 'brand':
      case 'category':
      case 'filter':
        return <Filter className="w-4 h-4 text-slate-400" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-slate-100 dark:hover:bg-slate-600 rounded-r-xl transition-colors"
          >
            <X className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-auto"
          >
            {!query.trim() && (
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {searchHistory.length > 0 ? 'Recent searches' : 'Popular searches'}
                </span>
              </div>
            )}

            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={`${suggestion.type}-${suggestion.value}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => selectSuggestion(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors ${
                    selectedIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  {getSuggestionIcon(suggestion.type)}

                  <div className="flex-1 min-w-0">
                    <div className="text-slate-900 dark:text-white font-medium truncate">
                      {suggestion.matches && suggestion.matches.length > 0
                        ? highlightMatches(suggestion.label, suggestion.matches)
                        : suggestion.label
                      }
                    </div>
                    {suggestion.meta && (
                      <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {suggestion.meta}
                      </div>
                    )}
                  </div>

                  {suggestion.action && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Filter
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}