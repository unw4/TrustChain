import { useParams, Link } from 'react-router-dom';
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, Wrench, Clock, Activity, Plus } from 'lucide-react';
import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export default function AircraftDetail() {
  const { id } = useParams();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [flightHours, setFlightHours] = useState('');

  const { data: aircraft, isLoading } = useQuery({
    queryKey: ['aircraft', id],
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

  // Get all parts owned by this user
  const { data: allParts } = useQuery({
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

  // Filter parts attached to this aircraft
  const attachedParts = allParts?.parts?.filter(
    (part: any) => part.data.content?.fields?.aircraft_id === id
  ) || [];

  const fields = aircraft?.content?.fields;

  const handleAddFlightHours = async () => {
    if (!id || !flightHours) return;

    const hours = parseInt(flightHours);
    if (isNaN(hours) || hours <= 0) return;

    const tx = new Transaction();

    // Update aircraft flight hours
    tx.moveCall({
      target: `${PACKAGE_ID}::aircraft::complete_flight`,
      arguments: [
        tx.object(id),
        tx.pure.u64(hours),
        tx.pure.u64(Date.now()),
      ],
    });

    // Update all attached parts' flight hours
    attachedParts.forEach((part: any) => {
      tx.moveCall({
        target: `${PACKAGE_ID}::part::update_flight_hours`,
        arguments: [
          tx.object(part.data.objectId),
          tx.pure.u64(hours),
        ],
      });
    });

    signAndExecute(
      { transactionBlock: tx },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['aircraft', id] });
          queryClient.invalidateQueries({ queryKey: ['parts'] });
          setShowFlightModal(false);
          setFlightHours('');
        },
      }
    );
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading aircraft...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-lg">
            <Plane className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">{fields?.tail_number || 'Unknown Aircraft'}</h2>
            <p className="text-slate-600">{fields?.model || 'Unknown Model'}</p>
          </div>
        </div>
        <Button onClick={() => setShowFlightModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Flight Hours
        </Button>
      </div>

      {showFlightModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Add Flight Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Flight Hours</label>
                <input
                  type="number"
                  className="w-full mt-2 p-2 border rounded-md"
                  placeholder="Enter hours (e.g., 5)"
                  value={flightHours}
                  onChange={(e) => setFlightHours(e.target.value)}
                  min="1"
                />
                <p className="text-xs text-slate-600 mt-2">
                  This will update the aircraft and all {attachedParts.length} attached parts.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAddFlightHours}
                  disabled={!flightHours || parseInt(flightHours) <= 0}
                >
                  Add Hours
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setShowFlightModal(false);
                    setFlightHours('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Manufacturer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{fields?.manufacturer || 'Unknown'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Flight Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{fields?.total_flight_hours || 0} hrs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{fields?.total_cycles || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{fields?.status || 'active'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Attached Parts ({attachedParts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attachedParts.length > 0 ? (
            <div className="space-y-4">
              {attachedParts.map((part: any) => {
                const partFields = part.data.content?.fields;
                const partHours = parseInt(partFields?.total_flight_hours || '0');
                const partMaintenanceDue = parseInt(partFields?.maintenance_due_hours || '0');
                const partNeedsMaintenance = partHours >= partMaintenanceDue;

                return (
                  <Link
                    key={part.data.objectId}
                    to={`/part/${part.data.objectId}`}
                    className="block"
                  >
                    <div className={`flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors ${partNeedsMaintenance ? 'border-orange-500 bg-orange-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <Wrench className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {partFields?.serial_number || 'Unknown'}
                            {partNeedsMaintenance && (
                              <span className="text-orange-600 text-xs font-medium px-2 py-0.5 bg-orange-200 rounded">
                                Maintenance Due
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {partFields?.part_type || 'Unknown Type'} - {partFields?.manufacturer || ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${partNeedsMaintenance ? 'text-orange-600' : ''}`}>
                          {partHours} hrs
                        </div>
                        <div className="text-xs text-slate-600">
                          Due: {partMaintenanceDue} hrs
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No parts attached to this aircraft yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aircraft Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Object ID:</span>
            <span className="font-mono text-sm">{id?.slice(0, 12)}...{id?.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Manufacture Date:</span>
            <span className="font-medium">
              {fields?.manufacture_date
                ? new Date(parseInt(fields.manufacture_date)).toLocaleDateString()
                : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Operator:</span>
            <span className="font-mono text-xs">
              {fields?.operator?.slice(0, 8)}...{fields?.operator?.slice(-6)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
