import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PatientDashboard } from '../../pages/PatientDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the api
vi.mock('../../lib/api', () => ({
  api: {
    getAppointments: vi.fn(),
    getLabTestRequests: vi.fn(),
    getPrescriptions: vi.fn(),
    getInsurance: vi.fn(),
    getInsurances: vi.fn(),
    getPayments: vi.fn(),
    updateProfile: vi.fn(),
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

// Mock child components
vi.mock('../../components/patient/BookAppointmentModal', () => ({
  BookAppointmentModal: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div>BookAppointmentModal</div> : null,
}));

vi.mock('../../components/patient/PharmacySelectionModal', () => ({
  PharmacySelectionModal: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div>PharmacySelectionModal</div> : null,
}));

vi.mock('../../components/payment/PaymentModal', () => ({
  PaymentModal: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div>PaymentModal</div> : null,
}));

describe('PatientDashboard Component', () => {
  const mockProfile = {
    _id: 'patient1',
    full_name: 'Test Patient',
    email: 'patient@test.com',
    role: 'patient',
    insurance_id: null,
  };

  const mockAppointments = [
    {
      _id: 'appt1',
      appointment_date: '2024-12-31',
      appointment_time: '10:00',
      status: 'approved',
      reason: 'Checkup',
      doctor_id: { _id: 'doc1', user_id: { _id: 'user1', full_name: 'Dr. Test' } },
      hospital_id: { _id: 'hosp1', name: 'Test Hospital' },
      department_id: { _id: 'dept1', name: 'Cardiology' },
      consultation_fee: 5000,
      payments: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      profile: mockProfile,
    });
    (api.getAppointments as any).mockResolvedValue(mockAppointments);
    (api.getLabTestRequests as any).mockResolvedValue([]);
    (api.getPrescriptions as any).mockResolvedValue([]);
    (api.getInsurance as any).mockResolvedValue(null);
    (api.getInsurances as any).mockResolvedValue([]);
    (api.getPayments as any).mockResolvedValue([]);
  });

  it('should render patient dashboard when profile is available', async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Welcome, Test Patient/i)).toBeInTheDocument();
  });

  it('should display welcome message with patient name', async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Test Patient/i)).toBeInTheDocument();
    });
  });

  it('should fetch appointments on mount', async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(api.getAppointments).toHaveBeenCalled();
    });
  });

  it('should fetch lab tests on mount', async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(api.getLabTestRequests).toHaveBeenCalled();
    });
  });

  it('should fetch prescriptions on mount', async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(api.getPrescriptions).toHaveBeenCalled();
    });
  });

  it('should fetch insurance on mount if insurance_id exists', async () => {
    const profileWithInsurance = {
      ...mockProfile,
      insurance_id: 'ins1',
    };
    (useAuth as any).mockReturnValue({
      profile: profileWithInsurance,
    });
    (api.getInsurance as any).mockResolvedValue({
      _id: 'ins1',
      name: 'Test Insurance',
      coverage_percentage: 80,
    });

    render(<PatientDashboard />);

    await waitFor(() => {
      expect(api.getInsurance).toHaveBeenCalledWith('ins1');
    });
  });

  it('should not fetch insurance if insurance_id is null', async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(api.getInsurance).not.toHaveBeenCalled();
    });
  });

  it('should fetch available insurances on mount', async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(api.getInsurances).toHaveBeenCalled();
    });
  });

  it('should display booking button', async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Book Appointment/i)).toBeInTheDocument();
    });
  });

  it('should handle empty appointments list', async () => {
    (api.getAppointments as any).mockResolvedValue([]);

    render(<PatientDashboard />);

    await waitFor(() => {
      expect(api.getAppointments).toHaveBeenCalled();
    });
  });

  it('should handle empty prescriptions list', async () => {
    (api.getPrescriptions as any).mockResolvedValue([]);

    render(<PatientDashboard />);

    await waitFor(() => {
      expect(api.getPrescriptions).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    (api.getAppointments as any).mockRejectedValue(new Error('API Error'));

    render(<PatientDashboard />);

    await waitFor(() => {
      expect(api.getAppointments).toHaveBeenCalled();
    });
  });

  it('should display loading state initially', () => {
    render(<PatientDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});




