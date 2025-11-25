import { Bill, MenuItem, CartItem, PaymentMode, SessionType, PaymentDetails, SettlementData } from '../types';
import { SEED_MENU } from '../constants';
import saveAs from 'file-saver';
import JSZip from 'jszip';

const KEYS = {
  MENU: 'pos_menu_v3', 
  BILLS: 'pos_bills',
  SETTLEMENTS: 'pos_settlements',
  SEQ_LUNCH: 'pos_seq_lunch',
  SEQ_DINNER: 'pos_seq_dinner',
};

// Initialize DB if empty
export const initDB = () => {
  if (!localStorage.getItem(KEYS.MENU)) {
    localStorage.setItem(KEYS.MENU, JSON.stringify(SEED_MENU));
  }
  if (!localStorage.getItem(KEYS.BILLS)) {
    localStorage.setItem(KEYS.BILLS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SETTLEMENTS)) {
    localStorage.setItem(KEYS.SETTLEMENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SEQ_LUNCH)) {
    localStorage.setItem(KEYS.SEQ_LUNCH, '1000');
  }
  if (!localStorage.getItem(KEYS.SEQ_DINNER)) {
    localStorage.setItem(KEYS.SEQ_DINNER, '1000');
  }
};

export const getMenu = (): MenuItem[] => {
  const data = localStorage.getItem(KEYS.MENU);
  return data ? JSON.parse(data) : SEED_MENU;
};

export const saveMenu = (items: MenuItem[]) => {
  localStorage.setItem(KEYS.MENU, JSON.stringify(items));
};

export const getBills = (): Bill[] => {
  const data = localStorage.getItem(KEYS.BILLS);
  const bills = data ? JSON.parse(data) : [];
  // Sort by timestamp desc
  return bills.sort((a: Bill, b: Bill) => b.timestamp - a.timestamp);
};

export const getSettlements = (): SettlementData[] => {
  const data = localStorage.getItem(KEYS.SETTLEMENTS);
  return data ? JSON.parse(data) : [];
};

export const getCurrentSession = (): SessionType => {
  const hour = new Date().getHours();
  // Lunch Session: 6:00 AM to 3:00 PM (06:00 - 15:00)
  if (hour >= 6 && hour < 15) {
    return SessionType.LUNCH;
  }
  return SessionType.DINNER;
};

export const saveBill = (
  items: CartItem[], 
  total: number, 
  subTotal: number, 
  cgst: number,
  sgst: number,
  paymentMode: PaymentMode, 
  orderType: any, 
  tableNumber?: string,
  paymentDetails?: PaymentDetails,
  discount: number = 0
): Bill => {
  
  const session = getCurrentSession();
  const seqKey = session === SessionType.LUNCH ? KEYS.SEQ_LUNCH : KEYS.SEQ_DINNER;
  const prefix = session === SessionType.LUNCH ? 'L-' : 'D-';
  
  const currentSeq = parseInt(localStorage.getItem(seqKey) || '1000');
  const nextSeq = currentSeq + 1;
  localStorage.setItem(seqKey, nextSeq.toString());

  const billNumber = `${prefix}${nextSeq}`;

  const newBill: Bill = {
    id: crypto.randomUUID(),
    billNumber,
    timestamp: Date.now(),
    session,
    items,
    subTotal,
    discount,
    cgst,
    sgst,
    totalAmount: total,
    paymentMode,
    paymentDetails,
    orderType,
    tableNumber,
  };

  // Get raw bills array (not sorted) to push
  const data = localStorage.getItem(KEYS.BILLS);
  const bills = data ? JSON.parse(data) : [];
  bills.push(newBill);
  localStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
  return newBill;
};

export const getSettlementReport = (actualCash: number): SettlementData => {
  const bills = getBills(); // Already gets from LS
  const settlements = getSettlements();
  
  const lastSettlementTime = settlements.length > 0 
    ? Math.max(...settlements.map(s => s.endTime)) 
    : 0;

  const pendingBills = bills.filter(b => b.timestamp > lastSettlementTime);

  const session = getCurrentSession();
  const startTime = pendingBills.length > 0 ? Math.min(...pendingBills.map(b => b.timestamp)) : Date.now();
  const endTime = Date.now();

  const data: SettlementData = {
    id: crypto.randomUUID(),
    session,
    startTime,
    endTime,
    totalBills: pendingBills.length,
    billIds: pendingBills.map(b => b.billNumber),
    totalQty: pendingBills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0),
    subTotal: pendingBills.reduce((sum, b) => sum + b.subTotal, 0),
    cgst: pendingBills.reduce((sum, b) => sum + b.cgst, 0),
    sgst: pendingBills.reduce((sum, b) => sum + b.sgst, 0),
    grandTotal: pendingBills.reduce((sum, b) => sum + b.totalAmount, 0),
    cashSales: 0,
    upiSales: 0,
    cardSales: 0,
    paymentBreakdown: [],
    cashDrawer: {
      expected: 0,
      actual: actualCash,
      difference: 0
    }
  };

  const breakdown: Record<string, { amount: number, count: number, details: string[] }> = {};

  pendingBills.forEach(b => {
    if (!breakdown[b.paymentMode]) {
      breakdown[b.paymentMode] = { amount: 0, count: 0, details: [] };
    }
    breakdown[b.paymentMode].amount += b.totalAmount;
    breakdown[b.paymentMode].count += 1;
    
    // Add refs
    if (b.paymentMode === PaymentMode.UPI && b.paymentDetails?.upiRef) {
      breakdown[b.paymentMode].details.push(`Ref: ${b.paymentDetails.upiRef}`);
    } else if (b.paymentMode === PaymentMode.CARD && b.paymentDetails?.cardDigits) {
      breakdown[b.paymentMode].details.push(`xx${b.paymentDetails.cardDigits}`);
    }
  });

  data.paymentBreakdown = Object.entries(breakdown).map(([mode, val]) => ({
    mode: mode as PaymentMode,
    amount: val.amount,
    count: val.count,
    details: val.details
  }));

  data.cashSales = breakdown[PaymentMode.CASH]?.amount || 0;
  data.upiSales = breakdown[PaymentMode.UPI]?.amount || 0;
  data.cardSales = breakdown[PaymentMode.CARD]?.amount || 0;

  data.cashDrawer.expected = data.cashSales;
  data.cashDrawer.difference = data.cashDrawer.actual - data.cashDrawer.expected;

  return data;
};

export const saveSettlement = (data: SettlementData) => {
    const settlements = getSettlements();
    settlements.push(data);
    localStorage.setItem(KEYS.SETTLEMENTS, JSON.stringify(settlements));
};

export const exportBillsToCSV = () => {
    const bills = getBills();
    if(bills.length === 0) {
        alert("No bills to export");
        return;
    }

    // CSV Header
    let csvContent = "Bill ID,Session,Date,Time,Table,Order Type,Payment Mode,SubTotal,Discount,CGST,SGST,Total,Ref/Details\n";

    bills.forEach(b => {
        const date = new Date(b.timestamp).toLocaleDateString();
        const time = new Date(b.timestamp).toLocaleTimeString();
        let details = "";
        if(b.paymentDetails?.upiRef) details = `UPI: ${b.paymentDetails.upiRef}`;
        if(b.paymentDetails?.cardDigits) details = `Card: xx${b.paymentDetails.cardDigits}`;
        if(b.paymentDetails?.cashTendered) details = `Cash Given: ${b.paymentDetails.cashTendered}`;

        const row = [
            b.billNumber,
            b.session,
            date,
            time,
            b.tableNumber || "N/A",
            b.orderType,
            b.paymentMode,
            b.subTotal.toFixed(2),
            (b.discount || 0).toFixed(2),
            b.cgst.toFixed(2),
            b.sgst.toFixed(2),
            b.totalAmount.toFixed(2),
            details
        ].join(",");
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Sales_Export_${new Date().toLocaleDateString()}.csv`);
};

export const exportPDFsAsZip = async (generatePDFCallback: (bill: Bill) => Promise<Blob | null>) => {
    // Logic remains handled by UI for zip generation in this simple app
    return getBills();
};