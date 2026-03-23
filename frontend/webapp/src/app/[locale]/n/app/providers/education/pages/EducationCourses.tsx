import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck,
  Plus, Star, Globe, Video, MapPin
} from 'lucide-react';

export default function EducationCourses() {
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

  const courses = [
    { id: 'CRS-8402', title: 'Medical English Course', category: 'Language', mode: 'hybrid', duration: '12 weeks', instructors: 3, price: 250, status: 'active', featured: true, enrolled: 234 },
    { id: 'CRS-8403', title: 'Healthcare Management', category: 'Business', mode: 'online', duration: '8 weeks', instructors: 2, price: 250, status: 'active', featured: true, enrolled: 189 },
    { id: 'CRS-8404', title: 'Nursing Skills Training', category: 'Clinical', mode: 'offline', duration: '16 weeks', instructors: 4, price: 250, status: 'active', featured: false, enrolled: 156 },
    { id: 'CRS-8405', title: 'Medical Terminology', category: 'Language', mode: 'online', duration: '6 weeks', instructors: 2, price: 250, status: 'active', featured: false, enrolled: 124 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Course Management"
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Course Catalog</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Add Course
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Courses</div>
          <div className="text-2xl font-bold text-gray-900">42</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active</div>
          <div className="text-2xl font-bold text-green-900">38</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Students</div>
          <div className="text-2xl font-bold text-blue-900">1,248</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
          <div className="text-2xl font-bold text-amber-900">$142,800</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="font-bold text-gray-900 text-lg">{course.title}</h4>
                  {course.featured && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                      <Star size={12} />
                      Featured
                    </div>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {course.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Course ID</div>
                    <div className="text-sm font-medium text-gray-900">{course.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Category</div>
                    <div className="text-sm font-medium text-gray-900">{course.category}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Mode</div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      {course.mode === 'online' ? <Globe size={14} className="text-purple-600" /> :
                       course.mode === 'offline' ? <MapPin size={14} className="text-blue-600" /> :
                       <Video size={14} className="text-green-600" />}
                      {course.mode}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Duration</div>
                    <div className="text-sm font-medium text-gray-900">{course.duration}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Instructors</div>
                    <div className="text-sm font-medium text-gray-900">{course.instructors} assigned</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Price</div>
                    <div className="text-sm font-bold text-gray-900">${course.price}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                    <Users size={16} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">{course.enrolled} enrolled</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Edit
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
