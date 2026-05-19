import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User, Phone, MapPin, Briefcase, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/Logo';

interface AgentRegisterPageProps {
  onNavigate: (page: string) => void;
}

export default function AgentRegisterPage({ onNavigate }: AgentRegisterPageProps) {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    company_name: '',
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
        .from('agent_profiles')
        .insert([{
          id: user.id,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          location: form.location.trim(),
          company_name: form.company_name.trim(),
          status: 'pending',
        }]);

      if (profileError) {
        console.error('Agent profile creation error:', profileError);
      }

      // Sign out immediately — must wait for approval
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
                  <Briefcase size={28} className="text-yellow-700" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Pending Admin Approval</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your agent account has been created and is awaiting review by our admin team.
                  You'll be able to log in once your application is approved.
                </p>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>We typically review applications within <strong className="text-gray-700">24–48 hours</strong>.</p>
                <p>You will be notified when your account is approved.</p>
              </div>
              <button
                onClick={() => onNavigate('agent-login')}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Back to Agent Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-8 text-white text-center">
            <div className="flex justify-center mb-3">
              <Logo size="sm" variant="icon-only" />
            </div>
            <h1 className="text-2xl font-bold">Register as Agent</h1>
            <p className="text-white/80 mt-1 text-sm">Submit your application to join our agent network</p>
          </div>

          <div className="px-8 pt-6 pb-2">
            <div className="bg-secondary-50 border border-secondary-200 rounded-lg px-4 py-3 text-sm text-secondary-800 flex gap-2">
              <Briefcase size={16} className="shrink-0 mt-0.5 text-secondary-600" />
              <span>Your account will be reviewed by an admin before you can access the portal.</span>
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
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => set('full_name', e.target.value)}
                    placeholder="Your full name"
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

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Company / Organization <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={e => set('company_name', e.target.value)}
                    placeholder="Your company or organization name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="your@email.com"
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
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting Application...</>
              ) : 'Submit Application'}
            </button>

            <p className="text-center text-sm text-gray-600 pb-2">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => onNavigate('agent-login')}
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
