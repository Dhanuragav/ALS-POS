import React, { useEffect, useState, useRef } from 'react';
import { MenuItem, CartItem, Bill, ViewMode, PaymentMode, OrderType, SettlementData, SessionType, OpenBill, BillStatus, PaymentTransaction } from './types';
import { CGST_PERCENTAGE, SGST_PERCENTAGE } from './constants';
import * as db from './services/storage';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Transactions from './components/Transactions';
import Receipt from './components/Receipt';
import POSTerminal from './components/POSTerminal';
import ZReportModal from './components/ZReportModal';
import { LayoutDashboard, Store, Power, Settings as SettingsIcon, History } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('POS');
  
  // Master State for Table Management
  const [openBills, setOpenBills] = useState<Record<string, OpenBill>>({});
  const [activeTable, setActiveTable] = useState<string>(''); // Start with no table selected

  // Derived state for current cart
  const activeBill = openBills[activeTable] || { items: [], status: BillStatus.NEW, tableNumber: activeTable, timestamp: Date.now(), orderType: OrderType.DINE_IN, payments: [], pax: 0 };
  const cart = activeBill.items || [];
  const currentStatus = activeBill.status || BillStatus.NEW;

  // Printing States
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [itemsToPrint, setItemsToPrint] = useState<CartItem[]>([]); // For KOT
  const [kotOrderType, setKotOrderType] = useState<string>(''); // For KOT header
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [printMode, setPrintMode] = useState<'BILL' | 'KOT' | 'SETTLEMENT'>('BILL');
  const [renderMode, setRenderMode] = useState<'PRINT' | 'CANVAS'>('PRINT'); 
  const [showZReport, setShowZReport] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  useEffect(() => {
    db.initDB();
    setMenuItems(db.getMenu());
    setOpenBills(db.getOpenBills());
  }, []);

  // Update Storage whenever openBills changes
  useEffect(() => {
    if (Object.keys(openBills).length > 0) {
        db.saveOpenBills(openBills);
    }
  }, [openBills]);

  // --------------- TABLE LOGIC ---------------- //

  const handleSwitchTable = (targetTable: string, pax?: number) => {
      // Logic: Fully flexible switching as per new prompt.
      
      if (targetTable === '') {
          setActiveTable('');
          return true;
      }
      
      if (!openBills[targetTable]) {
          // Initialize new table
          setOpenBills(prev => ({
              ...prev,
              [targetTable]: {
                  tableNumber: targetTable,
                  items: [],
                  status: BillStatus.NEW,
                  timestamp: Date.now(),
                  orderType: OrderType.DINE_IN,
                  payments: [],
                  pax: pax || 2 // Default or provided
              }
          }));
      } else if (pax) {
          // If table exists but we want to update pax (edit mode)
          setOpenBills(prev => ({
              ...prev,
              [targetTable]: {
                  ...prev[targetTable],
                  pax: pax
              }
          }));
      }
      setActiveTable(targetTable);
      return true;
  };

  const handleVoidTable = (targetTable: string) => {
      setOpenBills(prev => {
          const newState = { ...prev };
          delete newState[targetTable];
          return newState;
      });
      if (activeTable === targetTable) {
          setActiveTable(''); // Return to table grid
      }
  };

  const updateActiveBill = (updates: Partial<OpenBill>) => {
      if (!activeTable) return;
      setOpenBills(prev => ({
          ...prev,
          [activeTable]: {
              ...prev[activeTable],
              ...updates
          }
      }));
  };

  // --------------- CART LOGIC ---------------- //

  const addToCart = (item: MenuItem) => {
    if (!activeTable) return;
    const currentItems = [...cart];
    // Merge with unprinted items logic (simplified: always add/merge)
    const existingItem = currentItems.find(i => i.id === item.id && !i.isKotPrinted);

    let newItems;
    if (existingItem) {
        newItems = currentItems.map(i => i === existingItem ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
        newItems = [...currentItems, { ...item, quantity: 1, isKotPrinted: false }];
    }

    updateActiveBill({ items: newItems });
  };

  const updateQty = (id: string, delta: number) => {
    const newItems = cart.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(i => i.quantity > 0);
    
    updateActiveBill({ items: newItems });
  };

  const removeFromCart = (id: string) => {
    const newItems = cart.filter(item => item.id !== id);
    updateActiveBill({ items: newItems });
  };

  const clearCart = () => {
      // Only clears Items, keeps payments/billNumber if partially paid (though unlikely to clear items if paid)
      updateActiveBill({ items: [], status: BillStatus.NEW });
  };

  // --------------- PRINT LOGIC ---------------- //

  const handlePrintKOT = () => {
      const unprintedItems = cart.filter(i => !i.isKotPrinted);
      if (unprintedItems.length === 0) return;

      setItemsToPrint(unprintedItems);
      setKotOrderType(cart.some(i => i.isKotPrinted) ? 'SUPPLEMENTARY KOT' : 'NEW ORDER KOT');
      
      setPrintMode('KOT');
      setRenderMode('PRINT');
      
      // Mark items as printed
      const updatedItems = cart.map(i => ({ ...i, isKotPrinted: true }));
      updateActiveBill({ items: updatedItems, status: BillStatus.KOT_SENT });

      setTimeout(() => {
          window.print();
      }, 100);
  };

  const handlePrintBill = () => {
      if (cart.length === 0) return;
      
      // Calculate Totals
      const subTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const discountVal = activeBill.discountPercent || 0;
      const discountAmount = (subTotal * discountVal) / 100;
      const taxable = subTotal - discountAmount;
      const cgst = taxable * CGST_PERCENTAGE;
      const sgst = taxable * SGST_PERCENTAGE;
      const total = taxable + cgst + sgst;

      // Assign Bill Number if not yet assigned
      let billNo = activeBill.billNumber;
      if (!billNo) {
          billNo = db.generateBillNumber();
          updateActiveBill({ billNumber: billNo });
      }

      const tempBill: Bill = {
          id: 'TEMP',
          billNumber: billNo,
          timestamp: Date.now(),
          session: db.getCurrentSession(),
          items: cart,
          subTotal,
          discount: discountAmount,
          cgst,
          sgst,
          totalAmount: total,
          paymentMode: PaymentMode.CASH,
          orderType: activeBill.orderType,
          tableNumber: activeTable,
          payments: activeBill.payments // Include history
      };

      setLastBill(tempBill);
      setPrintMode('BILL');
      setRenderMode('PRINT');

      updateActiveBill({ status: BillStatus.BILL_PRINTED });

      setTimeout(() => {
          window.print();
      }, 100);
  };

  // --------------- CHECKOUT / PAYMENT LOGIC ---------------- //

  const handleCheckout = async (mode: PaymentMode, type: OrderType, table: string, details: any, discountVal: number, amountToPay: number) => {
    // 1. Calculate Totals
    const subTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const discountAmount = (subTotal * discountVal) / 100;
    const taxableAmount = subTotal - discountAmount;
    const cgst = taxableAmount * CGST_PERCENTAGE;
    const sgst = taxableAmount * SGST_PERCENTAGE;
    const totalDue = taxableAmount + cgst + sgst;

    // 2. Generate Bill Number if needed (Instant logging requires a ref)
    let billNo = activeBill.billNumber;
    if (!billNo) {
        billNo = db.generateBillNumber();
        updateActiveBill({ billNumber: billNo });
    }

    // 3. Create Transaction Log
    const transaction: PaymentTransaction = {
        id: crypto.randomUUID(),
        amount: amountToPay,
        mode: mode,
        timestamp: Date.now(),
        details: details
    };

    // 4. Log to Persistent History for Z-Report (Accountability System)
    let logDetailString = '';
    if (mode === PaymentMode.UPI && details.upiRef) logDetailString = `Ref: ${details.upiRef}`;
    if (mode === PaymentMode.CARD && details.cardDigits) logDetailString = `xx${details.cardDigits}`;
    
    db.savePaymentLog({
        id: transaction.id,
        billNumber: billNo!,
        tableNumber: activeTable,
        amount: amountToPay,
        mode: mode,
        timestamp: Date.now(),
        session: db.getCurrentSession(),
        details: logDetailString
    });

    // 5. Update Local Bill State
    const updatedPayments = [...activeBill.payments, transaction];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalDue - totalPaid;
    // Allow small float margin
    const isPaid = balance <= 0.5; 

    updateActiveBill({ 
        payments: updatedPayments, 
        discountPercent: discountVal 
    });

    // 6. If Paid in Full, Archive Bill and Clear Table
    if (isPaid) {
        const finalBill = db.saveBill(
            cart, 
            totalDue, 
            subTotal, 
            cgst, 
            sgst, 
            type, 
            activeTable, 
            discountAmount, 
            updatedPayments, 
            billNo!
        );
        setLastBill(finalBill);
        
        // Reset Table
        setOpenBills(prev => {
            const newState = { ...prev };
            delete newState[activeTable];
            return newState;
        });
        
        // Go back to table grid automatically after full payment
        setActiveTable('');

        // Print Final Receipt
        setRenderMode('PRINT');
        setPrintMode('BILL');
        setTimeout(() => {
            window.print();
        }, 100);
    } else {
        alert(`Payment of ₹${amountToPay} Recorded. Balance: ₹${balance.toFixed(2)}`);
    }
  };

  const handleReprint = (bill: Bill) => {
      setLastBill(bill);
      setRenderMode('PRINT');
      setPrintMode('BILL');
      setTimeout(() => {
          window.print();
      }, 200);
  };

  // --------------- SETTLEMENT LOGIC ---------------- //

  const generatePDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
        // @ts-ignore
        const canvas = await window.html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);
    } catch (err) {
        console.error("PDF Generation failed", err);
    }
  };

  const handleOpenSettlement = () => {
      const report = db.getSettlementReport(0);
      setSettlementData(report);
      setShowZReport(true);
  };

  const handleCloseShift = (actualCash: number) => {
      if (!settlementData) return;
      
      const finalReport: SettlementData = { 
          ...settlementData, 
          cashDrawer: { 
              ...settlementData.cashDrawer, 
              actual: actualCash, 
              difference: actualCash - settlementData.cashDrawer.expected 
          } 
      };
      
      db.saveSettlement(finalReport);
      setSettlementData(finalReport);
      
      setRenderMode('CANVAS');
      setPrintMode('SETTLEMENT');
      setShowZReport(false);
      
      setTimeout(() => {
         generatePDF('pdf-receipt-capture', `Settlement-${finalReport.session}-${new Date().toLocaleDateString()}.pdf`);
         setRenderMode('PRINT');
      }, 500);
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden no-print font-sans text-gray-800">
      <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-6 z-20 shadow-sm">
        <div className="p-2 bg-blue-600 rounded text-white">
            <Store size={20} />
        </div>
        
        <nav className="flex flex-col space-y-4 w-full items-center">
            <button 
                onClick={() => setView('POS')}
                className={`p-2 rounded transition-all ${view === 'POS' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="POS Terminal"
            >
                <Store size={20} />
            </button>
            <button 
                onClick={() => setView('TRANSACTIONS')}
                className={`p-2 rounded transition-all ${view === 'TRANSACTIONS' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Transactions"
            >
                <History size={20} />
            </button>
            <button 
                onClick={() => setView('REPORTS')}
                className={`p-2 rounded transition-all ${view === 'REPORTS' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Reports"
            >
                <LayoutDashboard size={20} />
            </button>
            <button 
                onClick={() => setView('SETTINGS')}
                className={`p-2 rounded transition-all ${view === 'SETTINGS' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Settings"
            >
                <SettingsIcon size={20} />
            </button>
        </nav>

        <div className="mt-auto mb-2">
             <button 
                onClick={handleOpenSettlement}
                className="p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                title="End Shift"
            >
                <Power size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative bg-gray-100">
        {view === 'POS' && (
            <POSTerminal 
                menuItems={menuItems}
                cart={cart}
                activeTable={activeTable}
                billStatus={currentStatus}
                openBills={openBills}
                activeBill={activeBill}
                onAddItem={addToCart}
                onRemoveItem={removeFromCart}
                onUpdateQty={updateQty}
                onClearCart={clearCart}
                onCheckout={handleCheckout}
                onSwitchTable={handleSwitchTable}
                onVoidTable={handleVoidTable}
                onPrintKOT={handlePrintKOT}
                onPrintBill={handlePrintBill}
            />
        )}
        
        {view === 'REPORTS' && (
            <div className="w-full h-full overflow-hidden bg-white">
                <Reports />
            </div>
        )}

        {view === 'SETTINGS' && (
            <div className="w-full h-full overflow-hidden bg-white">
                <Settings menuItems={menuItems} onUpdateMenu={setMenuItems} />
            </div>
        )}

        {view === 'TRANSACTIONS' && (
            <div className="w-full h-full overflow-hidden bg-white">
                <Transactions onReprint={handleReprint} />
            </div>
        )}
      </div>
      
      {showZReport && settlementData && (
          <ZReportModal 
             data={settlementData}
             onClose={() => setShowZReport(false)}
             onPrintAndClose={handleCloseShift}
          />
      )}
      
      <Receipt 
        bill={lastBill} 
        itemsToPrint={itemsToPrint}
        tableNumber={activeTable}
        kotOrderType={kotOrderType}
        settlementData={settlementData} 
        mode={printMode} 
        renderMode="PRINT" 
      />

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