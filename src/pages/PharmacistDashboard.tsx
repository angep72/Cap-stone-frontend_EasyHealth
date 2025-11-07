import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Clock, CheckCircle, XCircle, Package, DollarSign } from 'lucide-react';
import { PrescriptionPricingModal } from '../components/pharmacist/PrescriptionPricingModal';

interface PharmacyRequest {
  _id: string;
  status: string;
  createdAt: string;
  patient_id: string | { _id: string; full_name: string; phone: string };
  total_price: number;
  notes?: string;
  signature_data?: string;
  prescription_id?: any; // populated prescription
}

export function PharmacistDashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<PharmacyRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PharmacyRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedPricingPrescription, setSelectedPricingPrescription] = useState<any>(null);

  useEffect(() => {
    fetchPharmacy();
  }, [profile?._id]);

  useEffect(() => {
    fetchRequests();
  }, [pharmacyId]);

  const fetchPharmacy = async () => {
    if (!profile?._id) return;
    try {
      const pharmacy = await api.getPharmacyByPharmacistId(profile._id) as any;
      if (pharmacy && pharmacy._id) {
        setPharmacyId(pharmacy._id);
      } else {
        setPharmacyId(null);
      }
    } catch (error) {
      setPharmacyId(null);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await api.getPharmacyRequests();
      setRequests(data as any);
    } catch (error) {
      console.error('Error fetching pharmacy requests:', error);
      setRequests([]);
    }
  };

  const getPrescription = (request: PharmacyRequest) => (request as any).prescription_id || null;
  const getItems = (request: PharmacyRequest) => {
    const pres = getPrescription(request);
    return Array.isArray(pres?.items) ? pres.items : [];
  };
  const getPatient = (request: PharmacyRequest) => {
    const pres = getPrescription(request);
    return pres && typeof pres.patient_id === 'object' ? pres.patient_id : null;
  };
  const getDoctorName = (request: PharmacyRequest) => {
    const pres = getPrescription(request);
    const doctor = pres && typeof pres.doctor_id === 'object' ? pres.doctor_id : null;
    const doctorUser = doctor && typeof doctor.user_id === 'object' ? doctor.user_id : null;
    return doctorUser?.full_name || 'Unknown Doctor';
  };
  const getPrescriptionId = (request: PharmacyRequest) => getPrescription(request)?._id;
  const getPrescriptionStatus = (request: PharmacyRequest) => getPrescription(request)?.status || request.status;
  const getPrescriptionTotal = (request: PharmacyRequest) => getPrescription(request)?.total_price || 0;

  const handleDispense = async (request: PharmacyRequest) => {
    const presId = getPrescriptionId(request);
    const presStatus = getPrescriptionStatus(request);
    if (presStatus !== 'paid') {
      alert('Cannot dispense. Patient has not paid yet.');
      return;
    }

    setLoading(true);
    try {
      await api.updatePrescription(presId, { status: 'completed' });

      // Notify patient
      try {
        const patient = getPatient(request);
        const patientId = patient?._id || null;
        if (patientId) {
          await api.createNotification({
            user_id: patientId,
            title: 'Prescription Ready',
            message: 'Your prescription has been dispensed and is ready for pickup.',
            type: 'prescription',
            reference_id: presId,
            is_read: false,
          });
        }
      } catch (err) {
        console.error('Notification error:', err);
      }

      fetchRequests();
      setShowDetailModal(false);
    } catch (error: any) {
      console.error('Error dispensing:', error);
      alert('Error dispensing: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const presId = getPrescriptionId(selectedRequest);
      await api.updatePrescription(presId, { status: 'rejected', rejection_reason: rejectionReason });

      // Notify patient
      try {
        const patient = getPatient(selectedRequest);
        const patientId = patient?._id || null;
        if (patientId) {
          await api.createNotification({
            user_id: patientId,
            title: 'Prescription Rejected',
            message: `Your prescription was rejected. Reason: ${rejectionReason}`,
            type: 'prescription',
            reference_id: presId,
            is_read: false,
          });
        }
      } catch (err) {
        console.error('Notification error:', err);
      }

      setShowRejectModal(false);
      setRejectionReason('');
      fetchRequests();
      setShowDetailModal(false);
    } catch (error: any) {
      console.error('Error rejecting:', error);
      alert('Error rejecting: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const pendingPricing = requests.filter((r) => {
    const status = getPrescriptionStatus(r);
    return status === 'pending' || status === 'approved';
  });
  const readyToDispense = requests.filter((r) => getPrescriptionStatus(r) === 'paid');
  const completedRequests = requests.filter((r) => getPrescriptionStatus(r) === 'completed');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacist Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage prescription requests and medications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ready to Dispense</p>
                <p className="text-2xl font-bold text-gray-900">{readyToDispense.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dispensed</p>
                <p className="text-2xl font-bold text-gray-900">{completedRequests.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {!pharmacyId ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-amber-600 font-medium">No pharmacy assigned</p>
              <p className="text-sm text-gray-600 mt-2">
                Please contact the administrator to assign you to a pharmacy.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <Card title="Prescriptions Needing Price Review">
              {pendingPricing.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No prescriptions waiting for price review</p>
              ) : (
                <div className="space-y-4">
                  {pendingPricing.map((request) => {
                    const pres = getPrescription(request);
                    const patient = getPatient(request);
                    const items = getItems(request);
                    return (
                      <div key={pres?._id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{patient?.full_name || 'Unknown Patient'}</p>
                            <p className="text-sm text-gray-600">{patient?.phone || ''}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Prescribed by: Dr. {getDoctorName(request)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Items: {items.length}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPricingPrescription(pres);
                              setShowPricingModal(true);
                            }}
                          >
                            <DollarSign size={16} className="mr-1" />
                            Review & Price
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card title="Prescriptions Ready to Dispense">
              {readyToDispense.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No prescriptions ready for dispensing</p>
              ) : (
                <div className="space-y-4">
                  {readyToDispense.map((request) => {
                    const pres = getPrescription(request);
                    const patient = getPatient(request);
                    const items = getItems(request);
                    return (
                      <div key={pres?._id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{patient?.full_name || 'Unknown Patient'}</p>
                            <p className="text-sm text-gray-600">{patient?.phone || ''}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Prescribed by: Dr. {getDoctorName(request)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Items: {items.length}
                            </p>
                            <p className="text-sm font-medium text-gray-900 mt-2">
                              Total: {getPrescriptionTotal(request)} RWF
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailModal(true);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {pharmacyId && (
          <Card title="Recently Dispensed">
            {completedRequests.slice(0, 5).length === 0 ? (
              <p className="text-center text-gray-600 py-8">No completed prescriptions</p>
            ) : (
              <div className="space-y-3">
                {completedRequests.slice(0, 5).map((request) => {
                  const pres = getPrescription(request);
                  const patient = getPatient(request);
                  const items = getItems(request);
                  return (
                    <div key={pres?._id} className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{patient?.full_name || 'Unknown Patient'}</p>
                      <p className="text-xs text-gray-600">
                        {items.length} items - {getPrescriptionTotal(request)} RWF
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        title="Prescription Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-medium text-gray-900">{getPatient(selectedRequest)?.full_name || 'Unknown Patient'}</p>
              <p className="text-sm text-gray-600">{getPatient(selectedRequest)?.phone || ''}</p>
              <p className="text-sm text-gray-600 mt-2">
                Prescribed by: Dr. {getDoctorName(selectedRequest)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Medications:</p>
              <div className="space-y-3">
                {getItems(selectedRequest).map((item: any, index: number) => {
                  const med = typeof item.medication_id === 'object' ? item.medication_id : null;
                  return (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{med?.name || 'Medication'}</p>
                          <p className="text-sm text-gray-600">Dosage: {item.dosage}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">Instructions: {item.instructions}</p>
                        </div>
                        <p className="font-medium text-gray-900">{item.total_price} RWF</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedRequest.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Notes:</p>
                <p className="text-sm text-gray-600 mt-1">{selectedRequest.notes}</p>
              </div>
            )}

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-emerald-600">
                {getPrescriptionTotal(selectedRequest)} RWF
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="danger"
                onClick={() => setShowRejectModal(true)}
                fullWidth
              >
                <XCircle size={16} className="mr-1" />
                Reject
              </Button>
              <Button
                onClick={() => handleDispense(selectedRequest)}
                disabled={loading}
                fullWidth
              >
                <Package size={16} className="mr-1" />
                {loading ? 'Processing...' : 'Dispense Medication'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
        title="Reject Prescription"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Please provide a reason for rejecting this prescription:</p>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={4}
            placeholder="Enter reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button onClick={handleReject} variant="danger" disabled={loading} fullWidth>
              {loading ? 'Processing...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {profile && (
        <PrescriptionPricingModal
          isOpen={showPricingModal}
          onClose={() => {
            setShowPricingModal(false);
            setSelectedPricingPrescription(null);
          }}
          prescription={selectedPricingPrescription}
          pharmacistId={profile._id}
          onComplete={fetchRequests}
        />
      )}
    </DashboardLayout>
  );
}
