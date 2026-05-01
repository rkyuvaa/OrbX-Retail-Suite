import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { 
  Search, User, Phone, CreditCard, ShoppingBag, 
  Trash2, Plus, Minus, CheckCircle, X, 
  Keyboard, Banknote, Wallet, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Mock Data ─────────────────────────────────────────────────
const MOCK_ITEMS = [
  { id: 1, code: 'CTN-001', name: 'Cotton Fabric - White', category: 'Cotton', price: 120, unit: 'per meter', stock: 450 },
  { id: 2, code: 'CTN-002', name: 'Cotton Fabric - Blue', category: 'Cotton', price: 135, unit: 'per meter', stock: 320 },
  { id: 3, code: 'SLK-001', name: 'Silk Saree - Kanchipuram', category: 'Silk', price: 4500, unit: 'per piece', stock: 28 },
  { id: 4, code: 'SLK-002', name: 'Silk Dupatta - Red', category: 'Silk', price: 850, unit: 'per piece', stock: 64 },
  { id: 5, code: 'LNN-001', name: 'Linen Fabric - Beige', category: 'Linen', price: 220, unit: 'per meter', stock: 180 },
  { id: 6, code: 'LNN-002', name: 'Linen Shirt Piece', category: 'Linen', price: 660, unit: 'per piece', stock: 95 },
  { id: 7, code: 'WOL-001', name: 'Woolen Shawl - Kashmiri', category: 'Wool', price: 1800, unit: 'per piece', stock: 42 },
  { id: 8, code: 'PLY-001', name: 'Polyester Fabric - Plain', category: 'Polyester', price: 80, unit: 'per meter', stock: 600 },
  { id: 9, code: 'JNS-001', name: 'Denim Fabric - Dark', category: 'Denim', price: 195, unit: 'per meter', stock: 240 },
  { id: 10, code: 'EMB-001', name: 'Embroidered Kurta Piece', category: 'Embroidered', price: 1200, unit: 'per piece', stock: 35 },
  { id: 11, code: 'EMB-002', name: 'Embroidered Saree', category: 'Embroidered', price: 3200, unit: 'per piece', stock: 18 },
  { id: 12, code: 'CTN-003', name: 'Khadi Cotton - Natural', category: 'Cotton', price: 280, unit: 'per meter', stock: 120 },
];

const PAYMENT_TYPES = [
  { key: 'cash',   label: 'Cash',    icon: Banknote,    shortcut: 'F5' },
  { key: 'card',   label: 'Card',    icon: CreditCard,  shortcut: 'F6' },
  { key: 'upi',    label: 'UPI',     icon: Smartphone,  shortcut: 'F7' },
  { key: 'wallet', label: 'Wallet',  icon: Wallet,      shortcut: 'F8' },
];

const SHORTCUTS = [
  { key: 'F1', action: 'Search Items' },
  { key: 'F2', action: 'Customer Phone' },
  { key: 'F3', action: 'Customer Name' },
  { key: 'F4', action: 'Clear Bill' },
  { key: 'F5', action: 'Pay - Cash' },
  { key: 'F6', action: 'Pay - Card' },
  { key: 'F7', action: 'Pay - UPI' },
  { key: 'F9', action: 'Complete Sale' },
];

export default function POS() {
  const [search, setSearch]         = useState('');
  const [cartItems, setCartItems]   = useState([]);
  const [customer, setCustomer]     = useState({ phone: '', name: '' });
  const [paymentType, setPaymentType] = useState('cash');
  const [discount, setDiscount]     = useState(0);
  const [amountPaid, setAmountPaid] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);

  const searchRef  = useRef(null);
  const phoneRef   = useRef(null);
  const nameRef    = useRef(null);
  const amountRef  = useRef(null);

  const filtered = MOCK_ITEMS.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  // ── Keyboard Shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      switch(e.key) {
        case 'F1': e.preventDefault(); searchRef.current?.focus(); break;
        case 'F2': e.preventDefault(); phoneRef.current?.focus(); break;
        case 'F3': e.preventDefault(); nameRef.current?.focus(); break;
        case 'F4': e.preventDefault(); clearBill(); break;
        case 'F5': e.preventDefault(); setPaymentType('cash'); break;
        case 'F6': e.preventDefault(); setPaymentType('card'); break;
        case 'F7': e.preventDefault(); setPaymentType('upi'); break;
        case 'F8': e.preventDefault(); setPaymentType('wallet'); break;
        case 'F9': e.preventDefault(); completeSale(); break;
        case 'ArrowDown':
          if (document.activeElement === searchRef.current) {
            e.preventDefault();
            setSelectedItemIdx(i => Math.min(i + 1, filtered.length - 1));
          }
          break;
        case 'ArrowUp':
          if (document.activeElement === searchRef.current) {
            e.preventDefault();
            setSelectedItemIdx(i => Math.max(i - 1, 0));
          }
          break;
        case 'Enter':
          if (document.activeElement === searchRef.current && filtered.length > 0) {
            e.preventDefault();
            addToCart(filtered[selectedItemIdx]);
          }
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selectedItemIdx]);

  useEffect(() => { setSelectedItemIdx(0); }, [search]);

  const addToCart = useCallback((item) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(`${item.name} added`, { duration: 1000 });
  }, []);

  const updateQty = (id, delta) => {
    setCartItems(prev => prev
      .map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
      .filter(c => c.qty > 0)
    );
  };

  const removeItem = (id) => setCartItems(prev => prev.filter(c => c.id !== id));

  const clearBill = () => {
    setCartItems([]);
    setCustomer({ phone: '', name: '' });
    setDiscount(0);
    setAmountPaid('');
    setPaymentType('cash');
    setSearch('');
    toast('Bill cleared', { icon: '🗑️' });
  };

  const subtotal   = cartItems.reduce((s, c) => s + c.price * c.qty, 0);
  const discAmt    = Math.round(subtotal * discount / 100);
  const total      = subtotal - discAmt;
  const tax        = Math.round(total * 0.05);
  const grandTotal = total + tax;
  const change     = (parseFloat(amountPaid) || 0) - grandTotal;

  const completeSale = () => {
    if (cartItems.length === 0) return toast.error('Add items to cart first');
    if (!customer.phone) return toast.error('Phone number required (F2)');
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); clearBill(); }, 3000);
  };

  return (
    <Layout title="POS — Textile Billing">
      {/* Keyboard shortcut legend */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {SHORTCUTS.map(s => (
          <span key={s.key} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-black">
            <kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[9px] font-mono shadow-sm">{s.key}</kbd>
            <span className="text-muted">{s.action}</span>
          </span>
        ))}
        <button onClick={() => setShowShortcuts(v => !v)} className="ml-auto btn btn-ghost btn-sm flex items-center gap-1">
          <Keyboard size={13} /> Shortcuts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 h-[calc(100vh-200px)]">

        {/* ── LEFT: Item Selection ───────────────────────── */}
        <div className="flex flex-col gap-4 overflow-hidden">

          {/* Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={searchRef}
              className="input pl-10 pr-24 py-3.5 text-sm font-bold w-full"
              placeholder="Search by name, code, or category... (F1)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted bg-gray-100 px-2 py-1 rounded-lg">
              {filtered.length} items
            </span>
          </div>

          {/* Items Grid */}
          <div className="overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: 'thin' }}>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 group ${
                    selectedItemIdx === idx 
                      ? 'border-primary bg-primary/[0.04] shadow-lg shadow-primary/10' 
                      : 'border-border bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span>
                    <span className={`text-[9px] font-black ${item.stock < 50 ? 'text-danger' : 'text-success'}`}>{item.stock} left</span>
                  </div>
                  <p className="text-sm font-black leading-tight mb-1 line-clamp-2">{item.name}</p>
                  <p className="text-[10px] text-muted font-bold font-mono mb-3">{item.code}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-black text-primary">₹{item.price.toLocaleString()}</p>
                      <p className="text-[9px] text-muted font-bold">{item.unit}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <Plus size={16} />
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted">
                  <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-black text-sm">No items found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Bill Panel ──────────────────────────── */}
        <div className="flex flex-col gap-4 overflow-hidden">

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Customer Details</p>
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={phoneRef}
                className="input pl-9 py-2.5 text-sm w-full"
                placeholder="Phone Number (F2)"
                value={customer.phone}
                maxLength={10}
                onChange={e => setCustomer(c => ({ ...c, phone: e.target.value.replace(/\D/,'') }))}
              />
            </div>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={nameRef}
                className="input pl-9 py-2.5 text-sm w-full"
                placeholder="Customer Name (F3)"
                value={customer.name}
                onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 bg-white rounded-2xl border border-border overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest">Bill Items</span>
              {cartItems.length > 0 && (
                <button onClick={clearBill} className="text-[10px] font-black text-danger hover:bg-danger/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                  <X size={10}/> Clear (F4)
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'thin' }}>
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <ShoppingBag size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-black">Cart is empty</p>
                  <p className="text-[10px]">Select items or press Enter to add</p>
                </div>
              ) : cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 py-2.5 border-b border-border/40 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate">{item.name}</p>
                    <p className="text-[10px] text-muted font-bold">₹{item.price.toLocaleString()} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <Minus size={10} />
                    </button>
                    <span className="w-7 text-center text-xs font-black">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <Plus size={10} />
                    </button>
                  </div>
                  <span className="text-xs font-black text-primary w-16 text-right">₹{(item.price * item.qty).toLocaleString()}</span>
                  <button onClick={() => removeItem(item.id)} className="text-danger/40 hover:text-danger transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-4">
            {/* Payment Type */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Payment Method</p>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_TYPES.map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.key} onClick={() => setPaymentType(p.key)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-[10px] font-black ${
                        paymentType === p.key 
                          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}>
                      <Icon size={16} />
                      <span>{p.label}</span>
                      <kbd className={`text-[8px] px-1 rounded font-mono ${paymentType === p.key ? 'bg-white/20' : 'bg-gray-100'}`}>{p.shortcut}</kbd>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase text-muted whitespace-nowrap">Discount %</label>
              <input
                type="number" min="0" max="100"
                className="input py-2 text-sm text-center w-20"
                value={discount}
                onChange={e => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              />
              {discount > 0 && <span className="text-xs font-black text-danger">-₹{discAmt.toLocaleString()}</span>}
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between font-bold text-muted"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              {discount > 0 && <div className="flex justify-between font-bold text-danger"><span>Discount ({discount}%)</span><span>-₹{discAmt.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-muted"><span>GST (5%)</span><span>₹{tax.toLocaleString()}</span></div>
              <div className="flex justify-between font-black text-base pt-1.5 border-t border-border mt-1">
                <span>Total</span><span className="text-primary">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Amount Paid + Change */}
            {paymentType === 'cash' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-muted">Amount Received</label>
                  <input ref={amountRef} type="number" className="input py-2.5 text-sm mt-1 w-full"
                    placeholder={`₹${grandTotal}`} value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)} />
                </div>
                {change >= 0 && amountPaid && (
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-success">Change</label>
                    <div className="input py-2.5 text-sm mt-1 bg-success/10 text-success font-black">₹{change.toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Button */}
            <button onClick={completeSale}
              className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0">
              <CheckCircle size={18} />
              Complete Sale
              <kbd className="text-[10px] bg-white/20 px-2 py-0.5 rounded-lg font-mono ml-2">F9</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* ── Success Overlay ─────────────────────────────── */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-12 text-center shadow-2xl animate-fade-in max-w-sm mx-4">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-success" />
            </div>
            <h2 className="text-2xl font-black mb-2">Sale Complete!</h2>
            <p className="text-muted font-bold mb-2">{customer.name || 'Customer'} • {customer.phone}</p>
            <p className="text-3xl font-black text-primary mb-6">₹{grandTotal.toLocaleString()}</p>
            {paymentType === 'cash' && change > 0 && (
              <div className="bg-success/10 text-success rounded-2xl p-4 mb-6">
                <p className="text-xs font-black uppercase">Change to Return</p>
                <p className="text-2xl font-black">₹{change.toLocaleString()}</p>
              </div>
            )}
            <p className="text-xs text-muted font-bold">Resetting in 3 seconds...</p>
          </div>
        </div>
      )}
    </Layout>
  );
}
