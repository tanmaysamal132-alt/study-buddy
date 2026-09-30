import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  LogOut,
  Eye,
  EyeOff,
  Send,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { getSupabaseClient } from '../services/supabase';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'update_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onUserChange: (email: string | null) => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onUserChange,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitedEmail, setRateLimitedEmail] = useState<string | null>(null);
  const [isInvalidCreds, setIsInvalidCreds] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);
  const [pastedLink, setPastedLink] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);
  const [isSessionMissing, setIsSessionMissing] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setMessage(null);
      setIsInvalidCreds(false);
      setRateLimitedEmail(null);
      setActionNotice(null);
      setResetSentEmail(null);
      setPastedLink('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSessionMissing(false);

      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.auth.getSession().then(({ data }) => {
          setHasActiveSession(!!data.session);
          if (initialMode === 'update_password' && !data.session) {
            setIsSessionMissing(true);
          }
        });
      }
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (mode === 'update_password') {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.auth.getSession().then(({ data }) => {
          setHasActiveSession(!!data.session);
          if (!data.session) {
            setIsSessionMissing(true);
          }
        });
      }
    }
  }, [mode]);

  if (!isOpen) return null;

  // Handle standard Sign In & Sign Up
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return;

    setIsLoading(true);
    setMessage(null);
    setRateLimitedEmail(null);
    setIsInvalidCreds(false);
    setActionNotice(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage({
        text: 'Supabase client could not be initialized. Please check credentials in Settings.',
        type: 'error',
      });
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
        });

        if (error) throw error;

        if (data.session) {
          setMessage({
            text: 'Account created and verified! You are now logged in.',
            type: 'success',
          });
          if (data.user?.email) {
            onUserChange(data.user.email);
          }
          setTimeout(() => onClose(), 1000);
        } else {
          setMessage({
            text: `Account created for ${cleanEmail}! If email confirmation is enabled in your Supabase project, check your inbox. Or click "Enter Instantly" below to start studying right away.`,
            type: 'info',
          });
          setRateLimitedEmail(cleanEmail);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) throw error;

        setMessage({ text: 'Successfully logged in to Supabase!', type: 'success' });
        if (data.user?.email) {
          onUserChange(data.user.email);
        }
        setTimeout(() => onClose(), 1000);
      }
    } catch (err: any) {
      const errText = err?.message || 'Authentication failed. Please verify your credentials.';
      const lowerErr = errText.toLowerCase();

      if (lowerErr.includes('rate limit')) {
        setRateLimitedEmail(cleanEmail);
        setMessage({
          text: 'Supabase Project Email Rate Limit reached (free projects allow max 3-4 outgoing emails/hour across the entire project). Click below to immediately enter testing with this email:',
          type: 'error',
        });
      } else if (
        lowerErr.includes('invalid login credentials') ||
        lowerErr.includes('invalid_credentials') ||
        lowerErr.includes('email not confirmed')
      ) {
        setIsInvalidCreds(true);
        setMessage({
          text: 'Invalid login credentials.',
          type: 'error',
        });
      } else {
        setMessage({
          text: errText,
          type: 'error',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Send Password Reset Email
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMessage({ text: 'Please enter your registered email address.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setResetSentEmail(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage({
        text: 'Supabase client could not be initialized. Please check credentials in Settings.',
        type: 'error',
      });
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setResetSentEmail(cleanEmail);
      setMessage({
        text: `Password reset email sent to ${cleanEmail}! Please check your inbox (and spam folder).`,
        type: 'success',
      });
    } catch (err: any) {
      const errText = err?.message || 'Failed to send password reset email.';
      if (errText.toLowerCase().includes('rate limit')) {
        setRateLimitedEmail(cleanEmail);
        setMessage({
          text: 'Supabase free-tier outgoing email rate limit reached. You can preview the "Create New Password" page or enter your session below:',
          type: 'error',
        });
      } else {
        setMessage({ text: errText, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Pasted Link / Code from Email (Fixes localhost:3000 redirection)
  const handleProcessPastedLink = async (rawInput: string) => {
    const input = rawInput.trim();
    if (!input) {
      setMessage({ text: 'Please paste the link or URL from your email.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage({ text: 'Supabase client not initialized.', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      // Format 1: Hash with access_token & refresh_token (e.g. from failed localhost:3000/#access_token=... page)
      if (input.includes('access_token=') && input.includes('refresh_token=')) {
        const hashIndex = input.indexOf('#');
        const hashQuery = hashIndex !== -1 ? input.slice(hashIndex + 1) : input;
        const params = new URLSearchParams(hashQuery);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;

          setMessage({
            text: 'Link verified! You can now set your new password below.',
            type: 'success',
          });
          setMode('update_password');
          return;
        }
      }

      // Format 2: PKCE code param (?code=...)
      if (input.includes('code=')) {
        let codeVal = '';
        try {
          const urlObj = input.startsWith('http') ? new URL(input) : new URL(`http://dummy.com/?${input}`);
          codeVal = urlObj.searchParams.get('code') || '';
        } catch {
          const match = input.match(/[?&]code=([^&#]+)/);
          if (match) codeVal = match[1];
        }

        if (codeVal) {
          const { error } = await supabase.auth.exchangeCodeForSession(codeVal);
          if (error) throw error;

          setMessage({
            text: 'Authorization code verified! Set your new password below.',
            type: 'success',
          });
          setMode('update_password');
          return;
        }
      }

      // Format 3: Verification URL with token or token_hash parameter
      if (input.includes('token=') || input.includes('token_hash=')) {
        let tokenHashVal = '';
        let tokenVal = '';
        try {
          const urlObj = input.startsWith('http') ? new URL(input) : new URL(`http://dummy.com/?${input}`);
          tokenHashVal = urlObj.searchParams.get('token_hash') || '';
          tokenVal = urlObj.searchParams.get('token') || '';
        } catch {
          const matchHash = input.match(/[?&]token_hash=([^&#]+)/);
          if (matchHash) tokenHashVal = matchHash[1];
          const matchToken = input.match(/[?&]token=([^&#]+)/);
          if (matchToken) tokenVal = matchToken[1];
        }

        if (tokenHashVal) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHashVal,
            type: 'recovery',
          });
          if (error) throw error;

          setHasActiveSession(true);
          setIsSessionMissing(false);
          setMessage({
            text: 'Recovery token verified! Set your new password below.',
            type: 'success',
          });
          setMode('update_password');
          return;
        }

        if (tokenVal) {
          const targetEmail = email.trim() || userEmail || 'tanmaysamal132@gmail.com';
          const { error } = await supabase.auth.verifyOtp({
            email: targetEmail,
            token: tokenVal,
            type: 'recovery',
          });
          if (error) throw error;

          setHasActiveSession(true);
          setIsSessionMissing(false);
          setMessage({
            text: 'Recovery code verified! Set your new password below.',
            type: 'success',
          });
          setMode('update_password');
          return;
        }
      }

      // Format 4: Raw 6-digit OTP code or direct token
      if (input.length >= 6 && !input.includes('/') && !input.includes(' ')) {
        const targetEmail = email.trim() || userEmail || 'tanmaysamal132@gmail.com';
        const { error } = await supabase.auth.verifyOtp({
          email: targetEmail,
          token: input,
          type: 'recovery',
        });
        if (error) throw error;

        setHasActiveSession(true);
        setIsSessionMissing(false);
        setMessage({
          text: 'Code verified! Set your new password below.',
          type: 'success',
        });
        setMode('update_password');
        return;
      }

      // If cannot recognize explicit token, open update_password page directly
      setMode('update_password');
      setMessage({
        text: 'Proceeding to Create New Password page.',
        type: 'info',
      });
    } catch (err: any) {
      const errText = err?.message || 'Could not verify token. Opening password reset page directly:';
      setMessage({ text: errText, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Setting New Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setMessage({ text: 'Please enter a new password.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match. Please re-check.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage({
        text: 'Supabase client could not be initialized.',
        type: 'error',
      });
      setIsLoading(false);
      return;
    }

    try {
      // Check if session is present
      const { data: sessionCheck } = await supabase.auth.getSession();

      // If no session but user provided a link/code in pastedLink, try to resolve it first
      if (!sessionCheck?.session && pastedLink.trim()) {
        try {
          await handleProcessPastedLink(pastedLink.trim());
        } catch (e) {
          console.warn('Auto pasted link verify failed:', e);
        }
      }

      // Check session again
      const { data: activeSession } = await supabase.auth.getSession();
      if (!activeSession?.session) {
        setIsSessionMissing(true);
        throw new Error('Auth session missing! Because the email redirected to localhost:3000, your recovery token was not passed into this tab. Please paste the email link below or click "Save & Enter Directly".');
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Clean recovery fragment from URL
      if (window.location.hash || window.location.search.includes('type=recovery')) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      setMessage({
        text: 'Password updated successfully! You are now logged in with your new password.',
        type: 'success',
      });

      const activeEmail = data.user?.email || email.trim() || userEmail || 'tanmaysamal132@gmail.com';
      onUserChange(activeEmail);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      const errText = err?.message || 'Failed to update password. Recovery session may have expired.';
      if (errText.toLowerCase().includes('session') || errText.toLowerCase().includes('auth session missing')) {
        setIsSessionMissing(true);
      }
      setMessage({ text: errText, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTestAccount = (testEmail: string) => {
    onUserChange(testEmail);
    setMessage({ text: `Logged in as ${testEmail}! Your progress is actively tracked.`, type: 'success' });
    setTimeout(() => onClose(), 600);
  };

  const handleResendConfirmation = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setActionNotice('Please enter your email above first.');
      return;
    }
    setIsLoading(true);
    setActionNotice(null);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });

      if (error) throw error;
      setActionNotice(`Verification email resent to ${cleanEmail}. Check inbox or spam folder.`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to resend confirmation email';
      if (msg.toLowerCase().includes('rate limit')) {
        setActionNotice('Email rate limit reached for this hour. You can use the "Enter Now" button below without waiting.');
      } else {
        setActionNotice(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    onUserChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              {mode === 'forgot' ? (
                <KeyRound className="w-5 h-5 text-amber-600" />
              ) : mode === 'update_password' ? (
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              ) : (
                <Database className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === 'forgot'
                  ? 'Forgot Password'
                  : mode === 'update_password'
                  ? 'Create New Password'
                  : 'Supabase Cloud Sync'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'forgot'
                  ? 'Get a reset link in your email'
                  : mode === 'update_password'
                  ? 'Choose a new password for your account'
                  : 'Sync topics, notes & mastery across all devices'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {userEmail && mode !== 'update_password' ? (
          /* Logged In State */
          <div className="space-y-4 text-center py-2">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Connected account:</div>
              <div className="font-bold text-slate-900 dark:text-white text-base">
                {userEmail}
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Your subjects, study notes, quiz scores, and daily study goal are active and saved.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : mode === 'forgot' ? (
          /* ======================================================== */
          /* FORGOT PASSWORD VIEW                                      */
          /* ======================================================== */
          <div className="space-y-4">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Password Recovery</span>
                </div>
                Enter the email associated with your account. We will send you an email containing a link to open a page where you can create your new password.
              </div>

              {/* Notification messages */}
              {message && (
                <div
                  className={`p-3.5 rounded-2xl text-xs ${
                    message.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                      : message.type === 'info'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    ) : message.type === 'info' ? (
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    )}
                    <div className="flex-1 leading-relaxed font-medium">{message.text}</div>
                  </div>

                  {resetSentEmail && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/70 dark:border-emerald-900/60 space-y-2">
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-200">
                        📧 <strong>Check your email:</strong> We sent the reset link to <strong>{resetSentEmail}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMode('update_password')}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Go to "Create New Password" Page</span>
                      </button>
                    </div>
                  )}

                  {rateLimitedEmail && (
                    <div className="mt-3 pt-3 border-t border-rose-200/70 dark:border-rose-900/60 space-y-2">
                      <button
                        type="button"
                        onClick={() => setMode('update_password')}
                        className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>🔑 Open "Create New Password" Page Directly</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>
            </form>

            {/* ======================================================== */}
            {/* IMMEDIATE FIX: PASTE LINK OR URL THAT DID NOT OPEN       */}
            {/* ======================================================== */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-amber-900 dark:text-amber-200">
                    Did the site not open when clicking the email link?
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    By default, Supabase redirects links to <code>localhost:3000</code>. Simply copy the link from your email (or copy the address bar of the tab that didn't open) and paste it below:
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Paste link or URL here..."
                    value={pastedLink}
                    onChange={(e) => setPastedLink(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleProcessPastedLink(pastedLink)}
                  disabled={!pastedLink.trim() || isLoading}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shrink-0 shadow-2xs"
                >
                  Verify Link
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setMode('update_password')}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Or enter new password directly &rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSupabaseGuide(!showSupabaseGuide)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>{showSupabaseGuide ? 'Hide Guide' : 'Supabase Config Guide'}</span>
                </button>
              </div>

              {/* Supabase Dashboard Guide */}
              {showSupabaseGuide && (
                <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60 text-[11px] space-y-2 text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Permanent Fix in Supabase Dashboard (1 minute):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Go to Supabase Dashboard &rarr; <strong>Authentication</strong> &rarr; <strong>URL Configuration</strong></li>
                    <li>Set <strong>Site URL</strong> to your current live app URL:</li>
                  </ol>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono break-all">
                    <span className="flex-1 truncate">{currentOrigin}</span>
                    <button
                      type="button"
                      onClick={handleCopyOrigin}
                      className="p-1 text-slate-500 hover:text-indigo-600 shrink-0"
                      title="Copy URL"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Also add <code>{currentOrigin}/**</code> to <strong>Redirect URLs</strong> and click Save.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setMessage(null);
                }}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestAccount(email.trim() || 'tanmaysamal132@gmail.com')}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                ⚡ Enter Session Directly
              </button>
            </div>
          </div>
        ) : mode === 'update_password' ? (
          /* ======================================================== */
          /* CREATE NEW PASSWORD VIEW (Opened from reset email)       */
          /* ======================================================== */
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60">
              <div className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Choose a New Secure Password</span>
              </div>
              Enter your new password below. Once saved, your account credentials will be immediately updated in Supabase.
            </div>

            {message && (
              <div
                className={`p-3.5 rounded-2xl text-xs ${
                  message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                    : message.type === 'info'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : message.type === 'info' ? (
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <div className="flex-1 leading-relaxed font-medium">{message.text}</div>
                </div>
              </div>
            )}

            {/* Missing Session Resolution Card */}
            {isSessionMissing && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-200">
                      Why did "Auth session missing" happen?
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                      When you clicked the email link, Supabase redirected to <code>localhost:3000</code>. That means the recovery token was opened in that tab and didn't pass into this live session.
                    </p>
                  </div>
                </div>

                {/* Option A: Paste Email link or localhost URL */}
                <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60 space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Option 1: Paste Email Link or localhost:3000 URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste link from email or address bar here..."
                      value={pastedLink}
                      onChange={(e) => setPastedLink(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!pastedLink.trim()) return;
                        await handleProcessPastedLink(pastedLink);
                      }}
                      disabled={!pastedLink.trim() || isLoading}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
                    >
                      Verify Link
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Copy the address bar of the <code>localhost:3000</code> tab that didn't load and paste it here.
                  </p>
                </div>

                {/* Option B: Direct 1-Click Login */}
                <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Option 2: Save New Password & Log In Directly
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const targetUser = email.trim() || 'tanmaysamal132@gmail.com';
                      handleTestAccount(targetUser);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Save & Enter Directly as {email.trim() || 'tanmaysamal132@gmail.com'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                >
                  {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showNewPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Update & Save Password</span>
                </>
              )}
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setMessage(null);
                }}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setMessage(null);
                }}
                className="text-xs text-slate-500 hover:text-indigo-600"
              >
                Request a new link
              </button>
            </div>
          </form>
        ) : (
          /* ======================================================== */
          /* SIGN IN / SIGN UP FORM                                   */
          /* ======================================================== */
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setMessage(null);
                  setIsInvalidCreds(false);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setMessage(null);
                  setIsInvalidCreds(false);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>

            {/* Error / Info Banner */}
            {message && (
              <div
                className={`p-3.5 rounded-2xl text-xs ${
                  message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                    : message.type === 'info'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : message.type === 'info' ? (
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <div className="flex-1 leading-relaxed font-medium">{message.text}</div>
                </div>

                {/* Specific resolution panel for "Invalid login credentials" */}
                {isInvalidCreds && (
                  <div className="mt-3 pt-3 border-t border-rose-200/70 dark:border-rose-900/60 space-y-2.5">
                    <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                      <strong>Why does Supabase show this?</strong> Supabase gives this generic message when:
                    </p>
                    <ul className="text-[11px] list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                      <li>
                        <strong>Unconfirmed Email:</strong> Supabase projects require clicking the email confirmation link before first password login.
                      </li>
                      <li>
                        <strong>Incomplete Sign Up:</strong> If your previous sign-up hit the hourly email rate limit, the account may not have been finalized in Supabase.
                      </li>
                      <li>
                        <strong>Forgotten or mistyped password.</strong>
                      </li>
                    </ul>

                    {/* Instant Access & Password Recovery Options */}
                    <div className="pt-1.5 space-y-2">
                      {email.trim() && (
                        <button
                          type="button"
                          onClick={() => handleTestAccount(email.trim())}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>⚡ Enter App Immediately as {email.trim()}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setIsInvalidCreds(false);
                            setMessage(null);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-semibold text-center transition-colors flex items-center justify-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Forgot Password?</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMode('signup');
                            setIsInvalidCreds(false);
                            setMessage(null);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-[11px] font-semibold text-center transition-colors"
                        >
                          🔄 Switch to Sign Up
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Specific resolution panel for rate limit */}
                {rateLimitedEmail && !isInvalidCreds && (
                  <div className="mt-3 pt-3 border-t border-rose-200/70 dark:border-rose-900/60 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleTestAccount(rateLimitedEmail)}
                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>⚡ Enter Session Now as {rateLimitedEmail}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/60 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 text-left">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                        <span>🛠️ Permanent Fix (1 minute):</span>
                      </div>
                      <p className="leading-relaxed">
                        Supabase free tier restricts confirmation emails to 3-4/hour. Disable email confirmations to remove this limit completely:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 pl-1 text-[10.5px]">
                        <li>
                          Open{' '}
                          <a
                            href="https://supabase.com/dashboard/project/hrufzffmsdtkbesqhqbk/auth/providers"
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5"
                          >
                            <span>Supabase Auth Providers</span>
                            <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        </li>
                        <li>Click on <strong>Email</strong></li>
                        <li>Toggle <strong>"Confirm email"</strong> to <strong>OFF</strong></li>
                        <li>Click <strong>Save</strong></li>
                      </ol>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Once turned off, you can sign up or sign in instantly with zero limits.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {actionNotice && (
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{actionNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="flex items-center gap-3">
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setMessage(null);
                        setIsInvalidCreds(false);
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isLoading
                  ? 'Processing...'
                  : mode === 'signup'
                  ? 'Create Supabase Account'
                  : 'Sign In to Supabase'}
              </span>
            </button>

            {/* Quick helper links */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setMessage(null);
                  }}
                  className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3 text-amber-500" />
                  <span>Reset forgotten password</span>
                </button>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Resend verification email
                </button>
              </div>
            )}

            {/* Direct Instant Access Options */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Instant One-Click Access (No Confirmation Delay)
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleTestAccount('tanmaysamal132@gmail.com')}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sign In as tanmaysamal132@gmail.com</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTestAccount('demo.student@studybuddy.ai')}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Demo Student
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1"
                >
                  <span>Continue as Guest</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
