import { useEffect, useState } from 'react';
import { AlertCircle, Trash2, CreditCard as Edit2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Task {
  id: string;
  provider_id: string;
  service_type: string;
  customer_name: string;
  customer_phone: string;
  location: string;
  description: string;
  status: string;
  priority: string;
  assigned_date: string;
  completion_date: string | null;
  updated_at: string | null;
  updated_by: string | null;
  provider_profiles?: {
    full_name: string;
  };
}

export default function TaskAssignment() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('assigned');
  const [providers, setProviders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    provider_id: '',
    service_type: '',
    customer_name: '',
    customer_phone: '',
    location: '',
    description: '',
    priority: 'medium'
  });

  const serviceTypes = ['Cleaning', 'Driving', 'Electrical', 'Plumbing', 'Carpentry', 'Repair', 'Cooking', 'Tutoring'];

  useEffect(() => {
    fetchTasks();
    fetchProviders();
  }, [filter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('task_assignments')
        .select('*, provider_profiles(full_name)');

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.order('assigned_date', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select('id, full_name')
        .eq('status', 'approved')
        .order('full_name');

      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.provider_id) {
      alert('Please select a provider');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('task_assignments')
          .update({
            ...formData,
            completion_date: null
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('task_assignments')
          .insert([formData]);

        if (error) throw error;
      }

      setFormData({
        provider_id: '',
        service_type: '',
        customer_name: '',
        customer_phone: '',
        location: '',
        description: '',
        priority: 'medium'
      });
      setShowForm(false);
      setEditingId(null);
      fetchTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Failed to save task');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const completionDate = newStatus === 'completed' ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('task_assignments')
        .update({
          status: newStatus,
          completion_date: completionDate
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus, completion_date: completionDate } : t
      ));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const editTask = (task: Task) => {
    setFormData({
      provider_id: task.provider_id,
      service_type: task.service_type,
      customer_name: task.customer_name,
      customer_phone: task.customer_phone,
      location: task.location,
      description: task.description,
      priority: task.priority
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Assignment</h1>
          <p className="text-gray-600">Assign and manage tasks for providers</p>
        </div>
        <button
          onClick={() => {
            if (showForm && !editingId) {
              setShowForm(false);
            } else {
              setEditingId(null);
              setFormData({
                provider_id: '',
                service_type: '',
                customer_name: '',
                customer_phone: '',
                location: '',
                description: '',
                priority: 'medium'
              });
              setShowForm(true);
            }
          }}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center gap-2"
        >
          <Plus size={20} />
          {showForm && !editingId ? 'Cancel' : 'New Task'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? 'Edit Task' : 'Create New Task'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Provider</label>
                <select
                  value={formData.provider_id}
                  onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select a provider</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Service Type</label>
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select service type</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Customer name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="Customer phone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Task location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                {editingId ? 'Update Task' : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    provider_id: '',
                    service_type: '',
                    customer_name: '',
                    customer_phone: '',
                    location: '',
                    description: '',
                    priority: 'medium'
                  });
                }}
                className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Tasks</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-gray-900">{tasks.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-4">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Provider</p>
                    <p className="font-semibold text-gray-900">{task.provider_profiles?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold text-gray-900">{task.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-semibold text-gray-900">{task.service_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{task.location}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{task.description}</p>
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.updated_by === task.provider_id && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                        Provider Updated
                        {task.updated_at && (
                          <span className="text-orange-600 font-normal ml-1">
                            · {new Date(task.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-500"
                    >
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => editTask(task)}
                      className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
