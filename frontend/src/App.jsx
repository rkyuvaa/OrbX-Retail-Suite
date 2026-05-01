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
import { startSyncEngine, fetchUpdates } from './utils/db';

import BranchSelect from './pages/BranchSelect';

// Mock Branch ID for testing
const BRANCH_ID = 1;
// Dynamically set API URL based on current host
const API_URL = `http://${window.location.hostname}:5000`;

function PrivateRoute({ children, module }) {
  const isAuthenticated = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const activeBranch = localStorage.getItem('activeBranch');
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // If no branch selected and not already on branch-select, redirect to it
  if (!activeBranch && location.pathname !== '/branch-select') {
    return <Navigate to="/branch-select" />;
  }

  // Superadmin has access to everything
  if (user.is_superadmin) return <Layout>{children}</Layout>;

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
            <button className="btn btn-primary" onClick={() => window.location.href = '/'}>Return to Home</button>
          </div>
        </Layout>
      );
    }
  }

  return <Layout>{children}</Layout>;
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
        <Route path="/branch-select" element={<BranchSelect />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route path="/pos" element={<PrivateRoute module="pos"><POS /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute module="inventory"><Products /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute module="inventory"><Inventory /></PrivateRoute>} />
        <Route path="/transfers" element={<PrivateRoute module="transfers"><div className="card p-12 text-center text-muted">Transfers Module - Coming Soon</div></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute module="crm"><div className="card p-12 text-center text-muted">Customers Module - Coming Soon</div></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute module="reports"><div className="card p-12 text-center text-muted">Reports Module - Coming Soon</div></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute module="settings"><Settings /></PrivateRoute>} />
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
