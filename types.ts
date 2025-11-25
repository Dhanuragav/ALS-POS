export enum Category {
  MEALS = 'Fixed Meals',
  SOUPS = 'Soups / Rasam',
  STARTERS = 'Starters',
  SALADS = 'Salads & Raitha',
  NORTH_INDIAN = 'North Indian',
  RICE = 'Rice & Pulao',
  BREADS = 'Indian Breads',
  SOUTH_INDIAN = 'South Indian',
  DOSA = 'Dosa & Oothapam',
  HOT_BEVERAGES = 'Hot Beverages',
  COLD_BEVERAGES = 'Cold Beverages',
  DESSERTS = 'Desserts',
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  shortCode?: string; // For KOT
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  isKotPrinted?: boolean; // Track if sent to kitchen
}

export enum PaymentMode {
  CASH = 'Cash',
  UPI = 'UPI',
  CARD = 'Card',
}

export enum OrderType {
  DINE_IN = 'Dine-In',
  TAKEAWAY = 'Takeaway',
}

export enum SessionType {
  LUNCH = 'Lunch',
  DINNER = 'Dinner',
}

export enum BillStatus {
  NEW = 'NEW',
  KOT_SENT = 'KOT SENT',
  BILL_PRINTED = 'BILL PRINTED',
  PAID = 'PAID'
}

export interface PaymentDetails {
  upiRef?: string;
  cardDigits?: string;
  bankName?: string;
  cashTendered?: number;
  cashBalance?: number;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  mode: PaymentMode;
  timestamp: number;
  details?: PaymentDetails;
}

export interface Bill {
  id: string; // Auto-generated
  billNumber: string; // L-1001 or D-1001
  timestamp: number;
  session: SessionType;
  items: CartItem[];
  subTotal: number;
  discount: number; 
  cgst: number;
  sgst: number;
  totalAmount: number;
  // Deprecated single mode in favor of transactions, kept for compat or display
  paymentMode: PaymentMode; 
  paymentDetails?: PaymentDetails;
  payments: PaymentTransaction[]; // History of payments
  orderType: OrderType;
  tableNumber?: string;
}

export interface OpenBill {
  tableNumber: string;
  items: CartItem[];
  status: BillStatus;
  timestamp: number;
  orderType: OrderType;
  billNumber?: string; // Assigned on first F9
  payments: PaymentTransaction[];
  discountPercent?: number;
  pax?: number; // Number of people
}

export interface PaymentLog {
    id: string;
    billNumber: string; // "TEMP" if not yet generated, or actual ID
    tableNumber: string;
    amount: number;
    mode: PaymentMode;
    timestamp: number;
    session: SessionType;
    details?: string;
}

export interface SettlementData {
  id: string;
  session: SessionType;
  startTime: number;
  endTime: number;
  totalBills: number;
  billIds: string[];
  totalQty: number;
  subTotal: number;
  totalDiscount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  creditSales: number; // Combined Card + UPI
  paymentBreakdown: {
    mode: PaymentMode;
    amount: number;
    count: number;
    details: string[]; // List of refs/digits
  }[];
  cashDrawer: {
    expected: number;
    actual: number;
    difference: number;
  };
}

export interface SalesSummary {
  totalBills: number;
  totalRevenue: number;
  cashRevenue: number;
  upiRevenue: number;
  date: string;
}

export type ViewMode = 'POS' | 'REPORTS' | 'SETTINGS' | 'TRANSACTIONS';