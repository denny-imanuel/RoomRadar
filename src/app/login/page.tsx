
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Building } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof formSchema>;

const tenantCredentials = {
  email: 'alex.tenant@example.com',
  password: 'password',
};

const landlordCredentials = {
  email: 'brian.landlord@example.com',
  password: 'password',
};

export default function LoginPage() {
  const { login, googleLogin } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      router.push('/map');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleLogin();
      router.push('/map');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-in Failed',
        description: error.message,
      });
    }
  };

  const handleQuickLogin = (creds: typeof tenantCredentials) => {
    form.setValue('email', creds.email);
    form.setValue('password', creds.password);
    onSubmit(creds);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-2xl font-headline"
          >
            <Building className="h-8 w-8 text-primary" />
            <span>RoomRadar</span>
          </Link>
          <p className="text-muted-foreground mt-2">Welcome back</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Log In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit">
                  Log In
                </Button>
                <Button className="w-full" variant="outline" onClick={handleGoogleSignIn}>
                  Sign in with Google
                </Button>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="underline">
                    Sign up
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Quick Login (for testing)</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="outline" className="w-full" onClick={() => handleQuickLogin(tenantCredentials)}>Login as Tenant</Button>
            <Button variant="outline" className="w-full" onClick={() => handleQuickLogin(landlordCredentials)}>Login as Landlord</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
