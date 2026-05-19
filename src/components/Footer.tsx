import { Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import Logo from './Logo';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gradient-dark text-neutral-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="mb-5">
              <Logo size="sm" variant="full" />
            </div>
            <p className="text-sm leading-relaxed text-neutral-400 mb-5">
              Premium home and business services. Connecting Northern Nigeria with verified, skilled professionals.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="bg-neutral-800 hover:bg-primary-600 p-2 rounded-lg transition-all hover:shadow-glow-primary">
                <Facebook size={16} />
              </a>
              <a href="#" className="bg-neutral-800 hover:bg-primary-600 p-2 rounded-lg transition-all hover:shadow-glow-primary">
                <Twitter size={16} />
              </a>
              <a href="#" className="bg-neutral-800 hover:bg-primary-600 p-2 rounded-lg transition-all hover:shadow-glow-primary">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wide">Services</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button onClick={() => onNavigate('services')} className="text-neutral-400 hover:text-primary-300 transition-colors font-medium">
                  Our Services
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('businesses')} className="text-neutral-400 hover:text-primary-300 transition-colors font-medium">
                  For Businesses
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('provider')} className="text-neutral-400 hover:text-primary-300 transition-colors font-medium">
                  Become a Provider
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="text-neutral-400 hover:text-primary-300 transition-colors font-medium">
                  Pricing
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wide">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button onClick={() => onNavigate('about')} className="text-neutral-400 hover:text-primary-300 transition-colors font-medium">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="text-neutral-400 hover:text-primary-300 transition-colors font-medium">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="text-neutral-400 hover:text-primary-300 transition-colors font-medium">
                  Contact
                </button>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-primary-300 transition-colors font-medium">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wide">Get In Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3 group">
                <div className="bg-neutral-800 group-hover:bg-primary-600 p-2 rounded-lg transition-all mt-0.5 flex-shrink-0">
                  <MapPin size={16} />
                </div>
                <span className="text-neutral-400 group-hover:text-primary-300 transition-colors">Northern Nigeria</span>
              </li>
              <li className="flex items-center space-x-3 group">
                <div className="bg-neutral-800 group-hover:bg-primary-600 p-2 rounded-lg transition-all flex-shrink-0">
                  <Phone size={16} />
                </div>
                <a href="tel:+234" className="text-neutral-400 group-hover:text-primary-300 transition-colors">
                  +234 XXX XXX XXXX
                </a>
              </li>
              <li className="flex items-center space-x-3 group">
                <div className="bg-neutral-800 group-hover:bg-primary-600 p-2 rounded-lg transition-all flex-shrink-0">
                  <Mail size={16} />
                </div>
                <a href="mailto:info@danhausaservices.com" className="text-neutral-400 group-hover:text-primary-300 transition-colors">
                  info@danhausaservices.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-500">
          <p>&copy; 2024 Danhausa Services. All rights reserved. | Proudly serving Northern Nigeria</p>
          <button
            onClick={() => onNavigate('admin-login')}
            className="text-neutral-600 hover:text-neutral-400 transition-colors text-xs"
          >
            Admin Login
          </button>
        </div>
      </div>
    </footer>
  );
}
