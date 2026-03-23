import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck
} from 'lucide-react';

export default function EducationStudents() {
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

  const students = [
    { name: 'Emma Rodriguez', enrolled: 2, status: 'active', progress: 85, certEligible: true },
    { name: 'Ali Mohammed', enrolled: 3, status: 'active', progress: 72, certEligible: false },
    { name: 'Sophie Chen', enrolled: 1, status: 'active', progress: 94, certEligible: true },
    { name: 'James Wilson', enrolled: 2, status: 'active', progress: 68, certEligible: false },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Student Management"
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Students</div>
          <div className="text-2xl font-bold text-gray-900">1,248</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active</div>
          <div className="text-2xl font-bold text-green-900">1,124</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Avg Progress</div>
          <div className="text-2xl font-bold text-blue-900">78%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Cert Eligible</div>
          <div className="text-2xl font-bold text-amber-900">342</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enrolled Courses</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Registration Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cert Eligible</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{student.enrolled} courses</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {student.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${student.progress}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{student.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {student.certEligible ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Eligible</span>
                  ) : (
                    <span className="text-xs text-gray-500">Not Eligible</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
