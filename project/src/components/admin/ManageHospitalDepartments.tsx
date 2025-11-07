import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Plus, Trash2, Building2, DollarSign, Edit } from 'lucide-react';

interface Hospital {
  _id: string;
  name: string;
}

interface Department {
  _id: string;
  name: string;
}

interface HospitalDepartment {
  _id: string;
  hospital_id: string | { _id: string; name: string };
  department_id: string | { _id: string; name: string };
  consultation_fee: number;
  hospital_id_populated?: { name: string };
  department_id_populated?: { name: string };
}

export function ManageHospitalDepartments() {
  const [hospitalDepartments, setHospitalDepartments] = useState<HospitalDepartment[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    hospital_id: '',
    department_id: '',
    consultation_fee: '50000',
  });
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [feeValue, setFeeValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([
      fetchHospitalDepartments(),
      fetchHospitals(),
      fetchDepartments(),
    ]);
  };

  const fetchHospitalDepartments = async () => {
    try {
      const data = await api.getHospitalDepartments();
      // Backend returns populated data with hospital_id and department_id as objects
      setHospitalDepartments(data);
    } catch (error) {
      console.error('Error fetching hospital departments:', error);
    }
  };

  const fetchHospitals = async () => {
    try {
      const data = await api.getHospitals();
      setHospitals(data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

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
    setError('');
    setLoading(true);

    try {
      const exists = hospitalDepartments.find(
        (hd) => {
          const hospitalId = typeof hd.hospital_id === 'string' ? hd.hospital_id : hd.hospital_id._id;
          const departmentId = typeof hd.department_id === 'string' ? hd.department_id : hd.department_id._id;
          return hospitalId === formData.hospital_id && departmentId === formData.department_id;
        }
      );

      if (exists) {
        setError('This department is already assigned to the selected hospital');
        setLoading(false);
        return;
      }

      await api.createHospitalDepartment({
        hospital_id: formData.hospital_id,
        department_id: formData.department_id,
        consultation_fee: parseFloat(formData.consultation_fee) || 50000,
      });

      setShowModal(false);
      resetForm();
      fetchHospitalDepartments();
    } catch (error: any) {
      setError(error.message || 'Failed to assign department');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this department from the hospital?')) {
      try {
        await api.deleteHospitalDepartment(id);
        fetchHospitalDepartments();
      } catch (error: any) {
        console.error('Error deleting hospital department:', error);
        alert(error.message || 'Failed to delete hospital department');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      hospital_id: '',
      department_id: '',
      consultation_fee: '50000',
    });
    setError('');
  };

  const handleUpdateFee = async (id: string) => {
    const fee = parseFloat(feeValue);
    if (isNaN(fee) || fee <= 0) {
      alert('Please enter a valid consultation fee');
      return;
    }

    try {
      await api.updateHospitalDepartment(id, { consultation_fee: fee });
      setEditingFee(null);
      setFeeValue('');
      fetchHospitalDepartments();
    } catch (error: any) {
      console.error('Error updating fee:', error);
      alert(error.message || 'Failed to update consultation fee');
    }
  };

  const hospitalOptions = [
    { value: '', label: 'Select Hospital' },
    ...hospitals.map((h) => ({ value: h._id, label: h.name })),
  ];

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map((d) => ({ value: d._id, label: d.name })),
  ];

  const groupedByHospital = hospitalDepartments.reduce((acc, hd) => {
    // Handle both populated and non-populated hospital_id
    const hospital = typeof hd.hospital_id === 'object' ? hd.hospital_id : hospitals.find(h => h._id === hd.hospital_id);
    const hospitalName = hospital?.name || 'Unknown';
    
    if (!acc[hospitalName]) {
      acc[hospitalName] = [];
    }
    acc[hospitalName].push(hd);
    return acc;
  }, {} as Record<string, HospitalDepartment[]>);

  return (
    <>
      <Card
        title="Hospital Departments"
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Assign Department
          </Button>
        }
      >
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> Assign departments to hospitals so patients can select them when booking appointments.
          </p>
        </div>

        {hospitalDepartments.length === 0 ? (
          <p className="text-center text-gray-600 py-8">
            No departments assigned to hospitals yet
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByHospital).map(([hospitalName, departments]) => (
              <div key={hospitalName} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={20} className="text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">{hospitalName}</h3>
                  <span className="text-sm text-gray-600">
                    ({departments.length} {departments.length === 1 ? 'department' : 'departments'})
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {departments.map((hd) => {
                    // Handle both populated and non-populated department_id
                    const department = typeof hd.department_id === 'object' ? hd.department_id : departments.find(d => d._id === hd.department_id);
                    const departmentName = department?.name || 'Unknown';
                    
                    return (
                      <div
                        key={hd._id}
                        className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {departmentName}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <DollarSign size={14} className="text-emerald-600" />
                            {editingFee === hd._id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={feeValue}
                                  onChange={(e) => setFeeValue(e.target.value)}
                                  className="w-32 px-2 py-1 text-xs border border-emerald-300 rounded"
                                  placeholder="Fee amount"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateFee(hd._id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setEditingFee(null);
                                    setFeeValue('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-emerald-700">
                                  {hd.consultation_fee.toLocaleString()} RWF
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingFee(hd._id);
                                    setFeeValue(hd.consultation_fee.toString());
                                  }}
                                  className="text-emerald-600 hover:text-emerald-700"
                                >
                                  <Edit size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(hd._id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    );
                  })}
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
        title="Assign Department to Hospital"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Select
            label="Hospital"
            options={hospitalOptions}
            value={formData.hospital_id}
            onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
            required
          />

          <Select
            label="Department"
            options={departmentOptions}
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consultation Fee (RWF)
            </label>
            <input
              type="number"
              value={formData.consultation_fee}
              onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter consultation fee"
              min="0"
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              This fee will be paid to the hospital by patients booking appointments in this department
            </p>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              This will allow patients to select this department when booking appointments at the selected hospital.
            </p>
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
              {loading ? 'Assigning...' : 'Assign Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
