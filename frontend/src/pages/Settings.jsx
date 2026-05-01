import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

// ─── Shared Modal ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, footer }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="font-heading" style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>✕</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

function FormField({ label, children }) {
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
                display: 'block', 
                fontSize: '11px', 
                fontWeight: 800, 
                color: 'var(--text-muted)', 
                marginBottom: '0.6rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em' 
            }}>{label}</label>
            {children}
        </div>
    );
}

const inputStyle = {}; // Not used, replaced by className="input"

const btnPrimaryClass = "btn btn-primary";
const btnGhostClass = "btn btn-ghost";

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

// ─── USERS TAB ────────────────────────────────────────────────────────────────
function UsersTab({ roles, branches, departments }) {
    const [users, setUsers] = useState([]);
    const [modal, setModal] = useState(null); // null | 'add' | {edit: row}
    const [form, setForm] = useState({});

    const load = async () => {
        const r = await apiFetch('/api/users');
        if (r.ok) setUsers(await r.json());
    };
    useEffect(() => { load(); }, []);

    const openAdd = () => { setForm({ is_superadmin: false, is_active: true }); setModal('add'); };
    const openEdit = (row) => { setForm({ ...row, password: '' }); setModal({ edit: row }); };

    const save = async () => {
        const isEdit = modal?.edit;
        const url = isEdit ? `/api/users/${modal.edit.id}` : '/api/users';
        const method = isEdit ? 'PUT' : 'POST';
        const body = { ...form };
        if (isEdit && !body.password) delete body.password;

        const r = await apiFetch(url, { method, body: JSON.stringify(body) });
        if (r.ok) {
            toast.success(isEdit ? 'User updated' : 'User created');
            setModal(null); load();
        } else {
            const d = await r.json();
            toast.error(d.error || 'Failed');
        }
    };

    const remove = async (row) => {
        if (!confirm(`Delete user "${row.name}"?`)) return;
        const r = await apiFetch(`/api/users/${row.id}`, { method: 'DELETE' });
        if (r.ok) { toast.success('Deleted'); load(); }
        else toast.error('Delete failed');
    };

    const columns = [
        { key: 'name', label: 'Name', bold: true },
        { key: 'email', label: 'Email' },
        { key: 'role_name', label: 'Role', render: r => r.role_name || '—' },
        { key: 'branch_name', label: 'Branch', render: r => r.branch_name || '—' },
        { key: 'is_superadmin', label: 'Admin', render: r => r.is_superadmin ? <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Yes</span> : 'No' },
        { key: 'is_active', label: 'Status', render: r => <span style={{ color: r.is_active ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{r.is_active ? 'Active' : 'Inactive'}</span> },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>User Management</h4>
                <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
            </div>
            <DataTable columns={columns} rows={users} onEdit={openEdit} onDelete={remove} />

            {modal && (
                <Modal 
                    title={modal === 'add' ? 'Add New User' : 'Edit User Profile'} 
                    onClose={() => setModal(null)}
                    footer={<>
                        <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={save}>Save Changes</button>
                    </>}
                >
                    <FormField label="Full Name">
                        <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
                    </FormField>
                    <FormField label="Email">
                        <input className="input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                    </FormField>
                    <FormField label={modal?.edit ? 'New Password (Optional)' : 'Password'}>
                        <input className="input" type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormField label="Role">
                            <select className="input" value={form.role_id || ''} onChange={e => setForm({ ...form, role_id: e.target.value || null })}>
                                <option value="">Select Role</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Branch">
                            <select className="input" value={form.branch_id || ''} onChange={e => setForm({ ...form, branch_id: e.target.value || null })}>
                                <option value="">Select Branch</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <FormField label="Department">
                        <select className="input" value={form.department_id || ''} onChange={e => setForm({ ...form, department_id: e.target.value || null })}>
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormField label="Is Superadmin?">
                            <select className="input" value={form.is_superadmin ? 'true' : 'false'} onChange={e => setForm({ ...form, is_superadmin: e.target.value === 'true' })}>
                                <option value="false">No (Standard User)</option>
                                <option value="true">Yes (Full Access)</option>
                            </select>
                        </FormField>
                        {modal?.edit && (
                            <FormField label="Account Status">
                                <select className="input" value={form.is_active ? 'true' : 'false'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </FormField>
                        )}
                    </div>
                </Modal>
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
                    <FormField label="Branch Name"><input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter branch name" /></FormField>
                    <FormField label="Location"><input className="input" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City or area" /></FormField>
                    <FormField label="Is Warehouse?">
                        <select className="input" value={form.is_warehouse ? 'true' : 'false'} onChange={e => setForm({ ...form, is_warehouse: e.target.value === 'true' })}>
                            <option value="false">No (Retail Branch)</option>
                            <option value="true">Yes (Storage/Warehouse)</option>
                        </select>
                    </FormField>
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
                    <FormField label="Role Name"><input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales Executive" /></FormField>
                    <FormField label="Permissions (JSON Format)">
                        <textarea className="input" style={{ minHeight: 120, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                            value={form.permissionsStr || '{}'} onChange={e => setForm({ ...form, permissionsStr: e.target.value })} />
                    </FormField>
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
                    <FormField label="Department Name"><input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Accounts & Finance" /></FormField>
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
                    <FormField label="Full Name">
                        <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormField label="Email">
                            <input className="input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                        </FormField>
                        <FormField label="Phone / Mobile">
                            <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
                        </FormField>
                    </div>
                    <FormField label="Assigned Branch">
                        <select className="input" value={form.branch_id || ''} onChange={e => setForm({ ...form, branch_id: e.target.value || null })}>
                            <option value="">Select Branch</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormField label="Commission %">
                            <input className="input" type="number" min="0" max="100" step="0.5"
                                value={form.commission_percent || 0} onChange={e => setForm({ ...form, commission_percent: e.target.value })} />
                        </FormField>
                        <FormField label="Monthly Target (₹)">
                            <input className="input" type="number" min="0"
                                value={form.target_amount || 0} onChange={e => setForm({ ...form, target_amount: e.target.value })} />
                        </FormField>
                    </div>
                    {modal?.edit && (
                        <FormField label="Status">
                            <select className="input" value={form.is_active ? 'true' : 'false'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </FormField>
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
