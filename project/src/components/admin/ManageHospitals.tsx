import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface LabUser {
  _id: string;
  full_name: string;
  role: string;
}

interface NurseUser {
  _id: string;
  full_name: string;
  role: string;
}

interface Hospital {
  _id: string;
  name: string;
  location: string;
  phone?: string | null;
  email?: string | null;
  consultation_fee?: number;
  lab_user_id?: string | { _id: string; full_name?: string } | null;
  nurse_user_id?: string | { _id: string; full_name?: string } | null;
}

export function ManageHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [labUsers, setLabUsers] = useState<LabUser[]>([]);
  const [nurseUsers, setNurseUsers] = useState<NurseUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    consultation_fee: '' as string,
    lab_user_id: '' as string,
    nurse_user_id: '' as string,
  });

  useEffect(() => {
    fetchHospitals();
    fetchLabUsers();
    fetchNurseUsers();
  }, []);

  const fetchHospitals = async () => {
    try {
      const data = (await api.getHospitals()) as any[];
      setHospitals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]);
    }
  };

  const fetchLabUsers = async () => {
    try {
      const profiles = (await api.getAllProfiles()) as any[];
      const labs = (profiles || []).filter((p: any) => p.role === 'lab_technician');
      setLabUsers(labs);
    } catch (error) {
      console.error('Error fetching lab users:', error);
      setLabUsers([]);
    }
  };

  const fetchNurseUsers = async () => {
    try {
      const profiles = (await api.getAllProfiles()) as any[];
      const nurses = (profiles || []).filter((p: any) => p.role === 'nurse');
      setNurseUsers(nurses);
    } catch (error) {
      console.error('Error fetching nurse users:', error);
      setNurseUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const feeNumber = formData.consultation_fee ? Number(formData.consultation_fee) : 0;
      const hospitalData = {
        name: formData.name,
        location: formData.location,
        phone: formData.phone || null,
        email: formData.email || null,
        consultation_fee: Number.isNaN(feeNumber) ? 0 : Math.max(0, feeNumber),
        lab_user_id: formData.lab_user_id || null,
        nurse_user_id: formData.nurse_user_id || null,
      } as any;

      if (editingId) {
        await api.updateHospital(editingId, hospitalData);
      } else {
        await api.createHospital(hospitalData);
      }

      setShowModal(false);
      resetForm();
      fetchHospitals();
    } catch (error: any) {
      console.error('Error saving hospital:', error);
      alert(error.message || 'Failed to save hospital');
    }
  };

  const handleEdit = (hospital: Hospital) => {
    setEditingId(hospital._id);
    setFormData({
      name: hospital.name,
      location: hospital.location,
      phone: hospital.phone || '',
      email: hospital.email || '',
      consultation_fee:
        hospital.consultation_fee != null ? String(hospital.consultation_fee) : '',
      lab_user_id:
        typeof hospital.lab_user_id === 'object'
          ? hospital.lab_user_id?._id || ''
          : (hospital.lab_user_id as string) || '',
      nurse_user_id:
        typeof hospital.nurse_user_id === 'object'
          ? hospital.nurse_user_id?._id || ''
          : (hospital.nurse_user_id as string) || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hospital?')) return;

    try {
      await api.deleteHospital(id);
      fetchHospitals();
    } catch (error: any) {
      console.error('Error deleting hospital:', error);
      alert(error.message || 'Failed to delete hospital');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      phone: '',
      email: '',
      consultation_fee: '',
      lab_user_id: '',
      nurse_user_id: '',
    });
    setEditingId(null);
  };

  const labUserName = (hospital: Hospital) => {
    if (typeof hospital.lab_user_id === 'object') {
      return hospital.lab_user_id?.full_name || '—';
    }
    const found = labUsers.find((u) => u._id === hospital.lab_user_id);
    return found?.full_name || '—';
  };

  const nurseUserName = (hospital: Hospital) => {
    if (typeof hospital.nurse_user_id === 'object') {
      return hospital.nurse_user_id?.full_name || '—';
    }
    const found = nurseUsers.find((u) => u._id === hospital.nurse_user_id);
    return found?.full_name || '—';
  };

  return (
    <>
      <Card
        title="Hospitals"
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Add Hospital
          </Button>
        }
      >
        {hospitals.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No hospitals added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Consultation Fee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Lab User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nurse</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hospitals.map((hospital) => (
                  <tr key={hospital._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{hospital.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{hospital.location}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {(hospital.consultation_fee ?? 0).toLocaleString()} RWF
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{labUserName(hospital)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{nurseUserName(hospital)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {hospital.phone || hospital.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(hospital)}>
                          <Edit size={14} />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(hospital._id)}>
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
        title={editingId ? 'Edit Hospital' : 'Add Hospital'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Hospital Name"
            placeholder="Enter hospital name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Location"
            placeholder="Enter location/address"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Consultation Fee (RWF)"
            type="number"
            min="0"
            placeholder="e.g., 5000"
            value={formData.consultation_fee}
            onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab User</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.lab_user_id}
              onChange={(e) => setFormData({ ...formData, lab_user_id: e.target.value })}
            >
              <option value="">Select Lab User</option>
              {labUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Nurse</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.nurse_user_id}
              onChange={(e) => setFormData({ ...formData, nurse_user_id: e.target.value })}
            >
              <option value="">Select Nurse</option>
            {nurseUsers
              .filter((u) => {
                const assignedToHospital = hospitals.find((hospital) => {
                  const nurseId =
                    typeof hospital.nurse_user_id === 'object'
                      ? hospital.nurse_user_id?._id
                      : hospital.nurse_user_id;
                  return nurseId === u._id;
                });
                if (!assignedToHospital) return true;
                if (editingId && assignedToHospital._id === editingId) return true;
                return false;
              })
              .map((u) => (
                <option key={u._id} value={u._id}>
                  {u.full_name}
                </option>
              ))}
            </select>
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
            <Button type="submit" fullWidth>
              {editingId ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
