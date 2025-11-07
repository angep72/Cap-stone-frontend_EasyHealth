import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Department {
  _id: string;
  name: string;
  description?: string | null;
}

export function ManageDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const deptData = { name: formData.name, description: formData.description || null };

      if (editingId) {
        await api.updateDepartment(editingId, deptData);
      } else {
        await api.createDepartment(deptData);
      }

      setShowModal(false);
      resetForm();
      fetchDepartments();
    } catch (error: any) {
      console.error('Error saving department:', error);
      alert(error.message || 'Failed to save department');
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept._id);
    setFormData({ name: dept.name, description: dept.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      try {
        await api.deleteDepartment(id);
        fetchDepartments();
      } catch (error: any) {
        console.error('Error deleting department:', error);
        alert(error.message || 'Failed to delete department');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
  };

  return (
    <>
      <Card title="Departments" actions={<Button size="sm" onClick={() => { resetForm(); setShowModal(true); }}><Plus size={16} className="mr-1" />Add Department</Button>}>
        {departments.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No departments added yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">{dept.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{dept.description || 'No description'}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(dept)}><Edit size={14} /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(dept._id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Department Name" placeholder="e.g., Cardiology, Pediatrics" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" rows={3} placeholder="Enter department description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }} fullWidth>Cancel</Button>
            <Button type="submit" fullWidth>{editingId ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
