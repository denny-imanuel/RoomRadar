
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, QrCode, Store, CheckCircle, Hourglass, XCircle } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { createTopUpTransaction } from '@/lib/data-service';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TransactionLog = {
    step: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: string;
}

const vaBanks = ["BCA", "Mandiri", "BNI", "BRI", "Permata", "BSI"];
const eWallets = ["DANA", "OVO", "LinkAja", "ShopeePay"];
const retailOutlets = ["Alfamart Group", "Indomaret"];

export default function TopUpPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const [amount, setAmount] = useState(50);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
    
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [selectedEwallet, setSelectedEwallet] = useState<string | null>(null);
    const [selectedRetail, setSelectedRetail] = useState<string | null>(null);

    const addLog = (step: string, status: 'pending' | 'completed' | 'failed') => {
        setTransactionLogs(prev => [...prev, { step, status, timestamp: new Date().toLocaleTimeString() }]);
    };

    const handleTopUp = async () => {
        if (!user || amount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: 'Please enter a valid amount to top up.',
            });
            return;
        }

        setIsProcessing(true);
        setTransactionLogs([]);
        
        addLog('Initiating top-up request...', 'pending');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addLog('Connecting to payment gateway...', 'pending');
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            await createTopUpTransaction(user.id, amount);
            
            addLog('Payment successful. Updating wallet...', 'completed');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            addLog('Top-up complete!', 'completed');

            toast({
                title: 'Top-Up Successful',
                description: `$${amount.toFixed(2)} has been added to your wallet.`,
            });
            
            setTimeout(() => router.push('/wallet'), 2000);

        } catch (error) {
            addLog('Payment failed.', 'failed');
            toast({
                variant: 'destructive',
                title: 'Top-Up Failed',
                description: (error as Error).message || 'An unexpected error occurred.',
            });
            setIsProcessing(false);
        }
    };
    
    const getStatusIcon = (status: TransactionLog['status']) => {
        switch (status) {
            case 'pending': return <Hourglass className="h-4 w-4 text-yellow-500 animate-spin" />;
            case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
        }
    }

    return (
        <div className="container mx-auto py-8">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Top Up Your Wallet</CardTitle>
                    <CardDescription>Select a payment method and amount to add funds to your balance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="text-lg"
                            placeholder="50.00"
                            min="1"
                        />
                    </div>

                    <Tabs defaultValue="va" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="va"><Banknote className="mr-2 h-4 w-4"/>Virtual Account</TabsTrigger>
                            <TabsTrigger value="ewallet"><QrCode className="mr-2 h-4 w-4"/>e-Wallet</TabsTrigger>
                            <TabsTrigger value="retail"><Store className="mr-2 h-4 w-4"/>Retail Outlet</TabsTrigger>
                        </TabsList>
                        <TabsContent value="va" className="mt-4 p-4 border rounded-md bg-secondary/30 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="va-bank">Bank</Label>
                                <Select onValueChange={setSelectedBank}>
                                    <SelectTrigger id="va-bank">
                                        <SelectValue placeholder="Select a bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vaBanks.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedBank && (
                                <>
                                    <h3 className="font-semibold">Pay via {selectedBank} Virtual Account</h3>
                                    <p className="text-sm text-muted-foreground">Transfer the exact amount to the VA number below. Your balance will be updated automatically upon payment.</p>
                                    <div className="mt-2 p-4 bg-background rounded-md text-center">
                                        <p className="text-sm text-muted-foreground">{selectedBank} Virtual Account</p>
                                        <p className="text-2xl font-mono font-bold tracking-widest">8808 1234 5678 9012</p>
                                    </div>
                                </>
                            )}
                        </TabsContent>
                        <TabsContent value="ewallet" className="mt-4 p-4 border rounded-md bg-secondary/30 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ewallet-provider">e-Wallet</Label>
                                <Select onValueChange={setSelectedEwallet}>
                                    <SelectTrigger id="ewallet-provider">
                                        <SelectValue placeholder="Select an e-Wallet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eWallets.map(wallet => <SelectItem key={wallet} value={wallet}>{wallet}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                           {selectedEwallet && (
                                <>
                                    <h3 className="font-semibold">Pay via {selectedEwallet}</h3>
                                    <p className="text-sm text-muted-foreground">Scan the QR code below with your {selectedEwallet} application.</p>
                                    <div className="mt-2 p-4 bg-background rounded-md flex justify-center">
                                        <Image src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example" alt="Mock QR Code" width={150} height={150} />
                                    </div>
                                </>
                           )}
                        </TabsContent>
                        <TabsContent value="retail" className="mt-4 p-4 border rounded-md bg-secondary/30 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="retail-outlet">Retail Outlet</Label>
                                <Select onValueChange={setSelectedRetail}>
                                    <SelectTrigger id="retail-outlet">
                                        <SelectValue placeholder="Select a retail outlet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {retailOutlets.map(outlet => <SelectItem key={outlet} value={outlet}>{outlet}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                           {selectedRetail && (
                                <>
                                    <h3 className="font-semibold">Pay at {selectedRetail}</h3>
                                    <p className="text-sm text-muted-foreground">Present the following payment code to the cashier at any participating outlet.</p>
                                    <div className="mt-2 p-4 bg-background rounded-md text-center">
                                        <p className="text-sm text-muted-foreground">Payment Code</p>
                                        <p className="text-2xl font-mono font-bold tracking-widest">MOCK12345XYZ</p>
                                    </div>
                                </>
                           )}
                        </TabsContent>
                    </Tabs>
                    
                    {transactionLogs.length > 0 && (
                        <div className="space-y-2 pt-4">
                            <h4 className="font-semibold">Transaction Log</h4>
                            <Card className="bg-secondary/50 p-4">
                                <ul className="space-y-2">
                                    {transactionLogs.map((log, index) => (
                                        <li key={index} className="flex items-center gap-3 text-sm">
                                            {getStatusIcon(log.status)}
                                            <span className="flex-1">{log.step}</span>
                                            <span className="text-muted-foreground">{log.timestamp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    )}


                    <Button size="lg" className="w-full" onClick={handleTopUp} disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : `Top Up $${amount.toFixed(2)}`}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
