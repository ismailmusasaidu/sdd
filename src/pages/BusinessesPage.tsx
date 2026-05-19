import { Building2, Users, Shield, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface BusinessesPageProps {
  onNavigate: (page: string) => void;
}

export default function BusinessesPage({ onNavigate }: BusinessesPageProps) {
  const benefits = [
    {
      icon: Users,
      title: 'Bulk Hiring',
      description: 'Hire multiple professionals at once for your business needs'
    },
    {
      icon: Shield,
      title: 'Verified Workers',
      description: 'All workers undergo thorough background checks and verification'
    },
    {
      icon: Clock,
      title: 'Priority Support',
      description: 'Dedicated account manager and 24/7 priority customer support'
    },
    {
      icon: TrendingUp,
      title: 'Business Analytics',
      description: 'Track performance, attendance, and service quality metrics'
    }
  ];

  const features = [
    'Dedicated account management',
    'Custom service packages',
    'Volume discounts',
    'Flexible payment terms',
    'Worker replacement guarantee',
    'Performance tracking dashboard',
    'Priority booking',
    'Invoice management',
    'Multiple location support',
    'Contract customization'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Building2 size={64} className="mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Business Solutions</h1>
            <p className="text-xl opacity-90 leading-relaxed">
              Tailored staffing solutions for businesses across Northern Nigeria. Scale your operations with reliable, verified professionals.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Businesses Choose Us</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We understand the unique staffing needs of businesses and provide solutions that scale
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                  <div className="bg-primary-50 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon size={32} className="text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Business Features</h2>
              <p className="text-gray-600">Everything your business needs in one platform</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg">
                  <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">{feature}</span>
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Industries We Serve</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Offices & Corporations</h3>
                <p className="text-gray-600">Full-service staffing for corporate environments</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Hotels & Hospitality</h3>
                <p className="text-gray-600">Reliable staff for hospitality businesses</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Educational Institutions</h3>
                <p className="text-gray-600">Support staff and specialized services</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Healthcare Facilities</h3>
                <p className="text-gray-600">Non-medical support services</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Retail & Shopping Centers</h3>
                <p className="text-gray-600">Maintenance and cleaning services</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Manufacturing & Warehouses</h3>
                <p className="text-gray-600">Industrial support services</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join hundreds of businesses across Northern Nigeria that trust us for their staffing needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('business-register')}
                className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Register Your Business
              </button>
              <button
                onClick={() => onNavigate('business-login')}
                className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Business Login
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
