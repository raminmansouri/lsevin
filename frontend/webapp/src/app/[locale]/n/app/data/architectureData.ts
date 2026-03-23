// Flow and screen definitions for LSevin architecture

export interface FlowNode {
  id: string;
  title: string;
  type: 'screen' | 'decision' | 'start' | 'end';
  stage: 'entry' | 'discover' | 'evaluate' | 'book' | 'care' | 'personal';
  module: string;
  position: { x: number; y: number };
  connections?: string[];
  description?: string;
}

export const flows: FlowNode[] = [
  // ENTRY FLOW
  { id: 'start', title: 'App Launch', type: 'start', stage: 'entry', module: 'Core', position: { x: 100, y: 100 }, connections: ['splash'] },
  { id: 'splash', title: 'Splash Screen', type: 'screen', stage: 'entry', module: 'Core', position: { x: 100, y: 200 }, connections: ['lang'] },
  { id: 'lang', title: 'Language Selection', type: 'screen', stage: 'entry', module: 'Core', position: { x: 100, y: 300 }, connections: ['onboarding'] },
  { id: 'onboarding', title: 'Onboarding', type: 'screen', stage: 'entry', module: 'Core', position: { x: 100, y: 400 }, connections: ['auth-decision'] },
  { id: 'auth-decision', title: 'Has Account?', type: 'decision', stage: 'entry', module: 'Core', position: { x: 100, y: 500 }, connections: ['login', 'register'] },
  { id: 'login', title: 'Login', type: 'screen', stage: 'entry', module: 'Auth', position: { x: 50, y: 600 }, connections: ['otp'] },
  { id: 'register', title: 'Register', type: 'screen', stage: 'entry', module: 'Auth', position: { x: 150, y: 600 }, connections: ['otp'] },
  { id: 'otp', title: 'OTP Verification', type: 'screen', stage: 'entry', module: 'Auth', position: { x: 100, y: 700 }, connections: ['profile'] },
  { id: 'profile', title: 'Complete Profile', type: 'screen', stage: 'entry', module: 'Auth', position: { x: 100, y: 800 }, connections: ['location'] },
  { id: 'location', title: 'Location Permission', type: 'screen', stage: 'entry', module: 'Permissions', position: { x: 100, y: 900 }, connections: ['notification'] },
  { id: 'notification', title: 'Notification Permission', type: 'screen', stage: 'entry', module: 'Permissions', position: { x: 100, y: 1000 }, connections: ['home'] },

  // DISCOVER FLOW
  { id: 'home', title: 'Home Dashboard', type: 'screen', stage: 'discover', module: 'Discovery', position: { x: 500, y: 100 }, connections: ['search', 'category', 'map', 'featured'] },
  { id: 'search', title: 'Search', type: 'screen', stage: 'discover', module: 'Discovery', position: { x: 400, y: 250 }, connections: ['search-results'] },
  { id: 'search-results', title: 'Search Results', type: 'screen', stage: 'discover', module: 'Discovery', position: { x: 400, y: 350 }, connections: ['clinic-listing', 'salon-listing', 'gym-listing', 'hotel-listing'] },
  { id: 'category', title: 'Category Browser', type: 'screen', stage: 'discover', module: 'Discovery', position: { x: 550, y: 250 }, connections: ['clinic-listing', 'salon-listing'] },
  { id: 'map', title: 'Map Discovery', type: 'screen', stage: 'discover', module: 'Discovery', position: { x: 700, y: 250 }, connections: ['clinic-listing'] },
  { id: 'featured', title: 'Featured Services', type: 'screen', stage: 'discover', module: 'Discovery', position: { x: 500, y: 400 }, connections: ['trending', 'premium', 'nearby'] },
  { id: 'trending', title: 'Trending Treatments', type: 'screen', stage: 'discover', module: 'Discovery', position: { x: 400, y: 500 }, connections: ['treatment-detail'] },
  { id: 'premium', title: 'Premium Packages', type: 'screen', stage: 'discover', module: 'Discovery', position: { x: 550, y: 500 }, connections: ['treatment-detail'] },
  { id: 'nearby', title: 'Nearby Services', type: 'screen', stage: 'discover', module: 'Discovery', position: { x: 700, y: 500 }, connections: ['clinic-listing'] },
  { id: 'rewards-teaser', title: 'Rewards Teaser', type: 'screen', stage: 'discover', module: 'Loyalty', position: { x: 500, y: 600 }, connections: ['rewards'] },

  // EVALUATE FLOW
  { id: 'clinic-listing', title: 'Clinic Listing', type: 'screen', stage: 'evaluate', module: 'Medical', position: { x: 1000, y: 100 }, connections: ['clinic-detail'] },
  { id: 'clinic-detail', title: 'Clinic Detail', type: 'screen', stage: 'evaluate', module: 'Medical', position: { x: 1000, y: 200 }, connections: ['doctor-profile', 'reviews', 'compare'] },
  { id: 'doctor-profile', title: 'Doctor Profile', type: 'screen', stage: 'evaluate', module: 'Medical', position: { x: 950, y: 300 }, connections: ['treatment-detail', 'certifications'] },
  { id: 'treatment-detail', title: 'Treatment Detail', type: 'screen', stage: 'evaluate', module: 'Medical', position: { x: 1100, y: 300 }, connections: ['country-comparison', 'booking-start'] },
  { id: 'salon-listing', title: 'Salon Listing', type: 'screen', stage: 'evaluate', module: 'Beauty', position: { x: 1000, y: 500 }, connections: ['salon-detail'] },
  { id: 'salon-detail', title: 'Salon Detail', type: 'screen', stage: 'evaluate', module: 'Beauty', position: { x: 1000, y: 600 }, connections: ['reviews', 'booking-start'] },
  { id: 'gym-listing', title: 'Gym Listing', type: 'screen', stage: 'evaluate', module: 'Fitness', position: { x: 1000, y: 750 }, connections: ['gym-detail'] },
  { id: 'gym-detail', title: 'Gym Detail', type: 'screen', stage: 'evaluate', module: 'Fitness', position: { x: 1000, y: 850 }, connections: ['reviews', 'booking-start'] },
  { id: 'hotel-listing', title: 'Hotel Listing', type: 'screen', stage: 'evaluate', module: 'Tourism', position: { x: 1000, y: 1000 }, connections: ['hotel-detail'] },
  { id: 'hotel-detail', title: 'Hotel Detail', type: 'screen', stage: 'evaluate', module: 'Tourism', position: { x: 1000, y: 1100 }, connections: ['reviews', 'booking-start'] },
  { id: 'pharmacy-detail', title: 'Pharmacy Request Detail', type: 'screen', stage: 'evaluate', module: 'Pharmacy', position: { x: 1200, y: 500 }, connections: ['booking-start'] },
  { id: 'course-detail', title: 'Course Detail', type: 'screen', stage: 'evaluate', module: 'Education', position: { x: 1200, y: 650 }, connections: ['booking-start'] },
  { id: 'reviews', title: 'Reviews & Ratings', type: 'screen', stage: 'evaluate', module: 'Shared', position: { x: 1200, y: 200 }, connections: ['booking-start'] },
  { id: 'certifications', title: 'Certifications', type: 'screen', stage: 'evaluate', module: 'Medical', position: { x: 850, y: 400 }, connections: ['booking-start'] },
  { id: 'country-comparison', title: 'Country Comparison', type: 'screen', stage: 'evaluate', module: 'Medical', position: { x: 1200, y: 350 }, connections: ['compare'] },
  { id: 'compare', title: 'Compare Providers', type: 'screen', stage: 'evaluate', module: 'Shared', position: { x: 1100, y: 450 }, connections: ['booking-start'] },

  // BOOK FLOW
  { id: 'booking-start', title: 'Choose Service', type: 'screen', stage: 'book', module: 'Booking', position: { x: 1500, y: 100 }, connections: ['choose-provider'] },
  { id: 'choose-provider', title: 'Choose Provider', type: 'screen', stage: 'book', module: 'Booking', position: { x: 1500, y: 200 }, connections: ['choose-datetime'] },
  { id: 'choose-datetime', title: 'Choose Date/Time', type: 'screen', stage: 'book', module: 'Booking', position: { x: 1500, y: 300 }, connections: ['addons'] },
  { id: 'addons', title: 'Add-ons & Extras', type: 'screen', stage: 'book', module: 'Booking', position: { x: 1500, y: 400 }, connections: ['upload-files'] },
  { id: 'upload-files', title: 'Upload Documents', type: 'screen', stage: 'book', module: 'Booking', position: { x: 1500, y: 500 }, connections: ['booking-summary'] },
  { id: 'booking-summary', title: 'Booking Summary', type: 'screen', stage: 'book', module: 'Booking', position: { x: 1500, y: 600 }, connections: ['currency', 'promo'] },
  { id: 'currency', title: 'Currency Selector', type: 'screen', stage: 'book', module: 'Payment', position: { x: 1400, y: 700 }, connections: ['payment-method'] },
  { id: 'promo', title: 'Promo Code', type: 'screen', stage: 'book', module: 'Payment', position: { x: 1600, y: 700 }, connections: ['payment-method'] },
  { id: 'payment-method', title: 'Payment Method', type: 'screen', stage: 'book', module: 'Payment', position: { x: 1500, y: 800 }, connections: ['payment-type'] },
  { id: 'payment-type', title: 'Deposit/Full/Installment', type: 'decision', stage: 'book', module: 'Payment', position: { x: 1500, y: 900 }, connections: ['wallet-pay', 'installment-pay', 'payment-gateway'] },
  { id: 'wallet-pay', title: 'Wallet Payment', type: 'screen', stage: 'book', module: 'Payment', position: { x: 1350, y: 1000 }, connections: ['payment-success', 'payment-failure'] },
  { id: 'installment-pay', title: 'Installment Payment', type: 'screen', stage: 'book', module: 'Payment', position: { x: 1500, y: 1000 }, connections: ['payment-success', 'payment-failure'] },
  { id: 'payment-gateway', title: 'Payment Gateway', type: 'screen', stage: 'book', module: 'Payment', position: { x: 1650, y: 1000 }, connections: ['payment-success', 'payment-failure'] },
  { id: 'payment-success', title: 'Payment Success', type: 'screen', stage: 'book', module: 'Payment', position: { x: 1450, y: 1150 }, connections: ['receipt', 'bookings-list'] },
  { id: 'payment-failure', title: 'Payment Failure', type: 'screen', stage: 'book', module: 'Payment', position: { x: 1600, y: 1150 }, connections: ['payment-method'] },
  { id: 'receipt', title: 'Receipt', type: 'screen', stage: 'book', module: 'Payment', position: { x: 1500, y: 1250 }, connections: ['bookings-list'] },

  // CARE FLOW
  { id: 'bookings-list', title: 'My Bookings', type: 'screen', stage: 'care', module: 'Care', position: { x: 2000, y: 100 }, connections: ['booking-detail'] },
  { id: 'booking-detail', title: 'Booking Detail', type: 'screen', stage: 'care', module: 'Care', position: { x: 2000, y: 200 }, connections: ['booking-timeline', 'medical-docs', 'support-chat'] },
  { id: 'booking-timeline', title: 'Booking Timeline', type: 'screen', stage: 'care', module: 'Care', position: { x: 1900, y: 300 }, connections: ['travel-checklist'] },
  { id: 'medical-docs', title: 'Medical Documents', type: 'screen', stage: 'care', module: 'Care', position: { x: 2000, y: 400 }, connections: ['invoices'] },
  { id: 'invoices', title: 'Invoices', type: 'screen', stage: 'care', module: 'Care', position: { x: 2100, y: 500 }, connections: ['receipt'] },
  { id: 'support-chat', title: 'Support Chat', type: 'screen', stage: 'care', module: 'Support', position: { x: 2000, y: 600 }, connections: ['ai-assistant'] },
  { id: 'ai-assistant', title: 'AI Assistant', type: 'screen', stage: 'care', module: 'Support', position: { x: 2100, y: 700 }, connections: ['support-chat'] },
  { id: 'travel-checklist', title: 'Travel Checklist', type: 'screen', stage: 'care', module: 'Care', position: { x: 1900, y: 450 }, connections: ['follow-up'] },
  { id: 'follow-up', title: 'Follow-up Care', type: 'screen', stage: 'care', module: 'Care', position: { x: 1900, y: 600 }, connections: ['refund'] },
  { id: 'refund', title: 'Refund/Cancellation', type: 'screen', stage: 'care', module: 'Care', position: { x: 1900, y: 750 }, connections: ['bookings-list'] },

  // PERSONAL AREA FLOW
  { id: 'profile-menu', title: 'Profile Menu', type: 'screen', stage: 'personal', module: 'Profile', position: { x: 2400, y: 100 }, connections: ['profile', 'medical-profile', 'saved', 'wallet', 'rewards', 'settings'] },
  { id: 'profile', title: 'Profile', type: 'screen', stage: 'personal', module: 'Profile', position: { x: 2300, y: 250 }, connections: ['medical-profile'] },
  { id: 'medical-profile', title: 'Medical Profile', type: 'screen', stage: 'personal', module: 'Profile', position: { x: 2300, y: 350 }, connections: ['profile'] },
  { id: 'saved', title: 'Saved Providers/Services', type: 'screen', stage: 'personal', module: 'Profile', position: { x: 2400, y: 450 }, connections: ['clinic-listing', 'salon-listing'] },
  { id: 'wallet', title: 'Wallet', type: 'screen', stage: 'personal', module: 'Wallet', position: { x: 2500, y: 250 }, connections: ['wallet-pay'] },
  { id: 'rewards', title: 'Rewards & Loyalty', type: 'screen', stage: 'personal', module: 'Loyalty', position: { x: 2500, y: 350 }, connections: ['coupons', 'referrals'] },
  { id: 'coupons', title: 'Coupons', type: 'screen', stage: 'personal', module: 'Loyalty', position: { x: 2600, y: 450 }, connections: ['promo'] },
  { id: 'referrals', title: 'Referrals', type: 'screen', stage: 'personal', module: 'Loyalty', position: { x: 2600, y: 550 }, connections: ['rewards'] },
  { id: 'notifications', title: 'Notifications', type: 'screen', stage: 'personal', module: 'Settings', position: { x: 2400, y: 650 }, connections: ['settings'] },
  { id: 'settings', title: 'Settings', type: 'screen', stage: 'personal', module: 'Settings', position: { x: 2500, y: 650 }, connections: ['lang-settings', 'currency-settings', 'security'] },
  { id: 'lang-settings', title: 'Language Settings', type: 'screen', stage: 'personal', module: 'Settings', position: { x: 2400, y: 800 }, connections: ['settings'] },
  { id: 'currency-settings', title: 'Currency Settings', type: 'screen', stage: 'personal', module: 'Settings', position: { x: 2500, y: 800 }, connections: ['settings'] },
  { id: 'security', title: 'Security', type: 'screen', stage: 'personal', module: 'Settings', position: { x: 2600, y: 800 }, connections: ['otp'] },
];

export const stages = [
  { id: 'entry', name: 'Entry', color: '#6366f1' },
  { id: 'discover', name: 'Discover', color: '#10b981' },
  { id: 'evaluate', name: 'Evaluate', color: '#f59e0b' },
  { id: 'book', name: 'Book', color: '#ef4444' },
  { id: 'care', name: 'Care', color: '#8b5cf6' },
  { id: 'personal', name: 'Personal Area', color: '#ec4899' },
];

export const modules = [
  { name: 'Core', color: '#083f30' },
  { name: 'Auth', color: '#0a5a44' },
  { name: 'Permissions', color: '#0c6b51' },
  { name: 'Discovery', color: '#10b981' },
  { name: 'Medical', color: '#dc2626' },
  { name: 'Beauty', color: '#ec4899' },
  { name: 'Fitness', color: '#8b5cf6' },
  { name: 'Tourism', color: '#0ea5e9' },
  { name: 'Pharmacy', color: '#14b8a6' },
  { name: 'Education', color: '#f59e0b' },
  { name: 'Booking', color: '#ef4444' },
  { name: 'Payment', color: '#eacb7f' },
  { name: 'Care', color: '#8b5cf6' },
  { name: 'Support', color: '#6366f1' },
  { name: 'Wallet', color: '#eacb7f' },
  { name: 'Loyalty', color: '#f97316' },
  { name: 'Profile', color: '#ec4899' },
  { name: 'Settings', color: '#64748b' },
  { name: 'Shared', color: '#94a3b8' },
];

export const userRoles = [
  { name: 'End User / Patient', icon: '👤', color: '#083f30' },
  { name: 'Clinic / Hospital', icon: '🏥', color: '#dc2626' },
  { name: 'Doctor', icon: '⚕️', color: '#0284c7' },
  { name: 'Beauty Salon / Spa', icon: '💅', color: '#ec4899' },
  { name: 'Gym / Trainer', icon: '💪', color: '#8b5cf6' },
  { name: 'Hotel / Tourism', icon: '🏨', color: '#0ea5e9' },
  { name: 'Pharmacy', icon: '💊', color: '#14b8a6' },
  { name: 'Education Provider', icon: '🎓', color: '#f59e0b' },
  { name: 'Super Admin', icon: '⚙️', color: '#64748b' },
];
