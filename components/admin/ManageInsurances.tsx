import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Insurance {
  _id: string;
  name: string;
  coverage_percentage: number;
  description?: string | null;
}

export function ManageInsurances() {
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    coverage_percentage: '85',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      const data = await api.getInsurances();
      setInsurances(data);
    } catch (error) {
      console.error('Error fetching insurances:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const insuranceData = {
        name: formData.name,
        coverage_percentage: parseFloat(formData.coverage_percentage),
        description: formData.description || null,
      };

      if (editingId) {
        await api.updateInsurance(editingId, insuranceData);
      } else {
        await api.createInsurance(insuranceData);
      }

      setShowModal(false);
      resetForm();
      fetchInsurances();
    } catch (error: any) {
      console.error('Error saving insurance:', error);
      alert(error.message || 'Failed to save insurance');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (insurance: Insurance) => {
    setEditingId(insurance._id);
    setFormData({
      name: insurance.name,
      coverage_percentage: insurance.coverage_percentage.toString(),
      description: insurance.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this insurance?')) {
      try {
        await api.deleteInsurance(id);
        fetchInsurances();
      } catch (error: any) {
        console.error('Error deleting insurance:', error);
        alert(error.message || 'Failed to delete insurance');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', coverage_percentage: '85', description: '' });
    setEditingId(null);
  };

  return (
    <>
      <Card
        title="Insurance Providers"
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Add Insurance
          </Button>
        }
      >
        {insurances.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No insurances added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Coverage
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {insurances.map((insurance) => (
                  <tr key={insurance._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{insurance.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {insurance.coverage_percentage}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {insurance.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(insurance)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(insurance._id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'Edit Insurance' : 'Add Insurance'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Insurance Name"
            placeholder="Enter insurance provider name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Coverage Percentage"
            type="number"
            placeholder="85"
            min="0"
            max="100"
            step="0.01"
            value={formData.coverage_percentage}
            onChange={(e) =>
              setFormData({ ...formData, coverage_percentage: e.target.value })
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder="Enter description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

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
