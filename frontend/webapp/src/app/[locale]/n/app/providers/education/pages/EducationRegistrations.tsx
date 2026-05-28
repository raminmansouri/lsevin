import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck,
  Search, Filter
} from 'lucide-react';

export default function EducationRegistrations() {
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

  const registrations = [
    { id: 'REG-9421', student: 'Emma Rodriguez', course: 'Medical English Course', regDate: '2026-03-10', payment: 'paid', enrollment: 'pending', attendance: 'not-started' },
    { id: 'REG-9422', student: 'Ali Mohammed', course: 'Healthcare Management', regDate: '2026-03-10', payment: 'paid', enrollment: 'confirmed', attendance: 'active' },
    { id: 'REG-9423', student: 'Sophie Chen', course: 'Nursing Skills Training', regDate: '2026-03-09', payment: 'pending', enrollment: 'pending', attendance: 'not-started' },
    { id: 'REG-9424', student: 'James Wilson', course: 'Medical Terminology', regDate: '2026-03-09', payment: 'paid', enrollment: 'confirmed', attendance: 'active' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Registration Management"
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total</div>
          <div className="text-2xl font-bold text-gray-900">186</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">18</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Confirmed</div>
          <div className="text-2xl font-bold text-green-900">142</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Revenue</div>
          <div className="text-2xl font-bold text-amber-900">$46,500</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, course, or registration ID..."
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Payment</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Enrollment</option>
              <option>Pending</option>
              <option>Confirmed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reg ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reg Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enrollment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Attendance</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {registrations.map(reg => (
              <tr key={reg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{reg.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{reg.student}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{reg.course}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{reg.regDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    reg.payment === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {reg.payment.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    reg.enrollment === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {reg.enrollment.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    reg.attendance === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {reg.attendance === 'active' ? 'ACTIVE' : 'NOT STARTED'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {reg.enrollment === 'pending' ? (
                    <button className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-medium">
                      Approve
                    </button>
                  ) : (
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
