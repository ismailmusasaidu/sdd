import { useEffect, useRef, useState } from 'react';
import {
  Calendar, Phone, Mail, MapPin, Clock, CheckCircle, XCircle,
  AlertCircle, ChevronDown, Search, Trash2, X, Send, MessageSquare,
  UserCheck, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  service_type: string;
  hiring_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  location: string;
  preferred_date: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  assigned_provider_name: string;
  assigned_provider_phone: string;
  assigned_provider_email: string;
  admin_notes: string;
}

interface CustomerMessage {
  id: string;
  booking_id: string;
  sender_role: 'admin' | 'customer';
  sender_id: string;
  message: string;
  read_by_customer: boolean;
  read_by_admin: boolean;
  created_at: string;
}

const STATUS_OPTIONS = ['new', 'contacted', 'confirmed', 'completed', 'cancelled'] as const;

const statusMeta: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new:       { label: 'New',       color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Phone },
  confirmed: { label: 'Confirmed', color: 'bg-sky-100 text-sky-800 border-sky-200',          icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200',    icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200',          icon: XCircle },
};

type View = 'list' | 'detail';

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState('');

  // Detail view
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<Booking | null>(null);

  // Provider info edit
  const [providerForm, setProviderForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [savingProvider, setSavingProvider] = useState(false);
  const [providerSaved, setProviderSaved] = useState(false);

  // Messaging
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminId(data.user.id);
    });
    fetchBookings();
  }, [filter]);

  useEffect(() => {
    if (bookings.length > 0) fetchUnreadCounts();
  }, [bookings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('service_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    const ids = bookings.map(b => b.id);
    if (!ids.length) return;
    const { data } = await supabase
      .from('customer_messages')
      .select('booking_id')
      .in('booking_id', ids)
      .eq('read_by_admin', false)
      .eq('sender_role', 'customer');
    const counts: Record<string, number> = {};
    (data || []).forEach(m => {
      counts[m.booking_id] = (counts[m.booking_id] || 0) + 1;
    });
    setUnreadCounts(counts);
  };

  const openDetail = async (booking: Booking) => {
    setSelected(booking);
    setProviderForm({
      name: booking.assigned_provider_name || '',
      phone: booking.assigned_provider_phone || '',
      email: booking.assigned_provider_email || '',
      notes: booking.admin_notes || '',
    });
    setView('detail');
    await loadMessages(booking.id);
    // Mark customer messages as read
    await supabase
      .from('customer_messages')
      .update({ read_by_admin: true })
      .eq('booking_id', booking.id)
      .eq('sender_role', 'customer');
    setUnreadCounts(prev => ({ ...prev, [booking.id]: 0 }));
  };

  const loadMessages = async (bookingId: string) => {
    const { data } = await supabase
      .from('customer_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const saveProviderInfo = async () => {
    if (!selected) return;
    setSavingProvider(true);
    const { error } = await supabase
      .from('service_bookings')
      .update({
        assigned_provider_name: providerForm.name,
        assigned_provider_phone: providerForm.phone,
        assigned_provider_email: providerForm.email,
        admin_notes: providerForm.notes,
      })
      .eq('id', selected.id);
    if (!error) {
      setSelected(prev => prev ? {
        ...prev,
        assigned_provider_name: providerForm.name,
        assigned_provider_phone: providerForm.phone,
        assigned_provider_email: providerForm.email,
        admin_notes: providerForm.notes,
      } : prev);
      setBookings(prev => prev.map(b => b.id === selected.id ? {
        ...b,
        assigned_provider_name: providerForm.name,
        assigned_provider_phone: providerForm.phone,
        assigned_provider_email: providerForm.email,
        admin_notes: providerForm.notes,
      } : b));
      setProviderSaved(true);
      setTimeout(() => setProviderSaved(false), 2500);
    }
    setSavingProvider(false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selected || !adminId) return;
    setSendingMsg(true);
    const { error } = await supabase.from('customer_messages').insert({
      booking_id: selected.id,
      sender_role: 'admin',
      sender_id: adminId,
      message: newMsg.trim(),
      read_by_customer: false,
      read_by_admin: true,
    });
    if (!error) {
      setNewMsg('');
      await loadMessages(selected.id);
    }
    setSendingMsg(false);
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Delete this booking? This cannot be undone.')) return;
    await supabase.from('service_bookings').delete().eq('id', id);
    setBookings(prev => prev.filter(b => b.id !== id));
    if (selected?.id === id) { setSelected(null); setView('list'); }
  };

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.customer_name.toLowerCase().includes(q) ||
      b.service_type.toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q) ||
      b.customer_phone.includes(q)
    );
  });

  const newCount = bookings.filter(b => b.status === 'new').length;
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const meta = statusMeta[selected.status] || statusMeta.new;
    const StatusIcon = meta.icon;

    return (
      <div className="space-y-6 max-w-5xl">
        {/* Back */}
        <button
          onClick={() => { setView('list'); setSelected(null); setMessages([]); }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Bookings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Booking info + Status + Provider info */}
          <div className="space-y-5">

            {/* Booking summary */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-green-600 text-white px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm opacity-75">Booking #{selected.id.slice(0, 8)}</p>
                    <h2 className="text-xl font-bold mt-1">{selected.service_type}</h2>
                    <p className="text-sm opacity-85 capitalize mt-0.5">{selected.hiring_type} hire</p>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border bg-white ${meta.color}`}>
                    <StatusIcon size={12} />{meta.label}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Customer</p>
                    <p className="font-semibold text-gray-900">{selected.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Phone</p>
                    <p className="font-semibold text-gray-900">{selected.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="font-semibold text-gray-900">{selected.customer_email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Location</p>
                    <p className="font-semibold text-gray-900">{selected.location}</p>
                  </div>
                  {selected.preferred_date && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Preferred Date</p>
                      <p className="font-semibold text-gray-900">{new Date(selected.preferred_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Submitted</p>
                    <p className="font-semibold text-gray-900">{new Date(selected.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {selected.description && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">{selected.description}</p>
                )}
              </div>
            </div>

            {/* Update status */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="font-bold text-gray-900 mb-3">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    disabled={selected.status === s || updatingId === selected.id}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 ${
                      selected.status === s
                        ? statusMeta[s].color + ' cursor-default'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400 hover:text-primary-600'
                    }`}
                  >
                    {statusMeta[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck size={18} className="text-primary-600" />
                <p className="font-bold text-gray-900">Assigned Provider Details</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Provider Name</label>
                  <input
                    type="text"
                    value={providerForm.name}
                    onChange={e => setProviderForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Provider full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={providerForm.phone}
                      onChange={e => setProviderForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={providerForm.email}
                      onChange={e => setProviderForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Admin Notes</label>
                  <textarea
                    value={providerForm.notes}
                    onChange={e => setProviderForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Internal notes visible to customer..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
                  />
                </div>
                <button
                  onClick={saveProviderInfo}
                  disabled={savingProvider}
                  className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                    providerSaved
                      ? 'bg-green-600 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60'
                  }`}
                >
                  {savingProvider ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : providerSaved ? (
                    <><CheckCircle size={15} /> Saved!</>
                  ) : 'Save Provider Details'}
                </button>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => deleteBooking(selected.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} /> Delete Booking
            </button>
          </div>

          {/* Right: Chat */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px]">
            <div className="bg-gradient-to-r from-primary-600 to-green-600 text-white px-5 py-4 rounded-t-xl">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} />
                <div>
                  <p className="font-bold">Message Customer</p>
                  <p className="text-xs opacity-75">{selected.customer_name}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                    <p className="text-gray-400 text-xs mt-1">Start the conversation</p>
                  </div>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender_role === 'admin'
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender_role === 'admin' ? 'text-primary-200' : 'text-gray-400'}`}>
                        {msg.sender_role === 'admin' ? 'You' : selected.customer_name} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.sender_role === 'admin' && (
                          <span className="ml-1">{msg.read_by_customer ? ' · Seen' : ''}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary-500 bg-white"
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMsg || !newMsg.trim()}
                  className="bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Bookings</h1>
          <p className="text-gray-600 mt-1">Manage incoming booking requests from customers</p>
        </div>
        <div className="flex gap-2">
          {newCount > 0 && (
            <div className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {newCount} new
            </div>
          )}
          {totalUnread > 0 && (
            <div className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow">
              <MessageSquare size={14} />
              {totalUnread} unread
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map(s => {
          const meta = statusMeta[s];
          const Icon = meta.icon;
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? 'all' : s)}
              className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                filter === s ? meta.color + ' shadow-md' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon size={18} className="mb-2 opacity-70" />
              <p className="text-2xl font-bold">{counts[s] || 0}</p>
              <p className="text-xs font-medium mt-0.5 opacity-70">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search & filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, service, location or phone..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4" />
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No bookings found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(booking => {
              const meta = statusMeta[booking.status] || statusMeta.new;
              const StatusIcon = meta.icon;
              const unread = unreadCounts[booking.id] || 0;
              return (
                <button
                  key={booking.id}
                  onClick={() => openDetail(booking)}
                  className={`w-full text-left p-5 hover:bg-gray-50 transition-colors flex items-center gap-4 ${
                    booking.status === 'new' ? 'border-l-4 border-l-primary-500' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">{booking.customer_name}</p>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.color}`}>
                        <StatusIcon size={10} />{meta.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
                        {booking.hiring_type}
                      </span>
                      {unread > 0 && (
                        <span className="flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          <MessageSquare size={10} /> {unread} new
                        </span>
                      )}
                      {booking.assigned_provider_name && (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          <UserCheck size={10} />{booking.assigned_provider_name}
                        </span>
                      )}
                    </div>
                    <p className="text-primary-700 font-semibold text-sm">{booking.service_type}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Phone size={10} />{booking.customer_phone}</span>
                      <span className="flex items-center gap-1"><MapPin size={10} />{booking.location}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{new Date(booking.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <div
                      onClick={e => e.stopPropagation()}
                    >
                      <select
                        value={booking.status}
                        onChange={e => updateStatus(booking.id, e.target.value)}
                        disabled={updatingId === booking.id}
                        className="appearance-none pl-3 pr-6 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none bg-white disabled:opacity-60"
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}
                      </select>
                    </div>
                    <span className="text-gray-400 flex items-center gap-0.5 text-xs">
                      View details <ChevronRight size={12} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
