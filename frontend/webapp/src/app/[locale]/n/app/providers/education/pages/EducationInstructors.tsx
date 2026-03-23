import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck,
  Plus, CheckCircle
} from 'lucide-react';

export default function EducationInstructors() {
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

  const instructors = [
    { name: 'Prof. Sarah Johnson', specialty: 'Language Education', courses: 5, availability: 'Full-time', status: 'active', profileComplete: 100, certified: true },
    { name: 'Dr. Michael Brown', specialty: 'Healthcare Management', courses: 3, availability: 'Part-time', status: 'active', profileComplete: 100, certified: true },
    { name: 'Lisa Anderson', specialty: 'Clinical Training', courses: 4, availability: 'Full-time', status: 'active', profileComplete: 95, certified: true },
    { name: 'Prof. David Chen', specialty: 'Medical Sciences', courses: 6, availability: 'Full-time', status: 'active', profileComplete: 100, certified: true },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Instructor Management"
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Academic Staff</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Add Instructor
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Instructors</div>
          <div className="text-2xl font-bold text-gray-900">28</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active</div>
          <div className="text-2xl font-bold text-green-900">26</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Full-time</div>
          <div className="text-2xl font-bold text-blue-900">18</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Certified</div>
          <div className="text-2xl font-bold text-amber-900">28</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Instructor Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Specialty</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigned Courses</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Availability</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Profile</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Certification</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {instructors.map((instructor, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{instructor.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{instructor.specialty}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{instructor.courses} courses</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    instructor.availability === 'Full-time' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {instructor.availability}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${instructor.profileComplete}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{instructor.profileComplete}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {instructor.certified && (
                    <CheckCircle size={18} className="text-green-600" />
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    instructor.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {instructor.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">
                    Manage
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
