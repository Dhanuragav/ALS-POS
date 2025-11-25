import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MenuItem, CartItem, Category, PaymentMode, OrderType, BillStatus, OpenBill } from '../types';
import { Search, ChevronLeft, CreditCard, Banknote, Smartphone, CheckCircle, PlusCircle, AlertOctagon, Users, Trash2, Edit, Grid3X3, ArrowLeft } from 'lucide-react';
import { CGST_PERCENTAGE, SGST_PERCENTAGE } from '../constants';

interface POSTerminalProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  activeTable: string;
  billStatus: BillStatus;
  openBills: Record<string, OpenBill>;
  activeBill: OpenBill; // Added for payments access
  onAddItem: (item: MenuItem) => void;
  onRemoveItem: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onCheckout: (mode: PaymentMode, type: OrderType, table: string, details: any, discount: number, amount: number) => void;
  onClearCart: () => void;
  onSwitchTable: (table: string, pax?: number) => boolean;
  onVoidTable: (table: string) => void;
  onPrintKOT: () => void;
  onPrintBill: () => void;
}

const POSTerminal: React.FC<POSTerminalProps> = ({ 
  menuItems, cart, activeTable, billStatus, openBills, activeBill,
  onAddItem, onRemoveItem, onUpdateQty, onCheckout, onClearCart, onSwitchTable, onVoidTable, onPrintKOT, onPrintBill
}) => {
  // Local State
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null);
  
  // Modals State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Pax Logic (Now primary entry point)
  const [targetTableForPax, setTargetTableForPax] = useState<string | null>(null); 
  const [paxInput, setPaxInput] = useState<string>(''); 

  // Checkout State
  const [payMode, setPayMode] = useState<PaymentMode>(PaymentMode.CASH);
  const [paymentAmountInput, setPaymentAmountInput] = useState(''); 
  const [cashTendered, setCashTendered] = useState(''); 
  const [details, setDetails] = useState({ upiRef: '', cardDigits: '' });
  const [discountPercent, setDiscountPercent] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableInputRef = useRef<HTMLInputElement>(null);
  const paxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus logic based on view
    if (!activeTable) {
        if (targetTableForPax) {
            setTimeout(() => paxInputRef.current?.focus(), 50);
        } else {
            setTimeout(() => tableInputRef.current?.focus(), 50);
        }
    } else {
        if (!showPaymentModal) {
            searchInputRef.current?.focus();
        }
    }
  }, [showPaymentModal, targetTableForPax, selectedCategory, activeTable]);

  // Calculations
  const subTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const discountVal = parseFloat(discountPercent) || (activeBill.discountPercent || 0);
  const discountAmount = (subTotal * discountVal) / 100;
  const taxableAmount = subTotal - discountAmount;
  const cgst = taxableAmount * CGST_PERCENTAGE;
  const sgst = taxableAmount * SGST_PERCENTAGE;
  const grandTotal = taxableAmount + cgst + sgst;
  const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Payment Calculations
  const totalPaidSoFar = (activeBill.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, grandTotal - totalPaidSoFar);

  useEffect(() => {
      // Default payment input to balance due when modal opens
      if (showPaymentModal) {
          setPaymentAmountInput(balanceDue.toFixed(0));
      }
  }, [showPaymentModal, balanceDue]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pax Modal Logic
      if (targetTableForPax) {
          if (e.key === 'Escape') {
              setTargetTableForPax(null); 
              setPaxInput('');
          }
          if (e.key === 'Enter') confirmPax();
          return;
      }

      // If in Table View (No Active Table)
      if (!activeTable) {
          if (e.key === 'Enter' && tableSearch) {
              initiateTableSwitch(tableSearch);
          }
          return;
      }

      // If in POS View (Active Table)
      if (showPaymentModal) {
          if (e.key === 'Escape') setShowPaymentModal(false);
          if (e.key === 'Enter') handleFinalizePayment();
          return;
      }
      
      switch(e.key) {
        case 'F5': 
            e.preventDefault();
            // Go back to tables
            onSwitchTable(''); 
            break;
        case 'F6': 
            e.preventDefault();
            onPrintKOT();
            break;
        case 'F9': 
            e.preventDefault();
            onPrintBill();
            break;
        case 'F10': 
            e.preventDefault();
            if (cart.length > 0) setShowPaymentModal(true);
            break;
        case 'Escape':
            e.preventDefault();
            if (selectedCategory) setSelectedCategory(null);
            else if (searchQuery) setSearchQuery('');
            break;
        case 'Delete':
            if (selectedCartItemId) onRemoveItem(selectedCartItemId);
            break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCategory, searchQuery, selectedCartItemId, showPaymentModal, tableSearch, payMode, paymentAmountInput, details, discountPercent, targetTableForPax, paxInput, activeTable]);

  const displayedItems = useMemo(() => {
    let items = menuItems;
    if (searchQuery) {
       const lower = searchQuery.toLowerCase();
       items = items.filter(i => i.name.toLowerCase().includes(lower) || i.shortCode?.toLowerCase().includes(lower));
    } else if (selectedCategory) {
       items = items.filter(i => i.category === selectedCategory);
    } else {
       return [];
    }
    return items;
  }, [menuItems, searchQuery, selectedCategory]);

  const categories = Object.values(Category);

  const handleAddItem = (item: MenuItem) => {
      onAddItem(item);
      setSearchQuery(''); 
      searchInputRef.current?.focus();
  };

  const handleFinalizePayment = () => {
      const amountToPay = parseFloat(paymentAmountInput);
      if (isNaN(amountToPay) || amountToPay <= 0) return;

      onCheckout(
          payMode, 
          OrderType.DINE_IN, 
          activeTable, 
          {
              ...details,
              cashTendered: payMode === PaymentMode.CASH ? parseFloat(cashTendered) : undefined,
              cashBalance: payMode === PaymentMode.CASH ? (parseFloat(cashTendered) - amountToPay) : undefined
          },
          discountVal,
          amountToPay
      );
      setShowPaymentModal(false);
      setCashTendered('');
      setDetails({ upiRef: '', cardDigits: '' });
      setPaymentAmountInput('');
  };

  // ----- TABLE & PAX LOGIC -----

  const initiateTableSwitch = (table: string) => {
      if (!table) return;

      // Check if table exists (occupied)
      if (openBills[table]) {
          // Open directly
          onSwitchTable(table);
          setTableSearch('');
      } else {
          // Empty Table -> Ask for Pax
          setTargetTableForPax(table);
          setPaxInput('2'); // Default
      }
  };

  const confirmPax = () => {
      const pax = parseInt(paxInput);
      if (targetTableForPax && pax > 0) {
          onSwitchTable(targetTableForPax, pax);
          setTargetTableForPax(null);
          setPaxInput('');
          setTableSearch('');
      }
  };

  const handleVoidTableClick = (e: React.MouseEvent, table: string) => {
      e.stopPropagation();
      if(confirm(`Are you sure you want to VOID/DELETE Table ${table}? This cannot be undone.`)) {
          onVoidTable(table);
      }
  };

  const handleEditPaxClick = (e: React.MouseEvent, table: string) => {
      e.stopPropagation();
      setTargetTableForPax(table);
      setPaxInput(openBills[table]?.pax?.toString() || '0');
  };

  const getStatusColor = () => {
      switch(billStatus) {
          case BillStatus.NEW: return 'bg-blue-600 text-white';
          case BillStatus.KOT_SENT: return 'bg-green-600 text-white';
          case BillStatus.BILL_PRINTED: return 'bg-purple-600 text-white'; 
          case BillStatus.PAID: return 'bg-gray-600 text-white';
          default: return 'bg-gray-200 text-gray-800';
      }
  };

  // Helper to identify standard tables vs custom
  const standardTables = Array.from({ length: 100 }, (_, i) => String(i + 1));
  const filteredGridTables = standardTables.filter(t => t.includes(tableSearch));
  const otherActiveTables = Object.keys(openBills).filter(t => !standardTables.includes(t) && t.includes(tableSearch));

  // --- VIEW 1: TABLE SELECTION (LANDING) ---
  if (!activeTable) {
    return (
        <div className="flex flex-col h-full w-full bg-gray-50 text-gray-800 relative">
            
            {/* Pax Modal Overlay */}
            {targetTableForPax && (
                <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-96 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-center mb-4 text-gray-800 uppercase">Opening Table {targetTableForPax}</h3>
                        <p className="text-center text-gray-500 mb-6 uppercase text-xs tracking-widest">Enter Number of People (Pax)</p>
                        
                        <input 
                            ref={paxInputRef}
                            type="number"
                            value={paxInput}
                            onChange={(e) => setPaxInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmPax()}
                            className="w-full bg-gray-100 text-gray-900 text-4xl text-center p-4 rounded border border-gray-300 focus:border-blue-600 outline-none mb-6 font-mono"
                            placeholder="0"
                        />
                        
                        <div className="flex gap-4">
                            <button onClick={() => { setTargetTableForPax(null); setPaxInput(''); }} className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded font-bold uppercase text-gray-700">Cancel</button>
                            <button onClick={confirmPax} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold uppercase">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                <h2 className="text-xl font-bold uppercase text-gray-800 flex items-center gap-3">
                    <Grid3X3 size={24} className="text-blue-600" />
                    <span>Floor Plan</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">{filteredGridTables.length} Tables</span>
                </h2>
                <div className="flex gap-2 w-1/3">
                    <input 
                        ref={tableInputRef}
                        type="text" 
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Search Table #..." 
                        className="flex-1 bg-gray-100 text-gray-900 p-3 rounded border border-gray-300 focus:border-blue-600 outline-none font-mono text-lg transition-all focus:bg-white"
                    />
                    <button 
                        onClick={() => initiateTableSwitch(tableSearch)}
                        className="bg-blue-600 text-white px-6 rounded font-bold uppercase hover:bg-blue-700 transition-colors"
                    >
                        Open
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3 mb-8">
                    {filteredGridTables.map(tableNum => {
                        const bill = openBills[tableNum];
                        const status = bill ? bill.status : undefined;
                        
                        let previewTotal = 0;
                        if (bill && bill.items) {
                            const sub = bill.items.reduce((s, i) => s + (i.price * i.quantity), 0);
                            previewTotal = sub * 1.05; 
                        }
                        
                        let statusColor = 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md';
                        let statusText = 'EMPTY';
                        let textColor = 'text-gray-400';
                        let tableNumColor = 'text-gray-700';

                        if (status) {
                            tableNumColor = 'text-gray-900';
                            if(status === BillStatus.NEW) { statusColor = 'bg-blue-50 border-blue-200'; statusText = 'NEW'; textColor='text-blue-600'; }
                            else if(status === BillStatus.KOT_SENT) { statusColor = 'bg-green-50 border-green-200'; statusText = 'KOT'; textColor='text-green-600'; }
                            else if(status === BillStatus.BILL_PRINTED) { statusColor = 'bg-purple-50 border-purple-200'; statusText = 'BILL'; textColor='text-purple-600'; }
                            else if(status === BillStatus.PAID) { statusColor = 'bg-gray-100 border-gray-300'; statusText = 'PAID'; textColor='text-gray-500'; }
                        }

                        return (
                            <div
                                key={tableNum}
                                onClick={() => initiateTableSwitch(tableNum)}
                                className={`relative p-3 rounded-lg border flex flex-col justify-between h-28 transition-all active:scale-95 cursor-pointer group shadow-sm ${statusColor}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`font-bold text-xl font-mono ${tableNumColor}`}>{tableNum}</span>
                                    {status === BillStatus.BILL_PRINTED && <AlertOctagon size={16} className="text-purple-600" />}
                                    
                                    {/* Hover Actions */}
                                    {status && (
                                        <div className="hidden group-hover:flex gap-1 absolute top-2 right-2 bg-white p-1 rounded z-10 shadow border border-gray-200">
                                            <button onClick={(e) => handleEditPaxClick(e, tableNum)} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="Edit Pax"><Edit size={16}/></button>
                                            <button onClick={(e) => handleVoidTableClick(e, tableNum)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Void Table"><Trash2 size={16}/></button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="text-right flex flex-col items-end mt-auto">
                                    {bill && bill.pax && (
                                        <span className="text-xs text-gray-500 flex items-center mb-1 bg-gray-100 px-1.5 py-0.5 rounded">
                                            <Users size={10} className="mr-1"/> {bill.pax}
                                        </span>
                                    )}
                                    {previewTotal > 0 && (
                                        <span className="text-xs font-mono text-gray-800 font-bold mb-1">₹{previewTotal.toFixed(0)}</span>
                                    )}
                                    <div className={`text-[10px] font-bold uppercase tracking-wider ${textColor} bg-white/50 px-1 rounded`}>
                                        {statusText}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Custom Tables */}
                {otherActiveTables.length > 0 && (
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h3 className="text-gray-400 uppercase text-xs font-bold mb-4 tracking-widest">Custom Tables</h3>
                        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
                            {otherActiveTables.map(tableNum => {
                                const bill = openBills[tableNum];
                                const status = bill.status;
                                let statusColor = 'bg-white border-gray-200';
                                let textColor = 'text-gray-400';

                                if(status === BillStatus.NEW) { statusColor = 'bg-blue-50 border-blue-200'; textColor='text-blue-600'; }
                                else if(status === BillStatus.KOT_SENT) { statusColor = 'bg-green-50 border-green-200'; textColor='text-green-600'; }
                                else if(status === BillStatus.BILL_PRINTED) { statusColor = 'bg-purple-50 border-purple-200'; textColor='text-purple-600'; }

                                return (
                                    <div
                                        key={tableNum}
                                        onClick={() => initiateTableSwitch(tableNum)}
                                        className={`relative p-3 rounded-lg border flex flex-col justify-between h-28 transition-all cursor-pointer group shadow-sm ${statusColor}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-sm text-gray-800 truncate w-full text-left">{tableNum}</span>
                                                <div className="hidden group-hover:flex gap-1 absolute top-2 right-2 bg-white p-1 rounded z-10 shadow border border-gray-200">
                                                    <button onClick={(e) => handleEditPaxClick(e, tableNum)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit size={16}/></button>
                                                    <button onClick={(e) => handleVoidTableClick(e, tableNum)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                                </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end mt-auto">
                                            {bill && bill.pax && (
                                                <span className="text-xs text-gray-500 flex items-center mb-1 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    <Users size={10} className="mr-1"/> {bill.pax}
                                                </span>
                                            )}
                                            <div className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>
                                                {status}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  }

  // --- VIEW 2: POS INTERFACE (ACTIVE TABLE) ---
  return (
    <div id="pos-container" className="grid grid-cols-[35%_45%_20%] h-full w-full bg-gray-50 text-gray-800 font-sans">
      
      {/* ZONE 1: QUICK MENU & CONTEXT */}
      <div id="zone-input-categories" className="flex flex-col border-r border-gray-200 bg-white">
        <div className="bg-white p-3 flex justify-between items-center border-b border-gray-200">
            <button 
                onClick={() => onSwitchTable('')}
                className="flex items-center text-gray-500 hover:text-blue-600 text-xs uppercase font-bold tracking-wider hover:bg-blue-50 p-2 rounded transition-colors"
            >
                <ArrowLeft size={16} className="mr-1" /> Floor Plan
            </button>
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Active Table</span>
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-xl text-blue-600">{activeTable}</span>
                    {activeBill.pax && (
                        <span className="flex items-center text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            <Users size={10} className="mr-1" /> {activeBill.pax}
                        </span>
                    )}
                </div>
            </div>
        </div>
        
        <div className={`${getStatusColor()} p-2 text-center font-bold text-xs uppercase tracking-widest shadow-sm transition-colors duration-300`}>
            STATUS: {billStatus}
        </div>

        <div className="p-4 relative">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input
                ref={searchInputRef}
                id="item-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Item / Code..."
                className="w-full bg-gray-50 text-gray-900 pl-10 pr-4 py-3 text-lg rounded-lg border border-gray-200 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder-gray-400 font-medium shadow-inner"
                tabIndex={1}
                autoComplete="off"
             />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
            {(searchQuery || selectedCategory) ? (
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                        className="flex items-center text-blue-600 mb-2 hover:text-blue-800 transition-colors font-bold uppercase text-sm tracking-wider"
                    >
                        <ChevronLeft size={16} className="mr-1" /> Back to Categories
                    </button>
                    <div className="grid grid-cols-1 gap-2">
                        {displayedItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleAddItem(item)}
                                className="text-left p-3 bg-white hover:bg-blue-50 hover:border-blue-300 rounded border border-gray-200 transition-all group shadow-sm"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm truncate w-3/4 text-gray-800">{item.name}</span>
                                    <span className="font-data font-bold text-gray-600">₹{item.price}</span>
                                </div>
                                {item.shortCode && <div className="text-[10px] text-gray-400 font-mono mt-1 group-hover:text-blue-600">{item.shortCode}</div>}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat, idx) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="p-4 bg-white hover:bg-blue-50 text-gray-700 rounded-lg text-left font-bold text-xs uppercase tracking-wide border border-gray-200 hover:border-blue-300 transition-all active:scale-95 flex flex-col justify-between h-24 shadow-sm"
                        >
                            <span className="text-[10px] text-blue-500 block mb-1">F{idx + 1}</span>
                            <span className="leading-tight">{cat}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* ZONE 2: ORDER SUMMARY */}
      <div id="zone-order-summary" className="flex flex-col border-r border-gray-200 bg-white">
        <div className="grid grid-cols-12 bg-gray-50 text-gray-600 p-3 text-sm font-bold uppercase tracking-wider items-center border-b border-gray-200">
            <div className="col-span-1 text-center">STS</div>
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-3 text-right">Total</div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 no-scrollbar bg-white" id="order-bill">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-gray-400">
                    <Grid3X3 size={64} className="mb-4" />
                    <p className="text-xl font-bold">TABLE {activeTable}</p>
                    {activeBill.pax && <p className="text-sm font-bold mt-1 bg-gray-100 px-2 py-1 rounded">PAX: {activeBill.pax}</p>}
                    <p className="text-sm mt-2">Ready for Order</p>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {cart.map((item, idx) => (
                        <div 
                            key={item.id}
                            onClick={() => setSelectedCartItemId(item.id)}
                            className={`grid grid-cols-12 items-center p-3 rounded cursor-pointer transition-colors border-l-4 ${
                                selectedCartItemId === item.id 
                                ? 'bg-blue-50 border-blue-600' 
                                : 'bg-white border-transparent hover:bg-gray-50'
                            }`}
                        >
                            <div className="col-span-1 flex justify-center">
                                {item.isKotPrinted ? (
                                    <CheckCircle size={14} className="text-green-600" />
                                ) : (
                                    <PlusCircle size={14} className="text-amber-500 animate-pulse" />
                                )}
                            </div>
                            <div className="col-span-1 text-center text-gray-400 font-data text-sm">{idx + 1}</div>
                            <div className="col-span-5 flex flex-col">
                                <span className="font-medium text-gray-900 truncate">{item.name}</span>
                                {item.notes && <span className="text-red-500 text-[10px] italic mt-0.5">Note: {item.notes}</span>}
                            </div>
                            <div className="col-span-2 flex items-center justify-center gap-2">
                                {!item.isKotPrinted && (
                                     <button onClick={(e) => { e.stopPropagation(); onUpdateQty(item.id, -1); }} className="text-gray-400 hover:text-red-600 px-1 font-bold">-</button>
                                )}
                                <span className="font-data font-bold text-lg text-gray-800">{item.quantity}</span>
                                {!item.isKotPrinted && (
                                     <button onClick={(e) => { e.stopPropagation(); onUpdateQty(item.id, 1); }} className="text-gray-400 hover:text-green-600 px-1 font-bold">+</button>
                                )}
                            </div>
                            <div className="col-span-3 text-right font-data font-bold text-gray-800">
                                {(item.price * item.quantity).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* ZONE 3: TOTALS & ACTIONS */}
      <div id="zone-totals-actions" className="flex flex-col p-4 bg-gray-50 border-l border-gray-200">
         <div className="flex-1 flex flex-col gap-2">
             <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                 <div className="flex justify-between text-gray-500 text-sm mb-1">
                     <span>Subtotal</span>
                     <span className="font-data font-medium text-gray-800">₹{subTotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-gray-500 text-xs mb-1">
                     <span>Tax (5%)</span>
                     <span className="font-data font-medium text-gray-800">₹{(cgst + sgst).toFixed(2)}</span>
                 </div>
                 {discountAmount > 0 && (
                     <div className="flex justify-between text-red-500 text-xs mb-1">
                         <span>Discount</span>
                         <span className="font-data">-₹{discountAmount.toFixed(2)}</span>
                     </div>
                 )}
                 <div className="flex justify-between text-gray-400 text-xs mt-2 pt-2 border-t border-gray-100">
                     <span>Items</span>
                     <span className="font-data">{totalQty}</span>
                 </div>
                 
                 {/* Live Status Indicators */}
                 {totalPaidSoFar > 0 && (
                     <div className="flex justify-between text-green-600 font-bold text-sm mt-2 border-t border-dashed border-gray-300 pt-1">
                        <span>Paid (Partial)</span>
                        <span className="font-data">₹{totalPaidSoFar.toFixed(2)}</span>
                     </div>
                 )}
             </div>

             <div id="grand-total-display" className={`p-4 rounded-lg border-2 flex flex-col justify-center items-end h-28 shadow-sm mt-2 ${balanceDue <= 0 ? 'bg-green-600 border-green-700 text-white' : 'bg-white border-blue-500'}`}>
                 <span className={`${balanceDue <= 0 ? 'text-white' : 'text-blue-600'} text-xs uppercase tracking-widest font-bold mb-1`}>
                    {balanceDue <= 0 ? 'Fully Paid' : 'Balance Due'}
                 </span>
                 <span className={`${balanceDue <= 0 ? 'text-white' : 'text-gray-900'} text-4xl font-data font-bold tracking-tight`}>
                     ₹{balanceDue.toFixed(0)}
                 </span>
             </div>
         </div>

         <div id="action-buttons" className="flex flex-col gap-2 mt-auto">
             <button 
                onClick={() => onSwitchTable('')}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 rounded font-bold uppercase text-xs flex justify-between px-4 items-center shadow-sm"
             >
                 <span>Floor Plan</span>
                 <span className="text-gray-400">[F5]</span>
             </button>

             <button 
                onClick={onPrintKOT}
                disabled={cart.length === 0}
                className="bg-white hover:bg-yellow-50 text-gray-800 border-l-4 border-yellow-500 py-3 rounded font-bold uppercase text-xs flex justify-between px-4 items-center shadow-sm disabled:opacity-50"
             >
                 <span>Print KOT</span>
                 <span className="text-gray-400">[F6]</span>
             </button>

             <button 
                onClick={onPrintBill}
                disabled={cart.length === 0}
                className="bg-white hover:bg-purple-50 text-gray-800 border-l-4 border-purple-500 py-3 rounded font-bold uppercase text-xs flex justify-between px-4 items-center shadow-sm disabled:opacity-50"
             >
                 <span>Print Bill</span>
                 <span className="text-gray-400">[F9]</span>
             </button>

             <button 
                onClick={() => cart.length > 0 && setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded font-bold text-lg uppercase tracking-widest shadow-md active:transform active:scale-95 transition-all mt-2"
             >
                 PAY [F10]
             </button>
             
             <button 
                onClick={onClearCart}
                className="text-red-500 hover:text-red-700 text-[10px] uppercase font-bold py-2"
             >
                 Void Order [Esc]
             </button>
         </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
             <div className="bg-white w-full max-w-4xl grid grid-cols-2 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                 {/* Left: Summary */}
                 <div className="bg-gray-50 p-8 flex flex-col justify-between border-r border-gray-200">
                     <div>
                         <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h2>
                         <div className="space-y-4">
                             <div className="flex justify-between text-gray-600 text-lg">
                                 <span>Table</span>
                                 <span className="font-bold text-gray-900">{activeTable}</span>
                             </div>
                             <div className="flex justify-between text-gray-600 text-lg">
                                 <span>Bill Total</span>
                                 <span className="font-data text-gray-900">₹{grandTotal.toFixed(2)}</span>
                             </div>
                             
                             <div className="flex items-center justify-between py-4 border-y border-gray-200">
                                 <span className="text-gray-600">Discount %</span>
                                 <input 
                                    type="number"
                                    value={discountPercent}
                                    onChange={(e) => setDiscountPercent(e.target.value)}
                                    placeholder={activeBill.discountPercent ? activeBill.discountPercent.toString() : "0"}
                                    className="bg-white border border-gray-300 text-right text-gray-900 p-2 rounded w-20 font-data outline-none focus:ring-2 focus:ring-blue-500"
                                 />
                             </div>

                             {totalPaidSoFar > 0 && (
                                 <div className="flex justify-between text-green-600 text-lg font-medium">
                                     <span>Paid So Far</span>
                                     <span className="font-data">₹{totalPaidSoFar.toFixed(2)}</span>
                                 </div>
                             )}

                             <div className="flex justify-between text-blue-600 text-3xl font-bold mt-4">
                                 <span>Balance Due</span>
                                 <span className="font-data">₹{balanceDue.toFixed(0)}</span>
                             </div>

                             {payMode === PaymentMode.CASH && cashTendered && paymentAmountInput && (
                                 <div className="bg-green-50 p-4 rounded mt-4 border border-green-200">
                                     <div className="flex justify-between text-green-800 text-xl font-bold">
                                         <span>Change Due</span>
                                         <span className="font-data">₹{(parseFloat(cashTendered) - parseFloat(paymentAmountInput)).toFixed(2)}</span>
                                     </div>
                                 </div>
                             )}
                         </div>
                     </div>
                     <div className="text-gray-400 text-xs mt-8">
                         Press [Enter] to Confirm Payment
                     </div>
                 </div>

                 {/* Right: Input */}
                 <div className="p-8 bg-white">
                     <div className="flex gap-2 mb-6">
                         {[PaymentMode.CASH, PaymentMode.UPI, PaymentMode.CARD].map((mode) => (
                             <button
                                key={mode}
                                onClick={() => setPayMode(mode)}
                                className={`flex-1 py-4 rounded font-bold uppercase text-sm flex flex-col items-center gap-2 border-2 transition-all ${
                                    payMode === mode 
                                    ? 'border-blue-600 bg-blue-50 text-blue-600' 
                                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                                }`}
                             >
                                 {mode === PaymentMode.CASH && <Banknote size={24} />}
                                 {mode === PaymentMode.UPI && <Smartphone size={24} />}
                                 {mode === PaymentMode.CARD && <CreditCard size={24} />}
                                 {mode}
                             </button>
                         ))}
                     </div>

                     <div className="space-y-4">
                         <div>
                             <label className="block text-gray-500 text-xs uppercase mb-1">Amount to Pay</label>
                             <input
                                autoFocus
                                type="number"
                                value={paymentAmountInput}
                                onChange={(e) => setPaymentAmountInput(e.target.value)}
                                className="w-full bg-gray-50 text-gray-900 text-3xl font-data p-4 rounded border border-gray-300 focus:border-blue-600 outline-none"
                                placeholder={balanceDue.toFixed(0)}
                             />
                         </div>

                         {payMode === PaymentMode.CASH && (
                             <div>
                                 <label className="block text-gray-500 text-xs uppercase mb-1">Cash Tendered</label>
                                 <input
                                    type="number"
                                    value={cashTendered}
                                    onChange={(e) => setCashTendered(e.target.value)}
                                    className="w-full bg-white text-green-600 text-xl font-data p-3 rounded border border-gray-300 focus:border-green-500 outline-none"
                                    placeholder="0.00"
                                 />
                             </div>
                         )}
                         {payMode === PaymentMode.UPI && (
                             <div>
                                 <label className="block text-gray-500 text-xs uppercase mb-1">UPI Reference</label>
                                 <input
                                    type="text"
                                    value={details.upiRef}
                                    onChange={(e) => setDetails({...details, upiRef: e.target.value})}
                                    className="w-full bg-white text-gray-900 text-xl p-3 rounded border border-gray-300 focus:border-blue-600 outline-none"
                                 />
                             </div>
                         )}
                         {payMode === PaymentMode.CARD && (
                             <div>
                                 <label className="block text-gray-500 text-xs uppercase mb-1">Last 4 Digits</label>
                                 <input
                                    type="text"
                                    maxLength={4}
                                    value={details.cardDigits}
                                    onChange={(e) => setDetails({...details, cardDigits: e.target.value})}
                                    className="w-full bg-white text-gray-900 text-xl font-data p-3 rounded border border-gray-300 focus:border-blue-600 outline-none"
                                 />
                             </div>
                         )}
                     </div>

                     <div className="flex gap-4 mt-8">
                         <button 
                            onClick={() => setShowPaymentModal(false)}
                            className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold uppercase"
                         >
                             Cancel
                         </button>
                         <button 
                            onClick={handleFinalizePayment}
                            className="flex-[2] py-4 bg-green-600 hover:bg-green-700 text-white rounded font-bold uppercase shadow-lg"
                         >
                             {parseFloat(paymentAmountInput) >= balanceDue - 0.5 ? 'Complete & Close' : 'Record Partial'}
                         </button>
                     </div>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default POSTerminal;