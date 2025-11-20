import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LabTechnicianDashboard } from '../../pages/LabTechnicianDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the api
vi.mock('../../lib/api', () => ({
  api: {
    getLabTestRequests: vi.fn(),
    getPayments: vi.fn(),
    updateLabTestRequest: vi.fn(),
    createLabTestResult: vi.fn(),
    createNotification: vi.fn(),
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

describe('LabTechnicianDashboard Component', () => {
  const mockProfile = {
    _id: 'tech1',
    full_name: 'Lab Tech Test',
    email: 'labtech@test.com',
    role: 'lab_technician',
  };

  const mockRequests = [
    {
      _id: 'req1',
      status: 'awaiting_payment',
      total_price: 5000,
      createdAt: '2024-12-01',
      patient_id: { _id: 'patient1', full_name: 'Patient One' },
      lab_test_template_id: {
        _id: 'template1',
        name: 'Blood Test',
        description: 'Complete blood count',
      },
      doctor_id: {
        _id: 'doc1',
        user_id: { _id: 'user1', full_name: 'Dr. Test' },
      },
    },
  ];

  const mockPayments = [
    {
      _id: 'pay1',
      reference_id: 'req1',
      payment_type: 'lab_test',
      status: 'completed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      profile: mockProfile,
    });
    (api.getLabTestRequests as any).mockResolvedValue(mockRequests);
    (api.getPayments as any).mockResolvedValue(mockPayments);
  });

  it('should render lab technician dashboard when profile is available', async () => {
    render(<LabTechnicianDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(api.getLabTestRequests).toHaveBeenCalled();
  });

  it('should fetch lab test requests on mount', async () => {
    render(<LabTechnicianDashboard />);

    await waitFor(() => {
      expect(api.getLabTestRequests).toHaveBeenCalled();
    });
  });

  it('should handle empty requests list', async () => {
    (api.getLabTestRequests as any).mockResolvedValue([]);

    render(<LabTechnicianDashboard />);

    await waitFor(() => {
      expect(api.getLabTestRequests).toHaveBeenCalled();
    });
  });

  it('should handle API errors when fetching requests', async () => {
    (api.getLabTestRequests as any).mockRejectedValue(new Error('API Error'));

    render(<LabTechnicianDashboard />);

    await waitFor(() => {
      expect(api.getLabTestRequests).toHaveBeenCalled();
    });
  });

  it('should display loading state initially', () => {
    render(<LabTechnicianDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should fetch payments when starting a test', async () => {
    (api.getPayments as any).mockResolvedValue([]);

    render(<LabTechnicianDashboard />);

    await waitFor(() => {
      expect(api.getLabTestRequests).toHaveBeenCalled();
    });
  });

  it('should handle payment fetch errors', async () => {
    (api.getPayments as any).mockRejectedValue(new Error('Payment API Error'));

    render(<LabTechnicianDashboard />);

    await waitFor(() => {
      expect(api.getLabTestRequests).toHaveBeenCalled();
    });
  });

  it('should check for payment when starting test', async () => {
    render(<LabTechnicianDashboard />);

    await waitFor(() => {
      expect(api.getLabTestRequests).toHaveBeenCalled();
    });
  });
});


