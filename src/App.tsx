import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import BusinessesPage from './pages/BusinessesPage';
import ProviderPage from './pages/ProviderPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import ProviderRegisterPage from './pages/provider/ProviderRegisterPage';
import ProviderLoginPage from './pages/provider/ProviderLoginPage';
import ProviderDashboardPage from './pages/provider/ProviderDashboardPage';
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import CustomerRegisterPage from './pages/customer/CustomerRegisterPage';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import BusinessLoginPage from './pages/business/BusinessLoginPage';
import BusinessRegisterPage from './pages/business/BusinessRegisterPage';
import BusinessDashboardPage from './pages/business/BusinessDashboardPage';
import AgentLoginPage from './pages/agent/AgentLoginPage';
import AgentRegisterPage from './pages/agent/AgentRegisterPage';
import AgentDashboardPage from './pages/agent/AgentDashboardPage';
import AgentInfoPage from './pages/AgentInfoPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import LogoDownloadPage from './pages/LogoDownloadPage';
import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const isAdmin = data.user.user_metadata?.role === 'admin' ||
                       data.user.app_metadata?.role === 'admin';
        setAdminLoggedIn(isAdmin);
      }
    } catch (err) {
      console.error('Error checking admin auth:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    if (currentPage === 'admin-login') {
      return <AdminLoginPage onLoginSuccess={() => {
        setAdminLoggedIn(true);
        setCurrentPage('admin-dashboard');
      }} />;
    }

    if (currentPage === 'admin-dashboard') {
      if (!adminLoggedIn) {
        setCurrentPage('admin-login');
        return <AdminLoginPage onLoginSuccess={() => {
          setAdminLoggedIn(true);
          setCurrentPage('admin-dashboard');
        }} />;
      }
      return <AdminDashboard onLogout={() => {
        setAdminLoggedIn(false);
        setCurrentPage('home');
      }} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'services':
        return <ServicesPage onNavigate={handleNavigate} />;
      case 'businesses':
        return <BusinessesPage onNavigate={handleNavigate} />;
      case 'provider':
        return <ProviderPage onNavigate={handleNavigate} />;
      case 'how-it-works':
        return <HowItWorksPage onNavigate={handleNavigate} />;
      case 'pricing':
        return <PricingPage onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactPage onNavigate={handleNavigate} />;
      case 'provider-register':
        return <ProviderRegisterPage onNavigate={handleNavigate} />;
      case 'provider-login':
        return <ProviderLoginPage onNavigate={handleNavigate} />;
      case 'provider-dashboard':
        return <ProviderDashboardPage onNavigate={handleNavigate} />;
      case 'customer-login':
        return <CustomerLoginPage onNavigate={handleNavigate} />;
      case 'customer-register':
        return <CustomerRegisterPage onNavigate={handleNavigate} />;
      case 'customer-dashboard':
        return <CustomerDashboardPage onNavigate={handleNavigate} />;
      case 'business-login':
        return <BusinessLoginPage onNavigate={handleNavigate} />;
      case 'business-register':
        return <BusinessRegisterPage onNavigate={handleNavigate} />;
      case 'business-dashboard':
        return <BusinessDashboardPage onNavigate={handleNavigate} />;
      case 'agent-info':
        return <AgentInfoPage onNavigate={handleNavigate} />;
      case 'agent-login':
        return <AgentLoginPage onNavigate={handleNavigate} />;
      case 'agent-register':
        return <AgentRegisterPage onNavigate={handleNavigate} />;
      case 'agent-dashboard':
        return <AgentDashboardPage onNavigate={handleNavigate} />;
      case 'logo':
        return <LogoDownloadPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const isProviderRoute = ['provider-register', 'provider-login', 'provider-dashboard'].includes(currentPage);
  const isCustomerRoute = ['customer-login', 'customer-register', 'customer-dashboard'].includes(currentPage);
  const isAgentRoute = ['agent-login', 'agent-register', 'agent-dashboard'].includes(currentPage);
  const isBusinessRoute = ['business-login', 'business-register', 'business-dashboard'].includes(currentPage);
  const isAdminRoute = ['admin-login', 'admin-dashboard'].includes(currentPage);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        {!isProviderRoute && !isCustomerRoute && !isAgentRoute && !isAdminRoute && !isBusinessRoute && <Header currentPage={currentPage} onNavigate={handleNavigate} />}
        <main>{renderPage()}</main>
        {!isProviderRoute && !isCustomerRoute && !isAgentRoute && !isAdminRoute && !isBusinessRoute && <Footer onNavigate={handleNavigate} />}
        {!isProviderRoute && !isCustomerRoute && !isAgentRoute && !isAdminRoute && !isBusinessRoute && <WhatsAppButton />}
      </div>
    </AuthProvider>
  );
}

export default App;
