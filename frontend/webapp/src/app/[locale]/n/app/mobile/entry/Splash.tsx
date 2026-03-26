"use client"

import { useEffect } from 'react';
import { useNavigate } from '@/hooks/use-navigate';

export default function Splash() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/language');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="h-screen bg-[#083f30] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        {/* Logo */}
        <div className="w-24 h-24 bg-[#eacb7f] rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
          <span className="text-4xl font-bold text-[#083f30]">L7</span>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">LSevin</h1>
        <p className="text-[#eacb7f] text-lg">Premium Health & Wellness</p>
        
        {/* Loading indicator */}
        <div className="mt-12">
          <div className="w-12 h-12 border-4 border-[#eacb7f]/30 border-t-[#eacb7f] rounded-full animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );
}
