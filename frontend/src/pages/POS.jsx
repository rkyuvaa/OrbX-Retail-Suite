import React, { useState, useEffect, useRef } from 'react';
import { db, queueForSync } from '../utils/db';
import { ShoppingCart, Search, Trash2, CreditCard, User, Tag, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function POS() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState({ name: '', mobile: '' });
  const [discount, setDiscount] = useState(0);
  
  const searchRef = useRef(null);

  useEffect(() => {
    loadProducts();
    searchRef.current?.focus();
  }, []);

  const loadProducts = async () => {
    const all = await db.products.toArray();
    setProducts(all);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearch('');
    searchRef.current?.focus();
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18; // 18% GST example
  const total = subtotal + tax - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');

    const offlineId = `SALE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const saleData = {
      offline_id: offlineId,
      customer_name: customer.name,
      customer_mobile: customer.mobile,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        tax_amount: item.price * 0.18
      })),
      total_amount: total,
      tax_amount: tax,
      discount_amount: discount,
      payment_method: 'Cash',
      user_id: 1 // Mock user ID
    };

    try {
      // 1. Save to local sales table
      await db.sales.add({ ...saleData, synced: false });
      
      // 2. Queue for background sync
      await queueForSync('SALE', saleData);

      // 3. Update local inventory
      for (const item of cart) {
        const inv = await db.inventory.where({ product_id: item.id }).first();
        if (inv) {
          await db.inventory.update(inv.id, { quantity: inv.quantity - item.quantity });
        }
      }

      toast.success('Sale completed successfully!');
      setCart([]);
      setCustomer({ name: '', mobile: '' });
      setDiscount(0);
    } catch (err) {
      toast.error('Failed to process sale');
      console.error(err);
    }
  };

  const filteredProducts = search.length > 0 
    ? products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode === search
      )
    : [];

  return (
    <div className="pos-container flex gap-4 h-[calc(100vh-120px)] animate-fade-in">
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="card p-4 flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input 
              ref={searchRef}
              className="input pl-10" 
              placeholder="Search Name, SKU or Scan Barcode..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && filteredProducts.length > 0) {
                  addToCart(filteredProducts[0]);
                }
              }}
            />
          </div>
          <button className="btn btn-primary h-[45px] px-6">Scan</button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <div key={p.id} className="card p-4 flex flex-col gap-2 cursor-pointer hover:border-primary transition-all group" onClick={() => addToCart(p)}>
                <div className="text-xs text-muted font-mono">{p.sku}</div>
                <div className="font-bold text-sm line-clamp-2">{p.name}</div>
                <div className="text-primary font-bold mt-auto">₹{p.price.toLocaleString()}</div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} className="text-primary" />
                </div>
              </div>
            ))
          ) : (
            search.length > 0 && <div className="col-span-full p-12 text-center text-muted">No products found for "{search}"</div>
          )}
          {search.length === 0 && products.slice(0, 12).map(p => (
              <div key={p.id} className="card p-4 flex flex-col gap-2 cursor-pointer hover:border-primary transition-all group" onClick={() => addToCart(p)}>
                <div className="text-xs text-muted font-mono">{p.sku}</div>
                <div className="font-bold text-sm line-clamp-2">{p.name}</div>
                <div className="text-primary font-bold mt-auto">₹{p.price.toLocaleString()}</div>
              </div>
          ))}
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="w-[400px] flex flex-col gap-4">
        <div className="card p-4 flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="flex items-center justify-between border-bottom pb-2">
            <div className="flex items-center gap-2 font-bold">
              <ShoppingCart size={20} className="text-primary" /> Current Cart
            </div>
            <button className="btn btn-ghost btn-sm text-danger" onClick={() => setCart([])}>Clear</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                <ShoppingCart size={48} />
                <span className="text-sm font-bold">Cart is Empty</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-start animate-fade-in">
                    <div className="flex-1">
                      <div className="text-sm font-bold line-clamp-1">{item.name}</div>
                      <div className="text-xs text-muted">₹{item.price} × {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 dark:bg-slate-800">
                      <button className="p-1 hover:text-primary" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button className="p-1 hover:text-primary" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                    </div>
                    <button className="p-1 text-danger opacity-50 hover:opacity-100" onClick={() => removeFromCart(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-muted">Customer Name</label>
                    <input className="input !py-1 !px-2 !text-xs" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-muted">Mobile No</label>
                    <input className="input !py-1 !px-2 !text-xs" value={customer.mobile} onChange={e => setCustomer({...customer, mobile: e.target.value})} />
                </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Tax (GST 18%)</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-black pt-2 border-t mt-2">
                <span>Total</span>
                <span className="text-primary">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button className="btn btn-primary w-full py-4 text-lg mt-2 shadow-lg" onClick={handleCheckout}>
              <CreditCard size={20} /> Complete Payment (F10)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
