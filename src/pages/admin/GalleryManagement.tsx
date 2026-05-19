import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  service_category: string;
  image_url: string;
  before_image_url?: string;
  client_name?: string;
  order: number;
  is_featured: boolean;
}

interface FormData {
  title: string;
  description: string;
  service_category: string;
  image_url: string;
  before_image_url: string;
  client_name: string;
  order: number;
  is_featured: boolean;
}

export default function GalleryManagement() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    service_category: 'Cleaner',
    image_url: '',
    before_image_url: '',
    client_name: '',
    order: 0,
    is_featured: false,
  });

  const categories = [
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
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      alert('Error fetching gallery items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingId) {
        const { error } = await supabase
          .from('gallery')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('Gallery item updated successfully');
      } else {
        const { error } = await supabase
          .from('gallery')
          .insert([
            {
              ...formData,
              order: formData.order || items.length,
            }
          ]);

        if (error) throw error;
        alert('Gallery item created successfully');
      }

      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error saving gallery item:', error);
      alert('Error saving gallery item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setFormData({
      title: item.title,
      description: item.description,
      service_category: item.service_category,
      image_url: item.image_url,
      before_image_url: item.before_image_url || '',
      client_name: item.client_name || '',
      order: item.order,
      is_featured: item.is_featured,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery item?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Gallery item deleted successfully');
      fetchItems();
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      alert('Error deleting gallery item');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      service_category: 'Cleaner',
      image_url: '',
      before_image_url: '',
      client_name: '',
      order: 0,
      is_featured: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Gallery Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Gallery Item</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-primary-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {editingId ? 'Edit Gallery Item' : 'Add New Gallery Item'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Service Category *</label>
                <select
                  value={formData.service_category}
                  onChange={(e) => setFormData({ ...formData, service_category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Image URL *</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                required
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Before Image URL (Optional)</label>
              <input
                type="url"
                value={formData.before_image_url}
                onChange={(e) => setFormData({ ...formData, before_image_url: e.target.value })}
                placeholder="https://example.com/before.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-1">For before/after comparisons</p>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Client Name (Optional)</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="featured" className="text-gray-700 font-semibold">
                Featured on homepage
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-primary-400"
              >
                {loading ? 'Saving...' : 'Save Gallery Item'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-300 text-gray-900 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-lg">No gallery items yet. Create one to get started!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-primary-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                      {item.is_featured && (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg font-medium">
                        {item.service_category}
                      </span>
                      {item.client_name && (
                        <span>Client: <strong>{item.client_name}</strong></span>
                      )}
                      <span>Order: <strong>{item.order}</strong></span>
                      {item.before_image_url && (
                        <span className="text-green-700">Before/After ✓</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
