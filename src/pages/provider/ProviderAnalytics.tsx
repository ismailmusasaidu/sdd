import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle, Clock, XCircle, TrendingUp, TrendingDown, Minus,
  Star, Briefcase, Award, Target, Activity, BarChart2, AlertCircle,
  ArrowUpRight, ArrowDownRight, RefreshCw, Zap, CalendarDays,
  ShieldCheck, FileCheck, Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── data shapes ──────────────────────────────────────────────────────────────

interface Job {
  id: string;
  service_type: string;
  status: string;
  priority: string;
  assigned_date: string;
  completion_date: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
}

interface Document {
  id: string;
  document_type: string;
  verified: boolean;
  rejection_reason: string | null;
  created_at: string;
}

interface ProviderProfile {
  rating: number;
  total_jobs: number;
  experience_years: number;
  service_category: string;
  status: string;
}

interface Props {
  providerId: string;
}

// ── tiny pure-SVG / CSS chart helpers ────────────────────────────────────────

function SparkLine({ values, color = '#2563eb' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <div className="h-10" />;
  const max = Math.max(...values, 1);
  const w = 100, h = 40;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" points={pts} />
      <polyline fill={color + '22'} stroke="none"
        points={`0,${h} ${pts} ${w},${h}`} />
    </svg>
  );
}

function DonutRing({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-28 text-gray-300 text-xs">No data</div>;
  const r = 38, cx = 50, cy = 50, stroke = 20;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.filter(s => s.value > 0).map(seg => {
    const dash = (seg.value / total) * circ;
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
            strokeDashoffset={arc.offset} />
        ))}
        <text x="50" y="54" textAnchor="middle" className="fill-gray-800"
          style={{ fontSize: 18, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}>
          {total}
        </text>
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

function StarBar({ rating, count }: { rating: number; count: number }) {
  const pct = (rating / 5) * 100;
  const color = rating >= 4 ? '#22c55e' : rating >= 3 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-3 text-gray-500 shrink-0">{rating}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-5 text-right shrink-0">{count}</span>
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
          <SparkLine
            values={sparkline}
            color={gradient.includes('green') ? '#22c55e' : gradient.includes('amber') || gradient.includes('yellow') ? '#f59e0b' : gradient.includes('red') ? '#ef4444' : '#3b82f6'}
          />
        </div>
      )}
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getLast12Months() {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function shortMonth(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' });
}

function trendVsPrev(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : undefined;
  return Math.round(((curr - prev) / prev) * 100);
}

function avgDays(jobs: Job[]) {
  const finished = jobs.filter(j => j.completion_date && j.assigned_date);
  if (!finished.length) return null;
  const sum = finished.reduce((s, j) => {
    const diff = (new Date(j.completion_date!).getTime() - new Date(j.assigned_date).getTime()) / 86400000;
    return s + diff;
  }, 0);
  return (sum / finished.length).toFixed(1);
}

// ── main component ────────────────────────────────────────────────────────────

export default function ProviderAnalytics({ providerId }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '12m' | 'all'>('90d');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => { loadAll(); }, [providerId]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadJobs(), loadReviews(), loadDocuments(), loadProfile()]);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  const loadJobs = async () => {
    const { data } = await supabase
      .from('task_assignments')
      .select('id, service_type, status, priority, assigned_date, completion_date')
      .eq('provider_id', providerId)
      .order('assigned_date', { ascending: true });
    setJobs(data || []);
  };

  const loadReviews = async () => {
    const { data } = await supabase
      .from('provider_reviews')
      .select('id, rating, comment, status, created_at')
      .eq('provider_id', providerId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    setReviews(data || []);
  };

  const loadDocuments = async () => {
    const { data } = await supabase
      .from('provider_documents')
      .select('id, document_type, verified, rejection_reason, created_at')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    setDocuments(data || []);
  };

  const loadProfile = async () => {
    const { data } = await supabase
      .from('provider_profiles')
      .select('rating, total_jobs, experience_years, service_category, status')
      .eq('id', providerId)
      .maybeSingle();
    setProfile(data);
  };

  // ── date filtering ────────────────────────────────────────────────────────
  function cutoff(days: number) {
    const d = new Date(); d.setDate(d.getDate() - days); return d;
  }

  const rangeJobs = useMemo(() => {
    if (timeRange === 'all') return jobs;
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const c = cutoff(days);
    return jobs.filter(j => new Date(j.assigned_date) >= c);
  }, [jobs, timeRange]);

  const prevJobs = useMemo(() => {
    if (timeRange === 'all') return [];
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const end = cutoff(days);
    const start = new Date(end); start.setDate(start.getDate() - days);
    return jobs.filter(j => { const d = new Date(j.assigned_date); return d >= start && d < end; });
  }, [jobs, timeRange]);

  const rangeReviews = useMemo(() => {
    if (timeRange === 'all') return reviews;
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const c = cutoff(days);
    return reviews.filter(r => new Date(r.created_at) >= c);
  }, [reviews, timeRange]);

  // ── metrics ───────────────────────────────────────────────────────────────
  const m = useMemo(() => {
    const total = rangeJobs.length;
    const completed = rangeJobs.filter(j => j.status === 'completed').length;
    const inProgress = rangeJobs.filter(j => j.status === 'in_progress').length;
    const assigned = rangeJobs.filter(j => j.status === 'assigned').length;
    const cancelled = rangeJobs.filter(j => j.status === 'cancelled').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const prevTotal = prevJobs.length;
    const prevCompleted = prevJobs.filter(j => j.status === 'completed').length;

    // avg rating
    const avgRating = rangeReviews.length
      ? (rangeReviews.reduce((s, r) => s + r.rating, 0) / rangeReviews.length).toFixed(1)
      : profile?.rating?.toFixed(1) ?? '—';

    // rating distribution (1–5)
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rangeReviews.forEach(r => { const k = Math.round(r.rating); if (k >= 1 && k <= 5) ratingDist[k]++; });

    // service breakdown
    const serviceMap: Record<string, number> = {};
    rangeJobs.forEach(j => { serviceMap[j.service_type] = (serviceMap[j.service_type] || 0) + 1; });
    const serviceBreakdown = Object.entries(serviceMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

    // priority breakdown
    const highPriority = rangeJobs.filter(j => j.priority === 'high').length;
    const medPriority = rangeJobs.filter(j => j.priority === 'medium').length;
    const lowPriority = rangeJobs.filter(j => j.priority === 'low').length;

    // monthly trend (all jobs, 12 months)
    const months = getLast12Months();
    const monthlyJobs = months.map(ym => ({
      label: shortMonth(ym),
      total: jobs.filter(j => j.assigned_date?.startsWith(ym)).length,
      completed: jobs.filter(j => j.assigned_date?.startsWith(ym) && j.status === 'completed').length,
    }));

    const monthlyRatings = months.map(ym => {
      const mr = reviews.filter(r => r.created_at?.startsWith(ym));
      return mr.length ? mr.reduce((s, r) => s + r.rating, 0) / mr.length : 0;
    });

    // document health
    const verifiedDocs = documents.filter(d => d.verified).length;
    const pendingDocs = documents.filter(d => !d.verified && !d.rejection_reason).length;
    const rejectedDocs = documents.filter(d => !!d.rejection_reason).length;

    // avg days to complete
    const avgCompletionDays = avgDays(rangeJobs);

    // peak month
    const peakMonth = monthlyJobs.reduce((a, b) => b.total > a.total ? b : a, monthlyJobs[0]);

    // streak: consecutive months with completed jobs (most recent)
    let streak = 0;
    for (let i = monthlyJobs.length - 1; i >= 0; i--) {
      if (monthlyJobs[i].completed > 0) streak++;
      else break;
    }

    return {
      total, completed, inProgress, assigned, cancelled, completionRate,
      prevTotal, prevCompleted,
      avgRating, ratingDist, rangeReviewCount: rangeReviews.length,
      serviceBreakdown, highPriority, medPriority, lowPriority,
      monthlyJobs, monthlyRatings,
      verifiedDocs, pendingDocs, rejectedDocs, totalDocs: documents.length,
      avgCompletionDays, peakMonth, streak,
      trends: {
        jobs: trendVsPrev(total, prevTotal),
        completed: trendVsPrev(completed, prevCompleted),
      },
    };
  }, [rangeJobs, prevJobs, rangeReviews, jobs, reviews, documents, profile]);

  const SERVICE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  const noData = jobs.length === 0 && reviews.length === 0;

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Analytics & KPIs</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Your performance overview · {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <button onClick={loadAll} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {noData ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <BarChart2 size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No data yet</h3>
          <p className="text-gray-400 text-sm">Complete your first job to start seeing analytics here.</p>
        </div>
      ) : (
        <>
          {/* ── KPI row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Jobs" value={m.total}
              sub={timeRange !== 'all' ? `${m.prevTotal} previous period` : `${jobs.length} all time`}
              trend={m.trends.jobs} icon={Briefcase}
              gradient="from-primary-500 to-primary-600"
              sparkline={m.monthlyJobs.slice(-8).map(x => x.total)} />
            <KpiCard label="Completed" value={m.completed}
              sub={`${m.completionRate}% completion rate`}
              trend={m.trends.completed} icon={CheckCircle}
              gradient="from-emerald-500 to-green-600"
              sparkline={m.monthlyJobs.slice(-8).map(x => x.completed)} />
            <KpiCard label="Avg Rating" value={m.avgRating}
              sub={`${m.rangeReviewCount} review${m.rangeReviewCount !== 1 ? 's' : ''} this period`}
              icon={Star} gradient="from-amber-400 to-yellow-500"
              sparkline={m.monthlyRatings.slice(-8)} />
            <KpiCard label="Active Jobs" value={m.inProgress + m.assigned}
              sub={`${m.inProgress} in progress · ${m.assigned} queued`}
              icon={Activity} gradient="from-sky-500 to-blue-600" />
          </div>

          {/* ── Secondary KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Completion Rate',
                value: `${m.completionRate}%`,
                bar: m.completionRate,
                barColor: m.completionRate >= 80 ? '#22c55e' : m.completionRate >= 50 ? '#f59e0b' : '#ef4444',
                icon: Target,
                iconCls: m.completionRate >= 80 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50',
              },
              {
                label: 'Avg. Days to Complete',
                value: m.avgCompletionDays ? `${m.avgCompletionDays}d` : '—',
                bar: m.avgCompletionDays ? Math.min(Number(m.avgCompletionDays) * 10, 100) : 0,
                barColor: '#3b82f6',
                icon: CalendarDays,
                iconCls: 'text-primary-600 bg-primary-50',
              },
              {
                label: 'Active Month Streak',
                value: `${m.streak} mo`,
                bar: Math.min(m.streak * 10, 100),
                barColor: '#8b5cf6',
                icon: Zap,
                iconCls: 'text-violet-600 bg-violet-50',
              },
              {
                label: 'Docs Verified',
                value: `${m.verifiedDocs}/${m.totalDocs}`,
                bar: m.totalDocs > 0 ? Math.round((m.verifiedDocs / m.totalDocs) * 100) : 0,
                barColor: '#22c55e',
                icon: ShieldCheck,
                iconCls: 'text-emerald-600 bg-emerald-50',
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

          {/* ── Monthly jobs trend + job status donut ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Monthly bar chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Monthly Job Activity</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Assigned vs completed over 12 months</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block bg-blue-200" />Assigned</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block bg-emerald-500" />Completed</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-36">
                {m.monthlyJobs.map(mo => {
                  const maxVal = Math.max(...m.monthlyJobs.map(d => d.total), 1);
                  const totalH = Math.max((mo.total / maxVal) * 112, mo.total > 0 ? 4 : 0);
                  const doneH = Math.max((mo.completed / maxVal) * 112, mo.completed > 0 ? 2 : 0);
                  return (
                    <div key={mo.label} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full" style={{ height: 112 }}
                        title={`${mo.label}: ${mo.total} assigned, ${mo.completed} done`}>
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
                  Peak month: <span className="font-semibold text-gray-700">{m.peakMonth.label}</span> — {m.peakMonth.total} job{m.peakMonth.total !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Job status donut */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">Job Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">Current period breakdown</p>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <DonutRing segments={[
                  { label: 'Completed',   value: m.completed,   color: '#22c55e' },
                  { label: 'In Progress', value: m.inProgress,  color: '#3b82f6' },
                  { label: 'Assigned',    value: m.assigned,    color: '#f59e0b' },
                  { label: 'Cancelled',   value: m.cancelled,   color: '#ef4444' },
                ]} />
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Total jobs</p>
                  <p className="font-bold text-gray-900 text-lg">{m.total}</p>
                </div>
                <div>
                  <p className="text-gray-400">Success rate</p>
                  <p className={`font-bold text-lg ${m.completionRate >= 80 ? 'text-emerald-600' : m.completionRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                    {m.completionRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Rating panel + service breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Rating breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">Rating Breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">Distribution of approved reviews</p>
              </div>
              {m.rangeReviewCount === 0 ? (
                <div className="text-center py-8">
                  <Star size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No reviews in this period</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-5 mb-5">
                    <div className="text-center">
                      <p className="text-5xl font-extrabold text-gray-900 leading-none">{m.avgRating}</p>
                      <div className="flex gap-0.5 justify-center mt-2">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14}
                            className={Number(m.avgRating) >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{m.rangeReviewCount} review{m.rangeReviewCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5,4,3,2,1].map(n => (
                        <StarBar key={n} rating={n} count={m.ratingDist[n] || 0} />
                      ))}
                    </div>
                  </div>
                  {/* Rating trend sparkline */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Rating trend (12 months)</p>
                    <SparkLine values={m.monthlyRatings} color="#f59e0b" />
                    <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                      <span>{m.monthlyJobs[0]?.label}</span>
                      <span>{m.monthlyJobs[m.monthlyJobs.length - 1]?.label}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Service type breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">Job Categories</h3>
                <p className="text-xs text-gray-500 mt-0.5">By service type this period</p>
              </div>
              {m.serviceBreakdown.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No jobs in this period</p>
                </div>
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
          </div>

          {/* ── Priority mix + document health + insights ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Priority breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-1">Job Priority Mix</h3>
              <p className="text-xs text-gray-500 mb-5">How urgent your assignments are</p>
              <div className="space-y-4">
                {[
                  { label: 'High',   value: m.highPriority, color: '#ef4444', bg: '#fef2f2' },
                  { label: 'Medium', value: m.medPriority,  color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Low',    value: m.lowPriority,  color: '#22c55e', bg: '#f0fdf4' },
                ].map(item => {
                  const pct = m.total > 0 ? Math.round((item.value / m.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-gray-700">{item.label}</span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {item.value} <span className="text-gray-400 font-normal text-xs">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* profile badge */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${profile?.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="text-xs text-gray-500 capitalize">
                  Account: <span className="font-semibold text-gray-700">{profile?.status || '—'}</span>
                </span>
              </div>
            </div>

            {/* Document health */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 rounded-lg">
                  <FileCheck size={15} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Document Health</h3>
                  <p className="text-xs text-gray-500">Verification status</p>
                </div>
              </div>
              {m.totalDocs === 0 ? (
                <div className="text-center py-6">
                  <ShieldCheck size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No documents uploaded yet</p>
                </div>
              ) : (
                <>
                  {/* circular progress */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#22c55e" strokeWidth="3"
                          strokeDasharray={`${m.totalDocs > 0 ? (m.verifiedDocs / m.totalDocs) * 100 : 0} 100`}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-extrabold text-gray-900 leading-none">{m.verifiedDocs}</span>
                        <span className="text-[10px] text-gray-400">/{m.totalDocs}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Verified',  value: m.verifiedDocs,  color: '#22c55e', icon: CheckCircle },
                      { label: 'Pending',   value: m.pendingDocs,   color: '#f59e0b', icon: Clock },
                      { label: 'Rejected',  value: m.rejectedDocs,  color: '#ef4444', icon: XCircle },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center gap-2 text-xs">
                          <Icon size={12} style={{ color: item.color }} />
                          <span className="text-gray-500">{item.label}</span>
                          <span className="ml-auto font-bold text-gray-800">{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                  {m.rejectedDocs > 0 && (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
                      {m.rejectedDocs} document{m.rejectedDocs > 1 ? 's' : ''} rejected — re-upload to complete verification.
                    </div>
                  )}
                  {m.pendingDocs > 0 && m.rejectedDocs === 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                      {m.pendingDocs} document{m.pendingDocs > 1 ? 's' : ''} awaiting review.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Key Insights */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 rounded-lg">
                  <AlertCircle size={15} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Key Insights</h3>
                  <p className="text-xs text-gray-500">Based on your activity</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  m.completionRate >= 80
                    ? { type: 'positive', text: `Excellent ${m.completionRate}% completion rate — keep it up!` }
                    : m.completionRate >= 50
                    ? { type: 'neutral',  text: `${m.completionRate}% completion rate. Aim for 80%+ to improve your standing.` }
                    : m.total > 0
                    ? { type: 'warning',  text: `Low completion rate (${m.completionRate}%). Try to close open jobs promptly.` }
                    : null,

                  Number(m.avgRating) >= 4.5
                    ? { type: 'positive', text: `Outstanding ${m.avgRating}★ average — customers love your work.` }
                    : Number(m.avgRating) >= 3.5
                    ? { type: 'neutral',  text: `Good ${m.avgRating}★ average. Quality consistency will push it higher.` }
                    : m.rangeReviewCount > 0
                    ? { type: 'warning',  text: `${m.avgRating}★ average needs improvement. Focus on customer satisfaction.` }
                    : null,

                  m.streak >= 3
                    ? { type: 'positive', text: `${m.streak}-month active streak — strong consistent presence.` }
                    : m.streak >= 1
                    ? { type: 'neutral',  text: `${m.streak} active month${m.streak > 1 ? 's' : ''} in a row. Keep the momentum going.` }
                    : null,

                  m.highPriority > 0
                    ? { type: 'info', text: `${m.highPriority} high-priority job${m.highPriority > 1 ? 's' : ''} in the pipeline — respond quickly.` }
                    : null,

                  m.avgCompletionDays !== null
                    ? { type: 'info', text: `You complete jobs in ~${m.avgCompletionDays} days on average.` }
                    : null,

                  m.rejectedDocs > 0
                    ? { type: 'warning', text: `${m.rejectedDocs} document${m.rejectedDocs > 1 ? 's' : ''} rejected. Re-upload to maintain verified status.` }
                    : m.verifiedDocs === m.totalDocs && m.totalDocs > 0
                    ? { type: 'positive', text: 'All documents verified — your profile is fully credentialed.' }
                    : null,

                  m.trends.jobs !== undefined && Math.abs(m.trends.jobs) > 10
                    ? m.trends.jobs > 0
                      ? { type: 'positive', text: `Job volume up ${m.trends.jobs}% vs last period — great trajectory.` }
                      : { type: 'warning',  text: `Job volume down ${Math.abs(m.trends.jobs)}% vs last period.` }
                    : null,
                ]
                  .filter(Boolean)
                  .slice(0, 5)
                  .map((ins, i) => {
                    if (!ins) return null;
                    const styles = {
                      positive: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: TrendingUp },
                      warning:  { bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-800',   icon: TrendingDown },
                      neutral:  { bg: 'bg-slate-50 border-slate-200',    text: 'text-slate-700',   icon: Minus },
                      info:     { bg: 'bg-blue-50 border-blue-200',      text: 'text-blue-800',    icon: Users },
                    };
                    const s = styles[ins.type as keyof typeof styles];
                    const Icon = s.icon;
                    return (
                      <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl border ${s.bg}`}>
                        <Icon size={11} className={`shrink-0 mt-0.5 ${s.text}`} />
                        <p className={`text-[11px] leading-relaxed ${s.text}`}>{ins.text}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── Experience + profile summary ── */}
          {profile && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 rounded-xl p-3">
                    <Award size={28} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide font-semibold">Provider Profile</p>
                    <p className="font-bold text-lg capitalize">{profile.service_category}</p>
                    <p className="text-white/70 text-sm">{profile.experience_years} year{profile.experience_years !== 1 ? 's' : ''} experience</p>
                  </div>
                </div>
                <div className="flex gap-6 sm:gap-8">
                  {[
                    { label: 'Total Jobs',  value: profile.total_jobs },
                    { label: 'All-Time Avg', value: `${profile.rating ?? '—'}★` },
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
