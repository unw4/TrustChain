import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '';

export default function CreateAsset() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();

  const [aircraftData, setAircraftData] = useState({
    tailNumber: '',
    model: '',
    manufacturer: '',
    manufactureDate: '',
  });

  const [partData, setPartData] = useState({
    serialNumber: '',
    partType: '',
    manufacturer: '',
    manufactureDate: '',
    maintenanceInterval: '',
  });

  const handleCreateAircraft = async (e: React.FormEvent) => {
    e.preventDefault();

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::aircraft::create_aircraft`,
      arguments: [
        tx.pure.string(aircraftData.tailNumber),
        tx.pure.string(aircraftData.model),
        tx.pure.string(aircraftData.manufacturer),
        tx.pure.u64(new Date(aircraftData.manufactureDate).getTime()),
      ],
    });

    signAndExecute(
      {
        transactionBlock: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (result) => {
          toast({
            title: 'Aircraft Created',
            description: 'Your aircraft has been successfully registered on Sui',
          });
          navigate('/');
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::part::create_part`,
      arguments: [
        tx.pure.string(partData.serialNumber),
        tx.pure.string(partData.partType),
        tx.pure.string(partData.manufacturer),
        tx.pure.u64(new Date(partData.manufactureDate).getTime()),
        tx.pure.u64(parseInt(partData.maintenanceInterval)),
      ],
    });

    signAndExecute(
      {
        transactionBlock: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (result) => {
          toast({
            title: 'Part Created',
            description: 'Your part has been successfully registered on Sui',
          });
          navigate('/');
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Create New Asset</h2>

      <Tabs defaultValue="aircraft">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="aircraft">Aircraft</TabsTrigger>
          <TabsTrigger value="part">Part</TabsTrigger>
        </TabsList>

        <TabsContent value="aircraft">
          <Card>
            <CardHeader>
              <CardTitle>Register New Aircraft</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAircraft} className="space-y-4">
                <div>
                  <Label htmlFor="tailNumber">Tail Number</Label>
                  <Input
                    id="tailNumber"
                    placeholder="N12345"
                    value={aircraftData.tailNumber}
                    onChange={(e) =>
                      setAircraftData({ ...aircraftData, tailNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="Boeing 737-800"
                    value={aircraftData.model}
                    onChange={(e) =>
                      setAircraftData({ ...aircraftData, model: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="Boeing"
                    value={aircraftData.manufacturer}
                    onChange={(e) =>
                      setAircraftData({ ...aircraftData, manufacturer: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="manufactureDate">Manufacture Date</Label>
                  <Input
                    id="manufactureDate"
                    type="date"
                    value={aircraftData.manufactureDate}
                    onChange={(e) =>
                      setAircraftData({ ...aircraftData, manufactureDate: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Aircraft
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="part">
          <Card>
            <CardHeader>
              <CardTitle>Register New Part</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePart} className="space-y-4">
                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="CFM56-7B27-123456"
                    value={partData.serialNumber}
                    onChange={(e) =>
                      setPartData({ ...partData, serialNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="partType">Part Type</Label>
                  <Input
                    id="partType"
                    placeholder="Engine"
                    value={partData.partType}
                    onChange={(e) =>
                      setPartData({ ...partData, partType: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="partManufacturer">Manufacturer</Label>
                  <Input
                    id="partManufacturer"
                    placeholder="CFM International"
                    value={partData.manufacturer}
                    onChange={(e) =>
                      setPartData({ ...partData, manufacturer: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="partManufactureDate">Manufacture Date</Label>
                  <Input
                    id="partManufactureDate"
                    type="date"
                    value={partData.manufactureDate}
                    onChange={(e) =>
                      setPartData({ ...partData, manufactureDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="maintenanceInterval">Maintenance Interval (hours)</Label>
                  <Input
                    id="maintenanceInterval"
                    type="number"
                    placeholder="5000"
                    value={partData.maintenanceInterval}
                    onChange={(e) =>
                      setPartData({ ...partData, maintenanceInterval: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Part
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
