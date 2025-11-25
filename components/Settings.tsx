import React, { useState } from 'react';
import { MenuItem, Category } from '../types';
import { Save, Trash2, Plus, Edit2, X } from 'lucide-react';
import * as db from '../services/storage';

interface SettingsProps {
  menuItems: MenuItem[];
  onUpdateMenu: (items: MenuItem[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ menuItems, onUpdateMenu }) => {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleSave = () => {
    if (!editingItem.name || !editingItem.price || !editingItem.category) {
        alert("Name, Price and Category are required");
        return;
    }

    let newItems;
    if (editingItem.id) {
        // Edit existing
        newItems = items.map(i => i.id === editingItem.id ? { ...i, ...editingItem } as MenuItem : i);
    } else {
        // Add new
        const newItem: MenuItem = {
            id: crypto.randomUUID(),
            name: editingItem.name,
            price: Number(editingItem.price),
            category: editingItem.category,
            shortCode: editingItem.shortCode
        };
        newItems = [...items, newItem];
    }

    setItems(newItems);
    db.saveMenu(newItems);
    onUpdateMenu(newItems);
    setIsModalOpen(false);
    setEditingItem({});
  };

  const handleDelete = (id: string) => {
      if(confirm("Are you sure you want to delete this item?")) {
          const newItems = items.filter(i => i.id !== id);
          setItems(newItems);
          db.saveMenu(newItems);
          onUpdateMenu(newItems);
      }
  };

  const openEdit = (item: MenuItem) => {
      setEditingItem(item);
      setIsModalOpen(true);
  };

  const openAdd = () => {
      setEditingItem({ category: Category.MEALS });
      setIsModalOpen(true);
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.shortCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <button 
            onClick={openAdd}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700"
        >
            <Plus size={20} />
            <span>Add Item</span>
        </button>
      </div>

      <div className="mb-4">
          <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full max-w-md p-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
         <div className="overflow-y-auto flex-1">
             <table className="w-full text-left border-collapse">
                 <thead className="bg-gray-50 sticky top-0">
                     <tr>
                         <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm">Name</th>
                         <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm">Category</th>
                         <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm">Code</th>
                         <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm text-right">Price</th>
                         <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm text-center">Actions</th>
                     </tr>
                 </thead>
                 <tbody>
                     {filteredItems.map(item => (
                         <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                             <td className="p-3 text-sm text-gray-800 font-medium">{item.name}</td>
                             <td className="p-3 text-sm text-gray-600">{item.category}</td>
                             <td className="p-3 text-sm text-gray-500 font-mono">{item.shortCode || '-'}</td>
                             <td className="p-3 text-sm text-gray-800 font-bold text-right">₹{item.price}</td>
                             <td className="p-3 flex justify-center space-x-2">
                                 <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                                 <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg">{editingItem.id ? 'Edit Item' : 'New Item'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                          <input 
                            type="text" 
                            value={editingItem.name || ''} 
                            onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                            <input 
                                type="number" 
                                value={editingItem.price || ''} 
                                onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Short Code</label>
                            <input 
                                type="text" 
                                value={editingItem.shortCode || ''} 
                                onChange={e => setEditingItem({...editingItem, shortCode: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select 
                             value={editingItem.category} 
                             onChange={e => setEditingItem({...editingItem, category: e.target.value as Category})}
                             className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                          >
                              {Object.values(Category).map(c => (
                                  <option key={c} value={c}>{c}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
                      <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 flex items-center space-x-2">
                          <Save size={18} />
                          <span>Save Item</span>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;