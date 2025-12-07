import { useCurrentAccount, useSuiClient, useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { Building2, Activity, AlertTriangle, Plus, TrendingUp } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { Link } from 'react-router-dom';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export default function ConstructionDashboard() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'building' | 'column'>('building');

  // Building form state
  const [buildingName, setBuildingName] = useState('');
  const [location, setLocation] = useState('');
  const [constructionYear, setConstructionYear] = useState('');
  const [buildingType, setBuildingType] = useState('');
  const [numFloors, setNumFloors] = useState('');
  const [seismicZone, setSeismicZone] = useState('');

  // Column form state
  const [columnId, setColumnId] = useState('');
  const [floorLevel, setFloorLevel] = useState('');
  const [columnType, setColumnType] = useState('');
  const [material, setMaterial] = useState('');
  const [maxTilt, setMaxTilt] = useState('');
  const [maxVibration, setMaxVibration] = useState('');
  const [crackThreshold, setCrackThreshold] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings', account?.address],
    queryFn: async () => {
      if (!account?.address) return { buildings: [] };

      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::building::Building`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return { buildings: objects.data };
    },
    enabled: !!account,
  });

  const { data: columns, isLoading: loadingColumns } = useQuery({
    queryKey: ['columns', account?.address],
    queryFn: async () => {
      if (!account?.address) return { columns: [] };

      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::column::Column`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return { columns: objects.data };
    },
    enabled: !!account,
  });

  // Calculate critical alerts (columns in critical or warning status)
  const criticalAlerts = columns?.columns?.filter((column: any) => {
    const status = column.data?.content?.fields?.status;
    return status === 'critical' || status === 'warning';
  }).length || 0;

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

  const handleCreateBuilding = () => {
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::building::create_building`,
      arguments: [
        tx.pure.string(buildingName),
        tx.pure.string(location),
        tx.pure.u64(parseInt(constructionYear)),
        tx.pure.string(buildingType),
        tx.pure.u64(parseInt(numFloors)),
        tx.pure.string(seismicZone),
      ],
    });

    signAndExecute(
      { transactionBlock: tx },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['buildings', account?.address] });
          setShowCreateModal(false);
          // Reset form
          setBuildingName('');
          setLocation('');
          setConstructionYear('');
          setBuildingType('');
          setNumFloors('');
          setSeismicZone('');
        },
      }
    );
  };

  const handleCreateColumn = () => {
    const tx = new Transaction();

    // Create the column
    const columnResult = tx.moveCall({
      target: `${PACKAGE_ID}::column::create_column`,
      arguments: [
        tx.pure.string(columnId),
        tx.pure.u64(parseInt(floorLevel)),
        tx.pure.string(columnType),
        tx.pure.string(material),
        tx.pure.u64(Date.now()),
        tx.pure.u64(parseInt(maxTilt)),
        tx.pure.u64(parseInt(maxVibration)),
        tx.pure.u64(parseInt(crackThreshold)),
      ],
    });

    // If a building is selected, attach the column to it
    if (selectedBuildingId) {
      tx.moveCall({
        target: `${PACKAGE_ID}::column::attach_to_building`,
        arguments: [
          columnResult,
          tx.pure.id(selectedBuildingId),
        ],
      });
    }

    signAndExecute(
      { transactionBlock: tx },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['columns', account?.address] });
          queryClient.invalidateQueries({ queryKey: ['buildings', account?.address] });
          setShowCreateModal(false);
          // Reset form
          setColumnId('');
          setFloorLevel('');
          setColumnType('');
          setMaterial('');
          setMaxTilt('');
          setMaxVibration('');
          setCrackThreshold('');
          setSelectedBuildingId('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Construction & Seismic Monitoring</h2>
          <p className="text-slate-600">Monitor structural integrity and seismic activity</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Create Asset
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Total Buildings</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{buildings?.buildings?.length || 0}</div>
            <p className="text-xs text-emerald-700 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Under monitoring
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-10">
            <Building2 className="h-24 w-24 text-emerald-600" />
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Structural Columns</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{columns?.columns?.length || 0}</div>
            <p className="text-xs text-blue-700 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Active sensors
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-10">
            <Activity className="h-24 w-24 text-blue-600" />
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Total Anomalies</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {columns?.columns?.reduce((total: number, col: any) => {
                return total + (parseInt(col.data?.content?.fields?.anomaly_count) || 0);
              }, 0) || 0}
            </div>
            <p className="text-xs text-purple-700 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Detected events
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-10">
            <Activity className="h-24 w-24 text-purple-600" />
          </div>
        </Card>

        <Card className={`relative overflow-hidden ${criticalAlerts > 0 ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-300 shadow-red-200' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${criticalAlerts > 0 ? 'text-red-900' : 'text-green-900'}`}>
              Critical Alerts
            </CardTitle>
            <div className={`p-2 rounded-lg ${criticalAlerts > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <AlertTriangle className={`h-5 w-5 ${criticalAlerts > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${criticalAlerts > 0 ? 'text-red-900' : 'text-green-900'}`}>
              {criticalAlerts}
            </div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${criticalAlerts > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {criticalAlerts > 0 ? (
                <>
                  <AlertTriangle className="h-3 w-3 animate-pulse" />
                  Requires attention
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
            <AlertTriangle className={`h-24 w-24 ${criticalAlerts > 0 ? 'text-red-600' : 'text-green-600'}`} />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="buildings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buildings">Buildings ({buildings?.buildings?.length || 0})</TabsTrigger>
          <TabsTrigger value="columns">Columns ({columns?.columns?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="buildings">
          <Card>
            <CardHeader>
              <CardTitle>Your Buildings</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBuildings ? (
                <div className="text-center py-8 text-slate-600">Loading buildings...</div>
              ) : buildings?.buildings?.length > 0 ? (
                <div className="space-y-4">
                  {buildings.buildings.map((building: any) => {
                    const fields = building.data.content?.fields;
                    return (
                      <Link
                        key={building.data.objectId}
                        to={`/construction/building/${building.data.objectId}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{fields?.building_name || 'Unknown'}</h3>
                              <p className="text-sm text-slate-600">
                                {fields?.location || 'Unknown Location'} • {fields?.building_type || 'Unknown Type'}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Seismic Zone: {fields?.seismic_zone || 'Unknown'} • {fields?.num_floors || 0} Floors
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium px-3 py-1 rounded-full border ${getStatusColor(fields?.status)}`}>
                              {fields?.status || 'active'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No buildings found</p>
                  <p className="text-sm text-slate-500">
                    Run the seismic test script to create buildings: ./scripts/create-seismic-test-data.sh
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle>Structural Columns</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingColumns ? (
                <div className="text-center py-8 text-slate-600">Loading columns...</div>
              ) : columns?.columns?.length > 0 ? (
                <div className="space-y-4">
                  {columns.columns.map((column: any) => {
                    const fields = column.data.content?.fields;
                    const anomalyCount = parseInt(fields?.anomaly_count || '0');
                    const status = fields?.status || 'active';
                    const currentTilt = parseInt(fields?.current_tilt || '0') / 10;
                    const currentVibration = parseInt(fields?.current_vibration || '0');
                    const currentCrack = parseInt(fields?.current_crack_width || '0') / 10;

                    return (
                      <div
                        key={column.data.objectId}
                        className={`p-4 border rounded-lg ${status === 'critical' ? 'border-red-300 bg-red-50' : status === 'warning' ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{fields?.column_id || 'Unknown'}</h3>
                            <p className="text-sm text-slate-600">
                              Floor {fields?.floor_level || 0} • {fields?.column_type || 'Unknown Type'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {fields?.material || 'Unknown Material'}
                            </p>
                          </div>
                          <div className={`text-sm font-medium px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
                            {status}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                          <div>
                            <p className="text-xs text-slate-500">Tilt</p>
                            <p className="text-sm font-medium">{currentTilt.toFixed(1)}°</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Vibration</p>
                            <p className="text-sm font-medium">{currentVibration}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Crack Width</p>
                            <p className="text-sm font-medium">{currentCrack.toFixed(1)}mm</p>
                          </div>
                        </div>

                        {anomalyCount > 0 && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">{anomalyCount} {anomalyCount === 1 ? 'anomaly' : 'anomalies'} detected</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No columns found</p>
                  <p className="text-sm text-slate-500">
                    Run the seismic test script to create columns: ./scripts/create-seismic-test-data.sh
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Asset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="text-sm font-medium">Asset Type</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={createType === 'building' ? 'default' : 'outline'}
                    onClick={() => setCreateType('building')}
                    className="w-full"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Building
                  </Button>
                  <Button
                    variant={createType === 'column' ? 'default' : 'outline'}
                    onClick={() => setCreateType('column')}
                    className="w-full"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Column/Sensor
                  </Button>
                </div>
              </div>

              {/* Building Form */}
              {createType === 'building' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Building Name</label>
                    <input
                      type="text"
                      className="w-full mt-2 p-2 border rounded-md"
                      value={buildingName}
                      onChange={(e) => setBuildingName(e.target.value)}
                      placeholder="e.g., Istanbul Plaza Tower"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <input
                      type="text"
                      className="w-full mt-2 p-2 border rounded-md"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Istanbul, Turkey"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Construction Year</label>
                      <input
                        type="number"
                        className="w-full mt-2 p-2 border rounded-md"
                        value={constructionYear}
                        onChange={(e) => setConstructionYear(e.target.value)}
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Number of Floors</label>
                      <input
                        type="number"
                        className="w-full mt-2 p-2 border rounded-md"
                        value={numFloors}
                        onChange={(e) => setNumFloors(e.target.value)}
                        placeholder="25"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Building Type</label>
                      <select
                        className="w-full mt-2 p-2 border rounded-md"
                        value={buildingType}
                        onChange={(e) => setBuildingType(e.target.value)}
                      >
                        <option value="">Select type...</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Mixed Use">Mixed Use</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Seismic Zone</label>
                      <select
                        className="w-full mt-2 p-2 border rounded-md"
                        value={seismicZone}
                        onChange={(e) => setSeismicZone(e.target.value)}
                      >
                        <option value="">Select zone...</option>
                        <option value="High Risk">High Risk</option>
                        <option value="Medium Risk">Medium Risk</option>
                        <option value="Low Risk">Low Risk</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Column Form */}
              {createType === 'column' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Attach to Building (Optional)</label>
                    <select
                      className="w-full mt-2 p-2 border rounded-md"
                      value={selectedBuildingId}
                      onChange={(e) => setSelectedBuildingId(e.target.value)}
                    >
                      <option value="">No building (standalone sensor)</option>
                      {buildings?.buildings?.map((building: any) => (
                        <option key={building.data.objectId} value={building.data.objectId}>
                          {building.data.content?.fields?.building_name} - {building.data.content?.fields?.location}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Column ID</label>
                    <input
                      type="text"
                      className="w-full mt-2 p-2 border rounded-md"
                      value={columnId}
                      onChange={(e) => setColumnId(e.target.value)}
                      placeholder="e.g., A-01, B-05"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Floor Level</label>
                      <input
                        type="number"
                        className="w-full mt-2 p-2 border rounded-md"
                        value={floorLevel}
                        onChange={(e) => setFloorLevel(e.target.value)}
                        placeholder="0 for ground floor"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Column Type</label>
                      <select
                        className="w-full mt-2 p-2 border rounded-md"
                        value={columnType}
                        onChange={(e) => setColumnType(e.target.value)}
                      >
                        <option value="">Select type...</option>
                        <option value="Load Bearing">Load Bearing</option>
                        <option value="Support">Support</option>
                        <option value="Decorative">Decorative</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Material</label>
                    <select
                      className="w-full mt-2 p-2 border rounded-md"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                    >
                      <option value="">Select material...</option>
                      <option value="Reinforced Concrete">Reinforced Concrete</option>
                      <option value="Steel">Steel</option>
                      <option value="Composite">Composite</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Sensor Thresholds</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-slate-600">Max Tilt (x10 degrees)</label>
                        <input
                          type="number"
                          className="w-full mt-1 p-2 border rounded-md"
                          value={maxTilt}
                          onChange={(e) => setMaxTilt(e.target.value)}
                          placeholder="15 = 1.5°"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600">Max Vibration</label>
                        <input
                          type="number"
                          className="w-full mt-1 p-2 border rounded-md"
                          value={maxVibration}
                          onChange={(e) => setMaxVibration(e.target.value)}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600">Crack Threshold (x10 mm)</label>
                        <input
                          type="number"
                          className="w-full mt-1 p-2 border rounded-md"
                          value={crackThreshold}
                          onChange={(e) => setCrackThreshold(e.target.value)}
                          placeholder="20 = 2.0mm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={createType === 'building' ? handleCreateBuilding : handleCreateColumn}
                  disabled={
                    createType === 'building'
                      ? !buildingName || !location || !constructionYear || !buildingType || !numFloors || !seismicZone
                      : !columnId || !floorLevel || !columnType || !material || !maxTilt || !maxVibration || !crackThreshold
                  }
                >
                  Create {createType === 'building' ? 'Building' : 'Column'}
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    // Reset all forms
                    setBuildingName('');
                    setLocation('');
                    setConstructionYear('');
                    setBuildingType('');
                    setNumFloors('');
                    setSeismicZone('');
                    setColumnId('');
                    setFloorLevel('');
                    setColumnType('');
                    setMaterial('');
                    setMaxTilt('');
                    setMaxVibration('');
                    setCrackThreshold('');
                    setSelectedBuildingId('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
