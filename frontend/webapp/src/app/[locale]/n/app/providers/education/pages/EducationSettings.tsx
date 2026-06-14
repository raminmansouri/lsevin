import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck,
  Phone, Mail, MapPin, Bell, Building
} from 'lucide-react';

export default function EducationSettings() {
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

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Institution Settings"
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
    >
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Institution Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-gray-400" />
                  <input
                    type="text"
                    defaultValue="Global Learning Academy"
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <input
                      type="tel"
                      defaultValue="+971 4 567 8901"
                      className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <input
                      type="email"
                      defaultValue="info@globallearning.ae"
                      className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <input
                    type="text"
                    defaultValue="Business Bay, Dubai, UAE"
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Registration Rules</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Approval</label>
                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-900">Auto-approve registrations for open courses</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Limit per Course</label>
                <input
                  type="number"
                  defaultValue="50"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Course Policy</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Attendance (%)</label>
                <input
                  type="number"
                  defaultValue="75"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passing Grade (%)</label>
                <input
                  type="number"
                  defaultValue="70"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Certificate Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Issue Certificates</label>
                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-900">Issue certificates automatically upon course completion</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Template</label>
                <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <option>Standard Template</option>
                  <option>Premium Template</option>
                  <option>Custom Template</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell size={20} className="text-amber-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-3">
              {['New registrations', 'Course completions', 'Student inquiries', 'Payment updates', 'Certificate requests'].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-sm text-gray-900">{item}</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Accreditation</h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-xs font-medium text-gray-900">ISO 9001</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">Valid</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-xs font-medium text-gray-900">Accredited</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">Active</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44]">
              Save Changes
            </button>
            <button className="w-full h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
