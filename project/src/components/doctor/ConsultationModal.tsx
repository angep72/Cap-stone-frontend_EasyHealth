import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

import { FlaskRound, Pill, Save } from 'lucide-react';
import { PrescriptionBuilder } from './PrescriptionBuilder';

interface Appointment {
  _id: string;
  patient_id: string | { _id: string };
  hospital_id?: string | { _id: string };
  weight?: number | null;
  temperature?: number | null;
  profiles?: {
    full_name: string;
  };
}

interface LabTest {
  _id: string;
  name: string;
  price: number;
}

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  doctorId: string;
}

export function ConsultationModal({
  isOpen,
  onClose,
  appointment,
  doctorId,
}: ConsultationModalProps) {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [requiresLabTest, setRequiresLabTest] = useState(false);
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [showPrescription, setShowPrescription] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [existingConsultation, setExistingConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLabTests();
      checkExistingConsultation();
    }
  }, [isOpen]);

  const fetchLabTests = async () => {
    try {
      const data = await api.getLabTestTemplates();
      setLabTests(data);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    }
  };

  const checkExistingConsultation = async () => {
    try {
      const consultations = await api.getConsultations();
      const existingConsultationData = consultations.find((c: any) => 
        c.appointment_id === appointment._id || 
        (typeof c.appointment_id === 'object' && c.appointment_id._id === appointment._id)
      );

      if (existingConsultationData) {
        setExistingConsultation(existingConsultationData);
        setConsultationId(existingConsultationData._id);
        setDiagnosis(existingConsultationData.diagnosis || '');
        setNotes(existingConsultationData.notes || '');
        setRequiresLabTest(existingConsultationData.requires_lab_test || false);
        setRequiresPrescription(existingConsultationData.requires_prescription || false);

        if (existingConsultationData.requires_lab_test) {
          const labTestRequests = await api.getLabTestRequests();
          const existingTests = labTestRequests.filter((req: any) => {
            const reqConsultationId = typeof req.consultation_id === 'string' 
              ? req.consultation_id 
              : req.consultation_id?._id;
            return reqConsultationId === existingConsultationData._id;
          });

          if (existingTests && existingTests.length > 0) {
            const testIds = existingTests.map((req: any) => {
              const templateId = typeof req.lab_test_template_id === 'string' 
                ? req.lab_test_template_id 
                : req.lab_test_template_id?._id;
              return templateId;
            }).filter(Boolean);
            setSelectedLabTests(testIds);
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing consultation:', error);
    }
  };

  const handleSaveConsultation = async () => {
    if (!diagnosis.trim()) {
      alert('Please enter a diagnosis');
      return;
    }

    setLoading(true);

    try {
      const patientId = typeof appointment.patient_id === 'string' 
        ? appointment.patient_id 
        : appointment.patient_id._id;
      const hospitalId = typeof appointment.hospital_id === 'string'
        ? appointment.hospital_id
        : appointment.hospital_id?._id;

      let consultation;

      if (existingConsultation && consultationId) {
        consultation = await api.updateConsultation(consultationId, {
          diagnosis,
          notes,
          requires_lab_test: requiresLabTest,
          requires_prescription: requiresPrescription,
        });
      } else {
        consultation = await api.createConsultation({
          appointment_id: appointment._id,
          patient_id: patientId,
          doctor_id: doctorId,
          diagnosis,
          notes,
          requires_lab_test: requiresLabTest,
          requires_prescription: requiresPrescription,
        });
      }

      setConsultationId(consultation._id);

      if (requiresLabTest && selectedLabTests.length > 0) {
        const labTestRequests = await api.getLabTestRequests();
        const existingTestRequests = labTestRequests.filter((req: any) => {
          const reqConsultationId = typeof req.consultation_id === 'string' 
            ? req.consultation_id 
            : req.consultation_id?._id;
          return reqConsultationId === consultation._id;
        });

        const existingTestIds = existingTestRequests.map((req: any) => {
          const templateId = typeof req.lab_test_template_id === 'string' 
            ? req.lab_test_template_id 
            : req.lab_test_template_id?._id;
          return templateId;
        }).filter(Boolean);

        const newTestIds = selectedLabTests.filter(id => !existingTestIds.includes(id));

        for (const testId of newTestIds) {
          const test = labTests.find((t) => t._id === testId);
          if (test) {
            try {
              await api.createLabTestRequest({
                consultation_id: consultation._id,
                patient_id: patientId,
                doctor_id: doctorId,
                hospital_id: hospitalId,
                lab_test_template_id: testId,
                total_price: test.price,
                status: 'awaiting_payment',
              });
            } catch (error) {
              console.error('Error creating lab test request:', error);
            }
          }
        }

        if (newTestIds.length > 0) {
          const newTestsTotal = newTestIds.reduce((total, testId) => {
            const test = labTests.find((t) => t._id === testId);
            return total + (test?.price || 0);
          }, 0);

          try {
            await api.createNotification({
              user_id: patientId,
              title: 'Lab Tests Required',
              message: `Doctor has prescribed ${newTestIds.length} lab test(s). Total: ${newTestsTotal} RWF. Please proceed with payment.`,
              type: 'lab_test',
              reference_id: consultation._id,
              is_read: false,
            });
          } catch (error) {
            console.error('Error creating notification:', error);
          }
        }
      }

      if (requiresPrescription) {
        setShowPrescription(true);
      } else {
        await completeConsultation();
      }
    } catch (error: any) {
      console.error('Error saving consultation:', error);
      alert('Error saving consultation: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const completeConsultation = async () => {
    try {
      const patientId = typeof appointment.patient_id === 'string' 
        ? appointment.patient_id 
        : appointment.patient_id._id;

      await api.updateAppointment(appointment._id, { status: 'completed' });

      try {
        await api.createNotification({
          user_id: patientId,
          title: 'Consultation Completed',
          message: notes || 'Your consultation has been completed.',
          type: 'consultation',
          reference_id: appointment._id,
          is_read: false,
        });
      } catch (error) {
        console.error('Error creating notification:', error);
      }

      onClose();
    } catch (error: any) {
      console.error('Error completing consultation:', error);
      alert('Error completing consultation: ' + (error.message || 'Unknown error'));
    }
  };

  const handlePrescriptionComplete = async () => {
    await completeConsultation();
  };

  const handleToggleLabTest = (testId: string) => {
    setSelectedLabTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const calculateLabTestTotal = () => {
    return selectedLabTests.reduce((total, testId) => {
      const test = labTests.find((t) => t._id === testId);
      return total + (test?.price || 0);
    }, 0);
  };

  if (showPrescription && consultationId) {
    return (
      <PrescriptionBuilder
        isOpen={isOpen}
        onClose={onClose}
        consultationId={consultationId}
        patientId={appointment.patient_id}
        doctorId={doctorId}
        onComplete={handlePrescriptionComplete}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Patient Consultation" size="xl">
      <div className="space-y-6">
        {existingConsultation && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm font-medium text-yellow-800">
              Editing existing consultation - You can add new lab tests or update the diagnosis
            </p>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
          <div>
            <p className="text-sm text-gray-600">Patient</p>
            <p className="text-lg font-medium text-gray-900">{appointment.profiles?.full_name || 'Unknown Patient'}</p>
          </div>
          {(appointment.weight || appointment.temperature) && (
            <div className="border-t border-blue-200 pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Patient Vitals (Recorded by Nurse)</p>
              <div className="grid grid-cols-2 gap-4">
                {appointment.weight && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Weight</p>
                    <p className="text-lg font-semibold text-gray-900">{appointment.weight} kg</p>
                  </div>
                )}
                {appointment.temperature && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Temperature</p>
                    <p className="text-lg font-semibold text-gray-900">{appointment.temperature}°C</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={3}
            placeholder="Enter diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes / Comments to Patient
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={4}
            placeholder="Enter any additional notes or comments for the patient"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requiresLabTest"
              checked={requiresLabTest}
              onChange={(e) => setRequiresLabTest(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="requiresLabTest" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FlaskRound size={18} className="text-blue-600" />
              Requires Lab Tests
            </label>
          </div>

          {requiresLabTest && (
            <div className="ml-7 p-4 bg-gray-50 rounded-lg space-y-3">
              <p className="text-sm font-medium text-gray-700">Select Lab Tests:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {labTests.map((test) => (
                  <label
                    key={test._id}
                    className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-emerald-500 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedLabTests.includes(test._id)}
                        onChange={() => handleToggleLabTest(test._id)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-900">{test.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{test.price} RWF</span>
                  </label>
                ))}
              </div>
              {selectedLabTests.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    Total: {calculateLabTestTotal()} RWF
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="requiresPrescription"
            checked={requiresPrescription}
            onChange={(e) => setRequiresPrescription(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
          />
          <label htmlFor="requiresPrescription" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Pill size={18} className="text-purple-600" />
            Requires Prescription
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button onClick={handleSaveConsultation} disabled={loading} fullWidth>
            <Save size={16} className="mr-2" />
            {loading ? 'Saving...' : requiresPrescription ? 'Save & Write Prescription' : 'Complete Consultation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
