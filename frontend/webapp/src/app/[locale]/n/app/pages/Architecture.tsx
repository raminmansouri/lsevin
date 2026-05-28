import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';
import { FlowNode } from '../components/FlowNode';
import { FlowConnector } from '../components/FlowConnector';
import { ProjectInfo } from '../components/ProjectInfo';
import { flows, stages, modules, userRoles } from '../data/architectureData';

export default function Architecture() {
  const [scale, setScale] = useState(0.6);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setScale(Math.min(scale + 0.1, 2));
  const zoomOut = () => setScale(Math.max(scale - 0.1, 0.3));
  const resetView = () => {
    setScale(0.6);
    setPosition({ x: 0, y: 0 });
  };

  // Generate all connections
  const connections = flows.flatMap(node => 
    (node.connections || []).map(targetId => ({
      from: node,
      to: flows.find(n => n.id === targetId)!,
    })).filter(conn => conn.to)
  );

  return (
    <div className="h-full relative bg-white">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition"
          title="Zoom In"
        >
          <ZoomIn size={20} className="text-[#083f30]" />
        </button>
        <button
          onClick={zoomOut}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition"
          title="Zoom Out"
        >
          <ZoomOut size={20} className="text-[#083f30]" />
        </button>
        <button
          onClick={resetView}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition"
          title="Reset View"
        >
          <Maximize2 size={20} className="text-[#083f30]" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-[#083f30]" />
          <h3 className="font-semibold text-[#083f30]">Legend</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Stages</div>
            <div className="flex flex-wrap gap-1">
              {stages.map(stage => (
                <div
                  key={stage.id}
                  className="text-xs px-2 py-1 rounded text-white"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.name}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">User Roles</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {userRoles.slice(0, 4).map(role => (
                <div key={role.name} className="flex items-center gap-1">
                  <span>{role.icon}</span>
                  <span className="truncate">{role.name.split(' / ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t">
            <strong>Tip:</strong> Click and drag to pan, use zoom controls
          </div>
        </div>
      </div>

      {/* Module Key */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-md">
        <div className="text-xs font-semibold text-gray-600 mb-2">Modules</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {modules.slice(0, 12).map(module => (
            <div key={module.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: module.color }}
              />
              <span className="truncate">{module.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Project Info */}
      <ProjectInfo />

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`h-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            width: '3000px',
            height: '1500px',
            position: 'relative',
          }}
        >
          {/* Grid background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.1 }}>
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#083f30" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Stage Swimlanes */}
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className="absolute border-l-4 pl-4 py-2"
              style={{
                left: `${index * 500}px`,
                top: '50px',
                width: '480px',
                height: '1400px',
                borderColor: stage.color,
                backgroundColor: `${stage.color}08`,
              }}
            >
              <div
                className="font-bold text-sm mb-2 px-3 py-1 rounded inline-block text-white"
                style={{ backgroundColor: stage.color }}
              >
                {stage.name}
              </div>
            </div>
          ))}

          {/* Connections */}
          {connections.map((conn, index) => (
            <FlowConnector
              key={`${conn.from.id}-${conn.to.id}-${index}`}
              from={conn.from}
              to={conn.to}
              scale={1}
            />
          ))}

          {/* Flow Nodes */}
          {flows.map(node => (
            <FlowNode key={node.id} node={node} scale={1} />
          ))}
        </div>
      </div>
    </div>
  );
}