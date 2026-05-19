import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Briefcase, Star, MapPin, Phone, Mail, Calendar, TrendingUp, LogOut, CreditCard as Edit, CheckCircle, Clock, AlertCircle, FileText, MessageSquare, X, Send, Upload, ClipboardList, BarChart2, LayoutDashboard } from 'lucide-react';
import ProviderAnalytics from './ProviderAnalytics';

interface ProviderDashboardPageProps {
  onNavigate: (page: string) => void;
}

interface ProviderProfile {
  full_name: string;
  email: string;
  phone: string;
  service_category: string;
  experience_years: number;
  bio: string;
  location: string;
  status: string;
  rating: number;
  total_jobs: number;
  created_at: string;
}

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  verified: boolean;
  rejection_reason?: string;
  created_at: string;
}

interface Job {
  id: string;
  service_type: string;
  customer_name: string;
  customer_phone: string;
  location: string;
  description: string;
  status: string;
  priority: string;
  assigned_date: string;
  completion_date: string | null;
}

interface Message {
  id: string;
  provider_id: string;
  admin_id: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function ProviderDashboardPage({ onNavigate }: ProviderDashboardPageProps) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [documentType, setDocumentType] = useState('id_card');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');

  useEffect(() => {
    if (!user) {
      onNavigate('provider-login');
      return;
    }

    loadProfile();
    loadDocuments();
    loadMessages();
    loadJobs();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProfile = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (fetchError) {
        setError('Failed to load profile');
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!user?.id) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('provider_documents')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (!fetchError && data) {
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const loadMessages = async () => {
    if (!user?.id) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('admin_provider_messages')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: true });

      if (!fetchError && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({
          status: newStatus,
          updated_by: user?.id,
          completion_date: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', jobId)
        .eq('provider_id', user?.id);

      if (error) throw error;

      setJobs(prev => prev.map(j =>
        j.id === jobId ? { ...j, status: newStatus, completion_date: newStatus === 'completed' ? new Date().toISOString() : null } : j
      ));
    } catch (err) {
      console.error('Error updating job status:', err);
    }
  };

  const loadJobs = async () => {
    if (!user?.id) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('provider_id', user.id)
        .order('assigned_date', { ascending: false });

      if (!fetchError && data) {
        setJobs(data);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 10 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid file type. Please upload a JPG, PNG, WEBP, or PDF.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('provider-documents')
        .upload(fileName, file, { upsert: false });

      if (storageError) throw new Error(`Storage error: ${storageError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('provider-documents')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('provider_documents')
        .insert({
          provider_id: user.id,
          document_type: documentType,
          file_url: publicUrl,
          file_name: file.name,
        });

      if (insertError) throw new Error(`Database error: ${insertError.message}`);

      await loadDocuments();
      setDocumentType('id_card');
      setUploadSuccess(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    // admin_id comes from any message in the thread that has it set
    const adminId = messages.find(m => m.admin_id && m.sender_id !== user.id)?.admin_id
      ?? messages.find(m => m.admin_id)?.admin_id
      ?? null;

    if (!adminId) {
      console.error('Cannot reply: no admin has messaged yet.');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_provider_messages')
        .insert({
          provider_id: user.id,
          admin_id: adminId,
          sender_id: user.id,
          message: newMessage
        });

      if (error) throw error;

      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('provider-login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
            <CheckCircle size={16} />
            <span>Verified</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
            <Clock size={16} />
            <span>Pending Review</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
            <AlertCircle size={16} />
            <span>Suspended</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 text-xl font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-gray-600 mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-green-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
              <p className="opacity-90">Welcome back, {profile.full_name}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {([
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'analytics', label: 'Analytics & KPIs', icon: BarChart2 },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'analytics' && user && (
          <ProviderAnalytics providerId={user.id} />
        )}
        {activeTab === 'dashboard' && (<>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-primary-50 w-12 h-12 rounded-full flex items-center justify-center">
                <Briefcase size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{profile.total_jobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-yellow-50 w-12 h-12 rounded-full flex items-center justify-center">
                <Star size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Rating</p>
                <p className="text-3xl font-bold text-gray-900">{profile.rating.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <div className="mt-1">{getStatusBadge(profile.status)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
              <button className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
                <Edit size={20} />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-gray-900 font-medium">{profile.full_name}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900 font-medium">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Briefcase size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Service Category</p>
                  <p className="text-gray-900 font-medium">{profile.service_category}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="text-gray-900 font-medium">{profile.experience_years} years</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-gray-900 font-medium">{profile.location}</p>
                </div>
              </div>

              {profile.bio && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Bio</p>
                  <p className="text-gray-900">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowJobsModal(true)}
                className="w-full bg-primary-50 text-primary-700 px-6 py-4 rounded-lg font-semibold hover:bg-primary-100 transition-colors text-left flex items-center justify-between"
              >
                <span>View Available Jobs ({jobs.length})</span>
                <ClipboardList size={20} />
              </button>
              <button className="w-full bg-green-50 text-green-700 px-6 py-4 rounded-lg font-semibold hover:bg-green-100 transition-colors text-left">
                Manage Availability
              </button>
              <button
                onClick={() => setShowDocumentModal(true)}
                className="w-full bg-yellow-50 text-yellow-700 px-6 py-4 rounded-lg font-semibold hover:bg-yellow-100 transition-colors text-left flex items-center justify-between"
              >
                <span>Upload Documents</span>
                <FileText size={20} />
              </button>
              <button
                onClick={() => setShowMessagesModal(true)}
                className="w-full bg-purple-50 text-purple-700 px-6 py-4 rounded-lg font-semibold hover:bg-purple-100 transition-colors text-left flex items-center justify-between"
              >
                <span>Messages ({messages.length})</span>
                <MessageSquare size={20} />
              </button>
              <button className="w-full bg-gray-50 text-gray-700 px-6 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-left">
                View Earnings
              </button>
            </div>

            {profile.status === 'pending' && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold mb-2">Account Pending Verification</p>
                <p className="text-yellow-700 text-sm">
                  Your account is currently under review. Please upload your verification documents to complete the process.
                </p>
              </div>
            )}

            {profile.status === 'verified' && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold mb-2">Account Verified!</p>
                <p className="text-green-700 text-sm">
                  Your account is verified and ready to receive job requests.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="text-center py-8">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No recent activity</p>
            <p className="text-sm text-gray-500 mt-2">Start accepting jobs to see your activity here</p>
          </div>
        </div>
        </>)}
      </div>

      {showJobsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-green-600 text-white p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold">Assigned Jobs</h3>
              <button
                onClick={() => setShowJobsModal(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {jobs.length === 0 ? (
                <div className="text-center py-16">
                  <ClipboardList size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-semibold">No jobs assigned yet</p>
                  <p className="text-sm text-gray-500 mt-2">Jobs assigned by admin will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{job.service_type}</p>
                          <p className="text-sm text-gray-500">{new Date(job.assigned_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            job.status === 'completed' ? 'bg-green-100 text-green-800' :
                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.status.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            job.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                            job.priority === 'low' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {job.priority}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <User size={16} className="text-gray-400 shrink-0" />
                          <span>{job.customer_name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Phone size={16} className="text-gray-400 shrink-0" />
                          <span>{job.customer_phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700 sm:col-span-2">
                          <MapPin size={16} className="text-gray-400 shrink-0" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                      {job.description && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 mb-3">{job.description}</p>
                      )}
                      {job.status !== 'cancelled' && job.status !== 'completed' && (
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          {job.status === 'assigned' && (
                            <button
                              onClick={() => updateJobStatus(job.id, 'in_progress')}
                              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              <Clock size={16} />
                              Mark In Progress
                            </button>
                          )}
                          {(job.status === 'assigned' || job.status === 'in_progress') && (
                            <button
                              onClick={() => updateJobStatus(job.id, 'completed')}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle size={16} />
                              Mark Completed
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDocumentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-green-600 text-white p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold">Upload Documents</h3>
              <button
                onClick={() => { setShowDocumentModal(false); setUploadError(''); setUploadSuccess(false); }}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => { setDocumentType(e.target.value); setUploadError(''); }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="id_card">National ID Card</option>
                  <option value="license">License/Certification</option>
                  <option value="certificate">Professional Certificate</option>
                  <option value="other">Other Document</option>
                </select>
              </div>

              <div className={`mb-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                uploading ? 'border-primary-300 bg-primary-50' : uploadError ? 'border-red-300 bg-red-50' : uploadSuccess ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
              }`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <button
                  onClick={() => { setUploadError(''); fileInputRef.current?.click(); }}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center w-full cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
                      <p className="text-base font-semibold text-primary-700">Uploading...</p>
                      <p className="text-sm text-primary-500 mt-1">Please wait</p>
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <CheckCircle size={48} className="text-green-500 mb-3" />
                      <p className="text-base font-semibold text-green-700">Uploaded successfully!</p>
                      <p className="text-sm text-green-600 mt-1">Click to upload another document</p>
                    </>
                  ) : (
                    <>
                      <Upload size={48} className="text-gray-400 mb-3" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">Click to upload</p>
                      <p className="text-sm text-gray-500">JPG, PNG, WEBP or PDF — max 10 MB</p>
                    </>
                  )}
                </button>
              </div>

              {uploadError && (
                <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}


              {documents.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText size={24} className="text-primary-600" />
                          <div>
                            <p className="font-semibold text-gray-900">{doc.file_name}</p>
                            <p className="text-sm text-gray-600 capitalize">{doc.document_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {doc.verified ? (
                            <span className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              <CheckCircle size={16} />
                              <span>Verified</span>
                            </span>
                          ) : doc.rejection_reason ? (
                            <div className="text-right">
                              <span className="block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                                Rejected
                              </span>
                              <p className="text-xs text-gray-600 mt-1">{doc.rejection_reason}</p>
                            </div>
                          ) : (
                            <span className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                              <Clock size={16} />
                              <span>Pending</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showMessagesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-green-600 text-white p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold">Messages</h3>
              <button
                onClick={() => setShowMessagesModal(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-2">Admin will send messages here</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        msg.sender_id === user?.id
                          ? 'bg-primary-600 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-primary-100' : 'text-gray-600'}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="sticky bottom-0 border-t border-gray-200 p-4 bg-white">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
