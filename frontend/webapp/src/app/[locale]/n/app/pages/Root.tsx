import { Outlet, Link, useLocation } from 'react-router';
import { Grid, List } from 'lucide-react';

export default function Root() {
  const location = useLocation();
  
  return (
    <div className="h-screen flex flex-col bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-[#083f30] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#eacb7f] rounded-lg flex items-center justify-center font-bold text-[#083f30] text-lg">
            L7
          </div>
          <div>
            <h1 className="font-bold text-xl">LSevin UX Architecture</h1>
            <p className="text-xs text-[#eacb7f]">Premium Health-Tech Super App</p>
          </div>
        </div>
        
        <nav className="flex gap-2">
          <Link
            to="/"
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              location.pathname === '/' 
                ? 'bg-[#eacb7f] text-[#083f30] font-semibold' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Grid size={18} />
            Architecture
          </Link>
          <Link
            to="/inventory"
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              location.pathname === '/inventory' 
                ? 'bg-[#eacb7f] text-[#083f30] font-semibold' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <List size={18} />
            Screen Inventory
          </Link>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
