import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Search, Plus,
  X, Edit, Trash2, Eye, EyeOff, Clock
} from 'lucide-react';

interface Treatment {
  id: string;
  name: string;
  category: string;
  doctors: string[];
  duration: string;
  priceRange: string;
  status: 'active' | 'inactive';
  featured: boolean;
  bookings: number;
  description: string;
}

export default function ClinicTreatments() {
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/clinic/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/clinic/bookings', badge: 5 },
    { label: 'Doctors', icon: <Users size={20} />, path: '/provider/clinic/doctors' },
    { label: 'Treatments', icon: <Stethoscope size={20} />, path: '/provider/clinic/treatments' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/clinic/pricing' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/provider/clinic/availability' },
    { label: 'Media Gallery', icon: <Image size={20} />, path: '/provider/clinic/media' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/clinic/reviews' },
    { label: 'Promotions', icon: <TrendingUp size={20} />, path: '/provider/clinic/promotions' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/clinic/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/clinic/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/clinic/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/clinic/settings' },
  ];

  const treatments: Treatment[] = [
    {
      id: '1',
      name: 'Hair Transplant - FUE',
      category: 'Cosmetic Surgery',
      doctors: ['Dr. Ahmed Hassan', 'Dr. James Robertson'],
      duration: '4-6 hours',
      priceRange: '$2,500 - $5,000',
      status: 'active',
      featured: true,
      bookings: 234,
      description: 'Advanced follicular unit extraction hair transplant procedure with natural-looking results.'
    },
    {
      id: '2',
      name: 'Dental Implants',
      category: 'Dentistry',
      doctors: ['Dr. Maria Santos'],
      duration: '1-2 hours',
      priceRange: '$1,200 - $2,500',
      status: 'active',
      featured: true,
      bookings: 189,
      description: 'Permanent tooth replacement solution using titanium implants and ceramic crowns.'
    },
    {
      id: '3',
      name: 'IVF Treatment',
      category: 'Reproductive Health',
      doctors: ['Dr. Fatima Al-Rashid'],
      duration: '2-3 weeks',
      priceRange: '$3,000 - $6,000',
      status: 'active',
      featured: true,
      bookings: 124,
      description: 'Comprehensive in-vitro fertilization treatment with advanced embryo selection technology.'
    },
    {
      id: '4',
      name: 'Knee Arthroscopy',
      category: 'Orthopedics',
      doctors: ['Dr. James Robertson'],
      duration: '1-2 hours',
      priceRange: '$2,000 - $4,000',
      status: 'active',
      featured: false,
      bookings: 87,
      description: 'Minimally invasive knee surgery for diagnosis and treatment of joint problems.'
    },
    {
      id: '5',
      name: 'Laser Skin Resurfacing',
      category: 'Dermatology',
      doctors: ['Dr. Priya Sharma'],
      duration: '30-60 minutes',
      priceRange: '$800 - $1,500',
      status: 'active',
      featured: false,
      bookings: 156,
      description: 'Advanced laser treatment for skin rejuvenation and scar reduction.'
    },
    {
      id: '6',
      name: 'Root Canal Treatment',
      category: 'Dentistry',
      doctors: ['Dr. Maria Santos'],
      duration: '60-90 minutes',
      priceRange: '$400 - $800',
      status: 'active',
      featured: false,
      bookings: 203,
      description: 'Endodontic treatment to save infected or damaged teeth.'
    },
    {
      id: '7',
      name: 'Rhinoplasty',
      category: 'Cosmetic Surgery',
      doctors: ['Dr. Ahmed Hassan'],
      duration: '2-3 hours',
      priceRange: '$3,500 - $7,000',
      status: 'inactive',
      featured: false,
      bookings: 45,
      description: 'Surgical nose reshaping procedure for aesthetic or functional improvement.'
    },
  ];

  const categories = ['all', ...Array.from(new Set(treatments.map(t => t.category)))];

  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = treatment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          treatment.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || treatment.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: treatments.length,
    active: treatments.filter(t => t.status === 'active').length,
    featured: treatments.filter(t => t.featured).length,
    totalBookings: treatments.reduce((sum, t) => sum + t.bookings, 0)
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Treatments & Services"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Treatment Catalog</h1>
            <p className="text-gray-600 mt-1">Manage your medical services and procedures</p>
          </div>
          <button className="px-4 py-2.5 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2">
            <Plus size={18} />
            Add Treatment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Total Treatments</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Stethoscope size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Active</div>
                <div className="text-3xl font-bold text-green-600 mt-2">{stats.active}</div>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Eye size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Featured</div>
                <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.featured}</div>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Star size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Total Bookings</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">{stats.totalBookings}</div>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search treatments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
              />
            </div>
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>Sort by: Name</option>
              <option>Sort by: Bookings</option>
              <option>Sort by: Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Treatments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Treatment Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigned Doctors</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price Range</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTreatments.map(treatment => (
                <tr 
                  key={treatment.id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{treatment.name}</div>
                      {treatment.featured && (
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {treatment.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {treatment.doctors.length} doctor{treatment.doctors.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500">{treatment.doctors[0]}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock size={14} />
                      {treatment.duration}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{treatment.priceRange}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{treatment.bookings}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      treatment.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {treatment.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedTreatment(treatment)}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="View Details"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button 
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="Edit"
                      >
                        <Edit size={16} className="text-gray-600" />
                      </button>
                      <button 
                        className="p-1.5 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Treatment Detail Panel */}
      {selectedTreatment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={() => setSelectedTreatment(null)}>
          <div className="w-[500px] h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Treatment Details</h3>
              <button 
                onClick={() => setSelectedTreatment(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title & Status */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-xl text-gray-900">{selectedTreatment.name}</h3>
                  {selectedTreatment.featured && (
                    <Star size={20} className="fill-yellow-400 text-yellow-400" />
                  )}
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedTreatment.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedTreatment.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedTreatment.description}</p>
              </div>

              {/* Basic Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Treatment Information</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Category</div>
                    <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mt-1">
                      {selectedTreatment.category}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                      <Clock size={16} />
                      {selectedTreatment.duration}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Price Range</div>
                    <div className="font-medium text-gray-900 mt-1">{selectedTreatment.priceRange}</div>
                  </div>
                </div>
              </div>

              {/* Assigned Doctors */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Assigned Doctors</h4>
                <div className="space-y-2">
                  {selectedTreatment.doctors.map((doctor, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-[#083f30] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {doctor.split(' ')[1][0]}{doctor.split(' ')[2]?.[0] || ''}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{doctor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Performance</h4>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{selectedTreatment.bookings}</div>
                  <div className="text-sm text-gray-600">Total Bookings</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center justify-center gap-2">
                  <Edit size={16} />
                  Edit Treatment
                </button>
                <button className="w-full h-10 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  {selectedTreatment.featured ? <EyeOff size={16} /> : <Eye size={16} />}
                  {selectedTreatment.featured ? 'Remove from Featured' : 'Add to Featured'}
                </button>
                <button className="w-full h-10 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition flex items-center justify-center gap-2">
                  <Trash2 size={16} />
                  Delete Treatment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
