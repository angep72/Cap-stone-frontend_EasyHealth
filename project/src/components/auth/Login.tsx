import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Building2 } from 'lucide-react';

interface LoginProps {
  onToggleRegister: () => void;
}

export function Login({ onToggleRegister }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login form submitted with email:', email);
      const { error } = await signIn(email, password);

      if (error) {
        console.error('Login error:', error);
        setError(error.message || 'Failed to sign in');
        setLoading(false);
      } else {
        // Login successful - the AuthContext will handle state update
        // The app will automatically redirect based on user role
        console.log('Login successful');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-emerald-600 p-3 rounded-full">
            <Building2 size={32} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Welcome to EasyHealth
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to access your healthcare account
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onToggleRegister}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
