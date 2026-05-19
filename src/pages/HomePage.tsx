import { useState } from 'react';
import { Smartphone, Star, Users, Shield, Clock } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import ServiceCard from '../components/ServiceCard';
import PartnersSlider from '../components/PartnersSlider';
import TeamSlider from '../components/TeamSlider';
import Gallery from '../components/Gallery';
import {
  Sparkles,
  Car,
  Zap,
  Wrench,
  Hammer,
  Settings,
  ChefHat,
  GraduationCap
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [bookingService, setBookingService] = useState<string | null>(null);

  const services = [
    {
      icon: Sparkles,
      title: 'Cleaner',
      description: 'Professional cleaning services for homes and offices'
    },
    {
      icon: Car,
      title: 'Driver',
      description: 'Experienced and reliable drivers for personal or business use'
    },
    {
      icon: Zap,
      title: 'Electrician',
      description: 'Licensed electricians for installations and repairs'
    },
    {
      icon: Wrench,
      title: 'Plumber',
      description: 'Expert plumbing services for all your needs'
    },
    {
      icon: Hammer,
      title: 'Carpenter',
      description: 'Skilled carpenters for furniture and woodwork'
    },
    {
      icon: Settings,
      title: 'Repair Technician',
      description: 'Professional repair services for various equipment'
    },
    {
      icon: ChefHat,
      title: 'Cook / Chef',
      description: 'Personal chefs and professional cooks'
    },
    {
      icon: GraduationCap,
      title: 'Tutor',
      description: 'Qualified tutors and instructors for all subjects'
    }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Choose Service',
      description: 'Select from our range of professional services'
    },
    {
      step: '2',
      title: 'Select Duration',
      description: 'Choose contract or permanent arrangement'
    },
    {
      step: '3',
      title: 'Get Matched',
      description: 'We connect you with verified professionals'
    },
    {
      step: '4',
      title: 'Track & Review',
      description: 'Monitor progress and rate your experience'
    }
  ];

  const testimonials = [
    {
      name: 'Aisha Mohammed',
      role: 'Homeowner, Kano',
      content: 'Finding reliable help was always a challenge. Danhausa Services made it so easy! Our cleaner is professional and trustworthy.',
      rating: 5
    },
    {
      name: 'Ibrahim Yusuf',
      role: 'Business Owner, Kaduna',
      content: 'We hired multiple staff through Danhausa for our office. The verification process gives us peace of mind. Highly recommended!',
      rating: 5
    },
    {
      name: 'Fatima Abdullah',
      role: 'Parent, Zaria',
      content: 'The tutor we found through this platform has been amazing for our children. Professional service from start to finish.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary-600 via-primary-50 to-secondary-50 py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-32 -mb-32"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Trusted by 50,000+ Customers
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
              Trusted Home & Business Services at Your Fingertips
            </h1>
            <p className="text-lg md:text-xl text-neutral-700 mb-10 leading-relaxed max-w-2xl mx-auto">
              Connect with verified, skilled professionals across Northern Nigeria. From cleaners to electricians, find reliable help for your home or business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setBookingService('Professional Cleaner')}
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 shadow-md"
              >
                Book a Service
              </button>
              <button
                onClick={() => onNavigate('provider')}
                className="bg-white text-secondary-600 border-2 border-secondary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-secondary-50 transition-all transform hover:scale-105"
              >
                Become a Provider
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Our Services</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              From household help to business support, we've got you covered with verified professionals
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                icon={service.icon}
                title={service.title}
                description={service.description}
                onClick={() => onNavigate('services')}
              />
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('services')}
              className="text-primary-600 font-bold hover:text-primary-700 transition-colors text-lg"
            >
              Explore all 8 services →
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">How It Works</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Getting the help you need is simple and straightforward
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center relative">
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-1/2 h-1 bg-gradient-to-r from-primary-300 to-transparent"></div>
                )}
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg relative z-10">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Why Choose Us</h2>
            <p className="text-lg text-neutral-600">We prioritize your safety, convenience, and peace of mind</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-secondary-50 to-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all border border-secondary-100">
              <div className="bg-gradient-to-br from-secondary-400 to-secondary-600 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Verified Workers</h3>
              <p className="text-neutral-600 leading-relaxed">
                All service providers are thoroughly verified and background-checked for your peace of mind
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all border border-primary-100">
              <div className="bg-gradient-to-br from-primary-400 to-primary-600 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Clock size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Real-Time Tracking</h3>
              <p className="text-neutral-600 leading-relaxed">
                Track your service requests and stay updated every step of the way with live notifications
              </p>
            </div>
            <div className="bg-gradient-to-br from-secondary-50 to-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all border border-secondary-100">
              <div className="bg-gradient-to-br from-secondary-400 to-secondary-600 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Trusted Community</h3>
              <p className="text-neutral-600 leading-relaxed">
                Join thousands of satisfied customers across Northern Nigeria and beyond
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-neutral-600">Real experiences from real customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-8 border border-neutral-100">
                <div className="flex mb-4 space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="text-secondary-400 fill-current" />
                  ))}
                </div>
                <p className="text-neutral-700 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="pt-4 border-t border-neutral-100">
                  <p className="font-bold text-neutral-900">{testimonial.name}</p>
                  <p className="text-sm text-primary-600 font-medium">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10 -mr-48 -mt-48"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/20 backdrop-blur-sm w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Smartphone size={56} className="text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Download Our Mobile App</h2>
            <p className="text-xl mb-10 leading-relaxed opacity-95">
              Get the full experience on your mobile device. Book services, track progress, and manage everything seamlessly on the go.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                <span>Download on Google Play</span>
              </button>
              <button className="bg-white/20 text-white border-2 border-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                <span>Download on App Store</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Meet Our Team</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Dedicated professionals committed to connecting you with quality services
            </p>
          </div>
          <TeamSlider />
        </div>
      </section>

      <Gallery />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Trusted by Leading Organizations</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Partnering with businesses, institutions, and organizations across Northern Nigeria
            </p>
          </div>
          <PartnersSlider />
        </div>
      </section>

      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Serving Northern Nigeria</h2>
            <p className="text-neutral-600 mb-6 leading-relaxed">
              We're proud to serve communities across Northern Nigeria, connecting local talent with opportunities and providing reliable services to households and businesses.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-neutral-700">
              <span className="bg-neutral-100 px-4 py-2 rounded-full">Kano</span>
              <span className="bg-neutral-100 px-4 py-2 rounded-full">Kaduna</span>
              <span className="bg-neutral-100 px-4 py-2 rounded-full">Zaria</span>
              <span className="bg-neutral-100 px-4 py-2 rounded-full">Katsina</span>
              <span className="bg-neutral-100 px-4 py-2 rounded-full">Sokoto</span>
              <span className="bg-neutral-100 px-4 py-2 rounded-full">Maiduguri</span>
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
