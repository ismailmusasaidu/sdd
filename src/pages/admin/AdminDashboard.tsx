import { useState, useEffect } from 'react';
import { LogOut, Users, MessageSquare, CheckSquare, Menu, X, Image, Home, CalendarCheck, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/Logo';
import ProviderManagement from './ProviderManagement';
import ReviewManagement from './ReviewManagement';
import TaskAssignment from './TaskAssignment';
import MessagingPanel from './MessagingPanel';
import GalleryManagement from './GalleryManagement';
import BookingsManagement from './BookingsManagement';
import AgentManagement from './AgentManagement';
import BusinessBookingsManagement from './BusinessBookingsManagement';

interface AdminDashboardProps {
  onLogout: () => void;
}

type ActiveTab = 'providers' | 'reviews' | 'tasks' | 'messaging' | 'gallery' | 'bookings' | 'agents' | 'business-bookings';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('providers');
  const [adminEmail, setAdminEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  const [pendingAgentsCount, setPendingAgentsCount] = useState(0);
  const [newBusinessBookingsCount, setNewBusinessBookingsCount] = useState(0);

  useEffect(() => {
    const getAdminInfo = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setAdminEmail(data.user.email || '');
        setAdminName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Admin');
      }
    };
    getAdminInfo();
    fetchNewBookingsCount();
    fetchPendingAgentsCount();
    fetchNewBusinessBookingsCount();
  }, []);

  const fetchNewBookingsCount = async () => {
    const { count } = await supabase
      .from('service_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');
    setNewBookingsCount(count || 0);
  };

  const fetchPendingAgentsCount = async () => {
    const { count } = await supabase
      .from('agent_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingAgentsCount(count || 0);
  };

  const fetchNewBusinessBookingsCount = async () => {
    const { count } = await supabase
      .from('business_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');
    setNewBusinessBookingsCount(count || 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const navItems = [
    { id: 'bookings',          label: 'Bookings',          icon: CalendarCheck, badge: newBookingsCount },
    { id: 'business-bookings', label: 'Business Bookings', icon: CalendarCheck, badge: newBusinessBookingsCount },
    { id: 'agents',            label: 'Agents',            icon: Briefcase,    badge: pendingAgentsCount },
    { id: 'providers',         label: 'Providers',         icon: Users },
    { id: 'reviews',           label: 'Reviews',           icon: MessageSquare },
    { id: 'tasks',             label: 'Tasks',             icon: CheckSquare },
    { id: 'messaging',         label: 'Messages',          icon: MessageSquare },
    { id: 'gallery',           label: 'Gallery',           icon: Image },
  ];

  const getTabIcon = (tab: ActiveTab) => {
    const item = navItems.find(i => i.id === tab);
    return item?.icon || Home;
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 w-64 bg-gradient-dark text-white shadow-xl transform transition-transform duration-300 lg:translate-x-0 lg:static z-50 flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Logo size="sm" variant="icon-only" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white/10 p-1 rounded transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">{adminName}</p>
        </div>

        <nav className="flex-1 mt-8 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setSidebarOpen(false);
                  if (item.id === 'bookings') setNewBookingsCount(0);
                  if (item.id === 'agents') setPendingAgentsCount(0);
                  if (item.id === 'business-bookings') setNewBusinessBookingsCount(0);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {'badge' in item && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
                {isActive && !('badge' in item && item.badge > 0) && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-3 rounded-lg font-semibold transition-all border border-red-500/30 hover:border-red-500/50"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-4 md:p-6 flex items-center justify-between lg:hidden">
          <Logo size="sm" variant="icon-only" />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-600 hover:text-slate-900 p-1"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="hidden lg:flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            {(() => {
              const TabIcon = getTabIcon(activeTab);
              return (
                <>
                  <div className="bg-gradient-primary p-2 rounded-lg">
                    <TabIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {navItems.find(i => i.id === activeTab)?.label}
                    </h2>
                    <p className="text-sm text-slate-600">Manage and monitor your platform</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            {activeTab === 'bookings' && <BookingsManagement />}
            {activeTab === 'business-bookings' && <BusinessBookingsManagement />}
            {activeTab === 'agents' && <AgentManagement />}
            {activeTab === 'providers' && <ProviderManagement />}
            {activeTab === 'reviews' && <ReviewManagement />}
            {activeTab === 'tasks' && <TaskAssignment />}
            {activeTab === 'messaging' && <MessagingPanel />}
            {activeTab === 'gallery' && <GalleryManagement />}
          </div>
        </div>
      </main>
    </div>
  );
}
