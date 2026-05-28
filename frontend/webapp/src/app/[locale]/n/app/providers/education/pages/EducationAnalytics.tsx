import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EducationAnalytics() {
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

  const data = [
    { month: 'Jan', registrations: 142, revenue: 112000 },
    { month: 'Feb', registrations: 158, revenue: 128000 },
    { month: 'Mar', registrations: 186, revenue: 142800 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Education Analytics"
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">$142,800</div>
          <div className="text-sm text-green-600 mt-1">+28.4%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Registrations</div>
          <div className="text-2xl font-bold text-gray-900">186</div>
          <div className="text-sm text-green-600 mt-1">+17.7%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Student Growth</div>
          <div className="text-2xl font-bold text-gray-900">1,248</div>
          <div className="text-sm text-green-600 mt-1">+12.3%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Completion Rate</div>
          <div className="text-2xl font-bold text-gray-900">94%</div>
          <div className="text-sm text-green-600 mt-1">+2.1%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Registration Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="registrations" stroke="#083f30" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Top Performing Courses</h3>
          <div className="space-y-4">
            {[
              { name: 'Medical English Course', students: 234, revenue: '$58,500', percentage: 90 },
              { name: 'Healthcare Management', students: 189, revenue: '$47,250', percentage: 70 },
              { name: 'Nursing Skills Training', students: 156, revenue: '$39,000', percentage: 60 },
            ].map((course, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">{course.name}</span>
                  <span className="font-semibold">{course.revenue}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${course.percentage}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{course.students} students</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Completion Rate</span>
                <span className="text-2xl font-bold text-green-900">94%</span>
              </div>
              <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: '94%' }} />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Certificate Issuance</span>
                <span className="text-2xl font-bold text-blue-900">89</span>
              </div>
              <div className="text-xs text-gray-600">This month</div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Dropout Rate</span>
                <span className="text-2xl font-bold text-red-900">6%</span>
              </div>
              <div className="w-full h-2 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-600" style={{ width: '6%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
