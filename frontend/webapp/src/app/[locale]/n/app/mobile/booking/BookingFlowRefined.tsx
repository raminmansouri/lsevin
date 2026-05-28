import { useState } from "react";
import { AlertCircle, AlertTriangle, ArrowLeft, Award, BadgeCheck, Building, Calendar, Car, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, CreditCard, Download, FileText, Globe, Headphones, Hotel as HotelIcon, Info, Languages, Mail, MapPin, Percent, Phone, Plus, Shield, Smartphone, Star, Tag, Upload, Users, Wallet, X, } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useTranslations } from "next-intl";
export default function BookingFlowRefined() {
    const tBooking = useTranslations("Booking");
    const navigate = useNavigate();
    const { treatmentId } = useParams();
    const [step, setStep] = useState<number>(1);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<{
        name: string;
        type: string;
        size: string;
    }[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
    const [depositOption, setDepositOption] = useState<"full" | "deposit">("deposit");
    const [promoCode, setPromoCode] = useState<string>("");
    const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "EUR" | "GBP">("USD");
    const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
    // Patient Details Form State
    const [patientDetails, setPatientDetails] = useState({
        fullName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        nationality: "",
        passportNumber: "",
        medicalNotes: "",
    });
    const treatment = {
        id: treatmentId || "1",
        name: "Premium Hair Transplant - FUE Method",
        clinic: "Istanbul Medical Center",
        city: "Istanbul",
        country: "Turkey",
        rating: 4.9,
        reviews: 2847,
        verified: true,
        duration: "6-8 hours",
        recovery: "7-10 days",
        price: 2499,
        depositAmount: 500,
        currency: "USD",
        image: "/unsplash_images/photo-1622296089863-eb7fc530daa8__w=600&h=400&fit=crop.jpg",
        category: "Hair Transplant",
        accreditation: "JCI Accredited",
        clinicImage: "/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=400&h=300&fit=crop.jpg",
    };
    const doctors = [
        {
            id: "1",
            name: "Dr. Mehmet Yavuz",
            specialty: "Hair Transplant Surgeon",
            experience: "18 years",
            rating: 4.9,
            reviews: 1247,
            patients: "12,000+",
            languages: ["English", "Turkish", "Arabic"],
            credentials: ["MD", "ISHRS Member", "Board Certified"],
            verified: true,
            consultation: 0,
            image: "/unsplash_images/photo-1612349317150-e413f6a5b16d__w=400&h=400&fit=crop.jpg",
            nextAvailable: "Mar 15, 2026",
            bio: "Leading hair transplant specialist with expertise in FUE and DHI techniques",
        },
        {
            id: "2",
            name: "Dr. Can Ozturk",
            specialty: "Hair Restoration Expert",
            experience: "15 years",
            rating: 4.8,
            reviews: 892,
            patients: "10,500+",
            languages: ["English", "Turkish", "German"],
            credentials: ["MD", "FUE Specialist", "ABHRS"],
            verified: true,
            consultation: 0,
            image: "/unsplash_images/photo-1622253692010-333f2da6031d__w=400&h=400&fit=crop.jpg",
            nextAvailable: "Mar 12, 2026",
            bio: "Internationally recognized expert in advanced hair restoration procedures",
        },
    ];
    const addons = [
        {
            id: "hotel",
            name: "4-Star Hotel Package",
            description: "3 nights accommodation near clinic",
            price: 180,
            icon: <HotelIcon size={20} className="text-[#083f30]"/>,
            popular: true,
            details: [
                "Breakfast included",
                "Free WiFi",
                "10 min from clinic",
                "Daily housekeeping",
            ],
        },
        {
            id: "transfer",
            name: "VIP Airport Transfer",
            description: "Round-trip luxury car service",
            price: 80,
            icon: <Car size={20} className="text-[#083f30]"/>,
            popular: true,
            details: [
                "Meet & greet",
                "Premium vehicle",
                "Professional driver",
                "Flight tracking",
            ],
        },
        {
            id: "translator",
            name: "Personal Translator",
            description: "Dedicated translator for your stay",
            price: 120,
            icon: <Globe size={20} className="text-[#083f30]"/>,
            details: [
                "Available 24/7",
                "Medical terminology expert",
                "Multiple languages",
                "Cultural assistance",
            ],
        },
        {
            id: "vip",
            name: "VIP Patient Support",
            description: "Priority support & concierge service",
            price: 150,
            icon: <Headphones size={20} className="text-[#083f30]"/>,
            details: [
                "24/7 hotline",
                "Dedicated coordinator",
                "Priority scheduling",
                "Concierge service",
            ],
        },
        {
            id: "insurance",
            name: "Medical Travel Insurance",
            description: "Comprehensive coverage for your trip",
            price: 95,
            icon: <Shield size={20} className="text-[#083f30]"/>,
            details: [
                "Trip cancellation",
                "Medical complications",
                "Lost baggage",
                "Emergency evacuation",
            ],
        },
    ];
    const steps = [
        { num: 1, label: "Overview" },
        { num: 2, label: "Doctor" },
        { num: 3, label: "Date & Time" },
        { num: 4, label: "Medical Files" },
        { num: 5, label: "Patient Info" },
        { num: 6, label: "Add-ons" },
        { num: 7, label: "Review" },
        { num: 8, label: "Payment" },
    ];
    const toggleAddon = (addonId: string) => {
        if (selectedAddons.includes(addonId)) {
            setSelectedAddons(selectedAddons.filter((id) => id !== addonId));
        }
        else {
            setSelectedAddons([...selectedAddons, addonId]);
        }
    };
    const calculateSubtotal = () => {
        let total = treatment.price;
        selectedAddons.forEach((addonId) => {
            const addon = addons.find((a) => a.id === addonId);
            if (addon)
                total += addon.price;
        });
        return total;
    };
    const calculateServiceFee = () => {
        return Math.round(calculateSubtotal() * 0.03); // 3% service fee
    };
    const calculateTotal = () => {
        return calculateSubtotal() + calculateServiceFee();
    };
    const getDepositAmount = () => {
        return depositOption === "deposit"
            ? treatment.depositAmount
            : calculateTotal();
    };
    const handleNext = () => {
        if (step < 8)
            setStep(step + 1);
    };
    const handleBack = () => {
        if (step > 1)
            setStep(step - 1);
        else
            navigate(-1);
    };
    const canProceed = () => {
        if (step === 1)
            return true; // Overview
        if (step === 2)
            return selectedDoctor !== null; // Doctor selection
        if (step === 3)
            return selectedDate && selectedTime; // Date & Time
        if (step === 4)
            return uploadedFiles.length >= 2; // Medical files (at least 2)
        if (step === 5)
            return (patientDetails.fullName && patientDetails.email && patientDetails.phone); // Patient info
        if (step === 6)
            return true; // Add-ons optional
        if (step === 7)
            return true; // Review
        if (step === 8)
            return paymentMethod && agreeToTerms; // Payment
        return false;
    };
    const addMockFile = () => {
        const mockFiles = [
            { name: "Blood_Test_Results.pdf", type: "PDF", size: "2.4 MB" },
            { name: "Medical_History.pdf", type: "PDF", size: "1.8 MB" },
            { name: "Previous_Treatment.jpg", type: "Image", size: "3.2 MB" },
        ];
        const newFile = mockFiles[uploadedFiles.length % mockFiles.length];
        if (!uploadedFiles.find((f) => f.name === newFile.name)) {
            setUploadedFiles([...uploadedFiles, newFile]);
        }
    };
    return (<div className="min-h-screen bg-gray-50 pb-32">
      {" "}
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        {" "}
        <div className="px-5 py-4">
          {" "}
          <div className="mb-5 flex items-center gap-3">
            {" "}
            <button onClick={handleBack} className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:scale-95">
              {" "}
              <ArrowLeft size={20} className="text-gray-900"/>{" "}
            </button>{" "}
            <div className="flex-1">
              {" "}
              <h1 className="font-bold text-gray-900">{tBooking("completeYourBooking")}</h1>{" "}
              <p className="mt-0.5 text-xs text-gray-600">{tBooking("step2")}{step} of {steps.length}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {/* Premium Progress Bar */}
          <div className="relative">
            {" "}
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              {" "}
              <div className="h-full rounded-full bg-gradient-to-r from-[#083f30] to-[#0a5a44] transition-all duration-500 ease-out" style={{ width: `${(step / steps.length) * 100}%` }}/>{" "}
            </div>{" "}
            <div className="mt-3 flex items-center justify-between">
              {" "}
              {steps.slice(0, 4).map((s) => (<div key={s.num} className={`text-xs font-medium transition-colors ${step >= s.num ? "text-[#083f30]" : "text-gray-400"}`}>
                  {" "}
                  {s.label}{" "}
                </div>))}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Content */}
      <div className="px-5 py-6">
        {" "}
        {/* Step 1: Treatment Overview */}
        {step === 1 && (<div className="space-y-6">
            {" "}
            <div>
              {" "}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{tBooking("treatmentOverview")}</h2>{" "}
              <p className="text-gray-600">{tBooking("reviewYourSelectedTreatmentDetails")}</p>{" "}
            </div>
            {/* Hero Image */}
            <div className="relative h-56 overflow-hidden rounded-2xl">
              {" "}
              <img src={treatment.image} alt={treatment.name} className="h-full w-full object-cover"/>{" "}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"/>{" "}
              <div className="absolute right-0 bottom-0 left-0 p-5 text-white">
                {" "}
                <div className="mb-2 flex items-center gap-2">
                  {" "}
                  <BadgeCheck size={18} className="text-[#eacb7f]"/>{" "}
                  <span className="rounded-md bg-[#eacb7f]/20 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
                    {" "}
                    {treatment.accreditation}{" "}
                  </span>{" "}
                </div>{" "}
                <h3 className="mb-1 text-xl font-bold">
                  {treatment.name}
                </h3>{" "}
              </div>{" "}
            </div>
            {/* Clinic Info Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              {" "}
              <div className="mb-4 flex items-start gap-4 border-b border-gray-100 pb-4">
                {" "}
                <img src={treatment.clinicImage} alt={treatment.clinic} className="h-20 w-20 rounded-xl object-cover"/>{" "}
                <div className="flex-1">
                  {" "}
                  <h3 className="mb-1 font-bold text-gray-900">
                    {treatment.clinic}
                  </h3>{" "}
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                    {" "}
                    <MapPin size={14}/>{" "}
                    <span>
                      {treatment.city}, {treatment.country}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-2">
                    {" "}
                    <div className="flex items-center gap-1">
                      {" "}
                      <Star size={14} className="fill-yellow-400 text-yellow-400"/>{" "}
                      <span className="text-sm font-bold text-gray-900">
                        {treatment.rating}
                      </span>{" "}
                      <span className="text-xs text-gray-500">
                        ({treatment.reviews}{tBooking("reviews")}</span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <BadgeCheck size={24} className="flex-shrink-0 text-[#083f30]"/>{" "}
              </div>
              {/* Treatment Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div className="rounded-xl bg-gray-50 p-3">
                  {" "}
                  <div className="mb-1 flex items-center gap-2">
                    {" "}
                    <Clock size={16} className="text-gray-600"/>{" "}
                    <span className="text-xs font-semibold text-gray-600 uppercase">{tBooking("duration")}</span>{" "}
                  </div>{" "}
                  <p className="font-bold text-gray-900">
                    {treatment.duration}
                  </p>{" "}
                </div>{" "}
                <div className="rounded-xl bg-gray-50 p-3">
                  {" "}
                  <div className="mb-1 flex items-center gap-2">
                    {" "}
                    <Calendar size={16} className="text-gray-600"/>{" "}
                    <span className="text-xs font-semibold text-gray-600 uppercase">{tBooking("recovery")}</span>{" "}
                  </div>{" "}
                  <p className="font-bold text-gray-900">
                    {treatment.recovery}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>
            {/* Pricing Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-5 text-white">
              {" "}
              <div className="mb-3 flex items-center justify-between">
                {" "}
                <div>
                  {" "}
                  <p className="mb-1 text-sm text-white/80">{tBooking("startingFrom")}</p>{" "}
                  <div className="text-3xl font-bold">${treatment.price}</div>{" "}
                  <p className="mt-1 text-xs text-white/70">{tBooking("allInclusivePackage")}</p>{" "}
                </div>{" "}
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                  {" "}
                  <Tag size={24} className="text-[#eacb7f]"/>{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                {" "}
                <Info size={14} className="text-white/80"/>{" "}
                <span className="text-xs text-white/80">{tBooking("payOnlyDollar")}{treatment.depositAmount}{tBooking("depositToSecureYourBooking")}</span>{" "}
              </div>{" "}
            </div>
            {/* What's Included */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              {" "}
              <h3 className="mb-4 font-bold text-gray-900">{tBooking("whatSIncluded")}</h3>{" "}
              <div className="space-y-3">
                {" "}
                {[
                "Pre-treatment consultation",
                "All medical procedures & medications",
                "Post-treatment follow-ups",
                "Medical coordinator support",
                "Digital medical records",
                "1-year aftercare program",
            ].map((item, idx) => (<div key={idx} className="flex items-center gap-3">
                    {" "}
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-50">
                      {" "}
                      <Check size={12} className="text-green-600"/>{" "}
                    </div>{" "}
                    <span className="text-sm text-gray-700">{item}</span>{" "}
                  </div>))}{" "}
              </div>{" "}
            </div>{" "}
          </div>)}
        {/* Step 2: Choose Doctor */}
        {step === 2 && (<div className="space-y-6">
            {" "}
            <div>
              {" "}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{tBooking("chooseYourSpecialist")}</h2>{" "}
              <p className="text-gray-600">{tBooking("selectFromOurVerifiedMedicalProfessionals")}</p>{" "}
            </div>
            <div className="space-y-4">
              {" "}
              {doctors.map((doctor) => (<button key={doctor.id} onClick={() => setSelectedDoctor(doctor.id)} className={`w-full rounded-2xl border-2 bg-white p-5 text-left transition-all ${selectedDoctor === doctor.id ? "border-[#083f30] shadow-lg" : "border-gray-200 shadow-sm hover:border-gray-300"}`}>
                  {" "}
                  <div className="mb-4 flex gap-4">
                    {" "}
                    <div className="relative flex-shrink-0">
                      {" "}
                      <img src={doctor.image} alt={doctor.name} className="h-24 w-24 rounded-2xl object-cover"/>{" "}
                      <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#083f30] shadow-md">
                        {" "}
                        <BadgeCheck size={16} className="text-[#eacb7f]"/>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="flex-1">
                      {" "}
                      <h3 className="mb-1 font-bold text-gray-900">
                        {doctor.name}
                      </h3>{" "}
                      <p className="mb-3 text-sm text-gray-600">
                        {doctor.specialty}
                      </p>{" "}
                      <div className="flex flex-wrap gap-2">
                        {" "}
                        {doctor.credentials.map((cred, idx) => (<span key={idx} className="rounded-md bg-[#083f30]/5 px-2 py-1 text-xs font-semibold text-[#083f30]">
                            {" "}
                            {cred}{" "}
                          </span>))}{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                  n{" "}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    {" "}
                    <div className="rounded-xl bg-gray-50 p-3">
                      {" "}
                      <div className="mb-1 flex items-center gap-1">
                        {" "}
                        <Award size={14} className="text-gray-600"/>{" "}
                        <span className="text-xs font-semibold text-gray-600">{tBooking("experience")}</span>{" "}
                      </div>{" "}
                      <p className="text-sm font-bold text-gray-900">
                        {doctor.experience}
                      </p>{" "}
                    </div>{" "}
                    <div className="rounded-xl bg-gray-50 p-3">
                      {" "}
                      <div className="mb-1 flex items-center gap-1">
                        {" "}
                        <Users size={14} className="text-gray-600"/>{" "}
                        <span className="text-xs font-semibold text-gray-600">{tBooking("patients2")}</span>{" "}
                      </div>{" "}
                      <p className="text-sm font-bold text-gray-900">
                        {doctor.patients}
                      </p>{" "}
                    </div>{" "}
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    {" "}
                    <Languages size={16} className="text-gray-600"/>{" "}
                    <div className="flex flex-wrap gap-1.5">
                      {" "}
                      {doctor.languages.map((lang, idx) => (<span key={idx} className="text-xs text-gray-700">
                          {" "}
                          {lang}
                          {idx < doctor.languages.length - 1 ? "," : ""}{" "}
                        </span>))}{" "}
                    </div>{" "}
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    {" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <Star size={16} className="fill-yellow-400 text-yellow-400"/>{" "}
                      <span className="font-bold text-gray-900">
                        {doctor.rating}
                      </span>{" "}
                      <span className="text-sm text-gray-500">
                        ({doctor.reviews}{tBooking("reviews")}</span>{" "}
                    </div>{" "}
                    <span className="text-sm font-semibold text-[#083f30]">
                      {" "}{tBooking("next")}{doctor.nextAvailable}{" "}
                    </span>{" "}
                  </div>{" "}
                </button>))}{" "}
            </div>{" "}
          </div>)}
        {/* Step 3: Date & Time */}
        {step === 3 && (<div className="space-y-6">
            {" "}
            <div>
              {" "}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{tBooking("selectDateAndTime")}</h2>{" "}
              <p className="text-gray-600">{tBooking("chooseYourPreferredAppointmentSlot")}</p>{" "}
            </div>
            {/* Calendar */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              {" "}
              <div className="mb-5 flex items-center justify-between">
                {" "}
                <button className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100">
                  {" "}
                  <ChevronLeft size={20} className="text-gray-600"/>{" "}
                </button>{" "}
                <h3 className="font-bold text-gray-900">{tBooking("march2026")}</h3>{" "}
                <button className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100">
                  {" "}
                  <ChevronRight size={20} className="text-gray-600"/>{" "}
                </button>{" "}
              </div>
              {/* Day labels */}
              <div className="mb-2 grid grid-cols-7 gap-2">
                {" "}
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (<div key={day} className="py-1 text-center text-xs font-semibold text-gray-500">
                      {" "}
                      {day}{" "}
                    </div>))}{" "}
              </div>{" "}
              {/* Dates */}
              <div className="grid grid-cols-7 gap-2">
                {" "}
                {[
                { date: "2026-03-15", day: 15, available: true },
                { date: "2026-03-16", day: 16, available: true },
                { date: "2026-03-17", day: 17, available: false },
                { date: "2026-03-18", day: 18, available: true },
                { date: "2026-03-19", day: 19, available: true },
                { date: "2026-03-20", day: 20, available: false },
                { date: "2026-03-21", day: 21, available: false },
            ].map((date) => (<button key={date.date} onClick={() => date.available && setSelectedDate(date.date)} disabled={!date.available} className={`flex aspect-square items-center justify-center rounded-xl text-sm font-bold transition-all ${selectedDate === date.date ? "scale-105 bg-[#083f30] text-white shadow-lg" : date.available ? "bg-gray-50 text-gray-900 hover:scale-105 hover:bg-gray-100" : "cursor-not-allowed bg-gray-50 text-gray-300"}`}>
                    {" "}
                    {date.day}{" "}
                  </button>))}{" "}
              </div>{" "}
            </div>
            {/* Time Slots */}
            {selectedDate && (<div>
                {" "}
                <h3 className="mb-4 font-bold text-gray-900">{tBooking("availableTimeSlots")}</h3>{" "}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  {[
                    { time: "09:00 AM", available: true },
                    { time: "10:00 AM", available: true },
                    { time: "11:00 AM", available: false },
                    { time: "02:00 PM", available: true },
                    { time: "03:00 PM", available: true },
                    { time: "04:00 PM", available: false },
                ].map((slot) => (<button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available} className={`flex h-14 items-center justify-center rounded-xl font-semibold transition-all ${selectedTime === slot.time ? "bg-[#083f30] text-white shadow-lg" : slot.available ? "border-2 border-gray-200 bg-white text-gray-900 hover:border-[#083f30]" : "cursor-not-allowed bg-gray-100 text-gray-400"}`}>
                      {" "}
                      <Clock size={16} className="mr-2"/> {slot.time}{" "}
                    </button>))}{" "}
                </div>{" "}
              </div>)}
            {/* Timezone Notice */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              {" "}
              <div className="flex gap-3">
                {" "}
                <Info size={18} className="mt-0.5 flex-shrink-0 text-blue-600"/>{" "}
                <div>
                  {" "}
                  <p className="mb-1 text-sm font-semibold text-blue-900">{tBooking("timezoneNotice")}</p>{" "}
                  <p className="text-sm text-blue-800">
                    {" "}{tBooking("allTimesShownAreInIstanbulTimeGMTPlus")}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>)}
        {/* Step 4: Medical Files */}
        {step === 4 && (<div className="space-y-6">
            {" "}
            <div>
              {" "}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{tBooking("uploadMedicalDocuments")}</h2>{" "}
              <p className="text-gray-600">{tBooking("shareYourMedicalHistoryToHelpUsPrepare")}</p>{" "}
            </div>
            {/* Upload Area */}
            <button onClick={addMockFile} className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-all hover:border-[#083f30] hover:bg-[#083f30]/5">
              {" "}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#083f30]/10">
                {" "}
                <Upload size={28} className="text-[#083f30]"/>{" "}
              </div>{" "}
              <h3 className="mb-2 font-bold text-gray-900">{tBooking("uploadOrDragFiles")}</h3>{" "}
              <p className="mb-4 text-sm text-gray-600">
                {" "}{tBooking("pDFJPGPNGUpTo10MBEach")}{" "}
              </p>{" "}
              <div className="inline-flex items-center gap-2 rounded-xl bg-[#083f30] px-6 py-3 font-semibold text-white">
                {" "}
                <Plus size={18}/>{tBooking("chooseFiles")}{" "}
              </div>{" "}
            </button>
            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (<div>
                {" "}
                <h3 className="mb-3 font-bold text-gray-900">{tBooking("uploadedFiles")}{uploadedFiles.length})
                </h3>{" "}
                <div className="space-y-2">
                  {" "}
                  {uploadedFiles.map((file, idx) => (<div key={idx} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
                      {" "}
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                        {" "}
                        <FileText size={20} className="text-green-600"/>{" "}
                      </div>{" "}
                      <div className="min-w-0 flex-1">
                        {" "}
                        <p className="truncate font-semibold text-gray-900">
                          {file.name}
                        </p>{" "}
                        <p className="text-xs text-gray-500">
                          {file.type} • {file.size}
                        </p>{" "}
                      </div>{" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <CheckCircle2 size={20} className="text-green-600"/>{" "}
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100">
                          {" "}
                          <X size={16} className="text-gray-500"/>{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>))}{" "}
                </div>{" "}
              </div>)}
            {/* Required Documents Checklist */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              {" "}
              <h3 className="mb-4 font-bold text-gray-900">{tBooking("requiredDocuments")}</h3>{" "}
              <div className="space-y-3">
                {" "}
                {[
                {
                    name: "Blood Test Results (within 3 months)",
                    required: true,
                },
                { name: "Medical History Form", required: true },
                { name: "Previous Treatment Records", required: false },
                { name: "Current Medications List", required: false },
            ].map((doc, idx) => (<div key={idx} className="flex items-center gap-3">
                    {" "}
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full ${uploadedFiles.length > idx ? "bg-green-50" : "bg-gray-100"}`}>
                      {" "}
                      {uploadedFiles.length > idx ? (<Check size={12} className="text-green-600"/>) : (<div className="h-2 w-2 rounded-full bg-gray-400"/>)}{" "}
                    </div>{" "}
                    <div className="flex-1">
                      {" "}
                      <p className="text-sm font-medium text-gray-900">
                        {doc.name}
                      </p>{" "}
                      {doc.required && (<span className="text-xs text-red-600">{tBooking("required")}</span>)}{" "}
                    </div>{" "}
                  </div>))}{" "}
              </div>{" "}
            </div>
            {/* Privacy Notice */}
            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              {" "}
              <div className="flex gap-3">
                {" "}
                <Shield size={18} className="mt-0.5 flex-shrink-0 text-green-600"/>{" "}
                <div>
                  {" "}
                  <p className="mb-1 text-sm font-semibold text-green-900">{tBooking("hIPAACompliantAndEncrypted")}</p>{" "}
                  <p className="text-sm text-green-800">
                    {" "}{tBooking("allDocumentsAreEncryptedEndToEndAndOnly")}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>)}
        {/* Step 5: Patient Details */}
        {step === 5 && (<div className="space-y-6">
            {" "}
            <div>
              {" "}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{tBooking("patientInformation")}</h2>{" "}
              <p className="text-gray-600">{tBooking("provideYourPersonalAndContactDetails")}</p>{" "}
            </div>
            <div className="space-y-4">
              {" "}
              {/* Full Name */}
              <div>
                {" "}
                <label className="mb-2 block text-sm font-semibold text-gray-900">{tBooking("fullName")}</label>{" "}
                <input type="text" value={patientDetails.fullName} onChange={(e) => setPatientDetails({
                ...patientDetails,
                fullName: e.target.value,
            })} placeholder={tBooking("johnDoe")} className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#083f30] focus:outline-none"/>{" "}
              </div>
              {/* Email */}
              <div>
                {" "}
                <label className="mb-2 block text-sm font-semibold text-gray-900">{tBooking("emailAddress")}</label>{" "}
                <input type="email" value={patientDetails.email} onChange={(e) => setPatientDetails({
                ...patientDetails,
                email: e.target.value,
            })} placeholder={tBooking("johnDoeExampleCom")} className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#083f30] focus:outline-none"/>{" "}
              </div>
              {/* Phone */}
              <div>
                {" "}
                <label className="mb-2 block text-sm font-semibold text-gray-900">{tBooking("phoneNumber")}</label>{" "}
                <input type="tel" value={patientDetails.phone} onChange={(e) => setPatientDetails({
                ...patientDetails,
                phone: e.target.value,
            })} placeholder="+1 (555) 123-4567" className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#083f30] focus:outline-none"/>{" "}
              </div>
              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div>
                  {" "}
                  <label className="mb-2 block text-sm font-semibold text-gray-900">{tBooking("dateOfBirth")}</label>{" "}
                  <input type="date" value={patientDetails.dateOfBirth} onChange={(e) => setPatientDetails({
                ...patientDetails,
                dateOfBirth: e.target.value,
            })} className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 transition-colors focus:border-[#083f30] focus:outline-none"/>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="mb-2 block text-sm font-semibold text-gray-900">{tBooking("gender")}</label>{" "}
                  <select value={patientDetails.gender} onChange={(e) => setPatientDetails({
                ...patientDetails,
                gender: e.target.value,
            })} className="h-12 w-full appearance-none rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 transition-colors focus:border-[#083f30] focus:outline-none">
                    {" "}
                    <option value="">{tBooking("select")}</option>{" "}
                    <option value="male">{tBooking("male")}</option>{" "}
                    <option value="female">{tBooking("female")}</option>{" "}
                    <option value="other">{tBooking("other")}</option>{" "}
                  </select>{" "}
                </div>{" "}
              </div>
              {/* Nationality & Passport */}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div>
                  {" "}
                  <label className="mb-2 block text-sm font-semibold text-gray-900">{tBooking("nationality")}</label>{" "}
                  <input type="text" value={patientDetails.nationality} onChange={(e) => setPatientDetails({
                ...patientDetails,
                nationality: e.target.value,
            })} placeholder={tBooking("unitedStates")} className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#083f30] focus:outline-none"/>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="mb-2 block text-sm font-semibold text-gray-900">{tBooking("passportNumber")}</label>{" "}
                  <input type="text" value={patientDetails.passportNumber} onChange={(e) => setPatientDetails({
                ...patientDetails,
                passportNumber: e.target.value,
            })} placeholder={tBooking("optional")} className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#083f30] focus:outline-none"/>{" "}
                </div>{" "}
              </div>
              {/* Medical Notes */}
              <div>
                {" "}
                <label className="mb-2 block text-sm font-semibold text-gray-900">{tBooking("medicalNotesOrConcerns")}</label>{" "}
                <textarea value={patientDetails.medicalNotes} onChange={(e) => setPatientDetails({
                ...patientDetails,
                medicalNotes: e.target.value,
            })} placeholder={tBooking("anyAllergiesCurrentMedicationsOrSpecialRequirements")} rows={4} className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#083f30] focus:outline-none"/>{" "}
              </div>{" "}
            </div>
            {/* Info Notice */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              {" "}
              <div className="flex gap-3">
                {" "}
                <Info size={18} className="mt-0.5 flex-shrink-0 text-blue-600"/>{" "}
                <div>
                  {" "}
                  <p className="mb-1 text-sm font-semibold text-blue-900">{tBooking("internationalPatients")}</p>{" "}
                  <p className="text-sm text-blue-800">
                    {" "}{tBooking("yourPassportInformationHelpsUsArrangeVisaSupportAnd")}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>)}
        {/* Step 6: Add-ons */}
        {step === 6 && (<div className="space-y-6">
            {" "}
            <div>
              {" "}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{tBooking("enhanceYourJourney")}</h2>{" "}
              <p className="text-gray-600">{tBooking("optionalServicesToMakeYourExperienceSeamless")}</p>{" "}
            </div>
            <div className="space-y-3">
              {" "}
              {addons.map((addon) => (<div key={addon.id} className={`rounded-2xl border-2 bg-white transition-all ${selectedAddons.includes(addon.id) ? "border-[#083f30] shadow-lg" : "border-gray-200 shadow-sm"}`}>
                  {" "}
                  <div className="p-5">
                    {" "}
                    <div className="mb-4 flex gap-4">
                      {" "}
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#083f30]/5">
                        {" "}
                        {addon.icon}{" "}
                      </div>{" "}
                      <div className="flex-1">
                        {" "}
                        <div className="mb-2 flex items-start justify-between">
                          {" "}
                          <div>
                            {" "}
                            <div className="mb-1 flex items-center gap-2">
                              {" "}
                              <h3 className="font-bold text-gray-900">
                                {addon.name}
                              </h3>{" "}
                              {addon.popular && (<span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                                  {" "}{tBooking("pOPULAR")}{" "}
                                </span>)}{" "}
                            </div>{" "}
                            <p className="text-sm text-gray-600">
                              {addon.description}
                            </p>{" "}
                          </div>{" "}
                          <div className="ml-4 text-right">
                            {" "}
                            <div className="text-xl font-bold text-[#083f30]">
                              +${addon.price}
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                        {/* Benefits List */}
                        <div className="mb-4 grid grid-cols-2 gap-2">
                          {" "}
                          {addon.details.map((detail, idx) => (<div key={idx} className="flex items-center gap-2">
                              {" "}
                              <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-50">
                                {" "}
                                <Check size={10} className="text-green-600"/>{" "}
                              </div>{" "}
                              <span className="text-xs text-gray-700">
                                {detail}
                              </span>{" "}
                            </div>))}{" "}
                        </div>
                        <button onClick={() => toggleAddon(addon.id)} className={`h-11 w-full rounded-xl font-semibold transition-all ${selectedAddons.includes(addon.id) ? "bg-[#083f30] text-white shadow-md" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}`}>
                          {" "}
                          {selectedAddons.includes(addon.id) ? (<span className="flex items-center justify-center gap-2">
                              {" "}
                              <CheckCircle2 size={18}/>{tBooking("addedToPackage")}{" "}
                            </span>) : (<span className="flex items-center justify-center gap-2">
                              {" "}
                              <Plus size={18}/>{tBooking("addService")}{" "}
                            </span>)}{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>))}{" "}
            </div>
            {/* Bundle Discount Notice */}
            {selectedAddons.length >= 3 && (<div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                {" "}
                <div className="flex gap-3">
                  {" "}
                  <Percent size={20} className="mt-0.5 flex-shrink-0 text-green-600"/>{" "}
                  <div>
                    {" "}
                    <p className="mb-1 text-sm font-bold text-green-900">{tBooking("bundleDiscountApplied")}</p>{" "}
                    <p className="text-sm text-green-800">
                      {" "}{tBooking("youVeSaved10PercentOnAddOnsBy")}{" "}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
              </div>)}{" "}
          </div>)}
        {/* Step 7: Booking Summary */}
        {step === 7 && (<div className="space-y-6">
            {" "}
            <div>
              {" "}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{tBooking("reviewYourBooking")}</h2>{" "}
              <p className="text-gray-600">{tBooking("pleaseVerifyAllDetailsBeforePayment")}</p>{" "}
            </div>
            {/* Treatment Summary Card */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {" "}
              <div className="border-b border-gray-200 bg-gray-50 p-5">
                {" "}
                <h3 className="font-bold text-gray-900">{tBooking("treatmentDetails")}</h3>{" "}
              </div>{" "}
              <div className="p-5">
                {" "}
                <div className="mb-4 flex gap-4 border-b border-gray-100 pb-4">
                  {" "}
                  <img src={treatment.image} alt={treatment.name} className="h-24 w-24 rounded-xl object-cover"/>{" "}
                  <div className="flex-1">
                    {" "}
                    <h3 className="mb-1 font-bold text-gray-900">
                      {treatment.name}
                    </h3>{" "}
                    <p className="mb-2 text-sm text-gray-600">
                      {treatment.clinic}
                    </p>{" "}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {" "}
                      <MapPin size={12}/>{" "}
                      <span>
                        {treatment.city}, {treatment.country}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
                {selectedDoctor && (<div className="mb-4 border-b border-gray-100 pb-4">
                    {" "}
                    <p className="mb-2 text-xs font-semibold text-gray-600">{tBooking("sELECTEDDOCTOR")}</p>{" "}
                    <div className="flex items-center gap-3">
                      {" "}
                      <img src={doctors.find((d) => d.id === selectedDoctor)?.image} alt={tBooking("doctor2")} className="h-12 w-12 rounded-xl object-cover"/>{" "}
                      <div>
                        {" "}
                        <p className="text-sm font-bold text-gray-900">
                          {" "}
                          {doctors.find((d) => d.id === selectedDoctor)?.name}{" "}
                        </p>{" "}
                        <p className="text-xs text-gray-600">
                          {" "}
                          {doctors.find((d) => d.id === selectedDoctor)
                    ?.specialty}{" "}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>)}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <div className="rounded-xl bg-gray-50 p-3">
                    {" "}
                    <div className="mb-1 flex items-center gap-2">
                      {" "}
                      <Calendar size={14} className="text-gray-600"/>{" "}
                      <span className="text-xs font-semibold text-gray-600">{tBooking("date2")}</span>{" "}
                    </div>{" "}
                    <p className="text-sm font-bold text-gray-900">
                      {selectedDate || "Not selected"}
                    </p>{" "}
                  </div>{" "}
                  <div className="rounded-xl bg-gray-50 p-3">
                    {" "}
                    <div className="mb-1 flex items-center gap-2">
                      {" "}
                      <Clock size={14} className="text-gray-600"/>{" "}
                      <span className="text-xs font-semibold text-gray-600">{tBooking("time")}</span>{" "}
                    </div>{" "}
                    <p className="text-sm font-bold text-gray-900">
                      {selectedTime || "Not selected"}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>
            {/* Cost Breakdown */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {" "}
              <div className="border-b border-gray-200 bg-gray-50 p-5">
                {" "}
                <h3 className="font-bold text-gray-900">{tBooking("costBreakdown")}</h3>{" "}
              </div>{" "}
              <div className="space-y-3 p-5">
                {" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <span className="text-gray-700">{tBooking("treatmentFee2")}</span>{" "}
                  <span className="font-bold text-gray-900">
                    ${treatment.price}
                  </span>{" "}
                </div>{" "}
                {selectedAddons.length > 0 && (<>
                    {" "}
                    <div className="border-t border-gray-100 pt-3">
                      {" "}
                      <p className="mb-2 text-sm font-semibold text-gray-900">{tBooking("addOnServices")}</p>{" "}
                      {selectedAddons.map((addonId) => {
                    const addon = addons.find((a) => a.id === addonId);
                    return addon ? (<div key={addonId} className="flex items-center justify-between py-1">
                            {" "}
                            <span className="text-sm text-gray-600">
                              {addon.name}
                            </span>{" "}
                            <span className="text-sm font-semibold text-gray-900">
                              ${addon.price}
                            </span>{" "}
                          </div>) : null;
                })}{" "}
                    </div>{" "}
                  </>)}{" "}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  {" "}
                  <span className="text-gray-700">{tBooking("subtotal")}</span>{" "}
                  <span className="font-bold text-gray-900">
                    ${calculateSubtotal()}
                  </span>{" "}
                </div>{" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <span className="text-sm text-gray-600">{tBooking("serviceFee3Percent")}</span>{" "}
                  <span className="text-sm font-semibold text-gray-900">
                    ${calculateServiceFee()}
                  </span>{" "}
                </div>
                <div className="flex items-center justify-between border-t-2 border-gray-200 pt-4">
                  {" "}
                  <span className="text-lg font-bold text-gray-900">{tBooking("totalAmount")}</span>{" "}
                  <span className="text-2xl font-bold text-[#083f30]">
                    ${calculateTotal()}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>
            {/* Promo Code */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              {" "}
              <div className="flex gap-3">
                {" "}
                <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder={tBooking("enterPromoCode")} className="h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#083f30] focus:outline-none"/>{" "}
                <button className="h-11 rounded-xl bg-[#083f30] px-6 font-semibold text-white transition-colors hover:bg-[#0a5a44]">
                  {" "}{tBooking("apply")}{" "}
                </button>{" "}
              </div>{" "}
            </div>
            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3">
              {" "}
              <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
                {" "}
                <BadgeCheck size={24} className="mx-auto mb-2 text-green-600"/>{" "}
                <p className="text-xs font-semibold text-green-900">{tBooking("verifiedProvider")}</p>{" "}
              </div>{" "}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
                {" "}
                <Shield size={24} className="mx-auto mb-2 text-blue-600"/>{" "}
                <p className="text-xs font-semibold text-blue-900">{tBooking("securePayment")}</p>{" "}
              </div>{" "}
            </div>{" "}
          </div>)}
        {/* Step 8: Payment */}
        {step === 8 && (<div className="space-y-6">
            {" "}
            <div>
              {" "}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{tBooking("completePayment")}</h2>{" "}
              <p className="text-gray-600">{tBooking("chooseYourPreferredPaymentMethod")}</p>{" "}
            </div>
            {/* Payment Option Toggle */}
            <div className="flex gap-2 rounded-2xl border border-gray-200 bg-white p-2">
              {" "}
              <button onClick={() => setDepositOption("deposit")} className={`h-11 flex-1 rounded-xl font-semibold transition-all ${depositOption === "deposit" ? "bg-[#083f30] text-white shadow-md" : "text-gray-600 hover:bg-gray-50"}`}>
                {" "}{tBooking("payDepositDollar")}{treatment.depositAmount}){" "}
              </button>{" "}
              <button onClick={() => setDepositOption("full")} className={`h-11 flex-1 rounded-xl font-semibold transition-all ${depositOption === "full" ? "bg-[#083f30] text-white shadow-md" : "text-gray-600 hover:bg-gray-50"}`}>
                {" "}{tBooking("payFullDollar")}{calculateTotal()}){" "}
              </button>{" "}
            </div>
            {/* Amount Summary */}
            <div className="rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-5 text-white">
              {" "}
              <div className="flex items-center justify-between">
                {" "}
                <div>
                  {" "}
                  <p className="mb-1 text-sm text-white/80">
                    {" "}
                    {depositOption === "deposit"
                ? "Deposit Amount"
                : "Total Amount"}{" "}
                  </p>{" "}
                  <div className="text-3xl font-bold">
                    ${getDepositAmount()}
                  </div>{" "}
                  {depositOption === "deposit" && (<p className="mt-2 text-xs text-white/70">
                      {" "}{tBooking("remainingDollar")}{calculateTotal() -
                    treatment.depositAmount}{" "}{tBooking("dueBeforeTreatment")}{" "}
                    </p>)}{" "}
                </div>{" "}
                <CreditCard size={40} className="text-white/20"/>{" "}
              </div>{" "}
            </div>
            {/* Payment Methods */}
            <div>
              {" "}
              <h3 className="mb-4 font-bold text-gray-900">{tBooking("selectPaymentMethod")}</h3>{" "}
              <div className="space-y-3">
                {" "}
                {[
                {
                    id: "card",
                    name: "Credit / Debit Card",
                    subtitle: "Visa, Mastercard, Amex",
                    icon: <CreditCard size={24}/>,
                    popular: true,
                },
                {
                    id: "wallet",
                    name: "Digital Wallet",
                    subtitle: "Apple Pay, Google Pay",
                    icon: <Wallet size={24}/>,
                },
                {
                    id: "bank",
                    name: "Bank Transfer",
                    subtitle: "Wire transfer or ACH",
                    icon: <Building size={24}/>,
                },
            ].map((method) => (<button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-5 transition-all ${paymentMethod === method.id ? "border-[#083f30] shadow-lg" : "border-gray-200 shadow-sm hover:border-gray-300"}`}>
                    {" "}
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 text-[#083f30]">
                      {" "}
                      {method.icon}{" "}
                    </div>{" "}
                    <div className="flex-1 text-left">
                      {" "}
                      <div className="mb-1 flex items-center gap-2">
                        {" "}
                        <h3 className="font-bold text-gray-900">
                          {method.name}
                        </h3>{" "}
                        {method.popular && (<span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                            {" "}{tBooking("rECOMMENDED")}{" "}
                          </span>)}{" "}
                      </div>{" "}
                      <p className="text-sm text-gray-600">
                        {method.subtitle}
                      </p>{" "}
                    </div>{" "}
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${paymentMethod === method.id ? "border-[#083f30]" : "border-gray-300"}`}>
                      {" "}
                      {paymentMethod === method.id && (<div className="h-3 w-3 rounded-full bg-[#083f30]"/>)}{" "}
                    </div>{" "}
                  </button>))}{" "}
              </div>{" "}
            </div>
            {/* Security Badges */}
            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              {" "}
              <div className="flex gap-3">
                {" "}
                <Shield size={20} className="mt-0.5 flex-shrink-0 text-green-600"/>{" "}
                <div>
                  {" "}
                  <p className="mb-1 text-sm font-bold text-green-900">{tBooking("text256BitSSLEncryption")}</p>{" "}
                  <p className="text-sm text-green-800">
                    {" "}{tBooking("yourPaymentIsSecuredByBankGradeEncryptionWe")}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>
            {/* Cancellation Policy */}
            <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
              {" "}
              <div className="flex gap-3">
                {" "}
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-yellow-600"/>{" "}
                <div>
                  {" "}
                  <p className="mb-1 text-sm font-bold text-yellow-900">{tBooking("cancellationPolicy")}</p>{" "}
                  <p className="text-sm text-yellow-800">
                    {" "}{tBooking("freeCancellationUpTo14DaysBeforeTreatment50")}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>
            {/* Terms Checkbox */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 transition-colors hover:border-[#083f30]">
              {" "}
              <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-2 border-gray-300 text-[#083f30] focus:ring-2 focus:ring-[#083f30]/20"/>{" "}
              <div className="flex-1 text-sm">
                {" "}
                <p className="text-gray-900">
                  {" "}{tBooking("iAgreeToThe")}{" "}
                  <a href="#" className="font-semibold text-[#083f30] hover:underline">{tBooking("termsAndConditions")}</a>
                  ,{" "}
                  <a href="#" className="font-semibold text-[#083f30] hover:underline">{tBooking("privacyPolicy")}</a>{tBooking("and")}{" "}
                  <a href="#" className="font-semibold text-[#083f30] hover:underline">{tBooking("cancellationPolicy")}</a>{" "}
                </p>{" "}
              </div>{" "}
            </label>
            {/* Support Notice */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              {" "}
              <div className="flex gap-3">
                {" "}
                <Headphones size={18} className="mt-0.5 flex-shrink-0 text-blue-600"/>{" "}
                <div>
                  {" "}
                  <p className="mb-1 text-sm font-semibold text-blue-900">{tBooking("twentyFourSevenMedicalCoordinatorSupport")}</p>{" "}
                  <p className="text-sm text-blue-800">
                    {" "}{tBooking("aDedicatedCoordinatorWillBeAssignedAfterBookingConfirmation")}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>)}{" "}
      </div>
      {/* Sticky Bottom CTA */}
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white px-5 py-4 shadow-2xl">
        {" "}
        <div className="mb-3 flex items-center gap-3">
          {" "}
          {step > 1 && (<button onClick={handleBack} className="flex h-14 items-center gap-2 rounded-xl bg-gray-100 px-6 font-bold text-gray-900 transition-colors hover:bg-gray-200 active:scale-95">
              {" "}
              <ChevronLeft size={20}/>{tBooking("back")}{" "}
            </button>)}{" "}
          <button onClick={() => {
            if (step === 8 && canProceed()) {
                navigate("/app/booking/success");
            }
            else if (canProceed()) {
                handleNext();
            }
        }} disabled={!canProceed()} className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-xl font-bold transition-all ${canProceed() ? "bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white hover:shadow-xl active:scale-95" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>
            {" "}
            {step === 8 ? (<>
                {" "}
                <Shield size={20}/>{tBooking("confirmAndPayDollar")}{getDepositAmount()}{" "}
              </>) : (<>
                {" "}{tBooking("continue")}<ChevronRight size={20}/>{" "}
              </>)}{" "}
          </button>{" "}
        </div>{" "}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          {" "}
          <Shield size={12}/>{" "}
          <span>{tBooking("secureAndEncrypted")}{steps.length - step}{tBooking("stepsRemaining")}</span>{" "}
        </div>{" "}
      </div>{" "}
    </div>);
}
