import { useParams, Link } from 'react-router-dom';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Activity, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export default function BuildingDetail() {
  const { id } = useParams();
  const suiClient = useSuiClient();
  const account = useCurrentAccount();

  const { data: building, isLoading } = useQuery({
    queryKey: ['building', id],
    queryFn: async () => {
      const object = await suiClient.getObject({
        id: id!,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });
      return object.data;
    },
    enabled: !!id,
  });

  const fields = building?.content?.fields;

  // Get all columns attached to this building
  const { data: attachedColumns } = useQuery({
    queryKey: ['building-columns', id],
    queryFn: async () => {
      if (!account?.address) return [];

      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::column::Column`,
        },
        options: {
          showContent: true,
        },
      });

      // Filter columns that are attached to this building
      return objects.data.filter((col: any) => {
        const buildingId = col.data?.content?.fields?.building_id;
        return buildingId === id;
      });
    },
    enabled: !!id && !!account,
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'under_inspection':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  // Count critical columns
  const criticalColumns = attachedColumns?.filter((col: any) => {
    const status = col.data?.content?.fields?.status;
    return status === 'critical' || status === 'warning';
  }).length || 0;

  if (isLoading) {
    return <div className="text-center py-12">Loading building...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/construction">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="p-4 bg-blue-100 rounded-lg">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">{fields?.building_name || 'Unknown Building'}</h2>
          <p className="text-slate-600">{fields?.location || 'Unknown Location'}</p>
        </div>
      </div>

      {criticalColumns > 0 && (
        <Card className="border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Structural Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800">
              This building has {criticalColumns} {criticalColumns === 1 ? 'column' : 'columns'} requiring attention (critical or warning status).
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Building Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{fields?.building_type || 'Unknown'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Number of Floors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{fields?.num_floors || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Seismic Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{fields?.seismic_zone || 'Unknown'}</p>
          </CardContent>
        </Card>

        <Card className={criticalColumns > 0 ? 'border-orange-500' : ''}>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Status
              {criticalColumns > 0 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold capitalize ${criticalColumns > 0 ? 'text-orange-600' : ''}`}>
              {fields?.status || 'active'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Attached Columns & Sensors ({attachedColumns?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attachedColumns && attachedColumns.length > 0 ? (
            <div className="space-y-4">
              {attachedColumns.map((column: any) => {
                const colFields = column.data.content?.fields;
                const status = colFields?.status || 'active';
                const anomalyCount = parseInt(colFields?.anomaly_count || '0');
                const currentTilt = parseInt(colFields?.current_tilt || '0') / 10;
                const currentVibration = parseInt(colFields?.current_vibration || '0');
                const currentCrack = parseInt(colFields?.current_crack_width || '0') / 10;

                return (
                  <div
                    key={column.data.objectId}
                    className={`p-4 border rounded-lg ${
                      status === 'critical'
                        ? 'border-red-300 bg-red-50'
                        : status === 'warning'
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{colFields?.column_id || 'Unknown'}</h3>
                        <p className="text-sm text-slate-600">
                          Floor {colFields?.floor_level || 0} • {colFields?.column_type || 'Unknown Type'}
                        </p>
                        <p className="text-xs text-slate-500">{colFields?.material || 'Unknown Material'}</p>
                      </div>
                      <div className={`text-sm font-medium px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
                        {status}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                      <div>
                        <p className="text-xs text-slate-500">Tilt</p>
                        <p className="text-sm font-medium">{currentTilt.toFixed(1)}°</p>
                        <p className="text-xs text-slate-400">
                          Max: {(parseInt(colFields?.max_tilt_degrees || '0') / 10).toFixed(1)}°
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Vibration</p>
                        <p className="text-sm font-medium">{currentVibration}</p>
                        <p className="text-xs text-slate-400">Max: {colFields?.max_vibration || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Crack Width</p>
                        <p className="text-sm font-medium">{currentCrack.toFixed(1)}mm</p>
                        <p className="text-xs text-slate-400">
                          Max: {(parseInt(colFields?.crack_width_threshold || '0') / 10).toFixed(1)}mm
                        </p>
                      </div>
                    </div>

                    {anomalyCount > 0 && (
                      <div className="mt-3 pt-3 border-t flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {anomalyCount} {anomalyCount === 1 ? 'anomaly' : 'anomalies'} detected
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No columns/sensors attached to this building yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Object ID:</span>
            <span className="font-mono text-sm">
              {id?.slice(0, 12)}...{id?.slice(-8)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Construction Year:</span>
            <span className="font-medium">{fields?.construction_year || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Total Columns:</span>
            <span className="font-medium">{attachedColumns?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Critical/Warning Columns:</span>
            <span className={`font-medium ${criticalColumns > 0 ? 'text-orange-600' : ''}`}>
              {criticalColumns}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
