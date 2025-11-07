import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { UserPlus, Trash2 } from 'lucide-react';

interface Nurse {
  _id: string;
  user_id: string | { _id: string; full_name: string; email: string; phone?: string };
  hospital_id?: string | { _id: string; name: string } | null;
  license_number: string;
  createdAt?: string;
}

interface Profile {
  _id: string;
  email: string;
  full_name: string;
  role: string;
}

export function ManageNurses() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNurses();
    fetchAvailableProfiles();
  }, []);

  const fetchNurses = async () => {
    try {
      const data = await api.getNurses();
      // Backend returns populated data
      setNurses(data);
    } catch (error) {
      console.error('Error fetching nurses:', error);
    }
  };

  const fetchAvailableProfiles = async () => {
    try {
      const data = await api.getAllProfiles();
      // Filter for nurse role
      const nursesList = data.filter((user: Profile) => user.role === 'nurse');
      setProfiles(nursesList);
    } catch (error) {
      console.error('Error fetching nurse profiles:', error);
    }
  };

  const handleAddNurse = async () => {
    if (!selectedUser || !licenseNumber) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await api.createNurse({
        user_id: selectedUser,
        license_number: licenseNumber,
      });

      setShowModal(false);
      resetForm();
      fetchNurses();
      fetchAvailableProfiles();
    } catch (error: any) {
      console.error('Error adding nurse:', error);
      alert('Error adding nurse: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this nurse?')) return;

    try {
      await api.deleteNurse(id);
      fetchNurses();
      fetchAvailableProfiles();
    } catch (error: any) {
      console.error('Error deleting nurse:', error);
      alert('Error deleting nurse: ' + (error.message || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setSelectedUser('');
    setLicenseNumber('');
  };

  const userOptions = [
    { value: '', label: 'Select User' },
    ...profiles
      .filter((p) => {
        const isAssigned = nurses.find((n) => {
          const userId = typeof n.user_id === 'string' ? n.user_id : n.user_id._id;
          return userId === p._id;
        });
        return !isAssigned;
      })
      .map((p) => ({
        value: p._id,
        label: `${p.full_name} (${p.email})`,
      })),
  ];

  return (
    <>
      <Card
        title="Manage Nurses"
        actions={
          <Button size="sm" onClick={() => setShowModal(true)}>
            <UserPlus size={16} className="mr-1" />
            Add Nurse
          </Button>
        }
      >
        {nurses.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No nurses registered</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {nurses.map((nurse) => {
                  // Handle populated user_id
                  const user = typeof nurse.user_id === 'object' ? nurse.user_id : null;
                  const hospital =
                    nurse.hospital_id && typeof nurse.hospital_id === 'object'
                      ? nurse.hospital_id
                      : null;
                  
                  return (
                    <tr key={nurse._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user?.full_name || 'Loading...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user?.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {hospital?.name || 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{nurse.license_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(nurse._id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
        title="Add New Nurse"
      >
        <div className="space-y-4">
          <Select
            label="Select Nurse User"
            options={userOptions}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            required
          />

          <Input
            label="License Number"
            placeholder="Enter nursing license number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-4">
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
            <Button onClick={handleAddNurse} disabled={loading} fullWidth>
              {loading ? 'Adding...' : 'Add Nurse'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
