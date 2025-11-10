 "use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

/* Lightweight local SVG icon components */
const Mail = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M3 8.5v7A2.5 2.5 0 0 0 5.5 18h13a2.5 2.5 0 0 0 2.5-2.5v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 6.5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v.5l9 6 9-6v-.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Lock = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="10" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="15" r="1.25" fill="currentColor"/>
  </svg>
);

const User = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M20 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const X = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  getRedirectResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function MogShopAuth() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for Google redirect result on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in with Google
          router.push('/'); // Change to your desired redirect path
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || 'Google sign-in failed');
      }
    };
    checkRedirectResult();
  }, [router]);

  const handleEmailAuth = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up with email
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        // Update user profile with name
        await updateProfile(userCredential.user, {
          displayName: `${formData.firstName} ${formData.lastName}`
        });
        
        router.push('/'); // Change to your desired redirect path
      } else {
        // Sign in with email
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        router.push('/'); // Change to your desired redirect path
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      
      // Make error messages more user-friendly
      if (message.includes('email-already-in-use')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (message.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (message.includes('weak-password')) {
        setError('Password should be at least 6 characters.');
      } else if (message.includes('user-not-found') || message.includes('wrong-password')) {
        setError('Invalid email or password.');
      } else if (message.includes('invalid-credential')) {
        setError('Invalid email or password.');
      } else {
        setError(message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      
      // Add additional scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      
      // Successful sign-in
      console.log('Google sign-in successful:', result.user);
      router.push('/dashboard'); // Change to your desired redirect path
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      
      // Handle specific Google sign-in errors
      if (message.includes('popup-closed-by-user')) {
        setError('Sign-in cancelled. Please try again.');
      } else if (message.includes('popup-blocked')) {
        setError('Popup blocked. Please enable popups and try again.');
      } else {
        setError(message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Mog Shop Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <Image
              src="https://raw.githubusercontent.com/user-attachments/assets/your-logo-path"
              alt="Mog Shop"
              width={128}
              height={128}
              className="object-contain"
              unoptimized
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          const img = e.currentTarget as HTMLImageElement;
          img.style.display = 'none';
          const wrapper = img.closest('div');
          const next = wrapper?.nextElementSibling as HTMLElement | null;
          if (next) next.style.display = 'block';
              }}
            />
          </div>

          <svg className="w-32 h-32 hidden" viewBox="0 0 200 200" fill="none" aria-hidden>
            <path d="M60 100 L140 100 L150 140 L50 140 Z" fill="#1e5a8e" stroke="#1e5a8e" strokeWidth="4"/>
            <path d="M140 100 L150 70 L50 70 L60 100" fill="#1e5a8e"/>
            <circle cx="70" cy="150" r="8" fill="#1e5a8e"/>
            <circle cx="130" cy="150" r="8" fill="#1e5a8e"/>
            <text x="100" y="125" fontSize="48" fontWeight="bold" fill="#f59e0b" textAnchor="middle">M</text>
            <rect x="75" y="50" width="12" height="15" fill="#1e5a8e" rx="2"/>
            <circle cx="95" cy="52" r="6" fill="#1e5a8e"/>
            <ellipse cx="115" cy="52" rx="8" ry="6" fill="#1e5a8e"/>
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-bold mb-2 text-blue-900">
          YOUR ACCOUNT FOR MOG SHOP
        </h1>
        <p className="text-center text-gray-600 text-sm mb-8">
          {isSignUp ? 'Create your Mog Shop account and start shopping' : 'Sign in to access your Mog Shop account'}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Close error" type="button">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 bg-white p-8 rounded-xl shadow-lg">
          {isSignUp && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  name="dateOfBirth"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Get special birthday discounts from Mog Shop!
              </p>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="mr-2 accent-blue-600" />
                <span className="text-gray-600">Keep me signed in</span>
              </label>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Forgot password?
              </button>
            </div>
          )}

          {isSignUp && (
            <div className="text-xs text-gray-500">
              <label className="flex items-start cursor-pointer">
                <input type="checkbox" className="mr-2 mt-1 accent-blue-600" />
                <span>
                  Sign up for emails to get updates from Mog Shop on products, offers and exclusive deals
                </span>
              </label>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            By {isSignUp ? 'creating an account' : 'logging in'}, you agree to Mog Shop&apos;s{' '}
            <button className="text-blue-600 hover:underline">Privacy Policy</button> and{' '}
            <button className="text-blue-600 hover:underline">Terms of Use</button>.
          </p>

          <button
            onClick={handleEmailAuth}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none shadow-md"
          >
            {loading ? 'PROCESSING...' : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border-2 border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Toggle Sign In/Sign Up */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {isSignUp ? 'Already have an account?' : 'New to Mog Shop?'}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                dateOfBirth: '',
              });
            }}
            className="text-blue-600 underline font-semibold hover:text-blue-800"
          >
            {isSignUp ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
  );
}