import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Upload, Trash2,
  StarIcon, Grid3x3, List, X
} from 'lucide-react';

interface MediaItem {
  id: string;
  type: 'clinic' | 'doctor' | 'treatment' | 'result';
  url: string;
  title: string;
  category: string;
  uploadDate: string;
  isCover: boolean;
}

export default function ClinicMedia() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);

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

  const mediaItems: MediaItem[] = [
    { id: '1', type: 'clinic', url: '#', title: 'Main Reception Area', category: 'Clinic Facilities', uploadDate: '2024-03-10', isCover: true },
    { id: '2', type: 'clinic', url: '#', title: 'Operating Room', category: 'Clinic Facilities', uploadDate: '2024-03-09', isCover: false },
    { id: '3', type: 'doctor', url: '#', title: 'Dr. Ahmed Hassan', category: 'Team Photos', uploadDate: '2024-03-08', isCover: false },
    { id: '4', type: 'doctor', url: '#', title: 'Dr. Maria Santos', category: 'Team Photos', uploadDate: '2024-03-08', isCover: false },
    { id: '5', type: 'treatment', url: '#', title: 'Hair Transplant Procedure', category: 'Treatment Images', uploadDate: '2024-03-07', isCover: false },
    { id: '6', type: 'treatment', url: '#', title: 'Dental Implant', category: 'Treatment Images', uploadDate: '2024-03-06', isCover: false },
    { id: '7', type: 'result', url: '#', title: 'Before & After - Patient 1', category: 'Results Gallery', uploadDate: '2024-03-05', isCover: false },
    { id: '8', type: 'result', url: '#', title: 'Before & After - Patient 2', category: 'Results Gallery', uploadDate: '2024-03-04', isCover: false },
    { id: '9', type: 'clinic', url: '#', title: 'Waiting Lounge', category: 'Clinic Facilities', uploadDate: '2024-03-03', isCover: false },
    { id: '10', type: 'clinic', url: '#', title: 'Consultation Room', category: 'Clinic Facilities', uploadDate: '2024-03-02', isCover: false },
    { id: '11', type: 'treatment', url: '#', title: 'IVF Laboratory', category: 'Treatment Images', uploadDate: '2024-03-01', isCover: false },
    { id: '12', type: 'doctor', url: '#', title: 'Medical Team Group', category: 'Team Photos', uploadDate: '2024-02-28', isCover: false },
  ];

  const categories = ['all', ...Array.from(new Set(mediaItems.map(item => item.category)))];

  const filteredMedia = mediaItems.filter(item => 
    categoryFilter === 'all' || item.category === categoryFilter
  );

  const stats = {
    total: mediaItems.length,
    clinic: mediaItems.filter(i => i.type === 'clinic').length,
    doctors: mediaItems.filter(i => i.type === 'doctor').length,
    treatments: mediaItems.filter(i => i.type === 'treatment').length,
    results: mediaItems.filter(i => i.type === 'result').length,
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Media Gallery"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Gallery</h1>
            <p className="text-gray-600 mt-1">Manage clinic photos and brand assets</p>
          </div>
          <button className="px-4 py-2.5 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2">
            <Upload size={18} />
            Upload Media
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Total Images</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Clinic Photos</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.clinic}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Team Photos</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{stats.doctors}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Treatments</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.treatments}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Results</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.results}</div>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
                <option>All Types</option>
                <option>Clinic</option>
                <option>Doctors</option>
                <option>Treatments</option>
                <option>Results</option>
              </select>
              <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
                <option>Sort by: Recent</option>
                <option>Sort by: Oldest</option>
                <option>Sort by: Name</option>
              </select>
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-[#083f30] text-white' : 'text-gray-600'}`}
              >
                <Grid3x3 size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-[#083f30] text-white' : 'text-gray-600'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-4 gap-6">
          {filteredMedia.map(item => (
            <div 
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition cursor-pointer group"
              onClick={() => setSelectedImage(item)}
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image size={48} className="text-gray-400" />
                </div>
                {item.isCover && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                    <StarIcon size={12} />
                    Cover
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button className="p-2 bg-white rounded-lg hover:bg-gray-100 transition">
                    <Image size={18} className="text-gray-700" />
                  </button>
                  <button className="p-2 bg-white rounded-lg hover:bg-gray-100 transition">
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="font-medium text-gray-900 mb-1">{item.title}</div>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                  {item.category}
                </span>
                <div className="text-xs text-gray-500 mt-2">{item.uploadDate}</div>
              </div>
            </div>
          ))}
          
          {/* Upload Card */}
          <button className="bg-white rounded-xl border-2 border-dashed border-gray-300 aspect-[4/3] hover:border-[#083f30] hover:bg-gray-50 transition flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload size={24} className="text-gray-600" />
            </div>
            <div className="text-sm font-medium text-gray-700">Upload New Media</div>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Preview</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Upload Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMedia.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="w-16 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
                      <Image size={20} className="text-gray-400" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 capitalize">{item.type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{item.uploadDate}</div>
                  </td>
                  <td className="px-6 py-4">
                    {item.isCover ? (
                      <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold gap-1">
                        <StarIcon size={12} />
                        Cover Image
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded transition">
                        <Image size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 rounded transition">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8" onClick={() => setSelectedImage(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{selectedImage.title}</h3>
              <button onClick={() => setSelectedImage(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-6">
                <Image size={96} className="text-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-medium text-gray-900 mt-1">{selectedImage.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Type</div>
                  <div className="font-medium text-gray-900 mt-1 capitalize">{selectedImage.type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Upload Date</div>
                  <div className="font-medium text-gray-900 mt-1">{selectedImage.uploadDate}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  {selectedImage.isCover ? (
                    <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold gap-1 mt-1">
                      <StarIcon size={12} />
                      Cover Image
                    </span>
                  ) : (
                    <div className="font-medium text-gray-900 mt-1">Active</div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
                  Set as Cover Image
                </button>
                <button className="flex-1 h-10 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition">
                  Delete Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
