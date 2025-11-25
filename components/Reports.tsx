import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getBills } from '../services/storage';
import { Bill } from '../types';

const Reports: React.FC = () => {
  const bills = useMemo(() => getBills(), []);

  // Aggregate Top Selling Items
  const itemSales = useMemo(() => {
    const counts: Record<string, number> = {};
    bills.forEach(bill => {
      bill.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [bills]);

  // Aggregate Daily Revenue (Last 7 days)
  const revenueData = useMemo(() => {
    const grouped: Record<string, number> = {};
    bills.forEach(bill => {
        const date = new Date(bill.timestamp).toLocaleDateString(undefined, {weekday: 'short'});
        grouped[date] = (grouped[date] || 0) + bill.totalAmount;
    });
    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
  }, [bills]);

  const totalRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const avgBill = bills.length > 0 ? totalRevenue / bills.length : 0;

  return (
    <div className="p-6 bg-gray-50 h-full overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Business Reports</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 font-medium uppercase">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 font-medium uppercase">Total Bills</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{bills.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 font-medium uppercase">Avg Ticket Size</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">₹{avgBill.toFixed(0)}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[350px]">
                <h3 className="font-bold text-gray-700 mb-4">Top Selling Items</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={itemSales} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]}>
                            {itemSales.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10B981' : '#34D399'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[350px]">
                <h3 className="font-bold text-gray-700 mb-4">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']}/>
                        <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};

export default Reports;