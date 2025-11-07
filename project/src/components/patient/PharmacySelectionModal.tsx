import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MapPin, Phone, Building } from 'lucide-react';

interface Pharmacy {
  _id: string;
  name: string;
  location: string;
  phone?: string;
}

interface PharmacySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptionId: string;
  onPharmacySelected: () => void;
}

export function PharmacySelectionModal({
  isOpen,
  onClose,
  prescriptionId,
  onPharmacySelected,
}: PharmacySelectionModalProps) {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPharmacies();
    }
  }, [isOpen]);

  const fetchPharmacies = async () => {
    try {
      const data = await api.getPharmacies();
      setPharmacies(data);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      setPharmacies([]);
    }
  };

  const handleSelectPharmacy = async () => {
    if (!selectedPharmacy) {
      alert('Please select a pharmacy');
      return;
    }

    setLoading(true);

    try {
      console.log('Selecting pharmacy:', {
        prescriptionId,
        pharmacyId: selectedPharmacy
      });

      // Update prescription with selected pharmacy and status
      // Backend will automatically create pharmacy request when pharmacy_id is set
      const updatedPrescription = await api.updatePrescription(prescriptionId, {
        pharmacy_id: selectedPharmacy,
        status: 'approved',
      });

      console.log('✅ Prescription updated successfully:', updatedPrescription);

      // Create a notification for the patient
      try {
        const prescription = await api.getPrescription(prescriptionId);
        const patientId = typeof prescription.patient_id === 'string' ? prescription.patient_id : prescription.patient_id?._id;
        if (patientId) {
          await api.createNotification({
            user_id: patientId,
            title: 'Pharmacy Selected',
            message: 'You can now proceed to payment for your prescription.',
            type: 'prescription',
            reference_id: prescriptionId,
            is_read: false,
          });
        }
      } catch (err) {
        console.error('Error creating notification:', err);
      }

      // Show success message
      alert('✅ Pharmacy selected successfully! The pharmacy will review your prescription and set the prices. You will be notified when it\'s ready for payment.');
      
      // Close modal and refresh
      onPharmacySelected();
      onClose();
    } catch (error: any) {
      console.error('Error selecting pharmacy:', error);
      let errorMessage = error?.message || 'Unknown error';
      
      // Provide user-friendly error messages
      if (errorMessage.includes('must contain at least one medication') || errorMessage.includes('Cannot assign pharmacy')) {
        errorMessage = 'This prescription is empty and cannot be sent to a pharmacy. Please contact your doctor to add medications to your prescription.';
      }
      
      alert('Error selecting pharmacy: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Pharmacy" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Choose a pharmacy near you to pick up your prescription
        </p>

        {pharmacies.length === 0 ? (
          <div className="text-center py-8">
            <Building size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No pharmacies available at the moment</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pharmacies.map((pharmacy) => (
              <button
                key={pharmacy._id}
                onClick={() => setSelectedPharmacy(pharmacy._id)}
                className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                  selectedPharmacy === pharmacy._id
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedPharmacy === pharmacy._id ? 'bg-emerald-600' : 'bg-gray-100'
                  }`}>
                    <Building size={20} className={
                      selectedPharmacy === pharmacy._id ? 'text-white' : 'text-gray-600'
                    } />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{pharmacy.name}</p>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{pharmacy.location}</span>
                      </div>
                      {pharmacy.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} />
                          <span>{pharmacy.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedPharmacy === pharmacy._id && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelectPharmacy}
            disabled={!selectedPharmacy || loading}
            fullWidth
          >
            {loading ? 'Confirming...' : 'Confirm Pharmacy'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
