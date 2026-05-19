import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Users, CheckCircle, Clock,
  XCircle, BarChart2, PieChart, Activity, Target, Calendar,
  ArrowUpRight, ArrowDownRight, Layers, Award, AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessBooking {
  id: string;
  batch_id: string | null;
  service_type: string;
  hiring_type: string;
  workers_needed: number;
  status: string;
  created_at: string;
  preferred_date: string | null;
}

interface Props {
  businessId: string;
}

// ── tiny chart helpers (pure CSS / SVG — no external lib) ──────────────────

function SparkLine({ values, color = '#2563eb' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <div className="h-10 flex items-end text-xs text-gray-300">—</div>;
  const max = Math.max(...values, 1);
  const w = 100, h = 40;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" points={pts} />
      <polyline
        fill={color + '22'}
        stroke="none"
        points={`0,${h} ${pts} ${w},${h}`}
      />
    </svg>
  );
}

function MiniBar({ data, color = '#2563eb' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="w-full relative flex items-end justify-center" style={{ height: '72px' }}>
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${Math.max((d.value / max) * 72, d.value > 0 ? 4 : 0)}px`,
                backgroundColor: color,
                opacity: d.value === 0 ? 0.2 : 0.85,
              }}
            />
            {d.value > 0 && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {d.value}
              </span>
            )}
          </div>
          <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutRing({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-28 text-gray-300 text-xs">No data</div>
    );
  }
  const r = 40, cx = 50, cy = 50, stroke = 18;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments
    .filter(s => s.value > 0)
    .map(seg => {
      const pct = seg.value / total;
      const dash = pct * circ;
      const arc = { ...seg, dash, offset: circ - offset, gap: circ - dash };
      offset += dash;
      return arc;
    });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth={stroke}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={arc.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="space-y-1.5 min-w-0">
        {segments.filter(s => s.value > 0).map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600 truncate">{seg.label}</span>
            <span className="font-bold text-gray-800 ml-auto pl-2">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number; // % change vs last period
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;   // tailwind gradient class pair
  sparkline?: number[];
}

function KpiCard({ label, value, sub, trend, icon: Icon, color, sparkline }: KpiCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const TrendIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;
  const trendColor = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className={`bg-gradient-to-br ${color} p-2.5 rounded-xl`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={13} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="mt-auto pt-1">
          <SparkLine values={sparkline} color={color.includes('green') ? '#22c55e' : color.includes('yellow') ? '#f59e0b' : color.includes('red') ? '#ef4444' : '#3b82f6'} />
        </div>
      )}
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function getLast6Weeks(): string[] {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const wk = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('default', { month: 'short' })}`;
    weeks.push(wk);
  }
  return weeks;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' });
}

function pct(change: number): number {
  return Math.round(change);
}

function trendVsPrev(curr: number, prev: number): number | undefined {
  if (prev === 0) return curr > 0 ? 100 : undefined;
  return pct(((curr - prev) / prev) * 100);
}

// ── Main component ─────────────────────────────────────────────────────────

export default function BusinessAnalytics({ businessId }: Props) {
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '12m' | 'all'>('90d');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    loadBookings();
  }, [businessId]);

  const loadBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('business_bookings')
      .select('id, batch_id, service_type, hiring_type, workers_needed, status, created_at, preferred_date')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });
    setBookings(data || []);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  // ── date-range filtering ─────────────────────────────────────────────────
  const rangeBookings = useMemo(() => {
    if (timeRange === 'all') return bookings;
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return bookings.filter(b => new Date(b.created_at) >= cutoff);
  }, [bookings, timeRange]);

  // prev period (same length, immediately before)
  const prevBookings = useMemo(() => {
    if (timeRange === 'all') return [];
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const end = new Date();
    end.setDate(end.getDate() - days);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    return bookings.filter(b => {
      const d = new Date(b.created_at);
      return d >= start && d < end;
    });
  }, [bookings, timeRange]);

  // ── computed metrics ─────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = rangeBookings.length;
    const completed = rangeBookings.filter(b => b.status === 'completed').length;
    const active = rangeBookings.filter(b => ['new', 'contacted', 'confirmed'].includes(b.status)).length;
    const cancelled = rangeBookings.filter(b => b.status === 'cancelled').length;
    const totalWorkers = rangeBookings.reduce((s, b) => s + (b.workers_needed || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

    const prevTotal = prevBookings.length;
    const prevCompleted = prevBookings.filter(b => b.status === 'completed').length;
    const prevWorkers = prevBookings.reduce((s, b) => s + (b.workers_needed || 0), 0);

    // service breakdown
    const serviceMap: Record<string, number> = {};
    rangeBookings.forEach(b => { serviceMap[b.service_type] = (serviceMap[b.service_type] || 0) + 1; });
    const serviceBreakdown = Object.entries(serviceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / Math.max(total, 1)) * 100) }));

    // hiring type breakdown
    const contractCount = rangeBookings.filter(b => b.hiring_type === 'contract').length;
    const permanentCount = rangeBookings.filter(b => b.hiring_type === 'permanent').length;

    // workers by service
    const workersByService: Record<string, number> = {};
    rangeBookings.forEach(b => {
      workersByService[b.service_type] = (workersByService[b.service_type] || 0) + (b.workers_needed || 0);
    });
    const topByWorkers = Object.entries(workersByService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // avg fulfillment time (created → confirmed or completed)
    const fulfilledBookings = rangeBookings.filter(b => ['confirmed', 'completed'].includes(b.status));
    // We don't store updated_at transitions, so use created_at as proxy

    // monthly trend (last 12 months)
    const months = getLast12Months();
    const monthlyData = months.map(ym => ({
      label: monthLabel(ym),
      total: bookings.filter(b => b.created_at.startsWith(ym)).length,
      completed: bookings.filter(b => b.created_at.startsWith(ym) && b.status === 'completed').length,
      workers: bookings.filter(b => b.created_at.startsWith(ym)).reduce((s, b) => s + (b.workers_needed || 0), 0),
    }));

    // status donut data
    const statusCounts: Record<string, number> = { new: 0, contacted: 0, confirmed: 0, completed: 0, cancelled: 0 };
    rangeBookings.forEach(b => { if (b.status in statusCounts) statusCounts[b.status]++; });

    // most active month
    const peakMonth = monthlyData.reduce((a, b) => b.total > a.total ? b : a, monthlyData[0]);

    // avg workers per request
    const avgWorkers = total > 0 ? (totalWorkers / total).toFixed(1) : '0';

    return {
      total, completed, active, cancelled, totalWorkers, completionRate, cancellationRate,
      prevTotal, prevCompleted, prevWorkers,
      serviceBreakdown, contractCount, permanentCount, workersByService, topByWorkers,
      fulfilledCount: fulfilledBookings.length,
      monthlyData, statusCounts, peakMonth,
      avgWorkers,
      trends: {
        total: trendVsPrev(total, prevTotal),
        completed: trendVsPrev(completed, prevCompleted),
        workers: trendVsPrev(totalWorkers, prevWorkers),
      },
    };
  }, [rangeBookings, prevBookings, bookings]);

  const donutSegments = [
    { label: 'Pending',   value: metrics.statusCounts.new,       color: '#3b82f6' },
    { label: 'Contacted', value: metrics.statusCounts.contacted,  color: '#f59e0b' },
    { label: 'Confirmed', value: metrics.statusCounts.confirmed,  color: '#0ea5e9' },
    { label: 'Completed', value: metrics.statusCounts.completed,  color: '#22c55e' },
    { label: 'Cancelled', value: metrics.statusCounts.cancelled,  color: '#ef4444' },
  ];

  const SERVICE_COLORS = [
    '#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444',
    '#06b6d4','#f97316','#84cc16',
  ];

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
          <h1 className="text-2xl font-extrabold text-gray-900">Analytics & KPIs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Performance overview · updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time-range pills */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 text-xs font-semibold">
            {(['30d', '90d', '12m', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  timeRange === r ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === '30d' ? '30 days' : r === '90d' ? '90 days' : r === '12m' ? '12 months' : 'All time'}
              </button>
            ))}
          </div>
          <button onClick={loadBookings} title="Refresh"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {noData ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <BarChart2 size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No data yet</h3>
          <p className="text-gray-400 text-sm">Submit your first service request to see analytics here.</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Requests"
              value={metrics.total}
              sub={timeRange !== 'all' ? `vs ${metrics.prevTotal} prev period` : `${bookings.length} all time`}
              trend={metrics.trends.total}
              icon={Layers}
              color="from-primary-500 to-primary-600"
              sparkline={metrics.monthlyData.slice(-8).map(m => m.total)}
            />
            <KpiCard
              label="Completed"
              value={metrics.completed}
              sub={`${metrics.completionRate}% completion rate`}
              trend={metrics.trends.completed}
              icon={CheckCircle}
              color="from-emerald-500 to-green-600"
              sparkline={metrics.monthlyData.slice(-8).map(m => m.completed)}
            />
            <KpiCard
              label="Active Requests"
              value={metrics.active}
              sub="In pipeline right now"
              icon={Activity}
              color="from-sky-500 to-blue-600"
            />
            <KpiCard
              label="Workers Requested"
              value={metrics.totalWorkers}
              sub={`Avg ${metrics.avgWorkers} per request`}
              trend={metrics.trends.workers}
              icon={Users}
              color="from-amber-400 to-orange-500"
              sparkline={metrics.monthlyData.slice(-8).map(m => m.workers)}
            />
          </div>

          {/* ── Secondary KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Completion Rate',
                value: `${metrics.completionRate}%`,
                icon: Target,
                color: metrics.completionRate >= 70 ? 'text-emerald-600 bg-emerald-50' : metrics.completionRate >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50',
                bar: metrics.completionRate,
                barColor: metrics.completionRate >= 70 ? '#22c55e' : metrics.completionRate >= 40 ? '#f59e0b' : '#ef4444',
              },
              {
                label: 'Cancellation Rate',
                value: `${metrics.cancellationRate}%`,
                icon: XCircle,
                color: metrics.cancellationRate <= 10 ? 'text-emerald-600 bg-emerald-50' : metrics.cancellationRate <= 25 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50',
                bar: metrics.cancellationRate,
                barColor: metrics.cancellationRate <= 10 ? '#22c55e' : metrics.cancellationRate <= 25 ? '#f59e0b' : '#ef4444',
              },
              {
                label: 'Contract Hires',
                value: metrics.contractCount,
                icon: Clock,
                color: 'text-primary-600 bg-primary-50',
                bar: metrics.total > 0 ? Math.round((metrics.contractCount / metrics.total) * 100) : 0,
                barColor: '#3b82f6',
              },
              {
                label: 'Permanent Hires',
                value: metrics.permanentCount,
                icon: Award,
                color: 'text-violet-600 bg-violet-50',
                bar: metrics.total > 0 ? Math.round((metrics.permanentCount / metrics.total) * 100) : 0,
                barColor: '#8b5cf6',
              },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${item.color.split(' ')[1]}`}>
                      <Icon size={14} className={item.color.split(' ')[0]} />
                    </div>
                    <p className="text-xs font-semibold text-gray-600">{item.label}</p>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 mb-2">{item.value}</p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(item.bar, 100)}%`, backgroundColor: item.barColor }}
                    />
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
                  <h3 className="font-bold text-gray-900">Monthly Requests</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Submissions over the last 12 months</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#3b82f6' }} />Total</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#22c55e' }} />Completed</span>
                </div>
              </div>
              {/* Stacked bars */}
              <div className="flex items-end gap-1 h-36">
                {metrics.monthlyData.map(m => {
                  const maxVal = Math.max(...metrics.monthlyData.map(d => d.total), 1);
                  const totalH = Math.max((m.total / maxVal) * 112, m.total > 0 ? 4 : 0);
                  const completedH = Math.max((m.completed / maxVal) * 112, m.completed > 0 ? 2 : 0);
                  return (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full" style={{ height: '112px' }} title={`${m.label}: ${m.total} total, ${m.completed} completed`}>
                        {m.total > 0 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-t-sm"
                            style={{ height: `${totalH}px`, backgroundColor: '#bfdbfe' }}
                          />
                        )}
                        {m.completed > 0 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-t-sm"
                            style={{ height: `${completedH}px`, backgroundColor: '#22c55e' }}
                          />
                        )}
                        {m.total > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {m.total} req · {m.completed} done
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400">{m.label}</span>
                    </div>
                  );
                })}
              </div>
              {/* Peak month callout */}
              {metrics.peakMonth && metrics.peakMonth.total > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                  <TrendingUp size={13} className="text-primary-500 shrink-0" />
                  Peak month: <span className="font-semibold text-gray-700">{metrics.peakMonth.label}</span> with {metrics.peakMonth.total} request{metrics.peakMonth.total !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Status donut */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">Request Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">Current period breakdown</p>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <DonutRing segments={donutSegments} />
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>
                  <p className="text-gray-400">Total requests</p>
                  <p className="font-bold text-gray-900 text-base">{metrics.total}</p>
                </div>
                <div>
                  <p className="text-gray-400">Completion rate</p>
                  <p className={`font-bold text-base ${metrics.completionRate >= 70 ? 'text-emerald-600' : metrics.completionRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                    {metrics.completionRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Service breakdown + Workers chart ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Service breakdown table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">Top Services Requested</h3>
                <p className="text-xs text-gray-500 mt-0.5">By number of bookings</p>
              </div>
              {metrics.serviceBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data for this period</p>
              ) : (
                <div className="space-y-3">
                  {metrics.serviceBreakdown.map((svc, i) => (
                    <div key={svc.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                          >
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-700 truncate">{svc.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="font-bold text-gray-900">{svc.count}</span>
                          <span className="text-gray-400 w-8 text-right">{svc.pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${svc.pct}%`, backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workers by service */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">Workers by Service</h3>
                <p className="text-xs text-gray-500 mt-0.5">Total workers requested per category</p>
              </div>
              {metrics.topByWorkers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data for this period</p>
              ) : (
                <MiniBar
                  data={metrics.topByWorkers.map(([name, count]) => ({
                    label: name.split(' ').slice(-1)[0],
                    value: count,
                  }))}
                  color="#3b82f6"
                />
              )}
              {metrics.topByWorkers.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
                  <Users size={12} className="shrink-0" />
                  <span>Top: <strong className="text-gray-700">{metrics.topByWorkers[0]?.[0]}</strong> with {metrics.topByWorkers[0]?.[1]} workers</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Hiring type + Insights row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Hiring mix */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-1">Hiring Mix</h3>
              <p className="text-xs text-gray-500 mb-5">Contract vs permanent</p>
              <div className="space-y-4">
                {[
                  { label: 'Contract',  value: metrics.contractCount,  color: '#3b82f6', bg: 'bg-blue-50',   text: 'text-blue-600' },
                  { label: 'Permanent', value: metrics.permanentCount, color: '#8b5cf6', bg: 'bg-violet-50', text: 'text-violet-600' },
                ].map(item => {
                  const pctVal = metrics.total > 0 ? Math.round((item.value / metrics.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-semibold text-gray-700">{item.label}</span>
                        <span className="font-bold text-gray-900">{item.value} <span className="text-gray-400 font-normal text-xs">({pctVal}%)</span></span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctVal}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex justify-center gap-3 text-xs">
                  {metrics.contractCount >= metrics.permanentCount ? (
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <Clock size={12} />Contract-heavy portfolio
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-violet-600 font-semibold">
                      <Award size={12} />Permanent-heavy portfolio
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI-style Insights */}
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
              <div className="space-y-3">
                {[
                  // Completion rate insight
                  metrics.completionRate >= 80
                    ? { type: 'positive', text: `Excellent completion rate of ${metrics.completionRate}% — well above the 70% benchmark.` }
                    : metrics.completionRate >= 50
                    ? { type: 'neutral',  text: `Completion rate is ${metrics.completionRate}%. Aim for 70%+ by following up on pending requests.` }
                    : metrics.total > 0
                    ? { type: 'warning',  text: `Completion rate of ${metrics.completionRate}% is low. Review open requests to improve fulfillment.` }
                    : null,

                  // Cancellation insight
                  metrics.cancellationRate > 25
                    ? { type: 'warning', text: `High cancellation rate (${metrics.cancellationRate}%). Consider adjusting request timing or requirements.` }
                    : metrics.cancellationRate > 0
                    ? { type: 'neutral', text: `Cancellation rate is ${metrics.cancellationRate}% — within a healthy range.` }
                    : metrics.total > 0
                    ? { type: 'positive', text: 'Zero cancellations in this period — great consistency.' }
                    : null,

                  // Top service
                  metrics.serviceBreakdown.length > 0
                    ? { type: 'info', text: `Most requested service: "${metrics.serviceBreakdown[0].name}" (${metrics.serviceBreakdown[0].pct}% of all requests).` }
                    : null,

                  // Workers insight
                  metrics.totalWorkers > 0
                    ? { type: 'info', text: `You've requested ${metrics.totalWorkers} workers total, averaging ${metrics.avgWorkers} per booking.` }
                    : null,

                  // Trend insight
                  metrics.trends.total !== undefined && Math.abs(metrics.trends.total) > 5
                    ? metrics.trends.total > 0
                      ? { type: 'positive', text: `Requests are up ${metrics.trends.total}% compared to the previous period — activity is growing.` }
                      : { type: 'warning',  text: `Requests are down ${Math.abs(metrics.trends.total)}% compared to the previous period.` }
                    : null,

                  // Active pipeline
                  metrics.active > 3
                    ? { type: 'neutral', text: `You have ${metrics.active} active requests in the pipeline. Expect updates from the team soon.` }
                    : metrics.active === 0 && metrics.total > 0
                    ? { type: 'info', text: 'No active requests right now — submit a new request when you need staff.' }
                    : null,
                ]
                  .filter(Boolean)
                  .slice(0, 5)
                  .map((insight, i) => {
                    if (!insight) return null;
                    const styles = {
                      positive: { bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-800', icon: TrendingUp },
                      warning:  { bg: 'bg-amber-50 border-amber-200',    dot: 'bg-amber-500',   text: 'text-amber-800',   icon: TrendingDown },
                      neutral:  { bg: 'bg-slate-50 border-slate-200',    dot: 'bg-slate-400',   text: 'text-slate-700',   icon: Minus },
                      info:     { bg: 'bg-blue-50 border-blue-200',      dot: 'bg-blue-500',    text: 'text-blue-800',    icon: BarChart2 },
                    };
                    const s = styles[insight.type as keyof typeof styles];
                    const InsightIcon = s.icon;
                    return (
                      <div key={i} className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border ${s.bg}`}>
                        <InsightIcon size={13} className={`shrink-0 mt-0.5 ${s.text}`} />
                        <p className={`text-xs leading-relaxed ${s.text}`}>{insight.text}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── Workers trend ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Workers Requested — Monthly</h3>
                <p className="text-xs text-gray-500 mt-0.5">Total headcount requested per month over the past year</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-gray-900">{metrics.totalWorkers}</p>
                <p className="text-xs text-gray-400">this period</p>
              </div>
            </div>
            <SparkLine values={metrics.monthlyData.map(m => m.workers)} color="#f59e0b" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
              {metrics.monthlyData.filter((_, i) => i % 3 === 0 || i === metrics.monthlyData.length - 1).map(m => (
                <span key={m.label}>{m.label}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
