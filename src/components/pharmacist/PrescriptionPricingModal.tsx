import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Save, XCircle } from 'lucide-react';

interface PrescriptionItem {
  _id: string;
  medication_id: string | { _id: string; name: string; stock_quantity?: number };
  quantity: number;
  dosage: string;
  instructions?: string;
  total_price?: number;
}

interface Prescription {
  _id: string;
  patient_id: string | { _id: string; full_name: string; phone?: string };
  notes?: string;
  items: PrescriptionItem[];
}

interface PrescriptionPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  pharmacistId: string;
  onComplete: () => void;
}

export function PrescriptionPricingModal({
  isOpen,
  onClose,
  prescription,
  pharmacistId,
  onComplete,
}: PrescriptionPricingModalProps) {
  const [itemPrices, setItemPrices] = useState<Record<string, { unitPrice: string; available: boolean }>>({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    console.log('PrescriptionPricingModal: prescription prop changed:', prescription);
    setCurrentPrescription(prescription);
  }, [prescription]);

  useEffect(() => {
    const ensurePrescription = async () => {
      if (!isOpen) return;
      if (!currentPrescription) return;
      // Fetch full prescription from API to ensure medication_id is populated
      if (!currentPrescription.medication_id || typeof currentPrescription.medication_id === 'string') {
        try {
          const full = await api.getPrescription(currentPrescription._id);
          setCurrentPrescription(full);
        } catch (err) {
          // keep existing
        }
      }
    };
    ensurePrescription();
  }, [isOpen, currentPrescription?._id]);

  useEffect(() => {
    if (currentPrescription && isOpen) {
      // Each prescription now represents one medication
      const med = typeof currentPrescription.medication_id === 'object' ? currentPrescription.medication_id : null;
      const stockQty = med?.stock_quantity ?? undefined;
      const prescriptionId = currentPrescription._id;
      
      const initialPrices: Record<string, { unitPrice: string; available: boolean }> = {};
      initialPrices[prescriptionId] = {
        unitPrice: currentPrescription.unit_price ? currentPrescription.unit_price.toString() : '',
        available: typeof stockQty === 'number' ? stockQty >= (currentPrescription.quantity || 0) : true,
      };
      
      setItemPrices(initialPrices);
      setShowRejectForm(false);
      setRejectionReason('');
    }
  }, [currentPrescription, isOpen]);

  const handlePriceChange = (itemId: string, price: string) => {
    setItemPrices((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], unitPrice: price },
    }));
  };

  const handleAvailabilityToggle = (itemId: string) => {
    setItemPrices((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], available: !prev[itemId].available },
    }));
  };

  const calculateTotal = () => {
    if (!currentPrescription) return 0;
    const prescriptionId = currentPrescription._id;
    const price = parseFloat(itemPrices[prescriptionId]?.unitPrice || '0');
    const isAvailable = itemPrices[prescriptionId]?.available ?? true;
    const quantity = currentPrescription.quantity || 0;
    return isAvailable ? price * quantity : 0;
  };

  const allItemsAvailable = () => {
    if (!currentPrescription) return false;
    const prescriptionId = currentPrescription._id;
    return itemPrices[prescriptionId]?.available ?? true;
  };

  const allPricesSet = () => {
    if (!currentPrescription) return false;
    const prescriptionId = currentPrescription._id;
    const priceInfo = itemPrices[prescriptionId];
    if (!priceInfo?.available) return true;
    return priceInfo.unitPrice && parseFloat(priceInfo.unitPrice) > 0;
  };

  const handleApprove = async () => {
    if (!currentPrescription) return;

    if (!allItemsAvailable()) {
      const confirmReject = window.confirm(
        'Some medications are unavailable. This will reject the prescription. Continue?'
      );
      if (!confirmReject) return;
      setShowRejectForm(true);
      setRejectionReason('Some medications are unavailable at this time.');
      return;
    }

    if (!allPricesSet()) {
      alert('Please set the price for this medication');
      return;
    }

    setLoading(true);

    try {
      // Each prescription now represents one medication, so update it directly
      const prescriptionId = currentPrescription._id;
      const price = parseFloat(itemPrices[prescriptionId]?.unitPrice || '0');
      const totalPrice = calculateTotal();

      await api.updatePrescription(currentPrescription._id, {
        unit_price: price,
        total_price: totalPrice,
        pharmacist_id: pharmacistId,
        pharmacist_approved_at: new Date().toISOString(),
        status: 'approved',
      });

      try {
        const patientId = typeof currentPrescription.patient_id === 'string' ? currentPrescription.patient_id : currentPrescription.patient_id?._id;
        if (patientId) {
          await api.createNotification({
            user_id: patientId,
            title: 'Prescription Approved',
            message: `Your prescription has been approved. Total: ${calculateTotal()} RWF. Please proceed with payment.`,
            type: 'prescription',
            reference_id: currentPrescription._id,
            is_read: false,
          });
        }
      } catch (err) {
        console.error('Notification error:', err);
      }

      onComplete();
      onClose();
    } catch (error: any) {
      console.error('Error approving prescription:', error);
      alert('Error approving prescription: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason?: string) => {
    const rejectReason = reason || rejectionReason.trim();
    if (!currentPrescription || !rejectReason) {
      if (!reason) {
        alert('Please provide a reason for rejection');
      }
      return;
    }

    setLoading(true);

    try {
      await api.updatePrescription(currentPrescription._id, { status: 'rejected', rejection_reason: rejectReason });
      try {
        const patientId = typeof currentPrescription.patient_id === 'string' ? currentPrescription.patient_id : currentPrescription.patient_id?._id;
        if (patientId) {
          await api.createNotification({
            user_id: patientId,
            title: 'Prescription Rejected',
            message: `Your prescription was rejected by the pharmacy. Reason: ${rejectReason}`,
            type: 'prescription',
            reference_id: currentPrescription._id,
            is_read: false,
          });
        }
      } catch (err) {
        console.error('Notification error:', err);
      }

      onComplete();
      onClose();
    } catch (error: any) {
      console.error('Error rejecting prescription:', error);
      alert('Error rejecting prescription: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRejectEmpty = async () => {
    await handleReject('Prescription contains no items. Please contact your doctor.');
  };

  const patient = currentPrescription && typeof currentPrescription.patient_id === 'object' ? currentPrescription.patient_id : null;

  console.log('PrescriptionPricingModal render:', { 
    isOpen, 
    hasPrescription: !!currentPrescription, 
    hasMedication: !!currentPrescription?.medication_id,
    medicationName: typeof currentPrescription?.medication_id === 'object' ? currentPrescription.medication_id.name : 'N/A'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review & Price Prescription" size="xl">
      {!currentPrescription ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-600">Loading prescription...</p>
        </div>
      ) : (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Patient</p>
          <p className="font-medium text-gray-900">{patient?.full_name || 'Unknown Patient'}</p>
          <p className="text-sm text-gray-600">{patient?.phone || ''}</p>
          {currentPrescription.notes && (
            <p className="text-sm text-gray-700 mt-2 italic">Note: {currentPrescription.notes}</p>
          )}
        </div>

        {showRejectForm ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900 mb-2">Reject Prescription</p>
              <p className="text-sm text-red-700 mb-3">
                Please provide a clear reason for rejection so the patient can understand.
              </p>
              <textarea
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason('');
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={loading}
                fullWidth
              >
                <XCircle size={16} className="mr-2" />
                {loading ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <p className="font-medium text-gray-900">Prescription Medication</p>
              {!currentPrescription.medication_id ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium mb-2">No medication found in this prescription.</p>
                  <p className="text-red-700 text-sm">This prescription appears to be invalid. Please reject it and notify the patient to contact their doctor.</p>
                  <Button
                    variant="danger"
                    onClick={handleRejectEmpty}
                    className="mt-3"
                    disabled={loading}
                  >
                    <XCircle size={16} className="mr-2" />
                    {loading ? 'Rejecting...' : 'Reject Invalid Prescription'}
                  </Button>
                </div>
              ) : (
                (() => {
                  const med = typeof currentPrescription.medication_id === 'object' ? currentPrescription.medication_id : null;
                  const prescriptionId = currentPrescription._id;
                  const quantity = currentPrescription.quantity || 0;
                  const dosage = currentPrescription.dosage || 'N/A';
                  const instructions = currentPrescription.instructions || '';
                  
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{med?.name || 'Medication'}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {quantity} | Dosage: {dosage}
                          </p>
                          {instructions && (
                            <p className="text-sm text-gray-600 italic">Instructions: {instructions}</p>
                          )}
                          {typeof med?.stock_quantity === 'number' && (
                            <p className="text-sm text-gray-600 mt-1">
                              Stock: {med.stock_quantity} units
                            </p>
                          )}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={itemPrices[prescriptionId]?.available || false}
                            onChange={() => handleAvailabilityToggle(prescriptionId)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-700">Available</span>
                        </label>
                      </div>

                      {itemPrices[prescriptionId]?.available && (
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Unit Price (RWF)"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter unit price"
                            value={itemPrices[prescriptionId]?.unitPrice || ''}
                            onChange={(e) => handlePriceChange(prescriptionId, e.target.value)}
                            required
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                              {(parseFloat(itemPrices[prescriptionId]?.unitPrice || '0') * quantity).toFixed(2)} RWF
                            </div>
                          </div>
                        </div>
                      )}

                      {!itemPrices[prescriptionId]?.available && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">This medication is marked as unavailable</p>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {allItemsAvailable() && (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-emerald-600">{calculateTotal().toFixed(2)} RWF</p>
              </div>
            )}

            {!allItemsAvailable() && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Some medications are unavailable. You can reject this prescription and notify the patient.
                </p>
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
                variant="danger"
                onClick={() => setShowRejectForm(true)}
                fullWidth
              >
                <XCircle size={16} className="mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={loading || !allItemsAvailable() || !allPricesSet()}
                fullWidth
              >
                <Save size={16} className="mr-2" />
                {loading ? 'Approving...' : 'Approve & Set Prices'}
              </Button>
            </div>
          </>
        )}
      </div>
      )}
    </Modal>
  );
}
