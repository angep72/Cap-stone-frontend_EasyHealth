import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { CheckCircle, XCircle, Stethoscope, Calendar } from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string;
  profiles: {
    full_name: string;
    phone: string;
  };
}

interface AppointmentManagementProps {
  appointments: Appointment[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onStartConsultation: (appointment: Appointment) => void;
  loading: boolean;
}

export function AppointmentManagement({
  appointments,
  onApprove,
  onReject,
  onStartConsultation,
  loading,
}: AppointmentManagementProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onReject(selectedAppointmentId, rejectionReason);
    setShowRejectModal(false);
    setRejectionReason('');
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

  const pendingAppointments = appointments.filter((a) => a.status === 'pending');
  const approvedAppointments = appointments.filter((a) => a.status === 'approved');
  const completedAppointments = appointments.filter((a) => a.status === 'completed');

  return (
    <>
      <div className="space-y-6">
        <Card title="Pending Appointments">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading appointments...</div>
          ) : pendingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No pending appointments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{apt.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">{apt.profiles.phone}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Reason:</strong> {apt.reason}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => onApprove(apt.id)}>
                      <CheckCircle size={16} className="mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setSelectedAppointmentId(apt.id);
                        setShowRejectModal(true);
                      }}
                    >
                      <XCircle size={16} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Approved Appointments - Ready for Consultation">
          {approvedAppointments.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No approved appointments</p>
          ) : (
            <div className="space-y-4">
              {approvedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{apt.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onStartConsultation(apt)}
                  >
                    <Stethoscope size={16} className="mr-1" />
                    Start Consultation
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent Completed Consultations">
          {completedAppointments.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No completed consultations</p>
          ) : (
            <div className="space-y-3">
              {completedAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{apt.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(apt.appointment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
        title="Reject Appointment"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Please provide a reason for rejecting this appointment:</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
              placeholder="Enter reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button onClick={handleReject} variant="danger" fullWidth>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
