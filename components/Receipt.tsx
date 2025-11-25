import React from 'react';
import { Bill, SettlementData, PaymentMode, CartItem } from '../types';
import { RESTAURANT_NAME, RESTAURANT_ADDRESS, RESTAURANT_PHONE, RESTAURANT_GSTIN } from '../constants';

interface ReceiptProps {
  bill: Bill | null;
  itemsToPrint?: CartItem[]; // For KOT
  settlementData?: SettlementData | null;
  mode: 'BILL' | 'KOT' | 'SETTLEMENT';
  renderMode?: 'PRINT' | 'CANVAS';
  tableNumber?: string; // For KOT
  kotOrderType?: string; // For KOT "Supplementary" vs "New"
}

const Receipt: React.FC<ReceiptProps> = ({ bill, itemsToPrint, settlementData, mode, renderMode = 'PRINT', tableNumber, kotOrderType }) => {
  if (mode === 'BILL' && !bill) return null;
  if (mode === 'SETTLEMENT' && !settlementData) return null;
  if (mode === 'KOT' && !itemsToPrint) return null;

  const now = new Date();
  const printTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const billDate = bill ? new Date(bill.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : now.toLocaleDateString();
  const billTime = bill ? new Date(bill.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : now.toLocaleTimeString();

  const containerClass = renderMode === 'PRINT' 
    ? "hidden print-only print:block font-mono text-black w-[78mm] mx-auto p-1 leading-tight text-[12px]"
    : "block font-mono text-black w-[370px] bg-white p-4 leading-tight text-[12px]";

  const Divider = () => <div className="border-b border-dashed border-black my-1 w-full"></div>;

  return (
    <div className={containerClass}>
      {renderMode === 'PRINT' && (
        <style>{`
            @media print {
                @page { margin: 0; size: auto; }
                body { margin: 0; }
                .print-only { display: block !important; }
                * {
                    font-family: 'Courier New', Courier, monospace !important;
                    font-weight: 600;
                    -webkit-print-color-adjust: exact;
                }
            }
        `}</style>
      )}

      {/* ----------------- BILL FORMAT ----------------- */}
      {mode === 'BILL' && bill && (
        <div className="flex flex-col">
          {/* Header */}
          <div className="text-center mb-2">
            <h1 className="text-lg font-extrabold uppercase tracking-wide">{RESTAURANT_NAME}</h1>
            <p className="whitespace-pre-wrap text-[11px]">{RESTAURANT_ADDRESS}</p>
            <p className="text-[11px]">Ph: {RESTAURANT_PHONE}</p>
            <p className="mt-1 font-bold text-[11px]">GSTIN: {RESTAURANT_GSTIN}</p>
          </div>

          <Divider />

          {/* Invoice Meta */}
          <div className="flex justify-between uppercase">
             <span>Invoice No:</span>
             <span className="font-bold">{bill.billNumber}</span>
          </div>
          <div className="flex justify-between uppercase">
             <span>Date:</span>
             <span>{billDate} {billTime}</span>
          </div>
          <div className="flex justify-between uppercase">
             <span>Table No:</span>
             <span>{bill.tableNumber || 'N/A'}</span>
          </div>

          <Divider />

          {/* Items Table Headers */}
          <div className="grid grid-cols-12 gap-1 mb-1 font-bold uppercase text-[11px]">
             <div className="col-span-5 text-left">Item Name</div>
             <div className="col-span-2 text-center">Qty</div>
             <div className="col-span-2 text-right">Rate</div>
             <div className="col-span-3 text-right">Total</div>
          </div>
          
          <Divider />

          {/* Items List */}
          <div className="flex flex-col gap-1 mb-2">
            {bill.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-1 items-start text-[11px]">
                <div className="col-span-5 text-left leading-tight">{item.name}</div>
                <div className="col-span-2 text-center">{item.quantity}</div>
                <div className="col-span-2 text-right">{item.price.toFixed(2)}</div>
                <div className="col-span-3 text-right">{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <Divider />

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 text-[11px]">
            <div className="flex justify-between w-full max-w-[220px]">
                <span>Total Qty:</span>
                <span>{bill.items.reduce((s,i) => s + i.quantity, 0)}</span>
            </div>
            <div className="flex justify-between w-full max-w-[220px]">
                <span>Sub Total:</span>
                <span>{bill.subTotal.toFixed(2)}</span>
            </div>
            
            {bill.discount > 0 && (
                <div className="flex justify-between w-full max-w-[220px]">
                    <span>Discount:</span>
                    <span>-{bill.discount.toFixed(2)}</span>
                </div>
            )}

            <div className="flex justify-between w-full max-w-[220px]">
                <span>CGST @ 2.5%:</span>
                <span>{bill.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full max-w-[220px]">
                <span>SGST @ 2.5%:</span>
                <span>{bill.sgst.toFixed(2)}</span>
            </div>
            
            <div className="w-full border-t border-black my-1"></div>
            
            <div className="flex justify-between w-full max-w-[220px] text-sm font-extrabold">
                <span>Total Due:</span>
                <span>{bill.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <Divider />

          {/* Payment History */}
          <div className="mt-2 text-[11px]">
              <p className="font-bold mb-1">PAYMENT HISTORY</p>
              {bill.payments && bill.payments.length > 0 ? (
                  bill.payments.map((p, i) => (
                      <div key={i} className="flex justify-between">
                          <span>{new Date(p.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} {p.mode}</span>
                          <span>{p.amount.toFixed(2)}</span>
                      </div>
                  ))
              ) : (
                  <div className="flex justify-between">
                      <span>{bill.paymentMode}</span>
                      <span>{bill.totalAmount.toFixed(2)}</span>
                  </div>
              )}
              
              {bill.payments && bill.payments.length > 0 && (
                  <div className="flex justify-between font-bold border-t border-black mt-1 pt-1">
                      <span>Total Paid:</span>
                      <span>{bill.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                  </div>
              )}
          </div>

           <Divider />

           {/* Footer */}
           <div className="text-center mt-2">
             <p className="font-bold text-sm">Thank You! Visit Again</p>
             <p className="text-[10px] mt-1">Printed On: {printTime}</p>
           </div>
        </div>
      )}

      {/* ----------------- KOT FORMAT ----------------- */}
      {mode === 'KOT' && itemsToPrint && (
        <div className="flex flex-col text-sm font-bold">
           <div className="text-center border-b-2 border-black pb-2 mb-2">
             <h2 className="text-2xl font-extrabold">KOT</h2>
             <p className="text-xs uppercase">{kotOrderType || 'NEW ORDER'}</p>
           </div>

           <div className="flex justify-between text-xs mb-2">
             <span>Date: {now.toLocaleDateString()} {now.toLocaleTimeString()}</span>
             <span>Table: {tableNumber || 'N/A'}</span>
           </div>

           <Divider />

           <div className="flex flex-col gap-2">
             {itemsToPrint.map((item, idx) => (
               <div key={idx} className="flex flex-col border-b border-dashed border-gray-400 pb-1">
                 <div className="flex justify-between items-center text-lg">
                    <span className="flex-1">{item.shortCode || item.name}</span>
                    <span className="font-extrabold text-xl ml-2 border border-black px-2 rounded-md min-w-[40px] text-center">
                        {item.quantity}
                    </span>
                 </div>
                 {item.notes && (
                    <span className="text-xs font-normal italic">** {item.notes} **</span>
                 )}
               </div>
             ))}
           </div>
           
           <div className="border-t-2 border-black mt-4 pt-2 text-center text-xs">
             <p>Chef Copy</p>
           </div>
        </div>
      )}

      {/* ----------------- SETTLEMENT REPORT ----------------- */}
      {mode === 'SETTLEMENT' && settlementData && (
        <div className="flex flex-col text-[11px] border border-black p-2">
            <h2 className="text-center text-lg font-bold uppercase mb-1">Shift Settlement</h2>
            <p className="text-center text-[10px] uppercase mb-2">Annalakshmi POS</p>
            
            <div className="border border-black p-1 mb-2">
                <div className="flex justify-between"><span>Session:</span><span className="font-bold">{settlementData.session}</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{new Date(settlementData.startTime).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>Start:</span><span>{new Date(settlementData.startTime).toLocaleTimeString()}</span></div>
                <div className="flex justify-between"><span>End:</span><span>{new Date(settlementData.endTime).toLocaleTimeString()}</span></div>
            </div>

            <h3 className="font-bold border-b border-black mb-1">Sales Summary</h3>
            <div className="flex justify-between"><span>Total Bills:</span><span>{settlementData.totalBills}</span></div>
            <div className="flex justify-between"><span>Total Qty Sold:</span><span>{settlementData.totalQty}</span></div>
            <Divider />
            <div className="flex justify-between"><span>Sub Total:</span><span>{settlementData.subTotal.toFixed(2)}</span></div>
            {settlementData.totalDiscount > 0 && (
                <div className="flex justify-between"><span>Discount:</span><span>-{settlementData.totalDiscount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between"><span>CGST:</span><span>{settlementData.cgst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>SGST:</span><span>{settlementData.sgst.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-sm mt-1"><span>Grand Total Revenue:</span><span>{settlementData.grandTotal.toFixed(2)}</span></div>
            
            <h3 className="font-bold border-b border-black mb-1 mt-3">Payment Breakdown</h3>
            <div className="flex justify-between"><span>Cash Sales:</span><span>{settlementData.cashSales.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Credit Sales (Card/UPI):</span><span>{settlementData.creditSales.toFixed(2)}</span></div>

            {/* Detailed list if needed (hidden for brevity in receipt, good for audit) */}
            {settlementData.paymentBreakdown.some(p => p.mode !== 'Cash') && (
                <div className="mt-2 border-t border-dashed border-gray-400 pt-1">
                    <p className="font-bold">Refs:</p>
                    {settlementData.paymentBreakdown.map(p => (
                        p.mode !== 'Cash' && p.details.length > 0 && (
                             <div key={p.mode} className="text-[10px] text-gray-700">
                                {p.mode}: {p.details.join(', ')}
                             </div>
                        )
                    ))}
                </div>
            )}

            <h3 className="font-bold border-b border-black mb-1 mt-3">Cash Drawer</h3>
            <div className="border border-black p-1">
                <div className="flex justify-between"><span>Expected:</span><span>{settlementData.cashDrawer.expected.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Actual:</span><span>{settlementData.cashDrawer.actual.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold">
                    <span>Difference:</span>
                    <span className={settlementData.cashDrawer.difference < 0 ? 'text-red-600' : 'text-black'}>
                        {settlementData.cashDrawer.difference.toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="mt-8 flex justify-between px-4">
                <div className="border-t border-black w-20 text-center text-[10px] pt-1">Cashier</div>
                <div className="border-t border-black w-20 text-center text-[10px] pt-1">Manager</div>
            </div>
            
            <p className="text-center text-[10px] mt-4">Generated: {printTime}</p>
        </div>
      )}

      {/* Extra space for cut */}
      <div className="h-8"></div>
    </div>
  );
};

export default Receipt;