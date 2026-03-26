"use client"

import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { ChevronLeft, Lock, Eye, EyeOff, Fingerprint, Smartphone, MapPin, Bell, Trash2 } from 'lucide-react';
import { Input, Button } from '../../design-system/components';

export default function PrivacySecurity() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  
  const activeSessions = [
    { id: 1, device: 'iPhone 14 Pro', location: 'Dubai, UAE', current: true, lastActive: 'Active now' },
    { id: 2, device: 'MacBook Pro', location: 'Dubai, UAE', current: false, lastActive: '2 hours ago' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/app/settings')}
            className="w-10 h-10 -ml-2 flex items-center justify-center text-gray-600"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Privacy & Security</h1>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-4">Change Password</h3>
          <div className="space-y-4">
            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              rightIcon={
                <button onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              rightIcon={
                <button onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              rightIcon={
                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
            <Button variant="primary" size="lg" className="w-full">
              Update Password
            </Button>
          </div>
        </div>
        
        {/* Biometric Login */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Fingerprint size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Biometric Login</h3>
                <p className="text-sm text-gray-600">Use Face ID or fingerprint</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={biometricEnabled}
                onChange={(e) => setBiometricEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083f30]"></div>
            </label>
          </div>
        </div>
        
        {/* Active Sessions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-4">Active Sessions</h3>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Smartphone size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{session.device}</p>
                      {session.current && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">Current</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{session.location}</p>
                    <p className="text-xs text-gray-500 mt-1">{session.lastActive}</p>
                  </div>
                </div>
                {!session.current && (
                  <button className="text-red-600 text-sm font-medium">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Privacy Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-4">Privacy Controls</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-gray-600" />
                <span className="text-gray-900">Location Permissions</span>
              </div>
              <span className="text-sm text-gray-600">Manage</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-gray-600" />
                <span className="text-gray-900">Notification Permissions</span>
              </div>
              <span className="text-sm text-gray-600">Manage</span>
            </button>
          </div>
        </div>
        
        {/* Delete Account */}
        <div className="bg-white rounded-xl border-2 border-red-200 p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Delete Account</h3>
              <p className="text-sm text-gray-600">Permanently delete your LSevin account and all data. This action cannot be undone.</p>
            </div>
          </div>
          <button className="w-full h-12 border-2 border-red-600 text-red-600 rounded-xl font-medium hover:bg-red-50 transition">
            Request Account Deletion
          </button>
        </div>
      </div>
    </div>
  );
}
