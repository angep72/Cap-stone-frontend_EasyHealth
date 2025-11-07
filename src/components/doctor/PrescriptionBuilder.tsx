import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Plus, Trash2, Save, PenTool, PackagePlus } from 'lucide-react';
import { SignaturePad } from './SignaturePad';

interface Medication {
  _id: string;
  name: string;
}

interface PrescriptionItem {
  medication_id: string;
  medication_name: string;
  quantity: number;
  dosage: string;
  instructions: string;
}

interface PrescriptionBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  patientId: string;
  doctorId: string;
  onComplete: () => void;
}

export function PrescriptionBuilder({
  isOpen,
  onClose,
  consultationId,
  patientId,
  doctorId,
  onComplete,
}: PrescriptionBuilderProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notes, setNotes] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    description: '',
    category: 'antibiotic',
    stock_quantity: '100',
    requires_prescription: true,
  });
  const [existingPrescription, setExistingPrescription] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedications();
      checkExistingPrescription();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = medications.filter((med) =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedications(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredMedications([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, medications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMedications = async () => {
    try {
      const data = await api.getMedications();
      setMedications(data);
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const checkExistingPrescription = async () => {
    try {
      const prescriptions = await api.getPrescriptions();
      const existingPrescriptionData = prescriptions.find((p: any) => {
        const pConsultationId = typeof p.consultation_id === 'string' 
          ? p.consultation_id 
          : p.consultation_id?._id;
        return pConsultationId === consultationId;
      });

      if (existingPrescriptionData) {
        setExistingPrescription(existingPrescriptionData);
        setNotes(existingPrescriptionData.notes || '');
        setSignatureData(existingPrescriptionData.signature_data || '');

        if (existingPrescriptionData.items && existingPrescriptionData.items.length > 0) {
          const loadedItems = existingPrescriptionData.items.map((item: any) => {
            const medication = typeof item.medication_id === 'object' ? item.medication_id : null;
            return {
              medication_id: typeof item.medication_id === 'string' ? item.medication_id : item.medication_id._id,
              medication_name: medication?.name || 'Unknown Medication',
              quantity: item.quantity,
              dosage: item.dosage,
              instructions: item.instructions || '',
            };
          });
          setItems(loadedItems);
        }
      }
    } catch (error) {
      console.error('Error checking existing prescription:', error);
    }
  };

  const handleAddNewMedication = async () => {
    if (!newMedication.name.trim()) {
      alert('Please enter medication name');
      return;
    }

    try {
      const data = await api.createMedication({
        name: newMedication.name,
        description: newMedication.description || null,
        category: newMedication.category,
        stock_quantity: parseInt(newMedication.stock_quantity),
        requires_prescription: newMedication.requires_prescription,
        unit_price: 0, // Default price, will be set by pharmacist
      });

      if (data) {
        setMedications([...medications, data]);
        addMedication(data);
        setNewMedication({
          name: '',
          description: '',
          category: 'antibiotic',
          stock_quantity: '100',
          requires_prescription: true,
        });
        setShowAddMedication(false);
      }
    } catch (error: any) {
      console.error('Error adding medication:', error);
      alert('Error adding medication: ' + (error.message || 'Unknown error'));
    }
  };

  const addMedication = (medication: Medication) => {
    if (items.find((item) => item.medication_id === medication._id)) {
      alert('Medication already added');
      return;
    }

    setItems([
      ...items,
      {
        medication_id: medication._id,
        medication_name: medication.name,
        quantity: 1,
        dosage: '',
        instructions: '',
      },
    ]);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };


  const handleSave = async () => {
    // Final validation check before saving
    if (items.length === 0) {
      alert('⚠️ Prescription cannot be empty! Please add at least one medication before saving.');
      return;
    }

    if (items.some((item) => !item.dosage.trim())) {
      alert('⚠️ Please enter dosage for all medications before saving.');
      return;
    }

    if (!signatureData) {
      setShowSignature(true);
      return;
    }

    setLoading(true);

    try {
      // Prepare prescription items
      const prescriptionItems = items.map((item) => ({
        medication_id: item.medication_id,
        quantity: item.quantity,
        dosage: item.dosage,
        instructions: item.instructions,
        total_price: 0, // Will be set by pharmacist
      }));

      // Log what we're about to save (for debugging)
      console.log('Saving prescription with items:', {
        itemCount: prescriptionItems.length,
        items: prescriptionItems.map(item => ({
          medication_id: item.medication_id,
          quantity: item.quantity,
          dosage: item.dosage,
        }))
      });

      let prescription;

      if (existingPrescription && existingPrescription._id) {
        // For updates, we'll update each prescription individually
        // For now, this is a simplified approach - you may want to handle updates differently
        prescription = await api.updatePrescription(existingPrescription._id, {
          notes,
          signature_data: signatureData,
          medication_id: prescriptionItems[0]?.medication_id,
          quantity: prescriptionItems[0]?.quantity,
          dosage: prescriptionItems[0]?.dosage,
          instructions: prescriptionItems[0]?.instructions,
        });
      } else {
        // Create new prescriptions - each medication becomes its own prescription
        const response = await api.createPrescription({
          consultation_id: consultationId,
          patient_id: patientId,
          doctor_id: doctorId,
          notes,
          signature_data: signatureData,
          status: 'pending', // This status means prescription is ready for patient action
          items: prescriptionItems,
        });

        // Backend returns { prescriptions: [...], count: X }
        const createdPrescriptions = response.prescriptions || [response];
        
        console.log('✅ Prescriptions saved successfully:', {
          prescriptionCount: createdPrescriptions.length,
          prescriptionIds: createdPrescriptions.map((p: any) => p._id),
        });

        // Create notification for patient (one notification mentioning all prescriptions)
        try {
          await api.createNotification({
            user_id: patientId,
            title: 'New Prescriptions Available',
            message: `Your doctor has prescribed ${createdPrescriptions.length} medication(s). Each medication has its own prescription. Please select pharmacies for each.`,
            type: 'prescription',
            reference_id: createdPrescriptions[0]?._id || '',
            is_read: false,
          });
        } catch (error) {
          console.error('Error creating notification:', error);
        }

        prescription = createdPrescriptions[0]; // Use first for compatibility
      }

      // Show success message
      const prescriptionCount = existingPrescription ? 1 : (prescriptionItems.length);
      alert(`✅ Prescription(s) saved successfully!\n\n${prescriptionCount} separate prescription(s) created - one per medication.`);

      onComplete();
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      let errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('must contain at least one medication')) {
        // This shouldn't happen due to frontend validation, but show helpful message
        errorMessage = 'Please add at least one medication to the prescription before saving.';
      }
      alert('Error saving prescription: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (showSignature) {
    return (
      <SignaturePad
        isOpen={isOpen}
        onClose={onClose}
        onSave={(signature) => {
          setSignatureData(signature);
          setShowSignature(false);
          handleSave();
        }}
      />
    );
  }

  const categoryOptions = [
    { value: 'antibiotic', label: 'Antibiotic' },
    { value: 'painkiller', label: 'Painkiller' },
    { value: 'antiviral', label: 'Antiviral' },
    { value: 'antifungal', label: 'Antifungal' },
    { value: 'antihistamine', label: 'Antihistamine' },
    { value: 'vitamin', label: 'Vitamin/Supplement' },
    { value: 'antidiabetic', label: 'Antidiabetic' },
    { value: 'cardiovascular', label: 'Cardiovascular' },
    { value: 'respiratory', label: 'Respiratory' },
    { value: 'gastrointestinal', label: 'Gastrointestinal' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingPrescription ? "Edit Prescription" : "Write Prescription"}
      size="xl"
    >
      <div className="space-y-6">
        {existingPrescription && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              You are editing an existing prescription. Changes will update the current prescription.
            </p>
          </div>
        )}
        <div ref={searchRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Medication
          </label>
          <Input
            placeholder="Type to search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm && setShowSuggestions(true)}
          />
          {showSuggestions && filteredMedications.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredMedications.map((med) => (
                <button
                  key={med._id}
                  onClick={() => addMedication(med)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900">{med.name}</p>
                </button>
              ))}
            </div>
          )}
          {showSuggestions && searchTerm && filteredMedications.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
              <p className="text-sm text-gray-600 mb-2">No medication found</p>
              <Button
                size="sm"
                onClick={() => {
                  setNewMedication({ ...newMedication, name: searchTerm });
                  setShowAddMedication(true);
                  setShowSuggestions(false);
                }}
              >
                <PackagePlus size={16} className="mr-2" />
                Add "{searchTerm}" as New Medication
              </Button>
            </div>
          )}
        </div>

        {!showAddMedication && (
          <Button
            variant="secondary"
            onClick={() => setShowAddMedication(true)}
            fullWidth
          >
            <Plus size={16} className="mr-2" />
            Add New Medication to System
          </Button>
        )}

        {showAddMedication && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900">Add New Medication</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowAddMedication(false);
                  setNewMedication({
                    name: '',
                    description: '',
                    category: 'antibiotic',
                    stock_quantity: '100',
                    requires_prescription: true,
                  });
                }}
              >
                Cancel
              </Button>
            </div>

            <Input
              label="Medication Name"
              value={newMedication.name}
              onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
              placeholder="e.g., Amoxicillin 500mg"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={2}
                value={newMedication.description}
                onChange={(e) => setNewMedication({ ...newMedication, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>

            <Select
              label="Category"
              options={categoryOptions}
              value={newMedication.category}
              onChange={(e) => setNewMedication({ ...newMedication, category: e.target.value })}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newMedication.requires_prescription}
                onChange={(e) => setNewMedication({ ...newMedication, requires_prescription: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">Requires Prescription</span>
            </div>

            <Button onClick={handleAddNewMedication} fullWidth>
              <PackagePlus size={16} className="mr-2" />
              Add Medication and Use in Prescription
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Prescribed Medications:</p>
            {items.length > 0 && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          {items.length === 0 ? (
            <div className="text-center py-8 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-red-800 font-medium mb-2">⚠️ No medications added</p>
              <p className="text-red-600 text-sm">You must add at least one medication before saving the prescription.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{item.medication_name}</p>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                      }
                    />
                    <Input
                      label="Dosage"
                      placeholder="e.g., 500mg"
                      value={item.dosage}
                      onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      rows={2}
                      placeholder="e.g., Take twice daily after meals"
                      value={item.instructions}
                      onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={3}
            placeholder="Any additional instructions or notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {items.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">Note about Pricing</p>
            <p className="text-sm text-blue-700 mt-1">
              The pharmacist will review medication availability and set the final price after the patient selects a pharmacy.
            </p>
          </div>
        )}

        {/* Prescription Summary */}
        {items.length > 0 && (
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm font-medium text-emerald-900 mb-2">Prescription Summary</p>
            <div className="space-y-1">
              <p className="text-sm text-emerald-800">
                <span className="font-medium">{items.length}</span> {items.length === 1 ? 'medication' : 'medications'} ready to be prescribed
              </p>
              {items.some((item) => !item.dosage.trim()) && (
                <p className="text-sm text-red-600 font-medium mt-2">
                  ⚠️ Please enter dosage for all medications before saving
                </p>
              )}
              {items.every((item) => item.dosage.trim()) && (
                <p className="text-sm text-emerald-700 mt-2">
                  ✓ All medications have dosage information
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (items.length === 0) {
                alert('⚠️ Please add at least one medication before saving the prescription.');
                return;
              }
              if (items.some((item) => !item.dosage.trim())) {
                alert('⚠️ Please enter dosage for all medications before saving.');
                return;
              }
              setShowSignature(true);
            }}
            disabled={loading || items.length === 0 || items.some((item) => !item.dosage.trim())}
            fullWidth
          >
            <PenTool size={16} className="mr-2" />
            {items.length === 0 
              ? 'Add Medications First' 
              : items.some((item) => !item.dosage.trim())
              ? 'Complete All Dosages'
              : 'Sign & Save Prescription'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
