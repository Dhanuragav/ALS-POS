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

export interface PaymentDetails {
  upiRef?: string;
  cardDigits?: string;
  bankName?: string;
  cashTendered?: number;
  cashBalance?: number;
}

export interface Bill {
  id: string; // Auto-generated
  billNumber: string; // L-1001 or D-1001
  timestamp: number;
  session: SessionType;
  items: CartItem[];
  subTotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  paymentDetails?: PaymentDetails;
  orderType: OrderType;
  tableNumber?: string;
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
  cgst: number;
  sgst: number;
  grandTotal: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
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

export type ViewMode = 'POS' | 'REPORTS' | 'SETTINGS';