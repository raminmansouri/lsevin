import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Button } from '../../design-system/components';

export default function NotificationPermission() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL } = useLocalization();
  
  const handleEnable = () => {
    // Request notification permission
    navigate('/app/home');
  };
  
  const handleSkip = () => {
    navigate('/app/home');
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Illustration */}
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-[#eacb7f] to-amber-300 rounded-full flex items-center justify-center relative">
            <Bell size={64} className="text-[#083f30]" strokeWidth={1.5} />
            <div className={`absolute -top-1 w-8 h-8 bg-red-500 rounded-full border-4 border-white flex items-center justify-center ${isRTL ? '-left-1' : '-right-1'}`}>
              <span className="text-white text-xs font-bold">1</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('permissions.notificationTitle')}
          </h1>
          
          <p className="text-lg text-gray-600 leading-relaxed max-w-sm mx-auto">
            {t('permissions.notificationSubtitle')}
          </p>
          
          <div className="mt-8 space-y-3 text-left max-w-sm mx-auto">
            {(t('permissions.notificationBenefits', { returnObjects: true }) as string[]).map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#083f30] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom Actions */}
      <div className="px-6 py-6 space-y-3 border-t border-gray-200">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          onClick={handleEnable}
        >
          {t('permissions.enableNotifications')}
        </Button>
        
        <button
          onClick={handleSkip}
          className="w-full h-12 text-gray-600 font-medium hover:text-gray-900 transition"
        >
          {t('permissions.getStarted')}
        </button>
      </div>
    </div>
  );
}