import { Car, CheckCircle2, ChevronRight, Globe, Headphones, HotelIcon, Info, Plus, Shield } from "lucide-react";

const addons = [
    {
        id: 'hotel',
        name: '4-Star Hotel Package',
        description: '3 nights accommodation near clinic',
        price: 180,
        icon: <HotelIcon size={24} className="text-[#083f30]" />,
        popular: true,
        details: ['Breakfast included', 'Free WiFi', '10 min from clinic']
    },
    {
        id: 'transfer',
        name: 'VIP Airport Transfer',
        description: 'Round-trip luxury car service',
        price: 80,
        icon: <Car size={24} className="text-[#083f30]" />,
        popular: true,
        details: ['Meet & greet', 'Premium vehicle', 'Professional driver']
    },
    {
        id: 'translator',
        name: 'Personal Translator',
        description: 'Dedicated translator for your stay',
        price: 120,
        icon: <Globe size={24} className="text-[#083f30]" />,
        details: ['Available 24/7', 'Medical terminology expert', 'Multiple languages']
    },
    {
        id: 'vip',
        name: 'VIP Patient Support',
        description: 'Priority support & concierge service',
        price: 150,
        icon: <Headphones size={24} className="text-[#083f30]" />,
        details: ['24/7 hotline', 'Dedicated coordinator', 'Priority scheduling']
    },
    {
        id: 'insurance',
        name: 'Medical Travel Insurance',
        description: 'Comprehensive coverage for your trip',
        price: 95,
        icon: <Shield size={24} className="text-[#083f30]" />,
        details: ['Trip cancellation', 'Medical complications', 'Lost baggage']
    },
];



export const AddOns = ({ handleNext, selectedAddons, setSelectedAddons, toggleAddon }) => {
    return (<>
        <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enhance Your Experience</h2>
            <p className="text-sm text-gray-600 mb-4">
                Optional add-ons to make your medical journey seamless
            </p>
        </div>

        <div className="space-y-3">
            {addons.map(addon => (
                <div
                    key={addon.id}
                    className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${selectedAddons.includes(addon.id)
                            ? 'border-[#083f30] shadow-md'
                            : 'border-gray-200'
                        }`}
                >
                    <div className="p-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-[#083f30]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                {addon.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900">{addon.name}</h3>
                                            {addon.popular && (
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-bold">
                                                    POPULAR
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{addon.description}</p>
                                    </div>

                                    <div className="text-right ml-3">
                                        <div className="text-lg font-bold text-[#083f30]">
                                            +${addon.price}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {addon.details.map((detail, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-700"
                                        >
                                            • {detail}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => toggleAddon(addon.id)}
                                    className={`w-full h-10 rounded-xl font-semibold transition-all ${selectedAddons.includes(addon.id)
                                            ? 'bg-[#083f30] text-white'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }`}
                                >
                                    {selectedAddons.includes(addon.id) ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <CheckCircle2 size={18} />
                                            Added
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Plus size={18} />
                                            Add to Package
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-bold text-blue-900 mb-1">Save with Bundles</h3>
                    <p className="text-sm text-blue-800">
                        Add 3 or more services and get 10% off all add-ons
                    </p>
                </div>
            </div>
        </div>

        {/* Continue Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 shadow-md">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-blue-900 mb-1">
                        {selectedAddons.length > 0
                            ? `${selectedAddons.length} Add-on${selectedAddons.length > 1 ? 's' : ''} Selected`
                            : 'Ready to Continue'
                        }
                    </h3>
                    <p className="text-sm text-blue-800">
                        {selectedAddons.length > 0
                            ? 'Enhance your treatment with premium services'
                            : 'You can add services later or continue to the next step'
                        }
                    </p>
                </div>
            </div>

            {/* Continue Button */}
            <button
                onClick={handleNext}
                className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
                {selectedAddons.length > 0 ? 'Continue to Medical Files' : 'Skip to Medical Files'}
                <ChevronRight size={20} />
            </button>
        </div>

    </>)
}