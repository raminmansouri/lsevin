"use client"

import { Info, Users, Layers, FileText } from 'lucide-react';

export function ProjectInfo() {
  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <Info size={18} className="text-[#083f30]" />
        <h3 className="font-semibold text-[#083f30]">Project: LSevin</h3>
      </div>
      
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[#eacb7f]" />
          <span>9 User Roles</span>
        </div>
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-[#eacb7f]" />
          <span>6 Core Stages</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#eacb7f]" />
          <span>100+ Screens</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
        <strong>Brand:</strong> #083f30 / #eacb7f
      </div>
    </div>
  );
}
