import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { Package, Search, Filter, ArrowUpRight, ArrowDownLeft, AlertTriangle, History, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = `http://${window.location.hostname}:5000`;

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedBranch]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load branches for filter
      const bResp = await fetch(`${API_URL}/api/branches`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (bResp.ok) setBranches(await bResp.ok ? await bResp.json() : []);

      // Load inventory
      const url = selectedBranch === 'all' 
        ? `${API_URL}/api/inventory` 
        : `${API_URL}/api/inventory?branch_id=${selectedBranch}`;
      
      const invResp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (invResp.ok) setInventory(await invResp.json());
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Inventory Stock</h2>
          <p className="text-muted text-sm font-medium">Monitor and manage stock levels across all locations</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-ghost bg-white border border-border shadow-sm">
            <History size={18} />
            <span>Audit Logs</span>
          </button>
          <button className="btn btn-primary shadow-lg shadow-primary/20">
            <Plus size={18} />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 flex items-center gap-3 bg-white border border-border px-4 py-3 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search size={20} className="text-muted" />
          <input 
            className="border-none outline-none text-sm w-full bg-transparent font-medium" 
            placeholder="Search by product name or SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 bg-white border border-border px-4 py-3 rounded-2xl shadow-sm">
          <MapPin size={18} className="text-muted" />
          <select 
            className="border-none outline-none text-sm w-full bg-transparent font-bold cursor-pointer"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-ghost bg-white border border-border rounded-2xl">
          <Filter size={18} />
          <span>More Filters</span>
        </button>
      </div>

      {/* Stock Cards (Summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/20 rounded-2xl text-primary">
              <Package size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-lg">Live Status</span>
          </div>
          <h3 className="text-2xl font-black">{inventory.reduce((acc, curr) => acc + Number(curr.quantity), 0)}</h3>
          <p className="text-sm font-bold text-muted">Total Items in Stock</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-danger/10 to-transparent border-danger/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-danger/20 rounded-2xl text-danger">
              <AlertTriangle size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-danger bg-danger/10 px-2 py-1 rounded-lg">Attention</span>
          </div>
          <h3 className="text-2xl font-black">
            {inventory.filter(item => Number(item.quantity) <= Number(item.min_stock_level)).length}
          </h3>
          <p className="text-sm font-bold text-muted">Low Stock Alerts</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-success/10 to-transparent border-success/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-success/20 rounded-2xl text-success">
              <ArrowUpRight size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-success bg-success/10 px-2 py-1 rounded-lg">Stability</span>
          </div>
          <h3 className="text-2xl font-black">{inventory.length}</h3>
          <p className="text-sm font-bold text-muted">Unique SKUs Tracked</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden border-none shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-muted uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-5">Product Details</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">On Hand Qty</th>
                <th className="px-6 py-5">Stock Status</th>
                <th className="px-6 py-5">Last Updated</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => {
                const isLow = Number(item.quantity) <= Number(item.min_stock_level);
                return (
                  <tr key={`${item.product_id}-${item.branch_id}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{item.product_name}</span>
                        <span className="text-[11px] font-mono text-muted uppercase mt-0.5">{item.sku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                        <span className="text-sm font-semibold text-slate-600">{item.branch_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-sm font-black ${isLow ? 'text-danger' : 'text-slate-900'}`}>
                        {item.quantity} Units
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 bg-danger/10 text-danger px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                          <AlertTriangle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-success/10 text-success px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs text-muted font-medium">
                        {new Date(item.last_updated).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-primary">
                        <History size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredInventory.length === 0 && !loading && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <Package size={40} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900">Inventory Empty</h4>
                <p className="text-muted text-sm font-medium">No stock records found for the selected criteria.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Plus = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
