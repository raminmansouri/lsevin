import { FlowNode as FlowNodeType, modules } from '../data/architectureData';

interface FlowNodeProps {
  node: FlowNodeType;
  scale: number;
}

export function FlowNode({ node, scale }: FlowNodeProps) {
  const moduleColor = modules.find(m => m.name === node.module)?.color || '#64748b';
  
  if (node.type === 'start' || node.type === 'end') {
    return (
      <div
        className="absolute"
        style={{
          left: `${node.position.x}px`,
          top: `${node.position.y}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div className="w-20 h-20 rounded-full bg-[#083f30] border-4 border-[#eacb7f] flex items-center justify-center text-white font-bold text-xs shadow-lg">
          {node.title}
        </div>
      </div>
    );
  }
  
  if (node.type === 'decision') {
    return (
      <div
        className="absolute"
        style={{
          left: `${node.position.x}px`,
          top: `${node.position.y}px`,
          transform: `scale(${scale}) rotate(45deg)`,
          transformOrigin: 'top left',
        }}
      >
        <div 
          className="w-24 h-24 flex items-center justify-center text-white font-semibold text-xs shadow-lg"
          style={{ backgroundColor: moduleColor }}
        >
          <span className="inline-block" style={{ transform: 'rotate(-45deg)' }}>
            {node.title}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className="absolute"
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <div 
        className="w-40 h-24 rounded-lg flex flex-col items-center justify-center text-white shadow-lg border-2 transition-transform hover:scale-105 cursor-pointer"
        style={{ 
          backgroundColor: moduleColor,
          borderColor: node.stage === 'entry' ? '#eacb7f' : 'transparent'
        }}
      >
        <div className="font-semibold text-sm text-center px-2">{node.title}</div>
        <div className="text-xs opacity-75 mt-1">{node.module}</div>
      </div>
    </div>
  );
}
