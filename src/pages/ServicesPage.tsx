import { useState } from 'react';
import {
  Sparkles,
  Car,
  Zap,
  Wrench,
  Hammer,
  Settings,
  ChefHat,
  GraduationCap,
  CheckCircle
} from 'lucide-react';
import BookingModal from '../components/BookingModal';

interface ServicesPageProps {
  onNavigate: (page: string) => void;
}

export default function ServicesPage({ onNavigate }: ServicesPageProps) {
  const [bookingService, setBookingService] = useState<string | null>(null);

  const services = [
    {
      icon: Sparkles,
      title: 'Professional Cleaner',
      description: 'Expert cleaning services for homes, offices, and commercial spaces',
      features: [
        'Residential cleaning',
        'Office and commercial cleaning',
        'Deep cleaning services',
        'Move-in/move-out cleaning',
        'Regular maintenance cleaning'
      ]
    },
    {
      icon: Car,
      title: 'Professional Driver',
      description: 'Experienced and reliable drivers for personal or business transportation needs',
      features: [
        'Personal driver services',
        'Corporate transportation',
        'Airport transfers',
        'Long-distance trips',
        'Fully licensed and insured'
      ]
    },
    {
      icon: Zap,
      title: 'Licensed Electrician',
      description: 'Certified electricians for all electrical installations and repairs',
      features: [
        'Electrical installations',
        'Wiring and rewiring',
        'Fault diagnosis and repair',
        'Generator installation',
        'Solar panel installation'
      ]
    },
    {
      icon: Wrench,
      title: 'Expert Plumber',
      description: 'Professional plumbing services for residential and commercial properties',
      features: [
        'Pipe installation and repair',
        'Drainage solutions',
        'Water heater installation',
        'Leak detection and repair',
        'Bathroom and kitchen plumbing'
      ]
    },
    {
      icon: Hammer,
      title: 'Carpenter / Woodwork Specialist',
      description: 'Skilled carpenters for custom furniture and woodwork projects',
      features: [
        'Custom furniture design',
        'Cabinet installation',
        'Door and window frames',
        'Furniture repair',
        'Interior woodwork'
      ]
    },
    {
      icon: Settings,
      title: 'Repair Technician',
      description: 'Multi-skilled technicians for equipment and appliance repairs',
      features: [
        'Appliance repair',
        'Air conditioning service',
        'Electronics repair',
        'Equipment maintenance',
        'General repairs'
      ]
    },
    {
      icon: ChefHat,
      title: 'Cook / Personal Chef',
      description: 'Professional cooks and chefs for homes, events, and businesses',
      features: [
        'Daily meal preparation',
        'Event catering',
        'Special dietary requirements',
        'International cuisines',
        'Meal planning services'
      ]
    },
    {
      icon: GraduationCap,
      title: 'Professional Tutor / Instructor',
      description: 'Qualified tutors and instructors for all subjects and age groups',
      features: [
        'Primary and secondary education',
        'Exam preparation',
        'Language instruction',
        'Professional skills training',
        'Adult education'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
            <p className="text-xl opacity-90 leading-relaxed">
              Comprehensive service offerings with verified professionals ready to help you. Choose from contract or permanent arrangements.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className="bg-primary-50 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                    <service.icon size={32} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600">{service.description}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Service Features:</h4>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setBookingService(service.title)}
                  className="mt-6 w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Book This Service
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Flexible Hiring Options</h2>
              <p className="text-gray-600">Choose the arrangement that works best for you</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-primary-50 rounded-xl p-8 border-2 border-primary-200">
                <h3 className="text-2xl font-bold text-primary-900 mb-4">Contract Hiring</h3>
                <p className="text-gray-700 mb-4">Perfect for short-term projects and temporary needs</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>Flexible duration</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>Pay as you go</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>No long-term commitment</span>
                  </li>
                </ul>
              </div>
              <div className="bg-green-50 rounded-xl p-8 border-2 border-green-200">
                <h3 className="text-2xl font-bold text-green-900 mb-4">Permanent Hiring</h3>
                <p className="text-gray-700 mb-4">Ideal for ongoing needs and dedicated staff</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Long-term reliability</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Better rates</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Consistent service quality</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Book a service today or contact us to discuss your specific needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setBookingService('Professional Cleaner')}
                className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Book a Service
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Contact Us
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      {bookingService && (
        <BookingModal
          serviceTitle={bookingService}
          onClose={() => setBookingService(null)}
        />
      )}
    </div>
  );
}
