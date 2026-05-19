import { useState } from 'react';
import { X, CheckCircle, Calendar, MapPin, Phone, Mail, User, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookingModalProps {
  serviceTitle: string;
  onClose: () => void;
}

const serviceTypes = [
  'Professional Cleaner',
  'Professional Driver',
  'Licensed Electrician',
  'Expert Plumber',
  'Carpenter / Woodwork Specialist',
  'Repair Technician',
  'Cook / Personal Chef',
  'Professional Tutor / Instructor',
];

export default function BookingModal({ serviceTitle, onClose }: BookingModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    service_type: serviceTitle,
    hiring_type: 'contract',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    location: '',
    preferred_date: '',
    description: '',
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload: Record<string, string | null> = {
        service_type: form.service_type,
        hiring_type: form.hiring_type,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        location: form.location.trim(),
        preferred_date: form.preferred_date || null,
        description: form.description.trim() || null,
        status: 'new',
      };

      const { error: dbError } = await supabase
        .from('service_bookings')
        .insert([payload]);

      if (dbError) throw dbError;

      setStep('success');
    } catch (err) {
      console.error('Booking error:', err);
      setError('Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-green-600 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-sm font-medium opacity-80">Booking Request</p>
            <h2 className="text-xl font-bold">{form.service_type}</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {step === 'success' ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={44} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Submitted!</h3>
            <p className="text-gray-600 mb-2">
              Your request for <span className="font-semibold text-primary-600">{form.service_type}</span> has been received.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Our team will contact you shortly on <span className="font-medium">{form.customer_phone}</span> to confirm.
            </p>
            <button
              onClick={onClose}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Service & Hiring Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Service Type</label>
                <div className="relative">
                  <select
                    value={form.service_type}
                    onChange={e => set('service_type', e.target.value)}
                    required
                    className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white pr-8 text-gray-900"
                  >
                    {serviceTypes.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Hiring Type</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {(['contract', 'permanent'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set('hiring_type', type)}
                      className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                        form.hiring_type === type
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  <span className="flex items-center gap-1"><User size={14} />Full Name</span>
                </label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={e => set('customer_name', e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  <span className="flex items-center gap-1"><Phone size={14} />Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={e => set('customer_phone', e.target.value)}
                  placeholder="e.g. 0801 234 5678"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {/* Email & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  <span className="flex items-center gap-1"><Mail size={14} />Email <span className="text-gray-400 font-normal">(optional)</span></span>
                </label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={e => set('customer_email', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  <span className="flex items-center gap-1"><MapPin size={14} />Location</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="City / Area"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {/* Preferred Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                <span className="flex items-center gap-1"><Calendar size={14} />Preferred Date <span className="text-gray-400 font-normal">(optional)</span></span>
              </label>
              <input
                type="date"
                value={form.preferred_date}
                onChange={e => set('preferred_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Additional Details <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe what you need in more detail..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : 'Submit Booking Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
