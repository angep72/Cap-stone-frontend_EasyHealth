import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ComposedChart,
  Bar,
  Line,
} from 'recharts';

interface NurseProfile {
  _id: string;
  id?: string;
  user_id: string | { _id: string };
  hospital_id: string | { _id: string };
  hospital?: { _id: string; name: string } | string;
}

interface Appointment {
  _id: string;
  id?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string;
  weight?: number | null;
  temperature?: number | null;
  patient_id: string | { _id: string; full_name: string; phone?: string };
  doctor_id: string | { _id: string; user_id?: string | { _id: string; full_name?: string } };
  hospital_id?: string | { _id: string };
  profiles: {
    full_name: string;
    phone: string;
  };
  doctors: {
    user_id: string | null;
    profiles: {
      full_name: string;
    };
  };
}

interface HighRiskDataPoint {
  date: string;
  highRisk: number;
  averageTemperature: number | null;
  temperatures: number[];
  highRiskTemperatures: number[];
}

export function NurseDashboard() {
  const { profile } = useAuth();
  const [nurseProfile, setNurseProfile] = useState<NurseProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNurseProfile();
  }, [profile?._id]);

  useEffect(() => {
    if (nurseProfile) {
      fetchAppointments();
    }
  }, [nurseProfile]);

  const {
    weeklyVisitData,
    highRiskWeeklyData,
    totalVisitsThisWeek,
    totalHighRiskPatients,
  } = useMemo(() => {
    const today = new Date();
    const dailyData: Array<{
      date: string;
      visits: number;
      averageTemperature: number | null;
      temperatures: number[];
      highRisk: number;
      highRiskTemperatures: number[];
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const current = new Date(today);
      current.setDate(today.getDate() - i);
      const dayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const visitsForDay = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return (
          ['approved', 'completed'].includes(apt.status) &&
          aptDate >= dayStart &&
          aptDate < dayEnd
        );
      });

      const recordedTemperatures = visitsForDay
        .map((apt) =>
          typeof apt.temperature === 'number'
            ? apt.temperature
            : parseFloat(String(apt.temperature ?? ''))
        )
        .filter((temp) => !Number.isNaN(temp));

      const averageTemperature = recordedTemperatures.length
        ? parseFloat(
            (
              recordedTemperatures.reduce((sum, temp) => sum + temp, 0) /
              recordedTemperatures.length
            ).toFixed(1)
          )
        : null;

      const highRiskTemperatures = recordedTemperatures.filter((temp) => temp >= 40);

      dailyData.push({
        date: label,
        visits: visitsForDay.length,
        averageTemperature,
        temperatures: recordedTemperatures,
        highRisk: highRiskTemperatures.length,
        highRiskTemperatures,
      });
    }

    const weeklyVisitData = dailyData.map(({ date, visits }) => ({ date, visits }));
    const highRiskWeeklyData: HighRiskDataPoint[] = dailyData.map(
      ({ date, highRisk, averageTemperature, temperatures, highRiskTemperatures }) => ({
        date,
        highRisk,
        averageTemperature,
        temperatures,
        highRiskTemperatures,
      })
    );

    const totalVisitsThisWeek = weeklyVisitData.reduce((sum, day) => sum + day.visits, 0);
    const totalHighRiskPatients = highRiskWeeklyData.reduce(
      (sum, day) => sum + day.highRisk,
      0
    );

    return {
      weeklyVisitData,
      highRiskWeeklyData,
      totalVisitsThisWeek,
      totalHighRiskPatients,
    };
  }, [appointments]);

  const fetchNurseProfile = async () => {
    if (!profile?._id) return;

    try {
      const nurses = (await api.getNurses()) as any[];
      const nurse = nurses.find((n) => {
        const userId = typeof n.user_id === 'object' ? n.user_id?._id : n.user_id;
        return userId === profile._id;
      });

      if (!nurse) {
        console.warn('No nurse profile found for user:', profile._id);
        setNurseProfile(null);
        return;
      }

      setNurseProfile(nurse as NurseProfile);
    } catch (error) {
      console.error('Error fetching nurse profile:', error);
      setNurseProfile(null);
    }
  };

  const fetchAppointments = async () => {
    if (!nurseProfile) return;

    try {
      const hospitalId =
        typeof nurseProfile.hospital_id === 'object'
          ? nurseProfile.hospital_id?._id
          : nurseProfile.hospital_id;

      if (!hospitalId) {
        setAppointments([]);
        return;
      }

      const appointmentsData = (await api.getAppointments()) as any[];
      const filteredAppointments = appointmentsData
        .filter((apt) => {
          const aptHospitalId =
            typeof apt.hospital_id === 'object' ? apt.hospital_id?._id : apt.hospital_id;
          return (
            aptHospitalId === hospitalId &&
            ['booked', 'pending', 'approved', 'completed'].includes(apt.status)
          );
        })
        .sort((a, b) => {
          const dateCompare = (a.appointment_date || '').localeCompare(b.appointment_date || '');
          if (dateCompare !== 0) return dateCompare;
          return (a.appointment_time || '').localeCompare(b.appointment_time || '');
        });

      const processedAppointments = filteredAppointments.map((apt) => {
        const patient = typeof apt.patient_id === 'object' ? apt.patient_id : null;
        const doctor = typeof apt.doctor_id === 'object' ? apt.doctor_id : null;
        const doctorUser = doctor && typeof doctor.user_id === 'object' ? doctor.user_id : null;

        return {
          ...apt,
          _id: apt._id || apt.id,
          id: apt._id || apt.id,
          weight: apt.weight ?? null,
          temperature: apt.temperature ?? null,
          profiles: {
            full_name: patient?.full_name || 'Unknown Patient',
            phone: patient?.phone || '',
          },
          doctors: {
            user_id:
              doctorUser && typeof doctorUser !== 'string'
                ? doctorUser._id
                : typeof doctor?.user_id === 'string'
                ? doctor.user_id
                : null,
            profiles: {
              full_name:
                (doctorUser && typeof doctorUser !== 'string' && doctorUser.full_name) ||
                (doctor && (doctor as any).full_name) ||
                'Unknown Doctor',
            },
          },
        } as Appointment;
      });

      setAppointments(processedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    }
  };

  const handleApprove = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowVitalsModal(true);
  };

  const handleReject = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRejectModal(true);
  };

  const submitVitals = async () => {
    if (!selectedAppointment || !weight || !temperature) {
      alert('Please enter both weight and temperature');
      return;
    }

    const weightNum = parseFloat(weight);
    const tempNum = parseFloat(temperature);

    if (weightNum <= 0 || weightNum > 500) {
      alert('Please enter a valid weight (1-500 kg)');
      return;
    }

    if (tempNum < 30 || tempNum > 45) {
      alert('Please enter a valid temperature (30-45°C)');
      return;
    }

    setLoading(true);

    try {
      const appointmentId = selectedAppointment._id || selectedAppointment.id || '';
      const patientId =
        typeof selectedAppointment.patient_id === 'object'
          ? selectedAppointment.patient_id?._id
          : selectedAppointment.patient_id;

      await api.updateAppointment(appointmentId, {
        status: 'approved',
        weight: weightNum,
        temperature: tempNum,
        vitals_recorded_by: nurseProfile?._id || nurseProfile?.id,
        vitals_recorded_at: new Date().toISOString(),
      });

      if (patientId) {
        await api.createNotification({
          user_id: patientId,
          title: 'Appointment Approved',
          message: 'Your appointment has been approved. Please proceed with payment.',
          type: 'appointment',
          reference_id: appointmentId,
          is_read: false,
        });
      }

      setShowVitalsModal(false);
      setSelectedAppointment(null);
      setWeight('');
      setTemperature('');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Error updating appointment');
    } finally {
      setLoading(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedAppointment || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);

    try {
      const appointmentId = selectedAppointment._id || selectedAppointment.id || '';
      const patientId =
        typeof selectedAppointment.patient_id === 'object'
          ? selectedAppointment.patient_id?._id
          : selectedAppointment.patient_id;

      await api.updateAppointment(appointmentId, {
        status: 'rejected',
        rejection_reason: rejectionReason,
      });

      if (patientId) {
        await api.createNotification({
          user_id: patientId,
          title: 'Appointment Rejected',
          message: `Your appointment has been rejected. Reason: ${rejectionReason}`,
          type: 'appointment',
          reference_id: appointmentId,
          is_read: false,
        });
      }

      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Error rejecting appointment');
    } finally {
      setLoading(false);
    }
  };

  const pendingAppointments = appointments.filter((a) => ['booked', 'pending'].includes(a.status));
  const approvedAppointments = appointments.filter((a) => a.status === 'approved');
  const doctorVisitAppointments = appointments.filter((a) => ['approved', 'completed'].includes(a.status));
  const completedAppointments = appointments.filter((a) => a.status === 'completed');
  const highRiskPatients = appointments
    .filter((apt) => {
      const temp =
        typeof apt.temperature === 'number'
          ? apt.temperature
          : apt.temperature != null
            ? parseFloat(String(apt.temperature))
            : NaN;
      return !Number.isNaN(temp) && temp >= 40;
    })
    .map((apt) => ({
      id: apt._id,
      name: apt.profiles.full_name,
      temperature: apt.temperature,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      status: apt.status,
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'booked':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderHighRiskTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const dataPoint = payload[0].payload as HighRiskDataPoint;
    const temperatures = dataPoint.temperatures || [];
    const averageTemperature = dataPoint.averageTemperature;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">{label}</p>
        <p>High-Risk Patients: {dataPoint.highRisk}</p>
        <p>Average Temperature: {averageTemperature ? `${averageTemperature.toFixed(1)}°C` : 'N/A'}</p>
        {temperatures.length > 0 ? (
          <div className="mt-2">
            <p className="font-medium text-gray-800">Recorded Temperatures</p>
            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
              {temperatures.map((temp, idx) => (
                <li key={idx}>
                  {temp.toFixed(1)}°C{' '}
                  {temp >= 40 && <span className="text-red-600 font-semibold">(High Risk)</span>}
                </li>
              ))}
            </ul>
            {dataPoint.highRiskTemperatures.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">No high-risk temperatures recorded.</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">No temperature recorded.</p>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nurse Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage appointments and record patient vitals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingAppointments.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">With Doctor</p>
                <p className="text-2xl font-bold text-gray-900">{doctorVisitAppointments.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Met Doctor</p>
                <p className="text-2xl font-bold text-gray-900">{completedAppointments.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Patient Visits (Last 7 Days)">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Visits This Week</p>
                <p className="text-2xl font-bold text-gray-900">{totalVisitsThisWeek}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyVisitData}>
                <defs>
                  <linearGradient id="nurseVisitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#nurseVisitsGradient)"
                  name="Visits"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card title="High-Risk Temperature Alerts">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">High-Risk Patients (Temp ≥ 40°C)</p>
                <p className="text-2xl font-bold text-gray-900">{totalHighRiskPatients}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={highRiskWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="count" allowDecimals={false} />
                <YAxis
                  yAxisId="temp"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}°`}
                  domain={[35, 'auto']}
                />
                <Tooltip content={renderHighRiskTooltip} />
                <Bar
                  yAxisId="count"
                  dataKey="highRisk"
                  fill="#ef4444"
                  name="High-Risk Count"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="averageTemperature"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                  name="Avg Temperature"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title="Pending Appointments - Require Review">
          {pendingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No pending appointments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{apt.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">{apt.profiles.phone}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Doctor:</strong> Dr. {apt.doctors.profiles.full_name}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Reason:</strong> {apt.reason}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => handleApprove(apt)}>
                      <Activity size={16} className="mr-1" />
                      Record Vitals & Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(apt)}>
                      <XCircle size={16} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Doctor Visits & Consultations">
          {doctorVisitAppointments.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No patients currently with the doctor</p>
          ) : (
            <div className="space-y-3">
              {doctorVisitAppointments.map((apt) => {
                const containerColors = apt.status === 'completed'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-green-50 border-green-200';
                const statusLabel = apt.status === 'completed' ? 'Met Doctor' : 'Awaiting Doctor';

                return (
                  <div
                    key={apt._id}
                    className={`p-4 rounded-lg border ${containerColors}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{apt.profiles.full_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>Doctor:</strong> Dr. {apt.doctors.profiles.full_name}
                        </p>
                        {apt.status === 'completed' && (
                          <p className="text-sm text-emerald-700 mt-2 font-medium">
                            Patient completed consultation with doctor.
                          </p>
                        )}
                        {apt.weight && apt.temperature && (
                          <div className="mt-2 flex gap-4">
                            <span className="text-sm text-gray-700">
                              <strong>Weight:</strong> {apt.weight} kg
                            </span>
                            <span className="text-sm text-gray-700">
                              <strong>Temperature:</strong> {apt.temperature}°C
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {statusLabel}
                        </span>
                        {apt.status === 'approved' && (
                          <span className="text-xs text-gray-600">Waiting for doctor or payment clearance</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="High-Risk Patients (Temp ≥ 40°C)">
          {highRiskPatients.length === 0 ? (
            <p className="text-center text-gray-600 py-6">No patients flagged as high risk.</p>
          ) : (
            <div className="space-y-3">
              {highRiskPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 border border-red-200 rounded-lg bg-red-50 flex justify-between items-start"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(patient.appointmentDate).toLocaleDateString()} at {patient.appointmentTime}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Status: {patient.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      {typeof patient.temperature === 'number'
                        ? patient.temperature.toFixed(1)
                        : patient.temperature}{' '}
                      °C
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showVitalsModal}
        onClose={() => {
          setShowVitalsModal(false);
          setWeight('');
          setTemperature('');
          setSelectedAppointment(null);
        }}
        title="Record Patient Vitals"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-medium text-gray-900">{selectedAppointment.profiles.full_name}</p>
              <p className="text-sm text-gray-600 mt-2">
                {new Date(selectedAppointment.appointment_date).toLocaleDateString()} at{' '}
                {selectedAppointment.appointment_time}
              </p>
            </div>

            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              min="1"
              max="500"
              placeholder="e.g., 70.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />

            <Input
              label="Temperature (°C)"
              type="number"
              step="0.1"
              min="30"
              max="45"
              placeholder="e.g., 37.5"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              required
            />

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowVitalsModal(false);
                  setWeight('');
                  setTemperature('');
                  setSelectedAppointment(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button onClick={submitVitals} disabled={loading} fullWidth>
                {loading ? 'Saving...' : 'Approve Appointment'}
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
          setSelectedAppointment(null);
        }}
        title="Reject Appointment"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Please provide a reason for rejecting this appointment:</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
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
                setSelectedAppointment(null);
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button onClick={submitRejection} variant="danger" disabled={loading} fullWidth>
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
