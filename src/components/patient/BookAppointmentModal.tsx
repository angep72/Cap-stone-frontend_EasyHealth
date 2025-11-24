import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Hospital {
  _id: string;
  name: string;
  consultation_fee?: number;
}

interface Department {
  _id: string;
  name: string;
}

interface Doctor {
  _id: string;
  user_id: string | { _id: string; full_name: string };
  hospital_id: string | { _id: string };
  department_id: string | { _id: string };
}

export function BookAppointmentModal({ isOpen, onClose }: BookAppointmentModalProps) {
  const { profile } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [consultationFee, setConsultationFee] = useState<number>(0);

  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchHospitals();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedHospital) {
      fetchDepartments(selectedHospital);
      fetchConsultationFee(selectedHospital);
    } else {
      setConsultationFee(0);
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (selectedHospital && selectedDepartment) {
      fetchDoctors(selectedHospital, selectedDepartment);
    }
  }, [selectedHospital, selectedDepartment]);

  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      fetchAvailableSlots(selectedDoctor, appointmentDate);
    } else {
      setAvailableSlots([]);
    }
    setAppointmentTime('');
  }, [selectedDoctor, appointmentDate]);

  const fetchHospitals = async () => {
    try {
      const data = await api.getHospitals();
      setHospitals(data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchDepartments = async (hospitalId: string) => {
    try {
      const [hospitalDeptsData, allDepartmentsData] = await Promise.all([
        api.getHospitalDepartments(),
        api.getDepartments(),
      ]);

      const hospitalDepts = hospitalDeptsData.filter((hd: any) => {
        const hdHospitalId = typeof hd.hospital_id === 'string' ? hd.hospital_id : hd.hospital_id._id;
        return hdHospitalId === hospitalId;
      });

      const deptIds = new Set<string>();
      const uniqueDepts: Department[] = [];
      hospitalDepts.forEach((hd: any) => {
        const deptId = typeof hd.department_id === 'string' ? hd.department_id : hd.department_id._id;
        if (!deptIds.has(deptId)) {
          deptIds.add(deptId);
          if (typeof hd.department_id === 'object' && '_id' in hd.department_id && 'name' in hd.department_id) {
            uniqueDepts.push({ _id: hd.department_id._id, name: hd.department_id.name });
          } else {
            const dept = allDepartmentsData.find((d: Department) => d._id === deptId);
            if (dept) uniqueDepts.push(dept);
          }
        }
      });

      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDoctors = async (hospitalId: string, departmentId: string) => {
    try {
      const data = await api.getDoctors();
      const filteredDoctors = data.filter((doctor: Doctor) => {
        const docHospitalId = typeof doctor.hospital_id === 'string' ? doctor.hospital_id : doctor.hospital_id._id;
        const docDepartmentId = typeof doctor.department_id === 'string' ? doctor.department_id : doctor.department_id._id;
        return docHospitalId === hospitalId && docDepartmentId === departmentId;
      });
      setDoctors(filteredDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchConsultationFee = async (hospitalId: string) => {
    try {
      const hospital = await api.getHospital(hospitalId);
      setConsultationFee(hospital?.consultation_fee || 0);
    } catch (error) {
      console.error('Error fetching consultation fee:', error);
      setConsultationFee(0);
    }
  };

  const fetchAvailableSlots = async (doctorId: string, date: string) => {
    try {
      const slots = await api.getAvailableTimeSlots(doctorId, date);
      if (Array.isArray(slots)) {
        const normalized = slots.map((slot: string) => (slot.length > 5 ? slot.slice(0, 5) : slot));
        const filtered = normalizeAndFilterSlots(normalized, date);
        setAvailableSlots(filtered);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    }
  };

  const normalizeAndFilterSlots = (slots: string[], date: string) => {
    const today = new Date();
    const selectedDate = new Date(date);
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (!isToday) {
      return slots;
    }

    const currentMinutes = today.getHours() * 60 + today.getMinutes();

    return slots.filter((slot) => {
      const [hourStr, minuteStr] = slot.split(':');
      const slotMinutes = Number(hourStr) * 60 + Number(minuteStr);
      return slotMinutes > currentMinutes;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError('Cannot book appointments in the past');
      return;
    }

    if (!availableSlots.includes(appointmentTime)) {
      setError('This time slot is no longer available. Please select another.');
      return;
    }

    setLoading(true);

    try {
      const appointmentData = await api.createAppointment({
        doctor_id: selectedDoctor,
        hospital_id: selectedHospital,
        department_id: selectedDepartment,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason,
        status: 'pending',
      });

      const selectedDoctorData = doctors.find(d => d._id === selectedDoctor);
      if (appointmentData && selectedDoctorData) {
        const doctorUserId = typeof selectedDoctorData.user_id === 'string' 
          ? selectedDoctorData.user_id 
          : selectedDoctorData.user_id._id;

        await api.createNotification({
          user_id: doctorUserId,
          title: 'New Appointment Request',
          message: `${profile?.full_name} has requested an appointment on ${appointmentDate} at ${appointmentTime}. Reason: ${reason}`,
          type: 'appointment',
          reference_id: appointmentData._id,
          is_read: false,
        });
      }

      onClose();
      resetForm();
      setAvailableSlots((prev) => prev.filter((slot) => slot !== appointmentTime));
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      setError(error.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedHospital('');
    setSelectedDepartment('');
    setSelectedDoctor('');
    setAppointmentDate('');
    setAppointmentTime('');
    setReason('');
    setError('');
  };

  const hospitalOptions = [
    { value: '', label: 'Select Hospital' },
    ...hospitals.map((h) => ({ value: h._id, label: h.name })),
  ];

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map((d) => ({ value: d._id, label: d.name })),
  ];

  const doctorOptions = [
    { value: '', label: 'Select Doctor' },
    ...doctors.map((d) => {
      const fullName = typeof d.user_id === 'object' ? d.user_id.full_name : 'Doctor';
      return {
        value: d._id,
        label: `Dr. ${fullName}`,
      };
    }),
  ];

  const timeSlotOptions = [
    { value: '', label: 'Select Time' },
    ...availableSlots.map((time) => ({ value: time, label: time })),
  ];

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Appointment" size="lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Hospital"
          options={hospitalOptions}
          value={selectedHospital}
          onChange={(e) => {
            setSelectedHospital(e.target.value);
            setSelectedDepartment('');
            setSelectedDoctor('');
          }}
          required
        />

        <Select
          label="Department"
          options={departmentOptions}
          value={selectedDepartment}
          onChange={(e) => {
            setSelectedDepartment(e.target.value);
            setSelectedDoctor('');
          }}
          disabled={!selectedHospital}
          required
        />

        <Select
          label="Doctor"
          options={doctorOptions}
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          disabled={!selectedDepartment}
          required
        />

        {consultationFee > 0 && selectedHospital && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-medium text-emerald-900">
              Consultation Fee (Hospital): <span className="text-emerald-700">{consultationFee.toLocaleString()} RWF</span>
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              This fee will be paid to the hospital after your appointment is approved
            </p>
          </div>
        )}

        <Input
          label="Appointment Date"
          type="date"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          min={minDate}
          required
        />

        {appointmentDate && selectedDoctor && (
          <div>
            <Select
              label="Time Slot"
              options={timeSlotOptions}
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
            />
            {availableSlots.length === 0 && (
              <p className="mt-1 text-sm text-red-600">
                No available slots for this date. Please select another date.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Visit
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            rows={3}
            placeholder="Describe your symptoms or reason for appointment"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || availableSlots.length === 0}
            fullWidth
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
