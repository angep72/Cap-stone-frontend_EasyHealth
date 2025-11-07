const API_BASE_URL = 'http://localhost:5000/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Handle network errors
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
      }
      throw error;
    }
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    phone?: string;
    national_id?: string;
    insurance_id?: string;
  }) {
    const result = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: data,
    });
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    return result;
  }

  async login(email: string, password: string) {
    console.log('API login attempt for:', email);
    try {
      const result = await this.request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      console.log('Login successful, token received');
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      return result;
    } catch (error: any) {
      console.error('Login API error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  logout() {
    localStorage.removeItem('token');
  }

  // Profiles
  async getProfile(id: string) {
    return this.request(`/profiles/${id}`);
  }

  async updateProfile(id: string, data: any) {
    return this.request(`/profiles/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async getAllProfiles() {
    return this.request('/profiles');
  }

  async deleteProfile(id: string) {
    return this.request(`/profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // Insurances
  async getInsurances() {
    return this.request('/insurances');
  }

  async getInsurance(id: string) {
    return this.request(`/insurances/${id}`);
  }

  async createInsurance(data: any) {
    return this.request('/insurances', {
      method: 'POST',
      body: data,
    });
  }

  async updateInsurance(id: string, data: any) {
    return this.request(`/insurances/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteInsurance(id: string) {
    return this.request(`/insurances/${id}`, {
      method: 'DELETE',
    });
  }

  // Hospitals
  async getHospitals() {
    return this.request('/hospitals');
  }

  async getHospital(id: string) {
    return this.request(`/hospitals/${id}`);
  }

  async createHospital(data: any) {
    return this.request('/hospitals', {
      method: 'POST',
      body: data,
    });
  }

  async updateHospital(id: string, data: any) {
    return this.request(`/hospitals/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteHospital(id: string) {
    return this.request(`/hospitals/${id}`, {
      method: 'DELETE',
    });
  }

  // Departments
  async getDepartments() {
    return this.request('/departments');
  }

  async getDepartment(id: string) {
    return this.request(`/departments/${id}`);
  }

  async createDepartment(data: any) {
    return this.request('/departments', {
      method: 'POST',
      body: data,
    });
  }

  async updateDepartment(id: string, data: any) {
    return this.request(`/departments/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteDepartment(id: string) {
    return this.request(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Hospital Departments
  async getHospitalDepartments(hospitalId?: string) {
    const query = hospitalId ? `?hospital_id=${hospitalId}` : '';
    return this.request(`/hospital-departments${query}`);
  }

  async getHospitalDepartmentsByHospital(hospitalId: string) {
    return this.request(`/hospital-departments/hospital/${hospitalId}`);
  }

  async createHospitalDepartment(data: any) {
    return this.request('/hospital-departments', {
      method: 'POST',
      body: data,
    });
  }

  async updateHospitalDepartment(id: string, data: any) {
    return this.request(`/hospital-departments/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteHospitalDepartment(id: string) {
    return this.request(`/hospital-departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Doctors
  async getDoctors() {
    return this.request('/doctors');
  }

  async getDoctor(id: string) {
    return this.request(`/doctors/${id}`);
  }

  async getDoctorByUserId(userId: string) {
    return this.request(`/doctors/user/${userId}`);
  }

  async createDoctor(data: any) {
    return this.request('/doctors', {
      method: 'POST',
      body: data,
    });
  }

  async updateDoctor(id: string, data: any) {
    return this.request(`/doctors/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteDoctor(id: string) {
    return this.request(`/doctors/${id}`, {
      method: 'DELETE',
    });
  }

  // Nurses
  async getNurses() {
    return this.request('/nurses');
  }

  async getNurse(id: string) {
    return this.request(`/nurses/${id}`);
  }

  async getNurseByUserId(userId: string) {
    return this.request(`/nurses/user/${userId}`);
  }

  async createNurse(data: any) {
    return this.request('/nurses', {
      method: 'POST',
      body: data,
    });
  }

  async updateNurse(id: string, data: any) {
    return this.request(`/nurses/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteNurse(id: string) {
    return this.request(`/nurses/${id}`, {
      method: 'DELETE',
    });
  }

  // Pharmacies
  async getPharmacies() {
    return this.request('/pharmacies');
  }

  async getPharmacy(id: string) {
    return this.request(`/pharmacies/${id}`);
  }

  async getPharmacyByPharmacistId(pharmacistId: string) {
    return this.request(`/pharmacies/pharmacist/${pharmacistId}`);
  }

  async createPharmacy(data: any) {
    return this.request('/pharmacies', {
      method: 'POST',
      body: data,
    });
  }

  async updatePharmacy(id: string, data: any) {
    return this.request(`/pharmacies/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deletePharmacy(id: string) {
    return this.request(`/pharmacies/${id}`, {
      method: 'DELETE',
    });
  }

  // Medications
  async getMedications(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/medications${query}`);
  }

  async getMedication(id: string) {
    return this.request(`/medications/${id}`);
  }

  async createMedication(data: any) {
    return this.request('/medications', {
      method: 'POST',
      body: data,
    });
  }

  async updateMedication(id: string, data: any) {
    return this.request(`/medications/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteMedication(id: string) {
    return this.request(`/medications/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointments
  async getAppointments() {
    return this.request('/appointments');
  }

  async getAppointment(id: string) {
    return this.request(`/appointments/${id}`);
  }

  async createAppointment(data: any) {
    return this.request('/appointments', {
      method: 'POST',
      body: data,
    });
  }

  async updateAppointment(id: string, data: any) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async getAvailableTimeSlots(doctorId: string, date: string) {
    return this.request(`/appointments/available/${doctorId}/${date}`);
  }

  // Consultations
  async getConsultations() {
    return this.request('/consultations');
  }

  async getConsultation(id: string) {
    return this.request(`/consultations/${id}`);
  }

  async getConsultationByAppointmentId(appointmentId: string) {
    return this.request(`/consultations/appointment/${appointmentId}`);
  }

  async createConsultation(data: any) {
    return this.request('/consultations', {
      method: 'POST',
      body: data,
    });
  }

  async updateConsultation(id: string, data: any) {
    return this.request(`/consultations/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // Lab Tests
  async getLabTestTemplates() {
    return this.request('/lab-tests/templates');
  }

  async getLabTestTemplate(id: string) {
    return this.request(`/lab-tests/templates/${id}`);
  }

  async createLabTestTemplate(data: any) {
    return this.request('/lab-tests/templates', {
      method: 'POST',
      body: data,
    });
  }

  async updateLabTestTemplate(id: string, data: any) {
    return this.request(`/lab-tests/templates/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteLabTestTemplate(id: string) {
    return this.request(`/lab-tests/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async getLabTestRequests() {
    return this.request('/lab-tests/requests');
  }

  async getLabTestRequest(id: string) {
    return this.request(`/lab-tests/requests/${id}`);
  }

  async createLabTestRequest(data: any) {
    return this.request('/lab-tests/requests', {
      method: 'POST',
      body: data,
    });
  }

  async updateLabTestRequest(id: string, data: any) {
    return this.request(`/lab-tests/requests/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async getLabTestResults() {
    return this.request('/lab-tests/results');
  }

  async getLabTestResult(id: string) {
    return this.request(`/lab-tests/results/${id}`);
  }

  async createLabTestResult(data: any) {
    return this.request('/lab-tests/results', {
      method: 'POST',
      body: data,
    });
  }

  // Prescriptions
  async getPrescriptions() {
    return this.request('/prescriptions');
  }

  async getPrescription(id: string) {
    return this.request(`/prescriptions/${id}`);
  }

  async createPrescription(data: any) {
    return this.request('/prescriptions', {
      method: 'POST',
      body: data,
    });
  }

  async updatePrescription(id: string, data: any) {
    return this.request(`/prescriptions/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // Pharmacy Requests
  async getPharmacyRequests() {
    return this.request('/pharmacy-requests');
  }

  async getPharmacyRequest(id: string) {
    return this.request(`/pharmacy-requests/${id}`);
  }

  async createPharmacyRequest(data: any) {
    return this.request('/pharmacy-requests', {
      method: 'POST',
      body: data,
    });
  }

  async updatePharmacyRequest(id: string, data: any) {
    return this.request(`/pharmacy-requests/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // Payments
  async getPayments() {
    return this.request('/payments');
  }

  async getPayment(id: string) {
    return this.request(`/payments/${id}`);
  }

  async createPayment(data: any) {
    return this.request('/payments', {
      method: 'POST',
      body: data,
    });
  }

  async getPaymentByReference(type: string, referenceId: string) {
    return this.request(`/payments/reference/${type}/${referenceId}`);
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread/count');
  }

  async createNotification(data: {
    user_id: string;
    title: string;
    message: string;
    type?: string;
    reference_id?: string;
    is_read?: boolean;
  }) {
    return this.request('/notifications', {
      method: 'POST',
      body: data,
    });
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read/all', {
      method: 'PUT',
    });
  }

  // Vitals
  async getVitals() {
    return this.request('/vitals');
  }

  async getVitalsByPatientId(patientId: string) {
    return this.request(`/vitals/patient/${patientId}`);
  }

  async getVital(id: string) {
    return this.request(`/vitals/${id}`);
  }

  async createVital(data: any) {
    return this.request('/vitals', {
      method: 'POST',
      body: data,
    });
  }
}

export const api = new ApiClient();

