import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Building2, ArrowLeft } from 'lucide-react';

interface RegisterProps {
  onToggleLogin: () => void;
  onNavigateToLanding?: () => void;
}

export function Register({ onToggleLogin, onNavigateToLanding }: RegisterProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    national_id: '',
    insurance_id: '',
  });
  const [insurances, setInsurances] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      const data = await api.getInsurances();
      setInsurances(data);
    } catch (error) {
      console.error('Error fetching insurances:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.national_id && formData.national_id.length !== 16) {
      errors.national_id = 'National ID must be exactly 16 digits';
    }
    if (formData.national_id && !/^\d+$/.test(formData.national_id)) {
      errors.national_id = 'National ID must contain only numbers';
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.full_name,
      role: 'patient',
      phone: formData.phone || undefined,
      national_id: formData.national_id || undefined,
      insurance_id: formData.insurance_id || undefined,
    });

    if (error) {
      setError(error.message || 'Failed to register');
    }

    setLoading(false);
  };

  const insuranceOptions = [
    { value: '', label: 'Select Insurance (Optional)' },
    ...insurances.map((ins) => ({ value: ins._id, label: ins.name })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        {onNavigateToLanding && (
          <button
            onClick={onNavigateToLanding}
            className="flex items-center text-gray-600 hover:text-emerald-600 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        )}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-emerald-600 p-3 rounded-full">
            <Building2 size={32} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Patient Registration
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Register as a patient to book appointments and manage your health
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="0781234567"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, phone: value });
              }}
              error={validationErrors.phone}
              maxLength={10}
            />

            <Input
              label="National ID"
              type="text"
              placeholder="Enter 16-digit National ID"
              value={formData.national_id}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, national_id: value });
              }}
              error={validationErrors.national_id}
              maxLength={16}
            />

            <Select
              label="Insurance Provider"
              options={insuranceOptions}
              value={formData.insurance_id}
              onChange={(e) => setFormData({ ...formData, insurance_id: e.target.value })}
            />

            <div className="md:col-span-1"></div>

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={validationErrors.password}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={validationErrors.confirmPassword}
              required
            />
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onToggleLogin}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
