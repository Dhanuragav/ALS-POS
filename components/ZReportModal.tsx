import React, { useState } from 'react';
import { SettlementData } from '../types';
import { Printer, X, Save } from 'lucide-react';

interface ZReportModalProps {
  data: SettlementData;
  onClose: () => void;
  onPrintAndClose: (actualCash: number) => void;
}

const ZReportModal: React.FC<ZReportModalProps> = ({ data, onClose, onPrintAndClose }) => {
  const [actualCash, setActualCash] = useState<string>('');

  const difference = (parseFloat(actualCash) || 0) - data.cashSales;
  const isShortage = difference < 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col overflow-hidden text-gray-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wider">Z-Report / Shift End</h2>
            <p className="text-xs font-bold font-mono mt-1 opacity-90">
              SESSION: {data.session} • {new Date(data.startTime).toLocaleTimeString()} - {new Date(data.endTime).toLocaleTimeString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50">
            
            {/* Left Column: Revenue Breakdown */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Revenue Breakdown</h3>
                    <div className="bg-white rounded-lg p-4 space-y-3 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium">Cash Sales</span>
                            <span className="text-2xl font-mono font-bold text-green-600">₹{data.cashSales.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-lg font-medium">Credit Sales</span>
                                <span className="text-xs text-gray-400">(Card + UPI)</span>
                            </div>
                            <span className="text-2xl font-mono font-bold text-blue-600">₹{data.creditSales.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Audit Items */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                         <span className="block text-xs text-gray-400 uppercase mb-1">Discounts Given</span>
                         <span className="text-xl font-mono font-bold text-red-500">-₹{data.totalDiscount.toFixed(2)}</span>
                     </div>
                     <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                         <span className="block text-xs text-gray-400 uppercase mb-1">Tax Collected</span>
                         <span className="text-xl font-mono font-bold text-gray-700">₹{(data.cgst + data.sgst).toFixed(2)}</span>
                     </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 uppercase mt-2">
                    <span>Total Transactions: {data.totalBills}</span>
                    <span>Total Qty: {data.totalQty}</span>
                </div>
            </div>

            {/* Right Column: Totals & Reconciliation */}
            <div className="flex flex-col justify-between">
                
                {/* Grand Total */}
                <div className="bg-white border-2 border-blue-600 p-6 rounded-lg text-right mb-6 shadow-sm">
                    <span className="block text-blue-600 text-sm font-bold uppercase tracking-widest mb-1">Overall Total Sales</span>
                    <span className="block text-gray-900 text-5xl font-mono font-bold tracking-tighter">
                        ₹{data.grandTotal.toFixed(0)}
                    </span>
                </div>

                {/* Cash Reconciliation */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Cash Drawer Reconciliation</h3>
                    <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
                        <span>Expected Cash:</span>
                        <span className="font-mono font-bold text-gray-900">₹{data.cashSales.toFixed(2)}</span>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-xs uppercase text-blue-600 font-bold mb-1">Actual Cash in Drawer</label>
                        <input 
                            autoFocus
                            type="number" 
                            placeholder="0.00"
                            value={actualCash}
                            onChange={(e) => setActualCash(e.target.value)}
                            className="w-full bg-gray-50 text-gray-900 text-2xl font-mono p-3 rounded border border-gray-300 focus:border-blue-600 outline-none focus:bg-white transition-all"
                        />
                    </div>

                    {actualCash && (
                        <div className={`text-right font-mono font-bold text-lg ${isShortage ? 'text-red-500' : 'text-green-600'}`}>
                            {isShortage ? 'Shortage: ' : 'Excess: '}
                            {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-4">
            <button 
                onClick={onClose}
                className="px-6 py-3 rounded font-bold uppercase text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={() => onPrintAndClose(parseFloat(actualCash) || 0)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold uppercase tracking-wide flex items-center gap-2 shadow-lg transition-colors"
            >
                <Printer size={20} />
                <span>Print & Close Shift</span>
            </button>
        </div>

      </div>
    </div>
  );
};

export default ZReportModal;