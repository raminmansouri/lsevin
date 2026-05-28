import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck,
  Download, CheckCircle
} from 'lucide-react';

export default function EducationCertificates() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/education/dashboard' },
    { label: 'Course Catalog', icon: <BookOpen size={20} />, path: '/provider/education/courses' },
    { label: 'Registrations', icon: <UserCheck size={20} />, path: '/provider/education/registrations', badge: 18 },
    { label: 'Students', icon: <Users size={20} />, path: '/provider/education/students' },
    { label: 'Instructors', icon: <GraduationCap size={20} />, path: '/provider/education/instructors' },
    { label: 'Class Schedule', icon: <Calendar size={20} />, path: '/provider/education/schedule' },
    { label: 'Certificates', icon: <Award size={20} />, path: '/provider/education/certificates' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/education/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/education/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/education/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/education/settings' },
  ];

  const certificates = [
    { id: 'CERT-2847', student: 'Emma Rodriguez', course: 'Medical English Course', issueDate: '2026-03-10', completion: 'completed', status: 'issued', verified: true },
    { id: 'CERT-2846', student: 'James Wilson', course: 'Healthcare Management', issueDate: '2026-03-10', completion: 'completed', status: 'issued', verified: true },
    { id: 'CERT-2845', student: 'Sophie Chen', course: 'Nursing Skills Training', issueDate: '2026-03-09', completion: 'completed', status: 'pending', verified: false },
    { id: 'CERT-2844', student: 'Ali Mohammed', course: 'Medical Terminology', issueDate: '2026-03-09', completion: 'completed', status: 'issued', verified: true },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Certificate Management"
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Issued</div>
          <div className="text-2xl font-bold text-gray-900">2,847</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">This Month</div>
          <div className="text-2xl font-bold text-green-900">89</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">12</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Verified</div>
          <div className="text-2xl font-bold text-blue-900">2,835</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cert ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Issue Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Completion</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Verified</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {certificates.map(cert => (
              <tr key={cert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{cert.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{cert.student}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{cert.course}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{cert.issueDate}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {cert.completion.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    cert.status === 'issued' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {cert.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {cert.verified && <CheckCircle size={18} className="text-green-600" />}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {cert.status === 'pending' ? (
                      <button className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-medium">
                        Issue
                      </button>
                    ) : (
                      <button className="flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">
                        <Download size={16} />
                        Download
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
