import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Clock, User, Phone, MapPin, Building2,
  Search, RefreshCw, ChevronDown, ChevronUp, CalendarCheck, Eye,
  Mail,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

const statusStyles: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const bookingStatusStyles: Record<string, string> = {
  new:       'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-sky-100 text-sky-800 border-sky-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export default function AgentManagement() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [agentBookings, setAgentBookings] = useState<Record<string, AgentBooking[]>>({});
  const [loadingBookings, setLoadingBookings] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});
  const [bookingStatusUpdates, setBookingStatusUpdates] = useState<Record<string, string>>({});

  useEffect(() => { loadAgents(); }, []);

  const loadAgents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agent_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setAgents(data || []);
    setLoading(false);
  };

  const loadAgentBookings = async (agentId: string) => {
    setLoadingBookings(agentId);
    const { data } = await supabase
      .from('agent_bookings')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    setAgentBookings(prev => ({ ...prev, [agentId]: data || [] }));
    setLoadingBookings(null);
  };

  const toggleExpand = (agentId: string) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agentId);
      if (!agentBookings[agentId]) loadAgentBookings(agentId);
    }
  };

  const updateAgentStatus = async (agentId: string, status: 'approved' | 'rejected') => {
    setUpdatingId(agentId);
    const note = noteEdits[agentId] ?? agents.find(a => a.id === agentId)?.admin_notes ?? '';
    await supabase
      .from('agent_profiles')
      .update({ status, admin_notes: note })
      .eq('id', agentId);
    await loadAgents();
    setUpdatingId(null);
  };

  const saveNote = async (agentId: string) => {
    setUpdatingId(agentId);
    await supabase
      .from('agent_profiles')
      .update({ admin_notes: noteEdits[agentId] ?? '' })
      .eq('id', agentId);
    await loadAgents();
    setNoteEdits(prev => { const n = { ...prev }; delete n[agentId]; return n; });
    setUpdatingId(null);
  };

  const updateBookingStatus = async (bookingId: string, agentId: string, status: string) => {
    await supabase
      .from('agent_bookings')
      .update({ status })
      .eq('id', bookingId);
    await loadAgentBookings(agentId);
  };

  const filtered = agents.filter(a => {
    const matchSearch = search === '' ||
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase()) ||
      a.company_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    pending:  agents.filter(a => a.status === 'pending').length,
    approved: agents.filter(a => a.status === 'approved').length,
    rejected: agents.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending',  value: counts.pending,  color: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: Clock },
          { label: 'Approved', value: counts.approved, color: 'bg-green-50 border-green-200 text-green-700',   icon: CheckCircle },
          { label: 'Rejected', value: counts.rejected, color: 'bg-red-50 border-red-200 text-red-700',         icon: XCircle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <Icon size={20} className="mb-2 opacity-70" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize transition-all border ${
                statusFilter === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
              }`}
            >
              {s}
            </button>
          ))}
          <button onClick={loadAgents} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Agent list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <User size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No agents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(agent => {
            const isExpanded = expandedAgent === agent.id;
            const bookings = agentBookings[agent.id] || [];
            const noteVal = noteEdits[agent.id] ?? agent.admin_notes;

            return (
              <div key={agent.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Agent header row */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary-100 rounded-xl p-2.5 shrink-0">
                      <User size={22} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{agent.full_name}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusStyles[agent.status]}`}>
                          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" />{agent.email}</span>
                        <span className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" />{agent.phone}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400" />{agent.location}</span>
                        {agent.company_name && (
                          <span className="flex items-center gap-1.5"><Building2 size={12} className="text-gray-400" />{agent.company_name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Registered {new Date(agent.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {agent.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateAgentStatus(agent.id, 'approved')}
                            disabled={updatingId === agent.id}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => updateAgentStatus(agent.id, 'rejected')}
                            disabled={updatingId === agent.id}
                            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                      {agent.status === 'approved' && (
                        <button
                          onClick={() => updateAgentStatus(agent.id, 'rejected')}
                          disabled={updatingId === agent.id}
                          className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <XCircle size={14} /> Revoke
                        </button>
                      )}
                      {agent.status === 'rejected' && (
                        <button
                          onClick={() => updateAgentStatus(agent.id, 'approved')}
                          disabled={updatingId === agent.id}
                          className="flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <CheckCircle size={14} /> Re-approve
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpand(agent.id)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
                        title="View details & bookings"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Admin note */}
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={noteVal}
                      onChange={e => setNoteEdits(prev => ({ ...prev, [agent.id]: e.target.value }))}
                      placeholder="Add admin note (optional)"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100"
                    />
                    {noteEdits[agent.id] !== undefined && (
                      <button
                        onClick={() => saveNote(agent.id)}
                        disabled={updatingId === agent.id}
                        className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded: agent bookings */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-slate-50 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <CalendarCheck size={16} className="text-primary-600" />
                        Agent Requests
                      </h4>
                      <button
                        onClick={() => loadAgentBookings(agent.id)}
                        className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Refresh
                      </button>
                    </div>

                    {loadingBookings === agent.id ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                      </div>
                    ) : bookings.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No requests submitted yet</p>
                    ) : (
                      <div className="space-y-3">
                        {bookings.map(b => (
                          <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{b.service_type}</p>
                                <p className="text-xs text-gray-500 capitalize">{b.hiring_type}</p>
                              </div>
                              <select
                                value={bookingStatusUpdates[b.id] ?? b.status}
                                onChange={async e => {
                                  const newStatus = e.target.value;
                                  setBookingStatusUpdates(prev => ({ ...prev, [b.id]: newStatus }));
                                  await updateBookingStatus(b.id, agent.id, newStatus);
                                }}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${bookingStatusStyles[bookingStatusUpdates[b.id] ?? b.status] || bookingStatusStyles.new}`}
                              >
                                <option value="new">Pending</option>
                                <option value="contacted">Contacted</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                              <span className="flex items-center gap-1"><User size={11} className="text-gray-400" />{b.client_name}</span>
                              <span className="flex items-center gap-1"><Phone size={11} className="text-gray-400" />{b.client_phone}</span>
                              <span className="flex items-center gap-1"><MapPin size={11} className="text-gray-400" />{b.location}</span>
                              {b.preferred_date && (
                                <span className="flex items-center gap-1"><CalendarCheck size={11} className="text-gray-400" />{b.preferred_date}</span>
                              )}
                            </div>
                            {b.description && <p className="text-xs text-gray-500 mt-2 italic">{b.description}</p>}
                            <p className="text-xs text-gray-400 mt-2">{new Date(b.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
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
