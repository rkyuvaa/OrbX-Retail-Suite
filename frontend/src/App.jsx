import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import POS from './pages/POS';
import { startSyncEngine, fetchUpdates } from './utils/db';

// Mock Branch ID for testing
const BRANCH_ID = 1;
const API_URL = 'http://localhost:5000';

function Dashboard() {
  return (
    <div className="p-2 lg:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {[
        { label: 'Today\'s Sales', value: '₹42,500', trend: '+12%', color: 'var(--primary)' },
        { label: 'Transactions', value: '156', trend: '+8%', color: 'var(--success)' },
        { label: 'Low Stock Items', value: '12', trend: '-2', color: 'var(--warning)' },
        { label: 'Active Transfers', value: '5', trend: 'In Transit', color: 'var(--primary)' },
      ].map((stat, i) => (
        <div key={i} className="card flex flex-col gap-2 hover:transform hover:-translate-y-1 transition-all duration-300">
          <span className="text-sm font-bold text-muted uppercase tracking-wider">{stat.label}</span>
          <span className="text-3xl font-black">{stat.value}</span>
          <span className="text-xs font-bold" style={{ color: stat.color }}>{stat.trend} from yesterday</span>
        </div>
      ))}
      <div className="col-span-full md:col-span-3 card">
        <h3 className="font-black text-lg mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-muted border-b">
                    <tr>
                        <th className="py-3">Invoice #</th>
                        <th className="py-3">Customer</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {[1,2,3,4,5].map(i => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <td className="py-3 font-mono">INV-102{i}</td>
                            <td className="py-3 font-bold">Ramesh Kumar</td>
                            <td className="py-3 font-black">₹{1200 + i*150}</td>
                            <td className="py-3">
                                <span className="bg-success/10 text-success px-2 py-1 rounded-lg text-[10px] font-black uppercase">Synced</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      <div className="card">
        <h3 className="font-black text-lg mb-4">Inventory Summary</h3>
        <div className="space-y-4">
            {[
                { name: 'Redmi Note 13', stock: 15, color: 'var(--success)' },
                { name: 'Samsung S24', stock: 3, color: 'var(--danger)' },
                { name: 'Apple iPhone 15', stock: 8, color: 'var(--warning)' }
            ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold">
                        <span>{item.name}</span>
                        <span>{item.stock} Units</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(item.stock/20)*100}%`, background: item.color }} />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Start the offline sync engine
    startSyncEngine(BRANCH_ID, API_URL);
    
    // Initial fetch of updates
    fetchUpdates(BRANCH_ID, API_URL);
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={<div className="card p-12 text-center text-muted">Products Module - Coming Soon</div>} />
          <Route path="/inventory" element={<div className="card p-12 text-center text-muted">Inventory Module - Coming Soon</div>} />
          <Route path="/transfers" element={<div className="card p-12 text-center text-muted">Transfers Module - Coming Soon</div>} />
          <Route path="/customers" element={<div className="card p-12 text-center text-muted">Customers Module - Coming Soon</div>} />
          <Route path="/reports" element={<div className="card p-12 text-center text-muted">Reports Module - Coming Soon</div>} />
          <Route path="/settings" element={<div className="card p-12 text-center text-muted">Settings Module - Coming Soon</div>} />
        </Routes>
      </Layout>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          fontWeight: 'bold'
        }
      }} />
    </BrowserRouter>
  );
}
