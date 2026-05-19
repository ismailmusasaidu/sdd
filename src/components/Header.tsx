import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'Services', id: 'services' },
    { name: 'For Businesses', id: 'businesses' },
    { name: 'Become a Provider', id: 'provider' },
    { name: 'Pricing', id: 'pricing' },
    { name: 'About', id: 'about' },
    { name: 'Become an Agent', id: 'agent-info' },
  ];

  const nav = (id: string) => { onNavigate(id); setIsMenuOpen(false); };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-neutral-200 shadow-sm">
      <div className="container mx-auto px-4 xl:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <button
            onClick={() => nav('home')}
            className="flex items-center gap-2 shrink-0 hover:opacity-85 transition-opacity"
          >
            <img
              src="/image.png"
              alt="Danhausa Services"
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold text-base text-primary-800 leading-tight hidden sm:block">
              Danhausa <span className="text-secondary-500">Home</span> Services
            </span>
          </button>

          {/* Desktop nav — center */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => nav(item.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  currentPage === item.id
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Desktop actions — right */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <button
              onClick={() => nav('contact')}
              className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => nav('customer-login')}
              className="px-4 py-1.5 text-sm font-semibold text-primary-700 border border-primary-200 rounded-md hover:bg-primary-50 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => nav('customer-register')}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-primary rounded-md hover:shadow-glow-primary transition-all shadow-sm"
            >
              Book a Service
            </button>
          </div>

          {/* Tablet nav — condensed (lg but not xl) */}
          <nav className="hidden lg:flex xl:hidden items-center gap-0.5">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => nav(item.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  currentPage === item.id
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
          <div className="hidden lg:flex xl:hidden items-center gap-2 shrink-0">
            <button
              onClick={() => nav('customer-login')}
              className="px-3 py-1.5 text-xs font-semibold text-primary-700 border border-primary-200 rounded-md hover:bg-primary-50 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => nav('customer-register')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-primary rounded-md hover:shadow-glow-primary transition-all"
            >
              Book Service
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-neutral-100 bg-white">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => nav(item.id)}
                className={`text-left py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                  currentPage === item.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {item.name}
              </button>
            ))}
            <button
              onClick={() => nav('contact')}
              className="text-left py-2.5 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-md"
            >
              Contact
            </button>
            <div className="flex gap-2 pt-2 border-t border-neutral-100 mt-1">
              <button
                onClick={() => nav('customer-login')}
                className="flex-1 py-2.5 text-sm font-semibold text-primary-700 border border-primary-200 rounded-md hover:bg-primary-50 transition-all text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => nav('customer-register')}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-primary rounded-md text-center"
              >
                Book a Service
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
