"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  X, 
  ArrowRight, 
  Github, 
  Chrome, 
  ShieldCheck, 
  KeyRound,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  getRedirectResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export default function MogShopAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);

  // Check for Google redirect result
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectUrl);
          toast.success("Welcome back!");
        }
      } catch (err: any) {
        toast.error(err.message || 'Google sign-in failed');
      }
    };
    checkRedirectResult();
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, {
          displayName: `${formData.firstName} ${formData.lastName}`
        });
        toast.success("Account created successfully!");
      } else if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success("Logged in successfully!");
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, formData.email);
        toast.success("Password reset link sent to your email!");
        setMode('signin');
        return;
      }

      const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectUrl);
    } catch (err: any) {
      let msg = "Authentication failed";
      if (err.message.includes('email-already-in-use')) msg = 'Email already registered.';
      else if (err.message.includes('user-not-found') || err.message.includes('wrong-password')) msg = 'Invalid email or password.';
      else if (err.message.includes('invalid-credential')) msg = 'Invalid credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google!");
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectUrl);
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-xl relative z-10 flex flex-col items-center">
        {/* Logo Section */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-8 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-black rounded-full p-4 border border-white/10">
              <Image
                src="/mog.png"
                alt="Mog Shop"
                width={80}
                height={80}
                className="brightness-110"
                unoptimized
              />
            </div>
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {mode === 'signin' && "Welcome Back"}
                  {mode === 'signup' && "Store Front Access"}
                  {mode === 'forgot-password' && "Account Recovery"}
                </h1>
                <p className="text-gray-400 text-sm">
                  {mode === 'signin' && "Login to your Mog Shop portal"}
                  {mode === 'signup' && "Create your digital presence today"}
                  {mode === 'forgot-password' && "We'll help you get back in"}
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        required
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                      />
                    </div>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        required
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                )}

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    required
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                  />
                </div>

                {mode !== 'forgot-password' && (
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      required
                      minLength={6}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                    />
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="flex items-center justify-between pb-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-600 focus:ring-blue-500 focus:ring-offset-0" />
                      <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Keep me signed in</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 p-[2px] rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <div className="bg-[#121212] group-hover:bg-transparent transition-colors py-4 rounded-[calc(1rem-1px)] flex items-center justify-center gap-2 font-bold text-white uppercase tracking-widest text-sm">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {mode === 'signin' && "Authorize"}
                        {mode === 'signup' && "Initialize Account"}
                        {mode === 'forgot-password' && "Send Reset Link"}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </form>

              {mode !== 'forgot-password' && (
                <>
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Digital ID</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleGoogleSignIn}
                      className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl text-white text-sm font-semibold transition-all"
                    >
                      <Chrome size={18} className="text-blue-400" />
                      Google
                    </button>
                    <button className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl text-white text-sm font-semibold transition-all">
                      <Github size={18} />
                      GitHub
                    </button>
                  </div>
                </>
              )}

              <div className="text-center pt-4">
                {mode === 'forgot-password' ? (
                  <button
                    onClick={() => setMode('signin')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mx-auto transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Back to Sign In
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">
                    {mode === 'signin' ? "Don't have an ID yet?" : "Already initialized?"}{' '}
                    <button
                      onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                      className="text-blue-400 font-bold hover:text-blue-300 transition-colors"
                    >
                      {mode === 'signin' ? "Create one here" : "Sign in here"}
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Footer info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex flex-col items-center gap-4 text-center"
        >
          <div className="flex items-center gap-6 text-gray-600 text-xs">
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Privacy Shield</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">System Status</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Documentation</span>
          </div>
          <p className="text-[10px] text-gray-700 uppercase tracking-[0.2em]">
            &copy; 2026 MOG SHOP SECURE ACCESS LAYER // ALL RIGHTS RESERVED
          </p>
        </motion.div>
      </div>
    </div>
  );
}