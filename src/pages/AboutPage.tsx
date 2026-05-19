import { Heart, Users, Target, Award, TrendingUp, MapPin } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const values = [
    {
      icon: Heart,
      title: 'Trust & Safety',
      description: 'Every service provider is thoroughly vetted and verified to ensure your safety and peace of mind'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe in empowering local communities by creating opportunities for skilled workers'
    },
    {
      icon: Award,
      title: 'Quality Service',
      description: 'We maintain high standards through ratings, reviews, and continuous quality monitoring'
    },
    {
      icon: TrendingUp,
      title: 'Growth & Development',
      description: 'Supporting the professional growth of service providers while serving our customers better'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Service Providers' },
    { number: '50,000+', label: 'Happy Customers' },
    { number: '200,000+', label: 'Services Completed' },
    { number: '15+', label: 'Cities Covered' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Danhausa Services</h1>
            <p className="text-xl opacity-90 leading-relaxed">
              Connecting Northern Nigeria with trusted, skilled professionals
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Target size={48} className="mx-auto text-primary-600 mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                To empower local workers and simplify access to reliable services across Northern Nigeria. We're building a platform that creates economic opportunities while making quality services accessible to everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Story</h2>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Danhausa Services was born from a simple observation: finding reliable, skilled workers in Northern Nigeria was unnecessarily difficult, while talented professionals struggled to find consistent work opportunities.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                We set out to solve both problems by creating a platform that connects households and businesses with verified service providers. Our technology makes it easy to find help when you need it, while creating stable income opportunities for skilled workers in our communities.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Today, we're proud to serve thousands of customers and support thousands of service providers across Northern Nigeria. Every successful service connection strengthens our local economy and builds trust within our communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These principles guide everything we do
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8">
                  <div className="bg-primary-50 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                    <value.icon size={32} className="text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Impact</h2>
              <p className="text-xl opacity-90">Making a difference across Northern Nigeria</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                  <div className="text-lg opacity-90">{stat.label}</div>
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
              <MapPin size={48} className="mx-auto text-green-600 mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Proudly Serving Northern Nigeria</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                We're committed to serving communities across the region, creating jobs, and making quality services accessible to everyone. From Kano to Kaduna, from Zaria to Sokoto, we're building a network of trust and opportunity.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Our Coverage Areas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Kano', 'Kaduna', 'Zaria', 'Katsina', 'Sokoto', 'Maiduguri', 'Bauchi', 'Jos', 'Gombe', 'Damaturu', 'Dutse', 'Birnin Kebbi'].map((city, index) => (
                  <div key={index} className="text-center py-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-800 font-medium">{city}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Passionate professionals dedicated to connecting Northern Nigeria with opportunity
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: 'Abubakar Hassan',
                  role: 'Founder & CEO',
                  bio: 'Tech entrepreneur with 10+ years in the services industry'
                },
                {
                  name: 'Zainab Abubakar',
                  role: 'Chief Operating Officer',
                  bio: 'Operations expert focused on quality and customer satisfaction'
                },
                {
                  name: 'Musa Ibrahim',
                  role: 'Head of Provider Relations',
                  bio: 'Committed to supporting and empowering service providers'
                },
                {
                  name: 'Fatima Suleiman',
                  role: 'Head of Customer Success',
                  bio: 'Dedicated to creating positive experiences for all customers'
                }
              ].map((member, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-green-400 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-sm font-semibold text-primary-600 mb-2">{member.role}</p>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Join Our Growing Community</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Whether you need services or want to provide them, we're here to help
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('services')}
                className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Find Services
              </button>
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
    </div>
  );
}
