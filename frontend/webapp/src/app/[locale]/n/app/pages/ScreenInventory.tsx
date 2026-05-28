import { useState } from 'react';
import { Search, Filter, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { screenInventory, priorityColors, roleColors } from '../data/screenInventoryData';

export default function ScreenInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['Core Entry', 'Home & Discovery']));

  const toggleModule = (moduleName: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleName)) {
      newExpanded.delete(moduleName);
    } else {
      newExpanded.add(moduleName);
    }
    setExpandedModules(newExpanded);
  };

  const filteredInventory = screenInventory.map(module => ({
    ...module,
    screens: module.screens.filter(screen => {
      const matchesSearch = searchQuery === '' || 
        screen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        screen.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = selectedPriority === 'all' || screen.priority === selectedPriority;
      
      return matchesSearch && matchesPriority;
    }),
  })).filter(module => module.screens.length > 0);

  const totalScreens = screenInventory.reduce((acc, module) => acc + module.screens.length, 0);
  const p0Screens = screenInventory.reduce((acc, module) => 
    acc + module.screens.filter(s => s.priority === 'P0').length, 0
  );
  const p1Screens = screenInventory.reduce((acc, module) => 
    acc + module.screens.filter(s => s.priority === 'P1').length, 0
  );
  const p2Screens = screenInventory.reduce((acc, module) => 
    acc + module.screens.filter(s => s.priority === 'P2').length, 0
  );

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Header Section */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#083f30]">Screen Inventory</h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete catalog of all screens across the LSevin platform
              </p>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-[#083f30] text-white rounded-lg hover:bg-[#0a5a44] transition">
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-[#083f30]">{totalScreens}</div>
              <div className="text-xs text-gray-600">Total Screens</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">{p0Screens}</div>
              <div className="text-xs text-gray-600">P0 Critical</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-amber-600">{p1Screens}</div>
              <div className="text-xs text-gray-600">P1 Important</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{p2Screens}</div>
              <div className="text-xs text-gray-600">P2 Nice to Have</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search screens by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30]"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] bg-white"
              >
                <option value="all">All Priorities</option>
                <option value="P0">P0 Critical</option>
                <option value="P1">P1 Important</option>
                <option value="P2">P2 Nice to Have</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="p-6 space-y-4">
        {filteredInventory.map(module => (
          <div
            key={module.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module.name)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: module.color }}
                />
                <div className="text-left">
                  <div className="font-semibold text-[#083f30]">{module.name}</div>
                  <div className="text-xs text-gray-500">{module.description}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {module.screens.length} screen{module.screens.length !== 1 ? 's' : ''}
                </span>
                <div className={`transform transition-transform ${expandedModules.has(module.name) ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
            </button>

            {/* Screens */}
            {expandedModules.has(module.name) && (
              <div className="border-t divide-y">
                {module.screens.map(screen => (
                  <div key={screen.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-xs text-gray-400">{screen.id}</span>
                          <h4 className="font-semibold text-[#083f30]">{screen.name}</h4>
                          <span
                            className="px-2 py-0.5 text-xs font-semibold rounded text-white"
                            style={{ backgroundColor: priorityColors[screen.priority] }}
                          >
                            {screen.priority}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{screen.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {screen.userRoles.map(role => (
                            <span
                              key={role}
                              className="px-2 py-1 text-xs rounded-full text-white"
                              style={{ backgroundColor: roleColors[role] || '#64748b' }}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {screen.features.map(feature => (
                            <span
                              key={feature}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {screen.priority === 'P0' && (
                          <div className="flex items-center gap-1 text-red-600 text-xs">
                            <AlertCircle size={14} />
                            <span>Critical</span>
                          </div>
                        )}
                        {screen.priority === 'P1' && (
                          <div className="flex items-center gap-1 text-amber-600 text-xs">
                            <Clock size={14} />
                            <span>Important</span>
                          </div>
                        )}
                        {screen.priority === 'P2' && (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle size={14} />
                            <span>Optional</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="bg-white border-t p-6 sticky bottom-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredInventory.reduce((acc, m) => acc + m.screens.length, 0)} of {totalScreens} screens
          </div>
          
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-600" />
              <span>P0: MVP Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-600" />
              <span>P1: Important</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-600" />
              <span>P2: Nice to Have</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
