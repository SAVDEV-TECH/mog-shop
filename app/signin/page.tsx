"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ChevronLeft,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export default function MogShopAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Check for Google redirect result on mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
          sessionStorage.removeItem('redirectAfterLogin');
          toast.success(`Welcome, ${result.user.displayName || 'back'}!`);
          router.push(redirectUrl);
        }
      } catch (err: any) {
        if (err.code !== 'auth/popup-closed-by-user') {
          toast.error(err.message || 'Google sign-in failed');
        }
      }
    };
    checkRedirectResult();
  }, [router]);

  // Google One Tap
  useEffect(() => {
    const initGoogleOneTap = () => {
      if (typeof window === 'undefined' || !(window as any).google) return;
      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: async (response: any) => {
          // Handled via popup/redirect — One Tap just triggers the Google flow
          handleGoogleSignIn();
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      if (googleBtnRef.current) {
        (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: googleBtnRef.current.offsetWidth || 400,
        });
      }
    };

    // Load Google Identity script if not already loaded
    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleOneTap;
      document.head.appendChild(script);
    } else {
      initGoogleOneTap();
    }
  }, [mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, {
          displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        });
        toast.success('Account created! Welcome to Mogshops.');
      } else if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success('Signed in successfully!');
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, formData.email);
        toast.success('Password reset link sent — check your inbox.');
        setMode('signin');
        return;
      }

      const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectUrl);
    } catch (err: any) {
      let msg = 'Something went wrong. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = 'Incorrect email or password.';
      else if (err.code === 'auth/invalid-credential') msg = 'Incorrect email or password.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please try again later.';
      else if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        toast.success(`Welcome, ${result.user.displayName || 'back'}!`);
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Google sign-in failed. Please try again.');
      }
    } finally {
      if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setGoogleLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setFormData({ firstName: '', lastName: '', email: '', password: '' });
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex">
      {/* Left Panel — Branding (desktop only) */}
      <div className="hidden lg:flex w-[45%] bg-mog flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-white/20 blur-2xl" />
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <Image src="/mog.png" alt="Mogshops" width={48} height={48} className="rounded-xl" unoptimized />
          <span className="text-white text-2xl font-black tracking-tight">Mogshops</span>
        </Link>

        {/* Tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShoppingBag className="text-white" size={24} />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Nigeria&apos;s Premium<br />Grocery Store
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Shop quality groceries, wholesale provisions, and everyday essentials — delivered to your doorstep.
          </p>

          {/* Testimonial/Trust */}
          <div className="mt-10 p-5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
            <p className="text-white/90 text-sm italic leading-relaxed">
              &ldquo;Fast delivery, quality products. Mogshops is my go-to for restocking my shop.&rdquo;
            </p>
            <p className="text-white/60 text-xs mt-2 font-semibold">— Verified Customer, Port Harcourt</p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-4 text-white/40 text-xs">
          <Link href="/terms-of-service" className="hover:text-white/70 transition-colors">Terms</Link>
          <span>·</span>
          <Link href="/privacy-policy" className="hover:text-white/70 transition-colors">Privacy</Link>
          <span>·</span>
          <span>© {new Date().getFullYear()} Mogshops</span>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/mog.png" alt="Mogshops" width={40} height={40} className="rounded-lg" unoptimized />
            <span className="text-xl font-black text-mog">Mogshops</span>
          </Link>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8">
            {mode === 'forgot-password' && (
              <button
                onClick={() => switchMode('signin')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
              >
                <ChevronLeft size={16} />
                Back to sign in
              </button>
            )}
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {mode === 'signin' && 'Sign in'}
              {mode === 'signup' && 'Create account'}
              {mode === 'forgot-password' && 'Reset password'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {mode === 'signin' && 'Welcome back! Please enter your details.'}
              {mode === 'signup' && 'Start shopping in seconds. No credit card required.'}
              {mode === 'forgot-password' && "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {/* Google One Tap / Google Sign-In Button */}
          {mode !== 'forgot-password' && (
            <div className="mb-5">
              {/* Native Google rendered button (One Tap) */}
              <div ref={googleBtnRef} className="w-full" style={{ minHeight: '44px' }} />

              {/* Fallback button in case GSI script doesn't load */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="mt-2 w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm shadow-sm disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M47.532 24.552a28.9 28.9 0 0 0-.46-5.15H24.48v9.74h13.015c-.562 3.018-2.267 5.575-4.83 7.29v6.062h7.815c4.571-4.21 7.052-10.41 7.052-17.942z" fill="#4285F4"/>
                    <path d="M24.48 48c6.54 0 12.027-2.167 16.036-5.875l-7.815-6.063c-2.168 1.453-4.94 2.31-8.22 2.31-6.322 0-11.678-4.27-13.588-10.006H2.818v6.255A24.24 24.24 0 0 0 24.48 48z" fill="#34A853"/>
                    <path d="M10.892 28.366A14.558 14.558 0 0 1 10.13 24c0-1.516.26-2.99.762-4.366v-6.255H2.818A24.24 24.24 0 0 0 .24 24c0 3.91.938 7.61 2.578 10.621l8.074-6.255z" fill="#FBBC05"/>
                    <path d="M24.48 9.628c3.564 0 6.76 1.226 9.278 3.633l6.957-6.957C36.499 2.39 31.012.24 24.48.24A24.24 24.24 0 0 0 2.818 13.38l8.074 6.254c1.91-5.736 7.266-10.006 13.588-10.006z" fill="#EA4335"/>
                  </svg>
                )}
                {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
              </button>
            </div>
          )}

          {/* Divider */}
          {mode !== 'forgot-password' && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              <span className="text-xs text-gray-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mog/50 focus:border-mog transition-all text-sm"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mog/50 focus:border-mog transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mog/50 focus:border-mog transition-all text-sm"
              />
            </div>

            {mode !== 'forgot-password' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mog/50 focus:border-mog transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            )}

            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="text-xs text-mog hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mog hover:bg-mog/90 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-mog/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' && 'Sign in'}
                  {mode === 'signup' && 'Create account'}
                  {mode === 'forgot-password' && 'Send reset link'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          {mode !== 'forgot-password' && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-mog font-semibold hover:underline"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}

          {/* Legal */}
          {mode === 'signup' && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/terms-of-service" className="underline hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy-policy" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}