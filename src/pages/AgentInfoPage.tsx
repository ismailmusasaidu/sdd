import {
  Briefcase, TrendingUp, Users, Wallet, CheckCircle, FileText,
  ClipboardList, UserCheck, ShieldCheck, Star, ArrowRight,
} from 'lucide-react';

interface AgentInfoPageProps {
  onNavigate: (page: string) => void;
}

export default function AgentInfoPage({ onNavigate }: AgentInfoPageProps) {
  const benefits = [
    {
      icon: Wallet,
      title: 'Earn Commission',
      description: 'Earn competitive commissions on every service booking you bring in for clients.',
    },
    {
      icon: Users,
      title: 'Build a Client Base',
      description: 'Grow your own network of clients and earn recurring income from repeat service requests.',
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Advance your career by becoming a trusted intermediary in the home services industry.',
    },
    {
      icon: ShieldCheck,
      title: 'Backed by Danhausa',
      description: 'Operate under a reputable brand with verified professionals and secure processes.',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Submit Application',
      description: 'Register with your details including name, contact, location, and company (if applicable).',
    },
    {
      number: '2',
      title: 'Wait for Approval',
      description: 'Our admin team reviews your application within 24–48 hours and approves eligible agents.',
    },
    {
      number: '3',
      title: 'Access Your Portal',
      description: 'Once approved, log in to your Agent Dashboard to start submitting service requests.',
    },
    {
      number: '4',
      title: 'Submit Requests',
      description: 'Create bookings on behalf of your clients — we handle the matching and fulfilment.',
    },
  ];

  const requirements = [
    'Valid government-issued ID (NIN, driver\'s licence or passport)',
    'Active phone number and email address',
    'Verifiable location / area of operation',
    'Ability to identify and bring in genuine service requests',
    'Agreement to Danhausa\'s agent code of conduct',
    'Smartphone or computer for portal access',
  ];

  const faqs = [
    {
      q: 'Is there a fee to register as an agent?',
      a: 'No. Registration is completely free. You only earn when you successfully bring in bookings.',
    },
    {
      q: 'How do I get paid?',
      a: 'Commissions are calculated per confirmed booking and paid directly to your registered account.',
    },
    {
      q: 'Can I submit requests for multiple clients?',
      a: 'Yes. Your dashboard lets you manage and track all requests for all your clients in one place.',
    },
    {
      q: 'What if my application is rejected?',
      a: 'You will be notified with a reason. You may re-apply after addressing the stated concerns.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white/90 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Briefcase size={14} /> Agent Programme
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
              Become a Danhausa<br />
              <span className="text-secondary-400">Home Services Agent</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
              Partner with us to connect clients to trusted home service professionals. Submit requests on behalf of your clients and earn commission — all from your own dedicated portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <button
                onClick={() => onNavigate('agent-register')}
                className="flex items-center justify-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-lg hover:shadow-xl"
              >
                Apply to Become an Agent <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onNavigate('agent-login')}
                className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 px-8 py-4 rounded-xl text-base font-semibold transition-all"
              >
                Agent Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Why Become an Agent?</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Join a growing network of agents earning income by connecting people to the home services they need.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                    <div className="bg-primary-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon size={28} className="text-primary-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{b.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{b.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
              <p className="text-gray-500">Four simple steps from application to earning</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Connector line — desktop only */}
              <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-primary-100 z-0" />
              {steps.map((step, i) => (
                <div key={i} className="relative text-center z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-md">
                    {step.number}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-2xl mx-auto mb-4">
                <FileText size={28} className="text-primary-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Requirements</h2>
              <p className="text-gray-500">Make sure you meet these criteria before applying</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <CheckCircle size={20} className="text-primary-600" />
                    </div>
                    <span className="text-gray-700 text-sm leading-relaxed">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What agents do */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">What Agents Do</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                As an agent, you act as the bridge between clients who need services and our vetted professionals.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: ClipboardList,
                  title: 'Submit Service Requests',
                  desc: 'Use your portal to submit requests on behalf of clients — specifying the service, location, and preferred date.',
                },
                {
                  icon: UserCheck,
                  title: 'Track Booking Status',
                  desc: 'Monitor the progress of every request in real-time — from submission through to completion.',
                },
                {
                  icon: Star,
                  title: 'Earn on Every Booking',
                  desc: 'Receive commission for each booking that progresses to a confirmed or completed status.',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-primary-50 rounded-2xl border border-primary-100 p-6">
                    <div className="bg-primary-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                      <Icon size={22} className="text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Common Questions</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
                  <p className="font-bold text-gray-900 mb-2">{faq.q}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary-800 to-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Briefcase size={48} className="mx-auto mb-5 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join Our Agent Network?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Apply today and start earning by connecting people to the home services they need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('agent-register')}
                className="flex items-center justify-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-lg"
              >
                Apply Now <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onNavigate('agent-login')}
                className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 px-8 py-4 rounded-xl text-base font-semibold transition-all"
              >
                Already an Agent? Log In
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
