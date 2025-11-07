import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';

type UserRole = 'patient' | 'doctor' | 'lab_technician' | 'pharmacist' | 'admin' | 'nurse';

interface Profile {
  _id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  national_id?: string;
  insurance_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  session: { token: string } | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    full_name: string;
    role: UserRole;
    phone?: string;
    national_id?: string;
    insurance_id?: string;
  }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profileData = await api.getCurrentUser();
      return profileData as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    const profileData = await fetchProfile();
    if (profileData) {
      setProfile(profileData);
      setUser(profileData);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setSession({ token });
      fetchProfile().then((profileData) => {
        if (profileData) {
          setProfile(profileData);
          setUser(profileData);
        } else {
          // Token invalid, clear it
          localStorage.removeItem('token');
          setSession(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData: {
      full_name: string;
      role: UserRole;
      phone?: string;
      national_id?: string;
      insurance_id?: string;
    }
  ) => {
    try {
      const result = await api.register({
        email,
        password,
        ...userData,
      });
      
      setProfile(result.user);
      setUser(result.user);
      setSession({ token: result.token });
      
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await api.login(email, password);
      
      setProfile(result.user);
      setUser(result.user);
      setSession({ token: result.token });
      
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
