import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Package } from 'lucide-react';
import Layout from './components/Layout';
import POS from './pages/POS';
import Products from './pages/Products';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Studio from './pages/Studio';
import { startSyncEngine, fetchUpdates } from './utils/db';

// Mock Branch ID for testing
const BRANCH_ID = 1;
// Dynamically set API URL based on current host
const API_URL = `http://${window.location.hostname}:5000`;

function PrivateRoute({ children, module, title }) {
  const isAuthenticated = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" />;

  // Superadmin has access to everything
  if (user.is_superadmin) return <Layout title={title}>{children}</Layout>;

  // Check module permission if specified
  if (module) {
    const allowedModules = user.allowed_modules || {};
    if (!allowedModules[module]) {
      return (
        <Layout>
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} />
            </div>
            <h2 className="text-xl font-black mb-2">Access Denied</h2>
            <p className="text-muted font-medium mb-6">You don't have permission to access the {module.toUpperCase()} module.</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/'}>Return to Dashboard</button>
          </div>
        </Layout>
      );
    }
  }

  return <Layout title={title}>{children}</Layout>;
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/reports/dashboard`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.json())
    .then(d => { setData(d); setLoading(false); })
    .catch(e => { console.error(e); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-muted font-bold text-xs uppercase tracking-widest">Loading Analytics...</p>
    </div>
  );

  const stats = [
    { label: 'Today\'s Sales', value: `₹${data?.stats?.todaySales?.toLocaleString() || 0}`, color: 'var(--primary)' },
    { label: 'Transactions', value: data?.stats?.transactions || 0, color: 'var(--success)' },
    { label: 'Low Stock Items', value: data?.stats?.lowStock || 0, color: 'var(--danger)' },
    { label: 'Active Transfers', value: data?.stats?.activeTransfers || 0, color: 'var(--primary)' },
  ];

  return (
    <div className="p-2 lg:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {stats.map((stat, i) => (
        <div key={i} className="card flex flex-col gap-1 py-4 px-5 relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <LayoutDashboard size={80} />
          </div>
          <span className="text-[10px] font-black text-muted uppercase tracking-widest">{stat.label}</span>
          <span className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</span>
        </div>
      ))}

      <div className="col-span-full lg:col-span-3 card">
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg">Recent Transactions</h3>
            <button className="btn btn-ghost text-[11px] font-black uppercase">View All</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-muted border-b border-border/50">
                    <tr>
                        <th className="py-3 px-2 text-[10px] font-black uppercase">Ref #</th>
                        <th className="py-3 px-2 text-[10px] font-black uppercase">Customer</th>
                        <th className="py-3 px-2 text-[10px] font-black uppercase">Amount</th>
                        <th className="py-3 px-2 text-[10px] font-black uppercase">Billed By</th>
                        <th className="py-3 px-2 text-[10px] font-black uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {(data?.recentSales || []).length === 0 ? (
                        <tr><td colSpan="5" className="py-12 text-center text-muted font-bold">No transactions found today</td></tr>
                    ) : data.recentSales.map((sale, i) => (
                        <tr key={i} className="hover:bg-primary/[0.02] transition-colors">
                            <td className="py-4 px-2 font-mono text-xs">#{sale.id}</td>
                            <td className="py-4 px-2 font-bold">{sale.customer_name || 'Guest Customer'}</td>
                            <td className="py-4 px-2 font-black">₹{parseFloat(sale.total_amount).toLocaleString()}</td>
                            <td className="py-4 px-2 text-xs font-bold text-muted">{sale.user_name || 'System'}</td>
                            <td className="py-4 px-2">
                                <span className="bg-success/10 text-success px-2 py-1 rounded-lg text-[10px] font-black uppercase">Success</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <div className="card">
        <h3 className="font-black text-lg mb-6">Stock Alerts</h3>
        <div className="space-y-6">
            {(data?.inventoryHighlights || []).length === 0 ? (
                <div className="py-8 text-center text-muted text-xs font-bold uppercase">All stock stable</div>
            ) : data.inventoryHighlights.map((item, i) => {
                const stockLevel = (item.quantity / 20) * 100;
                const color = item.quantity < 5 ? 'var(--danger)' : (item.quantity < 10 ? 'var(--warning)' : 'var(--success)');
                return (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="truncate pr-2">{item.name}</span>
                            <span style={{ color }}>{item.quantity} Units</span>
                        </div>
                        <div className="w-full h-2 bg-border/20 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(stockLevel, 100)}%`, background: color }} />
                        </div>
                    </div>
                );
            })}
        </div>
        <button className="btn btn-primary w-full mt-8 text-[11px] font-black uppercase" onClick={() => window.location.href = '/inventory'}>
            Restock Inventory
        </button>
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
        <Route path="/" element={<PrivateRoute title="Dashboard"><Dashboard /></PrivateRoute>} />
        <Route path="/pos" element={<PrivateRoute module="pos" title="POS / Billing"><POS /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute module="inventory" title="Products"><Products /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute module="inventory" title="Inventory"><Inventory /></PrivateRoute>} />
        <Route path="/transfers" element={<PrivateRoute module="transfers" title="Stock Transfers"><div className="card p-12 text-center text-muted">Transfers Module - Coming Soon</div></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute module="crm" title="Customers"><div className="card p-12 text-center text-muted">Customers Module - Coming Soon</div></PrivateRoute>} />
        <Route path="/studio" element={<PrivateRoute module="studio" title="Studio — Layout & Workflow"><Studio /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute module="reports" title="Reports & Analytics"><div className="card p-12 text-center text-muted">Reports Module - Coming Soon</div></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute module="settings" title="Settings"><Settings /></PrivateRoute>} />
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
