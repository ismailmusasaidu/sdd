import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, PlusCircle, User, LogOut, Menu, X,
  Clock, CheckCircle, XCircle, Phone, MapPin, Calendar,
  Building2, AlertTriangle, CalendarCheck, ChevronRight,
  Search, Filter, Users, ChevronDown, Pencil, Trash2,
  Package, ListChecks, MessageSquare, Send, ArrowLeft, BarChart2, Bell,
} from 'lucide-react';
import BusinessAnalytics from './BusinessAnalytics';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/Logo';

interface BusinessDashboardPageProps {
  onNavigate: (page: string) => void;
}

interface BusinessProfile {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  location: string;
  industry: string;
  company_size: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string;
  created_at: string;
}

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

interface BookingBatch {
  batch_id: string | null;
  items: BusinessBooking[];
  created_at: string;
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

type Tab = 'overview' | 'bookings' | 'request' | 'messages' | 'direct' | 'analytics' | 'profile';

interface BusinessDirectMessage {
  id: string;
  business_id: string;
  admin_id: string | null;
  sender_role: 'admin' | 'business';
  sender_id: string;
  message: string;
  read_by_business: boolean;
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
  'Builder / Construction',
  'Painter',
  'Tiler',
  'Security Guard',
  'Office Cleaner',
  'Mover / Packer',
  'Other',
];

const statusMeta: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new:       { label: 'Pending',   color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Phone },
  confirmed: { label: 'Confirmed', color: 'bg-sky-100 text-sky-800 border-sky-200',          icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200',    icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200',          icon: XCircle },
};

interface ServiceItem {
  id: string;
  service_type: string;
  hiring_type: string;
  workers_needed: number;
  location: string;
  preferred_date: string;
  description: string;
}

const newServiceItem = (): ServiceItem => ({
  id: crypto.randomUUID(),
  service_type: SERVICE_TYPES[0],
  hiring_type: 'contract',
  workers_needed: 1,
  location: '',
  preferred_date: '',
  description: '',
});

function groupIntoBatches(bookings: BusinessBooking[]): BookingBatch[] {
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
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function BusinessDashboardPage({ onNavigate }: BusinessDashboardPageProps) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  // Multi-service request form
  const [services, setServices] = useState<ServiceItem[]>([newServiceItem()]);
  const [sharedLocation, setSharedLocation] = useState('');
  const [sharedDate, setSharedDate] = useState('');
  const [useSharedLocation, setUseSharedLocation] = useState(true);
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState('');
  const [submittedCount, setSubmittedCount] = useState(0);

  // Profile
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    contact_name: '', phone: '', location: '', company_name: '', industry: '', company_size: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Booking messaging
  const [selectedBooking, setSelectedBooking] = useState<BusinessBooking | null>(null);
  const [messages, setMessages] = useState<BusinessMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Direct messages
  const [directMessages, setDirectMessages] = useState<BusinessDirectMessage[]>([]);
  const [directDraft, setDirectDraft] = useState('');
  const [directSending, setDirectSending] = useState(false);
  const [directUnread, setDirectUnread] = useState(0);
  const directEndRef = useRef<HTMLDivElement>(null);
  const directChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) { onNavigate('business-login'); return; }
    loadData();
    return () => {
      realtimeRef.current?.unsubscribe();
      directChannelRef.current?.unsubscribe();
    };
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
      .from('business_direct_messages')
      .select('id')
      .eq('business_id', user.id)
      .eq('sender_role', 'admin')
      .eq('read_by_business', false);
    setDirectUnread((data || []).length);
  };

  const loadDirectMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('business_direct_messages')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: true });
    setDirectMessages(data || []);
    await supabase
      .from('business_direct_messages')
      .update({ read_by_business: true })
      .eq('business_id', user.id)
      .eq('sender_role', 'admin')
      .eq('read_by_business', false);
    setDirectUnread(0);
    directChannelRef.current?.unsubscribe();
    directChannelRef.current = supabase
      .channel(`bdm-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'business_direct_messages',
        filter: `business_id=eq.${user.id}`,
      }, payload => {
        const msg = payload.new as BusinessDirectMessage;
        setDirectMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (msg.sender_role === 'admin') {
          supabase.from('business_direct_messages').update({ read_by_business: true }).eq('id', msg.id);
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
      .from('business_direct_messages')
      .insert({
        business_id: user.id,
        admin_id: null,
        sender_role: 'business',
        sender_id: user.id,
        message: text,
        read_by_business: true,
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
      .from('business_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setProfileForm({
        contact_name: data.contact_name,
        phone: data.phone,
        location: data.location,
        company_name: data.company_name,
        industry: data.industry,
        company_size: data.company_size,
      });
    }
  };

  const loadBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('business_bookings')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false });
    const list = data || [];
    setBookings(list);
    if (list.length > 0) fetchUnreadCounts(list.map(b => b.id));
  };

  const fetchUnreadCounts = async (ids: string[]) => {
    const { data } = await supabase
      .from('business_messages')
      .select('booking_id')
      .in('booking_id', ids)
      .eq('read_by_business', false)
      .eq('sender_role', 'admin');
    const counts: Record<string, number> = {};
    (data || []).forEach(m => { counts[m.booking_id] = (counts[m.booking_id] || 0) + 1; });
    setUnreadCounts(counts);
  };

  const openChat = async (booking: BusinessBooking) => {
    setSelectedBooking(booking);
    await loadMessages(booking.id);
    // Mark admin messages as read
    await supabase
      .from('business_messages')
      .update({ read_by_business: true })
      .eq('booking_id', booking.id)
      .eq('sender_role', 'admin');
    setUnreadCounts(prev => ({ ...prev, [booking.id]: 0 }));
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
      .channel(`business_messages:${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'business_messages', filter: `booking_id=eq.${bookingId}` },
        payload => {
          const msg = payload.new as BusinessMessage;
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_role === 'admin') {
            supabase
              .from('business_messages')
              .update({ read_by_business: true })
              .eq('id', msg.id);
          }
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedBooking || !user) return;
    setSendingMsg(true);
    const msgText = newMsg.trim();
    setNewMsg('');
    const { error } = await supabase.from('business_messages').insert({
      booking_id: selectedBooking.id,
      sender_role: 'business',
      sender_id: user.id,
      message: msgText,
      read_by_business: true,
      read_by_admin: false,
    });
    if (error) setNewMsg(msgText); // restore on error
    setSendingMsg(false);
  };

  const handleSignOut = async () => { await signOut(); onNavigate('home'); };

  // ── Service item helpers ──
  const updateService = useCallback((id: string, field: keyof ServiceItem, value: string | number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const addService = () => setServices(prev => [...prev, newServiceItem()]);

  const removeService = (id: string) => {
    setServices(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  };

  const resetForm = () => {
    setServices([newServiceItem()]);
    setSharedLocation('');
    setSharedDate('');
    setUseSharedLocation(true);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError('');
    for (const svc of services) {
      const loc = useSharedLocation ? sharedLocation : svc.location;
      if (!loc.trim()) { setReqError('Location is required for all services.'); return; }
    }
    setReqSubmitting(true);
    try {
      const batchId = crypto.randomUUID();
      const rows = services.map(svc => ({
        business_id: user?.id,
        batch_id: batchId,
        service_type: svc.service_type,
        hiring_type: svc.hiring_type,
        workers_needed: svc.workers_needed,
        location: (useSharedLocation ? sharedLocation : svc.location).trim(),
        preferred_date: (useSharedLocation ? sharedDate : svc.preferred_date) || null,
        description: svc.description.trim() || null,
        status: 'new',
      }));
      const { error } = await supabase.from('business_bookings').insert(rows);
      if (error) throw error;
      setSubmittedCount(rows.length);
      setReqSuccess(true);
      resetForm();
      await loadBookings();
    } catch (err: unknown) {
      setReqError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setReqSubmitting(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    const { error } = await supabase
      .from('business_profiles')
      .update({
        contact_name: profileForm.contact_name.trim(),
        phone: profileForm.phone.trim(),
        location: profileForm.location.trim(),
        company_name: profileForm.company_name.trim(),
        industry: profileForm.industry,
        company_size: profileForm.company_size,
      })
      .eq('id', user?.id);
    if (error) setProfileMsg('Failed to save changes.');
    else { setProfileMsg('Profile updated successfully.'); setEditProfile(false); await loadProfile(); }
    setProfileSaving(false);
  };

  const batches = groupIntoBatches(bookings);

  const filteredBatches = batches.filter(batch => {
    const matchSearch = bookingSearch === '' ||
      batch.items.some(b =>
        b.service_type.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.location.toLowerCase().includes(bookingSearch.toLowerCase())
      );
    const matchFilter = bookingFilter === 'all' || batch.items.some(b => b.status === bookingFilter);
    return matchSearch && matchFilter;
  });

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const stats = {
    total: batches.length,
    active: bookings.filter(b => ['new', 'contacted', 'confirmed'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { id: 'overview',   label: 'Overview',         icon: LayoutDashboard },
    { id: 'analytics',  label: 'Analytics',         icon: BarChart2 },
    { id: 'bookings',   label: 'My Requests',       icon: CalendarCheck, badge: stats.active },
    { id: 'request',    label: 'New Request',       icon: PlusCircle },
    { id: 'messages',   label: 'Booking Messages',  icon: MessageSquare, badge: totalUnread },
    { id: 'direct',     label: 'Direct Messages',   icon: Bell, badge: directUnread },
    { id: 'profile',    label: 'Company Profile',   icon: Building2 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-8 text-white text-center">
            <Logo size="sm" variant="icon-only" />
            <h1 className="text-xl font-bold mt-3">Business Portal</h1>
          </div>
          <div className="px-8 py-10 text-center space-y-5">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Clock size={32} className="text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Account Pending Approval</h2>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                Welcome, <strong>{profile.company_name}</strong>! Your business account is under review.
                You'll be able to access the full portal once our admin team approves your account.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Typical review time: <strong>24–48 hours</strong>
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-8 py-8 text-white text-center">
            <Logo size="sm" variant="icon-only" />
            <h1 className="text-xl font-bold mt-3">Application Rejected</h1>
          </div>
          <div className="px-8 py-10 text-center space-y-5">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={32} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Account Not Approved</h2>
              <p className="text-gray-500 mt-2 text-sm">Unfortunately, your business account application has been rejected.</p>
              {profile.admin_notes && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-left">
                  <strong>Reason:</strong> {profile.admin_notes}
                </div>
              )}
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
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
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-xl transform transition-transform duration-300 lg:translate-x-0 lg:static z-50 flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Logo size="sm" variant="icon-only" />
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:bg-white/10 p-1 rounded transition-colors">
              <X size={24} />
            </button>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight truncate">{profile?.company_name || 'Business'}</h1>
            <p className="text-slate-400 text-xs mt-0.5 truncate">{profile?.industry}</p>
            <span className="inline-flex items-center gap-1 mt-2 bg-green-500/20 text-green-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-500/30">
              <CheckCircle size={10} /> Approved
            </span>
          </div>
        </div>

        <nav className="flex-1 mt-6 space-y-1 px-3 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false); if (item.id !== 'messages') setSelectedBooking(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                  isActive ? 'bg-gradient-to-r from-primary-600 to-green-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-3 rounded-lg font-semibold transition-all border border-red-500/30 text-sm"
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
              <p className="text-xs text-slate-500 hidden sm:block">Business Dashboard — Danhausa Home Services</p>
            </div>
          </div>
          <button
            onClick={() => setTab('request')}
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
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.company_name}!</h1>
                <p className="text-gray-500 mt-1 text-sm">Here's your business activity summary.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Submissions',  value: stats.total,     color: 'from-primary-500 to-primary-600', icon: Package },
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
                  <h3 className="font-bold text-gray-900">Recent Requests</h3>
                  <button onClick={() => setTab('bookings')} className="text-primary-600 text-sm font-semibold hover:underline">View all</button>
                </div>
                {batches.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarCheck size={36} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No requests yet</p>
                    <button onClick={() => setTab('request')} className="mt-4 bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                      Create First Request
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {batches.slice(0, 5).map(batch => {
                      const first = batch.items[0];
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
                              {batch.items.length > 1
                                ? `${batch.items.length} services — ${batch.items.map(i => i.service_type).join(', ')}`
                                : first.service_type}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={11} />{first.location}
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
                <button onClick={() => setTab('request')} className="flex items-center gap-4 bg-white border-2 border-primary-100 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all text-left">
                  <div className="bg-primary-100 p-3 rounded-xl"><ListChecks size={22} className="text-primary-600" /></div>
                  <div>
                    <p className="font-bold text-gray-900">Multi-Service Request</p>
                    <p className="text-sm text-gray-500">Book multiple staff types at once</p>
                  </div>
                </button>
                <button onClick={() => setTab('messages')} className="flex items-center gap-4 bg-white border-2 border-green-100 rounded-xl p-5 hover:border-green-300 hover:shadow-md transition-all text-left">
                  <div className="bg-green-100 p-3 rounded-xl"><MessageSquare size={22} className="text-green-600" /></div>
                  <div>
                    <p className="font-bold text-gray-900">Messages</p>
                    <p className="text-sm text-gray-500">
                      {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'Chat with our team about your requests'}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {tab === 'bookings' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
                <p className="text-gray-500 mt-1 text-sm">All your service request submissions</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input type="text" placeholder="Search by service or location..." value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm" />
                </div>
                <div className="relative">
                  <Filter size={15} className="absolute left-3 top-3 text-gray-400" />
                  <select value={bookingFilter} onChange={e => setBookingFilter(e.target.value)}
                    className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm bg-white">
                    <option value="all">All Statuses</option>
                    {Object.entries(statusMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {filteredBatches.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <CalendarCheck size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    {batches.length === 0 ? 'No requests yet' : 'No requests match your search'}
                  </p>
                  {batches.length === 0 && (
                    <button onClick={() => setTab('request')} className="mt-4 bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700">
                      Create Request
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

                    const overallStatus = batch.items.every(i => i.status === 'completed') ? 'completed'
                      : batch.items.some(i => i.status === 'cancelled') ? 'cancelled'
                      : batch.items.some(i => i.status === 'confirmed') ? 'confirmed'
                      : batch.items.some(i => i.status === 'contacted') ? 'contacted' : 'new';

                    const meta = statusMeta[overallStatus] || statusMeta.new;
                    const StatusIcon = meta.icon;

                    return (
                      <div key={batchKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <button
                          onClick={() => setExpandedBatch(isExpanded ? null : batchKey)}
                          className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${isBatch ? 'bg-primary-50' : 'bg-gray-50'}`}>
                              {isBatch ? <ListChecks size={18} className="text-primary-600" /> : <Package size={18} className="text-gray-500" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 text-sm">
                                  {isBatch ? `Batch of ${batch.items.length} services` : first.service_type}
                                </p>
                                {isBatch && <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">Multi-service</span>}
                                {batchUnread > 0 && (
                                  <span className="flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    <MessageSquare size={10} />{batchUnread}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                                <MapPin size={11} />{first.location}
                                {isBatch && <span className="text-gray-400 ml-1">· {batch.items.map(i => i.service_type).join(', ')}</span>}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(batch.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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

                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-slate-50 px-5 py-4 space-y-3">
                            {batch.items.map((b, idx) => {
                              const itemMeta = statusMeta[b.status] || statusMeta.new;
                              const ItemIcon = itemMeta.icon;
                              const itemUnread = unreadCounts[b.id] || 0;
                              return (
                                <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {isBatch && <span className="text-gray-400 font-normal mr-1">#{idx + 1}</span>}
                                        {b.service_type}
                                      </p>
                                      <p className="text-xs text-gray-500 capitalize">{b.hiring_type} · {b.workers_needed} worker{b.workers_needed > 1 ? 's' : ''}</p>
                                    </div>
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${itemMeta.color}`}>
                                      <ItemIcon size={10} />{itemMeta.label}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                                    <span className="flex items-center gap-1"><MapPin size={11} className="text-gray-400" />{b.location}</span>
                                    {b.preferred_date && <span className="flex items-center gap-1"><Calendar size={11} className="text-gray-400" />{new Date(b.preferred_date).toLocaleDateString()}</span>}
                                  </div>
                                  {b.description && <p className="text-xs text-gray-500 mb-2 italic">{b.description}</p>}
                                  {b.admin_notes && (
                                    <div className="mb-2 bg-primary-50 border border-primary-100 rounded-lg px-3 py-1.5 text-xs text-primary-800">
                                      <strong>Admin:</strong> {b.admin_notes}
                                    </div>
                                  )}
                                  <div className="pt-2 border-t border-gray-100">
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
                                  </div>
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
          )}

          {/* ── NEW REQUEST ── */}
          {tab === 'request' && (
            <div className="max-w-3xl">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">New Service Request</h1>
                <p className="text-gray-500 mt-1 text-sm">Add one or more services in a single submission</p>
              </div>

              {reqSuccess ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {submittedCount === 1 ? 'Request Submitted!' : `${submittedCount} Requests Submitted!`}
                  </h2>
                  <p className="text-gray-500 text-sm">Our team will process your request{submittedCount > 1 ? 's' : ''} and get back to you shortly.</p>
                  <div className="flex gap-3 justify-center pt-2">
                    <button onClick={() => { setReqSuccess(false); setTab('bookings'); }} className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-700 text-sm">
                      View My Requests
                    </button>
                    <button onClick={() => setReqSuccess(false)} className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-50 text-sm">
                      Submit Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitRequest} className="space-y-5">
                  {reqError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />{reqError}
                    </div>
                  )}

                  {/* Shared location toggle */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">Shared Details</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Apply one location & date to all services</p>
                      </div>
                      <button type="button" onClick={() => setUseSharedLocation(v => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useSharedLocation ? 'bg-primary-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useSharedLocation ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    {useSharedLocation && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                            <input type="text" value={sharedLocation} onChange={e => setSharedLocation(e.target.value)}
                              placeholder="City / Area" required={useSharedLocation}
                              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Start Date <span className="text-gray-400 font-normal">(optional)</span></label>
                          <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-3 text-gray-400" />
                            <input type="date" value={sharedDate} onChange={e => setSharedDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service line items */}
                  <div className="space-y-4">
                    {services.map((svc, idx) => (
                      <div key={svc.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                            <span className="text-sm font-semibold text-gray-700">{svc.service_type}</span>
                          </div>
                          {services.length > 1 && (
                            <button type="button" onClick={() => removeService(svc.id)}
                              className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Service Type</label>
                            <div className="relative">
                              <select value={svc.service_type} onChange={e => updateService(svc.id, 'service_type', e.target.value)}
                                className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 bg-white pr-8 text-sm">
                                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Hiring Type</label>
                            <div className="flex gap-3">
                              {(['contract', 'permanent'] as const).map(t => (
                                <label key={t} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-semibold capitalize ${
                                  svc.hiring_type === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}>
                                  <input type="radio" name={`hiring_${svc.id}`} value={t} checked={svc.hiring_type === t}
                                    onChange={() => updateService(svc.id, 'hiring_type', t)} className="sr-only" />
                                  {t}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Workers Needed</label>
                            <div className="relative">
                              <Users size={14} className="absolute left-3 top-3 text-gray-400" />
                              <input type="number" min={1} max={500} value={svc.workers_needed}
                                onChange={e => updateService(svc.id, 'workers_needed', parseInt(e.target.value) || 1)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm" />
                            </div>
                          </div>
                          {!useSharedLocation && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                                <input type="text" value={svc.location} onChange={e => updateService(svc.id, 'location', e.target.value)}
                                  placeholder="City / Area" required
                                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm" />
                              </div>
                            </div>
                          )}
                          {!useSharedLocation && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Date <span className="text-gray-400 font-normal">(optional)</span></label>
                              <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-3 text-gray-400" />
                                <input type="date" value={svc.preferred_date} onChange={e => updateService(svc.id, 'preferred_date', e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm" />
                              </div>
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                            <textarea value={svc.description} onChange={e => updateService(svc.id, 'description', e.target.value)}
                              rows={2} placeholder="Skills required, working hours, special requirements..."
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm resize-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={addService}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary-300 text-primary-600 py-3 rounded-xl font-semibold text-sm hover:border-primary-500 hover:bg-primary-50 transition-all">
                    <PlusCircle size={17} />
                    Add Another Service
                    {services.length > 1 && (
                      <span className="ml-1 bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{services.length} services</span>
                    )}
                  </button>

                  <button type="submit" disabled={reqSubmitting}
                    className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-base">
                    {reqSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
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
                  <p className="text-gray-500 font-medium">No requests yet — submit one to start messaging</p>
                  <button onClick={() => setTab('request')} className="mt-4 bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    Create a Request First
                  </button>
                </div>
              ) : selectedBooking ? (
                /* Chat view */
                <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 260px)' }}>
                  <div className="bg-gradient-to-r from-primary-700 to-primary-600 text-white px-5 py-4 rounded-t-xl flex items-center gap-3">
                    <button onClick={() => { setSelectedBooking(null); realtimeRef.current?.unsubscribe(); }}
                      className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                      <ArrowLeft size={18} />
                    </button>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{selectedBooking.service_type}</p>
                      <p className="text-xs opacity-75 truncate">{selectedBooking.location}</p>
                    </div>
                    <div className="ml-auto shrink-0">
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
                        <div key={msg.id} className={`flex ${msg.sender_role === 'business' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                            msg.sender_role === 'business'
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}>
                            <p className="leading-relaxed">{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${msg.sender_role === 'business' ? 'text-primary-200' : 'text-gray-400'}`}>
                              {msg.sender_role === 'business' ? 'You' : 'Support Team'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.sender_role === 'business' && msg.read_by_admin && (
                                <span className="ml-1 opacity-75">· Seen</span>
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
                      <button onClick={sendMessage} disabled={sendingMsg || !newMsg.trim()}
                        className="bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Booking selector — list all individual bookings */
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
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={11} />{b.location} · {new Date(b.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 capitalize mt-0.5">{b.hiring_type} · {b.workers_needed} worker{b.workers_needed > 1 ? 's' : ''}</p>
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
            <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
              <div className="mb-4 shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Direct Messages</h1>
                <p className="text-gray-500 mt-1 text-sm">Personal messages from the Danhausa admin team</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {directMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                        <Bell size={28} className="text-amber-400" />
                      </div>
                      <p className="text-gray-700 font-semibold">No messages yet</p>
                      <p className="text-gray-400 text-sm mt-1">The admin team will message you here directly</p>
                    </div>
                  ) : (
                    directMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_role === 'business' ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
                        {msg.sender_role === 'admin' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-green-600 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-white">AD</span>
                          </div>
                        )}
                        <div className={`max-w-[75%] flex flex-col gap-0.5 ${msg.sender_role === 'business' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.sender_role === 'business'
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-gray-400 px-1">
                            {msg.sender_role === 'business' ? 'You' : 'Support Team'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.sender_role === 'business' && msg.read_by_admin && (
                              <span className="ml-1 opacity-75">· Seen</span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={directEndRef} />
                </div>
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

          {/* ── ANALYTICS ── */}
          {tab === 'analytics' && user && (
            <BusinessAnalytics businessId={user.id} />
          )}

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
                <p className="text-gray-500 mt-1 text-sm">Manage your business information</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-xl p-3"><Building2 size={28} className="text-white" /></div>
                    <div>
                      <h2 className="font-bold text-lg">{profile?.company_name}</h2>
                      <p className="text-white/70 text-sm">{profile?.industry}</p>
                      <span className="inline-flex items-center gap-1 mt-1.5 bg-green-500/30 text-green-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> Approved Business
                      </span>
                    </div>
                  </div>
                </div>

                {profileMsg && (
                  <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm border ${
                    profileMsg.includes('successfully') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                  }`}>{profileMsg}</div>
                )}

                {!editProfile ? (
                  <div className="px-6 py-6 space-y-1">
                    {[
                      { label: 'Company Name',  value: profile?.company_name },
                      { label: 'Contact Person', value: profile?.contact_name },
                      { label: 'Email',          value: profile?.email },
                      { label: 'Phone',          value: profile?.phone },
                      { label: 'Location',       value: profile?.location },
                      { label: 'Industry',       value: profile?.industry },
                      { label: 'Company Size',   value: profile?.company_size ? `${profile.company_size} employees` : '' },
                      { label: 'Member Since',   value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-sm font-semibold text-gray-500">{row.label}</span>
                        <span className="text-sm text-gray-900 font-medium text-right max-w-[60%] truncate">{row.value || '—'}</span>
                      </div>
                    ))}
                    <button onClick={() => setEditProfile(true)}
                      className="w-full mt-2 flex items-center justify-center gap-2 border-2 border-primary-200 text-primary-700 py-2.5 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-sm">
                      <Pencil size={15} /> Edit Profile
                    </button>
                  </div>
                ) : (
                  <form onSubmit={saveProfile} className="px-6 py-6 space-y-4">
                    {[
                      { label: 'Company Name',  field: 'company_name', type: 'text' },
                      { label: 'Contact Person', field: 'contact_name', type: 'text' },
                      { label: 'Phone',          field: 'phone',        type: 'tel' },
                      { label: 'Location',       field: 'location',     type: 'text' },
                    ].map(({ label, field, type }) => (
                      <div key={field}>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</label>
                        <input type={type} value={profileForm[field as keyof typeof profileForm]}
                          onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm" />
                      </div>
                    ))}
                    <div className="flex gap-3 pt-1">
                      <button type="submit" disabled={profileSaving}
                        className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                        {profileSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
                      </button>
                      <button type="button" onClick={() => setEditProfile(false)}
                        className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50 text-sm">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
