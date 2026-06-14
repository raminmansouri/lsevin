"use client"

import { FlowNode } from '../data/architectureData';

interface FlowConnectorProps {
  from: FlowNode;
  to: FlowNode;
  scale: number;
}

export function FlowConnector({ from, to, scale }: FlowConnectorProps) {
  // Calculate connection points (center of nodes)
  const fromX = from.position.x + (from.type === 'decision' ? 48 : 80);
  const fromY = from.position.y + (from.type === 'decision' ? 48 : 48);
  const toX = to.position.x + (to.type === 'decision' ? 48 : 80);
  const toY = to.position.y + (to.type === 'decision' ? 48 : 48);
  
  // Simple curved path
  const midY = (fromY + toY) / 2;
  const path = `M ${fromX} ${fromY} Q ${fromX} ${midY}, ${(fromX + toX) / 2} ${midY} T ${toX} ${toY}`;
  
  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
        </marker>
      </defs>
      <path
        d={path}
        stroke="#94a3b8"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
        opacity="0.6"
      />
    </svg>
  );
}
