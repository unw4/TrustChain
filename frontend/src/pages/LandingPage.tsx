import { useNavigate } from 'react-router-dom';
import { Plane, Building2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();

  const industries = [
    {
      id: 'aviation',
      title: 'Aviation Supply Chain',
      description: 'Track aircraft parts hierarchy and flight history with immutable audit trails.',
      icon: Plane,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      cardBg: 'hover:bg-blue-50',
      route: '/aviation',
      features: [
        'Aircraft fleet management',
        'Part hierarchy tracking',
        'Flight hours & cycles',
        'Maintenance history'
      ]
    },
    {
      id: 'construction',
      title: 'Seismic Safety & Construction',
      description: 'Monitor structural integrity and earthquake sensors for critical infrastructure.',
      icon: Building2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      cardBg: 'hover:bg-emerald-50',
      route: '/construction',
      features: [
        'Building column monitoring',
        'Seismic sensor data',
        'Structural integrity alerts',
        'Real-time anomaly detection'
      ]
    }
  ];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-8 py-12">
      <div className="text-center space-y-4 max-w-3xl">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          TrustChain: Universal RWA Tracking
        </h1>
        <p className="text-xl text-slate-600">
          Immutable digital twins for critical infrastructure across multiple industries
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Powered by Sui Blockchain</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>99.998% Cost Reduction</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl px-4">
        {industries.map((industry) => {
          const Icon = industry.icon;
          return (
            <Card
              key={industry.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${industry.cardBg} border-2 hover:border-slate-300`}
              onClick={() => navigate(industry.route)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-4 ${industry.iconBg} rounded-xl`}>
                    <Icon className={`h-10 w-10 ${industry.iconColor}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </div>
                <CardTitle className="text-2xl mt-4">{industry.title}</CardTitle>
                <CardDescription className="text-base">
                  {industry.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Key Features:</p>
                  <ul className="space-y-1.5">
                    {industry.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="w-full mt-6 gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(industry.route);
                  }}
                >
                  Explore {industry.title}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center max-w-2xl px-4">
        <div className="bg-white/60 backdrop-blur-sm border rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-3 text-slate-900">Why Sui Blockchain?</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Object-centric architecture for nested hierarchies</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Dynamic Fields for unlimited sensor data</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Built-in multi-sig transfer policies</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Pennies in cost vs $50K+ on Ethereum</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
