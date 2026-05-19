import { UserCheck, TrendingUp, Shield, Wallet, CheckCircle, FileText } from 'lucide-react';

interface ProviderPageProps {
  onNavigate: (page: string) => void;
}

export default function ProviderPage({ onNavigate }: ProviderPageProps) {
  const benefits = [
    {
      icon: Wallet,
      title: 'Earn Good Income',
      description: 'Competitive pay rates and regular work opportunities'
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Career',
      description: 'Build your reputation and expand your client base'
    },
    {
      icon: Shield,
      title: 'Work Security',
      description: 'Verified clients and secure payment processing'
    },
    {
      icon: UserCheck,
      title: 'Flexible Schedule',
      description: 'Choose when and where you want to work'
    }
  ];

  const requirements = [
    'Valid government-issued ID',
    'Proof of address',
    'Skills certification or proof of experience',
    'Character references',
    'Clean criminal background check',
    'Smartphone for app access'
  ];

  const steps = [
    {
      number: '1',
      title: 'Create Your Profile',
      description: 'Sign up and provide your basic information and skills'
    },
    {
      number: '2',
      title: 'Submit Documents',
      description: 'Upload required verification documents for review'
    },
    {
      number: '3',
      title: 'Get Verified',
      description: 'Our team reviews and verifies your credentials'
    },
    {
      number: '4',
      title: 'Start Earning',
      description: 'Get matched with clients and start accepting jobs'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-green-600 to-primary-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <UserCheck size={64} className="mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Become a Service Provider</h1>
            <p className="text-xl opacity-90 leading-relaxed">
              Join our network of trusted professionals and connect with thousands of customers across Northern Nigeria
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Join Danhausa Services?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We provide the platform, you provide the skills. Together, we create opportunities.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How to Get Started</h2>
              <p className="text-gray-600">Four simple steps to start your journey with us</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <FileText size={48} className="mx-auto text-primary-600 mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Requirements</h2>
              <p className="text-gray-600">Make sure you have these documents ready before applying</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{requirement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Service Categories</h2>
              <p className="text-gray-600">Choose your area of expertise</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Cleaner', 'Driver', 'Electrician', 'Plumber', 'Carpenter', 'Technician', 'Cook', 'Tutor'].map((category, index) => (
                <div key={index} className="bg-primary-50 rounded-lg p-4 text-center font-semibold text-gray-800">
                  {category}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Earning?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of skilled professionals making a difference in their communities
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('provider-register')}
                className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Register Now
              </button>
              <button
                onClick={() => onNavigate('provider-login')}
                className="bg-green-700 text-white border-2 border-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-800 transition-colors"
              >
                Already Registered? Login
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
