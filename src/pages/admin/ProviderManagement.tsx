import { useEffect, useState, useMemo } from 'react';
import { Check, X, Eye, AlertCircle, Search, SlidersHorizontal, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Provider {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service_category: string;
  status: string;
  rating: number;
  total_jobs: number;
  location: string;
  experience_years: number;
  bio: string;
  created_at: string;
}

type SortField = 'full_name' | 'experience_years' | 'rating' | 'total_jobs' | 'created_at';
type SortDir = 'asc' | 'desc';

const EXPERIENCE_OPTIONS = [
  { label: 'Any Experience', value: '' },
  { label: '0–2 years', value: '0-2' },
  { label: '3–5 years', value: '3-5' },
  { label: '6–10 years', value: '6-10' },
  { label: '10+ years', value: '10+' },
];

export default function ProviderManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProviderStatus = async (providerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('provider_profiles')
        .update({ status: newStatus })
        .eq('id', providerId);
      if (error) throw error;
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, status: newStatus } : p));
      if (selectedProvider?.id === providerId) {
        setSelectedProvider(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating provider:', err);
    }
  };

  const uniqueLocations = useMemo(() =>
    [...new Set(providers.map(p => p.location).filter(Boolean))].sort(), [providers]);

  const uniqueCategories = useMemo(() =>
    [...new Set(providers.map(p => p.service_category).filter(Boolean))].sort(), [providers]);

  const filtered = useMemo(() => {
    let result = [...providers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (locationFilter) {
      result = result.filter(p => p.location === locationFilter);
    }

    if (categoryFilter) {
      result = result.filter(p => p.service_category === categoryFilter);
    }

    if (experienceFilter) {
      result = result.filter(p => {
        const y = p.experience_years ?? 0;
        if (experienceFilter === '0-2') return y >= 0 && y <= 2;
        if (experienceFilter === '3-5') return y >= 3 && y <= 5;
        if (experienceFilter === '6-10') return y >= 6 && y <= 10;
        if (experienceFilter === '10+') return y > 10;
        return true;
      });
    }

    result.sort((a, b) => {
      let av: string | number = a[sortField] ?? '';
      let bv: string | number = b[sortField] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [providers, search, statusFilter, locationFilter, categoryFilter, experienceFilter, sortField, sortDir]);

  const activeFilterCount = [
    search.trim() ? 1 : 0,
    statusFilter !== 'all' ? 1 : 0,
    locationFilter ? 1 : 0,
    categoryFilter ? 1 : 0,
    experienceFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setLocationFilter('');
    setCategoryFilter('');
    setExperienceFilter('');
    setSortField('created_at');
    setSortDir('desc');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={14} className="text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="text-primary-600" />
      : <ChevronDown size={14} className="text-primary-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200';
      case 'rejected': return 'bg-red-100 text-red-800 ring-1 ring-red-200';
      default: return 'bg-gray-100 text-gray-700 ring-1 ring-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Provider Management</h1>
          <p className="text-gray-500">Review, filter, and manage service providers</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {filtered.length === providers.length ? 'Total Providers' : `of ${providers.length} providers`}
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-900">Filters & Search</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
            {filtersOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </div>
        </button>

        {filtersOpen && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-5">
              {/* Search */}
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, email, or phone..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all bg-gray-50"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all bg-gray-50"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Location
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all bg-gray-50"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Service Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all bg-gray-50"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Experience
                </label>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all bg-gray-50"
                >
                  {EXPERIENCE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {search.trim() && (
                  <FilterChip label={`Search: "${search}"`} onRemove={() => setSearch('')} />
                )}
                {statusFilter !== 'all' && (
                  <FilterChip label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter('all')} />
                )}
                {locationFilter && (
                  <FilterChip label={`Location: ${locationFilter}`} onRemove={() => setLocationFilter('')} />
                )}
                {categoryFilter && (
                  <FilterChip label={`Category: ${categoryFilter}`} onRemove={() => setCategoryFilter('')} />
                )}
                {experienceFilter && (
                  <FilterChip
                    label={`Experience: ${EXPERIENCE_OPTIONS.find(o => o.value === experienceFilter)?.label}`}
                    onRemove={() => setExperienceFilter('')}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-500 mt-4">Loading providers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No providers match your filters</p>
            <button onClick={resetFilters} className="mt-3 text-sm text-primary-600 hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <SortableTh label="Name" field="full_name" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="text-left py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Category</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Location</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <SortableTh label="Exp." field="experience_years" current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortableTh label="Rating" field="rating" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="text-left py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((provider) => (
                  <tr key={provider.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-gray-900">{provider.full_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{provider.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{provider.service_category || '—'}</td>
                    <td className="py-4 px-4 text-gray-600">{provider.location || '—'}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(provider.status)}`}>
                        {provider.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-medium">
                      {provider.experience_years != null ? `${provider.experience_years} yr` : '—'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-900">{provider.rating?.toFixed(1) ?? '—'}</span>
                        <span className="text-gray-400 text-xs">/ {provider.total_jobs ?? 0} jobs</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <ActionButton
                          onClick={() => setSelectedProvider(provider)}
                          title="View Details"
                          color="blue"
                          icon={<Eye size={15} />}
                        />
                        {provider.status === 'pending' && (
                          <>
                            <ActionButton
                              onClick={() => updateProviderStatus(provider.id, 'approved')}
                              title="Approve"
                              color="green"
                              icon={<Check size={15} />}
                            />
                            <ActionButton
                              onClick={() => updateProviderStatus(provider.id, 'rejected')}
                              title="Reject"
                              color="red"
                              icon={<X size={15} />}
                            />
                          </>
                        )}
                        {provider.status === 'approved' && (
                          <ActionButton
                            onClick={() => updateProviderStatus(provider.id, 'rejected')}
                            title="Revoke Approval"
                            color="red"
                            icon={<X size={15} />}
                          />
                        )}
                        {provider.status === 'rejected' && (
                          <ActionButton
                            onClick={() => updateProviderStatus(provider.id, 'approved')}
                            title="Re-approve"
                            color="green"
                            icon={<Check size={15} />}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedProvider.full_name}</h2>
                <p className="text-gray-500 text-sm mt-1">{selectedProvider.email}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${getStatusColor(selectedProvider.status)}`}>
                {selectedProvider.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-6">
              <DetailField label="Phone" value={selectedProvider.phone} />
              <DetailField label="Location" value={selectedProvider.location} />
              <DetailField label="Service Category" value={selectedProvider.service_category} />
              <DetailField label="Experience" value={selectedProvider.experience_years != null ? `${selectedProvider.experience_years} years` : undefined} />
              <DetailField label="Rating" value={selectedProvider.rating != null ? `${selectedProvider.rating.toFixed(1)} / 5.0` : undefined} />
              <DetailField label="Total Jobs" value={selectedProvider.total_jobs != null ? String(selectedProvider.total_jobs) : undefined} />
            </div>

            {selectedProvider.bio && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Bio</p>
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg p-4">{selectedProvider.bio}</p>
              </div>
            )}

            <div className="flex gap-3">
              {selectedProvider.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateProviderStatus(selectedProvider.id, 'approved')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button
                    onClick={() => updateProviderStatus(selectedProvider.id, 'rejected')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Reject
                  </button>
                </>
              )}
              {selectedProvider.status === 'approved' && (
                <button
                  onClick={() => updateProviderStatus(selectedProvider.id, 'rejected')}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Revoke Approval
                </button>
              )}
              {selectedProvider.status === 'rejected' && (
                <button
                  onClick={() => updateProviderStatus(selectedProvider.id, 'approved')}
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Re-approve Provider
                </button>
              )}
              <button
                onClick={() => setSelectedProvider(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label?: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-200">
      {label}
      <button onClick={onRemove} className="hover:text-primary-900 transition-colors">
        <X size={12} />
      </button>
    </span>
  );
}

function SortableTh({
  label, field, current, dir, onSort
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
}) {
  return (
    <th className="text-left py-3.5 px-4">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 font-semibold text-gray-600 text-xs uppercase tracking-wide hover:text-gray-900 transition-colors group"
      >
        {label}
        <span className="opacity-60 group-hover:opacity-100 transition-opacity">
          {current === field
            ? (dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
            : <ChevronUp size={13} className="text-gray-300" />}
        </span>
      </button>
    </th>
  );
}

function ActionButton({
  onClick, title, color, icon
}: {
  onClick: () => void;
  title: string;
  color: 'blue' | 'green' | 'red';
  icon: React.ReactNode;
}) {
  const colors = {
    blue: 'hover:bg-primary-50 text-primary-600',
    green: 'hover:bg-emerald-50 text-emerald-600',
    red: 'hover:bg-red-50 text-red-600',
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${colors[color]}`}
    >
      {icon}
    </button>
  );
}

function DetailField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-semibold text-gray-900">{value || '—'}</p>
    </div>
  );
}
