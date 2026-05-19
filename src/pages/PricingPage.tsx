import { Home, Building2, CheckCircle, X } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (page: string) => void;
}

export default function PricingPage({ onNavigate }: PricingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Transparent Pricing</h1>
            <p className="text-xl opacity-90 leading-relaxed">
              Simple, honest pricing with no hidden fees. Choose the plan that works best for you.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-gray-200">
                <div className="text-center mb-6">
                  <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home size={40} className="text-primary-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Household Plan</h2>
                  <p className="text-gray-600">Perfect for individual homes and families</p>
                </div>
                <div className="mb-8">
                  <div className="text-center py-6 bg-primary-50 rounded-lg">
                    <div className="text-4xl font-bold text-primary-600 mb-2">Pay Per Service</div>
                    <p className="text-gray-600">No subscription required</p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Access to all service categories</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Verified professional workers</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Contract or permanent hiring</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Real-time tracking</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Customer support</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Rating and review system</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <X size={24} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400">Priority support</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <X size={24} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400">Bulk hiring discounts</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('contact')}
                  className="w-full bg-primary-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </button>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-primary-50 rounded-xl shadow-xl p-8 border-2 border-green-400 relative">
                <div className="absolute top-0 right-8 bg-green-600 text-white px-4 py-1 rounded-b-lg text-sm font-semibold">
                  BEST FOR BUSINESS
                </div>
                <div className="text-center mb-6 mt-4">
                  <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 size={40} className="text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Business Plan</h2>
                  <p className="text-gray-600">Tailored solutions for organizations</p>
                </div>
                <div className="mb-8">
                  <div className="text-center py-6 bg-white rounded-lg shadow-md">
                    <div className="text-4xl font-bold text-green-600 mb-2">Custom Pricing</div>
                    <p className="text-gray-600">Based on your needs</p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Everything in Household Plan</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Priority support (24/7)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Bulk hiring discounts</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Dedicated account manager</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Custom service packages</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Flexible payment terms</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Performance analytics</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Invoice management</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('contact')}
                  className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pricing by Service Category</h2>
              <p className="text-gray-600">Estimated rates for common services (actual rates may vary)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { service: 'Cleaner', contract: '₦5,000 - ₦8,000/day', permanent: '₦40,000 - ₦60,000/month' },
                { service: 'Driver', contract: '₦8,000 - ₦12,000/day', permanent: '₦60,000 - ₦100,000/month' },
                { service: 'Electrician', contract: '₦10,000 - ₦15,000/day', permanent: '₦70,000 - ₦120,000/month' },
                { service: 'Plumber', contract: '₦10,000 - ₦15,000/day', permanent: '₦70,000 - ₦120,000/month' },
                { service: 'Carpenter', contract: '₦12,000 - ₦18,000/day', permanent: '₦80,000 - ₦150,000/month' },
                { service: 'Repair Technician', contract: '₦8,000 - ₦12,000/day', permanent: '₦60,000 - ₦100,000/month' },
                { service: 'Cook / Chef', contract: '₦8,000 - ₦15,000/day', permanent: '₦50,000 - ₦100,000/month' },
                { service: 'Tutor', contract: '₦5,000 - ₦10,000/session', permanent: '₦50,000 - ₦120,000/month' }
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.service}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contract:</span>
                      <span className="font-semibold text-gray-900">{item.contract}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Permanent:</span>
                      <span className="font-semibold text-gray-900">{item.permanent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-primary-50 border-l-4 border-primary-600 p-6 rounded">
              <p className="text-gray-700">
                <span className="font-semibold">Note:</span> All prices are estimates and may vary based on experience level, location, and specific requirements. Contact us for accurate quotes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Have Questions?</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Our team is here to help you find the perfect solution for your needs
            </p>
            <button
              onClick={() => onNavigate('contact')}
              className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Contact Us Today
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
