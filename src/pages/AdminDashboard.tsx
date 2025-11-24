import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Building2, Building, Users, Pill, FlaskRound, ShieldCheck, UserCog, Network, Activity } from 'lucide-react';
import { ManageInsurances } from '../components/admin/ManageInsurances';
import { ManageHospitals } from '../components/admin/ManageHospitals';
import { ManageDepartments } from '../components/admin/ManageDepartments';
import { ManageHospitalDepartments } from '../components/admin/ManageHospitalDepartments';
import { ManageDoctors } from '../components/admin/ManageDoctors';
import { ManagePharmacies } from '../components/admin/ManagePharmacies';
import { ManageLabTests } from '../components/admin/ManageLabTests';
import { ManageUsers } from '../components/admin/ManageUsers';
import { ManageNurses } from '../components/admin/ManageNurses';
import { api } from '../lib/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

type ActiveTab = 'users' | 'insurances' | 'hospitals' | 'departments' | 'hospital_departments' | 'doctors' | 'nurses' | 'pharmacies' | 'lab_tests';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [hospitalsCount, setHospitalsCount] = useState(0);
  const [patientsCount, setPatientsCount] = useState(0);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [nursesCount, setNursesCount] = useState(0);
  const [pharmacistsCount, setPharmacistsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Fetch hospitals
      const hospitals = await api.getHospitals();
      setHospitalsCount(Array.isArray(hospitals) ? hospitals.length : 0);

      // Fetch all profiles and filter by role
      const profiles = await api.getAllProfiles();
      const profilesArray = Array.isArray(profiles) ? profiles : [];
      
      setPatientsCount(profilesArray.filter((profile: any) => profile.role === 'patient').length);
      setDoctorsCount(profilesArray.filter((profile: any) => profile.role === 'doctor').length);
      setNursesCount(profilesArray.filter((profile: any) => profile.role === 'nurse').length);
      setPharmacistsCount(profilesArray.filter((profile: any) => profile.role === 'pharmacist').length);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setHospitalsCount(0);
      setPatientsCount(0);
      setDoctorsCount(0);
      setNursesCount(0);
      setPharmacistsCount(0);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    {
      name: 'Registered',
      Hospitals: hospitalsCount,
      Patients: patientsCount,
      Doctors: doctorsCount,
      Nurses: nursesCount,
      Pharmacists: pharmacistsCount,
    },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  const tabs = [
    { id: 'users' as ActiveTab, label: 'Users', icon: UserCog },
    { id: 'insurances' as ActiveTab, label: 'Insurances', icon: ShieldCheck },
    { id: 'hospitals' as ActiveTab, label: 'Hospitals', icon: Building2 },
    { id: 'departments' as ActiveTab, label: 'Departments', icon: Building },
    { id: 'hospital_departments' as ActiveTab, label: 'Hospital-Dept', icon: Network },
    { id: 'doctors' as ActiveTab, label: 'Doctors', icon: Users },
    { id: 'nurses' as ActiveTab, label: 'Nurses', icon: Activity },
    { id: 'pharmacies' as ActiveTab, label: 'Pharmacies', icon: Pill },
    { id: 'lab_tests' as ActiveTab, label: 'Lab Tests', icon: FlaskRound },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <ManageUsers />;
      case 'insurances':
        return <ManageInsurances />;
      case 'hospitals':
        return <ManageHospitals />;
      case 'departments':
        return <ManageDepartments />;
      case 'hospital_departments':
        return <ManageHospitalDepartments />;
      case 'doctors':
        return <ManageDoctors />;
      case 'nurses':
        return <ManageNurses />;
      case 'pharmacies':
        return <ManagePharmacies />;
      case 'lab_tests':
        return <ManageLabTests />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all entities and system data</p>
        </div>

        {/* Statistics Graph */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-emerald-600" />
              System Statistics
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading statistics...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Hospitals</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{hospitalsCount}</p>
                      </div>
                      <Building2 size={32} className="text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Patients</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-1">{patientsCount}</p>
                      </div>
                      <Users size={32} className="text-emerald-500" />
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Doctors</p>
                        <p className="text-3xl font-bold text-amber-600 mt-1">{doctorsCount}</p>
                      </div>
                      <Users size={32} className="text-amber-500" />
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Nurses</p>
                        <p className="text-3xl font-bold text-purple-600 mt-1">{nursesCount}</p>
                      </div>
                      <Activity size={32} className="text-purple-500" />
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pharmacists</p>
                        <p className="text-3xl font-bold text-red-600 mt-1">{pharmacistsCount}</p>
                      </div>
                      <Pill size={32} className="text-red-500" />
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="w-full overflow-x-auto">
                  <div className="h-64 min-w-[300px] sm:min-w-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                        />
                        <Bar 
                          dataKey="Hospitals" 
                          fill={COLORS[0]}
                          radius={[8, 8, 0, 0]}
                          name="Hospitals"
                        >
                          <Cell key="hospitals" fill={COLORS[0]} />
                        </Bar>
                        <Bar 
                          dataKey="Patients" 
                          fill={COLORS[1]}
                          radius={[8, 8, 0, 0]}
                          name="Patients"
                        >
                          <Cell key="patients" fill={COLORS[1]} />
                        </Bar>
                        <Bar 
                          dataKey="Doctors" 
                          fill={COLORS[2]}
                          radius={[8, 8, 0, 0]}
                          name="Doctors"
                        >
                          <Cell key="doctors" fill={COLORS[2]} />
                        </Bar>
                        <Bar 
                          dataKey="Nurses" 
                          fill={COLORS[3]}
                          radius={[8, 8, 0, 0]}
                          name="Nurses"
                        >
                          <Cell key="nurses" fill={COLORS[3]} />
                        </Bar>
                        <Bar 
                          dataKey="Pharmacists" 
                          fill={COLORS[4]}
                          radius={[8, 8, 0, 0]}
                          name="Pharmacists"
                        >
                          <Cell key="pharmacists" fill={COLORS[4]} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="border-b border-gray-200">
          <nav className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden xs:inline">{tab.label}</span>
                  <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {renderContent()}
      </div>
    </DashboardLayout>
  );
}
