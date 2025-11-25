import React, { useMemo, useState } from 'react';
import { Bill } from '../types';
import * as db from '../services/storage';
import { Printer, Search, RefreshCw } from 'lucide-react';

interface TransactionsProps {
    onReprint: (bill: Bill) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ onReprint }) => {
    // We reload bills every time this component mounts to get fresh data
    const [bills, setBills] = useState<Bill[]>(db.getBills());
    const [search, setSearch] = useState('');

    const filteredBills = useMemo(() => {
        if (!search) return bills;
        const lowerSearch = search.toLowerCase();
        return bills.filter(b => 
            b.billNumber.toLowerCase().includes(lowerSearch) ||
            b.paymentMode.toLowerCase().includes(lowerSearch) ||
            (b.tableNumber && b.tableNumber.toLowerCase().includes(lowerSearch))
        );
    }, [bills, search]);

    const handleRefresh = () => {
        setBills(db.getBills());
    };

    return (
        <div className="p-6 bg-gray-50 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
                <button onClick={handleRefresh} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="mb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search Bill #, Table or Mode" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm">Bill No</th>
                                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm">Date/Time</th>
                                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm">Table</th>
                                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm">Mode</th>
                                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm text-right">Amount</th>
                                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600 text-sm text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">No transactions found</td>
                                </tr>
                            ) : (
                                filteredBills.map(bill => (
                                    <tr key={bill.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                        <td className="p-3 text-sm font-mono font-medium text-gray-800">{bill.billNumber}</td>
                                        <td className="p-3 text-sm text-gray-600">
                                            {new Date(bill.timestamp).toLocaleDateString()} <span className="text-gray-400 text-xs">{new Date(bill.timestamp).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">{bill.tableNumber || '-'}</td>
                                        <td className="p-3 text-sm text-gray-600">
                                            <span className={`px-2 py-0.5 rounded text-xs border ${
                                                bill.paymentMode === 'Cash' ? 'bg-green-50 border-green-200 text-green-700' :
                                                bill.paymentMode === 'UPI' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                'bg-purple-50 border-purple-200 text-purple-700'
                                            }`}>
                                                {bill.paymentMode}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm font-bold text-gray-800 text-right">₹{bill.totalAmount.toFixed(2)}</td>
                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => onReprint(bill)}
                                                className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                title="Reprint Bill"
                                            >
                                                <Printer size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transactions;