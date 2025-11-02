
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, PlusCircle, MinusCircle, Wallet as WalletIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useMemo, useState } from 'react';
import { getUserBalance, getUserTransactions } from '@/lib/data-service';
import Link from 'next/link';

function WalletPageSkeleton() {
  return (
     <div className="space-y-6">
      <header>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-5 w-72 mt-2" />
      </header>
       <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-52 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
             <Skeleton className="h-12 w-full" />
             <Skeleton className="h-12 w-full" />
             <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WalletPage() {
  const { user: currentUser, isUserLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        if (currentUser) {
            setIsLoading(true);
            const userTransactions = await getUserTransactions(currentUser.id);
            setTransactions(userTransactions);
            const userBalance = await getUserBalance(currentUser.id);
            setBalance(userBalance);
            setIsLoading(false);
        }
    }
    fetchData();
  }, [currentUser]);

  // Memoize the sorted transactions to prevent re-sorting on every render
  const sortedTransactions = useMemo(() => {
    // Sort by date descending on the client-side
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  if (isLoading || isUserLoading) {
    return <WalletPageSkeleton />;
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'Payout':
      case 'Top-up':
        return <ArrowUpRight className="h-5 w-5"/>;
      case 'Rent Payment':
      case 'Withdrawal':
      case 'Cancellation Fee':
        return <ArrowDownLeft className="h-5 w-5"/>;
      default:
        return <ArrowUpRight className="h-5 w-5"/>;
    }
  }

  const getTransactionColor = (type: Transaction['type']) => {
     switch (type) {
      case 'Payout':
      case 'Top-up':
        return 'text-green-600';
      case 'Rent Payment':
      case 'Withdrawal':
      case 'Cancellation Fee':
        return 'text-red-600';
      default:
        return 'text-green-600';
    }
  }

  const getTransactionSign = (type: Transaction['type']) => {
     switch (type) {
      case 'Payout':
      case 'Top-up':
        return '+';
      case 'Rent Payment':
      case 'Withdrawal':
      case 'Cancellation Fee':
        return '-';
      default:
        return '+';
    }
  }
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">My Wallet</h1>
        <p className="text-muted-foreground">
          View your balance, manage funds, and see your transaction history.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col justify-center items-center text-center bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
          <CardHeader>
            <CardDescription className="text-primary-foreground/80">Current Balance</CardDescription>
            <CardTitle className="text-5xl font-bold">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button asChild variant="secondary" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground">
              <Link href="/wallet/top-up">
                <PlusCircle className="mr-2 h-4 w-4" /> Top Up
              </Link>
            </Button>
            <Button asChild variant="ghost" className="hover:bg-primary-foreground/10 text-primary-foreground">
              <Link href="/wallet/withdraw">
                <MinusCircle className="mr-2 h-4 w-4" /> Withdraw
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A quick look at your latest transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedTransactions.length > 0 ? (
            <ul className="space-y-4">
              {sortedTransactions.slice(0, 3).map(txn => (
                <li key={txn.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-full", getTransactionColor(txn.type) === 'text-green-600' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {getTransactionIcon(txn.type)}
                    </div>
                    <div>
                      <p className="font-medium">{txn.type}</p>
                      <p className="text-sm text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={cn("font-semibold", getTransactionColor(txn.type))}>
                    {getTransactionSign(txn.type)}${txn.amount.toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
            ) : (
               <p className="text-muted-foreground text-center py-4">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A complete record of all your wallet activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {sortedTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.type}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={txn.status === 'Completed' ? 'secondary' : txn.status === 'Failed' ? 'destructive' : 'outline'}>
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", getTransactionColor(txn.type))}>
                     {getTransactionSign(txn.type)}${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          ) : (
              <p className="text-muted-foreground text-center py-8">Your transaction history is empty.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
