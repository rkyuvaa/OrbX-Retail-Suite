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
function Modal({ title, onClose, children }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '28px 32px', minWidth: 420, maxWidth: 520,
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{title}</h3>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: 20, lineHeight: 1
                    }}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

function FormField({ label, children }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
            {children}
        </div>
    );
}

const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text-main)', fontSize: 13, fontWeight: 600,
    outline: 'none', boxSizing: 'border-box'
};

const btnPrimary = {
    background: 'var(--primary)', color: '#fff', border: 'none',
    borderRadius: 8, padding: '9px 20px', fontWeight: 800,
    fontSize: 13, cursor: 'pointer'
};

const btnDanger = {
    background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)',
    borderRadius: 8, padding: '5px 12px', fontWeight: 700,
    fontSize: 11, cursor: 'pointer'
};

const btnEdit = {
    background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)',
    borderRadius: 8, padding: '5px 12px', fontWeight: 700,
    fontSize: 11, cursor: 'pointer', marginRight: 6
};

// ─── Table Wrapper ────────────────────────────────────────────────────────────
function DataTable({ columns, rows, onEdit, onDelete }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {columns.map(c => (
                            <th key={c.key} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {c.label}
                            </th>
                        ))}
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 && (
                        <tr><td colSpan={columns.length + 1} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No records found</td></tr>
                    )}
                    {rows.map((row, i) => (
                        <tr key={row.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                            {columns.map(c => (
                                <td key={c.key} style={{ padding: '10px 12px', fontWeight: c.bold ? 700 : 500 }}>
                                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                                </td>
                            ))}
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                <button style={btnEdit} onClick={() => onEdit(row)}>Edit</button>
                                <button style={btnDanger} onClick={() => onDelete(row)}>Delete</button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontWeight: 800 }}>User Management</h4>
                <button style={btnPrimary} onClick={openAdd}>+ Add User</button>
            </div>
            <DataTable columns={columns} rows={users} onEdit={openEdit} onDelete={remove} />

            {modal && (
                <Modal title={modal === 'add' ? 'Add User' : 'Edit User'} onClose={() => setModal(null)}>
                    <FormField label="Full Name">
                        <input style={inputStyle} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                    </FormField>
                    <FormField label="Email">
                        <input style={inputStyle} type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" />
                    </FormField>
                    <FormField label={modal?.edit ? 'New Password (leave blank to keep)' : 'Password'}>
                        <input style={inputStyle} type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" />
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <FormField label="Role">
                            <select style={inputStyle} value={form.role_id || ''} onChange={e => setForm({ ...form, role_id: e.target.value || null })}>
                                <option value="">— Select Role —</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Branch">
                            <select style={inputStyle} value={form.branch_id || ''} onChange={e => setForm({ ...form, branch_id: e.target.value || null })}>
                                <option value="">— Select Branch —</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <FormField label="Department">
                        <select style={inputStyle} value={form.department_id || ''} onChange={e => setForm({ ...form, department_id: e.target.value || null })}>
                            <option value="">— Select Department —</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <FormField label="Superadmin">
                            <select style={inputStyle} value={form.is_superadmin ? 'true' : 'false'} onChange={e => setForm({ ...form, is_superadmin: e.target.value === 'true' })}>
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </select>
                        </FormField>
                        {modal?.edit && (
                            <FormField label="Status">
                                <select style={inputStyle} value={form.is_active ? 'true' : 'false'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </FormField>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button style={{ ...btnPrimary, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setModal(null)}>Cancel</button>
                        <button style={btnPrimary} onClick={save}>Save</button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontWeight: 800 }}>Branch Management</h4>
                <button style={btnPrimary} onClick={() => { setForm({ is_warehouse: false }); setModal('add'); }}>+ Add Branch</button>
            </div>
            <DataTable columns={columns} rows={items} onEdit={row => { setForm(row); setModal({ edit: row }); }} onDelete={remove} />
            {modal && (
                <Modal title={modal === 'add' ? 'Add Branch' : 'Edit Branch'} onClose={() => setModal(null)}>
                    <FormField label="Branch Name"><input style={inputStyle} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Branch name" /></FormField>
                    <FormField label="Location"><input style={inputStyle} value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City / Address" /></FormField>
                    <FormField label="Is Warehouse?">
                        <select style={inputStyle} value={form.is_warehouse ? 'true' : 'false'} onChange={e => setForm({ ...form, is_warehouse: e.target.value === 'true' })}>
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </select>
                    </FormField>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button style={{ ...btnPrimary, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setModal(null)}>Cancel</button>
                        <button style={btnPrimary} onClick={save}>Save</button>
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
        { key: 'permissions', label: 'Permissions', render: r => <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{JSON.stringify(r.permissions)}</span> },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontWeight: 800 }}>Role Management</h4>
                <button style={btnPrimary} onClick={() => { setForm({ name: '', permissionsStr: '{}' }); setModal('add'); }}>+ Add Role</button>
            </div>
            <DataTable columns={columns} rows={items} onEdit={row => { setForm({ ...row, permissionsStr: JSON.stringify(row.permissions || {}) }); setModal({ edit: row }); }} onDelete={remove} />
            {modal && (
                <Modal title={modal === 'add' ? 'Add Role' : 'Edit Role'} onClose={() => setModal(null)}>
                    <FormField label="Role Name"><input style={inputStyle} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cashier" /></FormField>
                    <FormField label="Permissions (JSON)">
                        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'monospace' }}
                            value={form.permissionsStr || '{}'} onChange={e => setForm({ ...form, permissionsStr: e.target.value })} />
                    </FormField>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button style={{ ...btnPrimary, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setModal(null)}>Cancel</button>
                        <button style={btnPrimary} onClick={save}>Save</button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontWeight: 800 }}>Department Management</h4>
                <button style={btnPrimary} onClick={() => { setForm({ name: '' }); setModal('add'); }}>+ Add Department</button>
            </div>
            <DataTable columns={columns} rows={items} onEdit={row => { setForm(row); setModal({ edit: row }); }} onDelete={remove} />
            {modal && (
                <Modal title={modal === 'add' ? 'Add Department' : 'Edit Department'} onClose={() => setModal(null)}>
                    <FormField label="Department Name"><input style={inputStyle} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales" /></FormField>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button style={{ ...btnPrimary, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setModal(null)}>Cancel</button>
                        <button style={btnPrimary} onClick={save}>Save</button>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────────
const TABS = [
    { key: 'users', label: '👤 Users' },
    { key: 'branches', label: '🏢 Branches' },
    { key: 'roles', label: '🛡 Roles' },
    { key: 'departments', label: '🏷 Departments' },
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
                {activeTab === 'users'       && <UsersTab roles={roles} branches={branches} departments={departments} />}
                {activeTab === 'branches'    && <BranchesTab />}
                {activeTab === 'roles'       && <RolesTab />}
                {activeTab === 'departments' && <DepartmentsTab />}
            </div>
        </div>
    );
}
