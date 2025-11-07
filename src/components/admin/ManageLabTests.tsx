import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, FlaskRound } from 'lucide-react';

interface LabTest {
  _id: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
}

export function ManageLabTests() {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '10000',
    category: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      const data = await api.getLabTestTemplates();
      setLabTests(data);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const testData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: formData.category || null,
      };

      if (editingId) {
        await api.updateLabTestTemplate(editingId, testData);
      } else {
        await api.createLabTestTemplate(testData);
      }

      setShowModal(false);
      resetForm();
      fetchLabTests();
    } catch (error: any) {
      console.error('Error saving lab test:', error);
      alert(error.message || 'Failed to save lab test');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (test: LabTest) => {
    setEditingId(test._id);
    setFormData({
      name: test.name,
      description: test.description || '',
      price: test.price.toString(),
      category: test.category || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lab test?')) {
      try {
        await api.deleteLabTestTemplate(id);
        fetchLabTests();
      } catch (error: any) {
        console.error('Error deleting lab test:', error);
        alert(error.message || 'Failed to delete lab test');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '10000',
      category: '',
    });
    setEditingId(null);
  };

  const categories = ['Blood Test', 'Urine Test', 'X-Ray', 'Ultrasound', 'CT Scan', 'MRI', 'Other'];

  return (
    <>
      <Card
        title="Lab Test Templates"
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Add Lab Test
          </Button>
        }
      >
        {labTests.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No lab tests added yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labTests.map((test) => (
              <div
                key={test._id}
                className="p-4 bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FlaskRound size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{test.name}</h4>
                      {test.category && (
                        <span className="text-xs text-blue-600 font-medium">{test.category}</span>
                      )}
                    </div>
                  </div>
                </div>

                {test.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{test.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                  <p className="text-lg font-bold text-emerald-600">{test.price} RWF</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(test)}>
                      <Edit size={14} />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(test._id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'Edit Lab Test' : 'Add Lab Test'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Test Name"
            placeholder="e.g., Complete Blood Count (CBC)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select Category (Optional)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder="Enter test description and what it measures"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <Input
            label="Price (RWF)"
            type="number"
            min="0"
            step="1000"
            placeholder="10000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
