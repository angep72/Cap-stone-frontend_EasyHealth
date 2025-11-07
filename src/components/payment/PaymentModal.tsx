import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CreditCard, ShieldCheck } from 'lucide-react';

type PaymentType = 'consultation' | 'medication' | 'lab_test';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: PaymentType;
  referenceId: string;
  amount: number;
  description: string;
  onSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  paymentType,
  referenceId,
  amount,
  description,
  onSuccess,
}: PaymentModalProps) {
  const { profile } = useAuth();
  const [insurance, setInsurance] = useState<{ name: string; coverage_percentage: number } | null>(null);
  const [insuranceCoverage, setInsuranceCoverage] = useState(0);
  const [patientPays, setPatientPays] = useState(amount);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && profile?.insurance_id) {
      fetchInsurance();
    }
  }, [isOpen, profile?.insurance_id]);

  useEffect(() => {
    if (insurance) {
      const coverage = (amount * insurance.coverage_percentage) / 100;
      setInsuranceCoverage(coverage);
      setPatientPays(amount - coverage);
    } else {
      setInsuranceCoverage(0);
      setPatientPays(amount);
    }
  }, [amount, insurance]);

  const fetchInsurance = async () => {
    if (!profile?.insurance_id) return;

    try {
      const data = await api.getInsurance(profile.insurance_id);
      if (data) {
        setInsurance({
          name: data.name,
          coverage_percentage: data.coverage_percentage,
        });
      }
    } catch (error) {
      console.error('Error fetching insurance:', error);
    }
  };

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    setLoading(true);

    try {
      if (!profile?._id) {
        alert('Please log in to make a payment');
        setLoading(false);
        return;
      }

      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

      await api.createPayment({
        patient_id: profile._id,
        payment_type: paymentType,
        reference_id: referenceId,
        amount,
        insurance_coverage: insuranceCoverage,
        patient_pays: patientPays,
        status: 'completed',
        payment_method: paymentMethod,
        transaction_id: transactionId,
      });

      if (paymentType === 'medication') {
        try {
          await api.updatePrescription(referenceId, { status: 'paid' });
        } catch (error) {
          console.error('Error updating prescription status:', error);
          // Don't fail the payment if prescription update fails
        }
      }

      try {
        await api.createNotification({
          user_id: profile._id,
          title: 'Payment Successful',
          message: `Your payment of ${patientPays.toFixed(0)} RWF has been processed successfully.`,
          type: 'payment',
          reference_id: referenceId,
          is_read: false,
        });
      } catch (error) {
        console.error('Error creating notification:', error);
        // Don't fail the payment if notification creation fails
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Make Payment" size="md">
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Payment For</p>
          <p className="font-medium text-gray-900">{description}</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Amount</span>
            <span className="font-medium text-gray-900">{amount} RWF</span>
          </div>

          {insurance && (
            <>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Insurance Coverage ({insurance.coverage_percentage}%)
                </span>
                <span className="font-medium text-green-600">-{insuranceCoverage.toFixed(0)} RWF</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">You Pay</span>
                  <span className="text-xl font-bold text-emerald-600">{patientPays.toFixed(0)} RWF</span>
                </div>
              </div>
            </>
          )}

          {!insurance && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">You Pay</span>
                <span className="text-xl font-bold text-emerald-600">{patientPays} RWF</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-emerald-500">
              <input
                type="radio"
                name="payment_method"
                value="mobile_money"
                checked={paymentMethod === 'mobile_money'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-emerald-600"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">Mobile Money (MTN, Airtel)</span>
            </label>
            <label className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-emerald-500">
              <input
                type="radio"
                name="payment_method"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-emerald-600"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">Cash Payment</span>
            </label>
          </div>
        </div>

        {paymentMethod === 'mobile_money' && (
          <Input
            label="Mobile Money Number"
            type="tel"
            placeholder="078XXXXXXX"
            value={phoneNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setPhoneNumber(value);
            }}
            maxLength={10}
            required
          />
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading} fullWidth>
            <CreditCard size={16} className="mr-2" />
            {loading ? 'Processing...' : `Pay ${patientPays.toFixed(0)} RWF`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
