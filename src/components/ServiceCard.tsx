import type { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
}

export default function ServiceCard({ icon: Icon, title, description, onClick }: ServiceCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-elevation-1 p-8 hover:shadow-elevation-3 transition-all duration-300 cursor-pointer group border-2 border-neutral-100 hover:border-primary-300"
    >
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 w-20 h-20 rounded-xl flex items-center justify-center mb-6 group-hover:from-primary-100 group-hover:to-secondary-100 transition-all duration-300 transform group-hover:scale-110">
        <Icon size={36} className="text-primary-600 group-hover:text-secondary-600 transition-colors" />
      </div>
      <h3 className="text-lg font-bold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors">{title}</h3>
      <p className="text-neutral-600 text-sm leading-relaxed">{description}</p>
      <div className="mt-5 flex items-center text-primary-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-sm">Explore service</span>
        <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </div>
  );
}
