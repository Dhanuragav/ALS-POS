import React, { useEffect, useState } from 'react';
import { MenuItem, CartItem, Bill, ViewMode, PaymentMode, OrderType, SettlementData, SessionType } from './types';
import { CGST_PERCENTAGE, SGST_PERCENTAGE } from './constants';
import * as db from './services/storage';
import MenuGrid from './components/MenuGrid';
import CartSidebar from './components/CartSidebar';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Transactions from './components/Transactions';
import Receipt from './components/Receipt';
import { LayoutDashboard, Store, ClipboardCheck, Power, Settings as SettingsIcon, History } from 'lucide-react';

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<ViewMode>('POS');
  
  // Printing States
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [printMode, setPrintMode] = useState<'BILL' | 'KOT' | 'SETTLEMENT'>('BILL');
  const [renderMode, setRenderMode] = useState<'PRINT' | 'CANVAS'>('PRINT'); // Controls if we are printing physically or grabbing canvas

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  useEffect(() => {
    db.initDB();
    setMenuItems(db.getMenu());
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const updateNote = (id: string, note: string) => {
      setCart(prev => prev.map(item => item.id === id ? { ...item, notes: note } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async (mode: PaymentMode, type: OrderType, table: string, details: any, discountVal: number) => {
    if (cart.length === 0) return;

    const subTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    // Discount Calculation
    const discountAmount = (subTotal * discountVal) / 100;
    const taxableAmount = subTotal - discountAmount;
    
    const cgst = taxableAmount * CGST_PERCENTAGE;
    const sgst = taxableAmount * SGST_PERCENTAGE;
    const total = taxableAmount + cgst + sgst;

    const bill = db.saveBill(cart, total, subTotal, cgst, sgst, mode, type, table, details, discountAmount);
    setLastBill(bill);
    setCart([]); // Clear cart
    
    // Trigger Print Sequence
    // 1. Set KOT mode
    setRenderMode('PRINT');
    setPrintMode('KOT');
    
    // Allow DOM to update then Print KOT
    setTimeout(() => {
        window.print();
        
        // 2. Set Bill mode and Print Bill after short delay
        setTimeout(() => {
            setPrintMode('BILL');
            // Small delay to ensure React renders the Bill template
            setTimeout(() => {
                window.print();
            }, 100);
        }, 500);
    }, 100);
  };

  const handleReprint = (bill: Bill) => {
      setLastBill(bill);
      setRenderMode('PRINT');
      setPrintMode('BILL');
      setTimeout(() => {
          window.print();
      }, 200);
  };

  const generatePDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        // @ts-ignore
        const canvas = await window.html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        // 80mm width ~ 226pt.
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200]
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);
    } catch (err) {
        console.error("PDF Generation failed", err);
        alert("Failed to generate PDF");
    }
  };

  const handleDownloadLastBillPDF = () => {
      if(!lastBill) return;
      setRenderMode('CANVAS'); // Switch to canvas mode for better capture
      setPrintMode('BILL');
      // Wait for render
      setTimeout(() => {
        generatePDF('pdf-receipt-capture', `Bill-${lastBill.billNumber}.pdf`);
        setRenderMode('PRINT'); // Revert
      }, 100);
  };

  const handleSettlement = () => {
      const cashActual = prompt("Enter Actual Cash in Drawer:", "0");
      if(cashActual === null) return;
      
      const report = db.getSettlementReport(parseFloat(cashActual));
      setSettlementData(report);
      setRenderMode('CANVAS');
      setPrintMode('SETTLEMENT');
      
      setTimeout(() => {
         generatePDF('pdf-receipt-capture', `Settlement-${report.session}-${new Date().toLocaleDateString()}.pdf`);
         setRenderMode('PRINT');
      }, 500);
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden no-print">
      {/* Sidebar Nav */}
      <div className="w-16 md:w-20 bg-emerald-900 text-emerald-100 flex flex-col items-center py-6 space-y-8 z-20 shadow-lg">
        <div className="p-2 bg-emerald-800 rounded-lg">
            <Store size={28} />
        </div>
        
        <nav className="flex flex-col space-y-6 w-full items-center">
            <button 
                onClick={() => setView('POS')}
                className={`p-3 rounded-xl transition-all ${view === 'POS' ? 'bg-emerald-700 text-white shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-300'}`}
                title="POS Terminal"
            >
                <Store size={24} />
            </button>
            <button 
                onClick={() => setView('TRANSACTIONS')}
                className={`p-3 rounded-xl transition-all ${view === 'TRANSACTIONS' ? 'bg-emerald-700 text-white shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-300'}`}
                title="Transactions"
            >
                <History size={24} />
            </button>
            <button 
                onClick={() => setView('REPORTS')}
                className={`p-3 rounded-xl transition-all ${view === 'REPORTS' ? 'bg-emerald-700 text-white shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-300'}`}
                title="Reports"
            >
                <LayoutDashboard size={24} />
            </button>
            <button 
                onClick={() => setView('SETTINGS')}
                className={`p-3 rounded-xl transition-all ${view === 'SETTINGS' ? 'bg-emerald-700 text-white shadow-lg' : 'hover:bg-emerald-800/50 text-emerald-300'}`}
                title="Settings"
            >
                <SettingsIcon size={24} />
            </button>
        </nav>

        <div className="mt-auto mb-4">
             <button 
                onClick={handleSettlement}
                className="p-3 rounded-xl hover:bg-red-800/50 text-red-300 hover:text-white transition-all flex flex-col items-center gap-1"
                title="End Shift / Settlement"
            >
                <Power size={20} />
                <span className="text-[10px]">Close</span>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {view === 'POS' && (
            <>
                <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
                    <header className="mb-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Annalakshmi Hotel</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Pure Veg</span>
                                <span>•</span>
                                <span className={`font-bold ${db.getCurrentSession() === SessionType.LUNCH ? 'text-orange-500' : 'text-indigo-500'}`}>
                                    {db.getCurrentSession()} Session
                                </span>
                            </div>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-emerald-600">{new Date().toDateString()}</p>
                        </div>
                    </header>
                    <div className="flex-1 overflow-hidden">
                        <MenuGrid items={menuItems} onAddItem={addToCart} />
                    </div>
                </div>
                <CartSidebar 
                    cart={cart}
                    lastBill={lastBill}
                    onUpdateQty={updateQty}
                    onUpdateNote={updateNote}
                    onRemove={removeFromCart}
                    onClear={() => setCart([])}
                    onCheckout={handleCheckout}
                    onDownloadPdf={handleDownloadLastBillPDF}
                />
            </>
        )}
        
        {view === 'REPORTS' && (
            <div className="w-full h-full overflow-hidden">
                <Reports />
            </div>
        )}

        {view === 'SETTINGS' && (
            <div className="w-full h-full overflow-hidden">
                <Settings menuItems={menuItems} onUpdateMenu={setMenuItems} />
            </div>
        )}

        {view === 'TRANSACTIONS' && (
            <div className="w-full h-full overflow-hidden">
                <Transactions onReprint={handleReprint} />
            </div>
        )}
      </div>
      
      {/* Hidden Print Receipt (For Physical Printer) */}
      <Receipt bill={lastBill} settlementData={settlementData} mode={printMode} renderMode="PRINT" />

      {/* Off-screen Receipt (For PDF Generation) */}
      <div style={{ position: 'fixed', top: -10000, left: -10000 }}>
         <div id="pdf-receipt-capture">
             <Receipt 
                bill={lastBill} 
                settlementData={settlementData} 
                mode={printMode} 
                renderMode="CANVAS" 
             />
         </div>
      </div>
    </div>
  );
};

export default App;