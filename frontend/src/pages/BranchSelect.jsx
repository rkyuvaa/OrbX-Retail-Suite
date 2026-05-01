import React, { useState, useEffect } from 'react';
import { Building, ArrowRight, Package, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = `http://${window.location.hostname}:5000`;

export default function BranchSelect() {
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    // Fetch user's allowed branches from the backend to be sure
    fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.json())
    .then(data => {
      // If superadmin, they might need all branches, but usually we just show what's in allowed_branches
      // or fetch all branches if they are superadmin.
      if (data.is_superadmin) {
        fetch(`${API_URL}/api/branches`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(r => r.json())
        .then(allBranches => {
          setBranches(allBranches);
          setLoading(false);
        });
      } else {
        // Filter branches based on allowed_branches IDs
        fetch(`${API_URL}/api/branches`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(r => r.json())
        .then(allBranches => {
          const allowedIds = data.allowed_branches || [];
          const filtered = allBranches.filter(b => allowedIds.includes(b.id));
          setBranches(filtered);
          setLoading(false);
        });
      }
    })
    .catch(err => {
      console.error(err);
      toast.error('Failed to load branches');
      setLoading(false);
    });
  }, []);

  const handleSelect = (branch) => {
    localStorage.setItem('activeBranch', JSON.stringify(branch));
    toast.success(`Switched to ${branch.name}`);
    window.location.href = '/pos'; // Default landing page after branch select
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeBranch');
    window.location.href = '/login';
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Package size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tighter">ORBX RETAIL</h1>
            <p className="text-xs font-bold text-muted uppercase tracking-widest">Select Work Branch</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-border p-8 animate-slide-up">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black mb-1">Welcome, {user?.name}</h2>
              <p className="text-sm text-muted font-medium">Please select a branch to continue</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl">
                <Building className="mx-auto text-muted mb-3" size={32} />
                <p className="text-sm font-bold text-muted">No branches assigned to your account</p>
                <p className="text-xs text-muted mt-1">Please contact your administrator</p>
              </div>
            ) : branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch)}
                className="flex items-center justify-between p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/[0.02] transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">{branch.name}</h3>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{branch.location || 'Retail Store'}</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-center mt-8 text-xs font-bold text-muted uppercase tracking-widest">
          Signed in as {user?.email}
        </p>
      </div>
    </div>
  );
}
