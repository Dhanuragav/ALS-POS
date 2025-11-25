import React, { useMemo, useState } from 'react';
import { Category, MenuItem } from '../types';
import { Plus, Search, X } from 'lucide-react';

interface MenuGridProps {
  items: MenuItem[];
  onAddItem: (item: MenuItem) => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({ items, onAddItem }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.MEALS);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = Object.values(Category);
  
  const filteredItems = useMemo(() => {
    if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase().trim();
        const queryTokens = lowerQuery.split(/\s+/).filter(Boolean); // Split by space

        return items.filter(i => {
            const name = i.name.toLowerCase();
            const code = (i.shortCode || '').toLowerCase();
            
            // "Fuzzy-ish" Match: Check if ALL tokens from the query exist in Name OR Code
            // This allows "Idly Sam" to match "Mini Idli Sambar" (assuming 'idli' contains 'idly' or similar logic, but simple substring is safer for now)
            // We stick to exact substring token matching for reliability
            
            const nameMatches = queryTokens.every(token => name.includes(token));
            const codeMatches = queryTokens.every(token => code.includes(token));
            
            return nameMatches || codeMatches;
        });
    }
    return items.filter(i => i.category === selectedCategory);
  }, [items, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text"
                placeholder="Search items (e.g. 'Idly', 'Dosa Masala')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm font-medium"
            />
            {searchQuery && (
                <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                    <X size={16} />
                </button>
            )}
          </div>
      </div>

      {/* Category Tabs - Hide when searching */}
      {!searchQuery && (
        <div className="flex overflow-x-auto p-2 bg-gray-50 border-b border-gray-200 no-scrollbar space-x-2">
            {categories.map(cat => (
            <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
            >
                {cat}
            </button>
            ))}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Search size={48} className="mb-2 opacity-20" />
                <p>No items found</p>
                {searchQuery && <button onClick={() => setSearchQuery('')} className="text-emerald-600 text-sm mt-2 hover:underline">Clear Search</button>}
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map(item => (
                <button
                key={item.id}
                onClick={() => onAddItem(item)}
                className="flex flex-col p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all text-left group active:scale-95 relative overflow-hidden"
                >
                <div className="flex justify-between items-start w-full mb-2">
                    <span className="font-semibold text-gray-800 line-clamp-1 group-hover:text-emerald-700" title={item.name}>{item.name}</span>
                    <span className="text-emerald-600 font-bold text-sm">₹{item.price}</span>
                </div>
                {item.shortCode && (
                    <div className="mb-2">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.shortCode}</span>
                    </div>
                )}
                <div className="mt-auto flex items-center text-xs text-gray-400">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mr-2 group-hover:bg-emerald-100 transition-colors">
                        <Plus size={14} />
                    </div>
                    Add to bill
                </div>
                </button>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default MenuGrid;