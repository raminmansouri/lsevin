import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, User, Scissors, Dumbbell, Hotel, Plane, Pill, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';

const providerTypes = [
  { 
    id: 'clinic', 
    label: 'Clinic / Hospital', 
    icon: Building2, 
    description: 'Medical facilities, clinics, and hospitals',
    path: '/provider/onboarding/clinic',
    color: 'bg-blue-50 text-blue-600',
    borderColor: 'border-blue-200',
    accentColor: 'bg-blue-600'
  },
  { 
    id: 'doctor', 
    label: 'Doctor / Specialist', 
    icon: User, 
    description: 'Individual doctors and medical specialists',
    path: '/provider/onboarding/doctor',
    color: 'bg-purple-50 text-purple-600',
    borderColor: 'border-purple-200',
    accentColor: 'bg-purple-600'
  },
  { 
    id: 'salon', 
    label: 'Beauty Salon / Spa', 
    icon: Scissors, 
    description: 'Beauty salons, spas, and wellness centers',
    path: '/provider/onboarding/salon',
    color: 'bg-pink-50 text-pink-600',
    borderColor: 'border-pink-200',
    accentColor: 'bg-pink-600'
  },
  { 
    id: 'gym', 
    label: 'Gym / Fitness Center', 
    icon: Dumbbell, 
    description: 'Gyms, fitness centers, and personal trainers',
    path: '/provider/onboarding/gym',
    color: 'bg-orange-50 text-orange-600',
    borderColor: 'border-orange-200',
    accentColor: 'bg-orange-600'
  },
  { 
    id: 'hotel', 
    label: 'Hotel / Accommodation', 
    icon: Hotel, 
    description: 'Hotels, resorts, and accommodations',
    path: '/provider/onboarding/hotel',
    color: 'bg-indigo-50 text-indigo-600',
    borderColor: 'border-indigo-200',
    accentColor: 'bg-indigo-600'
  },
  { 
    id: 'tourism', 
    label: 'Tourism Provider', 
    icon: Plane, 
    description: 'Tour operators, transfers, and tourism services',
    path: '/provider/onboarding/tourism',
    color: 'bg-cyan-50 text-cyan-600',
    borderColor: 'border-cyan-200',
    accentColor: 'bg-cyan-600'
  },
  { 
    id: 'pharmacy', 
    label: 'Pharmacy', 
    icon: Pill, 
    description: 'Pharmacies and pharmaceutical services',
    path: '/provider/onboarding/pharmacy',
    color: 'bg-green-50 text-green-600',
    borderColor: 'border-green-200',
    accentColor: 'bg-green-600'
  },
  { 
    id: 'education', 
    label: 'Education Provider', 
    icon: GraduationCap, 
    description: 'Educational courses and training programs',
    path: '/provider/onboarding/education',
    color: 'bg-amber-50 text-amber-600',
    borderColor: 'border-amber-200',
    accentColor: 'bg-amber-600'
  },
];

export default function ProviderLogin() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  
  const handleContinue = () => {
    const provider = providerTypes.find(p => p.id === selectedType);
    if (provider) {
      navigate(provider.path);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        {/* Logo & Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-[#083f30] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-4xl font-bold text-white">L7</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Provider Portal</h1>
          <p className="text-lg text-gray-600">Select your provider type to begin onboarding</p>
        </div>
        
        {/* Provider Type Selection */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
          <div className="grid grid-cols-2 gap-5 mb-10">
            {providerTypes.map(type => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              const isHovered = hoveredType === type.id;
              
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  onMouseEnter={() => setHoveredType(type.id)}
                  onMouseLeave={() => setHoveredType(null)}
                  className={`relative p-7 rounded-2xl border-2 transition-all duration-300 text-left group ${
                    isSelected
                      ? 'border-[#083f30] bg-[#083f30]/5 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-[#083f30]/30 hover:shadow-md'
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <div className="w-7 h-7 bg-[#083f30] rounded-full flex items-center justify-center">
                        <CheckCircle2 className="text-white" size={16} />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-5">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isSelected ? 'bg-[#083f30] text-white shadow-lg' : `${type.color}`
                    }`}>
                      <Icon size={28} strokeWidth={2} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{type.label}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{type.description}</p>
                    </div>
                  </div>
                  
                  {/* Hover Effect Line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#083f30] to-[#eacb7f] rounded-b-2xl transition-opacity duration-300 ${
                    isHovered || isSelected ? 'opacity-100' : 'opacity-0'
                  }`} />
                </button>
              );
            })}
          </div>
          
          <button
            onClick={handleContinue}
            disabled={!selectedType}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              selectedType
                ? 'bg-[#083f30] text-white hover:bg-[#083f30]/90 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Onboarding
            <ArrowRight size={20} />
          </button>
        </div>
        
        {/* Footer Links */}
        <div className="text-center mt-8">
          <span className="text-gray-500">Administrative access? </span>
          <button 
            onClick={() => navigate('/admin/login')}
            className="font-semibold text-[#083f30] hover:text-[#083f30]/80 transition"
          >
            Admin Login →
          </button>
        </div>
      </div>
    </div>
  );
}