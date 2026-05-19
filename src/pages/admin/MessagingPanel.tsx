import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Send, Search, X, MessageSquare, User, Building2,
  Briefcase, Users, ChevronLeft, Circle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type RecipientType = 'provider' | 'agent' | 'customer' | 'business';

interface Contact {
  id: string;    // auth user id for all types
  name: string;
  sub: string;
  unread: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_role?: string;
  message: string;
  created_at: string;
}

// ── Tables config ─────────────────────────────────────────────────────────────
//
//  provider  → admin_provider_messages  keyed by provider_id  (sender_id based)
//  agent     → agent_messages           keyed by agent_id     (sender_id based)
//  customer  → customer_direct_messages keyed by customer_id  (sender_role based)
//  business  → business_direct_messages keyed by business_id  (sender_role based)

const TABLE: Record<RecipientType, string> = {
  provider: 'admin_provider_messages',
  agent:    'agent_messages',
  customer: 'customer_direct_messages',
  business: 'business_direct_messages',
};

const KEY_COL: Record<RecipientType, string> = {
  provider: 'provider_id',
  agent:    'agent_id',
  customer: 'customer_id',
  business: 'business_id',
};

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS: { type: RecipientType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { type: 'provider',  label: 'Providers',  icon: User },
  { type: 'agent',     label: 'Agents',     icon: Briefcase },
  { type: 'customer',  label: 'Customers',  icon: Users },
  { type: 'business',  label: 'Businesses', icon: Building2 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
}

function fmtTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

// ── Avatar ────────────────────────────────────────────────────────────────────

const GRADIENTS: Record<RecipientType, string> = {
  provider: 'from-primary-500 to-primary-600',
  agent:    'from-sky-500 to-blue-600',
  customer: 'from-emerald-500 to-green-600',
  business: 'from-amber-500 to-orange-500',
};

function Avatar({ name, type, size = 'md' }: { name: string; type: RecipientType; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return (
    <div className={`bg-gradient-to-br ${GRADIENTS[type]} ${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MessagingPanel() {
  const [activeTab,      setActiveTab]      = useState<RecipientType>('provider');
  const [contacts,       setContacts]       = useState<Contact[]>([]);
  const [selected,       setSelected]       = useState<Contact | null>(null);
  const [messages,       setMessages]       = useState<ChatMessage[]>([]);
  const [draft,          setDraft]          = useState('');
  const [search,         setSearch]         = useState('');
  const [loadingList,    setLoadingList]    = useState(true);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [sending,        setSending]        = useState(false);
  const [sendError,      setSendError]      = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const endRef     = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  // use a ref so callbacks always read the current admin id without stale closures
  const adminIdRef = useRef('');

  // get admin id once
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) adminIdRef.current = data.user.id;
    });
  }, []);

  // reload contacts when tab changes
  useEffect(() => {
    setSelected(null);
    setMessages([]);
    setSearch('');
    setMobileShowChat(false);
    channelRef.current?.unsubscribe();
    loadContacts(activeTab);
  }, [activeTab]);

  // scroll to bottom
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Contact loaders ───────────────────────────────────────────────────────

  const loadContacts = async (type: RecipientType) => {
    setLoadingList(true);
    try {
      if (type === 'provider') await loadUserContacts('provider_profiles', 'admin_provider_messages', 'provider_id');
      else if (type === 'agent') await loadUserContacts('agent_profiles', 'agent_messages', 'agent_id');
      else if (type === 'customer') await loadCustomerContacts();
      else if (type === 'business') await loadBusinessContacts();
    } finally {
      setLoadingList(false);
    }
  };

  // provider + agent share the same pattern (sender_id based, no sender_role)
  const loadUserContacts = async (profileTable: string, msgTable: string, keyCol: string) => {
    const [{ data: profiles }, { data: unreadMsgs }] = await Promise.all([
      supabase.from(profileTable).select('id, full_name, email').order('full_name'),
      supabase.from(msgTable).select(`${keyCol}, sender_id`).eq('read', false),
    ]);

    // unread = messages NOT sent by admin (i.e. sent by the other party) and not yet read
    const unreadMap: Record<string, number> = {};
    (unreadMsgs || []).forEach((m: Record<string, string>) => {
      if (m.sender_id !== adminIdRef.current) {
        unreadMap[m[keyCol]] = (unreadMap[m[keyCol]] || 0) + 1;
      }
    });

    setContacts((profiles || []).map((p: { id: string; full_name: string; email: string }) => ({
      id: p.id, name: p.full_name, sub: p.email,
      unread: unreadMap[p.id] || 0,
    })));
  };

  const loadCustomerContacts = async () => {
    const [{ data: profiles }, { data: unreadMsgs }] = await Promise.all([
      supabase.from('customer_profiles').select('id, full_name, email').order('full_name'),
      supabase.from('customer_direct_messages')
        .select('customer_id').eq('read_by_admin', false).eq('sender_role', 'customer'),
    ]);

    const unreadMap: Record<string, number> = {};
    (unreadMsgs || []).forEach((m: { customer_id: string }) => {
      unreadMap[m.customer_id] = (unreadMap[m.customer_id] || 0) + 1;
    });

    setContacts((profiles || []).map((p: { id: string; full_name: string; email: string }) => ({
      id: p.id, name: p.full_name, sub: p.email,
      unread: unreadMap[p.id] || 0,
    })));
  };

  const loadBusinessContacts = async () => {
    const [{ data: profiles }, { data: unreadMsgs }] = await Promise.all([
      supabase.from('business_profiles').select('id, company_name, contact_name, email').order('company_name'),
      supabase.from('business_direct_messages')
        .select('business_id').eq('read_by_admin', false).eq('sender_role', 'business'),
    ]);

    const unreadMap: Record<string, number> = {};
    (unreadMsgs || []).forEach((m: { business_id: string }) => {
      unreadMap[m.business_id] = (unreadMap[m.business_id] || 0) + 1;
    });

    setContacts((profiles || []).map((p: { id: string; company_name: string; contact_name: string; email: string }) => ({
      id: p.id, name: p.company_name, sub: p.contact_name || p.email,
      unread: unreadMap[p.id] || 0,
    })));
  };

  // ── Message loaders ───────────────────────────────────────────────────────

  const loadMessages = useCallback(async (contact: Contact, type: RecipientType) => {
    setLoadingMsgs(true);
    setMessages([]);
    channelRef.current?.unsubscribe();

    const table  = TABLE[type];
    const keyCol = KEY_COL[type];
    const aid    = adminIdRef.current;

    // provider + agent tables have no sender_role column; customer + business do
    const cols = (type === 'customer' || type === 'business')
      ? 'id, sender_id, sender_role, message, created_at'
      : 'id, sender_id, message, created_at';

    try {
      const { data, error: fetchErr } = await supabase
        .from(table)
        .select(cols)
        .eq(keyCol, contact.id)
        .order('created_at', { ascending: true });

      if (fetchErr) { setSendError(`Load error: ${fetchErr.message}`); return; }
      setMessages((data as ChatMessage[]) || []);

      // mark admin-side as read
      if (type === 'provider' || type === 'agent') {
        if (aid) {
          await supabase.from(table)
            .update({ read: true, read_at: new Date().toISOString() })
            .eq(keyCol, contact.id)
            .eq('read', false)
            .neq('sender_id', aid);
        }
      } else if (type === 'customer') {
        await supabase.from(table)
          .update({ read_by_admin: true })
          .eq(keyCol, contact.id)
          .eq('read_by_admin', false)
          .eq('sender_role', 'customer');
      } else if (type === 'business') {
        await supabase.from(table)
          .update({ read_by_admin: true })
          .eq(keyCol, contact.id)
          .eq('read_by_admin', false)
          .eq('sender_role', 'business');
      }

      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));

      // real-time subscription
      channelRef.current = supabase
        .channel(`dm-${type}-${contact.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table,
          filter: `${keyCol}=eq.${contact.id}`,
        }, payload => {
          setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new as ChatMessage]);
        })
        .subscribe();
    } finally {
      setLoadingMsgs(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, []);

  const handleSelect = (contact: Contact) => {
    setSelected(contact);
    setMobileShowChat(true);
    loadMessages(contact, activeTab);
  };

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = draft.trim();
    const aid  = adminIdRef.current;
    if (!text || !selected || !aid) return;
    setSending(true);
    setSendError('');

    const table  = TABLE[activeTab];
    const keyCol = KEY_COL[activeTab];

    const row: Record<string, unknown> = {
      [keyCol]:  selected.id,
      admin_id:  aid,
      sender_id: aid,
      message:   text,
    };

    if (activeTab === 'customer') {
      row.sender_role      = 'admin';
      row.read_by_customer = false;
      row.read_by_admin    = true;
    } else if (activeTab === 'business') {
      row.sender_role      = 'admin';
      row.read_by_business = false;
      row.read_by_admin    = true;
    }

    try {
      const { error } = await supabase.from(table).insert(row);
      if (error) throw error;
      setDraft('');
      await loadMessages(selected, activeTab);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered    = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sub.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);

  const isAdminMsg  = (msg: ChatMessage) =>
    msg.sender_role ? msg.sender_role === 'admin' : msg.sender_id === adminIdRef.current;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Direct Messages</h2>
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalUnread} unread
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.type} onClick={() => setActiveTab(tab.type)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                  activeTab === tab.type
                    ? 'border-primary-600 text-primary-700 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Contact list */}
        <div className={`w-full lg:w-80 xl:w-96 shrink-0 bg-white border-r border-gray-200 flex flex-col ${mobileShowChat ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${TABS.find(t => t.type === activeTab)?.label.toLowerCase()}…`}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  No {TABS.find(t => t.type === activeTab)?.label.toLowerCase()} found
                </p>
              </div>
            ) : (
              filtered.map(contact => (
                <button key={contact.id} onClick={() => handleSelect(contact)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-100 transition-colors ${
                    selected?.id === contact.id
                      ? 'bg-primary-50 border-l-[3px] border-l-primary-600'
                      : 'hover:bg-gray-50'
                  }`}>
                  <div className="relative">
                    <Avatar name={contact.name} type={activeTab} size="md" />
                    {contact.unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {contact.unread > 9 ? '9+' : contact.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${contact.unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                      {contact.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{contact.sub}</p>
                  </div>
                  {contact.unread > 0 && (
                    <Circle size={8} className="text-primary-600 fill-primary-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat pane */}
        <div className={`flex-1 flex flex-col min-w-0 ${!mobileShowChat ? 'hidden lg:flex' : 'flex'}`}>
          {selected ? (
            <>
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 shrink-0">
                <button onClick={() => setMobileShowChat(false)}
                  className="lg:hidden mr-1 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronLeft size={18} className="text-gray-600" />
                </button>
                <Avatar name={selected.name} type={activeTab} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-tight truncate">{selected.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selected.sub}</p>
                </div>
                <button onClick={() => { setSelected(null); setMobileShowChat(false); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
                {loadingMsgs ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <MessageSquare size={40} className="text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium text-sm">No messages yet</p>
                    <p className="text-gray-400 text-xs mt-1">Send the first message below</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const mine = isAdminMsg(msg);
                    return (
                      <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
                        {!mine && <Avatar name={selected.name} type={activeTab} size="sm" />}
                        <div className={`max-w-[72%] flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            mine
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-gray-400 px-1">{fmtTime(msg.created_at)}</span>
                        </div>
                        {mine && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-white">AD</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-200 p-4 shrink-0">
                {sendError && (
                  <p className="text-xs text-red-600 mb-2 px-1">{sendError}</p>
                )}
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={`Message ${selected.name}…`}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50 placeholder:text-gray-400"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center">
                    {sending
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send size={16} />
                    }
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 ml-1">Press Enter to send</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <MessageSquare size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-700 font-semibold">No conversation selected</p>
                <p className="text-sm text-gray-400 mt-1">
                  Choose a {TABS.find(t => t.type === activeTab)?.label.slice(0, -1).toLowerCase() ?? 'contact'} from the list
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
