'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { customerAuthApi } from '@/lib/api/customerAuth';
import { useAuthStore } from '@/stores/auth';
import Logo from '@/components/Logo';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [loginMode, setLoginMode] = useState<'mobile' | 'email'>('email');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const redirect = searchParams.get('redirect') || '/user/outlets';

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, router, redirect]);

  useEffect(() => {
    if (loginMode === 'email' && email.length > 0 && !email.includes(' ')) {
      const [local, domain] = email.split('@');
      let filtered: string[] = [];
      
      if (domain !== undefined) {
        // User has typed @, filter domains
        filtered = COMMON_DOMAINS
          .filter(d => d.startsWith(domain.toLowerCase()))
          .map(d => `${local}@${d}`);
      } else {
        // User hasn't typed @, show all common domains
        filtered = COMMON_DOMAINS.map(d => `${email}@${d}`);
      }
      
      // Hide if the first suggestion is exactly what user typed
      if (filtered.length === 1 && filtered[0] === email) {
        setSuggestions([]);
      } else {
        setSuggestions(filtered);
      }
    } else {
      setSuggestions([]);
    }
  }, [email, loginMode]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loginMode === 'mobile' && mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (loginMode === 'email' && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (loginMode === 'mobile') {
        await customerAuthApi.requestOtp(mobile);
      } else {
        await customerAuthApi.requestEmailOtp(email);
      }
      setStep('otp');
      setTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) return;

    try {
      setLoading(true);
      setError(null);
      let res;
      if (loginMode === 'mobile') {
        res = await customerAuthApi.verifyOtp(mobile, fullOtp);
      } else {
        res = await customerAuthApi.verifyEmailOtp(email, fullOtp);
      }
      login(res.token, res.profile);
      router.replace(redirect);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please check and try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    if (index === 5 && value) {
        setTimeout(() => handleVerifyOtp(), 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    try {
      setLoading(true);
      setError(null);
      const res = await customerAuthApi.googleLogin(credentialResponse.credential);
      login(res.token, res.profile);
      router.replace(redirect);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="login-page">
      <header className="login-header">
        <button onClick={() => router.back()} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <Logo />
        <div className="spacer" />
      </header>

      <main className="login-content">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="login-card"
        >
          {step === 'identifier' ? (
            <div className="step-content">
              <h1 className="title">Login / Signup</h1>
              <p className="subtitle">Enter your {loginMode === 'mobile' ? 'mobile number' : 'email'} to enjoy the best deals and track your orders.</p>

              <form onSubmit={handleSendOtp} className="form">
                {/* <div className="mode-toggle">
                  <button 
                    type="button"
                    onClick={() => { setLoginMode('mobile'); setError(null); }}
                    className={`mode-btn ${loginMode === 'mobile' ? 'active' : ''}`}
                  >
                    Mobile
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setLoginMode('email'); setError(null); }}
                    className={`mode-btn ${loginMode === 'email' ? 'active' : ''}`}
                  >
                    Email
                  </button>
                </div> */}

                {loginMode === 'mobile' ? (
                  <div className="input-group">
                    <div className="country-code">
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Mobile Number"
                      className="login-input with-prefix"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="email-input-container">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        // Delay hiding so clicks on suggestions work
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="Email Address"
                      className="login-input"
                      autoFocus
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="suggestions-dropdown">
                        {suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            className="suggestion-item"
                            onClick={() => {
                              setEmail(sug);
                              setSuggestions([]);
                              setShowSuggestions(false);
                            }}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="error-msg">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || (loginMode === 'mobile' ? mobile.length !== 10 : !email)}
                  className="submit-btn"
                >
                  {loading ? <Loader2 className="spinner" /> : 'GET OTP'}
                  <ArrowRight size={20} />
                </button>
              </form>

              <div className="divider">
                <span>OR</span>
              </div>

              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed')}
                  useOneTap
                  theme="outline"
                  shape="rectangular"
                  width="100%"
                />
              </div>

              <p className="terms">
                By continuing, you agree to our <span>Terms of Service</span> and <span>Privacy Policy</span>
              </p>
            </div>
          ) : (
            <div className="step-content">
              <div className="otp-header">
                  <h1 className="title">Verify OTP</h1>
                  <p className="subtitle">Sent to <strong>{loginMode === 'mobile' ? `+91 ${mobile}` : email}</strong></p>
                  <button 
                    onClick={() => setStep('identifier')}
                    className="change-id-btn"
                  >
                    Change {loginMode === 'mobile' ? 'Number' : 'Email'}
                  </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyOtp();
                }} 
                className="otp-form"
              >
                <div className="otp-inputs">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="tel"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="otp-field"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="submit-btn verify-btn"
                >
                  {loading ? <Loader2 className="spinner" /> : 'VERIFY OTP'}
                  <ArrowRight size={20} />
                </button>
              </form>

              {error && <p className="error-msg center">{error}</p>}

              <div className="timer-box">
                {timer > 0 ? (
                  <p className="resend-text">Resend OTP in <strong>{timer}s</strong></p>
                ) : (
                  <button onClick={handleSendOtp} className="resend-btn">RESEND OTP</button>
                )}
              </div>

              <div className="secure-badge">
                <ShieldCheck size={18} />
                <span>Secure 6-digit OTP login</span>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: white;
          display: flex;
          flex-direction: column;
        }
        .login-header {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid var(--border-light);
        }
        .back-btn {
          padding: 8px;
          color: var(--navy);
        }
        .spacer { width: 40px; }
        
        .login-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
        }
        .step-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .title {
          font-size: 28px;
          font-weight: 800;
          color: var(--navy);
          letter-spacing: -0.5px;
        }
        .subtitle {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 15px;
          line-height: 1.5;
        }
        .mode-toggle {
          display: flex;
          background: var(--bg-muted);
          padding: 4px;
          border-radius: var(--radius-lg);
          gap: 4px;
        }
        .mode-btn {
          flex: 1;
          height: 48px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .mode-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        .country-code {
          position: absolute;
          left: 16px;
          border-right: 1px solid var(--border-light);
          padding-right: 12px;
          font-weight: 800;
          color: var(--navy);
          font-size: 15px;
          z-index: 10;
        }
        .login-input {
          width: 100%;
          background: var(--bg-muted);
          border: 2px solid transparent;
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          font-size: 18px;
          font-weight: 800;
          outline: none;
          transition: var(--transition-fast);
          color: var(--navy);
        }
        .login-input.with-prefix {
          padding-left: 64px;
        }
        .login-input:focus {
          border-color: rgba(75, 112, 245, 0.2);
          background: white;
          box-shadow: 0 4px 12px rgba(75, 112, 245, 0.05);
        }
        .email-input-container {
          position: relative;
        }
        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          margin-top: 4px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 100;
          overflow: hidden;
        }
        .suggestion-item {
          width: 100%;
          padding: 12px 16px;
          text-align: left;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 600;
          color: var(--navy);
          cursor: pointer;
          transition: var(--transition-fast);
          display: block;
        }
        .suggestion-item:hover {
          background: var(--bg-muted);
          color: var(--primary);
        }
        .submit-btn {
          width: 100%;
          height: 56px;
          background: var(--primary);
          color: white;
          border-radius: var(--radius-lg);
          font-weight: 800;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(75, 112, 245, 0.25);
          transition: var(--transition-fast);
          border: none;
          cursor: pointer;
        }
        .submit-btn:disabled {
          opacity: 0.5;
          box-shadow: none;
          cursor: not-allowed;
        }
        .submit-btn:active {
          transform: scale(0.98);
        }
        .error-msg {
          color: var(--danger);
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          margin-top: -8px;
        }
        .error-msg.center { text-align: center; margin-top: 0; }
        
        .otp-header {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .change-id-btn {
            align-self: flex-start;
            font-size: 12px;
            font-weight: 800;
            color: var(--primary);
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
        }
        .change-id-btn:hover { text-decoration: underline; }
        
        .otp-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .otp-inputs {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .otp-field {
          width: 48px;
          height: 56px;
          text-align: center;
          background: var(--bg-muted);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          font-size: 20px;
          font-weight: 800;
          outline: none;
          transition: var(--transition-fast);
        }
        .otp-field:focus {
          border-color: var(--primary);
          background: white;
        }
        .verify-btn {
            margin-top: 8px;
        }
        
        .timer-box { text-align: center; }
        .resend-text { font-size: 14px; color: var(--text-light); font-weight: 500; }
        .resend-btn { font-size: 14px; font-weight: 800; color: var(--primary); }
        .resend-btn:hover { text-decoration: underline; }
        
        .secure-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--success);
          opacity: 0.7;
          margin-top: 16px;
        }
        .secure-badge span {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .terms {
          font-size: 11px;
          text-align: center;
          color: var(--text-light);
          line-height: 1.6;
          padding: 0 20px;
        }
        .terms span { color: var(--primary); text-decoration: underline; font-weight: 600; }
        
        :global(.spinner) { animation: spin 0.8s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 8px 0;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
        }
        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border-light);
        }
        .google-login-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        :global(.google-login-wrapper > div) {
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading auth...</div>}>
        <LoginContent />
      </Suspense>
    </GoogleOAuthProvider>
  )
}
