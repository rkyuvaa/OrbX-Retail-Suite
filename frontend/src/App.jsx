import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import POS from './pages/POS';
import Products from './pages/Products';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import { startSyncEngine, fetchUpdates } from './utils/db';

// Mock Branch ID for testing
const BRANCH_ID = 1;
// Dynamically set API URL based on current host
const API_URL = `http://${window.location.hostname}:5000`;

function PrivateRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function Dashboard() {
  return (
    <div className="p-2 lg:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {[
        { label: 'Today\'s Sales', value: '₹42,500', trend: '+12%', color: 'var(--primary)' },
        { label: 'Transactions', value: '156', trend: '+8%', color: 'var(--success)' },
        { label: 'Low Stock Items', value: '12', trend: '-2', color: 'var(--warning)' },
        { label: 'Active Transfers', value: '5', trend: 'In Transit', color: 'var(--primary)' },
      ].map((stat, i) => (
        <div key={i} className="card flex flex-col gap-1 py-4 px-5">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest">{stat.label}</span>
          <span className="text-2xl font-black">{stat.value}</span>
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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
        <Route path="/transfers" element={<PrivateRoute><div className="card p-12 text-center text-muted">Transfers Module - Coming Soon</div></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute><div className="card p-12 text-center text-muted">Customers Module - Coming Soon</div></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><div className="card p-12 text-center text-muted">Reports Module - Coming Soon</div></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>

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
