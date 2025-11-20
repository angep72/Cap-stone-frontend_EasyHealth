import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { useAuth } from '../../contexts/AuthContext';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the api
vi.mock('../../lib/api', () => ({
  api: {
    getInsurance: vi.fn(),
    createPayment: vi.fn(),
    updatePrescription: vi.fn(),
    createNotification: vi.fn(),
  },
}));

describe('PaymentModal Component', () => {
  const mockProfile = {
    _id: 'user1',
    full_name: 'Test User',
    email: 'test@example.com',
    phone: '0781234567',
    insurance_id: null,
  };

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      profile: mockProfile,
    });
  });

  it('should render payment modal when open', () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentType="consultation"
        referenceId="ref1"
        amount={1000}
        description="Consultation Fee"
      />
    );

    expect(screen.getByText('Make Payment')).toBeInTheDocument();
    expect(screen.getByText('Consultation Fee')).toBeInTheDocument();
  });

  it('should display total amount correctly', () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentType="consultation"
        referenceId="ref1"
        amount={5000}
        description="Consultation Fee"
      />
    );

    // Check for "Total Amount" label and value
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    const totalAmountElements = screen.getAllByText(/5000 RWF/i);
    expect(totalAmountElements.length).toBeGreaterThan(0);
  });

  it('should not render when closed', () => {
    render(
      <PaymentModal
        isOpen={false}
        onClose={mockOnClose}
        paymentType="consultation"
        referenceId="ref1"
        amount={1000}
        description="Consultation Fee"
      />
    );

    expect(screen.queryByText('Make Payment')).not.toBeInTheDocument();
  });

  it('should display patient pays amount', () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentType="consultation"
        referenceId="ref1"
        amount={1000}
        description="Consultation Fee"
      />
    );

    expect(screen.getByText(/You Pay/i)).toBeInTheDocument();
  });

  it('should show payment method options', () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentType="consultation"
        referenceId="ref1"
        amount={1000}
        description="Consultation Fee"
      />
    );

    // Check for payment method label
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    
    // Check for payment method options (text might be in label elements)
    const mobileMoney = screen.getByText(/Mobile Money.*MTN.*Airtel/i);
    expect(mobileMoney).toBeInTheDocument();
    
    const cashPayment = screen.getByText(/Cash Payment/i);
    expect(cashPayment).toBeInTheDocument();
  });

  // it('should show phone input when mobile money is selected', () => {
  //   render(
  //     <PaymentModal
  //       isOpen={true}
  //       onClose={mockOnClose}
  //       paymentType="consultation"
  //       referenceId="ref1"
  //       amount={1000}
  //       description="Consultation Fee"
  //     />
  //   );

  //   // Mobile money is selected by default, so phone input should be visible
  //   const phoneInput = screen.getByLabelText(/Mobile Money Number/i);
  //   expect(phoneInput).toBeInTheDocument();
  //   expect(phoneInput).toHaveAttribute('type', 'tel');
  // });
});