import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Minus, CheckCircle, Clock, XCircle,
  Phone, BarChart2, Activity, Target, AlertCircle, RefreshCw,
  ArrowUpRight, ArrowDownRight, Layers, Users, CalendarDays,
  Zap, ListChecks, Package,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AgentBooking {
  id: string;
  batch_id: string | null;
  service_type: string;
  hiring_type: string;
  client_name: string;
  status: string;
  created_at: string;
  preferred_date: string | null;
}

interface AgentProfile {
  full_name: string;
  company_name: string;
  location: string;
  status: string;
  created_at: string;
}

interface Props {
  agentId: string;
}

// ── pure SVG / CSS micro-charts ──────────────────────────────────────────────

function SparkLine({ values, color = '#2563eb' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <div className="h-10" />;
  const max = Math.max(...values, 1);
  const w = 100, h = 40;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" points={pts} />
      <polyline fill={`${color}22`} stroke="none" points={`0,${h} ${pts} ${w},${h}`} />
    </svg>
  );
}

function DonutRing({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-28 text-gray-300 text-xs">No data</div>;
  const r = 38, circ = 2 * Math.PI * r;
  let off = 0;
  const arcs = segments.filter(s => s.value > 0).map(seg => {
    const dash = (seg.value / total) * circ;
    const arc = { ...seg, dash, offset: circ - off, gap: circ - dash };
    off += dash;
    return arc;
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="20" />
        {arcs.map((arc, i) => (
          <circle key={i} cx="50" cy="50" r={r} fill="none"
            stroke={arc.color} strokeWidth="20"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={arc.offset} />
        ))}
      </svg>
      <div className="space-y-2 min-w-0">
        {segments.filter(s => s.value > 0).map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-500 truncate">{seg.label}</span>
            <span className="font-bold text-gray-800 ml-auto pl-2">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  sparkline?: number[];
}

function KpiCard({ label, value, sub, trend, icon: Icon, gradient, sparkline }: KpiProps) {
  const up = trend !== undefined && trend > 0;
  const down = trend !== undefined && trend < 0;
  const TrendIcon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  const trendCls = up ? 'text-emerald-500' : down ? 'text-red-400' : 'text-gray-400';
  const sparkColor = gradient.includes('green') ? '#22c55e'
    : gradient.includes('amber') || gradient.includes('yellow') ? '#f59e0b'
    : gradient.includes('red') ? '#ef4444'
    : '#3b82f6';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`bg-gradient-to-br ${gradient} p-2.5 rounded-xl`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${trendCls}`}>
            <TrendIcon size={13} />{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="mt-auto pt-1">
          <SparkLine values={sparkline} color={sparkColor} />
        </div>
      )}
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getLast12Months() {
  const result: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

function shortMonth(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' });
}

function trendVsPrev(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : undefined;
  return Math.round(((curr - prev) / prev) * 100);
}

function cutoffDate(days: number) {
  const d = new Date(); d.setDate(d.getDate() - days); return d;
}

// unique batch count
function countBatches(items: AgentBooking[]) {
  const seen = new Set<string>();
  items.forEach(b => seen.add(b.batch_id ?? b.id));
  return seen.size;
}

// determine overall batch status (worst-case)
function batchStatus(items: AgentBooking[]): string {
  const priority = ['new', 'contacted', 'confirmed', 'cancelled', 'completed'];
  let best = 'completed';
  for (const b of items) {
    if (priority.indexOf(b.status) < priority.indexOf(best)) best = b.status;
  }
  return best;
}

// ── main component ────────────────────────────────────────────────────────────

export default function AgentAnalytics({ agentId }: Props) {
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '12m' | 'all'>('90d');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => { loadAll(); }, [agentId]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadBookings(), loadProfile()]);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  const loadBookings = async () => {
    const { data } = await supabase
      .from('agent_bookings')
      .select('id, batch_id, service_type, hiring_type, client_name, status, created_at, preferred_date')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true });
    setBookings(data || []);
  };

  const loadProfile = async () => {
    const { data } = await supabase
      .from('agent_profiles')
      .select('full_name, company_name, location, status, created_at')
      .eq('id', agentId)
      .maybeSingle();
    setProfile(data);
  };

  // ── filtered sets ─────────────────────────────────────────────────────────
  const rangeBookings = useMemo(() => {
    if (timeRange === 'all') return bookings;
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const c = cutoffDate(days);
    return bookings.filter(b => new Date(b.created_at) >= c);
  }, [bookings, timeRange]);

  const prevBookings = useMemo(() => {
    if (timeRange === 'all') return [];
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const end = cutoffDate(days);
    const start = new Date(end); start.setDate(start.getDate() - days);
    return bookings.filter(b => { const d = new Date(b.created_at); return d >= start && d < end; });
  }, [bookings, timeRange]);

  // ── computed metrics ─────────────────────────────────────────────────────
  const m = useMemo(() => {
    const total = rangeBookings.length;
    const completed = rangeBookings.filter(b => b.status === 'completed').length;
    const cancelled = rangeBookings.filter(b => b.status === 'cancelled').length;
    const active = rangeBookings.filter(b => ['new', 'contacted', 'confirmed'].includes(b.status)).length;
    const contacted = rangeBookings.filter(b => b.status === 'contacted').length;
    const confirmed = rangeBookings.filter(b => b.status === 'confirmed').length;
    const newCount = rangeBookings.filter(b => b.status === 'new').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    const contactRate = total > 0 ? Math.round(((contacted + confirmed + completed) / total) * 100) : 0;

    const totalBatches = countBatches(rangeBookings);
    const prevTotal = prevBookings.length;
    const prevCompleted = prevBookings.filter(b => b.status === 'completed').length;
    const prevBatches = countBatches(prevBookings);

    // service breakdown
    const serviceMap: Record<string, number> = {};
    rangeBookings.forEach(b => { serviceMap[b.service_type] = (serviceMap[b.service_type] || 0) + 1; });
    const serviceBreakdown = Object.entries(serviceMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // hiring type
    const contractCount = rangeBookings.filter(b => b.hiring_type === 'contract').length;
    const permanentCount = rangeBookings.filter(b => b.hiring_type === 'permanent').length;

    // unique clients
    const uniqueClients = new Set(rangeBookings.map(b => b.client_name.trim().toLowerCase())).size;
    const prevUniqueClients = new Set(prevBookings.map(b => b.client_name.trim().toLowerCase())).size;

    // monthly trends (12 months — all bookings)
    const months = getLast12Months();
    const monthlyData = months.map(ym => ({
      label: shortMonth(ym),
      total: bookings.filter(b => b.created_at.startsWith(ym)).length,
      completed: bookings.filter(b => b.created_at.startsWith(ym) && b.status === 'completed').length,
      batches: countBatches(bookings.filter(b => b.created_at.startsWith(ym))),
    }));

    // multi-service batches (batch_id not null)
    const multiBatches = rangeBookings.filter(b => b.batch_id !== null);
    const singleBookings = rangeBookings.filter(b => b.batch_id === null);

    // avg services per batch
    const batchMap = new Map<string, number>();
    rangeBookings.forEach(b => {
      const k = b.batch_id ?? b.id;
      batchMap.set(k, (batchMap.get(k) ?? 0) + 1);
    });
    const avgPerBatch = batchMap.size > 0
      ? (Array.from(batchMap.values()).reduce((s, v) => s + v, 0) / batchMap.size).toFixed(1)
      : '1.0';

    // peak month
    const peakMonth = monthlyData.reduce((a, b) => b.total > a.total ? b : a, monthlyData[0]);

    // active streak
    let streak = 0;
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      if (monthlyData[i].total > 0) streak++;
      else break;
    }

    // top client by volume
    const clientMap: Record<string, number> = {};
    rangeBookings.forEach(b => {
      const k = b.client_name.trim();
      clientMap[k] = (clientMap[k] ?? 0) + 1;
    });
    const topClient = Object.entries(clientMap).sort((a, b) => b[1] - a[1])[0];

    return {
      total, completed, cancelled, active, contacted, confirmed, newCount,
      completionRate, cancellationRate, contactRate,
      totalBatches, prevTotal, prevCompleted, prevBatches,
      serviceBreakdown, contractCount, permanentCount,
      uniqueClients, prevUniqueClients,
      monthlyData, multiBatches: multiBatches.length, singleBookings: singleBookings.length,
      avgPerBatch, peakMonth, streak, topClient,
      trends: {
        total: trendVsPrev(total, prevTotal),
        completed: trendVsPrev(completed, prevCompleted),
        batches: trendVsPrev(totalBatches, prevBatches),
        clients: trendVsPrev(uniqueClients, prevUniqueClients),
      },
    };
  }, [rangeBookings, prevBookings, bookings]);

  const SERVICE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  const noData = bookings.length === 0;

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Analytics & KPIs</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Performance overview · {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5 text-xs font-semibold">
            {(['30d','90d','12m','all'] as const).map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === r ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {r === '30d' ? '30d' : r === '90d' ? '90d' : r === '12m' ? '12 mo' : 'All'}
              </button>
            ))}
          </div>
          <button onClick={loadAll}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {noData ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <BarChart2 size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No data yet</h3>
          <p className="text-gray-400 text-sm">Submit your first request to start seeing analytics here.</p>
        </div>
      ) : (
        <>
          {/* ── KPI row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Bookings"
              value={m.total}
              sub={timeRange !== 'all' ? `${m.prevTotal} prev period` : `${bookings.length} all time`}
              trend={m.trends.total}
              icon={Layers}
              gradient="from-primary-500 to-primary-600"
              sparkline={m.monthlyData.slice(-8).map(x => x.total)}
            />
            <KpiCard
              label="Completed"
              value={m.completed}
              sub={`${m.completionRate}% completion rate`}
              trend={m.trends.completed}
              icon={CheckCircle}
              gradient="from-emerald-500 to-green-600"
              sparkline={m.monthlyData.slice(-8).map(x => x.completed)}
            />
            <KpiCard
              label="Submissions"
              value={m.totalBatches}
              sub={`Avg ${m.avgPerBatch} service${Number(m.avgPerBatch) !== 1 ? 's' : ''} per submission`}
              trend={m.trends.batches}
              icon={ListChecks}
              gradient="from-sky-500 to-blue-600"
              sparkline={m.monthlyData.slice(-8).map(x => x.batches)}
            />
            <KpiCard
              label="Unique Clients"
              value={m.uniqueClients}
              sub={timeRange !== 'all' ? `${m.prevUniqueClients} prev period` : 'All time'}
              trend={m.trends.clients}
              icon={Users}
              gradient="from-amber-400 to-orange-500"
            />
          </div>

          {/* ── Secondary KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Completion Rate',
                value: `${m.completionRate}%`,
                bar: m.completionRate,
                barColor: m.completionRate >= 70 ? '#22c55e' : m.completionRate >= 40 ? '#f59e0b' : '#ef4444',
                icon: Target,
                iconCls: m.completionRate >= 70 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50',
              },
              {
                label: 'Cancellation Rate',
                value: `${m.cancellationRate}%`,
                bar: m.cancellationRate,
                barColor: m.cancellationRate <= 10 ? '#22c55e' : m.cancellationRate <= 25 ? '#f59e0b' : '#ef4444',
                icon: XCircle,
                iconCls: m.cancellationRate <= 10 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50',
              },
              {
                label: 'Contact Rate',
                value: `${m.contactRate}%`,
                bar: m.contactRate,
                barColor: '#3b82f6',
                icon: Phone,
                iconCls: 'text-primary-600 bg-primary-50',
              },
              {
                label: 'Active Streak',
                value: `${m.streak} mo`,
                bar: Math.min(m.streak * 10, 100),
                barColor: '#8b5cf6',
                icon: Zap,
                iconCls: 'text-violet-600 bg-violet-50',
              },
            ].map(item => {
              const Icon = item.icon;
              const [iconColor, iconBg] = item.iconCls.split(' ');
              return (
                <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${iconBg}`}>
                      <Icon size={13} className={iconColor} />
                    </div>
                    <p className="text-xs font-semibold text-gray-600 leading-tight">{item.label}</p>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 mb-2">{item.value}</p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(item.bar, 100)}%`, backgroundColor: item.barColor }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Monthly trend + status donut ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Monthly bar chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Monthly Booking Activity</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Submitted vs completed over 12 months</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block bg-blue-200" />Submitted</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block bg-emerald-500" />Completed</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-36">
                {m.monthlyData.map(mo => {
                  const maxVal = Math.max(...m.monthlyData.map(d => d.total), 1);
                  const totalH = Math.max((mo.total / maxVal) * 112, mo.total > 0 ? 4 : 0);
                  const doneH = Math.max((mo.completed / maxVal) * 112, mo.completed > 0 ? 2 : 0);
                  return (
                    <div key={mo.label} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full" style={{ height: 112 }}
                        title={`${mo.label}: ${mo.total} submitted, ${mo.completed} completed`}>
                        {mo.total > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-blue-200"
                            style={{ height: totalH }} />
                        )}
                        {mo.completed > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-emerald-500"
                            style={{ height: doneH }} />
                        )}
                        {mo.total > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {mo.total} / {mo.completed}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400">{mo.label}</span>
                    </div>
                  );
                })}
              </div>
              {m.peakMonth?.total > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                  <TrendingUp size={12} className="text-primary-500" />
                  Peak month: <span className="font-semibold text-gray-700">{m.peakMonth.label}</span> — {m.peakMonth.total} booking{m.peakMonth.total !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Status donut */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">Booking Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">Current period breakdown</p>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <DonutRing segments={[
                  { label: 'Completed',  value: m.completed,  color: '#22c55e' },
                  { label: 'Confirmed',  value: m.confirmed,  color: '#0ea5e9' },
                  { label: 'Contacted',  value: m.contacted,  color: '#f59e0b' },
                  { label: 'Pending',    value: m.newCount,   color: '#3b82f6' },
                  { label: 'Cancelled',  value: m.cancelled,  color: '#ef4444' },
                ]} />
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Total bookings</p>
                  <p className="font-bold text-gray-900 text-lg">{m.total}</p>
                </div>
                <div>
                  <p className="text-gray-400">Completion rate</p>
                  <p className={`font-bold text-lg ${m.completionRate >= 70 ? 'text-emerald-600' : m.completionRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                    {m.completionRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Service breakdown + batch analysis ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Service breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">Top Services Booked</h3>
                <p className="text-xs text-gray-500 mt-0.5">By number of bookings this period</p>
              </div>
              {m.serviceBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data for this period</p>
              ) : (
                <div className="space-y-3">
                  {m.serviceBreakdown.map(([name, count], i) => {
                    const pct = m.total > 0 ? Math.round((count / m.total) * 100) : 0;
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                              style={{ backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }}>
                              {i + 1}
                            </span>
                            <span className="font-medium text-gray-700 truncate">{name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="font-bold text-gray-900">{count}</span>
                            <span className="text-gray-400 w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submission analysis */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">Submission Analysis</h3>
                <p className="text-xs text-gray-500 mt-0.5">Batch vs single submissions</p>
              </div>
              <div className="space-y-5">
                {/* Multi vs single bar */}
                {[
                  { label: 'Multi-service batches', value: m.multiBatches, color: '#3b82f6', icon: ListChecks },
                  { label: 'Single-service requests', value: m.singleBookings, color: '#10b981', icon: Package },
                ].map(item => {
                  const pct = m.total > 0 ? Math.round((item.value / m.total) * 100) : 0;
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon size={13} style={{ color: item.color }} />
                          <span className="font-medium text-gray-700">{item.label}</span>
                        </div>
                        <span className="font-bold text-gray-900">{item.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Avg services/submission', value: m.avgPerBatch },
                    { label: 'Active pipeline', value: m.active },
                    { label: 'Unique clients', value: m.uniqueClients },
                  ].map(stat => (
                    <div key={stat.label} className="text-center bg-gray-50 rounded-xl p-3">
                      <p className="text-xl font-extrabold text-gray-900">{stat.value}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {m.topClient && (
                  <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Users size={16} className="text-primary-600 shrink-0" />
                    <div className="text-xs">
                      <p className="text-gray-500">Top client by volume</p>
                      <p className="font-bold text-gray-900">{m.topClient[0]} <span className="text-primary-600">({m.topClient[1]} booking{m.topClient[1] !== 1 ? 's' : ''})</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Hiring mix + insights ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Hiring mix */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-1">Hiring Mix</h3>
              <p className="text-xs text-gray-500 mb-5">Contract vs permanent placements</p>
              <div className="space-y-4">
                {[
                  { label: 'Contract',  value: m.contractCount,  color: '#3b82f6' },
                  { label: 'Permanent', value: m.permanentCount, color: '#8b5cf6' },
                ].map(item => {
                  const pct = m.total > 0 ? Math.round((item.value / m.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-semibold text-gray-700">{item.label}</span>
                        <span className="font-bold text-gray-900">{item.value} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                <CalendarDays size={12} className="shrink-0" />
                <span>Member since {profile ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}</span>
              </div>
            </div>

            {/* Insights */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 rounded-lg">
                  <AlertCircle size={15} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Key Insights</h3>
                  <p className="text-xs text-gray-500">Based on your activity data</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  m.completionRate >= 80
                    ? { type: 'positive', text: `Excellent ${m.completionRate}% completion rate — well above the 70% benchmark.` }
                    : m.completionRate >= 50
                    ? { type: 'neutral',  text: `${m.completionRate}% completion rate. Work towards 70%+ by following up on open bookings.` }
                    : m.total > 0
                    ? { type: 'warning',  text: `Low completion rate (${m.completionRate}%). Review pending bookings to improve fulfilment.` }
                    : null,

                  m.cancellationRate > 25
                    ? { type: 'warning', text: `High cancellation rate (${m.cancellationRate}%). Reviewing booking quality may help.` }
                    : m.cancellationRate > 0
                    ? { type: 'neutral', text: `${m.cancellationRate}% cancellation rate — within a healthy range.` }
                    : m.total > 0
                    ? { type: 'positive', text: 'Zero cancellations this period — excellent consistency.' }
                    : null,

                  m.streak >= 3
                    ? { type: 'positive', text: `${m.streak}-month active streak — strong consistent performance.` }
                    : m.streak >= 1
                    ? { type: 'neutral', text: `${m.streak} active month${m.streak > 1 ? 's' : ''} in a row. Keep the momentum going.` }
                    : null,

                  m.serviceBreakdown.length > 0
                    ? { type: 'info', text: `Most booked service: "${m.serviceBreakdown[0][0]}" (${Math.round((m.serviceBreakdown[0][1] / m.total) * 100)}% of all bookings).` }
                    : null,

                  m.active > 3
                    ? { type: 'info', text: `${m.active} bookings are active in the pipeline. Follow up to move them forward.` }
                    : null,

                  m.uniqueClients > 0
                    ? { type: 'info', text: `You're serving ${m.uniqueClients} unique client${m.uniqueClients !== 1 ? 's' : ''} this period with an avg of ${m.avgPerBatch} service${Number(m.avgPerBatch) !== 1 ? 's' : ''} per submission.` }
                    : null,

                  m.trends.total !== undefined && Math.abs(m.trends.total) > 10
                    ? m.trends.total > 0
                      ? { type: 'positive', text: `Booking volume up ${m.trends.total}% vs last period — activity is growing.` }
                      : { type: 'warning',  text: `Booking volume down ${Math.abs(m.trends.total)}% vs last period.` }
                    : null,

                  m.multiBatches > m.singleBookings && m.total > 0
                    ? { type: 'positive', text: 'Most of your submissions are multi-service batches — efficient client management.' }
                    : null,
                ]
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((ins, i) => {
                    if (!ins) return null;
                    const styles = {
                      positive: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: TrendingUp },
                      warning:  { bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-800',   icon: TrendingDown },
                      neutral:  { bg: 'bg-slate-50 border-slate-200',    text: 'text-slate-700',   icon: Minus },
                      info:     { bg: 'bg-blue-50 border-blue-200',      text: 'text-blue-800',    icon: Activity },
                    };
                    const s = styles[ins.type as keyof typeof styles];
                    const Icon = s.icon;
                    return (
                      <div key={i} className={`flex items-start gap-2 px-3.5 py-3 rounded-xl border ${s.bg}`}>
                        <Icon size={12} className={`shrink-0 mt-0.5 ${s.text}`} />
                        <p className={`text-[11px] leading-relaxed ${s.text}`}>{ins.text}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── Full-width bookings sparkline ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Booking Volume — 12-Month Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5">All bookings submitted over the past year</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-gray-900">{bookings.length}</p>
                <p className="text-xs text-gray-400">all time</p>
              </div>
            </div>
            <SparkLine values={m.monthlyData.map(x => x.total)} color="#3b82f6" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              {m.monthlyData.filter((_, i) => i % 3 === 0 || i === m.monthlyData.length - 1).map(mo => (
                <span key={mo.label}>{mo.label}</span>
              ))}
            </div>
          </div>

          {/* ── Agent profile summary ── */}
          {profile && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 rounded-xl p-3">
                    <Activity size={28} className="text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide font-semibold">Agent Profile</p>
                    <p className="font-bold text-lg">{profile.full_name}</p>
                    {profile.company_name && <p className="text-white/70 text-sm">{profile.company_name}</p>}
                    <p className="text-white/50 text-xs mt-0.5">{profile.location}</p>
                  </div>
                </div>
                <div className="flex gap-6 sm:gap-8">
                  {[
                    { label: 'All-Time',    value: bookings.length },
                    { label: 'Completed',   value: bookings.filter(b => b.status === 'completed').length },
                    { label: 'Status',      value: profile.status.charAt(0).toUpperCase() + profile.status.slice(1) },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                      <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
