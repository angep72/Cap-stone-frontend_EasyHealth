import { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
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

type ActiveTab = 'users' | 'insurances' | 'hospitals' | 'departments' | 'hospital_departments' | 'doctors' | 'nurses' | 'pharmacies' | 'lab_tests';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');

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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage all entities and system data</p>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
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
