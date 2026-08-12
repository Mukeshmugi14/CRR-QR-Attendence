'use client';

import { useState, useTransition } from 'react';
import { 
  toggleMemberActive, 
  revokeQrCode, 
  reissueQrCode, 
  createMember, 
  updateMemberDetails 
} from '@/app/admin/members/actions';
import { 
  Search, 
  UserPlus, 
  Edit2, 
  ShieldAlert, 
  QrCode, 
  RefreshCw, 
  Check, 
  X,
  CreditCard,
  Mail,
  Phone,
  Settings,
  MoreVertical,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface Member {
  id: string;
  member_code: string;
  full_name: string;
  position: string;
  email: string | null;
  phone: string | null;
  member_qr_token: string;
  qr_status: string;
  is_active: boolean;
}

interface MembersTableProps {
  initialMembers: Member[];
}

export function MembersTable({ initialMembers }: MembersTableProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals / Editors state
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  // Forms state
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Positions for filter dropdown
  const uniquePositions = Array.from(new Set(initialMembers.map(m => m.position))).sort();

  // Filtered members list
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.full_name.toLowerCase().includes(search.toLowerCase()) || 
      member.member_code.toLowerCase().includes(search.toLowerCase());
    
    const matchesPosition = positionFilter === 'All' || member.position === positionFilter;
    
    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Active' && member.is_active) || 
      (statusFilter === 'Inactive' && !member.is_active) ||
      (statusFilter === 'QR Active' && member.qr_status === 'active') ||
      (statusFilter === 'QR Revoked' && member.qr_status === 'revoked');

    return matchesSearch && matchesPosition && matchesStatus;
  });

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const res = await toggleMemberActive(id, currentStatus);
    if (res.success) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
    }
  };

  const handleRevokeQr = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this member\'s QR code? It will immediately invalidate their current ID card!')) return;
    const res = await revokeQrCode(id);
    if (res.success) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, qr_status: 'revoked' } : m));
    }
  };

  const handleReissueQr = async (id: string) => {
    if (!confirm('Reissuing will generate a brand new QR token. The old ID card QR will stop working. Proceed?')) return;
    const res = await reissueQrCode(id);
    if (res.success && res.newToken) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, qr_status: 'active', member_qr_token: res.newToken } : m));
      alert('New QR code generated successfully. Please print a new ID card for this member.');
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const details = { fullName, position, email, phone };

    if (editingMember) {
      const res = await updateMemberDetails(editingMember.id, details);
      if (res.success) {
        setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, full_name: fullName, position, email, phone } : m));
        setMessage({ type: 'success', text: 'Member updated successfully.' });
        setTimeout(() => {
          setEditingMember(null);
          clearForm();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update member.' });
      }
    } else {
      const res = await createMember(details);
      if (res.success) {
        setMessage({ type: 'success', text: 'Member created successfully.' });
        // Full reload or refetch is easier to ensure accurate next member_code.
        // For simplicity, reload window or refresh transitions.
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to create member.' });
      }
    }
    setLoading(false);
  };

  const startEdit = (member: Member) => {
    setEditingMember(member);
    setFullName(member.full_name);
    setPosition(member.position);
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setIsAdding(false);
  };

  const clearForm = () => {
    setFullName('');
    setPosition('');
    setEmail('');
    setPhone('');
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:min-w-[240px] sm:flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name or member code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Positions</option>
              {uniquePositions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="QR Active">QR Active</option>
              <option value="QR Revoked">QR Revoked</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center shrink-0">
          <Link
            href="/admin/members/import"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
          >
            Import Excel
          </Link>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingMember(null);
              clearForm();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-95 shadow-md shadow-indigo-600/10"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Editor Modal Drawer */}
      {(isAdding || editingMember) && (
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-indigo-500/20 max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-200">
              {editingMember ? `Edit Member: ${editingMember.member_code}` : 'Add New Member'}
            </h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingMember(null);
                clearForm();
              }}
              className="p-1 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm mb-4 ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSaveMember} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. RTR. MUKESH"
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Club Position</label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. DEPUTY SERGEANT AT ARMS"
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mukesh@rotaract.org"
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingMember(null);
                  clearForm();
                }}
                className="px-4 py-2 rounded-xl border border-slate-800 text-sm font-semibold hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members list — stacked cards on phones, full table from md up */}
      <div className="md:hidden space-y-3">
        {filteredMembers.map((member) => (
          <div key={member.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-100 break-words">{member.full_name}</h4>
                <p className="text-xs font-medium text-indigo-300 mt-0.5 break-words">{member.position}</p>
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-300 bg-slate-950 border border-slate-850 rounded px-1.5 py-1 shrink-0">
                {member.member_code}
              </span>
            </div>

            {(member.email || member.phone) && (
              <div className="text-xs text-slate-400 space-y-1">
                {member.email && (
                  <div className="flex items-center gap-1.5 break-all">
                    <Mail className="h-3 w-3 shrink-0" /> {member.email}
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 shrink-0" /> {member.phone}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                member.qr_status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                QR {member.qr_status}
              </span>
              <button
                onClick={() => handleToggleActive(member.id, member.is_active)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
                  member.is_active
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                <Activity className="h-3 w-3 shrink-0" />
                {member.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-850">
              <button
                onClick={() => startEdit(member)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs font-semibold text-slate-300 active:bg-slate-800"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </button>

              {member.qr_status === 'active' ? (
                <button
                  onClick={() => handleRevokeQr(member.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20 text-xs font-semibold text-red-400 active:bg-red-500/15"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Revoke
                </button>
              ) : (
                <button
                  onClick={() => handleReissueQr(member.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs font-semibold text-emerald-400 active:bg-emerald-500/15"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reissue
                </button>
              )}

              <Link
                href={`/admin/id-cards?member=${member.id}`}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs font-semibold text-indigo-400 active:bg-slate-800"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Card
              </Link>
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-sm">
            No members match search and filter criteria.
          </div>
        )}
      </div>

      <div className="hidden md:block p-4 rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">QR Token Status</th>
                <th className="py-3 px-4">Active Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className="border-b border-slate-850 hover:bg-slate-850/10 text-slate-300">
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-200">{member.member_code}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-100">{member.full_name}</td>
                  <td className="py-3.5 px-4 text-xs font-medium text-indigo-300">{member.position}</td>
                  <td className="py-3.5 px-4 text-xs space-y-0.5 max-w-[180px] truncate">
                    {member.email && <div className="flex items-center gap-1.5 text-slate-400"><Mail className="h-3 w-3" /> {member.email}</div>}
                    {member.phone && <div className="flex items-center gap-1.5 text-slate-400"><Phone className="h-3 w-3" /> {member.phone}</div>}
                    {!member.email && !member.phone && <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                      member.qr_status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {member.qr_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleActive(member.id, member.is_active)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                        member.is_active
                          ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-500 border border-slate-700'
                      }`}
                    >
                      <Activity className="h-3 w-3 shrink-0" />
                      {member.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => startEdit(member)}
                        title="Edit Details"
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border border-slate-850"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {member.qr_status === 'active' ? (
                        <button
                          onClick={() => handleRevokeQr(member.id)}
                          title="Revoke QR Code"
                          className="p-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/15 text-red-400 border border-red-500/20 transition-colors"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReissueQr(member.id)}
                          title="Generate Replacement QR"
                          className="p-1.5 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 transition-colors"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <Link
                        href={`/admin/id-cards?member=${member.id}`}
                        title="Generate ID Card"
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-850 transition-colors"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                    No members match search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
