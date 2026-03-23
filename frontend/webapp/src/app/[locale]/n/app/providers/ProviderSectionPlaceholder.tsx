import { DashboardLayout } from '../design-system/dashboard-components';
import { useLocation, Link } from 'react-router';
import { Construction } from 'lucide-react';

interface ProviderSectionPlaceholderProps {
  navigation: any[];
  sectionTitle: string;
  providerName: string;
  userName: string;
  dashboardPath: string;
}

export default function ProviderSectionPlaceholder({
  navigation,
  sectionTitle,
  providerName,
  userName,
  dashboardPath
}: ProviderSectionPlaceholderProps) {
  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle={sectionTitle}
      userRole="provider"
      userName={userName}
      providerName={providerName}
    >
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Construction size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Section Under Development</h2>
          <p className="text-gray-600 mb-6">
            This section is currently being built. Please check back soon for updates.
          </p>
          <Link
            to={dashboardPath}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#083f30]/90 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
