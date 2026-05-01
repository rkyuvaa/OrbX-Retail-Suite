import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, User, Phone, CreditCard, ShoppingBag, 
  Trash2, Plus, Minus, CheckCircle, X, 
  Keyboard, Banknote, Wallet, Smartphone,
  Pause, Save, Eraser, UserPlus, Tag, Scan
} from 'lucide-react';
import { Badge } from '../components/Shared';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MOCK_ITEMS = [
  { id: 1, code: 'CTN-001', name: 'Cotton Fabric - White', category: 'Cotton', price: 120, unit: 'per meter' },
  { id: 2, code: 'CTN-002', name: 'Cotton Fabric - Blue', category: 'Cotton', price: 135, unit: 'per meter' },
  { id: 3, code: 'SLK-001', name: 'Silk Saree - Kanchipuram', category: 'Silk', price: 4500, unit: 'per piece' },
  { id: 4, code: 'LNN-001', name: 'Linen Fabric - Beige', category: 'Linen', price: 220, unit: 'per meter' },
];

const SALESMEN = ['Ramesh', 'Suresh', 'Deepak', 'Anil'];

export default function POS() {
  const [search, setSearch] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState({ phone: '', name: '', address: '' });
  const [paymentType, setPaymentType] = useState('cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);

  const searchRef = useRef(null);
  const phoneRef = useRef(null);

  const filtered = MOCK_ITEMS.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  );

  // ── Keyboard Logic ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); phoneRef.current?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); clearBill(); }
      if (e.key === 'F9') { e.preventDefault(); saveBill(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1, discount: 0, salesman: SALESMEN[0] }];
    });
    setSearch('');
    toast.success(`${item.name} added`);
  };

  const updateItem = (id, key, val) => {
    setCartItems(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c));
  };

  const clearBill = () => {
    setCartItems([]);
    setCustomer({ phone: '', name: '', address: '' });
    setDiscountPercent(0);
    toast('Bill Cleared', { icon: '🧹' });
  };

  const saveBill = () => {
    if (cartItems.length === 0) return toast.error('Empty bill');
    toast.success('Bill Saved Successfully!');
    clearBill();
  };

  // ── Totals Calculation ──────────────────────────────────────
  const totalQty = cartItems.reduce((s, c) => s + c.qty, 0);
  const totalValue = cartItems.reduce((s, c) => s + (c.price * c.qty), 0);
  const itemDiscounts = cartItems.reduce((s, c) => s + (parseFloat(c.discount) || 0), 0);
  const billDiscount = Math.round(totalValue * (discountPercent / 100));
  const totalDiscount = itemDiscounts + billDiscount;
  const grossValue = totalValue - totalDiscount;

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] gap-4 animate-fade-in p-2" style={{ marginTop: '-20px' }}>
      
      {/* ── TOP SECTION: Information Panels ───────────────────── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        
        {/* Customer Details Block */}
        <div style={{ flex: '1', minWidth: 280, backgroundColor: '#fff', border: '2px solid var(--border)', borderRadius: 16, padding: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Customer Details
          </p>
          <div className="space-y-3">
            <input ref={phoneRef} className="input py-2 text-sm w-full" placeholder="Phone Number (F2)" 
                value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
            <input className="input py-2 text-sm w-full" placeholder="Customer Name" 
                value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
            <input className="input py-2 text-sm w-full" placeholder="Address" 
                value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
          </div>
        </div>

        {/* Payment Options Block */}
        <div style={{ flex: '1', minWidth: 240, backgroundColor: '#fff', border: '2px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>
            Payment Options
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { id: 'cash', label: 'Cash', icon: Banknote, color: '#10b981' },
              { id: 'card', label: 'Card', icon: CreditCard, color: '#6366f1' },
              { id: 'upi', label: 'UPI', icon: Smartphone, color: '#f59e0b' },
              { id: 'credit', label: 'Credit', icon: Wallet, color: '#8b5cf6' }
            ].map(p => {
              const Icon = p.icon;
              const isActive = paymentType === p.id;
              return (
                <button key={p.id} onClick={() => setPaymentType(p.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 16, border: '2px solid',
                    borderColor: isActive ? p.color : 'var(--border)',
                    background: isActive ? `linear-gradient(135deg, ${p.color}, ${p.color}dd)` : '#fff',
                    color: isActive ? '#fff' : 'var(--text-main)',
                    boxShadow: isActive ? `0 8px 16px ${p.color}44` : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer'
                  }}
                  className={!isActive ? 'hover:border-primary/30 hover:bg-gray-50' : ''}>
                  <Icon size={18} />
                  <span style={{ fontSize: 11, fontWeight: 800 }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Bill Summary Block */}
        <div style={{ flex: '2', minWidth: 420, backgroundColor: '#fff', border: '2px solid var(--border)', borderRadius: 24, padding: 20, display: 'flex', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)' }}>ITEMS QTY</span>
              <span style={{ fontSize: 13, fontWeight: 900, backgroundColor: 'var(--bg-light)', padding: '2px 8px', borderRadius: 6 }}>{totalQty}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)' }}>SUB TOTAL</span>
              <span style={{ fontSize: 13, fontWeight: 900 }}>₹{totalValue.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)' }}>TOTAL DISCOUNT</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '2px 8px', borderRadius: 6 }}>-₹{totalDiscount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed var(--border)', paddingTop: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--primary)' }}>GROSS VALUE</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>₹{grossValue.toLocaleString()}</span>
            </div>
          </div>
          
          <div style={{ width: 2, backgroundColor: 'var(--border)', margin: '0 20px', borderRadius: 1 }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
            <button onClick={clearBill} className="btn-ghost" style={{ 
                fontSize: 11, fontWeight: 900, color: 'var(--danger)', border: '2px solid var(--danger-light)', 
                borderRadius: 12, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s', cursor: 'pointer'
            }}>
                <Eraser size={14}/> CLEAR
            </button>
            <button className="btn-ghost" style={{ 
                fontSize: 11, fontWeight: 900, color: '#f59e0b', border: '2px solid #fef3c7', 
                borderRadius: 12, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: 'pointer'
            }}>
                <Pause size={14}/> HOLD
            </button>
            <button onClick={saveBill} className="btn-primary" style={{ 
                fontSize: 11, fontWeight: 900, padding: '12px', borderRadius: 14,
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer'
            }}>
                <Save size={16}/> SAVE (F9)
            </button>
          </div>
      </div>

      {/* ── MAIN BODY: Billing Grid ───────────────────────────── */}
      <div className="flex-1 bg-white border-2 border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="border-b-2 border-border">
                <th className="p-3 text-[10px] font-black uppercase text-muted border-r border-border w-12">S.No</th>
                <th className="p-3 text-[10px] font-black uppercase text-muted border-r border-border w-40">Barcode</th>
                <th className="p-3 text-[10px] font-black uppercase text-muted border-r border-border">Product Name</th>
                <th className="p-3 text-[10px] font-black uppercase text-muted border-r border-border w-32">Category</th>
                <th className="p-3 text-[10px] font-black uppercase text-muted border-r border-border w-28 text-right">Rate</th>
                <th className="p-3 text-[10px] font-black uppercase text-muted border-r border-border w-24 text-center">Qty</th>
                <th className="p-3 text-[10px] font-black uppercase text-muted border-r border-border w-32 text-right">Amount</th>
                <th className="p-3 text-[10px] font-black uppercase text-muted border-r border-border w-28 text-right">Discount</th>
                <th className="p-3 text-[10px] font-black uppercase text-muted border-r border-border w-32 text-right">Gross Value</th>
                <th className="p-3 text-[10px] font-black uppercase text-muted w-32">Salesman</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cartItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-3 text-xs font-bold text-muted border-r border-border text-center">{idx + 1}</td>
                  <td className="p-3 text-xs font-mono font-bold border-r border-border">{item.code}</td>
                  <td className="p-3 text-xs font-black border-r border-border">{item.name}</td>
                  <td className="p-3 border-r border-border">
                    <Badge color="var(--primary-light)">{item.category}</Badge>
                  </td>
                  <td className="p-3 text-xs font-black border-r border-border text-right">₹{item.price.toLocaleString()}</td>
                  <td className="p-3 border-r border-border">
                    <div className="flex items-center justify-center gap-2">
                        <input type="number" className="w-12 text-center text-xs font-black border-b-2 border-transparent focus:border-primary bg-transparent outline-none" 
                            value={item.qty} onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)} />
                    </div>
                  </td>
                  <td className="p-3 text-xs font-black border-r border-border text-right">₹{(item.price * item.qty).toLocaleString()}</td>
                  <td className="p-3 border-r border-border">
                    <input type="number" className="w-full text-right text-xs font-bold text-danger bg-transparent outline-none" 
                        value={item.discount} onChange={e => updateItem(item.id, 'discount', parseInt(e.target.value) || 0)} placeholder="0" />
                  </td>
                  <td className="p-3 text-xs font-black border-r border-border text-right text-primary">₹{(item.price * item.qty - item.discount).toLocaleString()}</td>
                  <td className="p-3">
                    <select className="text-[10px] font-black bg-transparent outline-none w-full cursor-pointer" 
                        value={item.salesman} onChange={e => updateItem(item.id, 'salesman', e.target.value)}>
                        {SALESMEN.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <button onClick={() => setCartItems(prev => prev.filter(c => c.id !== item.id))} className="text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
