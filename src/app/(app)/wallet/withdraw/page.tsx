
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, CheckCircle, Hourglass, Wallet, XCircle } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { createWithdrawalTransaction, getUserBalance } from '@/lib/data-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TransactionLog = {
    step: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: string;
}

const banks = [
    "BCA", "Mandiri", "BNI", "BRI", "CIMB Niaga", "Danamon", "Permata",
    "Panin", "OCBC NISP", "Maybank", "BTPN", "Bank Tabungan Negara (BTN)"
];

const eWallets = ["DANA", "GOPAY", "OVO", "SHOPEEPAY", "LINKAJA"];


export default function WithdrawPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const [amount, setAmount] = useState(0);
    const [balance, setBalance] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);

    useEffect(() => {
        async function fetchBalance() {
            if (user) {
                setIsLoading(true);
                const userBalance = await getUserBalance(user.id);
                setBalance(userBalance);
                setIsLoading(false);
            }
        }
        fetchBalance();
    }, [user]);

    const addLog = (step: string, status: 'pending' | 'completed' | 'failed') => {
        setTransactionLogs(prev => [...prev, { step, status, timestamp: new Date().toLocaleTimeString() }]);
    };

    const handleWithdraw = async () => {
        if (!user || amount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: 'Please enter a valid amount to withdraw.',
            });
            return;
        }

        if (amount > balance) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Balance',
                description: `You cannot withdraw more than your available balance of $${balance.toFixed(2)}.`,
            });
            return;
        }

        setIsProcessing(true);
        setTransactionLogs([]);
        
        addLog('Initiating withdrawal request...', 'pending');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addLog('Validating payout details...', 'pending');
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            await createWithdrawalTransaction(user.id, amount);
            
            addLog('Transfer sent. Updating wallet...', 'completed');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            addLog('Withdrawal complete!', 'completed');

            toast({
                title: 'Withdrawal Successful',
                description: `$${amount.toFixed(2)} is on its way to your account.`,
            });
            
            setTimeout(() => router.push('/wallet'), 2000);

        } catch (error) {
            addLog('Withdrawal failed.', 'failed');
            toast({
                variant: 'destructive',
                title: 'Withdrawal Failed',
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

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                 <Card className="max-w-3xl mx-auto animate-pulse">
                    <CardHeader>
                        <div className="h-8 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="h-10 bg-muted rounded w-full"></div>
                        <div className="h-48 bg-muted rounded w-full"></div>
                        <div className="h-12 bg-muted rounded w-full"></div>
                    </CardContent>
                 </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Withdraw Funds</CardTitle>
                    <CardDescription>Transfer funds from your wallet to your bank account or e-wallet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount to Withdraw (USD)</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="text-lg"
                            placeholder="50.00"
                            min="1"
                            max={balance}
                        />
                         {amount > balance && (
                            <p className="text-sm text-destructive">Withdrawal amount cannot exceed your balance.</p>
                        )}
                    </div>
                    
                    <Tabs defaultValue="bank" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="bank"><Banknote className="mr-2 h-4 w-4"/>Bank Account</TabsTrigger>
                            <TabsTrigger value="ewallet"><Wallet className="mr-2 h-4 w-4"/>e-Wallet</TabsTrigger>
                        </TabsList>
                        <TabsContent value="bank" className="mt-4">
                            <Card className="p-4 bg-secondary/30">
                                <CardHeader className="p-0 pb-4">
                                    <CardTitle className="text-xl">Bank Account Details</CardTitle>
                                    <CardDescription>Enter the details of the Indonesian bank account for the payout.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bankName">Bank Name</Label>
                                        <Select>
                                            <SelectTrigger id="bankName">
                                                <SelectValue placeholder="Select a bank" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {banks.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accountHolder">Account Holder Name</Label>
                                        <Input id="accountHolder" placeholder="e.g., John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accountNumber">Account Number</Label>
                                        <Input id="accountNumber" placeholder="e.g., 1234567890" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="ewallet" className="mt-4">
                            <Card className="p-4 bg-secondary/30">
                                <CardHeader className="p-0 pb-4">
                                    <CardTitle className="text-xl">e-Wallet Details</CardTitle>
                                    <CardDescription>Enter the details of the Indonesian e-wallet for the payout.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ewalletProvider">e-Wallet Provider</Label>
                                        <Select>
                                            <SelectTrigger id="ewalletProvider">
                                                <SelectValue placeholder="Select a provider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {eWallets.map(wallet => <SelectItem key={wallet} value={wallet}>{wallet}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ewalletPhone">Phone Number</Label>
                                        <Input id="ewalletPhone" placeholder="e.g., 081234567890" />
                                    </div>
                                </CardContent>
                            </Card>
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


                    <Button size="lg" className="w-full" onClick={handleWithdraw} disabled={isProcessing || amount > balance || amount <= 0}>
                        {isProcessing ? 'Processing...' : `Withdraw $${amount.toFixed(2)}`}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
