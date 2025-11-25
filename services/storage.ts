import { Bill, MenuItem, CartItem, PaymentMode, SessionType, PaymentDetails, SettlementData, OpenBill, BillStatus, OrderType, PaymentTransaction, PaymentLog } from '../types';
import { SEED_MENU } from '../constants';
import saveAs from 'file-saver';
import JSZip from 'jszip';

const KEYS = {
  MENU: 'pos_menu_v3', 
  BILLS: 'pos_bills',
  PAYMENT_LOGS: 'pos_payment_logs',
  SETTLEMENTS: 'pos_settlements',
  SEQ_LUNCH: 'pos_seq_lunch',
  SEQ_DINNER: 'pos_seq_dinner',
  OPEN_BILLS: 'pos_open_bills',
};

// Initialize DB if empty
export const initDB = () => {
  if (!localStorage.getItem(KEYS.MENU)) {
    localStorage.setItem(KEYS.MENU, JSON.stringify(SEED_MENU));
  }
  if (!localStorage.getItem(KEYS.BILLS)) {
    localStorage.setItem(KEYS.BILLS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.PAYMENT_LOGS)) {
    localStorage.setItem(KEYS.PAYMENT_LOGS, JSON.stringify([]));
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
  if (!localStorage.getItem(KEYS.OPEN_BILLS)) {
    const initial: Record<string, OpenBill> = {
        '1': {
            tableNumber: '1',
            items: [],
            status: BillStatus.NEW,
            timestamp: Date.now(),
            orderType: OrderType.DINE_IN,
            payments: []
        }
    };
    localStorage.setItem(KEYS.OPEN_BILLS, JSON.stringify(initial));
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
  return bills.sort((a: Bill, b: Bill) => b.timestamp - a.timestamp);
};

export const getPaymentLogs = (): PaymentLog[] => {
    const data = localStorage.getItem(KEYS.PAYMENT_LOGS);
    return data ? JSON.parse(data) : [];
};

export const savePaymentLog = (log: PaymentLog) => {
    const logs = getPaymentLogs();
    logs.push(log);
    localStorage.setItem(KEYS.PAYMENT_LOGS, JSON.stringify(logs));
};

export const getOpenBills = (): Record<string, OpenBill> => {
    const data = localStorage.getItem(KEYS.OPEN_BILLS);
    return data ? JSON.parse(data) : {};
};

export const saveOpenBills = (bills: Record<string, OpenBill>) => {
    localStorage.setItem(KEYS.OPEN_BILLS, JSON.stringify(bills));
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

export const generateBillNumber = (): string => {
    const session = getCurrentSession();
    const seqKey = session === SessionType.LUNCH ? KEYS.SEQ_LUNCH : KEYS.SEQ_DINNER;
    const prefix = session === SessionType.LUNCH ? 'L-' : 'D-';
    
    const currentSeq = parseInt(localStorage.getItem(seqKey) || '1000');
    const nextSeq = currentSeq + 1;
    localStorage.setItem(seqKey, nextSeq.toString());
  
    return `${prefix}${nextSeq}`;
};

export const saveBill = (
  items: CartItem[], 
  total: number, 
  subTotal: number, 
  cgst: number,
  sgst: number,
  orderType: any, 
  tableNumber: string | undefined,
  discount: number,
  payments: PaymentTransaction[],
  billNumber: string
): Bill => {
  
  const session = getCurrentSession();
  
  // Use the last payment mode as the "primary" mode for simple list display, or 'Split'
  const primaryMode = payments.length > 0 ? payments[payments.length - 1].mode : PaymentMode.CASH;

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
    paymentMode: primaryMode, 
    paymentDetails: payments.length > 0 ? payments[payments.length - 1].details : undefined,
    payments,
    orderType,
    tableNumber,
  };

  const data = localStorage.getItem(KEYS.BILLS);
  const bills = data ? JSON.parse(data) : [];
  bills.push(newBill);
  localStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
  return newBill;
};

export const getSettlementReport = (actualCash: number): SettlementData => {
  const bills = getBills(); 
  const logs = getPaymentLogs();
  const settlements = getSettlements();
  
  const lastSettlementTime = settlements.length > 0 
    ? Math.max(...settlements.map(s => s.endTime)) 
    : 0;

  // Revenue is calculated from Payment Logs created during this session (since last settlement)
  const sessionLogs = logs.filter(l => l.timestamp > lastSettlementTime);
  
  // Bills closed in this session (for item qty stats etc)
  const sessionBills = bills.filter(b => b.timestamp > lastSettlementTime);

  const session = getCurrentSession();
  const startTime = sessionLogs.length > 0 ? Math.min(...sessionLogs.map(l => l.timestamp)) : Date.now();
  const endTime = Date.now();

  const data: SettlementData = {
    id: crypto.randomUUID(),
    session,
    startTime,
    endTime,
    totalBills: sessionBills.length,
    billIds: sessionBills.map(b => b.billNumber),
    totalQty: sessionBills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0),
    subTotal: sessionBills.reduce((sum, b) => sum + b.subTotal, 0),
    totalDiscount: sessionBills.reduce((sum, b) => sum + (b.discount || 0), 0),
    cgst: sessionBills.reduce((sum, b) => sum + b.cgst, 0),
    sgst: sessionBills.reduce((sum, b) => sum + b.sgst, 0),
    grandTotal: sessionLogs.reduce((sum, l) => sum + l.amount, 0), // Revenue based on actual payments logged
    cashSales: 0,
    upiSales: 0,
    cardSales: 0,
    creditSales: 0,
    paymentBreakdown: [],
    cashDrawer: {
      expected: 0,
      actual: actualCash,
      difference: 0
    }
  };

  const breakdown: Record<string, { amount: number, count: number, details: string[] }> = {};

  sessionLogs.forEach(log => {
    if (!breakdown[log.mode]) {
      breakdown[log.mode] = { amount: 0, count: 0, details: [] };
    }
    breakdown[log.mode].amount += log.amount;
    breakdown[log.mode].count += 1;
    
    if(log.details) {
        breakdown[log.mode].details.push(log.details);
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
  
  data.creditSales = data.upiSales + data.cardSales;

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
    // Legacy export logic - can be updated to include split payments if needed
    const bills = getBills();
    if(bills.length === 0) {
        alert("No bills to export");
        return;
    }
    let csvContent = "Bill ID,Session,Date,Time,Table,Total,Payment Modes\n";
    bills.forEach(b => {
        const date = new Date(b.timestamp).toLocaleDateString();
        const time = new Date(b.timestamp).toLocaleTimeString();
        const modes = b.payments.map(p => `${p.mode}: ${p.amount}`).join(' | ');
        const row = [
            b.billNumber,
            b.session,
            date,
            time,
            b.tableNumber || "N/A",
            b.totalAmount.toFixed(2),
            modes
        ].join(",");
        csvContent += row + "\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Sales_Export_${new Date().toLocaleDateString()}.csv`);
};

export const exportPDFsAsZip = async (generatePDFCallback: (bill: Bill) => Promise<Blob | null>) => {
    return getBills();
};