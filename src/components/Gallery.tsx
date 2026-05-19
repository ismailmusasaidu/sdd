import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  service_category: string;
  image_url: string;
  before_image_url?: string;
  client_name?: string;
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [filter, setFilter] = useState('All');

  const categories = [
    'All',
    'Cleaner',
    'Driver',
    'Electrician',
    'Plumber',
    'Carpenter',
    'Repair Technician',
    'Cook / Chef',
    'Tutor'
  ];

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = filter === 'All'
    ? items
    : items.filter(item => item.service_category === filter);

  const openModal = (item: GalleryItem) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setCurrentImageIndex(0);
  };

  const getModalImages = () => {
    if (!selectedItem) return [];
    const images = [selectedItem.image_url];
    if (selectedItem.before_image_url) {
      images.unshift(selectedItem.before_image_url);
    }
    return images;
  };

  const modalImages = getModalImages();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % modalImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
  };

  if (loading) {
    return (
      <div className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-300 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-neutral-300 rounded w-64 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white via-primary-50 to-secondary-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Portfolio Showcase</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Explore our portfolio of exceptional work across diverse service categories
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-14">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                filter === category
                  ? 'bg-gradient-primary text-white shadow-glow-primary'
                  : 'bg-white text-neutral-700 border-2 border-neutral-200 hover:border-primary-500 hover:text-primary-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500 text-lg">No gallery items available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="group cursor-pointer rounded-2xl overflow-hidden shadow-elevation-2 hover:shadow-elevation-3 transition-all transform hover:scale-105 animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-neutral-200 to-neutral-300">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-dark/0 group-hover:bg-gradient-dark/40 transition-all flex items-end justify-start p-6">
                    <div className="translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="bg-gradient-secondary text-white px-4 py-2 rounded-lg inline-block font-semibold">
                        {item.service_category}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white border-t-4 border-primary-100">
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-neutral-600 text-sm line-clamp-2">{item.description}</p>
                  {item.client_name && (
                    <p className="text-primary-600 font-semibold text-sm mt-3">Client: {item.client_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-neutral-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-elevation-3">
            <div className="sticky top-0 flex items-center justify-between p-6 bg-gradient-primary text-white">
              <h3 className="text-2xl font-bold">{selectedItem.title}</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="relative">
                <img
                  src={modalImages[currentImageIndex]}
                  alt="Gallery"
                  className="w-full h-96 object-cover rounded-xl shadow-elevation-2"
                />
                {modalImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-3 rounded-full transition-all shadow-elevation-2"
                    >
                      <ChevronLeft size={24} className="text-neutral-900" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-3 rounded-full transition-all shadow-elevation-2"
                    >
                      <ChevronRight size={24} className="text-neutral-900" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      {currentImageIndex + 1} / {modalImages.length}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-neutral-600 uppercase mb-3 tracking-wide">Service Category</h4>
                  <div className="inline-block bg-gradient-secondary text-white px-4 py-2 rounded-lg font-semibold">
                    {selectedItem.service_category}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-neutral-600 uppercase mb-3 tracking-wide">Description</h4>
                  <p className="text-neutral-700 leading-relaxed">{selectedItem.description}</p>
                </div>

                {selectedItem.client_name && (
                  <div>
                    <h4 className="text-sm font-bold text-neutral-600 uppercase mb-3 tracking-wide">Client</h4>
                    <p className="text-neutral-900 font-semibold">{selectedItem.client_name}</p>
                  </div>
                )}

                {selectedItem.before_image_url && (
                  <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
                    <p className="text-sm text-primary-700 font-semibold">
                      This gallery includes a before/after comparison
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
