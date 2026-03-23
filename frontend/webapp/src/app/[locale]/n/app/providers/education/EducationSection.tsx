import ProviderSectionPlaceholder from '../ProviderSectionPlaceholder';
import { LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck } from 'lucide-react';

export default function EducationSection({ title }: { title: string }) {
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
    <ProviderSectionPlaceholder
      navigation={navigation}
      sectionTitle={title}
      providerName="Global Learning Academy"
      userName="Prof. David Chen"
      dashboardPath="/provider/education/dashboard"
    />
  );
}
