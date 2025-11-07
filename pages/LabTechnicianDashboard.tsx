import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { FlaskRound, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface LabTestRequest {
  _id: string;
  status: string;
  total_price: number;
  createdAt: string;
  patient_id: string | { _id: string; full_name: string };
  lab_test_template_id: string | { _id: string; name: string; description: string };
  doctor_id: string | { 
    _id: string;
    user_id: string | { _id: string; full_name: string };
  };
}

export function LabTechnicianDashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LabTestRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LabTestRequest | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultStatus, setResultStatus] = useState<'positive' | 'negative' | 'inconclusive'>('negative');
  const [resultData, setResultData] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await api.getLabTestRequests();
      setRequests(data as any);
    } catch (error) {
      console.error('Error fetching lab test requests:', error);
    }
  };

  const handleStartTest = async (request: LabTestRequest) => {
    try {
      // Check if payment is completed
      const payments = await api.getPayments();
      const payment = payments.find((p: any) => {
        const refId = typeof p.reference_id === 'string' ? p.reference_id : p.reference_id?._id;
        return refId === request._id && 
               p.payment_type === 'lab_test' && 
               p.status === 'completed';
      });

      if (!payment) {
        alert('Patient has not paid for this test yet.');
        return;
      }

      await api.updateLabTestRequest(request._id, { status: 'in_progress' });

      setSelectedRequest(request);
      setShowResultModal(true);
    } catch (error: any) {
      console.error('Error starting test:', error);
      alert('Error starting test: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSubmitResult = async () => {
    if (!selectedRequest || !resultData.trim()) {
      alert('Please enter test result data');
      return;
    }

    if (!profile?._id) {
      alert('User profile not found');
      return;
    }

    setLoading(true);

    try {
      // Create lab test result (backend will update request status to completed)
      await api.createLabTestResult({
        lab_test_request_id: selectedRequest._id,
        technician_id: profile._id,
        result_status: resultStatus,
        result_data: resultData,
        notes: notes || null,
      });

      // Get patient and doctor IDs for notifications
      const patientId = typeof selectedRequest.patient_id === 'string' 
        ? selectedRequest.patient_id 
        : selectedRequest.patient_id._id;

      const doctorId = typeof selectedRequest.doctor_id === 'string'
        ? selectedRequest.doctor_id
        : selectedRequest.doctor_id._id;

      const doctorUserId = typeof selectedRequest.doctor_id === 'object' && selectedRequest.doctor_id.user_id
        ? (typeof selectedRequest.doctor_id.user_id === 'string' 
            ? selectedRequest.doctor_id.user_id 
            : selectedRequest.doctor_id.user_id._id)
        : null;

      const testTemplate = typeof selectedRequest.lab_test_template_id === 'object'
        ? selectedRequest.lab_test_template_id
        : null;

      const patientName = typeof selectedRequest.patient_id === 'object'
        ? selectedRequest.patient_id.full_name
        : 'Unknown Patient';

      const testName = testTemplate?.name || 'Lab Test';

      // Create notifications
      try {
        await api.createNotification({
          user_id: patientId,
          title: 'Lab Test Results Ready',
          message: `Your ${testName} results are ready. Result: ${resultStatus}`,
          type: 'lab_test',
          reference_id: selectedRequest._id,
          is_read: false,
        });

        if (doctorUserId) {
          await api.createNotification({
            user_id: doctorUserId,
            title: 'Lab Test Results Available',
            message: `Lab results for ${patientName} (${testName}) are now available. Result: ${resultStatus}`,
            type: 'lab_test',
            reference_id: selectedRequest._id,
            is_read: false,
          });
        }
      } catch (error) {
        console.error('Error creating notifications:', error);
        // Don't fail the whole operation if notifications fail
      }

      setLoading(false);
      setShowResultModal(false);
      resetForm();
      fetchRequests();
    } catch (error: any) {
      console.error('Error submitting result:', error);
      alert('Error submitting result: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRequest(null);
    setResultStatus('negative');
    setResultData('');
    setNotes('');
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const inProgressRequests = requests.filter((r) => r.status === 'in_progress');
  const completedRequests = requests.filter((r) => r.status === 'completed');

  const resultOptions = [
    { value: 'negative', label: 'Negative' },
    { value: 'positive', label: 'Positive' },
    { value: 'inconclusive', label: 'Inconclusive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Technician Dashboard</h1>
          <p className="text-gray-600 mt-1">Process lab test requests and record results</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FlaskRound size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressRequests.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedRequests.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Pending Test Requests">
          {pendingRequests.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                if (!request) return null;
                
                const testTemplate = request.lab_test_template_id && typeof request.lab_test_template_id === 'object' 
                  ? request.lab_test_template_id 
                  : null;
                const patient = request.patient_id && typeof request.patient_id === 'object' 
                  ? request.patient_id 
                  : null;
                const doctor = request.doctor_id && typeof request.doctor_id === 'object' 
                  ? request.doctor_id 
                  : null;
                const doctorUser = doctor && doctor.user_id && typeof doctor.user_id === 'object'
                  ? doctor.user_id
                  : null;

                return (
                  <div key={request._id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{(testTemplate && testTemplate.name) || 'Unknown Test'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Patient: {(patient && patient.full_name) || 'Unknown Patient'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Requested by: Dr. {(doctorUser && doctorUser.full_name) || 'Unknown Doctor'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Unknown date'}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => handleStartTest(request)}>
                        Start Test
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="In Progress">
          {inProgressRequests.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No tests in progress</p>
          ) : (
            <div className="space-y-3">
              {inProgressRequests.map((request) => {
                if (!request) return null;
                
                const testTemplate = request.lab_test_template_id && typeof request.lab_test_template_id === 'object' 
                  ? request.lab_test_template_id 
                  : null;
                const patient = request.patient_id && typeof request.patient_id === 'object' 
                  ? request.patient_id 
                  : null;

                return (
                  <div key={request._id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-gray-900">{(testTemplate && testTemplate.name) || 'Unknown Test'}</p>
                    <p className="text-sm text-gray-600">Patient: {(patient && patient.full_name) || 'Unknown Patient'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Recently Completed">
          {completedRequests.slice(0, 5).length === 0 ? (
            <p className="text-center text-gray-600 py-8">No completed tests</p>
          ) : (
            <div className="space-y-3">
              {completedRequests.slice(0, 5).map((request) => {
                if (!request) return null;
                
                const testTemplate = request.lab_test_template_id && typeof request.lab_test_template_id === 'object' 
                  ? request.lab_test_template_id 
                  : null;
                const patient = request.patient_id && typeof request.patient_id === 'object' 
                  ? request.patient_id 
                  : null;

                return (
                  <div key={request._id} className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{(testTemplate && testTemplate.name) || 'Unknown Test'}</p>
                    <p className="text-xs text-gray-600">{(patient && patient.full_name) || 'Unknown Patient'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          resetForm();
        }}
        title="Record Test Result"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Test</p>
              <p className="font-medium text-gray-900">
                {selectedRequest.lab_test_template_id && typeof selectedRequest.lab_test_template_id === 'object' 
                  ? (selectedRequest.lab_test_template_id.name || 'Unknown Test')
                  : 'Unknown Test'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Patient: {selectedRequest.patient_id && typeof selectedRequest.patient_id === 'object' 
                  ? (selectedRequest.patient_id.full_name || 'Unknown Patient')
                  : 'Unknown Patient'}
              </p>
            </div>

            <Select
              label="Test Result Status"
              options={resultOptions}
              value={resultStatus}
              onChange={(e) => setResultStatus(e.target.value as any)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Result Data <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={5}
                placeholder="Enter detailed test results, measurements, observations, etc."
                value={resultData}
                onChange={(e) => setResultData(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
                placeholder="Any additional notes or observations"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowResultModal(false);
                  resetForm();
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitResult} disabled={loading} fullWidth>
                {loading ? 'Submitting...' : 'Submit Result'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
