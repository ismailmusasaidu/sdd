import { useEffect, useRef, useState } from 'react';
import {
  Phone, MapPin, Clock, CheckCircle, XCircle, ChevronDown,
  Search, X, Send, MessageSquare, ChevronRight, ArrowLeft,
  ListChecks, Package, Users, Calendar, Filter, Building2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessBooking {
  id: string;
  business_id: string;
  batch_id: string | null;
  service_type: string;
  hiring_type: string;
  workers_needed: number;
  location: string;
  preferred_date: string | null;
  description: string | null;
  status: string;
  admin_notes: string;
  created_at: string;
}

interface BusinessProfile {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
}

interface BusinessMessage {
  id: string;
  booking_id: string;
  sender_role: 'admin' | 'business';
  sender_id: string;
  message: string;
  read_by_business: boolean;
  read_by_admin: boolean;
  created_at: string;
}

interface BookingBatch {
  batch_id: string | null;
  items: BusinessBooking[];
  created_at: string;
  businessProfile?: BusinessProfile;
}

const STATUS_OPTIONS = ['new', 'contacted', 'confirmed', 'completed', 'cancelled'] as const;

const statusMeta: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new:       { label: 'New',       color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Phone },
  confirmed: { label: 'Confirmed', color: 'bg-sky-100 text-sky-800 border-sky-200',          icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200',    icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200',          icon: XCircle },
};

type View = 'list' | 'chat';

function groupIntoBatches(bookings: BusinessBooking[], profiles: Map<string, BusinessProfile>): BookingBatch[] {
  const map = new Map<string, BusinessBooking[]>();
  bookings.forEach(b => {
    const key = b.batch_id ?? b.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  });
  return Array.from(map.entries())
    .map(([, items]) => ({
      batch_id: items[0].batch_id,
      items,
      created_at: items[0].created_at,
      businessProfile: profiles.get(items[0].business_id),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function BusinessBookingsManagement() {
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  const [profiles, setProfiles] = useState<Map<string, BusinessProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState('');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  // Messaging
  const [view, setView] = useState<View>('list');
  const [selectedBooking, setSelectedBooking] = useState<BusinessBooking | null>(null);
  const [messages, setMessages] = useState<BusinessMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminId(data.user.id);
    });
    fetchBookings();
    return () => { realtimeRef.current?.unsubscribe(); };
  }, [filter]);

  useEffect(() => {
    if (bookings.length > 0) fetchUnreadCounts();
  }, [bookings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchBookings = async () => {
    setLoading(true);
    setFetchError('');
    try {
      let query = supabase
        .from('business_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error } = await query;
      if (error) throw error;
      const list = data || [];
      setBookings(list);

      // Fetch business profiles for all unique business_ids
      const ids = [...new Set(list.map(b => b.business_id))];
      if (ids.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('business_profiles')
          .select('id, company_name, contact_name, email, phone')
          .in('id', ids);
        if (profileError) throw profileError;
        const map = new Map<string, BusinessProfile>();
        (profileData || []).forEach(p => map.set(p.id, p));
        setProfiles(map);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    const ids = bookings.map(b => b.id);
    if (!ids.length) return;
    const { data } = await supabase
      .from('business_messages')
      .select('booking_id')
      .in('booking_id', ids)
      .eq('read_by_admin', false)
      .eq('sender_role', 'business');
    const counts: Record<string, number> = {};
    (data || []).forEach(m => { counts[m.booking_id] = (counts[m.booking_id] || 0) + 1; });
    setUnreadCounts(counts);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await supabase.from('business_bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setUpdatingId(null);
  };

  const openChat = async (booking: BusinessBooking) => {
    setSelectedBooking(booking);
    await loadMessages(booking.id);
    // Mark business messages as read by admin
    await supabase
      .from('business_messages')
      .update({ read_by_admin: true })
      .eq('booking_id', booking.id)
      .eq('sender_role', 'business');
    setUnreadCounts(prev => ({ ...prev, [booking.id]: 0 }));
    setView('chat');
    subscribeToMessages(booking.id);
  };

  const loadMessages = async (bookingId: string) => {
    const { data } = await supabase
      .from('business_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const subscribeToMessages = (bookingId: string) => {
    realtimeRef.current?.unsubscribe();
    realtimeRef.current = supabase
      .channel(`admin_business_messages:${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'business_messages', filter: `booking_id=eq.${bookingId}` },
        payload => {
          const msg = payload.new as BusinessMessage;
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_role === 'business') {
            supabase.from('business_messages').update({ read_by_admin: true }).eq('id', msg.id);
            setUnreadCounts(prev => ({ ...prev, [bookingId]: 0 }));
          }
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedBooking || !adminId) return;
    setSendingMsg(true);
    const msgText = newMsg.trim();
    setNewMsg('');
    const { error } = await supabase.from('business_messages').insert({
      booking_id: selectedBooking.id,
      sender_role: 'admin',
      sender_id: adminId,
      message: msgText,
      read_by_business: false,
      read_by_admin: true,
    });
    if (error) setNewMsg(msgText);
    setSendingMsg(false);
  };

  const closeChat = () => {
    setView('list');
    setSelectedBooking(null);
    realtimeRef.current?.unsubscribe();
  };

  const batches = groupIntoBatches(bookings, profiles);

  const filteredBatches = batches.filter(batch => {
    const q = search.toLowerCase();
    if (!q) return true;
    const bp = batch.businessProfile;
    return (
      batch.items.some(b =>
        b.service_type.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q)
      ) ||
      bp?.company_name.toLowerCase().includes(q) ||
      bp?.contact_name.toLowerCase().includes(q) ||
      bp?.email.toLowerCase().includes(q)
    );
  });

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // ── Chat view ──
  if (view === 'chat' && selectedBooking) {
    const bp = profiles.get(selectedBooking.business_id);
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Chat header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-5 py-4 rounded-t-xl flex items-center gap-3">
            <button onClick={closeChat} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">{selectedBooking.service_type}</p>
              <p className="text-xs opacity-75 truncate">
                {bp?.company_name} · {selectedBooking.location}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Inline status update */}
              <div className="relative">
                <select
                  value={selectedBooking.status}
                  onChange={e => {
                    updateStatus(selectedBooking.id, e.target.value);
                    setSelectedBooking(prev => prev ? { ...prev, status: e.target.value } : prev);
                  }}
                  className="appearance-none bg-white/20 border border-white/30 text-white text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg focus:outline-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s} className="text-gray-900 bg-white capitalize">{s}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-2 text-white/70 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Business info bar */}
          {bp && (
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
              <span className="flex items-center gap-1 font-semibold text-gray-800"><Building2 size={12} />{bp.company_name}</span>
              <span className="flex items-center gap-1"><Phone size={12} />{bp.phone}</span>
              <span className="flex items-center gap-1">{bp.email}</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start the conversation with this business</p>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender_role === 'admin'
                      ? 'bg-slate-700 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_role === 'admin' ? 'text-slate-300' : 'text-gray-400'}`}>
                      {msg.sender_role === 'admin' ? 'You (Admin)' : bp?.company_name || 'Business'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_role === 'admin' && msg.read_by_business && <span className="ml-1 opacity-75">· Seen</span>}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={`Message ${bp?.company_name || 'business'}...`}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary-500 bg-white"
              />
              <button onClick={sendMessage} disabled={sendingMsg || !newMsg.trim()}
                className="bg-slate-700 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Business Bookings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {batches.length} submission{batches.length !== 1 ? 's' : ''}
            {totalUnread > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search business, service, location…"
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white w-full sm:w-64"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white appearance-none">
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700 flex items-center gap-3">
          <span className="font-semibold">Error loading bookings:</span> {fetchError}
          <button onClick={fetchBookings} className="ml-auto text-red-600 underline text-xs">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {batches.length === 0 ? 'No business bookings yet' : 'No bookings match your search'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBatches.map(batch => {
            const batchKey = batch.batch_id ?? batch.items[0].id;
            const isExpanded = expandedBatch === batchKey;
            const isBatch = batch.items.length > 1;
            const first = batch.items[0];
            const bp = batch.businessProfile;
            const batchUnread = batch.items.reduce((sum, b) => sum + (unreadCounts[b.id] || 0), 0);

            const overallStatus = batch.items.every(i => i.status === 'completed') ? 'completed'
              : batch.items.some(i => i.status === 'cancelled') ? 'cancelled'
              : batch.items.some(i => i.status === 'confirmed') ? 'confirmed'
              : batch.items.some(i => i.status === 'contacted') ? 'contacted' : 'new';

            const meta = statusMeta[overallStatus] || statusMeta.new;
            const StatusIcon = meta.icon;

            return (
              <div key={batchKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Batch header */}
                <div className="px-5 py-4 flex items-start gap-3">
                  <button
                    onClick={() => setExpandedBatch(isExpanded ? null : batchKey)}
                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${isBatch ? 'bg-primary-50' : 'bg-gray-50'}`}>
                      {isBatch ? <ListChecks size={18} className="text-primary-600" /> : <Package size={18} className="text-gray-500" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">
                          {isBatch ? `${batch.items.length} services` : first.service_type}
                        </p>
                        {isBatch && <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">Multi-service</span>}
                        {batchUnread > 0 && (
                          <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            <MessageSquare size={10} />{batchUnread} new
                          </span>
                        )}
                      </div>
                      {bp && (
                        <p className="text-xs font-semibold text-gray-700 mt-0.5 flex items-center gap-1">
                          <Building2 size={11} className="text-gray-400" />{bp.company_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} />{first.location}
                        {isBatch && <span className="text-gray-400 ml-1">· {batch.items.map(i => i.service_type).join(', ')}</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(batch.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
                      <StatusIcon size={11} />{meta.label}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      onClick={() => setExpandedBatch(isExpanded ? null : batchKey)} />
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-slate-50 px-5 py-4 space-y-3">
                    {/* Business contact row */}
                    {bp && (
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Business Contact</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-sm text-gray-700">
                          <span className="font-semibold">{bp.company_name}</span>
                          <span className="flex items-center gap-1 text-xs"><Phone size={12} className="text-gray-400" />{bp.phone}</span>
                          <span className="text-xs text-gray-500">{bp.email}</span>
                        </div>
                      </div>
                    )}

                    {/* Individual booking cards */}
                    {batch.items.map((b, idx) => {
                      const itemMeta = statusMeta[b.status] || statusMeta.new;
                      const ItemIcon = itemMeta.icon;
                      const itemUnread = unreadCounts[b.id] || 0;
                      return (
                        <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">
                                {isBatch && <span className="text-gray-400 font-normal mr-1">#{idx + 1}</span>}
                                {b.service_type}
                              </p>
                              <p className="text-xs text-gray-500 capitalize flex items-center gap-2 mt-0.5">
                                <span>{b.hiring_type}</span>
                                <span className="flex items-center gap-1"><Users size={11} />{b.workers_needed} worker{b.workers_needed > 1 ? 's' : ''}</span>
                                {b.preferred_date && <span className="flex items-center gap-1"><Calendar size={11} />{new Date(b.preferred_date).toLocaleDateString()}</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Per-item status selector */}
                              <div className="relative">
                                <select
                                  value={b.status}
                                  onChange={e => updateStatus(b.id, e.target.value)}
                                  disabled={updatingId === b.id}
                                  className="appearance-none text-xs border border-gray-300 rounded-lg px-3 py-1.5 pr-7 bg-white focus:outline-none focus:border-primary-500 disabled:opacity-50 cursor-pointer"
                                >
                                  {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s} className="capitalize">{s}</option>
                                  ))}
                                </select>
                                <ChevronDown size={11} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
                              </div>
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${itemMeta.color}`}>
                                <ItemIcon size={10} />{itemMeta.label}
                              </span>
                            </div>
                          </div>

                          {b.description && (
                            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-2 italic">{b.description}</p>
                          )}

                          {/* Message button */}
                          <button
                            onClick={() => openChat(b)}
                            className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 text-xs font-semibold transition-colors"
                          >
                            <MessageSquare size={13} />
                            Message Business
                            {itemUnread > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{itemUnread} new</span>
                            )}
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
