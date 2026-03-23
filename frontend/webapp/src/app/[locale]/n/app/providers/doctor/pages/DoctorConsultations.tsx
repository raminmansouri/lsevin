"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings,
  Search, Filter, Video, MapPin, Clock, FileText, X, Phone, Mail, ChevronRight
} from 'lucide-react';

interface Consultation {
  id: string;
  consultationId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  consultationType: 'Video Call' | 'In-Person' | 'Phone Call';
  specialty: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  chiefComplaint?: string;
  notes?: string;
  prescription?: boolean;
  followUp?: boolean;
}

export default function DoctorConsultations() {
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/doctor/dashboard' },
    { label: 'My Schedule', icon: <Calendar size={20} />, path: '/provider/doctor/schedule', badge: 3 },
    { label: 'Consultations', icon: <MessageSquare size={20} />, path: '/provider/doctor/consultations' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/doctor/bookings' },
    { label: 'My Services', icon: <Stethoscope size={20} />, path: '/provider/doctor/services' },
    { label: 'Profile', icon: <User size={20} />, path: '/provider/doctor/profile' },
    { label: 'Earnings', icon: <DollarSign size={20} />, path: '/provider/doctor/earnings' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/doctor/reviews' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/doctor/settings' },
  ];

  const consultations: Consultation[] = [
    {
      id: '1',
      consultationId: 'CNS-2026-0432',
      patientName: 'Sarah Anderson',
      patientAge: 34,
      patientGender: 'Female',
      consultationType: 'Video Call',
      specialty: 'Cardiology',
      service: 'Initial Consultation',
      date: '2026-03-10',
      time: '09:00',
      duration: 30,
      status: 'completed',
      chiefComplaint: 'Chest pain and irregular heartbeat',
      notes: 'Patient reports occasional chest discomfort. ECG scheduled.',
      prescription: true,
      followUp: true
    },
    {
      id: '2',
      consultationId: 'CNS-2026-0433',
      patientName: 'Michael Chen',
      patientAge: 45,
      patientGender: 'Male',
      consultationType: 'In-Person',
      specialty: 'Cardiology',
      service: 'Follow-up Consultation',
      date: '2026-03-10',
      time: '14:00',
      duration: 45,
      status: 'scheduled',
      chiefComplaint: 'Hypertension follow-up',
      followUp: false
    },
    {
      id: '3',
      consultationId: 'CNS-2026-0434',
      patientName: 'Emma Wilson',
      patientAge: 29,
      patientGender: 'Female',
      consultationType: 'Video Call',
      specialty: 'General Medicine',
      service: 'General Checkup',
      date: '2026-03-10',
      time: '10:30',
      duration: 30,
      status: 'in-progress',
      chiefComplaint: 'Annual health screening',
      prescription: false,
      followUp: false
    },
    {
      id: '4',
      consultationId: 'CNS-2026-0431',
      patientName: 'James Taylor',
      patientAge: 52,
      patientGender: 'Male',
      consultationType: 'In-Person',
      specialty: 'Cardiology',
      service: 'Treatment Review',
      date: '2026-03-09',
      time: '11:00',
      duration: 60,
      status: 'completed',
      chiefComplaint: 'Post-surgery review',
      notes: 'Recovery progressing well. Continue medication.',
      prescription: true,
      followUp: true
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Consultations"
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName="Specialist - Cardiology"
    >
      <div className="flex gap-6">
        {/* Main Content */}
        <div className={selectedConsultation ? 'flex-1' : 'w-full'}>
          {/* Filters & Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name or consultation ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <select className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                  <option>All Types</option>
                  <option>Video Call</option>
                  <option>In-Person</option>
                  <option>Phone Call</option>
                </select>
              </div>
            </div>
          </div>

          {/* Consultations List */}
          <div className="space-y-3">
            {consultations.map(consultation => (
              <div
                key={consultation.id}
                onClick={() => setSelectedConsultation(consultation)}
                className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition ${
                  selectedConsultation?.id === consultation.id
                    ? 'border-[#083f30] shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{consultation.patientName}</h4>
                      <span className="text-sm text-gray-500">
                        {consultation.patientAge}y, {consultation.patientGender}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{consultation.consultationId}</div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(consultation.status)}`}>
                    {consultation.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-6 mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    {consultation.consultationType === 'Video Call' && <Video size={16} />}
                    {consultation.consultationType === 'In-Person' && <MapPin size={16} />}
                    {consultation.consultationType === 'Phone Call' && <Phone size={16} />}
                    <span className="text-sm">{consultation.consultationType}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    <span className="text-sm">{consultation.date} at {consultation.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Stethoscope size={16} />
                    <span className="text-sm">{consultation.specialty}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{consultation.service}</div>
                    {consultation.chiefComplaint && (
                      <div className="text-sm text-gray-600 mt-1">Chief Complaint: {consultation.chiefComplaint}</div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {consultation.prescription && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        Prescription
                      </span>
                    )}
                    {consultation.followUp && (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                        Follow-up Required
                      </span>
                    )}
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Drawer */}
        {selectedConsultation && (
          <div className="w-96 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Consultation Details</h3>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Patient Info */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Patient Information</div>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Name</span>
                    <span className="text-sm font-medium text-gray-900">{selectedConsultation.patientName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Age / Gender</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedConsultation.patientAge}y, {selectedConsultation.patientGender}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consultation Info */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Consultation Details</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ID</span>
                    <span className="text-sm font-medium text-gray-900">{selectedConsultation.consultationId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type</span>
                    <span className="text-sm font-medium text-gray-900">{selectedConsultation.consultationType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Specialty</span>
                    <span className="text-sm font-medium text-gray-900">{selectedConsultation.specialty}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="text-sm font-medium text-gray-900">{selectedConsultation.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date & Time</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedConsultation.date} {selectedConsultation.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chief Complaint */}
              {selectedConsultation.chiefComplaint && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Chief Complaint</div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-900">
                    {selectedConsultation.chiefComplaint}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedConsultation.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Clinical Notes</div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-900">
                    {selectedConsultation.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                {selectedConsultation.status === 'scheduled' && (
                  <button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
                    Start Consultation
                  </button>
                )}
                {selectedConsultation.status === 'in-progress' && (
                  <button className="w-full h-10 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                    Complete Consultation
                  </button>
                )}
                <button className="w-full h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <FileText size={18} />
                  Add Notes
                </button>
                {selectedConsultation.status === 'completed' && (
                  <button className="w-full h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                    View Summary
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
