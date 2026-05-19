import { useEffect, useRef } from 'react';
import { Building2 } from 'lucide-react';

export default function PartnersSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const partners = [
    { name: 'Kano State Government', category: 'Government' },
    { name: 'Kaduna Business Hub', category: 'Business' },
    { name: 'Northern Hotels Group', category: 'Hospitality' },
    { name: 'Ahmadu Bello University', category: 'Education' },
    { name: 'Sokoto Tech Park', category: 'Technology' },
    { name: 'Zaria Manufacturing Co.', category: 'Manufacturing' },
    { name: 'Katsina Healthcare', category: 'Healthcare' },
    { name: 'Maiduguri Retail Center', category: 'Retail' },
    { name: 'Northern Construction Ltd', category: 'Construction' },
    { name: 'Bauchi Industrial Estate', category: 'Industrial' },
  ];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const scroll = () => {
      scrollPosition += scrollSpeed;

      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {[...partners, ...partners].map((partner, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-64 bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-primary-50 w-12 h-12 rounded-lg flex items-center justify-center">
                <Building2 size={24} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm leading-tight">
                  {partner.name}
                </h3>
              </div>
            </div>
            <span className="inline-block text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
              {partner.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
