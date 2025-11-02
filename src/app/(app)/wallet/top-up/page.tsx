
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, QrCode, Store, CheckCircle, Hourglass, XCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { initiateTopUp, completeTopUpTransaction } from '@/lib/data-service';
import type { PaymentMethodType } from '@/lib/xendit-service';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TransactionLog = {
    step: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: string;
}

type PaymentDetails = {
    vaNumber?: string;
    qrCodeUrl?: string;
    paymentCode?: string;
}

const vaBanks = [
    { name: "Bank Central Asia", code: "BCA" },
    { name: "Bank Mandiri", code: "MANDIRI" },
    { name: "Bank Negara Indonesia", code: "BNI" },
    { name: "Bank Rakyat Indonesia", code: "BRI" },
    { name: "Bank Permata", code: "PERMATA" },
    { name: "Bank Syariah Indonesia", code: "BSI" },
];
const eWallets = [
    { name: "DANA", code: "DANA" },
    { name: "OVO", code: "OVO" },
    { name: "LinkAja", code: "LINKAJA" },
    { name: "ShopeePay", code: "SHOPEEPAY" },
];
const retailOutlets = [
    { name: "Alfamart Group", code: "ALFAMART" },
    { name: "Indomaret", code: "INDOMARET" },
];

export default function TopUpPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const [amount, setAmount] = useState(50);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

    const [activeTab, setActiveTab] = useState<PaymentMethodType>('VIRTUAL_ACCOUNT');
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

    const addLog = (step: string, status: 'pending' | 'completed' | 'failed') => {
        setTransactionLogs(prev => [...prev, { step, status, timestamp: new Date().toLocaleTimeString() }]);
    };

    const handleGenerateCode = async () => {
        if (!user || amount <= 0 || !selectedChannel) {
            toast({
                variant: 'destructive',
                title: 'Invalid Input',
                description: 'Please enter a valid amount and select a payment channel.',
            });
            return;
        }

        setIsProcessing(true);
        setTransactionLogs([]);
        setPaymentDetails(null);
        
        addLog('Initiating top-up request...', 'pending');

        try {
            const result = await initiateTopUp(user.id, amount, activeTab, selectedChannel);
            addLog('Connecting to payment gateway...', 'completed');
            
            if (result.type === 'VA') {
                setPaymentDetails({ vaNumber: result.vaNumber });
                addLog('Virtual Account number generated.', 'completed');
            } else if (result.type === 'EWALLET') {
                setPaymentDetails({ qrCodeUrl: result.qrCodeUrl });
                addLog('QR Code generated.', 'completed');
            } else if (result.type === 'OTC') {
                setPaymentDetails({ paymentCode: result.paymentCode });
                addLog('Payment code generated.', 'completed');
            } else {
                 addLog('Payment request successful. Awaiting payment.', 'completed');
            }

        } catch (error) {
            addLog('Request failed.', 'failed');
            toast({
                variant: 'destructive',
                title: 'Top-Up Failed',
                description: (error as Error).message || 'An unexpected error occurred.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!user) return;
        setIsProcessing(true);
        addLog('Verifying payment and updating wallet...', 'pending');
        
        try {
            await completeTopUpTransaction(user.id, amount);
            addLog('Payment successful! Top-up complete!', 'completed');
            toast({
                title: 'Top-Up Successful',
                description: `$${amount.toFixed(2)} has been added to your wallet.`,
            });
            setTimeout(() => router.push('/wallet'), 2000);
        } catch (error) {
            addLog('Failed to confirm payment.', 'failed');
             toast({
                variant: 'destructive',
                title: 'Confirmation Failed',
                description: (error as Error).message || 'An unexpected error occurred.',
            });
            setIsProcessing(false);
        }
    }
    
    const getStatusIcon = (status: TransactionLog['status']) => {
        switch (status) {
            case 'pending': return <Hourglass className="h-4 w-4 text-yellow-500 animate-spin" />;
            case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
        }
    }

    const onTabChange = (value: string) => {
        setActiveTab(value as PaymentMethodType);
        setSelectedChannel(null);
        setPaymentDetails(null);
        setTransactionLogs([]);
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
                            disabled={!!paymentDetails || isProcessing}
                        />
                    </div>

                    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="VIRTUAL_ACCOUNT" disabled={!!paymentDetails}><Banknote className="mr-2 h-4 w-4"/>Virtual Account</TabsTrigger>
                            <TabsTrigger value="EWALLET" disabled={!!paymentDetails}><QrCode className="mr-2 h-4 w-4"/>e-Wallet</TabsTrigger>
                            <TabsTrigger value="OTC" disabled={!!paymentDetails}><Store className="mr-2 h-4 w-4"/>Retail Outlet</TabsTrigger>
                        </TabsList>
                        <TabsContent value="VIRTUAL_ACCOUNT" className="mt-4 p-4 border rounded-md bg-secondary/30 space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="va-bank">Bank</Label>
                                <Select onValueChange={setSelectedChannel} disabled={!!paymentDetails}>
                                    <SelectTrigger id="va-bank">
                                        <SelectValue placeholder="Select a bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vaBanks.map(bank => <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {paymentDetails?.vaNumber && (
                                <>
                                    <h3 className="font-semibold">Pay via {selectedChannel} Virtual Account</h3>
                                    <p className="text-sm text-muted-foreground">Transfer the exact amount to the VA number below. Your balance will be updated automatically upon payment.</p>
                                    <div className="mt-2 p-4 bg-background rounded-md text-center">
                                        <p className="text-sm text-muted-foreground">{selectedChannel} Virtual Account</p>
                                        <p className="text-2xl font-mono font-bold tracking-widest">{paymentDetails.vaNumber}</p>
                                    </div>
                                </>
                            )}
                        </TabsContent>
                        <TabsContent value="EWALLET" className="mt-4 p-4 border rounded-md bg-secondary/30 space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="ewallet-provider">e-Wallet</Label>
                                <Select onValueChange={setSelectedChannel} disabled={!!paymentDetails}>
                                    <SelectTrigger id="ewallet-provider">
                                        <SelectValue placeholder="Select an e-Wallet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eWallets.map(wallet => <SelectItem key={wallet.code} value={wallet.code}>{wallet.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                           {paymentDetails?.qrCodeUrl && (
                                <>
                                    <h3 className="font-semibold">Pay via {selectedChannel}</h3>
                                    <p className="text-sm text-muted-foreground">Scan the QR code below with your {selectedChannel} application.</p>
                                    <div className="mt-2 p-4 bg-background rounded-md flex justify-center">
                                        <Image src={paymentDetails.qrCodeUrl} alt="Payment QR Code" width={200} height={200} />
                                    </div>
                                </>
                           )}
                        </TabsContent>
                        <TabsContent value="OTC" className="mt-4 p-4 border rounded-md bg-secondary/30 space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="retail-outlet">Retail Outlet</Label>
                                <Select onValueChange={setSelectedChannel} disabled={!!paymentDetails}>
                                    <SelectTrigger id="retail-outlet">
                                        <SelectValue placeholder="Select a retail outlet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {retailOutlets.map(outlet => <SelectItem key={outlet.code} value={outlet.code}>{outlet.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                           {paymentDetails?.paymentCode && (
                                <>
                                    <h3 className="font-semibold">Pay at {selectedChannel}</h3>
                                    <p className="text-sm text-muted-foreground">Present the following payment code to the cashier at any participating outlet.</p>
                                    <div className="mt-2 p-4 bg-background rounded-md text-center">
                                        <p className="text-sm text-muted-foreground">Payment Code</p>
                                        <p className="text-2xl font-mono font-bold tracking-widest">{paymentDetails.paymentCode}</p>
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

                    {!paymentDetails ? (
                         <Button size="lg" className="w-full" onClick={handleGenerateCode} disabled={isProcessing || !selectedChannel}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isProcessing ? 'Generating...' : `Generate Payment Code`}
                        </Button>
                    ) : (
                        <Button size="lg" className="w-full" onClick={handleConfirmPayment} disabled={isProcessing}>
                             {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isProcessing ? 'Confirming...' : 'I Have Paid'}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
