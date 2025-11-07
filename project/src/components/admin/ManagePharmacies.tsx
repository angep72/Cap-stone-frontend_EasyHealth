import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, MapPin, User } from 'lucide-react';
import { Select } from '../ui/Select';

interface Pharmacy {
  _id: string;
  name: string;
  location: string;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pharmacist_id: string | { _id: string; full_name: string; email: string } | null;
}

interface PharmacistUser {
  _id: string;
  full_name: string;
  email: string;
  role: string;
}

export function ManagePharmacies() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [pharmacistUsers, setPharmacistUsers] = useState<PharmacistUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    pharmacist_id: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPharmacies();
    fetchPharmacistUsers();
  }, []);

  const fetchPharmacies = async () => {
    try {
      const data = await api.getPharmacies();
      setPharmacies(data);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    }
  };

  const fetchPharmacistUsers = async () => {
    try {
      const data = await api.getAllProfiles();
      const pharmacists = data.filter((user: PharmacistUser) => user.role === 'pharmacist');
      setPharmacistUsers(pharmacists);
    } catch (error) {
      console.error('Error fetching pharmacist users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const pharmacyData = {
        name: formData.name,
        location: formData.location,
        phone: formData.phone || null,
        email: formData.email || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        pharmacist_id: formData.pharmacist_id || null,
      };

      if (editingId) {
        await api.updatePharmacy(editingId, pharmacyData);
      } else {
        await api.createPharmacy(pharmacyData);
      }

      setShowModal(false);
      resetForm();
      fetchPharmacies();
    } catch (error: any) {
      console.error('Error saving pharmacy:', error);
      alert(error.message || 'Failed to save pharmacy');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pharmacy: Pharmacy) => {
    setEditingId(pharmacy._id);
    const pharmacistId = typeof pharmacy.pharmacist_id === 'string' 
      ? pharmacy.pharmacist_id 
      : pharmacy.pharmacist_id?._id || '';
    
    setFormData({
      name: pharmacy.name,
      location: pharmacy.location,
      phone: pharmacy.phone || '',
      email: pharmacy.email || '',
      latitude: pharmacy.latitude?.toString() || '',
      longitude: pharmacy.longitude?.toString() || '',
      pharmacist_id: pharmacistId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this pharmacy?')) {
      try {
        await api.deletePharmacy(id);
        fetchPharmacies();
      } catch (error: any) {
        console.error('Error deleting pharmacy:', error);
        alert(error.message || 'Failed to delete pharmacy');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      phone: '',
      email: '',
      latitude: '',
      longitude: '',
      pharmacist_id: '',
    });
    setEditingId(null);
  };

  return (
    <>
      <Card
        title="Pharmacies"
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Add Pharmacy
          </Button>
        }
      >
        {pharmacies.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No pharmacies added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Pharmacist</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pharmacies.map((pharmacy) => {
                  const pharmacist = typeof pharmacy.pharmacist_id === 'object' && pharmacy.pharmacist_id !== null
                    ? pharmacy.pharmacist_id
                    : null;
                  
                  return (
                    <tr key={pharmacy._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {pharmacy.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-500" />
                          {pharmacy.location}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {pharmacist ? (
                          <div>
                            <div className="flex items-center gap-1 font-medium">
                              <User size={14} className="text-emerald-600" />
                              {pharmacist.full_name}
                            </div>
                            <div className="text-xs text-gray-500">{pharmacist.email}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {pharmacy.phone && <div>{pharmacy.phone}</div>}
                        {pharmacy.email && <div className="text-xs">{pharmacy.email}</div>}
                        {!pharmacy.phone && !pharmacy.email && '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(pharmacy)}>
                            <Edit size={14} />
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(pharmacy._id)}>
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
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'Edit Pharmacy' : 'Add Pharmacy'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Pharmacy Name"
            placeholder="Enter pharmacy name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Location / Address"
            placeholder="Enter full address"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />

          <Select
            label="Assign Pharmacist User"
            value={formData.pharmacist_id}
            onChange={(e) => setFormData({ ...formData, pharmacist_id: e.target.value })}
            required
          >
            <option value="">Select a pharmacist...</option>
            {pharmacistUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </Select>
          {pharmacistUsers.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              No pharmacist users found. Please create pharmacist users first.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              GPS Coordinates (Optional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="-1.9403"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />

              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="29.8739"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              GPS coordinates help patients find the nearest pharmacy
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
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
