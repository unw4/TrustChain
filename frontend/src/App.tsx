import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import LandingPage from './pages/LandingPage';
import AviationDashboard from './pages/AviationDashboard';
import ConstructionDashboard from './pages/ConstructionDashboard';
import AircraftDetail from './pages/AircraftDetail';
import PartDetail from './pages/PartDetail';
import BuildingDetail from './pages/BuildingDetail';
import CreateAsset from './pages/CreateAsset';
import { Plane, Building2, Home } from 'lucide-react';

function App() {
  const account = useCurrentAccount();
  const location = useLocation();

  // Determine current industry based on route
  const isAviationRoute = location.pathname.startsWith('/aviation');
  const isConstructionRoute = location.pathname.startsWith('/construction');
  const isLandingPage = location.pathname === '/';

  // Select icon, color and background based on route
  const getNavIcon = () => {
    if (isAviationRoute) return {
      Icon: Plane,
      color: 'bg-blue-600',
      bgStyle: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 25%, #93c5fd 50%, #bfdbfe 75%, #dbeafe 100%)'
    };
    if (isConstructionRoute) return {
      Icon: Building2,
      color: 'bg-emerald-600',
      bgStyle: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 25%, #6ee7b7 50%, #a7f3d0 75%, #d1fae5 100%)'
    };
    return {
      Icon: Home,
      color: 'bg-gradient-to-r from-blue-600 to-emerald-600',
      bgStyle: 'linear-gradient(135deg, #dbeafe 0%, #c7d2fe 20%, #a5b4fc 40%, #86efac 60%, #6ee7b7 80%, #d1fae5 100%)'
    };
  };

  const { Icon: NavIcon, color: navColor, bgStyle } = getNavIcon();

  return (
    <div className="min-h-screen" style={{ background: bgStyle }}>
      <nav className="border-b border-white/40 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className={`p-3 ${navColor} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <NavIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  TrustChain
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {isAviationRoute && '✈️ Aviation Supply Chain'}
                  {isConstructionRoute && '🏗️ Seismic Safety'}
                  {isLandingPage && '🔗 Universal RWA Tracking'}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              {!isLandingPage && (
                <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Home className="h-5 w-5 text-slate-600 hover:text-slate-900 transition-colors" />
                </Link>
              )}
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {!account && !isLandingPage ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className={`p-4 ${isAviationRoute ? 'bg-blue-100' : 'bg-emerald-100'} rounded-full mb-4`}>
              <NavIcon className={`h-16 w-16 ${isAviationRoute ? 'text-blue-600' : 'text-emerald-600'}`} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-slate-600 mb-6 max-w-md">
              Connect your Sui wallet to access the {isAviationRoute ? 'Aviation' : 'Construction'} dashboard and manage your assets.
            </p>
            <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl">
              <h3 className="font-semibold mb-2">Why TrustChain on Sui?</h3>
              <ul className="text-sm text-slate-600 space-y-2 text-left">
                <li>✓ Object-centric architecture for nested hierarchies</li>
                <li>✓ Dynamic Fields for unlimited sensor data</li>
                <li>✓ Built-in multi-sig transfer policies</li>
                <li>✓ Pennies in cost vs $50K+ on Ethereum</li>
              </ul>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* Aviation Routes */}
            <Route path="/aviation" element={<AviationDashboard />} />
            <Route path="/aviation/aircraft/:id" element={<AircraftDetail />} />
            <Route path="/aviation/part/:id" element={<PartDetail />} />
            <Route path="/aviation/create" element={<CreateAsset />} />

            {/* Construction Routes */}
            <Route path="/construction" element={<ConstructionDashboard />} />
            <Route path="/construction/building/:id" element={<BuildingDetail />} />

            {/* Legacy routes - redirect to aviation */}
            <Route path="/aircraft/:id" element={<AircraftDetail />} />
            <Route path="/part/:id" element={<PartDetail />} />
            <Route path="/create" element={<CreateAsset />} />
          </Routes>
        )}
      </main>

      <footer className="border-t mt-12 py-6 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600">
          <p className="font-semibold">Built for Sui 2nd Hackathon 2025</p>
          <p className="mt-1 text-xs">
            Demonstrating Sui's unique advantages for multi-industry critical infrastructure tracking
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
