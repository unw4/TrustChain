import { useParams, Link } from 'react-router-dom';
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Plane, ArrowRight, History, Package, AlertTriangle, Send } from 'lucide-react';
import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export default function PartDetail() {
  const { id } = useParams();
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedAircraftId, setSelectedAircraftId] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferAircraftId, setSelectedTransferAircraftId] = useState('');

  const { data: part, isLoading } = useQuery({
    queryKey: ['part', id],
    queryFn: async () => {
      const object = await suiClient.getObject({
        id: id!,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
          showPreviousTransaction: true,
        },
      });
      return object.data;
    },
    enabled: !!id,
  });

  const fields = part?.content?.fields;
  const aircraftId = fields?.aircraft_id;
  const parentId = fields?.parent_id;

  const { data: aircraft } = useQuery({
    queryKey: ['aircraft', aircraftId],
    queryFn: async () => {
      if (!aircraftId) return null;
      const object = await suiClient.getObject({
        id: aircraftId,
        options: {
          showContent: true,
        },
      });
      return object.data;
    },
    enabled: !!aircraftId,
  });

  // Get transaction history for aircraft transfers
  const { data: txHistory } = useQuery({
    queryKey: ['part-tx-history', id],
    queryFn: async () => {
      if (!id) return [];

      try {
        const txs = await suiClient.queryTransactionBlocks({
          filter: {
            InputObject: id,
          },
          options: {
            showEffects: true,
            showInput: true,
            showEvents: true,
          },
          limit: 50,
        });

        // Filter for attach_to_parent and detach_from_aircraft calls
        return txs.data
          .filter((tx: any) => {
            const functionName = tx.transaction?.data?.transaction?.kind === 'ProgrammableTransaction'
              ? tx.transaction?.data?.transaction?.transactions?.[0]?.MoveCall?.function
              : null;
            return functionName === 'attach_to_parent' || functionName === 'detach_from_aircraft';
          })
          .map((tx: any) => ({
            digest: tx.digest,
            timestampMs: tx.timestampMs,
            function: tx.transaction?.data?.transaction?.transactions?.[0]?.MoveCall?.function,
          }));
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        return [];
      }
    },
    enabled: !!id,
  });

  // Keep the ownership transfer events
  const { data: events } = useQuery({
    queryKey: ['part-events', id],
    queryFn: async () => {
      const transferEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::part::PartTransferred`,
        },
        limit: 50,
      });

      return transferEvents.data.filter(
        (event: any) => event.parsedJson?.part_id === id
      );
    },
    enabled: !!id,
  });

  // Get user's aircraft for attach modal
  const { data: userAircraft } = useQuery({
    queryKey: ['user-aircraft', account?.address],
    queryFn: async () => {
      if (!account?.address) return [];
      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::aircraft::Aircraft`,
        },
        options: {
          showContent: true,
        },
      });
      return objects.data;
    },
    enabled: !!account,
  });

  const handleAttachToAircraft = () => {
    if (!selectedAircraftId || !id) return;

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::part::attach_to_parent`,
      arguments: [
        tx.object(id),
        tx.pure.id(selectedAircraftId),
        tx.pure.id(selectedAircraftId),
      ],
    });

    signAndExecute(
      { transactionBlock: tx },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['part', id] });
          setShowAttachModal(false);
          setSelectedAircraftId('');
        },
      }
    );
  };

  const handleTransferToAircraft = () => {
    if (!selectedTransferAircraftId || !id) return;

    const tx = new Transaction();

    // First detach from current aircraft if attached
    if (aircraftId) {
      tx.moveCall({
        target: `${PACKAGE_ID}::part::detach_from_aircraft`,
        arguments: [tx.object(id)],
      });
    }

    // Then attach to new aircraft
    tx.moveCall({
      target: `${PACKAGE_ID}::part::attach_to_parent`,
      arguments: [
        tx.object(id),
        tx.pure.id(selectedTransferAircraftId),
        tx.pure.id(selectedTransferAircraftId),
      ],
    });

    signAndExecute(
      { transactionBlock: tx },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['part', id] });
          setShowTransferModal(false);
          setSelectedTransferAircraftId('');
        },
      }
    );
  };

  // Check if maintenance is due
  const totalHours = parseInt(fields?.total_flight_hours || '0');
  const maintenanceDue = parseInt(fields?.maintenance_due_hours || '0');
  const needsMaintenance = totalHours >= maintenanceDue;

  if (isLoading) {
    return <div className="text-center py-12">Loading part...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-orange-100 rounded-lg">
          <Wrench className="h-8 w-8 text-orange-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">{fields?.serial_number || 'Unknown Part'}</h2>
          <p className="text-slate-600">{fields?.part_type || 'Unknown Type'}</p>
        </div>
      </div>

      {needsMaintenance && (
        <Card className="border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Maintenance Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800">
              This part has exceeded its maintenance interval. Current hours: {totalHours}hrs,
              Maintenance due at: {maintenanceDue}hrs
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Manufacturer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{fields?.manufacturer || 'Unknown'}</p>
          </CardContent>
        </Card>

        <Card className={needsMaintenance ? 'border-orange-500' : ''}>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Flight Hours
              {needsMaintenance && <AlertTriangle className="h-4 w-4 text-orange-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${needsMaintenance ? 'text-orange-600' : ''}`}>
              {totalHours} hrs
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Maintenance due: {maintenanceDue} hrs
            </p>
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

      {aircraftId && aircraft ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Currently Attached To
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to={`/aircraft/${aircraftId}`}>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Plane className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {aircraft?.content?.fields?.tail_number || 'Unknown'}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {aircraft?.content?.fields?.model || 'Unknown Model'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>
            </Link>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowTransferModal(true)}
            >
              <Send className="h-4 w-4" />
              Transfer to Another Aircraft
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Not Attached
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">This part is not currently attached to any aircraft.</p>
            <Button className="mt-4" variant="outline" onClick={() => setShowAttachModal(true)}>
              Attach to Aircraft
            </Button>

            {showAttachModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md m-4">
                  <CardHeader>
                    <CardTitle>Attach to Aircraft</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Aircraft</label>
                      <select
                        className="w-full mt-2 p-2 border rounded-md"
                        value={selectedAircraftId}
                        onChange={(e) => setSelectedAircraftId(e.target.value)}
                      >
                        <option value="">Choose an aircraft...</option>
                        {userAircraft?.map((ac: any) => (
                          <option key={ac.data.objectId} value={ac.data.objectId}>
                            {ac.data.content?.fields?.tail_number} - {ac.data.content?.fields?.model}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={handleAttachToAircraft}
                        disabled={!selectedAircraftId}
                      >
                        Attach
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => {
                          setShowAttachModal(false);
                          setSelectedAircraftId('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(txHistory && txHistory.length > 0) || (events && events.length > 0) ? (
            <div className="space-y-4">
              {/* Aircraft Transfer History */}
              {txHistory && txHistory.length > 0 && (
                <>
                  <div className="text-sm font-semibold text-slate-700 pb-2 border-b">Aircraft Transfers</div>
                  {txHistory.map((tx: any, index: number) => (
                    <div key={`tx-${index}`} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="p-2 bg-blue-100 rounded">
                        <Plane className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {tx.function === 'attach_to_parent' ? 'Attached to Aircraft' : 'Detached from Aircraft'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {tx.timestampMs ? new Date(parseInt(tx.timestampMs)).toLocaleString() : 'Unknown time'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-1">
                          Tx: {tx.digest?.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Ownership Transfer History */}
              {events && events.length > 0 && (
                <>
                  <div className="text-sm font-semibold text-slate-700 pb-2 border-b">Ownership Transfers</div>
                  {events.map((event: any, index: number) => (
                    <div key={`event-${index}`} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="p-2 bg-slate-100 rounded">
                        <ArrowRight className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Ownership Transferred</p>
                        <p className="text-sm text-slate-600">
                          From: {event.parsedJson.from?.slice(0, 8)}...{event.parsedJson.from?.slice(-6)}
                        </p>
                        <p className="text-sm text-slate-600">
                          To: {event.parsedJson.to?.slice(0, 8)}...{event.parsedJson.to?.slice(-6)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(parseInt(event.parsedJson.timestamp)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <p className="text-slate-600">No history yet. This part has not been transferred.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Part Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Object ID:</span>
            <span className="font-mono text-sm">{id?.slice(0, 12)}...{id?.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Maintenance Due:</span>
            <span className="font-medium">{fields?.maintenance_due_hours || 0} hrs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Manufacture Date:</span>
            <span className="font-medium">
              {fields?.manufacture_date
                ? new Date(parseInt(fields.manufacture_date)).toLocaleDateString()
                : 'Unknown'}
            </span>
          </div>
        </CardContent>
      </Card>

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Transfer to Another Aircraft</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Target Aircraft</label>
                <select
                  className="w-full mt-2 p-2 border rounded-md"
                  value={selectedTransferAircraftId}
                  onChange={(e) => setSelectedTransferAircraftId(e.target.value)}
                >
                  <option value="">Choose an aircraft...</option>
                  {userAircraft?.map((ac: any) => (
                    <option key={ac.data.objectId} value={ac.data.objectId}>
                      {ac.data.content?.fields?.tail_number} - {ac.data.content?.fields?.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleTransferToAircraft}
                  disabled={!selectedTransferAircraftId}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Transfer
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedTransferAircraftId('');
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
