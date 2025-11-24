import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Doctor {
  _id: string;
  user_id: string | { _id: string; full_name: string; email: string };
  hospital_id: string | { _id: string; name: string };
  department_id: string | { _id: string; name: string };
  specialization?: string | null;
  license_number: string;
  consultation_fee?: number;
}

interface Hospital {
  _id: string;
  name: string;
}

interface Department {
  _id: string;
  name: string;
}

interface UserProfile {
  _id: string;
  full_name: string;
  email: string;
  role: string;
}

export function ManageDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctorUsers, setDoctorUsers] = useState<UserProfile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    hospital_id: '',
    department_id: '',
    specialization: '',
    license_number: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchHospitals();
    fetchDepartments();
    fetchDoctorUsers();
  }, []);

  const fetchDoctors = async () => {
    try {
      const data = await api.getDoctors();
      // Backend returns populated data
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
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

  const fetchDoctorUsers = async () => {
    try {
      const data = await api.getAllProfiles();
      // Filter for doctor role
      const doctors = data.filter((user: UserProfile) => user.role === 'doctor');
      setDoctorUsers(doctors);
    } catch (error) {
      console.error('Error fetching doctor users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const doctorData = {
        user_id: formData.user_id,
        hospital_id: formData.hospital_id,
        department_id: formData.department_id,
        specialization: formData.specialization || null,
        license_number: formData.license_number,
      };

      if (editingId) {
        await api.updateDoctor(editingId, doctorData);
      } else {
        await api.createDoctor(doctorData);
      }

      setShowModal(false);
      resetForm();
      fetchDoctors();
      fetchDoctorUsers();
    } catch (error: any) {
      console.error('Error saving doctor:', error);
      alert(error.message || 'Failed to save doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingId(doctor._id);
    // Handle both populated and non-populated IDs
    const userId = typeof doctor.user_id === 'string' ? doctor.user_id : doctor.user_id._id;
    const hospitalId = typeof doctor.hospital_id === 'string' ? doctor.hospital_id : doctor.hospital_id._id;
    const departmentId = typeof doctor.department_id === 'string' ? doctor.department_id : doctor.department_id._id;
    
    setFormData({
      user_id: userId,
      hospital_id: hospitalId,
      department_id: departmentId,
      specialization: doctor.specialization || '',
      license_number: doctor.license_number,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      try {
        await api.deleteDoctor(id);
        fetchDoctors();
      } catch (error: any) {
        console.error('Error deleting doctor:', error);
        alert(error.message || 'Failed to delete doctor');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      hospital_id: '',
      department_id: '',
      specialization: '',
      license_number: '',
    });
    setEditingId(null);
  };

  const availableDoctorUsers = doctorUsers.filter(
    (user) => {
      const isAssigned = doctors.find((d) => {
        const userId = typeof d.user_id === 'string' ? d.user_id : d.user_id._id;
        return userId === user._id;
      });
      return !isAssigned || editingId;
    }
  );

  const userOptions = [
    { value: '', label: 'Select Doctor User' },
    ...availableDoctorUsers.map((user) => ({
      value: user._id,
      label: `${user.full_name} (${user.email})`,
    })),
  ];

  const hospitalOptions = [
    { value: '', label: 'Select Hospital' },
    ...hospitals.map((h) => ({ value: h._id, label: h.name })),
  ];

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map((d) => ({ value: d._id, label: d.name })),
  ];

  return (
    <>
      <Card
        title="Doctors"
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Add Doctor
          </Button>
        }
      >
        {doctors.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No doctors added yet</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Name</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hidden md:table-cell">Hospital</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hidden lg:table-cell">Department</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hidden lg:table-cell">Specialization</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hidden xl:table-cell">License</th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {doctors.map((doctor) => {
                    // Handle populated relations
                    const user = typeof doctor.user_id === 'object' ? doctor.user_id : null;
                    const hospital = typeof doctor.hospital_id === 'object' ? doctor.hospital_id : hospitals.find(h => h._id === doctor.hospital_id);
                    const department = typeof doctor.department_id === 'object' ? doctor.department_id : departments.find(d => d._id === doctor.department_id);
                    
                    return (
                      <tr key={doctor._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3">
                          {user ? (
                            <>
                              <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{user.full_name}</p>
                              <p className="text-xs text-gray-600 break-words">{user.email}</p>
                              <div className="md:hidden mt-1 space-y-0.5">
                                <p className="text-xs text-gray-500"><span className="font-medium">Hospital:</span> {hospital?.name || '-'}</p>
                                <p className="text-xs text-gray-500"><span className="font-medium">Dept:</span> {department?.name || '-'}</p>
                                {doctor.specialization && (
                                  <p className="text-xs text-gray-500"><span className="font-medium">Specialization:</span> {doctor.specialization}</p>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-xs sm:text-sm text-gray-500">Loading...</p>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 hidden md:table-cell break-words">{hospital?.name || '-'}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 hidden lg:table-cell break-words">{department?.name || '-'}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden lg:table-cell break-words">
                          {doctor.specialization || '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden xl:table-cell">{doctor.license_number}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-right">
                          <div className="flex gap-1 sm:gap-2 justify-end">
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(doctor)} className="p-1.5 sm:p-2">
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(doctor._id)} className="p-1.5 sm:p-2">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'Edit Doctor' : 'Add Doctor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Doctor User Account"
            options={userOptions}
            value={formData.user_id}
            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            required
            disabled={!!editingId}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Specialization"
              placeholder="e.g., Cardiology, Pediatrics"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />

            <Input
              label="License Number"
              placeholder="Enter medical license number"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              required
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Consultation fees are now managed at the hospital department level.
              Go to "Hospital Departments" to set consultation fees.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
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
