import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, CalendarCheck, PlusCircle, User, LogOut, Menu, X,
  Clock, CheckCircle, XCircle, Phone, MapPin, Calendar, ChevronDown,
  AlertCircle, Pencil, Trash2, Search, MessageSquare, Send, UserCheck,
  ArrowLeft, ChevronRight, Mail, ListChecks, Package, Bell,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/Logo';

interface CustomerDashboardPageProps {
  onNavigate: (page: string) => void;
}

interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  created_at: string;
}

interface Booking {
  id: string;
  batch_id: string | null;
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
  assigned_provider_name: string;
  assigned_provider_phone: string;
  assigned_provider_email: string;
  admin_notes: string;
}

interface BookingBatch {
  batch_id: string | null;
  items: Booking[];
  created_at: string;
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

interface ServiceItem {
  id: string;
  service_type: string;
  hiring_type: string;
  preferred_date: string;
  description: string;
}

type Tab = 'overview' | 'bookings' | 'request' | 'messages' | 'direct' | 'profile';

interface DirectMessage {
  id: string;
  customer_id: string;
  admin_id: string | null;
  sender_role: 'admin' | 'customer';
  sender_id: string;
  message: string;
  read_by_customer: boolean;
  read_by_admin: boolean;
  created_at: string;
}

const SERVICE_TYPES = [
  'Professional Cleaner',
  'Professional Driver',
  'Licensed Electrician',
  'Expert Plumber',
  'Carpenter / Woodwork Specialist',
  'Repair Technician',
  'Cook / Personal Chef',
  'Professional Tutor / Instructor',
];

const statusMeta: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new:       { label: 'Pending',   color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Phone },
  confirmed: { label: 'Confirmed', color: 'bg-sky-100 text-sky-800 border-sky-200',          icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200',    icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200',          icon: XCircle },
};

const newServiceItem = (): ServiceItem => ({
  id: crypto.randomUUID(),
  service_type: SERVICE_TYPES[0],
  hiring_type: 'contract',
  preferred_date: '',
  description: '',
});

function groupIntoBatches(bookings: Booking[]): BookingBatch[] {
  const map = new Map<string, Booking[]>();
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
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function CustomerDashboardPage({ onNavigate }: CustomerDashboardPageProps) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  // Multi-service request form
  const [sharedLocation, setSharedLocation] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([newServiceItem()]);
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState('');
  const [submittedCount, setSubmittedCount] = useState(0);

  // Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', location: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Booking messaging
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Direct messages (admin ↔ customer personal chat)
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [directDraft, setDirectDraft] = useState('');
  const [directSending, setDirectSending] = useState(false);
  const [directUnread, setDirectUnread] = useState(0);
  const directEndRef = useRef<HTMLDivElement>(null);
  const directChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) { onNavigate('customer-login'); return; }
    loadData();
    return () => { directChannelRef.current?.unsubscribe(); };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    directEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages]);

  useEffect(() => {
    if (tab === 'direct' && user) loadDirectMessages();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadProfile(), loadBookings(), loadDirectUnread()]);
    setLoading(false);
  };

  const loadDirectUnread = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('customer_direct_messages')
      .select('id')
      .eq('customer_id', user.id)
      .eq('sender_role', 'admin')
      .eq('read_by_customer', false);
    setDirectUnread((data || []).length);
  };

  const loadDirectMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('customer_direct_messages')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: true });
    setDirectMessages(data || []);
    // mark admin messages as read
    await supabase
      .from('customer_direct_messages')
      .update({ read_by_customer: true })
      .eq('customer_id', user.id)
      .eq('sender_role', 'admin')
      .eq('read_by_customer', false);
    setDirectUnread(0);
    // real-time
    directChannelRef.current?.unsubscribe();
    directChannelRef.current = supabase
      .channel(`cdm-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'customer_direct_messages',
        filter: `customer_id=eq.${user.id}`,
      }, payload => {
        const msg = payload.new as DirectMessage;
        setDirectMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (msg.sender_role === 'admin') {
          supabase.from('customer_direct_messages').update({ read_by_customer: true }).eq('id', msg.id);
        }
      })
      .subscribe();
  };

  const sendDirectMessage = async () => {
    if (!directDraft.trim() || !user) return;
    setDirectSending(true);
    const text = directDraft.trim();
    setDirectDraft('');
    const { data: inserted, error } = await supabase
      .from('customer_direct_messages')
      .insert({
        customer_id: user.id,
        admin_id: null,
        sender_role: 'customer',
        sender_id: user.id,
        message: text,
        read_by_customer: true,
        read_by_admin: false,
      })
      .select('*')
      .single();
    if (error) setDirectDraft(text);
    else if (inserted) setDirectMessages(prev => prev.find(m => m.id === inserted.id) ? prev : [...prev, inserted]);
    setDirectSending(false);
  };

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setProfileForm({ full_name: data.full_name, phone: data.phone, location: data.location });
    }
  };

  const loadBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('service_bookings')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    const list = data || [];
    setBookings(list);
    if (list.length > 0) fetchUnreadCounts(list.map(b => b.id));
  };

  const fetchUnreadCounts = async (ids: string[]) => {
    const { data } = await supabase
      .from('customer_messages')
      .select('booking_id')
      .in('booking_id', ids)
      .eq('read_by_customer', false)
      .eq('sender_role', 'admin');
    const counts: Record<string, number> = {};
    (data || []).forEach(m => { counts[m.booking_id] = (counts[m.booking_id] || 0) + 1; });
    setUnreadCounts(counts);
  };

  const openChat = async (booking: Booking) => {
    setSelectedBooking(booking);
    await loadMessages(booking.id);
    await supabase
      .from('customer_messages')
      .update({ read_by_customer: true })
      .eq('booking_id', booking.id)
      .eq('sender_role', 'admin');
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

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedBooking || !user) return;
    setSendingMsg(true);
    const { error } = await supabase.from('customer_messages').insert({
      booking_id: selectedBooking.id,
      sender_role: 'customer',
      sender_id: user.id,
      message: newMsg.trim(),
      read_by_customer: true,
      read_by_admin: false,
    });
    if (!error) {
      setNewMsg('');
      await loadMessages(selectedBooking.id);
    }
    setSendingMsg(false);
  };

  const handleSignOut = async () => { await signOut(); onNavigate('home'); };

  // ── Service item helpers ──
  const updateService = useCallback((id: string, field: keyof ServiceItem, value: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const addService = () => setServices(prev => [...prev, newServiceItem()]);

  const removeService = (id: string) => {
    setServices(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  };

  const resetForm = () => {
    setSharedLocation('');
    setServices([newServiceItem()]);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError('');
    if (!sharedLocation.trim()) { setReqError('Location is required.'); return; }
    setReqSubmitting(true);
    try {
      const batchId = crypto.randomUUID();
      const rows = services.map(svc => ({
        batch_id: batchId,
        service_type: svc.service_type,
        hiring_type: svc.hiring_type,
        customer_name: profile?.full_name || user?.email || '',
        customer_phone: profile?.phone || '',
        customer_email: user?.email || '',
        location: sharedLocation.trim(),
        preferred_date: svc.preferred_date || null,
        description: svc.description.trim() || null,
        status: 'new',
        customer_id: user?.id,
      }));
      const { error } = await supabase.from('service_bookings').insert(rows);
      if (error) throw error;
      setSubmittedCount(rows.length);
      setReqSuccess(true);
      resetForm();
      await loadBookings();
    } catch {
      setReqError('Failed to submit request. Please try again.');
    } finally {
      setReqSubmitting(false);
    }
  };

  const cancelBooking = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    await supabase.from('service_bookings').update({ status: 'cancelled' }).eq('id', id).eq('customer_id', user?.id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    const { error } = await supabase
      .from('customer_profiles')
      .update({ full_name: profileForm.full_name, phone: profileForm.phone, location: profileForm.location })
      .eq('id', user?.id);
    if (!error) {
      await loadProfile();
      setProfileMsg('Profile updated successfully.');
      setEditProfile(false);
    } else {
      setProfileMsg('Failed to save changes.');
    }
    setProfileSaving(false);
  };

  const batches = groupIntoBatches(bookings);

  const filteredBatches = batches.filter(batch => {
    const matchFilter = bookingFilter === 'all' || batch.items.some(b => b.status === bookingFilter);
    const q = bookingSearch.toLowerCase();
    const matchSearch = !q || batch.items.some(b =>
      b.service_type.toLowerCase().includes(q) || b.location.toLowerCase().includes(q)
    );
    return matchFilter && matchSearch;
  });

  const stats = {
    total: batches.length,
    active: bookings.filter(b => ['new', 'contacted', 'confirmed'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
    { id: 'bookings',  label: 'My Bookings',      icon: CalendarCheck, badge: stats.active },
    { id: 'request',   label: 'Request Service',  icon: PlusCircle },
    { id: 'messages',  label: 'Booking Messages', icon: MessageSquare, badge: totalUnread },
    { id: 'direct',    label: 'Direct Messages',  icon: Bell, badge: directUnread },
    { id: 'profile',   label: 'My Profile',       icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-xl transform transition-transform duration-300 lg:translate-x-0 lg:static z-50 flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Logo size="sm" variant="icon-only" />
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:bg-white/10 p-1 rounded">
              <X size={22} />
            </button>
          </div>
          <p className="font-bold text-lg leading-tight">{profile?.full_name || 'Customer'}</p>
          <p className="text-slate-400 text-xs mt-1 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 mt-6 space-y-1 px-3 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false); if (item.id !== 'messages') setSelectedBooking(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                  active ? 'bg-gradient-to-r from-primary-600 to-green-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                ) : active ? (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-3 rounded-lg font-semibold text-sm transition-all border border-red-500/30"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600">
              <Menu size={22} />
            </button>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                {navItems.find(i => i.id === tab)?.label}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">Customer Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => { setTab('request'); setSidebarOpen(false); }}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <PlusCircle size={15} />
            <span className="hidden sm:inline">New Request</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-gray-500 mt-1">Here's a summary of your service activity.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Submissions',  value: stats.total,     color: 'from-primary-500 to-primary-600', icon: CalendarCheck },
                  { label: 'Active',       value: stats.active,    color: 'from-yellow-500 to-orange-500',   icon: Clock },
                  { label: 'Completed',    value: stats.completed, color: 'from-green-500 to-emerald-600',   icon: CheckCircle },
                  { label: 'Unread Msgs',  value: totalUnread,     color: 'from-orange-400 to-orange-500',   icon: MessageSquare },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-xl p-5 shadow-md`}>
                      <Icon size={22} className="mb-3 opacity-80" />
                      <p className="text-3xl font-bold">{s.value}</p>
                      <p className="text-sm opacity-80 mt-1">{s.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Recent batches */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Recent Bookings</h3>
                  <button onClick={() => setTab('bookings')} className="text-primary-600 text-sm font-semibold hover:underline">View all</button>
                </div>
                {batches.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarCheck size={36} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No bookings yet</p>
                    <button onClick={() => setTab('request')} className="mt-4 bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                      Request Your First Service
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {batches.slice(0, 5).map(batch => {
                      const first = batch.items[0];
                      const isBatch = batch.items.length > 1;
                      const meta = statusMeta[first.status] || statusMeta.new;
                      const StatusIcon = meta.icon;
                      const batchUnread = batch.items.reduce((sum, b) => sum + (unreadCounts[b.id] || 0), 0);
                      return (
                        <button
                          key={batch.batch_id ?? first.id}
                          onClick={() => setTab('bookings')}
                          className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {isBatch
                                ? `${batch.items.length} services — ${batch.items.map(i => i.service_type).join(', ')}`
                                : first.service_type}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={11} />{first.location} · {new Date(batch.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {batchUnread > 0 && (
                              <span className="flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                <MessageSquare size={10} />{batchUnread}
                              </span>
                            )}
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
                              <StatusIcon size={11} />{meta.label}
                            </span>
                            <ChevronRight size={14} className="text-gray-400" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setTab('request')}
                  className="bg-primary-600 text-white rounded-xl p-6 text-left hover:bg-primary-700 transition-colors group"
                >
                  <ListChecks size={28} className="mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-lg">Multi-Service Request</p>
                  <p className="text-white/75 text-sm mt-1">Book multiple services in one submission</p>
                </button>
                <button
                  onClick={() => setTab('messages')}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-primary-400 transition-colors group"
                >
                  <MessageSquare size={28} className="mb-3 text-primary-600 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-lg text-gray-900">Messages</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'Chat with our team about your bookings'}
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* ── MY BOOKINGS ── */}
          {tab === 'bookings' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-gray-500 mt-1">Track and manage all your service requests</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    placeholder="Search by service or location..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="relative">
                  <select
                    value={bookingFilter}
                    onChange={e => setBookingFilter(e.target.value)}
                    className="appearance-none pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
                  >
                    <option value="all">All Statuses</option>
                    {Object.entries(statusMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {filteredBatches.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
                  <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    {batches.length === 0 ? 'No bookings yet' : 'No bookings match your search'}
                  </p>
                  {batches.length === 0 && (
                    <button onClick={() => setTab('request')} className="mt-4 bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                      Request a Service
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBatches.map(batch => {
                    const batchKey = batch.batch_id ?? batch.items[0].id;
                    const isExpanded = expandedBatch === batchKey;
                    const isBatch = batch.items.length > 1;
                    const first = batch.items[0];
                    const batchUnread = batch.items.reduce((sum, b) => sum + (unreadCounts[b.id] || 0), 0);

                    const overallStatus = batch.items.every(i => i.status === 'completed')
                      ? 'completed'
                      : batch.items.some(i => i.status === 'cancelled') ? 'cancelled'
                      : batch.items.some(i => i.status === 'confirmed') ? 'confirmed'
                      : batch.items.some(i => i.status === 'contacted') ? 'contacted'
                      : 'new';

                    const meta = statusMeta[overallStatus] || statusMeta.new;
                    const StatusIcon = meta.icon;
                    const canCancel = batch.items.some(b => ['new', 'contacted'].includes(b.status));

                    return (
                      <div key={batchKey} className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${
                        overallStatus === 'new' ? 'border-l-4 border-l-primary-500 border-gray-200' : 'border-gray-200'
                      }`}>
                        {/* Batch header */}
                        <button
                          onClick={() => setExpandedBatch(isExpanded ? null : batchKey)}
                          className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${isBatch ? 'bg-primary-50' : 'bg-gray-50'}`}>
                              {isBatch
                                ? <ListChecks size={18} className="text-primary-600" />
                                : <Package size={18} className="text-gray-500" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 text-sm">
                                  {isBatch ? `${batch.items.length} services` : first.service_type}
                                </p>
                                {isBatch && (
                                  <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                                    Multi-service
                                  </span>
                                )}
                                {batchUnread > 0 && (
                                  <span className="flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    <MessageSquare size={10} />{batchUnread}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <MapPin size={11} />{first.location}
                                {isBatch && (
                                  <span className="text-gray-400 ml-1">· {batch.items.map(i => i.service_type).join(', ')}</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Submitted {new Date(batch.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
                              <StatusIcon size={11} />{meta.label}
                            </span>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Expanded: service line items */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-slate-50 px-5 py-4 space-y-3">
                            {batch.items.map((b, idx) => {
                              const itemMeta = statusMeta[b.status] || statusMeta.new;
                              const ItemIcon = itemMeta.icon;
                              const itemUnread = unreadCounts[b.id] || 0;
                              const itemCanCancel = ['new', 'contacted'].includes(b.status);

                              return (
                                <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {isBatch && <span className="text-gray-400 font-normal mr-1">#{idx + 1}</span>}
                                        {b.service_type}
                                      </p>
                                      <p className="text-xs text-gray-500 capitalize">{b.hiring_type} hire</p>
                                    </div>
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${itemMeta.color}`}>
                                      <ItemIcon size={10} />{itemMeta.label}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                                    {b.preferred_date && (
                                      <span className="flex items-center gap-1"><Calendar size={11} />{new Date(b.preferred_date).toLocaleDateString()}</span>
                                    )}
                                  </div>

                                  {/* Assigned provider */}
                                  {b.assigned_provider_name && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 mb-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <UserCheck size={13} className="text-green-700" />
                                        <p className="text-xs font-bold text-green-800">Assigned Provider</p>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-green-700">
                                        <span className="font-semibold">{b.assigned_provider_name}</span>
                                        {b.assigned_provider_phone && (
                                          <span className="flex items-center gap-1"><Phone size={10} />{b.assigned_provider_phone}</span>
                                        )}
                                        {b.assigned_provider_email && (
                                          <span className="flex items-center gap-1 sm:col-span-2"><Mail size={10} />{b.assigned_provider_email}</span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {b.admin_notes && (
                                    <div className="bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 mb-2">
                                      <p className="text-xs font-semibold text-primary-700 mb-0.5">Note from admin</p>
                                      <p className="text-xs text-primary-800">{b.admin_notes}</p>
                                    </div>
                                  )}

                                  {b.description && (
                                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-2 italic">{b.description}</p>
                                  )}

                                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                                    <button
                                      onClick={() => { setSelectedBooking(b); setTab('messages'); openChat(b); }}
                                      className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 text-xs font-semibold transition-colors"
                                    >
                                      <MessageSquare size={13} />
                                      Messages
                                      {itemUnread > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{itemUnread}</span>
                                      )}
                                    </button>
                                    {itemCanCancel && (
                                      <button
                                        onClick={() => cancelBooking(b.id)}
                                        className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs font-semibold transition-colors ml-auto"
                                      >
                                        <Trash2 size={13} /> Cancel
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Cancel all if batch is still cancellable */}
                            {isBatch && canCancel && (
                              <button
                                onClick={async () => {
                                  if (!confirm(`Cancel all ${batch.items.length} services in this batch?`)) return;
                                  for (const b of batch.items) {
                                    if (['new', 'contacted'].includes(b.status)) {
                                      await supabase.from('service_bookings').update({ status: 'cancelled' }).eq('id', b.id).eq('customer_id', user?.id);
                                    }
                                  }
                                  await loadBookings();
                                }}
                                className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 py-2 rounded-lg text-xs font-semibold transition-all"
                              >
                                <Trash2 size={13} /> Cancel All Services in This Batch
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── REQUEST SERVICE ── */}
          {tab === 'request' && (
            <div className="max-w-3xl">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Request a Service</h1>
                <p className="text-gray-500 mt-1">Add one or more services — we'll match you with the right professionals</p>
              </div>

              {reqSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={36} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {submittedCount === 1 ? 'Request Submitted!' : `${submittedCount} Requests Submitted!`}
                  </h3>
                  <p className="text-gray-600 mb-6">Our team will contact you shortly.</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => { setReqSuccess(false); setTab('bookings'); }}
                      className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-700 text-sm"
                    >
                      View My Bookings
                    </button>
                    <button
                      onClick={() => setReqSuccess(false)}
                      className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-50 text-sm"
                    >
                      Submit Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitRequest} className="space-y-5">
                  {reqError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{reqError}</div>
                  )}

                  {/* Shared location */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-900 text-sm">Location</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Applies to all services in this submission</p>
                    </div>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={sharedLocation}
                        onChange={e => setSharedLocation(e.target.value)}
                        placeholder={profile?.location || 'City / Area'}
                        required
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                      />
                    </div>
                    {profile && (
                      <div className="mt-3 bg-primary-50 border border-primary-100 rounded-lg px-4 py-2.5 text-xs text-primary-800">
                        <span className="font-semibold">Contact:</span> {profile.full_name} · {profile.phone}
                      </div>
                    )}
                  </div>

                  {/* Service line items */}
                  <div className="space-y-4">
                    {services.map((svc, idx) => (
                      <div key={svc.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{svc.service_type}</span>
                          </div>
                          {services.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeService(svc.id)}
                              className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="Remove this service"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        <div className="p-5 space-y-4">
                          {/* Service type */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Service Type</label>
                            <div className="relative">
                              <select
                                value={svc.service_type}
                                onChange={e => updateService(svc.id, 'service_type', e.target.value)}
                                className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white pr-8 text-sm"
                              >
                                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                            </div>
                          </div>

                          {/* Hiring type */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Hiring Type</label>
                            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                              {(['contract', 'permanent'] as const).map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => updateService(svc.id, 'hiring_type', type)}
                                  className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                                    svc.hiring_type === type ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Preferred date */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Preferred Date <span className="text-gray-400 font-normal">(optional)</span>
                              </label>
                              <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                  type="date"
                                  value={svc.preferred_date}
                                  onChange={e => updateService(svc.id, 'preferred_date', e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                                />
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Details <span className="text-gray-400 font-normal">(optional)</span>
                              </label>
                              <textarea
                                value={svc.description}
                                onChange={e => updateService(svc.id, 'description', e.target.value)}
                                rows={2}
                                placeholder="Describe what you need..."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add another service */}
                  <button
                    type="button"
                    onClick={addService}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary-300 text-primary-600 py-3 rounded-xl font-semibold text-sm hover:border-primary-500 hover:bg-primary-50 transition-all"
                  >
                    <PlusCircle size={17} />
                    Add Another Service
                    {services.length > 1 && (
                      <span className="ml-1 bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {services.length} services
                      </span>
                    )}
                  </button>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={reqSubmitting}
                    className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-base"
                  >
                    {reqSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle size={18} />Submit {services.length === 1 ? 'Request' : `${services.length} Requests`}</>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {tab === 'messages' && (
            <div className="h-full">
              <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-500 mt-1">Chat with our team about your service requests</p>
              </div>

              {bookings.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
                  <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No bookings to message about yet</p>
                  <button onClick={() => setTab('request')} className="mt-4 bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    Request a Service First
                  </button>
                </div>
              ) : selectedBooking ? (
                <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 260px)' }}>
                  <div className="bg-gradient-to-r from-primary-600 to-green-600 text-white px-5 py-4 rounded-t-xl flex items-center gap-3">
                    <button onClick={() => setSelectedBooking(null)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <p className="font-bold">{selectedBooking.service_type}</p>
                      <p className="text-xs opacity-75">{selectedBooking.location}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 border border-white/30">
                        {statusMeta[selectedBooking.status]?.label || selectedBooking.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                          <p className="text-gray-400 text-xs mt-1">Send a message to get help from our team</p>
                        </div>
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                            msg.sender_role === 'customer'
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}>
                            <p className="leading-relaxed">{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${msg.sender_role === 'customer' ? 'text-primary-200' : 'text-gray-400'}`}>
                              {msg.sender_role === 'customer' ? 'You' : 'Support Team'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        className="bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(b => {
                    const meta = statusMeta[b.status] || statusMeta.new;
                    const StatusIcon = meta.icon;
                    const unread = unreadCounts[b.id] || 0;
                    return (
                      <button
                        key={b.id}
                        onClick={() => openChat(b)}
                        className="w-full bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:border-primary-300 transition-all flex items-center gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-gray-900">{b.service_type}</p>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.color}`}>
                              <StatusIcon size={10} />{meta.label}
                            </span>
                            {unread > 0 && (
                              <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                <MessageSquare size={10} />{unread} new
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{b.location} · {new Date(b.created_at).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight size={18} className="text-gray-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── DIRECT MESSAGES ── */}
          {tab === 'direct' && (
            <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
              <div className="mb-4 shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Direct Messages</h1>
                <p className="text-gray-500 mt-1 text-sm">Personal messages from the Danhausa support team</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 min-h-0">
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {directMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                        <Bell size={28} className="text-primary-400" />
                      </div>
                      <p className="text-gray-700 font-semibold">No messages yet</p>
                      <p className="text-gray-400 text-sm mt-1">The support team will message you here directly</p>
                    </div>
                  ) : (
                    directMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_role === 'customer' ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
                        {msg.sender_role === 'admin' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-green-600 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-white">AD</span>
                          </div>
                        )}
                        <div className={`max-w-[75%] flex flex-col gap-0.5 ${msg.sender_role === 'customer' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.sender_role === 'customer'
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-gray-400 px-1">
                            {msg.sender_role === 'customer' ? 'You' : 'Support Team'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={directEndRef} />
                </div>
                {/* Input */}
                <div className="border-t border-gray-200 p-3 bg-white rounded-b-xl shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={directDraft}
                      onChange={e => setDirectDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendDirectMessage()}
                      placeholder="Type a message..."
                      disabled={directSending}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary-500 bg-gray-50"
                    />
                    <button
                      onClick={sendDirectMessage}
                      disabled={directSending || !directDraft.trim()}
                      className="bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500 mt-1">Manage your personal information</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 to-green-600 px-8 py-8 text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                    <User size={32} className="text-white" />
                  </div>
                  <p className="text-xl font-bold">{profile?.full_name || 'Customer'}</p>
                  <p className="text-white/75 text-sm mt-0.5">{user?.email}</p>
                  <p className="text-white/60 text-xs mt-1">
                    Member since {profile ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>

                <div className="p-6">
                  {profileMsg && (
                    <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${profileMsg.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                      {profileMsg}
                    </div>
                  )}

                  {editProfile ? (
                    <form onSubmit={saveProfile} className="space-y-4">
                      {[
                        { label: 'Full Name',    field: 'full_name', type: 'text' },
                        { label: 'Phone Number', field: 'phone',     type: 'tel' },
                        { label: 'Location',     field: 'location',  type: 'text' },
                      ].map(row => (
                        <div key={row.field}>
                          <label className="block text-sm font-semibold text-gray-800 mb-1.5">{row.label}</label>
                          <input
                            type={row.type}
                            value={profileForm[row.field as keyof typeof profileForm]}
                            onChange={e => setProfileForm(p => ({ ...p, [row.field]: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                            required
                          />
                        </div>
                      ))}
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={profileSaving} className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60">
                          {profileSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => setEditProfile(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-1">
                      {[
                        { label: 'Full Name', value: profile?.full_name, icon: User },
                        { label: 'Phone',     value: profile?.phone,     icon: Phone },
                        { label: 'Location',  value: profile?.location,  icon: MapPin },
                        { label: 'Email',     value: user?.email,        icon: Mail },
                      ].map(row => {
                        const Icon = row.icon;
                        return (
                          <div key={row.label} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                              <Icon size={15} className="text-primary-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 font-medium">{row.label}</p>
                              <p className="font-semibold text-gray-900 text-sm truncate">{row.value || '—'}</p>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => setEditProfile(true)}
                        className="w-full flex items-center justify-center gap-2 border-2 border-primary-200 text-primary-600 py-2.5 rounded-lg font-semibold hover:bg-primary-50 transition-colors mt-4"
                      >
                        <Pencil size={15} /> Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="font-bold text-gray-900 mb-3">Booking Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary-700">{stats.total}</p>
                    <p className="text-xs text-primary-600 font-medium">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                    <p className="text-xs text-green-600 font-medium">Completed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
