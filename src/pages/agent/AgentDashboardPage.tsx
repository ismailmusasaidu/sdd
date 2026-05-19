import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, PlusCircle, User, LogOut, Menu, X,
  Clock, CheckCircle, XCircle, Phone, MapPin, Calendar,
  Briefcase, AlertTriangle, CalendarCheck, ChevronRight,
  Building2, Search, Filter, Trash2, ChevronDown,
  ListChecks, Package, Mail, BarChart2, MessageSquare, Send, Bell,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/Logo';
import AgentAnalytics from './AgentAnalytics';

interface AgentDashboardPageProps {
  onNavigate: (page: string) => void;
}

interface AgentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  company_name: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string;
  created_at: string;
}

interface AgentBooking {
  id: string;
  agent_id: string;
  batch_id: string | null;
  service_type: string;
  hiring_type: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  location: string;
  preferred_date: string | null;
  description: string | null;
  status: string;
  admin_notes: string;
  created_at: string;
}

interface BookingBatch {
  batch_id: string | null;
  items: AgentBooking[];
  created_at: string;
}

type Tab = 'overview' | 'bookings' | 'request' | 'analytics' | 'direct' | 'profile';

interface AgentDirectMessage {
  id: string;
  agent_id: string;
  admin_id: string;
  sender_id: string;
  message: string;
  read: boolean;
  read_at: string | null;
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
  new:       { label: 'Pending',   color: 'bg-blue-100 text-blue-800 border-blue-200',         icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800 border-yellow-200',   icon: Phone },
  confirmed: { label: 'Confirmed', color: 'bg-sky-100 text-sky-800 border-sky-200',            icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200',      icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200',            icon: XCircle },
};

interface ServiceItem {
  id: string;
  service_type: string;
  hiring_type: string;
  preferred_date: string;
  description: string;
}

const newServiceItem = (): ServiceItem => ({
  id: crypto.randomUUID(),
  service_type: SERVICE_TYPES[0],
  hiring_type: 'contract',
  preferred_date: '',
  description: '',
});

// Group flat bookings by batch_id
function groupIntoBatches(bookings: AgentBooking[]): BookingBatch[] {
  const map = new Map<string, AgentBooking[]>();
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

export default function AgentDashboardPage({ onNavigate }: AgentDashboardPageProps) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  // Shared client fields (same for all services in one submission)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [sharedLocation, setSharedLocation] = useState('');

  // Per-service items
  const [services, setServices] = useState<ServiceItem[]>([newServiceItem()]);

  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState('');
  const [submittedCount, setSubmittedCount] = useState(0);

  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', location: '', company_name: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Direct messages
  const [directMessages, setDirectMessages] = useState<AgentDirectMessage[]>([]);
  const [directDraft, setDirectDraft] = useState('');
  const [directSending, setDirectSending] = useState(false);
  const [directUnread, setDirectUnread] = useState(0);
  const directEndRef = useRef<HTMLDivElement>(null);
  const directChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) { onNavigate('agent-login'); return; }
    loadData();
    return () => { directChannelRef.current?.unsubscribe(); };
  }, [user]);

  useEffect(() => {
    directEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages]);

  useEffect(() => {
    if (tab === 'direct' && user && profile) loadDirectMessages();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadProfile(), loadBookings(), loadDirectUnread()]);
    setLoading(false);
  };

  const loadDirectUnread = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('agent_messages')
      .select('id')
      .eq('agent_id', user.id)
      .eq('read', false)
      .neq('sender_id', user.id);
    setDirectUnread((data || []).length);
  };

  const loadDirectMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: true });
    setDirectMessages(data || []);
    // mark admin messages as read
    await supabase
      .from('agent_messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('agent_id', user.id)
      .eq('read', false)
      .neq('sender_id', user.id);
    setDirectUnread(0);
    // real-time
    directChannelRef.current?.unsubscribe();
    directChannelRef.current = supabase
      .channel(`adm-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'agent_messages',
        filter: `agent_id=eq.${user.id}`,
      }, payload => {
        const msg = payload.new as AgentDirectMessage;
        setDirectMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (msg.sender_id !== user.id) {
          supabase.from('agent_messages').update({ read: true, read_at: new Date().toISOString() }).eq('id', msg.id);
        }
      })
      .subscribe();
  };

  const sendDirectMessage = async () => {
    if (!directDraft.trim() || !user) return;
    setDirectSending(true);
    const text = directDraft.trim();
    setDirectDraft('');
    // agent_id = user.id; admin_id = look up from existing message or default to user.id temporarily
    const adminId = directMessages.find(m => m.sender_id !== user.id)?.admin_id ?? null;
    if (!adminId) {
      // No admin has messaged yet — show error
      setDirectDraft(text);
      setDirectSending(false);
      return;
    }
    const { data: inserted, error } = await supabase
      .from('agent_messages')
      .insert({
        agent_id: user.id,
        admin_id: adminId,
        sender_id: user.id,
        message: text,
        read: false,
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
      .from('agent_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setProfileForm({
        full_name: data.full_name,
        phone: data.phone,
        location: data.location,
        company_name: data.company_name,
      });
    }
  };

  const loadBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('agent_bookings')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false });
    setBookings(data || []);
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
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setSharedLocation('');
    setServices([newServiceItem()]);
  };

  // ── Submit all services in one batch ──
  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError('');

    if (!clientName.trim()) { setReqError('Client name is required.'); return; }
    if (!clientPhone.trim()) { setReqError('Client phone is required.'); return; }
    if (!sharedLocation.trim()) { setReqError('Location is required.'); return; }

    setReqSubmitting(true);
    try {
      const batchId = crypto.randomUUID();
      const rows = services.map(svc => ({
        agent_id: user?.id,
        batch_id: batchId,
        service_type: svc.service_type,
        hiring_type: svc.hiring_type,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: clientEmail.trim(),
        location: sharedLocation.trim(),
        preferred_date: svc.preferred_date || null,
        description: svc.description.trim() || null,
        status: 'new',
      }));

      const { error } = await supabase.from('agent_bookings').insert(rows);
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
      .from('agent_profiles')
      .update({
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim(),
        location: profileForm.location.trim(),
        company_name: profileForm.company_name.trim(),
      })
      .eq('id', user?.id);
    if (error) setProfileMsg('Failed to save changes.');
    else {
      setProfileMsg('Profile updated successfully.');
      setEditProfile(false);
      await loadProfile();
    }
    setProfileSaving(false);
  };

  const batches = groupIntoBatches(bookings);

  const filteredBatches = batches.filter(batch => {
    const matchSearch = bookingSearch === '' ||
      batch.items.some(b =>
        b.client_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.service_type.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.location.toLowerCase().includes(bookingSearch.toLowerCase())
      );
    const matchFilter = bookingFilter === 'all' || batch.items.some(b => b.status === bookingFilter);
    return matchSearch && matchFilter;
  });

  const stats = {
    total: batches.length,
    active: bookings.filter(b => ['new', 'contacted', 'confirmed'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics',        icon: BarChart2 },
    { id: 'bookings',  label: 'My Bookings',      icon: CalendarCheck },
    { id: 'request',   label: 'New Request',      icon: PlusCircle },
    { id: 'direct',    label: 'Direct Messages',  icon: Bell, badge: directUnread },
    { id: 'profile',   label: 'My Profile',       icon: User },
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
            <h1 className="text-xl font-bold mt-3">Agent Portal</h1>
          </div>
          <div className="px-8 py-10 text-center space-y-5">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Clock size={32} className="text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Account Pending Approval</h2>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                Welcome, <strong>{profile.full_name}</strong>! Your application is under review.
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
              <p className="text-gray-500 mt-2 text-sm">Unfortunately, your agent application has been rejected.</p>
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
        } fixed inset-y-0 left-0 w-64 bg-gradient-dark text-white shadow-xl transform transition-transform duration-300 lg:translate-x-0 lg:static z-50 flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Logo size="sm" variant="icon-only" />
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:bg-white/10 p-1 rounded transition-colors">
              <X size={24} />
            </button>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">{profile?.full_name || 'Agent'}</h1>
            {profile?.company_name && (
              <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                <Building2 size={11} />{profile.company_name}
              </p>
            )}
            <span className="inline-flex items-center gap-1 mt-2 bg-green-500/20 text-green-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-500/30">
              <CheckCircle size={10} /> Approved Agent
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
                onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive ? 'bg-gradient-primary text-white shadow-lg' : 'text-slate-300 hover:bg-white/10'
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
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-3 rounded-lg font-semibold transition-all border border-red-500/30"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between lg:hidden">
          <Logo size="sm" variant="icon-only" />
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 p-1">
            <Menu size={24} />
          </button>
        </div>

        <div className="hidden lg:flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              {(() => { const Icon = navItems.find(n => n.id === tab)?.icon || LayoutDashboard; return <Icon size={20} className="text-white" />; })()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{navItems.find(n => n.id === tab)?.label}</h2>
              <p className="text-sm text-slate-500">Agent Portal — Danhausa Home Services</p>
            </div>
          </div>
          <span className="text-sm text-gray-500">{profile?.email}</span>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.full_name?.split(' ')[0]}!</h1>
                <p className="text-gray-500 mt-1 text-sm">Here's a summary of your agent activity.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Submissions',  value: stats.total,     color: 'from-primary-500 to-primary-600',     icon: Package },
                  { label: 'Active',       value: stats.active,    color: 'from-secondary-500 to-secondary-600', icon: Clock },
                  { label: 'Completed',    value: stats.completed, color: 'from-green-500 to-emerald-600',       icon: CheckCircle },
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
                      return (
                        <button
                          key={batch.batch_id ?? first.id}
                          onClick={() => setTab('bookings')}
                          className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {batch.items.length > 1
                                ? `${batch.items.length} services — ${first.client_name}`
                                : first.service_type}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <User size={11} />{first.client_name} · <MapPin size={11} />{first.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
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
                  className="flex items-center gap-4 bg-white border-2 border-primary-100 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all text-left"
                >
                  <div className="bg-primary-100 p-3 rounded-xl">
                    <ListChecks size={22} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Multi-Service Request</p>
                    <p className="text-sm text-gray-500">Book multiple services for one client</p>
                  </div>
                </button>
                <button
                  onClick={() => setTab('bookings')}
                  className="flex items-center gap-4 bg-white border-2 border-secondary-100 rounded-xl p-5 hover:border-secondary-300 hover:shadow-md transition-all text-left"
                >
                  <div className="bg-secondary-100 p-3 rounded-xl">
                    <CalendarCheck size={22} className="text-secondary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">View All Requests</p>
                    <p className="text-sm text-gray-500">Track status of all requests</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {tab === 'bookings' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-gray-500 mt-1 text-sm">All your submitted client requests</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by client, service, location…"
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                  />
                </div>
                <div className="relative">
                  <Filter size={15} className="absolute left-3 top-3 text-gray-400" />
                  <select
                    value={bookingFilter}
                    onChange={e => setBookingFilter(e.target.value)}
                    className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm bg-white"
                  >
                    <option value="all">All Statuses</option>
                    {Object.entries(statusMeta).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
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

                    const overallStatus = batch.items.every(i => i.status === 'completed')
                      ? 'completed'
                      : batch.items.some(i => i.status === 'cancelled') ? 'cancelled'
                      : batch.items.some(i => i.status === 'confirmed') ? 'confirmed'
                      : batch.items.some(i => i.status === 'contacted') ? 'contacted'
                      : 'new';

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
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                <User size={11} className="text-gray-400" />
                                <strong>{first.client_name}</strong>
                                <span className="text-gray-400 mx-1">·</span>
                                <Phone size={11} className="text-gray-400" />{first.client_phone}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <MapPin size={11} />{first.location}
                                {isBatch && (
                                  <span className="ml-1 text-gray-300">· {batch.items.map(i => i.service_type).join(', ')}</span>
                                )}
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
                            {/* Client info banner */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Client Details</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-sm text-gray-700">
                                <span className="flex items-center gap-1.5"><User size={13} className="text-gray-400" />{first.client_name}</span>
                                <span className="flex items-center gap-1.5"><Phone size={13} className="text-gray-400" />{first.client_phone}</span>
                                {first.client_email && (
                                  <span className="flex items-center gap-1.5"><Mail size={13} className="text-gray-400" />{first.client_email}</span>
                                )}
                                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" />{first.location}</span>
                              </div>
                            </div>

                            {/* Service line items */}
                            {batch.items.map((b, idx) => {
                              const itemMeta = statusMeta[b.status] || statusMeta.new;
                              const ItemIcon = itemMeta.icon;
                              return (
                                <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {isBatch && <span className="text-gray-400 font-normal mr-1">#{idx + 1}</span>}
                                        {b.service_type}
                                      </p>
                                      <p className="text-xs text-gray-500 capitalize">{b.hiring_type}</p>
                                    </div>
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${itemMeta.color}`}>
                                      <ItemIcon size={10} />{itemMeta.label}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    {b.preferred_date && (
                                      <span className="flex items-center gap-1"><Calendar size={11} className="text-gray-400" />{new Date(b.preferred_date).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                  {b.description && (
                                    <p className="text-xs text-gray-500 mt-2 italic">{b.description}</p>
                                  )}
                                  {b.admin_notes && (
                                    <div className="mt-2 bg-primary-50 border border-primary-100 rounded-lg px-3 py-1.5 text-xs text-primary-800">
                                      <strong>Admin:</strong> {b.admin_notes}
                                    </div>
                                  )}
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
                <p className="text-gray-500 mt-1 text-sm">Enter client details, then add one or more services</p>
              </div>

              {reqSuccess ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {submittedCount === 1 ? 'Request Submitted!' : `${submittedCount} Requests Submitted!`}
                  </h2>
                  <p className="text-gray-500 text-sm">Your request{submittedCount > 1 ? 's have' : ' has'} been sent to the admin team for processing.</p>
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

                  {/* Client details — shared across all services */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-900 text-sm">Client Details</h3>
                      <p className="text-xs text-gray-500 mt-0.5">These details apply to all services in this submission</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Client Full Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-3 text-gray-400" />
                          <input
                            type="text"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                            placeholder="Client's full name"
                            required
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Client Phone <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-3 text-gray-400" />
                          <input
                            type="tel"
                            value={clientPhone}
                            onChange={e => setClientPhone(e.target.value)}
                            placeholder="Client's phone number"
                            required
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Client Email <span className="text-gray-400 font-normal">(optional)</span></label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
                          <input
                            type="email"
                            value={clientEmail}
                            onChange={e => setClientEmail(e.target.value)}
                            placeholder="client@email.com"
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                          <input
                            type="text"
                            value={sharedLocation}
                            onChange={e => setSharedLocation(e.target.value)}
                            placeholder="City / Area"
                            required
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                          />
                        </div>
                      </div>
                    </div>
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

                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Service type */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Service Type</label>
                            <div className="relative">
                              <select
                                value={svc.service_type}
                                onChange={e => updateService(svc.id, 'service_type', e.target.value)}
                                className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 bg-white pr-8 text-sm"
                              >
                                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                            </div>
                          </div>

                          {/* Hiring type */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Hiring Type</label>
                            <div className="flex gap-3">
                              {(['contract', 'permanent'] as const).map(t => (
                                <label key={t} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-semibold capitalize ${
                                  svc.hiring_type === t
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}>
                                  <input type="radio" name={`hiring_${svc.id}`} value={t}
                                    checked={svc.hiring_type === t}
                                    onChange={() => updateService(svc.id, 'hiring_type', t)}
                                    className="sr-only" />
                                  {t}
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Preferred date */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Date <span className="text-gray-400 font-normal">(optional)</span></label>
                            <div className="relative">
                              <Calendar size={14} className="absolute left-3 top-3 text-gray-400" />
                              <input
                                type="date"
                                value={svc.preferred_date}
                                onChange={e => updateService(svc.id, 'preferred_date', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                            <textarea
                              value={svc.description}
                              onChange={e => updateService(svc.id, 'description', e.target.value)}
                              rows={2}
                              placeholder="Specific requirements, skills needed..."
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm resize-none"
                            />
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
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                    ) : (
                      <><CheckCircle size={18} />Submit {services.length === 1 ? 'Request' : `${services.length} Requests`}</>
                    )}
                  </button>
                </form>
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
                      <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mb-4">
                        <Bell size={28} className="text-sky-400" />
                      </div>
                      <p className="text-gray-700 font-semibold">No messages yet</p>
                      <p className="text-gray-400 text-sm mt-1">The admin team will message you here directly</p>
                    </div>
                  ) : (
                    directMessages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-green-600 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-white">AD</span>
                            </div>
                          )}
                          <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                            }`}>
                              {msg.message}
                            </div>
                            <span className="text-[10px] text-gray-400 px-1">
                              {isMe ? 'You' : 'Admin'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={directEndRef} />
                </div>
                <div className="border-t border-gray-200 p-3 bg-white rounded-b-xl shrink-0">
                  {directMessages.length === 0 || !directMessages.find(m => m.sender_id !== user?.id) ? (
                    <p className="text-xs text-gray-400 text-center py-2">You can reply once the admin sends you a message</p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={directDraft}
                        onChange={e => setDirectDraft(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendDirectMessage()}
                        placeholder="Type a reply..."
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
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {tab === 'analytics' && user && (
            <AgentAnalytics agentId={user.id} />
          )}

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <div className="max-w-xl space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-xl p-3">
                      <User size={28} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{profile?.full_name}</h2>
                      <p className="text-white/70 text-sm">{profile?.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1.5 bg-green-500/30 text-green-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> Approved Agent
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
                  <div className="px-6 py-6 space-y-4">
                    {[
                      { label: 'Full Name',    value: profile?.full_name },
                      { label: 'Email',        value: profile?.email },
                      { label: 'Phone',        value: profile?.phone },
                      { label: 'Location',     value: profile?.location },
                      { label: 'Company',      value: profile?.company_name || '—' },
                      { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-sm font-semibold text-gray-500">{row.label}</span>
                        <span className="text-sm text-gray-900 font-medium text-right">{row.value}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => setEditProfile(true)}
                      className="w-full mt-2 border-2 border-primary-200 text-primary-700 py-2.5 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-sm"
                    >
                      Edit Profile
                    </button>
                  </div>
                ) : (
                  <form onSubmit={saveProfile} className="px-6 py-6 space-y-4">
                    {[
                      { label: 'Full Name', field: 'full_name',    type: 'text' },
                      { label: 'Phone',     field: 'phone',        type: 'tel' },
                      { label: 'Location',  field: 'location',     type: 'text' },
                      { label: 'Company',   field: 'company_name', type: 'text' },
                    ].map(({ label, field, type }) => (
                      <div key={field}>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</label>
                        <input
                          type={type}
                          value={profileForm[field as keyof typeof profileForm]}
                          onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                        />
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
