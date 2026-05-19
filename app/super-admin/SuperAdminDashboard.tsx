"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, PackageSearch, FileWarning, Pencil, Search, Clock, Save, X, ExternalLink, Activity, Shield } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminDashboard({ role }: { role: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'timeline' | 'claims'>('users');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 lg:p-12 font-sans selection:bg-red-500 selection:text-white border-8 border-slate-200 flex flex-col h-screen overflow-hidden transition-colors">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-red-600 flex items-center justify-center shadow-md rounded-md">
            <Shield className="text-white" size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-serif italic text-slate-900 tracking-wide">Supreme Command Center</h1>
            <p className="text-slate-500 text-[10px] tracking-[0.2em] uppercase mt-0.5 font-bold">Role: {role}</p>
          </div>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-md p-1 items-center shadow-sm">
          <TabButton id="users" icon={<Users size={16} />} label="Users" activeTab={activeTab} setActive={setActiveTab} />
          <TabButton id="timeline" icon={<Clock size={16} />} label="Time Overrides" activeTab={activeTab} setActive={setActiveTab} />
          <TabButton id="claims" icon={<FileWarning size={16} />} label="Claims" activeTab={activeTab} setActive={setActiveTab} />
          <div className="h-4 w-px bg-slate-200 mx-2"></div>
          <Link href="/receiver" className="text-slate-500 hover:text-red-600 text-[10px] uppercase font-bold tracking-widest px-2 transition-colors">Receiver</Link>
          <Link href="/inspector" className="text-slate-500 hover:text-red-600 text-[10px] uppercase font-bold tracking-widest px-2 transition-colors">Inspector</Link>
          <div className="h-4 w-px bg-slate-200 mx-2"></div>
          <button 
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch (e) {}
              router.push('/login');
            }}
            className="text-red-600 hover:text-red-700 text-[10px] uppercase font-bold tracking-widest px-2 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-white border border-slate-200 shadow-xl flex flex-col rounded-md overflow-hidden">
          {activeTab === 'users' && <UsersTab role={role} />}
          {activeTab === 'timeline' && <TimelineTab role={role} />}
          {activeTab === 'claims' && <ClaimsTab />}
        </div>
      </main>

    </div>
  );
}

// --- TABS COMPONENTS ---

function TabButton({ id, icon, label, activeTab, setActive }: any) {
  const isActive = activeTab === id;
  return (
    <button 
      onClick={() => setActive(id)}
      className={`flex items-center space-x-2 px-6 py-2.5 text-xs font-medium tracking-wider uppercase transition-all duration-300 ${
        isActive ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm rounded' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent rounded'
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  );
}

function UsersTab({ role }: { role: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('ADMIN');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availableRoles = ['ADMIN', 'RECEIVER', 'INSPECTOR'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { queueMicrotask(() => { fetchUsers(); }); }, []);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role: targetRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('User created successfully.');
      setEmail(''); setName('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to completely remove access for ${userEmail}?`)) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('User deleted successfully.');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full p-8 space-y-8 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-xl font-light text-slate-900 uppercase tracking-widest">User Management</h2>
           <p className="text-slate-500 text-xs tracking-wider mt-1 font-medium">Manage personnel access and roles globally.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 border border-slate-200 bg-slate-50 p-6 h-fit rounded-md shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-red-600 mb-6">Authorize Personnel</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all rounded" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name (Optional)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} 
                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all rounded" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Assigned Role</label>
              <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all rounded">
                {availableRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            {error && <p className="text-xs text-red-600 mt-2 font-medium">{error}</p>}
            {success && <p className="text-xs text-green-600 dark:text-[#34A853] mt-2 font-medium">{success}</p>}
            <button type="submit" className="w-full mt-4 bg-white border border-slate-300 hover:border-red-500 hover:text-red-600 hover:bg-red-50 text-slate-700 px-4 py-3 text-xs uppercase tracking-widest transition-all font-semibold rounded">
              Grant Access
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 border border-slate-200 bg-white overflow-hidden flex flex-col rounded-md shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-700">Active Personnel Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium text-right">Items Proc.</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-xs">Loading directory...</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-800 font-medium">{user.email}</td>
                    <td className="px-6 py-4 font-medium">{user.email.split('@')[0]}</td>
                    <td className="px-6 py-4">
                      <span className="bg-red-50 border border-red-100 px-2 py-1 text-[10px] tracking-wide uppercase text-red-600 font-bold rounded-sm">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs">{user.itemsProcessed}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs">
                      {user.role !== 'SUPER_ACCESS' && (
                        <button 
                          onClick={() => handleDelete(user.id, user.email)} 
                          className="text-red-500 hover:text-red-700 uppercase font-bold tracking-widest text-[10px]"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-xs">No active personnel.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ role }: { role: string }) {
  const [awb, setAwb] = useState('');
  const [manifest, setManifest] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [editModal, setEditModal] = useState<any>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  
  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (!awb.trim()) return;
    setLoading(true); setManifest(null); setError('');
    try {
      const res = await fetch(`/api/manifest/${awb.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setManifest(data.manifest);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (recordId: string, recordType: string, currentVal: string) => {
    const d = new Date(currentVal);
    // extract YYYY-MM-DD
    setEditDate(d.toISOString().substring(0, 10));
    // extract HH:MM string in 24hr format local time
    setEditTime(d.toTimeString().substring(0, 5));
    setEditModal({ recordId, recordType });
  };

  const handleUpdateTimestamp = async () => {
    try {
      const dt = new Date(`${editDate}T${editTime}:00`);
      const res = await fetch('/api/manifest/timestamp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recordId: editModal.recordId, 
          recordType: editModal.recordType, 
          newTimestamp: dt.toISOString() 
        })
      });
      if (res.ok) {
        setEditModal(null);
        // re-fetch
        handleSearch({ preventDefault: () => {} });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update');
      }
    } catch(err) {
      alert('Error updating timestamp');
    }
  };

  // Compile chronologically
  let events: any[] = [];
  if (manifest) {
    if (manifest.expectedDate) events.push({ type: 'Manifest_Expected', id: manifest.id, time: manifest.expectedDate, title: 'Expected from Marketplace' });
    if (manifest.receivedAt) events.push({ type: 'Manifest_Received', id: manifest.id, time: manifest.receivedAt, title: 'Received at Dock' });
    manifest.handshakes.forEach((h: any) => events.push({ type: 'Handshake', id: h.id, time: h.timestamp, title: `Handshake: ${h.type.replace(/_/g, ' ')}` }));
    const i = manifest.inspection;
    if (i) events.push({ type: 'Inspection', id: i.id, time: i.completedAt, title: `Inspected - Missing: ${i.isMissingItems}` });
    manifest.returnItems?.forEach((d: any) => events.push({ type: 'ReturnItem', id: d.id, time: new Date().toISOString(), title: `Return Item: ${d.sku} - ${d.condition}` }));
    events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-8 border-b border-slate-200 shrink-0 bg-slate-50">
        <h2 className="text-xl font-light text-slate-900 uppercase tracking-widest mb-4">Package Timeline</h2>
        <form onSubmit={handleSearch} className="flex max-w-xl">
          <div className="flex-1 flex bg-white border border-slate-300 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400 transition-all rounded-l">
            <div className="pl-4 flex items-center justify-center text-slate-400"><Search size={16} /></div>
            <input 
              type="text" 
              placeholder="Scan or enter Tracking AWB..." 
              value={awb} onChange={e => setAwb(e.target.value)}
              className="w-full bg-transparent border-none text-slate-800 px-4 py-3 text-sm focus:outline-none font-mono placeholder-slate-400" 
            />
          </div>
          <button type="submit" disabled={loading} className="px-8 bg-slate-100 border-y border-r border-slate-300 hover:bg-red-500 hover:text-white text-slate-600 transition-colors uppercase tracking-widest text-[11px] font-bold rounded-r">
            Track
          </button>
        </form>
        {error && <p className="text-xs text-red-600 mt-3 font-medium">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
        {loading ? (
          <div className="text-center text-slate-500 text-xs uppercase tracking-widest font-medium">Searching records...</div>
        ) : manifest ? (
          <div className="max-w-2xl mx-auto py-4">
            <div className="mb-12 flex justify-between items-end border-b border-slate-200 pb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Marketplace / Order</p>
                <p className="text-lg text-slate-800 font-medium">{manifest.marketplace} <span className="text-slate-300 mx-2">/</span> <span className="font-mono text-sm text-slate-600">{manifest.orderId}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                <p className="text-red-600 text-xs tracking-wider uppercase font-bold">{manifest.status.replace(/_/g, ' ')}</p>
              </div>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-4 space-y-12 pb-12">
              {events.map((ev, i) => (
                <div key={i} className="relative pl-8 group">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-white border-2 border-red-500 rounded-full shadow-sm group-hover:bg-red-50 transition-all"></div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{ev.title}</h4>
                  <div className="flex items-center space-x-3 mt-1.5">
                    <p className="text-xs font-mono text-slate-500">{new Date(ev.time).toLocaleString()}</p>
                    <button onClick={() => openEditor(ev.id, ev.type, ev.time)} className="p-1 px-3 bg-white border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all text-[10px] uppercase tracking-widest font-bold flex items-center space-x-1 rounded-sm shadow-sm" title="Amend Timestamp">
                      <Pencil size={10} /> <span>Override</span>
                    </button>
                  </div>
                </div>
              ))}
              {events.length === 0 && <p className="pl-8 text-xs text-slate-500 font-medium">No history recorded.</p>}
            </div>
          </div>
        ) : (
          !error && <div className="text-center text-slate-400 text-xs uppercase tracking-widest h-full flex items-center justify-center font-bold">Awaiting query parameters</div>
        )}
      </div>

      {editModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white border border-slate-200 p-8 w-[400px] shadow-2xl rounded-md">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-red-600">Amend Timestamp</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-800"><X size={16} /></button>
            </div>
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-6 leading-relaxed">
              WARNING: Manually mutating timestamps alters the immutable timeline. This action is logged.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date</label>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 px-4 py-2 text-sm focus:border-red-500 outline-none rounded" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Time (24H)</label>
                <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 px-4 py-2 text-sm focus:border-red-500 outline-none rounded" />
              </div>
              <button onClick={handleUpdateTimestamp} className="w-full mt-4 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 px-4 py-3 text-xs uppercase tracking-widest font-bold transition-colors flex justify-center items-center space-x-2 rounded">
                <Save size={14} /> <span>Execute Override</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClaimsTab() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/claims');
      const data = await res.json();
      if (res.ok) setClaims(data.claims);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { queueMicrotask(() => { fetchClaims(); }); }, []);

  const handleResolve = async (id: string) => {
    if (!confirm('Mark claim as resolved?')) return;
    try {
      const res = await fetch('/api/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifestId: id })
      });
      if (res.ok) fetchClaims();
    } catch(err) {
      alert('Error updating claim');
    }
  };

  return (
    <div className="flex flex-col h-full p-8 space-y-6 overflow-hidden">
      <div className="shrink-0 flex justify-between items-end border-b border-slate-200 pb-4">
         <div>
            <h2 className="text-xl font-light text-slate-900 uppercase tracking-widest">Claims Staging</h2>
            <p className="text-slate-500 text-xs tracking-wider mt-1 font-medium">Pending marketplace reimbursements.</p>
         </div>
      </div>

      <div className="flex-1 overflow-x-auto bg-white border border-slate-200 rounded-md shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Tracking AWB</th>
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Condition Filter</th>
              <th className="px-6 py-4 font-medium">Evidence Data</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-xs">Loading items...</td></tr>
            ) : claims.map((c: any) => {
              const inspection = c.inspection;
              const cond = inspection?.isMissingItems ? 'MISSING ITEMS' : 'INSPECTED';
              const ev = inspection?.evidenceUrl;
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-800 font-medium">{c.trackingAwb}</td>
                  <td className="px-6 py-4 font-mono text-[11px]">{c.orderId}</td>
                  <td className="px-6 py-4 text-xs font-bold text-red-500">{cond}</td>
                  <td className="px-6 py-4">
                    {ev ? (
                      <a href={ev} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs border border-red-200 px-2 py-1 bg-white rounded-sm transition-colors">
                        <span>View Artifact</span> <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">None attached</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleResolve(c.id)} className="text-[10px] uppercase font-bold tracking-widest text-green-600 hover:text-green-700 transition-colors">
                      Mark Resolved
                    </button>
                  </td>
                </tr>
              )
            })}
            {!loading && claims.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-xs">No pending claims.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
