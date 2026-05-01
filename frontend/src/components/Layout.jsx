import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, ArrowLeftRight, 
  Users, BarChart3, Settings, Menu, ChevronLeft, 
  LogOut, Bell, Search, Sun, Moon, Warehouse, Layers
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { path: '/',           name: 'Dashboard',    icon: LayoutDashboard },
  { path: '/pos',        name: 'POS / Billing', icon: ShoppingCart   },
  { path: '/products',   name: 'Products',      icon: Package        },
  { path: '/inventory',  name: 'Inventory',     icon: BarChart3      },
  { path: '/transfers',  name: 'Transfers',     icon: ArrowLeftRight },
  { path: '/customers',  name: 'Customers',     icon: Users          },
  { path: '/studio',     name: 'Studio',        icon: Layers         },
  { path: '/reports',    name: 'Reports',       icon: BarChart3      },
  { path: '/settings',   name: 'Settings',      icon: Settings       },
];

const pageSubtitles = {
  '/':          'Overview of your retail operations',
  '/pos':       'Fast billing with barcode support',
  '/products':  'Manage your catalog and pricing',
  '/inventory': 'Track stock across all branches',
  '/transfers': 'Manage inter-branch stock movement',
  '/customers': 'Customer records and credit accounts',
  '/reports':   'Sales and performance analytics',
  '/settings':  'Configure your ERP settings',
};

export default function Layout({ children }) {
  const [isCollapsed, setIsCollapsed]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode]     = useState(false);
  const location = useLocation();
  
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = !!user.is_superadmin;
  const allowedModules = user.allowed_modules || {};

  // Filter navigation items based on permissions
  const filteredNav = navItems.filter(item => {
    if (isAdmin) return true;
    
    // Check if user has specific module role for this path
    // Mapping paths to module keys
    const pathMap = {
      '/pos': 'pos',
      '/products': 'inventory',
      '/inventory': 'inventory',
      '/transfers': 'transfers',
      '/customers': 'crm',
      '/reports': 'reports',
      '/settings': 'settings'
    };
    
    const modKey = pathMap[item.path];
    if (!modKey) return true; // Always show dashboard
    
    return !!allowedModules[modKey];
  });

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  // Derive current page title from route
  const currentNav  = navItems.find(n => n.path === location.pathname) || navItems[0];
  const pageTitle   = currentNav.name;
  const pageSubtitle = pageSubtitles[location.pathname] || 'OrbX Retail ERP';

  return (
    <div className="flex min-h-screen">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[999]"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={clsx('sidebar', isCollapsed && 'collapsed', isMobileOpen && 'mobile-open')}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0C8500, #085C00)' }}
          >
            <Package size={22} />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1 className="font-black text-lg tracking-tight leading-none">ORBX ERP</h1>
              <p className="text-[10px] text-muted font-bold tracking-widest uppercase mt-0.5">Retail Suite</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => clsx('nav-link', isActive && 'active')}
              onClick={() => setIsMobileOpen(false)}
            >
              <item.icon size={20} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button className="nav-link w-full border-none bg-transparent cursor-pointer" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            className="nav-link w-full border-none bg-transparent cursor-pointer"
            style={{ color: 'var(--danger)' }}
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button
          style={{
            position: 'absolute', right: '-12px', top: '76px',
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            display: 'none', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: 'var(--shadow-sm)', zIndex: 10,
          }}
          className="md:flex"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft
            size={13}
            style={{
              color: 'var(--text-muted)',
              transform: isCollapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.25s ease',
            }}
          />
        </button>
      </aside>

      {/* ─── Main Content ─── */}
      <main className={clsx('main-content flex-1', isCollapsed && 'sidebar-collapsed')}>

        {/* ─── Header ─── */}
        <header
          className="glass-panel flex items-center justify-between"
          style={{
            position: 'sticky', top: 0, zIndex: 50,
            padding: '0.2rem 2.5rem',
            margin: '-2rem -2.5rem 2rem -2.5rem',
          }}
        >
          {/* Left: page title only */}
          <div className="flex items-center gap-4">
            <h2 className="text-base font-black tracking-tight text-primary">
              {pageTitle}
            </h2>
          </div>

          {/* Right: bell + user */}
          <div className="flex items-center gap-2">
            {/* Bell */}
            <button
              className="btn btn-ghost bg-white border border-border shadow-sm"
              style={{ position: 'relative', padding: '0.25rem' }}
            >
              <Bell size={14} />
              <span
                style={{
                  position: 'absolute', top: '3px', right: '3px',
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: 'var(--danger)', border: '1.5px solid var(--bg-card)',
                }}
              />
            </button>

            {/* User */}
            <div
              className="flex items-center gap-2 bg-white border border-border rounded-lg shadow-sm"
              style={{ padding: '0.15rem 0.6rem 0.15rem 0.15rem' }}
            >
              <div
                className="rounded flex items-center justify-center font-black text-white uppercase"
                style={{ width: '24px', height: '24px', flexShrink: 0, fontSize: '10px', background: 'var(--primary)' }}
              >
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div style={{ lineHeight: 1 }}>
                <p className="text-[11px] font-bold">{user.name || 'User'}</p>
                <p className="text-[8px] text-muted font-bold uppercase">{user.role_name || (isAdmin ? 'Super Admin' : 'Staff')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div>{children}</div>
      </main>
    </div>
  );
}
