import { Outlet } from 'react-router';
import { BottomTabBar } from '../design-system/mobile-components';

export default function MobileRoot() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Outlet />
      <BottomTabBar />
    </div>
  );
}
