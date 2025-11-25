import React from 'react';
import { Bill, SettlementData, PaymentMode } from '../types';
import { RESTAURANT_NAME, RESTAURANT_ADDRESS, RESTAURANT_PHONE, RESTAURANT_GSTIN } from '../constants';

interface ReceiptProps {
  bill: Bill | null;
  settlementData?: SettlementData | null;
  mode: 'BILL' | 'KOT' | 'SETTLEMENT';
  renderMode?: 'PRINT' | 'CANVAS';
}

const Receipt: React.FC<ReceiptProps> = ({ bill, settlementData, mode, renderMode = 'PRINT' }) => {
  if (mode !== 'SETTLEMENT' && !bill) return null;
  if (mode === 'SETTLEMENT' && !settlementData) return null;

  const now = new Date();
  const printTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const billDate = bill ? new Date(bill.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const billTime = bill ? new Date(bill.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

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
                <span>Total:</span>
                <span>{bill.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <Divider />

          {/* Payment Details */}
          <div className="mt-2 text-[11px]">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase">{bill.paymentMode}</span>
              </div>
              
              {bill.paymentMode === PaymentMode.UPI && bill.paymentDetails?.upiRef && (
                  <div className="flex justify-between text-xs">
                    <span>Reference ID:</span>
                    <span>{bill.paymentDetails.upiRef}</span>
                  </div>
              )}
              {bill.paymentMode === PaymentMode.CARD && bill.paymentDetails?.cardDigits && (
                  <div className="flex justify-between text-xs">
                    <span>Card:</span>
                    <span>xxxx-{bill.paymentDetails.cardDigits}</span>
                  </div>
              )}
               {bill.paymentMode === PaymentMode.CASH && bill.paymentDetails?.cashTendered && (
                  <>
                    <div className="flex justify-between text-xs">
                        <span>Cash Given:</span>
                        <span>{bill.paymentDetails.cashTendered.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Balance Returned:</span>
                        <span>{(bill.paymentDetails.cashBalance || 0).toFixed(2)}</span>
                    </div>
                  </>
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
      {mode === 'KOT' && bill && (
        <div className="flex flex-col text-sm font-bold">
           <div className="text-center border-b-2 border-black pb-2 mb-2">
             <h2 className="text-2xl font-extrabold">KOT</h2>
             <p className="text-xs uppercase">{bill.orderType}</p>
           </div>

           <div className="flex justify-between text-xs mb-2">
             <span>Date: {billDate} {billTime}</span>
             <span>Table: {bill.tableNumber || 'N/A'}</span>
           </div>
           <p className="text-xs mb-2">Bill #: {bill.billNumber}</p>

           <Divider />

           <div className="flex flex-col gap-2">
             {bill.items.map((item, idx) => (
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
            <div className="flex justify-between"><span>CGST:</span><span>{settlementData.cgst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>SGST:</span><span>{settlementData.sgst.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-sm mt-1"><span>Grand Total:</span><span>{settlementData.grandTotal.toFixed(2)}</span></div>
            
            <h3 className="font-bold border-b border-black mb-1 mt-3">Payment Breakdown</h3>
            <div className="flex justify-between"><span>Cash Sales:</span><span>{settlementData.cashSales.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>UPI Sales:</span><span>{settlementData.upiSales.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Card Sales:</span><span>{settlementData.cardSales.toFixed(2)}</span></div>

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