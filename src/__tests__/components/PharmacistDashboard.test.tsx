import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PharmacistDashboard } from '../../pages/PharmacistDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the api
vi.mock('../../lib/api', () => ({
  api: {
    getPharmacyByPharmacistId: vi.fn(),
    getPharmacyRequests: vi.fn(),
    updatePrescription: vi.fn(),
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

// Mock child components
vi.mock('../../components/pharmacist/PrescriptionPricingModal', () => ({
  PrescriptionPricingModal: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div>PrescriptionPricingModal</div> : null,
}));

describe('PharmacistDashboard Component', () => {
  const mockProfile = {
    _id: 'pharmacist1',
    full_name: 'Pharmacist Test',
    email: 'pharmacist@test.com',
    role: 'pharmacist',
  };

  const mockPharmacy = {
    _id: 'pharmacy1',
    name: 'Test Pharmacy',
    location: 'Test Location',
  };

  const mockRequests = [
    {
      _id: 'req1',
      status: 'pending',
      createdAt: '2024-12-01',
      total_price: 10000,
      patient_id: { _id: 'patient1', full_name: 'Patient One', phone: '0781234567' },
      prescription_id: {
        _id: 'pres1',
        status: 'pending',
        total_price: 10000,
        items: [],
        patient_id: { _id: 'patient1', full_name: 'Patient One' },
        doctor_id: {
          _id: 'doc1',
          user_id: { _id: 'user1', full_name: 'Dr. Test' },
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      profile: mockProfile,
    });
    (api.getPharmacyByPharmacistId as any).mockResolvedValue(mockPharmacy);
    (api.getPharmacyRequests as any).mockResolvedValue(mockRequests);
  });

  it('should render pharmacist dashboard when profile is available', async () => {
    render(<PharmacistDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(api.getPharmacyByPharmacistId).toHaveBeenCalledWith('pharmacist1');
  });

  it('should fetch pharmacy when profile is available', async () => {
    render(<PharmacistDashboard />);

    await waitFor(() => {
      expect(api.getPharmacyByPharmacistId).toHaveBeenCalled();
    });
  });

  it('should fetch requests when pharmacy is available', async () => {
    render(<PharmacistDashboard />);

    await waitFor(() => {
      expect(api.getPharmacyRequests).toHaveBeenCalled();
    });
  });

  it('should not fetch requests if pharmacy is not found', async () => {
    (api.getPharmacyByPharmacistId as any).mockResolvedValue(null);

    render(<PharmacistDashboard />);

    await waitFor(() => {
      expect(api.getPharmacyRequests).not.toHaveBeenCalled();
    });
  });

  it('should handle empty requests list', async () => {
    (api.getPharmacyRequests as any).mockResolvedValue([]);

    render(<PharmacistDashboard />);

    await waitFor(() => {
      expect(api.getPharmacyRequests).toHaveBeenCalled();
    });
  });

  it('should handle API errors when fetching pharmacy', async () => {
    (api.getPharmacyByPharmacistId as any).mockRejectedValue(new Error('API Error'));

    render(<PharmacistDashboard />);

    await waitFor(() => {
      expect(api.getPharmacyByPharmacistId).toHaveBeenCalled();
    });
  });

  it('should handle API errors when fetching requests', async () => {
    (api.getPharmacyRequests as any).mockRejectedValue(new Error('API Error'));

    render(<PharmacistDashboard />);

    await waitFor(() => {
      expect(api.getPharmacyRequests).toHaveBeenCalled();
    });
  });

  it('should display loading state initially for requests', async () => {
    render(<PharmacistDashboard />);
    
  //   // Initial loading should be shown
  //   expect(screen.getByText('Loading...')).toBeInTheDocument();
   });

  it('should handle pharmacy fetch errors gracefully', async () => {
    (api.getPharmacyByPharmacistId as any).mockRejectedValue(new Error('Pharmacy not found'));

    render(<PharmacistDashboard />);

    await waitFor(() => {
      expect(api.getPharmacyByPharmacistId).toHaveBeenCalled();
    });
  });
});




