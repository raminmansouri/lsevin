"use client"


import { useTranslations } from "next-intl";
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../design-system/components';

export default function AdminLogin() {
  const tAdmin = useTranslations("AdminGenerated");
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      navigate('/admin/dashboard');
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#083f30] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">{tAdmin("l7")}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tAdmin("lSevinAdmin")}</h1>
          <p className="text-gray-600">{tAdmin("signInToAccessTheAdminPanel")}</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="space-y-5 mb-6">
            <Input
              label={tAdmin("emailAddress")}
              type="email"
              placeholder={tAdmin("adminLsevinCom")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={20} />}
            />
            
            <Input
              label={tAdmin("password")}
              type={showPassword ? 'text' : 'password'}
              placeholder={tAdmin("enterYourPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              rightIcon={
                <button onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
              <span className="text-sm text-gray-600">{tAdmin("rememberMe")}</span>
            </label>
            <button className="text-sm font-medium text-[#083f30] hover:underline">
              Forgot password?
            </button>
          </div>
          
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full"
            onClick={handleLogin}
            isLoading={isLoading}
          >
            Sign In
          </Button>
          
          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>{tAdmin("securityNotice")}</strong> This is a restricted area. All login attempts are monitored and logged.
            </p>
          </div>
        </div>
        
        {/* Provider Login Link */}
        <div className="text-center mt-6">
          <span className="text-gray-600">{tAdmin("areYouAProvider")}</span>
          <button 
            onClick={() => navigate('/provider/login')}
            className="font-semibold text-[#083f30] hover:underline"
          >
            Provider Login
          </button>
        </div>
      </div>
    </div>
  );
}
