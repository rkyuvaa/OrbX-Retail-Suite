import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, Pencil, Trash2, Shield, Building, Boxes, 
  Users as UsersIcon, X, CheckSquare, Square, 
  Clock, History, Search, Filter 
} from 'lucide-react';
import { Modal, Confirm, Badge, Loader, Empty } from '../components/Shared';

const API_URL = `http://${window.location.hostname}:5000`;

function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
}





// ─── Table Wrapper ────────────────────────────────────────────────────────────
function DataTable({ columns, rows, onEdit, onDelete }) {
    return (
        <div style={{ overflowX: 'auto', margin: '0 -20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {columns.map(c => (
                            <th key={c.key} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontWeight: 800, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {c.label}
                            </th>
                        ))}
                        <th style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 800, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {rows.length === 0 && (
                        <tr><td colSpan={columns.length + 1} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No records found</td></tr>
                    )}
                    {rows.map((row, i) => (
                        <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
                            {columns.map(c => (
                                <td key={c.key} style={{ padding: '1rem 1.25rem', fontWeight: c.bold ? 700 : 500 }}>
                                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                                </td>
                            ))}
                            <td style={{ padding: '1rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <button className="btn-ghost" style={{ 
                                    padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 700,
                                    borderRadius: '8px', border: '1px solid var(--border)', marginRight: '6px',
                                    cursor: 'pointer'
                                }} onClick={() => onEdit(row)}>Edit</button>
                                <button className="btn-ghost" style={{ 
                                    padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 700,
                                    borderRadius: '8px', border: '1px solid var(--danger)',
                                    color: 'var(--danger)', cursor: 'pointer'
                                }} onClick={() => onDelete(row)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const emptyForm = { 
  name: '', email: '', password: '', role_id: '', 
  branch_id: '', allowed_branches: [], allowed_modules: {}, 
  department_id: '', is_superadmin: false, is_active: true 
};

const ALL_MODULES = [
  { key: 'crm', name: 'CRM' },
  { key: 'inventory', name: 'Inventory' },
  { key: 'pos', name: 'POS / Billing' },
  { key: 'transfers', name: 'Stock Transfers' },
  { key: 'reports', name: 'Reports' },
  { key: 'settings', name: 'System Settings' }
];

// ─── USERS TAB ────────────────────────────────────────────────────────────────
function UsersTab({ roles, branches, departments }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('list'); // 'list' or 'form'
    
    // User Form
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [confirming, setConfirming] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await apiFetch('/api/users');
            if (r.ok) setUsers(await r.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const loadHistory = async (uid) => {
        // Audit log placeholder — can be implemented later in backend
        setHistory([]);
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const openAdd = () => { 
        setForm(emptyForm); 
        setEditing(null); 
        setHistory([]);
        setMode('form'); 
    };

    const openEdit = u => {
        setForm({ 
            name: u.name, 
            email: u.email, 
            password: '', 
            role_id: u.role_id || '', 
            branch_id: u.branch_id || '', 
            allowed_branches: u.allowed_branches || [], 
            allowed_modules: u.allowed_modules || {}, 
            department_id: u.department_id || '',
            is_superadmin: !!u.is_superadmin, 
            is_active: !!u.is_active 
        });
        setEditing(u.id); 
        loadHistory(u.id);
        setMode('form');
    };

    const saveUser = async (e) => {
        if (e) e.preventDefault();
        if (!form.name || !form.email) return toast.error('Name and Email are required');
        setSaving(true);
        try {
            const isEdit = !!editing;
            const url = isEdit ? `/api/users/${editing}` : '/api/users';
            const method = isEdit ? 'PUT' : 'POST';
            
            const r = await apiFetch(url, { method, body: JSON.stringify(form) });
            if (r.ok) {
                toast.success(isEdit ? 'User updated' : 'User created');
                setMode('list'); load();
            } else {
                const d = await r.json();
                toast.error(d.error || 'Failed to save');
            }
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!confirming) return;
        try {
            const r = await apiFetch(`/api/users/${confirming.id}`, { method: 'DELETE' });
            if (r.ok) { toast.success('User deleted'); setConfirming(null); load(); }
        } catch (e) { toast.error('Error deleting'); }
    };

    const toggleBranch = (bid) => {
        const current = form.allowed_branches || [];
        if (current.includes(bid)) set('allowed_branches', current.filter(id => id !== bid));
        else set('allowed_branches', [...current, bid]);
    };

    const setModuleRole = (modKey, roleId) => {
        setForm(f => {
            const updated = { ...f.allowed_modules };
            if (!roleId) delete updated[modKey];
            else updated[modKey] = parseInt(roleId);
            return { ...f, allowed_modules: updated };
        });
    };

    if (loading && users.length === 0) return <Loader />;

    if (mode === 'form') {
        return (
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div className="flex items-center gap-3">
                        <button className="btn btn-ghost" onClick={() => setMode('list')} style={{ padding: '0.5rem' }}>
                            <X size={20} />
                        </button>
                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>
                            {editing ? 'Edit User Profile' : 'Create New User'}
                        </h4>
                    </div>
                    <button className="btn btn-primary" onClick={saveUser} disabled={saving}>
                        {saving ? 'Saving...' : 'Save User Settings'}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                    {/* MAIN EDITOR AREA */}
                    <div className="card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* SECTION 1: Identity */}
                        <section>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>1. Identity & Core Settings</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Full Name</label>
                                    <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full Name" />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Email Address</label>
                                    <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Password</label>
                                    <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={editing ? '••••••••' : 'Password'} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Department</label>
                                    <select className="input" value={form.department_id} onChange={e => set('department_id', e.target.value)}>
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Global Role</label>
                                    <select className="input" value={form.role_id} onChange={e => set('role_id', e.target.value)}>
                                        <option value="">Default Access</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Account Status</label>
                                    <select className="input" value={form.is_active} onChange={e => set('is_active', e.target.value === 'true')}>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-primary/5 rounded-xl border border-primary/20">
                                        <input type="checkbox" className="w-5 h-5 rounded" checked={form.is_superadmin} onChange={e => set('is_superadmin', e.target.checked)} />
                                        <div>
                                            <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '12px', display: 'block' }}>GRANT SUPER ADMIN PRIVILEGES</span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Full system access, overriding all other module and branch restrictions.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 2: Branches */}
                        <section>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>2. Branch Portfolio Authorization</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                                {branches.map(b => {
                                    const isPrimary = form.branch_id == b.id;
                                    const isAllowed = (form.allowed_branches || []).includes(b.id);
                                    const isSelected = isPrimary || isAllowed;
                                    
                                    return (
                                        <div key={b.id} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 12, 
                                            padding: '10px 14px', 
                                            background: isSelected ? 'var(--bg-main)' : 'transparent', 
                                            border: `1.5px solid ${isPrimary ? 'var(--primary)' : (isSelected ? 'var(--primary-glow)' : 'var(--border)')}`, 
                                            borderRadius: 12, 
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }} onClick={() => toggleBranch(b.id)}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: isSelected ? 'var(--primary-light)' : 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Building size={18} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? 'var(--text-main)' : 'var(--text-muted)', display: 'block' }}>{b.name}</span>
                                                {isSelected && !isPrimary ? (
                                                    <span 
                                                        onClick={(e) => { e.stopPropagation(); set('branch_id', b.id); }} 
                                                        style={{ fontSize: '8px', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', textDecoration: 'underline' }}
                                                    >
                                                        Set as Primary
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isPrimary ? 'Primary Branch' : (isSelected ? 'Authorized' : 'Locked')}</span>
                                                )}
                                            </div>
                                            {isSelected ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--border)" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* SECTION 3: Modules */}
                        <section>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>3. Module-Specific Roles</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                {ALL_MODULES.map(m => {
                                    const roleId = (form.allowed_modules || {})[m.key];
                                    return (
                                        <div key={m.key} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '12px', 
                                            background: roleId ? 'var(--bg-main)' : 'transparent', 
                                            border: `1.5px solid ${roleId ? 'var(--primary)' : 'var(--border)'}`, 
                                            borderRadius: 14
                                        }}>
                                            <div style={{ 
                                                width: 36, 
                                                height: 36, 
                                                background: roleId ? 'var(--primary)' : 'var(--bg-main)', 
                                                borderRadius: 10, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                color: roleId ? 'white' : 'var(--text-muted)' 
                                            }}>
                                                <Shield size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '11px', fontWeight: 900, color: roleId ? 'var(--text-main)' : 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{m.name}</span>
                                                <select 
                                                    className="input" 
                                                    value={roleId || ''} 
                                                    onChange={e => setModuleRole(m.key, e.target.value)} 
                                                    style={{ height: '32px', padding: '0 8px', fontSize: '11px', fontWeight: 700 }}
                                                >
                                                    <option value="">No Access</option>
                                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* SIDEBAR: Stats & History */}
                    <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="card" style={{ padding: '20px' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} color="var(--primary)" />
                                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Lifecycle</span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-muted block">Created At</label>
                                    <span className="font-bold text-sm">{editing ? '01 May 2026' : 'Now'}</span>
                                </div>
                                <div>
                                    <label className="text-xs text-muted block">Account Status</label>
                                    <Badge color={form.is_active ? 'var(--success)' : 'var(--danger)'}>
                                        {form.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <History size={16} color="var(--primary)" />
                                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Rights Audit Log</span>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <Empty message="No rights changes yet" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const columns = [
        { key: 'name', label: 'Username', bold: true },
        { key: 'email', label: 'User ID' },
        { key: 'role_name', label: 'Role', render: u => (
            <Badge color="var(--primary)">{u.role_name || 'Standard User'}</Badge>
        )},
        { key: 'branch_name', label: 'Primary Branch', render: u => (
            <div className="flex items-center gap-2">
                <Building size={14} color="var(--text-muted)" />
                <span className="font-bold">{u.branch_name || '—'}</span>
            </div>
        )},
        { key: 'allowed_branches', label: 'Access', render: u => {
            const count = (u.allowed_branches || []).length;
            return <Badge color="var(--bg-main)" style={{ border: '1px solid var(--border)' }}>{count} Branches</Badge>;
        }},
        { key: 'is_superadmin', label: 'Level', render: u => (
            u.is_superadmin ? <Badge color="var(--primary)">ADMIN</Badge> : <span className="text-muted text-xs">Standard</span>
        )},
        { key: 'is_active', label: 'Status', render: u => (
            <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.is_active ? 'var(--success)' : 'var(--danger)' }} />
                <span style={{ color: u.is_active ? 'var(--success)' : 'var(--danger)', fontWeight: 800, fontSize: '10px' }}>
                    {u.is_active ? 'ACTIVE' : 'OFFLINE'}
                </span>
            </div>
        )},
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="flex items-center gap-3">
                    <UsersIcon size={24} color="var(--primary)" />
                    <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>User Management</h4>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> New User
                </button>
            </div>
            
            <div className="card" style={{ padding: 0 }}>
                {users.length === 0 ? <Empty /> : (
                    <DataTable columns={columns} rows={users} onEdit={openEdit} onDelete={u => setConfirming(u)} />
                )}
            </div>

            {confirming && (
                <Confirm 
                    title="Delete User"
                    message={`Are you sure you want to remove ${confirming.name}? This will revoke all system access permanently.`}
                    onConfirm={remove}
                    onCancel={() => setConfirming(null)}
                />
            )}
        </>
    );
}

// ─── BRANCHES TAB ────────────────────────────────────────────────────────────
function BranchesTab() {
    const [items, setItems] = useState([]);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({});

    const load = async () => {
        const r = await apiFetch('/api/branches');
        if (r.ok) setItems(await r.json());
    };
    useEffect(() => { load(); }, []);

    const save = async () => {
        const isEdit = modal?.edit;
        const r = await apiFetch(isEdit ? `/api/branches/${modal.edit.id}` : '/api/branches', {
            method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(form)
        });
        if (r.ok) { toast.success(isEdit ? 'Updated' : 'Created'); setModal(null); load(); }
        else { const d = await r.json(); toast.error(d.error || 'Failed'); }
    };

    const remove = async (row) => {
        if (!confirm(`Delete branch "${row.name}"?`)) return;
        const r = await apiFetch(`/api/branches/${row.id}`, { method: 'DELETE' });
        if (r.ok) { toast.success('Deleted'); load(); } else toast.error('Failed');
    };

    const columns = [
        { key: 'name', label: 'Branch Name', bold: true },
        { key: 'location', label: 'Location' },
        { key: 'is_warehouse', label: 'Warehouse', render: r => r.is_warehouse ? <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Yes</span> : 'No' },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Branch Management</h4>
                <button className="btn btn-primary" onClick={() => { setForm({ is_warehouse: false }); setModal('add'); }}>+ Add Branch</button>
            </div>
            <DataTable columns={columns} rows={items} onEdit={row => { setForm(row); setModal({ edit: row }); }} onDelete={remove} />
            {modal && (
                <Modal 
                    title={modal === 'add' ? 'Add New Branch' : 'Edit Branch'} 
                    onClose={() => setModal(null)}
                    footer={<>
                        <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={save}>Save Branch</button>
                    </>}
                >
                    <div className="form-group"><label className="form-label">Branch Name</label><input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter branch name" /></div>
                    <div className="form-group"><label className="form-label">Location</label><input className="input" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City or area" /></div>
                    <div className="form-group">
                        <label className="form-label">Is Warehouse?</label>
                        <select className="input" value={form.is_warehouse ? 'true' : 'false'} onChange={e => setForm({ ...form, is_warehouse: e.target.value === 'true' })}>
                            <option value="false">No (Retail Branch)</option>
                            <option value="true">Yes (Storage/Warehouse)</option>
                        </select>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ─── ROLES TAB ───────────────────────────────────────────────────────────────
function RolesTab() {
    const [items, setItems] = useState([]);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({});

    const load = async () => {
        const r = await apiFetch('/api/roles');
        if (r.ok) setItems(await r.json());
    };
    useEffect(() => { load(); }, []);

    const save = async () => {
        const isEdit = modal?.edit;
        let permissions = {};
        try { permissions = JSON.parse(form.permissionsStr || '{}'); } catch { toast.error('Invalid JSON in permissions'); return; }
        const r = await apiFetch(isEdit ? `/api/roles/${modal.edit.id}` : '/api/roles', {
            method: isEdit ? 'PUT' : 'POST', body: JSON.stringify({ name: form.name, permissions })
        });
        if (r.ok) { toast.success(isEdit ? 'Updated' : 'Created'); setModal(null); load(); }
        else { const d = await r.json(); toast.error(d.error || 'Failed'); }
    };

    const remove = async (row) => {
        if (!confirm(`Delete role "${row.name}"?`)) return;
        const r = await apiFetch(`/api/roles/${row.id}`, { method: 'DELETE' });
        if (r.ok) { toast.success('Deleted'); load(); } else toast.error('Failed');
    };

    const columns = [
        { key: 'name', label: 'Role Name', bold: true },
        { key: 'permissions', label: 'Permissions', render: r => {
            const perms = r.permissions || {};
            const keys = Object.keys(perms);
            if (keys.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No permissions</span>;
            return (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {keys.map(k => (
                        <span key={k} style={{
                            background: 'var(--primary-light)', color: 'var(--primary)',
                            borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: 700
                        }}>{k}</span>
                    ))}
                </div>
            );
        }},
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Role Management</h4>
                <button className="btn btn-primary" onClick={() => { setForm({ name: '', permissionsStr: '{}' }); setModal('add'); }}>+ Add Role</button>
            </div>
            <DataTable columns={columns} rows={items} onEdit={row => { setForm({ ...row, permissionsStr: JSON.stringify(row.permissions || {}) }); setModal({ edit: row }); }} onDelete={remove} />
            {modal && (
                <Modal 
                    title={modal === 'add' ? 'Create New Role' : 'Edit Role Permissions'} 
                    onClose={() => setModal(null)}
                    footer={<>
                        <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={save}>Save Role</button>
                    </>}
                >
                    <div className="form-group"><label className="form-label">Role Name</label><input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales Executive" /></div>
                    <div className="form-group">
                        <label className="form-label">Permissions (JSON Format)</label>
                        <textarea className="input" style={{ minHeight: 120, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                            value={form.permissionsStr || '{}'} onChange={e => setForm({ ...form, permissionsStr: e.target.value })} />
                    </div>
                </Modal>
            )}
        </>
    );
}

// ─── DEPARTMENTS TAB ──────────────────────────────────────────────────────────
function DepartmentsTab() {
    const [items, setItems] = useState([]);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({});

    const load = async () => {
        const r = await apiFetch('/api/departments');
        if (r.ok) setItems(await r.json());
    };
    useEffect(() => { load(); }, []);

    const save = async () => {
        const isEdit = modal?.edit;
        const r = await apiFetch(isEdit ? `/api/departments/${modal.edit.id}` : '/api/departments', {
            method: isEdit ? 'PUT' : 'POST', body: JSON.stringify({ name: form.name })
        });
        if (r.ok) { toast.success(isEdit ? 'Updated' : 'Created'); setModal(null); load(); }
        else { const d = await r.json(); toast.error(d.error || 'Failed'); }
    };

    const remove = async (row) => {
        if (!confirm(`Delete department "${row.name}"?`)) return;
        const r = await apiFetch(`/api/departments/${row.id}`, { method: 'DELETE' });
        if (r.ok) { toast.success('Deleted'); load(); } else toast.error('Failed');
    };

    const columns = [
        { key: 'name', label: 'Department Name', bold: true },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Department Management</h4>
                <button className="btn btn-primary" onClick={() => { setForm({ name: '' }); setModal('add'); }}>+ Add Department</button>
            </div>
            <DataTable columns={columns} rows={items} onEdit={row => { setForm(row); setModal({ edit: row }); }} onDelete={remove} />
            {modal && (
                <Modal 
                    title={modal === 'add' ? 'Add Department' : 'Edit Department'} 
                    onClose={() => setModal(null)}
                    footer={<>
                        <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={save}>Save Department</button>
                    </>}
                >
                    <div className="form-group"><label className="form-label">Department Name</label><input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Accounts & Finance" /></div>
                </Modal>
            )}
        </>
    );
}

// ─── SALES PERSONS TAB ───────────────────────────────────────────────────────
function SalesPersonsTab({ branches }) {
    const [items, setItems] = useState([]);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({});

    const load = async () => {
        const r = await apiFetch('/api/salespersons');
        if (r.ok) setItems(await r.json());
    };
    useEffect(() => { load(); }, []);

    const save = async () => {
        const isEdit = modal?.edit;
        const r = await apiFetch(isEdit ? `/api/salespersons/${modal.edit.id}` : '/api/salespersons', {
            method: isEdit ? 'PUT' : 'POST',
            body: JSON.stringify(form)
        });
        if (r.ok) { toast.success(isEdit ? 'Updated' : 'Salesperson added'); setModal(null); load(); }
        else { const d = await r.json(); toast.error(d.error || 'Failed'); }
    };

    const remove = async (row) => {
        if (!confirm(`Delete salesperson "${row.name}"?`)) return;
        const r = await apiFetch(`/api/salespersons/${row.id}`, { method: 'DELETE' });
        if (r.ok) { toast.success('Deleted'); load(); } else toast.error('Delete failed');
    };

    const columns = [
        { key: 'name', label: 'Name', bold: true },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'branch_name', label: 'Branch', render: r => r.branch_name || '—' },
        { key: 'commission_percent', label: 'Commission', render: r => `${r.commission_percent || 0}%` },
        { key: 'target_amount', label: 'Target', render: r => `₹${Number(r.target_amount || 0).toLocaleString()}` },
        { key: 'is_active', label: 'Status', render: r => (
            <span style={{ color: r.is_active ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                {r.is_active ? 'Active' : 'Inactive'}
            </span>
        )},
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Sales Person Management</h4>
                <button className="btn btn-primary" onClick={() => { setForm({ is_active: true, commission_percent: 0, target_amount: 0 }); setModal('add'); }}>+ Add Sales Person</button>
            </div>
            <DataTable columns={columns} rows={items} onEdit={row => { setForm(row); setModal({ edit: row }); }} onDelete={remove} />

            {modal && (
                <Modal
                    title={modal === 'add' ? 'Add Sales Person' : 'Edit Sales Person'}
                    onClose={() => setModal(null)}
                    footer={<>
                        <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={save}>Save</button>
                    </>}
                >
                    <div className="form-group"><label className="form-label">Full Name</label>
                        <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group"><label className="form-label">Email</label>
                            <input className="input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                        </div>
                        <div className="form-group"><label className="form-label">Phone / Mobile</label>
                            <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
                        </div>
                    </div>
                    <div className="form-group"><label className="form-label">Assigned Branch</label>
                        <select className="input" value={form.branch_id || ''} onChange={e => setForm({ ...form, branch_id: e.target.value || null })}>
                            <option value="">Select Branch</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group"><label className="form-label">Commission %</label>
                            <input className="input" type="number" min="0" max="100" step="0.5"
                                value={form.commission_percent || 0} onChange={e => setForm({ ...form, commission_percent: e.target.value })} />
                        </div>
                        <div className="form-group"><label className="form-label">Monthly Target (₹)</label>
                            <input className="input" type="number" min="0"
                                value={form.target_amount || 0} onChange={e => setForm({ ...form, target_amount: e.target.value })} />
                        </div>
                    </div>
                    {modal?.edit && (
                        <div className="form-group"><label className="form-label">Status</label>
                            <select className="input" value={form.is_active ? 'true' : 'false'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    )}
                </Modal>
            )}
        </>
    );
}

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────────
const TABS = [
    { key: 'users',        label: '👤 Users' },
    { key: 'salespersons', label: '🧑‍💼 Sales Persons' },
    { key: 'branches',     label: '🏢 Branches' },
    { key: 'roles',        label: '🛡 Roles' },
    { key: 'departments',  label: '🏷 Departments' },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState('users');
    const [roles, setRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Pre-load lookup data for the Users form
    useEffect(() => {
        apiFetch('/api/roles').then(r => r.ok && r.json()).then(d => d && setRoles(d));
        apiFetch('/api/branches').then(r => r.ok && r.json()).then(d => d && setBranches(d));
        apiFetch('/api/departments').then(r => r.ok && r.json()).then(d => d && setDepartments(d));
    }, []);

    return (
        <div style={{ padding: '16px 20px' }}>
            {/* Tab Bar */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 20,
                borderBottom: '2px solid var(--border)', paddingBottom: 0
            }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '9px 18px', fontWeight: 800, fontSize: 13,
                        color: activeTab === t.key ? 'var(--primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                        marginBottom: -2, transition: 'all 0.15s'
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="card" style={{ padding: 20 }}>
                {activeTab === 'users'        && <UsersTab roles={roles} branches={branches} departments={departments} />}
                {activeTab === 'salespersons' && <SalesPersonsTab branches={branches} />}
                {activeTab === 'branches'     && <BranchesTab />}
                {activeTab === 'roles'        && <RolesTab />}
                {activeTab === 'departments'  && <DepartmentsTab />}
            </div>
        </div>
    );
}
