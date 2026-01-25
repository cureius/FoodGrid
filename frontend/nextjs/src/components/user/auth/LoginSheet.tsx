'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { customerAuthApi } from '@/lib/api/customerAuth';
import { useAuthStore } from '@/stores/auth';

interface LoginSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginSheet({ isOpen, onClose, onSuccess }: LoginSheetProps) {
  const login = useAuthStore((state) => state.login);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await customerAuthApi.requestOtp(mobile);
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
      const res = await customerAuthApi.verifyOtp(mobile, fullOtp);
      login(res.token, res.profile);
      onSuccess?.();
      onClose();
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

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('mobile');
        setMobile('');
        setOtp(['', '', '', '', '', '']);
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="sheet-backdrop"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="sheet-container"
          >
            <div className="sheet-content">
              <div className="sheet-header">
                {step === 'otp' ? (
                  <button onClick={() => setStep('mobile')} className="header-btn">
                    <ChevronLeft size={24} />
                  </button>
                ) : (
                    <div className="header-spacer" /> 
                )}
                <button onClick={onClose} className="header-btn">
                  <X size={24} />
                </button>
              </div>

              {step === 'mobile' ? (
                <div className="step-box">
                  <div className="text-group">
                    <h2 className="title">Login / Signup</h2>
                    <p className="subtitle">Enter your mobile number to enjoy the best deals and track your orders.</p>
                  </div>

                  <form onSubmit={handleSendOtp} className="form-group">
                    <div className="input-wrap">
                      <div className="prefix">+91</div>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Mobile Number"
                        className="tel-input"
                        autoFocus
                      />
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading || mobile.length !== 10}
                      className="submit-btn"
                    >
                      {loading ? <Loader2 className="spinner" size={20} /> : 'GET OTP'}
                      <ArrowRight size={20} />
                    </button>
                  </form>

                  <p className="terms-text">
                    By continuing, you agree to our <span>Terms of Service</span> and <span>Privacy Policy</span>
                  </p>
                </div>
              ) : (
                <div className="step-box">
                  <div className="text-group">
                    <h2 className="title">Verify OTP</h2>
                    <p className="subtitle">Sent to <strong>+91 {mobile}</strong></p>
                  </div>

                  <div className="otp-row">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="tel"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="otp-cell"
                      />
                    ))}
                  </div>

                  {error && <p className="error-text centered">{error}</p>}

                  <div className="resend-box">
                    {timer > 0 ? (
                      <p className="timer-text">Resend OTP in <strong>{timer}s</strong></p>
                    ) : (
                      <button onClick={handleSendOtp} className="resend-link">RESEND OTP</button>
                    )}
                  </div>

                  <div className="secure-info">
                    <ShieldCheck size={18} />
                    <span>Secure 6-digit OTP login</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
      <style jsx>{`
        .sheet-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); z-index: 60; backdrop-filter: blur(4px); }
        .sheet-container { position: fixed; bottom: 0; left: 0; right: 0; z-index: 70; background: white; border-radius: 32px 32px 0 0; overflow: hidden; box-shadow: 0 -12px 40px rgba(0,0,0,0.15); max-width: 450px; margin: 0 auto; }
        .sheet-content { padding: 32px; padding-bottom: calc(32px + env(safe-area-inset-bottom)); }
        
        .sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .header-btn { padding: 8px; margin: -8px; color: var(--navy); }
        .header-spacer { width: 40px; }
        
        .step-box { display: flex; flex-direction: column; gap: 32px; }
        .text-group { display: flex; flex-direction: column; gap: 8px; }
        .title { font-size: 28px; font-weight: 800; color: var(--navy); letter-spacing: -0.5px; }
        .subtitle { color: var(--text-muted); font-weight: 600; font-size: 15px; line-height: 1.5; }
        
        .form-group { display: flex; flex-direction: column; gap: 16px; }
        .input-wrap { position: relative; display: flex; align-items: center; }
        .prefix { position: absolute; left: 16px; border-right: 1px solid var(--border-light); padding-right: 12px; font-weight: 800; color: var(--navy); }
        .tel-input { width: 100%; height: 56px; background: var(--bg-muted); border: 2px solid transparent; border-radius: 16px; padding: 0 16px 0 64px; font-size: 18px; font-weight: 800; outline: none; transition: var(--transition-fast); }
        .tel-input:focus { border-color: rgba(75, 112, 245, 0.2); background: white; }
        
        .submit-btn { width: 100%; height: 56px; background: var(--primary); color: white; border-radius: 16px; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 8px 24px rgba(75, 112, 245, 0.25); transition: var(--transition-fast); }
        .submit-btn:disabled { opacity: 0.5; }
        .submit-btn:active { transform: scale(0.98); }
        
        .error-text { font-size: 12px; color: var(--danger); font-weight: 700; }
        .error-text.centered { text-align: center; }
        
        .otp-row { display: flex; justify-content: space-between; gap: 8px; }
        .otp-cell { width: 48px; height: 56px; text-align: center; background: var(--bg-muted); border: 2px solid transparent; border-radius: 12px; font-size: 20px; font-weight: 800; outline: none; transition: var(--transition-fast); }
        .otp-cell:focus { border-color: var(--primary); background: white; }
        
        .resend-box { text-align: center; }
        .timer-text { font-size: 14px; color: var(--text-light); }
        .resend-link { font-size: 14px; font-weight: 800; color: var(--primary); }
        
        .secure-info { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--success); opacity: 0.7; }
        .secure-info span { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        
        .terms-text { font-size: 11px; text-align: center; color: var(--text-light); line-height: 1.6; }
        .terms-text span { color: var(--primary); text-decoration: underline; font-weight: 600; }
        
        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </AnimatePresence>
  );
}
