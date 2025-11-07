import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Calendar, Building2, Pill, FlaskRound, CreditCard, Clock, MapPin, Shield, Settings } from 'lucide-react';
import { BookAppointmentModal } from '../components/patient/BookAppointmentModal';
import { PharmacySelectionModal } from '../components/patient/PharmacySelectionModal';
import { PaymentModal } from '../components/payment/PaymentModal';

interface Appointment {
  _id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string;
  doctor_id: string | { _id: string; user_id: string | { _id: string; full_name: string } };
  hospital_id: string | { _id: string; name: string };
  department_id: string | { _id: string; name: string };
  consultation_fee?: number;
  payments?: Array<{
    _id: string;
    status: string;
    patient_pays: number;
  }>;
}

interface LabTestRequest {
  _id: string;
  status: string;
  total_price: number;
  createdAt: string;
  lab_test_template_id: string | { _id: string; name: string; description: string };
  consultation_id: string | { _id: string; diagnosis: string };
  payments?: Array<{
    _id: string;
    status: string;
  }>;
}

interface Prescription {
  _id: string;
  status: string;
  total_price: number;
  notes: string;
  createdAt: string;
  pharmacy_id: string | null;
  consultation_id: string | { _id: string; diagnosis: string; doctor_id: string | { _id: string; user_id: string | { _id: string; full_name: string } } };
  prescription_items?: Array<{
    medication_id: string | { _id: string; name: string };
    quantity: number;
    dosage: string;
  }>;
  pharmacy_id_populated?: {
    name: string;
    location: string;
  };
  payments?: Array<{
    _id: string;
    status: string;
  }>;
  rejection_reason?: string;
}

interface Insurance {
  name: string;
  coverage_percentage: number;
  description: string;
}

export function PatientDashboard() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
  const [labTests, setLabTests] = useState<LabTestRequest[]>([]);
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showLabTestPayment, setShowLabTestPayment] = useState(false);
  const [showPrescriptionPayment, setShowPrescriptionPayment] = useState(false);
  const [showPharmacySelection, setShowPharmacySelection] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedLabTest, setSelectedLabTest] = useState<LabTestRequest | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [availableInsurances, setAvailableInsurances] = useState<Array<{ _id: string; name: string; coverage_percentage: number }>>([]);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState('');

  useEffect(() => {
    if (profile?._id) {
      fetchAppointments();
      fetchLabTests();
      fetchPrescriptions();
      fetchInsurance();
      fetchAvailableInsurances();
    }
  }, [profile?._id]);

  const fetchInsurance = async () => {
    if (!profile?.insurance_id) {
      setInsurance(null);
      return;
    }

    try {
      const data = await api.getInsurance(profile.insurance_id);
      if (data) {
        setInsurance(data as Insurance);
      }
    } catch (error) {
      console.error('Error fetching insurance:', error);
      setInsurance(null);
    }
  };

  const fetchAvailableInsurances = async () => {
    try {
      const data = await api.getInsurances();
      setAvailableInsurances(data);
    } catch (error) {
      console.error('Error fetching available insurances:', error);
    }
  };

  const handleUpdateInsurance = async () => {
    if (!selectedInsuranceId) {
      alert('Please select an insurance provider');
      return;
    }

    if (!profile?._id) {
      alert('Profile not found');
      return;
    }

    try {
      await api.updateProfile(profile._id, { insurance_id: selectedInsuranceId });
      setShowInsuranceModal(false);
      fetchInsurance();
      // Refresh profile to get updated insurance_id
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating insurance:', error);
      alert('Failed to update insurance: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRemoveInsurance = async () => {
    if (!confirm('Are you sure you want to remove your insurance?')) return;

    if (!profile?._id) {
      alert('Profile not found');
      return;
    }

    try {
      await api.updateProfile(profile._id, { insurance_id: null });
      setInsurance(null);
      window.location.reload();
    } catch (error: any) {
      console.error('Error removing insurance:', error);
      alert('Failed to remove insurance: ' + (error.message || 'Unknown error'));
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);

    try {
      const appointmentsData = await api.getAppointments();

      const hasActive = (appointmentsData || []).some((apt: any) =>
        ['pending', 'approved'].includes(apt.status)
      );
      setHasActiveAppointment(hasActive);

      // Attach hospital consultation fee to each appointment
      let hospitalsById: Record<string, any> = {};
      try {
        const hospitals = await api.getHospitals();
        hospitalsById = (hospitals || []).reduce((acc: Record<string, any>, h: any) => {
          acc[h._id] = h;
          return acc;
        }, {});
      } catch (e) {
        // If hospitals fetch fails, continue without fees
        hospitalsById = {};
      }

      const withFees = (appointmentsData || []).map((apt: any) => {
        const hospitalId = typeof apt.hospital_id === 'string' ? apt.hospital_id : apt.hospital_id?._id;
        const hospital = hospitalsById[hospitalId];
        const consultation_fee = hospital?.consultation_fee ?? 0;
        return { ...apt, consultation_fee };
      });
      
      // Filter and limit to 5 most recent
      const sortedAppointments = withFees
        .sort((a: Appointment, b: Appointment) => {
          const dateA = new Date(a.appointment_date).getTime();
          const dateB = new Date(b.appointment_date).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      // Fetch payments for these appointments
      if (sortedAppointments.length > 0) {
        const appointmentIds = sortedAppointments.map((apt: Appointment) => apt._id);
        
        try {
          const allPayments = await api.getPayments();
          const consultationPayments = allPayments.filter((p: any) => 
            p.payment_type === 'consultation' && appointmentIds.includes(p.reference_id)
          );

          const appointmentsWithPayments = sortedAppointments.map((apt: any) => ({
            ...apt,
            payments: consultationPayments.filter((p: any) => p.reference_id === apt._id) || []
          }));

          setAppointments(appointmentsWithPayments as any);
        } catch (paymentError) {
          console.error('Error fetching payments:', paymentError);
          setAppointments(sortedAppointments as any);
        }
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
      setHasActiveAppointment(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasPayment = (appointment: Appointment) => {
    return appointment.payments && appointment.payments.length > 0 &&
           appointment.payments.some(p => p.status === 'completed');
  };

  const handlePayNow = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowPayment(true);
  };

  const fetchPrescriptions = async () => {
    try {
      const prescriptionsData = await api.getPrescriptions();
      
      // Show all prescriptions - 'pending' status means prescription is ready for patient to select pharmacy
      // Sort by newest first, with 'pending' prescriptions at the top
      const sortedPrescriptions = prescriptionsData
        .filter((p: Prescription) => ['pending', 'approved', 'paid', 'completed', 'rejected'].includes(p.status))
        .sort((a: Prescription, b: Prescription) => {
          // Prioritize pending prescriptions
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (b.status === 'pending' && a.status !== 'pending') return 1;
          
          // Then sort by date (newest first)
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 20); // Show more prescriptions

      setPrescriptions(sortedPrescriptions as any);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    }
  };

  const handleSelectPharmacy = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowPharmacySelection(true);
  };

  const fetchLabTests = async () => {
    try {
      const labTestsData = await api.getLabTestRequests();
      
      // Filter by status and sort by creation date
      const filteredLabTests = labTestsData
        .filter((test: LabTestRequest) => test.status === 'awaiting_payment')
        .sort((a: LabTestRequest, b: LabTestRequest) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

      // Fetch payments for these lab tests
      if (filteredLabTests.length > 0) {
        const labTestIds = filteredLabTests.map((test: LabTestRequest) => test._id);
        
        try {
          const allPayments = await api.getPayments();
          const labTestPayments = allPayments.filter((p: any) => 
            p.payment_type === 'lab_test' && labTestIds.includes(p.reference_id)
          );

          const testsWithPayments = filteredLabTests.map((test: LabTestRequest) => ({
            ...test,
            payments: labTestPayments.filter((p: any) => p.reference_id === test._id) || []
          }));

          setLabTests(testsWithPayments as any);
        } catch (paymentError) {
          console.error('Error fetching payments:', paymentError);
          setLabTests(filteredLabTests as any);
        }
      } else {
        setLabTests([]);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      setLabTests([]);
    }
  };

  const hasLabTestPayment = (labTest: LabTestRequest) => {
    return labTest.payments && labTest.payments.length > 0 &&
           labTest.payments.some(p => p.status === 'completed');
  };

  const handlePayLabTest = (labTest: LabTestRequest) => {
    setSelectedLabTest(labTest);
    setShowLabTestPayment(true);
  };

  const calculatePatientAmount = (totalAmount: number) => {
    if (!insurance) return totalAmount;
    const coverage = (totalAmount * insurance.coverage_percentage) / 100;
    return totalAmount - coverage;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {profile?.full_name}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your healthcare appointments and records
            </p>
          </div>
          <Button onClick={() => setShowBooking(true)} disabled={hasActiveAppointment}>
            <Calendar size={20} className="mr-2" />
            Book Appointment
          </Button>
        </div>

        {hasActiveAppointment && (
          <p className="text-sm text-red-600">
            You already have an appointment in progress. Please complete it before booking another.
          </p>
        )}

        {insurance && (
          <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Shield size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Insurance Coverage Active
                  </h3>
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    {insurance.name}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    {insurance.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                      {insurance.coverage_percentage}% Coverage
                    </span>
                    <span className="text-sm text-gray-600">
                      You pay only {100 - insurance.coverage_percentage}% of all costs
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowInsuranceModal(true)}
                >
                  <Settings size={14} className="mr-1" />
                  Change
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleRemoveInsurance}
                >
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!insurance && (
          <Card className="bg-yellow-50 border-2 border-yellow-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <Shield size={20} className="text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <strong>No Insurance:</strong> You will pay full price for all medical services. Consider adding insurance to reduce your costs.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowInsuranceModal(true)}
              >
                <Shield size={14} className="mr-1" />
                Add Insurance
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Calendar size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FlaskRound size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lab Tests</p>
                <p className="text-2xl font-bold text-gray-900">{labTests.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Pill size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <CreditCard size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">0 RWF</p>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Recent Appointments">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No appointments yet</p>
              <Button
                onClick={() => setShowBooking(true)}
                className="mt-4"
                size="sm"
              >
                Book Your First Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-white rounded-lg">
                      <Building2 size={24} className="text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Dr. {
                          typeof apt.doctor_id === 'object' &&
                          typeof apt.doctor_id.user_id === 'object'
                            ? apt.doctor_id.user_id.full_name
                            : 'Doctor'
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        {typeof apt.department_id === 'object' ? apt.department_id.name : 'Department'} - {typeof apt.hospital_id === 'object' ? apt.hospital_id.name : 'Hospital'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={14} className="text-gray-500" />
                        <p className="text-sm text-gray-600">
                          {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                        </p>
                      </div>
                      <div className="mt-1">
                        {insurance ? (
                          <div className="text-sm">
                            <p className="text-gray-500 line-through">
                              {apt.consultation_fee || 0} RWF
                            </p>
                            <p className="text-emerald-600 font-semibold">
                              You pay: {calculatePatientAmount(apt.consultation_fee || 0).toFixed(0)} RWF
                              <span className="text-xs ml-1">({insurance.coverage_percentage}% covered)</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-600 font-medium">
                            Fee: {apt.consultation_fee || 0} RWF
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {apt.status === 'approved' && !hasPayment(apt) && (
                      <Button
                        size="sm"
                        onClick={() => handlePayNow(apt)}
                      >
                        <CreditCard size={14} className="mr-1" />
                        Pay Now
                      </Button>
                    )}
                    {apt.status === 'approved' && hasPayment(apt) && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                        Paid
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        apt.status
                      )}`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {labTests.length > 0 && (
          <Card title="Pending Lab Tests - Payment Required">
            <div className="space-y-4">
              {labTests.map((test) => (
                <div
                  key={test._id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-white rounded-lg">
                      <FlaskRound size={24} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {typeof test.lab_test_template_id === 'object' ? test.lab_test_template_id.name : 'Lab Test'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {typeof test.lab_test_template_id === 'object' ? test.lab_test_template_id.description : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Diagnosis: {typeof test.consultation_id === 'object' ? test.consultation_id.diagnosis : 'N/A'}
                      </p>
                      <div className="mt-1">
                        {insurance ? (
                          <div className="text-sm">
                            <p className="text-gray-500 line-through">
                              {test.total_price} RWF
                            </p>
                            <p className="text-blue-600 font-semibold">
                              You pay: {calculatePatientAmount(test.total_price).toFixed(0)} RWF
                              <span className="text-xs ml-1">({insurance.coverage_percentage}% covered)</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-blue-600 font-medium">
                            Cost: {test.total_price} RWF
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!hasLabTestPayment(test) && (
                      <Button
                        size="sm"
                        onClick={() => handlePayLabTest(test)}
                      >
                        <CreditCard size={14} className="mr-1" />
                        Pay Now
                      </Button>
                    )}
                    {hasLabTestPayment(test) && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                        Payment Processing
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {prescriptions.length > 0 && (
          <Card title="Your Prescriptions">
            <div className="space-y-4">
              {prescriptions.map((prescription) => {
                const isPending = prescription.status === 'pending' && !prescription.pharmacy_id;
                return (
                <div
                  key={prescription._id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    isPending 
                      ? 'bg-emerald-50 border-emerald-300 shadow-md' 
                      : 'bg-purple-50 border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-white rounded-lg">
                      <Pill size={24} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          Prescription from Dr. {
                            typeof prescription.consultation_id === 'object' && 
                            typeof prescription.consultation_id.doctor_id === 'object' &&
                            typeof prescription.consultation_id.doctor_id.user_id === 'object'
                              ? prescription.consultation_id.doctor_id.user_id.full_name
                              : 'Doctor'
                          }
                        </p>
                        {isPending && (
                          <span className="px-2 py-1 text-xs font-bold bg-emerald-500 text-white rounded-full animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Diagnosis: {typeof prescription.consultation_id === 'object' ? prescription.consultation_id.diagnosis : 'N/A'}
                      </p>
                    <div className="mt-2">
                      {/* Each prescription now represents one medication */}
                      <p className="text-sm text-gray-600">
                        💊 {typeof prescription.medication_id === 'object' ? prescription.medication_id.name : 'Medication'} - {prescription.dosage || 'N/A'} (Qty: {prescription.quantity || 0})
                      </p>
                      {prescription.instructions && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Instructions: {prescription.instructions}
                        </p>
                      )}
                    </div>
                      {prescription.status === 'approved' && prescription.total_price > 0 && (
                        <div className="mt-2">
                          {insurance ? (
                            <div className="text-sm">
                              <p className="text-gray-500 line-through">
                                {prescription.total_price} RWF
                              </p>
                              <p className="text-purple-600 font-semibold">
                                You pay: {calculatePatientAmount(prescription.total_price).toFixed(0)} RWF
                                <span className="text-xs ml-1">({insurance.coverage_percentage}% covered)</span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-purple-600 font-medium">
                              Total: {prescription.total_price} RWF
                            </p>
                          )}
                        </div>
                      )}
                      {isPending && (
                        <p className="text-sm text-emerald-700 font-medium mt-2 bg-emerald-100 px-3 py-2 rounded">
                          ⚡ Action Required: Please select a pharmacy to proceed with your prescription
                        </p>
                      )}
                      {prescription.status === 'pending' && prescription.pharmacy_id && (
                        <p className="text-sm text-blue-600 font-medium mt-2">
                          Price will be set by pharmacist after review
                        </p>
                      )}
                      {prescription.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Notes: {prescription.notes}
                        </p>
                      )}
                      {prescription.pharmacy_id && prescription.pharmacy_id_populated && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
                          <p className="text-xs text-emerald-700 font-medium">
                            <MapPin size={12} className="inline mr-1" />
                            Selected: {prescription.pharmacy_id_populated.name}
                          </p>
                          <p className="text-xs text-emerald-600">
                            {prescription.pharmacy_id_populated.location}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {prescription.status === 'pending' && !prescription.pharmacy_id ? (
                      <Button
                        size="sm"
                        onClick={() => handleSelectPharmacy(prescription)}
                      >
                        <MapPin size={14} className="mr-1" />
                        Select Pharmacy
                      </Button>
                    ) : prescription.status === 'pending' && prescription.pharmacy_id ? (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded">
                        Awaiting Pharmacist Review
                      </span>
                    ) : prescription.status === 'approved' ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPrescription(prescription);
                          setShowPrescriptionPayment(true);
                        }}
                      >
                        Pay {insurance ? calculatePatientAmount(prescription.total_price).toFixed(0) : prescription.total_price} RWF
                      </Button>
                    ) : prescription.status === 'paid' ? (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded">
                        Paid - Ready for Pickup
                      </span>
                    ) : prescription.status === 'completed' ? (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded border border-green-200">
                        ✓ Dispensed
                      </span>
                    ) : prescription.status === 'rejected' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-2 rounded">
                          Rejected
                        </span>
                        {prescription.rejection_reason && (
                          <span className="text-xs text-red-700">Reason: {prescription.rejection_reason}</span>
                        )}
                        <Button size="sm" onClick={() => handleSelectPharmacy(prescription)}>
                          <MapPin size={14} className="mr-1" />
                          Choose Another Pharmacy
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded">
                        {prescription.status}
                      </span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <BookAppointmentModal
        isOpen={showBooking}
        onClose={() => {
          setShowBooking(false);
          fetchAppointments();
        }}
      />

      {selectedAppointment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => {
            setShowPayment(false);
            setSelectedAppointment(null);
          }}
          paymentType="consultation"
          referenceId={selectedAppointment._id}
          amount={selectedAppointment.consultation_fee || 0}
          description={`Consultation with Dr. ${
            typeof selectedAppointment.doctor_id === 'object' &&
            typeof selectedAppointment.doctor_id.user_id === 'object'
              ? selectedAppointment.doctor_id.user_id.full_name
              : 'Doctor'
          }`}
          onSuccess={() => {
            fetchAppointments();
          }}
        />
      )}

      {selectedLabTest && (
        <PaymentModal
          isOpen={showLabTestPayment}
          onClose={() => {
            setShowLabTestPayment(false);
            setSelectedLabTest(null);
            fetchLabTests();
          }}
          paymentType="lab_test"
          referenceId={selectedLabTest._id}
          amount={selectedLabTest.total_price}
          description={`Lab Test: ${typeof selectedLabTest.lab_test_template_id === 'object' ? selectedLabTest.lab_test_template_id.name : 'Lab Test'}`}
          onSuccess={async () => {
            try {
              await api.updateLabTestRequest(selectedLabTest._id, { status: 'pending' });

              await api.createNotification({
                user_id: profile?._id || '',
                title: 'Lab Test Sent to Lab',
                message: `Your lab test "${typeof selectedLabTest.lab_test_template_id === 'object' ? selectedLabTest.lab_test_template_id.name : 'Lab Test'}" has been sent to the laboratory for processing.`,
                type: 'lab_test',
                reference_id: selectedLabTest._id,
              });

              setShowLabTestPayment(false);
              setSelectedLabTest(null);
              fetchLabTests();
              fetchAppointments();
            } catch (error) {
              console.error('Error updating lab test:', error);
              alert('Payment successful but failed to update lab test status. Please refresh the page.');
            }
          }}
        />
      )}

      {selectedPrescription && showPharmacySelection && (
        <PharmacySelectionModal
          isOpen={showPharmacySelection}
          onClose={() => {
            setShowPharmacySelection(false);
            setSelectedPrescription(null);
          }}
          prescriptionId={selectedPrescription._id}
          onPharmacySelected={() => {
            setShowPharmacySelection(false);
            setSelectedPrescription(null);
            fetchPrescriptions();
          }}
        />
      )}

      {selectedPrescription && showPrescriptionPayment && (
        <PaymentModal
          isOpen={showPrescriptionPayment}
          onClose={() => {
            setShowPrescriptionPayment(false);
            setSelectedPrescription(null);
          }}
          paymentType="medication"
          referenceId={selectedPrescription._id}
          amount={selectedPrescription.total_price}
          description={`Prescription from Dr. ${
            typeof selectedPrescription.consultation_id === 'object' &&
            typeof selectedPrescription.consultation_id.doctor_id === 'object' &&
            typeof selectedPrescription.consultation_id.doctor_id.user_id === 'object'
              ? selectedPrescription.consultation_id.doctor_id.user_id.full_name
              : 'Doctor'
          }`}
          onSuccess={() => {
            setShowPrescriptionPayment(false);
            setSelectedPrescription(null);
            fetchPrescriptions();
          }}
        />
      )}

      <Modal
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        title={insurance ? "Change Insurance Provider" : "Add Insurance"}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Select an insurance provider to reduce your medical costs. Insurance will automatically apply to all future payments.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Provider
            </label>
            <select
              value={selectedInsuranceId}
              onChange={(e) => setSelectedInsuranceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select an insurance provider</option>
              {availableInsurances.map((ins) => (
                <option key={ins._id} value={ins._id}>
                  {ins.name} - {ins.coverage_percentage}% Coverage
                </option>
              ))}
            </select>
          </div>

          {selectedInsuranceId && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800 font-medium">
                With this insurance, you will pay only{' '}
                {100 - (availableInsurances.find(i => i._id === selectedInsuranceId)?.coverage_percentage || 0)}% of all medical costs.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => setShowInsuranceModal(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateInsurance}
              fullWidth
            >
              {insurance ? 'Update Insurance' : 'Add Insurance'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
