import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, User, Phone, CreditCard, ShoppingBag, 
  Trash2, Plus, Minus, CheckCircle, X, 
  Keyboard, Banknote, Wallet, Smartphone,
  Pause, Save, Eraser, UserPlus, Tag, Barcode
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
  const [customer, setCustomer] = useState({ phone: '', name: '' });
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
    setCustomer({ phone: '', name: '' });
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
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4 animate-fade-in p-2">
      
      {/* ── TOP SECTION: Information Panels ───────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Customer Details Block */}
        <div className="col-span-3 bg-white border-2 border-border rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <User size={12}/> Customer Details
          </p>
          <div className="space-y-3">
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input ref={phoneRef} className="input pl-9 py-2 text-sm w-full" placeholder="Phone Number (F2)" 
                value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
            </div>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input pl-9 py-2 text-sm w-full" placeholder="Customer Name" 
                value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Payment Options Block */}
        <div className="col-span-3 bg-white border-2 border-border rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <CreditCard size={12}/> Payment Options
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['Cash', 'Card', 'UPI', 'Credit'].map(p => (
              <button key={p} onClick={() => setPaymentType(p.toLowerCase())}
                className={`py-2 px-3 rounded-xl border-2 text-[11px] font-black transition-all ${
                  paymentType === p.toLowerCase() ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-border hover:border-primary/50'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Current Bill Summary Block */}
        <div className="col-span-4 bg-white border-2 border-primary/20 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-muted uppercase w-24">Items Qty:</span>
              <span className="text-sm font-black">{totalQty}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-muted uppercase w-24">Sub Total:</span>
              <span className="text-sm font-black">₹{totalValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-muted uppercase w-24">Total Disc:</span>
              <span className="text-sm font-black text-danger">-₹{totalDiscount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <span className="text-[10px] font-black text-primary uppercase w-24">Gross Value:</span>
              <span className="text-lg font-black text-primary">₹{grossValue.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="h-full w-[1px] bg-border mx-4"></div>

          {/* Action Buttons Stack */}
          <div className="flex flex-col gap-2">
            <button onClick={clearBill} className="btn btn-ghost btn-sm text-danger hover:bg-danger/10 border border-danger/20 w-24 h-9 font-black text-[10px]">
              <Eraser size={14} className="mr-1"/> CLEAR
            </button>
            <button className="btn btn-ghost btn-sm text-amber-600 hover:bg-amber-50 border border-amber-200 w-24 h-9 font-black text-[10px]">
              <Pause size={14} className="mr-1"/> HOLD
            </button>
            <button onClick={saveBill} className="btn btn-primary btn-sm w-24 h-9 font-black text-[10px] shadow-lg shadow-primary/30">
              <Save size={14} className="mr-1"/> SAVE (F9)
            </button>
          </div>
        </div>

        {/* Search / Scan Panel */}
        <div className="col-span-2 relative flex flex-col justify-center">
            <div className="relative">
              <Barcode size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              <input ref={searchRef} className="input pl-11 py-4 text-sm font-black w-full border-primary/40 focus:border-primary shadow-xl shadow-primary/5" 
                placeholder="F1 - Scan Barcode" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {search && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-primary/20 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                {filtered.map(item => (
                  <div key={item.id} className="p-3 hover:bg-primary/5 cursor-pointer border-b border-border last:border-0" onClick={() => addToCart(item)}>
                    <p className="text-xs font-black">{item.name}</p>
                    <p className="text-[10px] text-primary font-bold">₹{item.price} • {item.code}</p>
                  </div>
                ))}
              </div>
            )}
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
              {cartItems.length === 0 && (
                <tr>
                    <td colSpan="11" className="p-20 text-center">
                        <div className="flex flex-col items-center opacity-20">
                            <ShoppingBag size={60} />
                            <p className="mt-4 font-black text-lg">No items added to bill</p>
                            <p className="text-xs font-bold">Start scanning barcodes (F1) to begin</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Shortcut Bar */}
        <div className="bg-gray-50 px-4 py-2 border-t-2 border-border flex gap-4 overflow-x-auto no-scrollbar">
            {['F1 Scan', 'F2 Phone', 'F4 Clear', 'F9 Save'].map(s => (
                <span key={s} className="text-[9px] font-black text-muted whitespace-nowrap bg-white px-2 py-1 rounded border border-border">
                    <span className="text-primary mr-1">{s.split(' ')[0]}</span> {s.split(' ')[1]}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
}
