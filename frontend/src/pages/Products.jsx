import React, { useState, useEffect } from 'react';
import { db, queueForSync } from '../utils/db';
import { Package, Plus, Search, Filter, Edit3, Trash2, Tag, Scan, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', sku: '', barcode: '', category: '', 
    price: '', tax_percent: '18', min_stock_level: '5'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const allProducts = await db.products.toArray();
    setProducts(allProducts);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const newProduct = {
        ...formData,
        price: parseFloat(formData.price),
        tax_percent: parseFloat(formData.tax_percent),
        min_stock_level: parseInt(formData.min_stock_level)
      };

      // Check for duplicate SKU in IndexedDB
      const existing = await db.products.where('sku').equals(newProduct.sku).first();
      if (existing) {
        toast.error('A product with this SKU already exists');
        return;
      }

      // Add to IndexedDB first (Offline-first)
      const id = await db.products.add(newProduct);

      // Initialize inventory — check if it already exists first
      const existingInv = await db.inventory
        .where({ branch_id: 1, product_id: id }).first();
      if (!existingInv) {
        await db.inventory.add({
          branch_id: 1,
          product_id: id,
          quantity: 0,
          last_updated: new Date().toISOString()
        });
      }
      
      // Queue for background sync
      await queueForSync('PRODUCT_ADD', { ...newProduct, id });

      toast.success('Product added successfully!');
      setShowAddModal(false);
      setFormData({ name: '', sku: '', barcode: '', category: '', price: '', tax_percent: '18', min_stock_level: '5' });
      loadProducts();
    } catch (error) {
      console.error('Product add error:', error);
      toast.error(`Failed: ${error.message || 'Unknown error'}`);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  return (
    <>
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Product Master</h2>
          </div>
          <button className="btn btn-primary shadow-sm" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 flex items-center gap-3 bg-white border border-border px-4 py-2 rounded-xl shadow-sm">
            <Search size={18} className="text-muted" />
            <input 
              className="border-none outline-none text-sm w-full bg-transparent" 
              placeholder="Search by name, SKU, or barcode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost bg-white border border-border">
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-muted uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">SKU / Barcode</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price & Tax</th>
                <th className="px-6 py-4">Min. Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm">{p.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded w-fit">{p.sku}</span>
                      <span className="text-[10px] text-muted flex items-center gap-1"><Scan size={10}/> {p.barcode || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-muted">{p.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-sm">₹{p.price}</span>
                      <span className="text-[10px] text-success font-black">{p.tax_percent}% GST</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      <span className="bg-warning/10 text-warning px-2 py-0.5 rounded-full text-[10px] font-black">{p.min_stock_level} Units</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"><Edit3 size={16}/></button>
                      <button className="p-2 hover:bg-danger/10 text-danger rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-muted">
                  <Package size={32} />
              </div>
              <p className="text-muted font-bold">No products found. Start by adding one!</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} style={{ 
                  background: 'var(--primary-light)', color: 'var(--primary)', 
                  border: 'none', width: '40px', height: '40px', borderRadius: '12px',
                  cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold'
              }}>✕</button>
            </div>
            <form onSubmit={handleAddProduct} className="modal-body">
              <div style={{ margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted tracking-wider">Product Name</label>
                <input required className="input" placeholder="e.g. iPhone 15 Pro Max" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted tracking-wider block">SKU Code</label>
                  <input required className="input font-mono text-sm" placeholder="IPH15P-BLK" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted tracking-wider block">Barcode</label>
                    <input className="input font-mono text-sm" placeholder="123456789" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted tracking-wider block">Category</label>
                    <input required className="input" placeholder="Electronics" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted tracking-wider block">Price (₹)</label>
                    <input required type="number" step="0.01" className="input font-mono text-sm" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted tracking-wider block">GST %</label>
                    <select className="input cursor-pointer" value={formData.tax_percent} onChange={e => setFormData({...formData, tax_percent: e.target.value})}>
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted tracking-wider block">Min Stock Alert</label>
                    <input required type="number" className="input font-mono text-sm" value={formData.min_stock_level} onChange={e => setFormData({...formData, min_stock_level: e.target.value})} />
                </div>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary shadow-lg shadow-primary/30">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
