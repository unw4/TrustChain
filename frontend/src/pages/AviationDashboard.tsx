import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Link } from 'react-router-dom';
import { Plus, Plane, AlertCircle, Wrench, TrendingUp, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export default function AviationDashboard() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const { data: aircraft, isLoading: loadingAircraft } = useQuery({
    queryKey: ['aircraft', account?.address],
    queryFn: async () => {
      if (!account?.address) return { aircraft: [] };

      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::aircraft::Aircraft`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return { aircraft: objects.data };
    },
    enabled: !!account,
  });

  const { data: parts, isLoading: loadingParts } = useQuery({
    queryKey: ['parts', account?.address],
    queryFn: async () => {
      if (!account?.address) return { parts: [] };

      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::part::Part`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return { parts: objects.data };
    },
    enabled: !!account,
  });

  // Calculate maintenance alerts (parts that need maintenance)
  const maintenanceAlerts = parts?.parts?.filter((part: any) => {
    const fields = part.data?.content?.fields;
    const totalHours = parseInt(fields?.total_flight_hours || '0');
    const maintenanceDue = parseInt(fields?.maintenance_due_hours || '0');
    return totalHours >= maintenanceDue;
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Aviation Fleet Dashboard</h2>
          <p className="text-slate-600">Manage your aircraft and parts on Sui</p>
        </div>
        <Link to="/aviation/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Asset
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Aircraft</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Plane className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{aircraft?.aircraft?.length || 0}</div>
            <p className="text-xs text-blue-700 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Active fleet
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-10">
            <Plane className="h-24 w-24 text-blue-600" />
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Total Parts</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{parts?.parts?.length || 0}</div>
            <p className="text-xs text-orange-700 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              All components
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-10">
            <Wrench className="h-24 w-24 text-orange-600" />
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Flight Hours</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Plane className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {aircraft?.aircraft?.reduce((total: number, ac: any) => {
                return total + (parseInt(ac.data?.content?.fields?.total_flight_hours) || 0);
              }, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-purple-700 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Total across fleet
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-10">
            <Plane className="h-24 w-24 text-purple-600" />
          </div>
        </Card>

        <Card className={`relative overflow-hidden ${maintenanceAlerts > 0 ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-300 shadow-red-200' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${maintenanceAlerts > 0 ? 'text-red-900' : 'text-green-900'}`}>
              Maintenance Alerts
            </CardTitle>
            <div className={`p-2 rounded-lg ${maintenanceAlerts > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <AlertCircle className={`h-5 w-5 ${maintenanceAlerts > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${maintenanceAlerts > 0 ? 'text-red-900' : 'text-green-900'}`}>
              {maintenanceAlerts}
            </div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${maintenanceAlerts > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {maintenanceAlerts > 0 ? (
                <>
                  <AlertCircle className="h-3 w-3 animate-pulse" />
                  Parts need maintenance
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3" />
                  All systems normal
                </>
              )}
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-10">
            <AlertCircle className={`h-24 w-24 ${maintenanceAlerts > 0 ? 'text-red-600' : 'text-green-600'}`} />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="aircraft" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="aircraft">Aircraft ({aircraft?.aircraft?.length || 0})</TabsTrigger>
          <TabsTrigger value="parts">Parts ({parts?.parts?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="aircraft">
          <Card>
            <CardHeader>
              <CardTitle>Your Aircraft</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAircraft ? (
                <div className="text-center py-8 text-slate-600">Loading aircraft...</div>
              ) : aircraft?.aircraft?.length > 0 ? (
                <div className="space-y-4">
                  {aircraft.aircraft.map((ac: any) => {
                    const aircraftId = ac.data.objectId;
                    // Check if this aircraft has any parts needing maintenance
                    const partsNeedingMaintenance = parts?.parts?.filter((part: any) => {
                      const fields = part.data.content?.fields;
                      const partAircraftId = fields?.aircraft_id;
                      const totalHours = parseInt(fields?.total_flight_hours || '0');
                      const maintenanceDue = parseInt(fields?.maintenance_due_hours || '0');
                      return partAircraftId === aircraftId && totalHours >= maintenanceDue;
                    }).length || 0;

                    return (
                      <Link
                        key={ac.data.objectId}
                        to={`/aviation/aircraft/${ac.data.objectId}`}
                        className="block"
                      >
                        <div className={`flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors ${partsNeedingMaintenance > 0 ? 'border-orange-300 bg-orange-50' : ''}`}>
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${partsNeedingMaintenance > 0 ? 'bg-orange-100' : 'bg-blue-100'}`}>
                              <Plane className={`h-6 w-6 ${partsNeedingMaintenance > 0 ? 'text-orange-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {ac.data.content?.fields?.tail_number || 'Unknown'}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {ac.data.content?.fields?.model || 'Unknown Model'}
                              </p>
                              {partsNeedingMaintenance > 0 && (
                                <p className="text-xs text-orange-600 mt-1 font-medium">
                                  ⚠️ {partsNeedingMaintenance} {partsNeedingMaintenance === 1 ? 'part needs' : 'parts need'} maintenance
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {ac.data.content?.fields?.total_flight_hours || 0} hrs
                            </div>
                            <div className="text-xs text-slate-600">
                              Status: {ac.data.content?.fields?.status || 'active'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Plane className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No aircraft found</p>
                  <Link to="/aviation/create">
                    <Button>Create Your First Aircraft</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts">
          <Card>
            <CardHeader>
              <CardTitle>Your Parts</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingParts ? (
                <div className="text-center py-8 text-slate-600">Loading parts...</div>
              ) : parts?.parts?.length > 0 ? (
                <div className="space-y-4">
                  {parts.parts.map((part: any) => {
                    const fields = part.data.content?.fields;
                    const aircraftId = fields?.aircraft_id;
                    const totalHours = parseInt(fields?.total_flight_hours || '0');
                    const maintenanceDue = parseInt(fields?.maintenance_due_hours || '0');
                    const needsMaintenance = totalHours >= maintenanceDue;

                    return (
                      <Link
                        key={part.data.objectId}
                        to={`/aviation/part/${part.data.objectId}`}
                        className="block"
                      >
                        <div className={`flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors ${needsMaintenance ? 'border-red-300 bg-red-50' : ''}`}>
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${needsMaintenance ? 'bg-red-100' : 'bg-orange-100'}`}>
                              <Wrench className={`h-6 w-6 ${needsMaintenance ? 'text-red-600' : 'text-orange-600'}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {fields?.serial_number || 'Unknown'}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {fields?.part_type || 'Unknown Type'} - {fields?.manufacturer || 'Unknown'}
                              </p>
                              {aircraftId && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ Attached to Aircraft
                                </p>
                              )}
                              {needsMaintenance && (
                                <p className="text-xs text-red-600 mt-1 font-medium">
                                  ⚠️ Maintenance Overdue
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${needsMaintenance ? 'text-red-600' : ''}`}>
                              {totalHours}/{maintenanceDue} hrs
                            </div>
                            <div className="text-xs text-slate-600">
                              Status: {fields?.status || 'active'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No parts found</p>
                  <Link to="/aviation/create">
                    <Button>Create Your First Part</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
