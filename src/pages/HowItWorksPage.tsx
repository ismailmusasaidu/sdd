import { Search, UserCheck, Calendar, MapPin, Star, MessageSquare } from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (page: string) => void;
}

export default function HowItWorksPage({ onNavigate }: HowItWorksPageProps) {
  const steps = [
    {
      icon: Search,
      title: 'Choose Your Service',
      description: 'Browse our comprehensive list of professional services. From cleaners to electricians, select the service that meets your needs.',
      details: [
        'View detailed service descriptions',
        'Compare different service categories',
        'Check service availability in your area'
      ]
    },
    {
      icon: Calendar,
      title: 'Select Duration',
      description: 'Choose between contract (short-term) or permanent (long-term) arrangements based on your requirements.',
      details: [
        'Contract: Flexible, project-based hiring',
        'Permanent: Long-term, dedicated staff',
        'Customize your service schedule'
      ]
    },
    {
      icon: UserCheck,
      title: 'Get Matched',
      description: 'Our system connects you with verified, skilled professionals who match your specific requirements.',
      details: [
        'View provider profiles and ratings',
        'Check experience and certifications',
        'Read reviews from previous clients'
      ]
    },
    {
      icon: MapPin,
      title: 'Track Progress',
      description: 'Monitor your service request in real-time through our platform. Stay informed at every step.',
      details: [
        'Real-time status updates',
        'Direct communication with provider',
        'Service completion notifications'
      ]
    },
    {
      icon: Star,
      title: 'Review Service',
      description: 'After service completion, rate your experience and help others make informed decisions.',
      details: [
        'Rate service quality',
        'Leave detailed feedback',
        'Build community trust'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <MessageSquare size={64} className="mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h1>
            <p className="text-xl opacity-90 leading-relaxed">
              Getting professional help has never been easier. Follow these simple steps to connect with skilled service providers.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="mb-12 last:mb-0">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                    <div className="flex-shrink-0 mb-6 md:mb-0">
                      <div className="bg-primary-600 text-white w-20 h-20 rounded-full flex items-center justify-center">
                        <step.icon size={40} />
                      </div>
                      <div className="text-center mt-2">
                        <span className="text-2xl font-bold text-primary-600">Step {index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span className="text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex justify-center my-6">
                    <div className="w-1 h-12 bg-primary-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">For Service Providers</h2>
              <p className="text-gray-600">Here's how our platform works for you</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Register & Verify</h3>
                <p className="text-gray-600">Create your profile and complete the verification process</p>
              </div>
              <div className="text-center">
                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Receive Job Offers</h3>
                <p className="text-gray-600">Get matched with clients looking for your skills</p>
              </div>
              <div className="text-center">
                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Work & Earn</h3>
                <p className="text-gray-600">Complete jobs and receive secure payments</p>
              </div>
            </div>
            <div className="text-center mt-10">
              <button
                onClick={() => onNavigate('provider')}
                className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Become a Provider
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Join thousands of satisfied customers and service providers across Northern Nigeria
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('services')}
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
