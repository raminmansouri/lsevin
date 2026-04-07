import { createBrowserRouter } from "react-router";
import MobileRoot from "./mobile/MobileRoot";
import { Navigate, useParams } from "react-router";

// Redirect component for clinic treatments
function ClinicTreatmentsRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/clinic/${id}`} replace />;
}

// Entry Flow
import Splash from "./mobile/entry/Splash";
import LanguageSelection from "./mobile/entry/LanguageSelection";
import Onboarding from "./mobile/entry/Onboarding";
import Login from "./mobile/entry/Login";
import Register from "./mobile/entry/Register";
import OTPVerification from "./mobile/entry/OTPVerification";
import CompleteProfile from "./mobile/entry/CompleteProfile";
import LocationPermission from "./mobile/entry/LocationPermission";
import NotificationPermission from "./mobile/entry/NotificationPermission";

// Main App
import Home from "./mobile/home/page";
import Explore from "./mobile/explore/page";
import Bookings from "./mobile/bookings/page";
import Profile from "./mobile/profile/page";
import Offers from "./mobile/offers/page";

// Discovery
import Search from "./mobile/search/page";
import SearchResults from "./mobile/search-results/page";
import CategoryBrowser from "./mobile/categories/page";
import MapDiscovery from "./mobile/search/map/page";

// Medical
import ClinicListing from "./mobile/medical/clinics/page";
import ClinicDetail from "./mobile/medical/ClinicDetail";
import DoctorProfile from "./mobile/medical/DoctorProfile";
import TreatmentDetail from "./mobile/medical/TreatmentDetail";

// Booking Flow
import BookingFlow from "./mobile/booking/BookingFlow";
import PaymentSuccess from "./mobile/booking/PaymentSuccess";

// Care
import BookingDetail from "./mobile/bookings/[id]/page";
import SupportChat from "./mobile/care/SupportChat";

// Profile & Settings
import Wallet from "./mobile/profile/Wallet";
import Rewards from "./mobile/profile/rewards/page";
import Settings from "./mobile/profile/Settings";
import Favorites from "./mobile/profile/Favorites";
import MedicalProfile from "./mobile/profile/MedicalProfile";
import Notifications from "./mobile/notifications/page";
import PrivacySecurity from "./mobile/profile/PrivacySecurity";
import EditProfile from "./mobile/profile/EditProfile";
import Transactions from "./mobile/profile/Transactions";
import TransactionDetail from "./mobile/profile/TransactionDetail";
import Coupon from "./mobile/profile/Coupon";
import ShareFriends from "./mobile/profile/ShareFriends";

// Admin Panel
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import ProviderApprovalQueue from "./admin/ProviderApprovalQueue";
import LiveActivity from "./admin/LiveActivity";
import Users from "./admin/Users";
import AdminBookings from "./admin/AdminBookings";
import Payments from "./admin/Payments";
import Campaigns from "./admin/Campaigns";
import AdminRewards from "./admin/AdminRewards";
import Support from "./admin/Support";
import Reports from "./admin/Reports";
import Localization from "./admin/Localization";
import AdminSettings from "./admin/AdminSettings";
import AuditLogs from "./admin/AuditLogs";

// Provider Panels
import ProviderLogin from "./providers/ProviderLogin";
import ClinicDashboard from "./providers/clinic/ClinicDashboard";
import DoctorDashboard from "./providers/doctor/DoctorDashboard";
import BeautySalonDashboard from "./providers/salon/BeautySalonDashboard";
import GymDashboard from "./providers/gym/GymDashboard";
import HotelDashboard from "./providers/hotel/HotelDashboard";
import TourismDashboard from "./providers/tourism/TourismDashboard";
import PharmacyDashboard from "./providers/pharmacy/PharmacyDashboard";
import EducationDashboard from "./providers/education/EducationDashboard";

// Provider Sections
import ClinicSection from "./providers/clinic/ClinicSection";
import DoctorSection from "./providers/doctor/DoctorSection";
import SalonSection from "./providers/salon/SalonSection";
import GymSection from "./providers/gym/GymSection";
import HotelSection from "./providers/hotel/HotelSection";
import TourismSection from "./providers/tourism/TourismSection";
import PharmacySection from "./providers/pharmacy/PharmacySection";
import EducationSection from "./providers/education/EducationSection";

// Clinic Pages
import ClinicBookings from "./providers/clinic/pages/ClinicBookings";
import ClinicDoctors from "./providers/clinic/pages/ClinicDoctors";
import ClinicTreatments from "./providers/clinic/pages/ClinicTreatments";
import ClinicPricing from "./providers/clinic/pages/ClinicPricing";
import ClinicAvailability from "./providers/clinic/pages/ClinicAvailability";
import ClinicMedia from "./providers/clinic/pages/ClinicMedia";
import ClinicReviews from "./providers/clinic/pages/ClinicReviews";
import ClinicPromotions from "./providers/clinic/pages/ClinicPromotions";
import ClinicAnalytics from "./providers/clinic/pages/ClinicAnalytics";
import ClinicBilling from "./providers/clinic/pages/ClinicBilling";
import ClinicSupport from "./providers/clinic/pages/ClinicSupport";
import ClinicSettings from "./providers/clinic/pages/ClinicSettings";

// Doctor Pages
import DoctorSchedule from "./providers/doctor/pages/DoctorSchedule";
import DoctorConsultations from "./providers/doctor/pages/DoctorConsultations";
import DoctorBookings from "./providers/doctor/pages/DoctorBookings";
import DoctorServices from "./providers/doctor/pages/DoctorServices";
import DoctorProfilePage from "./providers/doctor/pages/DoctorProfile";
import DoctorEarnings from "./providers/doctor/pages/DoctorEarnings";
import DoctorReviews from "./providers/doctor/pages/DoctorReviews";
import DoctorSettings from "./providers/doctor/pages/DoctorSettings";

// Salon Pages
import SalonBookings from "./providers/salon/pages/SalonBookings";
import SalonStaff from "./providers/salon/pages/SalonStaff";
import SalonServices from "./providers/salon/pages/SalonServices";
import SalonTimeslots from "./providers/salon/pages/SalonTimeslots";
import SalonPricing from "./providers/salon/pages/SalonPricing";
import SalonOffers from "./providers/salon/pages/SalonOffers";
import SalonGallery from "./providers/salon/pages/SalonGallery";
import SalonReviews from "./providers/salon/pages/SalonReviews";
import SalonAnalytics from "./providers/salon/pages/SalonAnalytics";
import SalonSupport from "./providers/salon/pages/SalonSupport";
import SalonSettings from "./providers/salon/pages/SalonSettings";

// Gym Pages
import GymSchedule from "./providers/gym/pages/GymSchedule";
import GymTrainers from "./providers/gym/pages/GymTrainers";
import GymMemberships from "./providers/gym/pages/GymMemberships";
import GymServices from "./providers/gym/pages/GymServices";
import GymBookings from "./providers/gym/pages/GymBookings";
import GymLiveStatus from "./providers/gym/pages/GymLiveStatus";
import GymOffers from "./providers/gym/pages/GymOffers";
import GymAnalytics from "./providers/gym/pages/GymAnalytics";
import GymBilling from "./providers/gym/pages/GymBilling";
import GymSupport from "./providers/gym/pages/GymSupport";
import GymSettings from "./providers/gym/pages/GymSettings";

// Hotel Pages
import HotelBookings from "./providers/hotel/pages/HotelBookings";
import HotelRooms from "./providers/hotel/pages/HotelRooms";
import HotelCategories from "./providers/hotel/pages/HotelCategories";
import HotelAmenities from "./providers/hotel/pages/HotelAmenities";
import HotelPricing from "./providers/hotel/pages/HotelPricing";
import HotelAvailability from "./providers/hotel/pages/HotelAvailability";
import HotelGallery from "./providers/hotel/pages/HotelGallery";
import HotelReviews from "./providers/hotel/pages/HotelReviews";
import HotelAnalytics from "./providers/hotel/pages/HotelAnalytics";
import HotelBilling from "./providers/hotel/pages/HotelBilling";
import HotelSupport from "./providers/hotel/pages/HotelSupport";
import HotelSettings from "./providers/hotel/pages/HotelSettings";

// Tourism Pages
import TourismBookings from "./providers/tourism/pages/TourismBookings";
import TourismPackages from "./providers/tourism/pages/TourismPackages";
import TourismDestinations from "./providers/tourism/pages/TourismDestinations";
import TourismTransfers from "./providers/tourism/pages/TourismTransfers";
import TourismSchedule from "./providers/tourism/pages/TourismSchedule";
import TourismPricing from "./providers/tourism/pages/TourismPricing";
import TourismMedia from "./providers/tourism/pages/TourismMedia";
import TourismAnalytics from "./providers/tourism/pages/TourismAnalytics";
import TourismBilling from "./providers/tourism/pages/TourismBilling";
import TourismSupport from "./providers/tourism/pages/TourismSupport";
import TourismSettings from "./providers/tourism/pages/TourismSettings";

// Pharmacy Pages
import PharmacyPrescriptions from "./providers/pharmacy/pages/PharmacyPrescriptions";
import PharmacyRequests from "./providers/pharmacy/pages/PharmacyRequests";
import PharmacyOrders from "./providers/pharmacy/pages/PharmacyOrders";
import PharmacyDelivery from "./providers/pharmacy/pages/PharmacyDelivery";
import PharmacyInventory from "./providers/pharmacy/pages/PharmacyInventory";
import PharmacyPricing from "./providers/pharmacy/pages/PharmacyPricing";
import PharmacyHours from "./providers/pharmacy/pages/PharmacyHours";
import PharmacyAnalytics from "./providers/pharmacy/pages/PharmacyAnalytics";
import PharmacyBilling from "./providers/pharmacy/pages/PharmacyBilling";
import PharmacySupport from "./providers/pharmacy/pages/PharmacySupport";
import PharmacySettings from "./providers/pharmacy/pages/PharmacySettings";

// Education Pages
import EducationCourses from "./providers/education/pages/EducationCourses";
import EducationRegistrations from "./providers/education/pages/EducationRegistrations";
import EducationStudents from "./providers/education/pages/EducationStudents";
import EducationInstructors from "./providers/education/pages/EducationInstructors";
import EducationSchedule from "./providers/education/pages/EducationSchedule";
import EducationCertificates from "./providers/education/pages/EducationCertificates";
import EducationAnalytics from "./providers/education/pages/EducationAnalytics";
import EducationBilling from "./providers/education/pages/EducationBilling";
import EducationSupport from "./providers/education/pages/EducationSupport";
import EducationSettings from "./providers/education/pages/EducationSettings";

// Provider Onboarding
import ClinicOnboarding from "./providers/onboarding/ClinicOnboarding";
import DoctorOnboarding from "./providers/onboarding/DoctorOnboarding";
import SalonOnboarding from "./providers/onboarding/SalonOnboarding";
import GymOnboarding from "./providers/onboarding/GymOnboarding";
import HotelOnboarding from "./providers/onboarding/HotelOnboarding";
import TourismOnboarding from "./providers/onboarding/TourismOnboarding";
import PharmacyOnboarding from "./providers/onboarding/PharmacyOnboarding";
import EducationOnboarding from "./providers/onboarding/EducationOnboarding";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Splash,
  },
  {
    path: "/language",
    Component: LanguageSelection,
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/otp",
    Component: OTPVerification,
  },
  {
    path: "/complete-profile",
    Component: CompleteProfile,
  },
  {
    path: "/location-permission",
    Component: LocationPermission,
  },
  {
    path: "/notification-permission",
    Component: NotificationPermission,
  },
  
  // Mobile App Routes
  {
    path: "/app",
    Component: MobileRoot,
    children: [
      { path: "home", Component: Home },
      { path: "explore", Component: Explore },
      { path: "bookings", Component: Bookings },
      { path: "profile", Component: Profile },
      { path: "offers", Component: Offers },
      { path: "search", Component: Search },
      { path: "search-results", Component: SearchResults },
      { path: "categories", Component: CategoryBrowser },
      { path: "map", Component: MapDiscovery },
      { path: "clinics", Component: ClinicListing },
      { path: "clinic/:id", Component: ClinicDetail },
      { path: "clinic/:id/treatments", element: <ClinicTreatmentsRedirect /> },
      { path: "doctor/:id", Component: DoctorProfile },
      { path: "treatment/:id", Component: TreatmentDetail },
      // Redirect other service types to explore for now
      { path: "pharmacy", element: <Navigate to="/app/explore" replace /> },
      { path: "salon", element: <Navigate to="/app/explore" replace /> },
      { path: "beauty", element: <Navigate to="/app/explore" replace /> },
      { path: "gym", element: <Navigate to="/app/explore" replace /> },
      { path: "fitness", element: <Navigate to="/app/explore" replace /> },
      { path: "hotel", element: <Navigate to="/app/explore" replace /> },
      { path: "tourism", element: <Navigate to="/app/explore" replace /> },
      { path: "education", element: <Navigate to="/app/explore" replace /> },
      { path: "booking/:serviceId", Component: BookingFlow },
      { path: "booking/success", Component: PaymentSuccess },
      { path: "booking-detail/:id", Component: BookingDetail },
      { path: "support", Component: SupportChat },
      { path: "wallet", Component: Wallet },
      { path: "rewards", Component: Rewards },
      { path: "settings", Component: Settings },
      { path: "favorites", Component: Favorites },
      { path: "medical-profile", Component: MedicalProfile },
      { path: "notifications", Component: Notifications },
      { path: "privacy-security", Component: PrivacySecurity },
      { path: "security", element: <Navigate to="/app/privacy-security" replace /> },
      { path: "edit-profile", Component: EditProfile },
      { path: "wallet/history", Component: Transactions },
      { path: "wallet/transaction/:id", Component: TransactionDetail },
      { path: "coupon", Component: Coupon },
      { path: "share", Component: ShareFriends },
    ],
  },
  
  // Admin Panel Routes
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
  },
  {
    path: "/admin/providers",
    Component: ProviderApprovalQueue,
  },
  {
    path: "/admin/bookings",
    Component: AdminBookings,
  },
  {
    path: "/admin/users",
    Component: Users,
  },
  {
    path: "/admin/payments",
    Component: Payments,
  },
  {
    path: "/admin/activity",
    Component: LiveActivity,
  },
  {
    path: "/admin/campaigns",
    Component: Campaigns,
  },
  {
    path: "/admin/rewards",
    Component: AdminRewards,
  },
  {
    path: "/admin/support",
    Component: Support,
  },
  {
    path: "/admin/reports",
    Component: Reports,
  },
  {
    path: "/admin/localization",
    Component: Localization,
  },
  {
    path: "/admin/settings",
    Component: AdminSettings,
  },
  {
    path: "/admin/audit",
    Component: AuditLogs,
  },
  
  // Provider Panel Routes
  {
    path: "/provider/login",
    Component: ProviderLogin,
  },
  {
    path: "/provider/clinic/dashboard",
    Component: ClinicDashboard,
  },
  {
    path: "/provider/doctor/dashboard",
    Component: DoctorDashboard,
  },
  {
    path: "/provider/salon/dashboard",
    Component: BeautySalonDashboard,
  },
  {
    path: "/provider/gym/dashboard",
    Component: GymDashboard,
  },
  {
    path: "/provider/hotel/dashboard",
    Component: HotelDashboard,
  },
  {
    path: "/provider/tourism/dashboard",
    Component: TourismDashboard,
  },
  {
    path: "/provider/pharmacy/dashboard",
    Component: PharmacyDashboard,
  },
  {
    path: "/provider/education/dashboard",
    Component: EducationDashboard,
  },
  
  // Clinic Section Routes
  { path: "/provider/clinic/bookings", Component: ClinicBookings },
  { path: "/provider/clinic/doctors", Component: ClinicDoctors },
  { path: "/provider/clinic/treatments", Component: ClinicTreatments },
  { path: "/provider/clinic/pricing", Component: ClinicPricing },
  { path: "/provider/clinic/availability", Component: ClinicAvailability },
  { path: "/provider/clinic/media", Component: ClinicMedia },
  { path: "/provider/clinic/reviews", Component: ClinicReviews },
  { path: "/provider/clinic/promotions", Component: ClinicPromotions },
  { path: "/provider/clinic/analytics", Component: ClinicAnalytics },
  { path: "/provider/clinic/billing", Component: ClinicBilling },
  { path: "/provider/clinic/support", Component: ClinicSupport },
  { path: "/provider/clinic/settings", Component: ClinicSettings },
  
  // Doctor Section Routes
  { path: "/provider/doctor/schedule", Component: DoctorSchedule },
  { path: "/provider/doctor/consultations", Component: DoctorConsultations },
  { path: "/provider/doctor/bookings", Component: DoctorBookings },
  { path: "/provider/doctor/services", Component: DoctorServices },
  { path: "/provider/doctor/profile", Component: DoctorProfilePage },
  { path: "/provider/doctor/earnings", Component: DoctorEarnings },
  { path: "/provider/doctor/reviews", Component: DoctorReviews },
  { path: "/provider/doctor/settings", Component: DoctorSettings },
  
  // Salon Section Routes
  { path: "/provider/salon/bookings", Component: SalonBookings },
  { path: "/provider/salon/staff", Component: SalonStaff },
  { path: "/provider/salon/services", Component: SalonServices },
  { path: "/provider/salon/timeslots", Component: SalonTimeslots },
  { path: "/provider/salon/pricing", Component: SalonPricing },
  { path: "/provider/salon/offers", Component: SalonOffers },
  { path: "/provider/salon/gallery", Component: SalonGallery },
  { path: "/provider/salon/reviews", Component: SalonReviews },
  { path: "/provider/salon/analytics", Component: SalonAnalytics },
  { path: "/provider/salon/support", Component: SalonSupport },
  { path: "/provider/salon/settings", Component: SalonSettings },
  
  // Gym Section Routes
  { path: "/provider/gym/schedule", Component: GymSchedule },
  { path: "/provider/gym/trainers", Component: GymTrainers },
  { path: "/provider/gym/memberships", Component: GymMemberships },
  { path: "/provider/gym/services", Component: GymServices },
  { path: "/provider/gym/bookings", Component: GymBookings },
  { path: "/provider/gym/live-status", Component: GymLiveStatus },
  { path: "/provider/gym/offers", Component: GymOffers },
  { path: "/provider/gym/analytics", Component: GymAnalytics },
  { path: "/provider/gym/billing", Component: GymBilling },
  { path: "/provider/gym/support", Component: GymSupport },
  { path: "/provider/gym/settings", Component: GymSettings },
  
  // Hotel Section Routes
  { path: "/provider/hotel/bookings", Component: HotelBookings },
  { path: "/provider/hotel/rooms", Component: HotelRooms },
  { path: "/provider/hotel/categories", Component: HotelCategories },
  { path: "/provider/hotel/amenities", Component: HotelAmenities },
  { path: "/provider/hotel/pricing", Component: HotelPricing },
  { path: "/provider/hotel/availability", Component: HotelAvailability },
  { path: "/provider/hotel/gallery", Component: HotelGallery },
  { path: "/provider/hotel/reviews", Component: HotelReviews },
  { path: "/provider/hotel/analytics", Component: HotelAnalytics },
  { path: "/provider/hotel/billing", Component: HotelBilling },
  { path: "/provider/hotel/support", Component: HotelSupport },
  { path: "/provider/hotel/settings", Component: HotelSettings },
  
  // Tourism Section Routes
  { path: "/provider/tourism/bookings", Component: TourismBookings },
  { path: "/provider/tourism/packages", Component: TourismPackages },
  { path: "/provider/tourism/destinations", Component: TourismDestinations },
  { path: "/provider/tourism/transfers", Component: TourismTransfers },
  { path: "/provider/tourism/schedule", Component: TourismSchedule },
  { path: "/provider/tourism/pricing", Component: TourismPricing },
  { path: "/provider/tourism/media", Component: TourismMedia },
  { path: "/provider/tourism/analytics", Component: TourismAnalytics },
  { path: "/provider/tourism/billing", Component: TourismBilling },
  { path: "/provider/tourism/support", Component: TourismSupport },
  { path: "/provider/tourism/settings", Component: TourismSettings },
  
  // Pharmacy Section Routes
  { path: "/provider/pharmacy/prescriptions", Component: PharmacyPrescriptions },
  { path: "/provider/pharmacy/requests", Component: PharmacyRequests },
  { path: "/provider/pharmacy/orders", Component: PharmacyOrders },
  { path: "/provider/pharmacy/delivery", Component: PharmacyDelivery },
  { path: "/provider/pharmacy/inventory", Component: PharmacyInventory },
  { path: "/provider/pharmacy/pricing", Component: PharmacyPricing },
  { path: "/provider/pharmacy/hours", Component: PharmacyHours },
  { path: "/provider/pharmacy/analytics", Component: PharmacyAnalytics },
  { path: "/provider/pharmacy/billing", Component: PharmacyBilling },
  { path: "/provider/pharmacy/support", Component: PharmacySupport },
  { path: "/provider/pharmacy/settings", Component: PharmacySettings },
  
  // Education Section Routes
  { path: "/provider/education/courses", Component: EducationCourses },
  { path: "/provider/education/registrations", Component: EducationRegistrations },
  { path: "/provider/education/students", Component: EducationStudents },
  { path: "/provider/education/instructors", Component: EducationInstructors },
  { path: "/provider/education/schedule", Component: EducationSchedule },
  { path: "/provider/education/certificates", Component: EducationCertificates },
  { path: "/provider/education/analytics", Component: EducationAnalytics },
  { path: "/provider/education/billing", Component: EducationBilling },
  { path: "/provider/education/support", Component: EducationSupport },
  { path: "/provider/education/settings", Component: EducationSettings },
  
  // Provider Onboarding Routes
  {
    path: "/provider/onboarding/clinic",
    Component: ClinicOnboarding,
  },
  {
    path: "/provider/onboarding/doctor",
    Component: DoctorOnboarding,
  },
  {
    path: "/provider/onboarding/salon",
    Component: SalonOnboarding,
  },
  {
    path: "/provider/onboarding/gym",
    Component: GymOnboarding,
  },
  {
    path: "/provider/onboarding/hotel",
    Component: HotelOnboarding,
  },
  {
    path: "/provider/onboarding/tourism",
    Component: TourismOnboarding,
  },
  {
    path: "/provider/onboarding/pharmacy",
    Component: PharmacyOnboarding,
  },
  {
    path: "/provider/onboarding/education",
    Component: EducationOnboarding,
  },
]);