import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, ArrowLeftRight, 
  Users, BarChart3, Settings, Menu, X, ChevronLeft, 
  LogOut, Bell, Search, Sun, Moon 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { path: '/', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', name: 'POS / Billing', icon: ShoppingCart },
  { path: '/products', name: 'Products', icon: Package },
  { path: '/inventory', name: 'Inventory', icon: BarChart3 },
  { path: '/transfers', name: 'Transfers', icon: ArrowLeftRight },
  { path: '/customers', name: 'Customers', icon: Users },
  { path: '/reports', name: 'Reports', icon: BarChart3 },
  { path: '/settings', name: 'Settings', icon: Settings },
];

export default function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Overlay (Mobile) */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999] md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'sidebar',
        isCollapsed && 'collapsed',
        isMobileOpen && 'mobile-open'
      )}>
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <Package size={24} />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h1 className="font-black text-xl tracking-tight">ORBX ERP</h1>
              <p className="text-[10px] text-muted font-bold tracking-widest uppercase">Retail Suite</p>
            </div>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx('nav-link', isActive && 'active')}
              onClick={() => setIsMobileOpen(false)}
            >
              <item.icon size={20} />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <button className="nav-link w-full border-none bg-transparent cursor-pointer" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button className="nav-link w-full border-none bg-transparent cursor-pointer text-danger hover:bg-danger/10">
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button 
          className="absolute -right-3 top-20 bg-white border border-border w-6 h-6 rounded-full hidden md:flex items-center justify-center text-muted hover:text-primary transition-all shadow-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft size={14} className={clsx(isCollapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Main Content */}
      <main className={clsx('main-content flex-1', isCollapsed && 'sidebar-collapsed')}>
        {/* Top Header */}
        <header className="flex items-center justify-between mb-8 sticky top-0 bg-white/80 backdrop-blur-md z-50 py-4 border-b border-border -mx-8 px-8">
          <div className="flex items-center gap-4">
            <button className="md:hidden btn btn-ghost p-2" onClick={() => setIsMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Dashboard</h2>
              <p className="text-sm text-muted">Welcome back, Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 bg-gray-50 border border-border px-4 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search size={18} className="text-muted" />
                <input className="border-none outline-none text-sm w-64 bg-transparent" placeholder="Search anything..." />
            </div>
            <button className="btn btn-ghost relative p-2 bg-white border border-border shadow-sm hover:bg-gray-50">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 bg-white border border-border p-1.5 pr-4 rounded-xl shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">A</div>
              <div className="hidden sm:flex flex-col justify-center">
                <p className="text-sm font-bold leading-tight">Admin User</p>
                <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Main Branch</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="page-body">
          {children}
        </div>
      </main>
    </div>
  );
}
