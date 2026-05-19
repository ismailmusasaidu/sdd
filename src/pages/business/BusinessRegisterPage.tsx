import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User, Phone, MapPin, Building2, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/Logo';

interface BusinessRegisterPageProps {
  onNavigate: (page: string) => void;
}

const INDUSTRIES = [
  'Offices & Corporations',
  'Hotels & Hospitality',
  'Educational Institutions',
  'Healthcare Facilities',
  'Retail & Shopping',
  'Manufacturing & Warehouses',
  'Real Estate',
  'Events & Entertainment',
  'Other',
];

const COMPANY_SIZES = ['1–10', '11–50', '51–100', '101–500', '500+'];

export default function BusinessRegisterPage({ onNavigate }: BusinessRegisterPageProps) {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    location: '',
    industry: INDUSTRIES[0],
    company_size: COMPANY_SIZES[0],
    password: '',
    confirm_password: '',
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(form.email, form.password);
    if (signUpError) {
      setError(signUpError.message || 'Registration failed');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase
        .from('business_profiles')
        .insert([{
          id: user.id,
          company_name: form.company_name.trim(),
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          location: form.location.trim(),
          industry: form.industry,
          company_size: form.company_size,
          status: 'pending',
        }]);

      if (profileError) {
        console.error('Business profile creation error:', profileError);
      }

      await supabase.auth.signOut();
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-8 text-white text-center">
              <div className="flex justify-center mb-3">
                <Logo size="sm" variant="icon-only" />
              </div>
              <h1 className="text-2xl font-bold">Application Submitted!</h1>
            </div>
            <div className="px-8 py-10 text-center space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 size={28} className="text-yellow-700" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Pending Admin Approval</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your business account has been created and is awaiting review by our admin team.
                  You'll be able to log in once your account is approved.
                </p>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>We typically review applications within <strong className="text-gray-700">24–48 hours</strong>.</p>
                <p>You will be notified when your account is approved.</p>
              </div>
              <button
                onClick={() => onNavigate('business-login')}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Back to Business Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg">
        <button
          onClick={() => onNavigate('businesses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-8 text-white text-center">
            <div className="flex justify-center mb-3">
              <Logo size="sm" variant="icon-only" />
            </div>
            <h1 className="text-2xl font-bold">Register Your Business</h1>
            <p className="text-white/80 mt-1 text-sm">Create a business account to access staffing solutions</p>
          </div>

          <div className="px-8 pt-6 pb-2">
            <div className="bg-secondary-50 border border-secondary-200 rounded-lg px-4 py-3 text-sm text-secondary-800 flex gap-2">
              <Briefcase size={16} className="shrink-0 mt-0.5 text-secondary-600" />
              <span>Your account will be reviewed and approved by our admin team before you can access the portal.</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Company / Business Name</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={e => set('company_name', e.target.value)}
                    placeholder="Your company or business name"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Contact Person Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={e => set('contact_name', e.target.value)}
                    placeholder="Full name of primary contact"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="e.g. 0801 234 5678"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Location</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="City / Area"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Industry</label>
                <select
                  value={form.industry}
                  onChange={e => set('industry', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white"
                >
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Company Size</label>
                <select
                  value={form.company_size}
                  onChange={e => set('company_size', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white"
                >
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="business@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm_password}
                    onChange={e => set('confirm_password', e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
              ) : 'Register Business'}
            </button>

            <p className="text-center text-sm text-gray-600 pb-2">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => onNavigate('business-login')}
                className="text-primary-600 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
