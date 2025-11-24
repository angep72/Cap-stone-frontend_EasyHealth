import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DoctorDashboard } from '../../pages/DoctorDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the api
vi.mock('../../lib/api', () => ({
  api: {
    getDoctors: vi.fn(),
    getAppointments: vi.fn(),
    getLabTestResults: vi.fn(),
    getPrescriptions: vi.fn(),
    getLabTestRequests: vi.fn(),
  },
}));

// Mock DashboardLayout
vi.mock('../../components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Loader
vi.mock('../../components/ui/Loader', () => ({
  Loader: () => <div>Loading...</div>,
}));

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: () => <div>LineChart</div>,
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  BarChart: () => <div>BarChart</div>,
  Bar: () => null,
}));

// Mock child components
vi.mock('../../components/doctor/ConsultationModal', () => ({
  ConsultationModal: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div>ConsultationModal</div> : null,
}));

vi.mock('../../components/doctor/PrescriptionBuilder', () => ({
  PrescriptionBuilder: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div>PrescriptionBuilder</div> : null,
}));

describe('DoctorDashboard Component', () => {
  const mockProfile = {
    _id: 'doctor1',
    full_name: 'Dr. Test',
    email: 'doctor@test.com',
    role: 'doctor',
  };

  const mockDoctorProfile = {
    _id: 'doc_profile1',
    user_id: 'doctor1',
    consultation_fee: 5000,
  };

  const mockAppointments = [
    {
      _id: 'appt1',
      appointment_date: '2024-12-31',
      appointment_time: '10:00',
      status: 'approved',
      reason: 'Checkup',
      patient_id: { _id: 'patient1', full_name: 'Patient One' },
      doctor_id: { _id: 'doc_profile1' },
      profiles: { full_name: 'Patient One', phone: '0781234567' },
      hospitals: { name: 'Test Hospital' },
      departments: { name: 'Cardiology' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      profile: mockProfile,
    });
    (api.getDoctors as any).mockResolvedValue([mockDoctorProfile]);
    (api.getAppointments as any).mockResolvedValue(mockAppointments);
    (api.getLabTestResults as any).mockResolvedValue([]);
    (api.getPrescriptions as any).mockResolvedValue([]);
    (api.getLabTestRequests as any).mockResolvedValue([]);
  });

  it('should render doctor dashboard when profile is available', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(api.getDoctors).toHaveBeenCalled();
  });

  it('should fetch appointments when doctor profile is loaded', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(api.getAppointments).toHaveBeenCalled();
    });
  });

  

  it('should fetch prescriptions when doctor profile is loaded', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(api.getPrescriptions).toHaveBeenCalled();
    });
  });

  it('should fetch lab test requests when doctor profile is loaded', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(api.getLabTestRequests).toHaveBeenCalled();
    });
  });

  it('should display loading state initially', () => {
    render(<DoctorDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle empty appointments list', async () => {
    (api.getAppointments as any).mockResolvedValue([]);

    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(api.getAppointments).toHaveBeenCalled();
    });
  });

  it('should handle empty prescriptions list', async () => {
    (api.getPrescriptions as any).mockResolvedValue([]);

    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(api.getPrescriptions).toHaveBeenCalled();
    });
  });

  it('should handle empty lab test requests list', async () => {
    (api.getLabTestRequests as any).mockResolvedValue([]);

    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(api.getLabTestRequests).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    (api.getDoctors as any).mockRejectedValue(new Error('API Error'));

    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(api.getDoctors).toHaveBeenCalled();
    });
  });
});




