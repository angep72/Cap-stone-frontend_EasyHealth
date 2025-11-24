import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Users, CheckCircle, FileText } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { ConsultationModal } from '../components/doctor/ConsultationModal';
import { PrescriptionBuilder } from '../components/doctor/PrescriptionBuilder';
import { Loader } from '../components/ui/Loader';

interface DoctorProfile {
  _id: string;
  id?: string;
  user_id: string | { _id: string };
  consultation_fee?: number;
  hospital_id?: string | { _id: string; name?: string };
  department_id?: string | { _id: string; name?: string };
}

interface Appointment {
  _id: string;
  id?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string;
  patient_id: string | { _id: string; full_name: string; phone?: string; national_id?: string };
  doctor_id: string | { _id: string };
  hospital_id?: string | { _id: string; name?: string };
  department_id?: string | { _id: string; name?: string };
  profiles: {
    full_name: string;
    phone: string;
    national_id: string;
  };
  hospitals: {
    name: string;
  };
  departments: {
    name: string;
  };
}

interface LabTestResult {
  _id: string;
  id?: string;
  result_status: string;
  result_data: string;
  notes?: string;
  created_at: string;
  lab_test_requests: {
    id: string;
    status: string;
    profiles: {
      full_name: string;
    };
    lab_test_templates: {
      name: string;
    };
    consultations: {
      id: string;
      diagnosis: string;
      patient_id: string;
    };
  };
  profiles: {
    full_name: string;
  };
}

interface Prescription {
  _id: string;
  status: string;
  doctor_id: string | { _id: string };
  consultation_id?: string | { _id: string };
  createdAt?: string;
  created_at?: string;
}

interface LabTestRequest {
  _id: string;
  doctor_id?: string | { _id: string };
  consultation_id?: string | { _id: string; doctor_id?: string | { _id: string } };
  createdAt?: string;
  created_at?: string;
}

interface ConsultationCharts {
  dailyConsultations: Array<{
    date: string;
    consultations: number;
    prescriptions: number;
    labTests: number;
  }>;
  weeklyConsultations: Array<{
    week: string;
    consultations: number;
    prescriptions: number;
    labTests: number;
  }>;
}

export function DoctorDashboard() {
  const { profile } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labTestRequests, setLabTestRequests] = useState<LabTestRequest[]>([]);
  const [stats, setStats] = useState({
    approved: 0,
    completed: 0,
    totalEarnings: 0,
  });
  const [chartData, setChartData] = useState<ConsultationCharts>({
    dailyConsultations: [],
    weeklyConsultations: [],
  });

  const weeklyAverages = useMemo(() => {
    if (!chartData.weeklyConsultations.length) return null;

    const totalConsultations = chartData.weeklyConsultations.reduce((sum, week) => sum + week.consultations, 0);
    const totalPrescriptions = chartData.weeklyConsultations.reduce((sum, week) => sum + week.prescriptions, 0);
    const totalLabTests = chartData.weeklyConsultations.reduce((sum, week) => sum + week.labTests, 0);
    const weeksCount = chartData.weeklyConsultations.length;

    return {
      consultations: totalConsultations / weeksCount,
      prescriptions: totalPrescriptions / weeksCount,
      labTests: totalLabTests / weeksCount,
    };
  }, [chartData.weeklyConsultations]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showConsultation, setShowConsultation] = useState(false);
  const [labResults, setLabResults] = useState<LabTestResult[]>([]);
  const [selectedLabResult, setSelectedLabResult] = useState<LabTestResult | null>(null);
  const [showLabResultModal, setShowLabResultModal] = useState(false);
  const [showPrescriptionBuilder, setShowPrescriptionBuilder] = useState(false);
  const [loading, setLoading] = useState(true);

  const prescribedConsultationIds = useMemo(() => {
    const ids = new Set<string>();
    prescriptions.forEach((pres) => {
      const consultationId =
        typeof pres.consultation_id === 'object'
          ? pres.consultation_id?._id
          : pres.consultation_id;
      if (consultationId) {
        ids.add(consultationId);
      }
    });
    return ids;
  }, [prescriptions]);

  useEffect(() => {
    fetchDoctorProfile();
  }, [profile?._id]);

  useEffect(() => {
    if (doctorProfile) {
      fetchAppointments();
      fetchLabResults();
      fetchDoctorPrescriptions();
      fetchDoctorLabRequests();
    }
  }, [doctorProfile]);

  useEffect(() => {
    if (doctorProfile) {
      buildChartData(appointments, prescriptions, labTestRequests);
    }
  }, [appointments, prescriptions, labTestRequests, doctorProfile]);

  const fetchDoctorProfile = async () => {
    if (!profile?._id) return;

    try {
      const doctors = (await api.getDoctors()) as any[];
      const doctor = doctors.find((d: any) => {
        const userId = typeof d.user_id === 'object' ? d.user_id?._id : d.user_id;
        return userId === profile._id;
      });

      if (doctor) {
        setDoctorProfile(doctor as DoctorProfile);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchAppointments = async () => {
    if (!doctorProfile) return;

    setLoading(true);
    try {
      const doctorId = doctorProfile._id || doctorProfile.id;
      const appointmentsData = (await api.getAppointments()) as any[];
      const doctorAppointments = appointmentsData
        .filter((apt: any) => {
          const aptDoctorId = typeof apt.doctor_id === 'object' ? apt.doctor_id?._id : apt.doctor_id;
          return doctorId && aptDoctorId === doctorId;
        })
        .sort((a: any, b: any) => {
          const dateCompare = (a.appointment_date || '').localeCompare(b.appointment_date || '');
          if (dateCompare !== 0) return dateCompare;
          return (a.appointment_time || '').localeCompare(b.appointment_time || '');
        });

      const processedAppointments = doctorAppointments.map((apt: any) => {
        const patient = typeof apt.patient_id === 'object' ? apt.patient_id : null;
        const hospital = typeof apt.hospital_id === 'object' ? apt.hospital_id : null;
        const department = typeof apt.department_id === 'object' ? apt.department_id : null;

        return {
          ...apt,
          _id: apt._id || apt.id,
          id: apt._id || apt.id,
          profiles: {
            full_name: patient?.full_name || 'Unknown Patient',
            phone: patient?.phone || '',
            national_id: patient?.national_id || '',
          },
          hospitals: {
            name: hospital?.name || 'Unknown Hospital',
          },
          departments: {
            name: department?.name || 'Unknown Department',
          },
        } as Appointment;
      });

      setAppointments(processedAppointments);
      calculateStats(processedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointments: Appointment[]) => {
    const approved = appointments.filter((a) => a.status === 'approved').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;

    setStats({
      approved,
      completed,
      totalEarnings: completed * (doctorProfile?.consultation_fee || 0),
    });
  };

  const fetchDoctorPrescriptions = async () => {
    if (!doctorProfile) return;

    try {
      const doctorId = doctorProfile._id || doctorProfile.id;
      if (!doctorId) return;

      const data = (await api.getPrescriptions()) as any[];
      const doctorPrescriptions = data.filter((pres: any) => {
        const docId = typeof pres.doctor_id === 'object' ? pres.doctor_id?._id : pres.doctor_id;
        return docId === doctorId;
      });

      setPrescriptions(doctorPrescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    }
  };

  const fetchDoctorLabRequests = async () => {
    if (!doctorProfile) return;

    try {
      const doctorId = doctorProfile._id || doctorProfile.id;
      if (!doctorId) return;

      const data = (await api.getLabTestRequests()) as any[];
      const doctorRequests = data.filter((req: any) => {
        const reqDoctorId = typeof req.doctor_id === 'object' ? req.doctor_id?._id : req.doctor_id;
        if (reqDoctorId) {
          return reqDoctorId === doctorId;
        }

        const consultation = typeof req.consultation_id === 'object' ? req.consultation_id : null;
        const consultationDoctorId = consultation
          ? typeof consultation.doctor_id === 'object'
            ? consultation.doctor_id?._id
            : consultation.doctor_id
          : null;

        return consultationDoctorId === doctorId;
      });

      setLabTestRequests(doctorRequests);
    } catch (error) {
      console.error('Error fetching lab test requests:', error);
      setLabTestRequests([]);
    }
  };

  const buildChartData = (
    appointmentsData: Appointment[],
    prescriptionsData: Prescription[],
    labRequestData: LabTestRequest[]
  ) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(startOfToday);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const recentAppointments = appointmentsData.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return (
        aptDate >= thirtyDaysAgo &&
        aptDate <= now &&
        ['approved', 'completed'].includes(apt.status)
      );
    });

    const recentPrescriptions = prescriptionsData.filter((pres) => {
      const created = pres.createdAt || pres.created_at;
      if (!created) return false;
      const presDate = new Date(created);
      return presDate >= thirtyDaysAgo && presDate <= now;
    });

    const recentLabRequests = labRequestData.filter((req) => {
      const created = req.createdAt || req.created_at;
      if (!created) return false;
      const reqDate = new Date(created);
      return reqDate >= thirtyDaysAgo && reqDate <= now;
    });

    const dailyCounts: Record<string, { consultations: number; prescriptions: number; labTests: number }> = {};
    for (let i = 0; i < 30; i++) {
      const day = new Date(startOfToday);
      day.setDate(day.getDate() - (29 - i));
      const key = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyCounts[key] = { consultations: 0, prescriptions: 0, labTests: 0 };
    }

    recentAppointments.forEach((apt) => {
      const date = new Date(apt.appointment_date);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyCounts[key]) {
        dailyCounts[key].consultations += 1;
      }
    });

    recentPrescriptions.forEach((pres) => {
      const date = new Date(pres.createdAt || pres.created_at || '');
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyCounts[key]) {
        dailyCounts[key].prescriptions += 1;
      }
    });

    recentLabRequests.forEach((req) => {
      const date = new Date(req.createdAt || req.created_at || '');
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyCounts[key]) {
        dailyCounts[key].labTests += 1;
      }
    });

    const dailyConsultations = Object.entries(dailyCounts).map(([date, values]) => ({
      date,
      consultations: values.consultations,
      prescriptions: values.prescriptions,
      labTests: values.labTests,
    }));

    const weeklyCounts: Array<{
      week: string;
      consultations: number;
      prescriptions: number;
      labTests: number;
    }> = [];

    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(startOfToday);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);

      const consultationCount = recentAppointments.filter((apt) => {
        const date = new Date(apt.appointment_date);
        return date >= weekStart && date <= weekEnd;
      }).length;

      const prescriptionCount = recentPrescriptions.filter((pres) => {
        const date = new Date(pres.createdAt || pres.created_at || '');
        return date >= weekStart && date <= weekEnd;
      }).length;

      const labTestCount = recentLabRequests.filter((req) => {
        const date = new Date(req.createdAt || req.created_at || '');
        return date >= weekStart && date <= weekEnd;
      }).length;

      weeklyCounts.push({
        week: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        consultations: consultationCount,
        prescriptions: prescriptionCount,
        labTests: labTestCount,
      });
    }

    setChartData({ dailyConsultations, weeklyConsultations: weeklyCounts });
  };


  const fetchLabResults = async () => {
    if (!doctorProfile) return;

    try {
      const doctorId = doctorProfile._id || doctorProfile.id;
      if (!doctorId) return;

      const consultations = (await api.getConsultations()) as any[];
      const doctorConsultations = consultations.filter((c: any) => {
        const docId = typeof c.doctor_id === 'object' ? c.doctor_id?._id : c.doctor_id;
        return docId === doctorId;
      });
      const consultationIds = doctorConsultations.map((c: any) => c._id || c.id);

      const labResultsData = (await api.getLabTestResults()) as any[];
      const doctorLabResults = labResultsData.filter((result: any) => {
        const request = typeof result.lab_test_request_id === 'object' ? result.lab_test_request_id : null;
        if (!request) return false;
        const consultation = typeof request.consultation_id === 'object' ? request.consultation_id : null;
        const consultationId = consultation
          ? consultation._id || consultation.id
          : typeof request.consultation_id === 'string'
            ? request.consultation_id
            : null;
        return consultationId && consultationIds.includes(consultationId);
      });

      const processedResults = doctorLabResults
        .map((result: any) => {
          const request = typeof result.lab_test_request_id === 'object' ? result.lab_test_request_id : null;
          const technician = typeof result.technician_id === 'object' ? result.technician_id : null;
          const patient = request && typeof request.patient_id === 'object' ? request.patient_id : null;
          const template = request && typeof request.lab_test_template_id === 'object' ? request.lab_test_template_id : null;
          const consultation = request && typeof request.consultation_id === 'object' ? request.consultation_id : null;

          return {
            _id: result._id || result.id,
            id: result._id || result.id,
            result_status: result.result_status,
            result_data: result.result_data,
            notes: result.notes || '',
            created_at: result.createdAt || result.created_at || new Date().toISOString(),
            lab_test_requests: {
              id: request?._id || request?.id || '',
              status: request?.status || '',
              profiles: {
                full_name: patient?.full_name || 'Unknown Patient',
              },
              lab_test_templates: {
                name: template?.name || 'Unknown Test',
              },
              consultations: {
                id: consultation?._id || consultation?.id || '',
                diagnosis: consultation?.diagnosis || 'N/A',
                patient_id: consultation?.patient_id || '',
              },
            },
            profiles: {
              full_name: technician?.full_name || 'Unknown Technician',
            },
          } as LabTestResult;
        })
        .sort((a: LabTestResult, b: LabTestResult) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      setLabResults(processedResults);
    } catch (error) {
      console.error('Error fetching lab results:', error);
      setLabResults([]);
    }
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    try {
      const appointmentId = appointment._id || appointment.id || '';
      const payment = (await api
        .getPaymentByReference('consultation', appointmentId)
        .catch(() => null)) as any;

      if (!payment || payment?.status !== 'completed') {
        alert('Patient has not paid the consultation fee yet.');
        return;
      }

      setSelectedAppointment(appointment);
      setShowConsultation(true);
    } catch (error) {
      console.error('Error checking payment:', error);
      alert('Error checking payment status. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage appointments and consultations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </Card>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Daily Trends (Last 30 Days)">
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={300} minHeight={250}>
                <LineChart data={chartData.dailyConsultations} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    interval="preserveStartEnd"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="consultations"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="Consultations"
                  />
                  <Line
                    type="monotone"
                    dataKey="prescriptions"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    name="Prescriptions"
                  />
                  <Line
                    type="monotone"
                    dataKey="labTests"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Lab Tests"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Weekly Summary (Last 8 Weeks)">
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={300} minHeight={250}>
                <BarChart data={chartData.weeklyConsultations} margin={{ top: 5, right: 10, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 9 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="consultations" fill="#2563eb" name="Consultations" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="prescriptions" fill="#a855f7" name="Prescriptions" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="labTests" fill="#10b981" name="Lab Tests" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {weeklyAverages && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs text-blue-600 uppercase tracking-wide">Avg. Consultations</p>
                  <p className="text-lg font-semibold text-blue-800">{weeklyAverages.consultations.toFixed(1)}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <p className="text-xs text-purple-600 uppercase tracking-wide">Avg. Prescriptions</p>
                  <p className="text-lg font-semibold text-purple-800">{weeklyAverages.prescriptions.toFixed(1)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 uppercase tracking-wide">Avg. Lab Tests</p>
                  <p className="text-lg font-semibold text-emerald-800">{weeklyAverages.labTests.toFixed(1)}</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card title="Approved Appointments - Ready for Consultation">
          {loading ? (
            <Loader label="Loading appointments..." fullHeight />
          ) : appointments.filter((a) => a.status === 'approved').length === 0 ? (
            <p className="text-center text-gray-600 py-8">No approved appointments</p>
          ) : (
            <div className="space-y-4">
              {appointments
                .filter((a) => a.status === 'approved')
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{apt.profiles.full_name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Reason:</strong> {apt.reason}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleStartConsultation(apt)}>
                      Start Consultation
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card title="Lab Test Results">
          {labResults.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No lab test results available</p>
          ) : (
            <div className="space-y-3">
              {labResults.map((result) => {
                const consultationId = result.lab_test_requests.consultations.id;
                const isPrescribed = prescribedConsultationIds.has(consultationId);

                return (
                  <div
                    key={result.id}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {result.lab_test_requests.lab_test_templates.name}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              result.result_status === 'positive'
                                ? 'bg-red-100 text-red-700'
                                : result.result_status === 'negative'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {result.result_status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Patient: {result.lab_test_requests.profiles.full_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Diagnosis: {result.lab_test_requests.consultations.diagnosis}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Completed: {new Date(result.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Technician: {result.profiles.full_name}
                        </p>
                      </div>
                      {isPrescribed ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                          Prescribed
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedLabResult(result);
                            setShowLabResultModal(true);
                          }}
                        >
                          <FileText size={14} className="mr-1" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {selectedAppointment && (
        <ConsultationModal
          isOpen={showConsultation}
          onClose={() => {
            setShowConsultation(false);
            setSelectedAppointment(null);
            fetchAppointments();
          }}
          appointment={selectedAppointment}
          doctorId={doctorProfile?._id || doctorProfile?.id || ''}
        />
      )}

      {selectedLabResult && (
        <Modal
          isOpen={showLabResultModal}
          onClose={() => {
            setShowLabResultModal(false);
            setSelectedLabResult(null);
          }}
          title="Lab Test Result Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Test Name</p>
              <p className="font-medium text-gray-900">
                {selectedLabResult.lab_test_requests.lab_test_templates.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-medium text-gray-900">
                  {selectedLabResult.lab_test_requests.profiles.full_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Result Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedLabResult.result_status === 'positive'
                      ? 'bg-red-100 text-red-700'
                      : selectedLabResult.result_status === 'negative'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {selectedLabResult.result_status.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Original Diagnosis</p>
              <p className="text-gray-900">
                {selectedLabResult.lab_test_requests.consultations.diagnosis}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Test Result Data</p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedLabResult.result_data}
                </p>
              </div>
            </div>

            {selectedLabResult.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Technician Notes</p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedLabResult.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Completed At</p>
                <p className="text-gray-900">
                  {new Date(selectedLabResult.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Lab Technician</p>
                <p className="text-gray-900">{selectedLabResult.profiles.full_name}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Based on these results, you can now write a prescription for the patient.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowLabResultModal(false);
                    setSelectedLabResult(null);
                  }}
                  fullWidth
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowLabResultModal(false);
                    setShowPrescriptionBuilder(true);
                  }}
                  fullWidth
                >
                  <FileText size={16} className="mr-2" />
                  Write Prescription
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {selectedLabResult && showPrescriptionBuilder && (
        <PrescriptionBuilder
          isOpen={showPrescriptionBuilder}
          onClose={() => {
            setShowPrescriptionBuilder(false);
            setSelectedLabResult(null);
          }}
          consultationId={selectedLabResult.lab_test_requests.consultations.id}
          patientId={selectedLabResult.lab_test_requests.consultations.patient_id}
          doctorId={doctorProfile?._id || doctorProfile?.id || ''}
          onComplete={() => {
            setShowPrescriptionBuilder(false);
            setSelectedLabResult(null);
            fetchLabResults();
            fetchDoctorPrescriptions();
          }}
        />
      )}
    </DashboardLayout>
  );
}
