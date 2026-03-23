import { DashboardLayout, StatCard } from '../../design-system/dashboard-components';
import { 
  LayoutDashboard,
  Calendar,
  Users,
  GraduationCap,
  DollarSign,
  BookOpen,
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings,
  Award,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function EducationDashboard() {
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
      headerTitle="Education Dashboard"
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, Professor Chen!</h2>
            <p className="text-white/80 mb-4">Your institution performance overview</p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold">1,248</div>
                <div className="text-sm text-white/80">Active Students</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">42</div>
                <div className="text-sm text-white/80">Active Courses</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">94%</div>
                <div className="text-sm text-white/80">Completion Rate</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold text-sm mb-2">
              Accredited Institution
            </div>
            <div className="text-sm text-white/80">ISO 9001 Certified</div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Monthly Revenue"
          value="$142,800"
          change={{ value: '+28.4%', trend: 'up' }}
          icon={<DollarSign size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="New Enrollments"
          value="186"
          change={{ value: '+42', trend: 'up' }}
          icon={<UserCheck size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Active Courses"
          value="42"
          change={{ value: '+3', trend: 'up' }}
          icon={<BookOpen size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Certificates Issued"
          value="89"
          icon={<Award size={20} className="text-amber-600" />}
          color="bg-amber-50"
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Enrollment Trends */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Enrollment Trends</h3>
            <select className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            Line Chart - Monthly Enrollments
          </div>
        </div>
        
        {/* Top Courses */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Top Performing Courses</h3>
          <div className="space-y-4">
            {[
              { name: 'Medical English Course', students: 234, revenue: '$58,500', rating: 4.9, color: 'bg-amber-500', percentage: 90 },
              { name: 'Healthcare Management', students: 189, revenue: '$47,250', rating: 4.8, color: 'bg-blue-500', percentage: 75 },
              { name: 'Nursing Skills Training', students: 156, revenue: '$39,000', rating: 4.7, color: 'bg-purple-500', percentage: 60 },
              { name: 'Medical Terminology', students: 124, revenue: '$31,000', rating: 4.9, color: 'bg-green-500', percentage: 50 },
            ].map(course => (
              <div key={course.name}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{course.name}</span>
                    <div className="text-xs text-gray-600 mt-1">★ {course.rating} rating</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{course.revenue}</div>
                    <div className="text-xs text-gray-500">{course.students} students</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${course.color}`}
                    style={{ width: `${course.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Registrations & Schedule */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Pending Registrations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Pending Registrations</h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">18 New</span>
            </div>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-3">
            {[
              { student: 'Emma Rodriguez', course: 'Medical English Course', submitted: '2 hours ago', status: 'pending', fee: '$250' },
              { student: 'Ali Mohammed', course: 'Healthcare Management', submitted: '4 hours ago', status: 'pending', fee: '$250' },
              { student: 'Sophie Chen', course: 'Nursing Skills Training', submitted: '6 hours ago', status: 'reviewing', fee: '$250' },
              { student: 'James Wilson', course: 'Medical Terminology', submitted: '1 day ago', status: 'approved', fee: '$250' },
            ].map((registration, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-2 ${
                registration.status === 'approved' ? 'bg-green-50 border-green-200' :
                registration.status === 'reviewing' ? 'bg-blue-50 border-blue-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{registration.student}</div>
                    <div className="text-sm text-gray-700 mt-1">{registration.course}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    registration.status === 'approved' ? 'bg-green-100 text-green-700' :
                    registration.status === 'reviewing' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {registration.status}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                  <div>{registration.submitted}</div>
                  <div className="font-semibold text-gray-900">{registration.fee}</div>
                </div>
                {registration.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 py-1.5 bg-[#083f30] text-white rounded-lg text-xs font-medium hover:bg-[#083f30]/90 transition">
                      Approve
                    </button>
                    <button className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition">
                      Review
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Today's Class Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Today's Classes</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">Full Calendar</button>
          </div>
          
          <div className="space-y-3">
            {[
              { time: '09:00', course: 'Medical English - Level 2', instructor: 'Prof. Sarah Johnson', room: 'Room A1', students: 24, mode: 'in-person', status: 'completed' },
              { time: '11:00', course: 'Healthcare Management', instructor: 'Dr. Michael Brown', room: 'Room B2', students: 18, mode: 'in-person', status: 'ongoing' },
              { time: '14:00', course: 'Nursing Skills Training', instructor: 'Lisa Anderson', room: 'Lab 1', students: 16, mode: 'in-person', status: 'upcoming' },
              { time: '16:00', course: 'Medical Terminology', instructor: 'Prof. David Chen', room: 'Online', students: 32, mode: 'online', status: 'upcoming' },
            ].map((classItem, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                classItem.status === 'completed' ? 'bg-gray-50 border-gray-200' :
                classItem.status === 'ongoing' ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="text-center min-w-[60px]">
                    <div className="text-sm font-bold text-[#083f30]">{classItem.time}</div>
                    <div className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                      classItem.mode === 'online' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {classItem.mode}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{classItem.course}</div>
                    <div className="text-xs text-gray-600 mt-1">{classItem.instructor}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {classItem.room} • {classItem.students} students
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    classItem.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    classItem.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {classItem.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Student Performance & Certificates */}
      <div className="grid grid-cols-2 gap-6">
        {/* Course Completion Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Active Courses Progress</h3>
          
          <div className="space-y-4">
            {[
              { course: 'Medical English - Level 2', enrolled: 24, completed: 18, inProgress: 6, completion: 75 },
              { course: 'Healthcare Management', enrolled: 18, completed: 12, inProgress: 6, completion: 67 },
              { course: 'Nursing Skills Training', enrolled: 16, completed: 14, inProgress: 2, completion: 88 },
              { course: 'Medical Terminology', enrolled: 32, completed: 28, inProgress: 4, completion: 88 },
            ].map(course => (
              <div key={course.course} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900">{course.course}</div>
                  <div className="text-sm font-semibold text-gray-900">{course.completion}%</div>
                </div>
                
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${course.completion}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-semibold text-gray-900">{course.enrolled}</div>
                    <div className="text-gray-600">Enrolled</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-semibold text-blue-600">{course.inProgress}</div>
                    <div className="text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-semibold text-green-600">{course.completed}</div>
                    <div className="text-gray-600">Completed</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Certificates */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Recent Certificates Issued</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {[
              { student: 'Emma Rodriguez', course: 'Medical English Course', grade: 'A+', issued: '2 hours ago', certificateId: 'CERT-2847' },
              { student: 'James Wilson', course: 'Healthcare Management', grade: 'A', issued: '5 hours ago', certificateId: 'CERT-2846' },
              { student: 'Sophie Chen', course: 'Nursing Skills Training', grade: 'A+', issued: '1 day ago', certificateId: 'CERT-2845' },
              { student: 'Ali Mohammed', course: 'Medical Terminology', grade: 'B+', issued: '1 day ago', certificateId: 'CERT-2844' },
            ].map((cert, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{cert.student}</div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        cert.grade.startsWith('A') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {cert.grade}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{cert.course}</div>
                  </div>
                  <Award className="text-amber-500" size={24} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                  <div>{cert.certificateId}</div>
                  <div>{cert.issued}</div>
                </div>
                <button className="mt-3 w-full py-2 bg-[#083f30] text-white rounded-lg text-xs font-medium hover:bg-[#083f30]/90 transition">
                  Download Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
