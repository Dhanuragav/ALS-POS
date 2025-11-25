import React, { useState, useEffect } from 'react';
import { CartItem, OrderType, PaymentMode, Bill } from '../types';
import { Trash2, Plus, Minus, Printer, ChefHat, Download, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { CGST_PERCENTAGE, SGST_PERCENTAGE } from '../constants';

interface CartSidebarProps {
  cart: CartItem[];
  lastBill: Bill | null;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: (mode: PaymentMode, type: OrderType, table: string, details: any) => void;
  onDownloadPdf: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ cart, lastBill, onUpdateQty, onRemove, onClear, onCheckout, onDownloadPdf }) => {
  const [payMode, setPayMode] = useState<PaymentMode>(PaymentMode.CASH);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [tableNum, setTableNum] = useState<string>('');
  
  // Payment Details
  const [upiRef, setUpiRef] = useState('');
  const [cardDigits, setCardDigits] = useState('');
  const [cashTendered, setCashTendered] = useState<string>('');

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cgstAmount = subTotal * CGST_PERCENTAGE;
  const sgstAmount = subTotal * SGST_PERCENTAGE;
  const totalAmount = subTotal + cgstAmount + sgstAmount;

  // Reset inputs when cart clears
  useEffect(() => {
    if (cart.length === 0) {
      setUpiRef('');
      setCardDigits('');
      setCashTendered('');
      setTableNum('');
    }
  }, [cart]);

  const handleCheckout = () => {
    onCheckout(payMode, orderType, tableNum, {
      upiRef,
      cardDigits,
      cashTendered: cashTendered ? parseFloat(cashTendered) : undefined,
      cashBalance: cashTendered ? parseFloat(cashTendered) - totalAmount : undefined
    });
  };

  const renderPaymentInputs = () => {
    switch(payMode) {
      case PaymentMode.UPI:
        return (
          <input
            type="text"
            placeholder="UPI Ref ID / GPay Trans ID"
            value={upiRef}
            onChange={e => setUpiRef(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        );
      case PaymentMode.CARD:
        return (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Last 4 Digits"
              maxLength={4}
              value={cardDigits}
              onChange={e => setCardDigits(e.target.value)}
              className="w-1/2 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <input
               type="text"
               placeholder="Bank (Optional)"
               className="w-1/2 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        );
      case PaymentMode.CASH:
        return (
            <div className="mt-2">
                 <input
                    type="number"
                    placeholder="Cash Tendered (₹)"
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {cashTendered && !isNaN(parseFloat(cashTendered)) && (
                    <div className="mt-1 text-right text-sm font-bold text-emerald-600">
                        Balance to Return: ₹{(parseFloat(cashTendered) - totalAmount).toFixed(2)}
                    </div>
                )}
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full md:w-[400px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="font-bold text-gray-800 text-lg">Current Bill</h2>
        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
          {cart.length} Items
        </span>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ChefHat size={48} className="mb-2 opacity-20" />
            <p>No items in cart</p>
            {lastBill && (
                <div className="mt-6 flex flex-col items-center">
                    <p className="text-xs text-emerald-600 mb-2 font-medium">Last Bill: {lastBill.billNumber}</p>
                    <button 
                        onClick={onDownloadPdf}
                        className="flex items-center space-x-2 bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg shadow-sm hover:bg-emerald-50 transition-colors text-sm font-semibold"
                    >
                        <Download size={16} />
                        <span>Download PDF</span>
                    </button>
                </div>
            )}
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
              <div className="flex-1">
                <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">₹{item.price} x {item.quantity}</p>
              </div>
              <div className="flex items-center space-x-3">
                 <div className="flex items-center bg-gray-100 rounded-lg">
                    <button onClick={() => onUpdateQty(item.id, -1)} className="p-1 hover:bg-gray-200 rounded-l-lg text-gray-600"><Minus size={14}/></button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.id, 1)} className="p-1 hover:bg-gray-200 rounded-r-lg text-gray-600"><Plus size={14}/></button>
                 </div>
                 <div className="text-right w-16">
                    <p className="font-bold text-gray-800 text-sm">₹{item.price * item.quantity}</p>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bill Settings */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
         <div className="grid grid-cols-2 gap-2">
            <select 
                value={orderType} 
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white"
            >
                <option value={OrderType.DINE_IN}>Dine-In</option>
                <option value={OrderType.TAKEAWAY}>Takeaway</option>
            </select>
            {orderType === OrderType.DINE_IN && (
                <input 
                    type="text" 
                    placeholder="Table No" 
                    value={tableNum}
                    onChange={(e) => setTableNum(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                />
            )}
         </div>
         
         {/* Payment Modes */}
         <div className="flex bg-gray-200 p-1 rounded-lg">
            <button 
                onClick={() => setPayMode(PaymentMode.CASH)}
                className={`flex-1 flex justify-center items-center py-2 text-xs font-semibold rounded-md transition-all ${payMode === PaymentMode.CASH ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Banknote size={16} className="mr-1"/> Cash
            </button>
            <button 
                onClick={() => setPayMode(PaymentMode.UPI)}
                className={`flex-1 flex justify-center items-center py-2 text-xs font-semibold rounded-md transition-all ${payMode === PaymentMode.UPI ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Smartphone size={16} className="mr-1"/> UPI
            </button>
            <button 
                onClick={() => setPayMode(PaymentMode.CARD)}
                className={`flex-1 flex justify-center items-center py-2 text-xs font-semibold rounded-md transition-all ${payMode === PaymentMode.CARD ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <CreditCard size={16} className="mr-1"/> Card
            </button>
         </div>

         {/* Dynamic Payment Inputs */}
         {renderPaymentInputs()}
      </div>

      {/* Totals & Action */}
      <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="space-y-1 mb-4 text-sm">
            <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs">
                <span>CGST (2.5%)</span>
                <span>₹{cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs">
                <span>SGST (2.5%)</span>
                <span>₹{sgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-dashed border-gray-200 mt-2">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(0)}</span>
            </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
            <button 
                onClick={onClear} 
                disabled={cart.length === 0}
                className="col-span-1 flex flex-col items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
                <Trash2 size={20} />
            </button>
            <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="col-span-3 flex items-center justify-center space-x-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg py-3 shadow-lg shadow-emerald-200"
            >
                <Printer size={24} />
                <span>PRINT BILL</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;