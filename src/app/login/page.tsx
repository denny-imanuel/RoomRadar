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

// SVG Icon for Google
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

// SVG Icon for Facebook
const FacebookIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
  </svg>
);

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
  const { login, googleLogin, facebookLogin } = useUser();
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
        description: (error as Error).message,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleLogin();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-in Failed',
        description: (error as Error).message,
      });
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await facebookLogin();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Facebook Sign-in Failed',
        description: (error as Error).message,
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
                <div className="w-full flex gap-4">
                  <Button className="w-full" variant="outline" type="button" onClick={handleGoogleSignIn}>
                    <GoogleIcon />
                    Login with Google
                  </Button>
                  <Button className="w-full" variant="outline" type="button" onClick={handleFacebookSignIn}>
                    <FacebookIcon />
                    Login with Facebook
                  </Button>
                </div>
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
