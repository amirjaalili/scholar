import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, UserCheck, X } from 'lucide-react';
import { UserRole } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: any, token: string) => void;
  onClose: () => void;
}

export default function LoginModal({ onLoginSuccess, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('author');
  const [regCode, setRegCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setErrMessage(null);
    setSuccessMessage(null);
    
    if (!regEmail) {
      setErrMessage('لطفا ابتدا ایمیل خود را وارد کنید.');
      return;
    }
    
    setSendingCode(true);
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail })
      });
      const data = await response.json();
      
      if (response.ok) {
        setCodeSent(true);
        setSuccessMessage(data.message || 'کد تایید به ایمیل شما ارسال شد.');
      } else {
        setErrMessage(data.error || 'خطا در ارسال کد تایید.');
      }
    } catch (err) {
      setErrMessage('ارتباط با سرور برقرار نشد.');
    } finally {
      setSendingCode(false);
    }
  };

  // Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!loginEmail || !loginPassword) {
      setErrMessage('لطفا تمام فیلدها را پر کنید.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      
      if (response.ok) {
        onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setErrMessage(data.error || 'ورود ناموفق بود.');
      }
    } catch (err) {
      setErrMessage('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!regName || !regEmail || !regPassword || !regCode) {
      setErrMessage('پر کردن تمامی فیلدها و کد تایید الزامی است.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          code: regCode
        })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('ثبت نام با موفقیت انجام شد! حالا می‌توانید با اطلاعات خود وارد حساب کاربری شوید.');
        // Automatically switch to login tab and prefill email
        setLoginEmail(regEmail);
        setTimeout(() => {
          setActiveTab('login');
          setSuccessMessage(null);
        }, 2200);
      } else {
        setErrMessage(data.error || 'ثبت نام ناموفق بود.');
      }
    } catch (err) {
      setErrMessage('پاسخی از سرور دریافت نشد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div id="login-modal-box" className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100 transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <h2 className="text-xl font-bold">پورتال اعضا و هیئت تحریریه مراجع علمی</h2>
          <p className="text-xs text-white/80 mt-1.5 font-medium">پورتال متمرکز ارسال، تخصیص و داوری نشریه</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setActiveTab('login'); setErrMessage(null); }}
            className={`w-1/2 py-3.5 text-center font-bold text-sm flex justify-center items-center gap-1.5 transition ${
              activeTab === 'login'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-slate-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            ورود به سامانه
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrMessage(null); }}
            className={`w-1/2 py-3.5 text-center font-bold text-sm flex justify-center items-center gap-1.5 transition ${
              activeTab === 'register'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-slate-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            ثبت‌نام کاربر جدید
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errMessage && (
            <div className="bg-rose-50 text-rose-600 border border-rose-100 text-xs py-3 px-4 rounded-xl font-bold mb-4">
              {errMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs py-3 px-4 rounded-xl font-bold mb-4">
              {successMessage}
            </div>
          )}

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">پست الکترونیکی (ایمیل)</label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="example@journal.ir"
                    className="w-full text-sm border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">رمز عبور</label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-850 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'درحال بررسی...' : 'ورود امن به حساب'}
                </button>
              </div>

              <div className="text-center mt-4">
                <p className="text-[11px] text-slate-400 font-medium">
                  برای آزمایش سریع می‌توانید از گزینه‌ی بالای صفحه (تغییر سریع نقش) نیز استفاده نمایید.
                </p>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">نام و نام خانوادگی به فارسی *</label>
                <div className="relative">
                  <User className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="مثال: دکتر مهدی احمدی"
                    className="w-full text-sm border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">آدرس ایمیل کاربر *</label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@university.ir"
                    className="w-full text-sm border border-slate-200 rounded-xl pr-10 pl-24 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || codeSent}
                    className="absolute left-1.5 top-1.5 bottom-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition disabled:opacity-50"
                  >
                    {sendingCode ? '...' : codeSent ? 'ارسال شد' : 'ارسال کد'}
                  </button>
                </div>
              </div>

              {codeSent && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">کد تایید *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value)}
                      placeholder="کد ۵ رقمی ارسال شده به ایمیل"
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 text-center tracking-widest"
                      dir="ltr"
                      maxLength={5}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">رمز ورود دلخواه *</label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر"
                    className="w-full text-sm border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">نقش کاربری در سامانه علمی *</label>
                <div className="bg-blue-50/50 border border-blue-150 rounded-xl p-3 text-right">
                  <span className="inline-block text-xs font-black text-blue-750 bg-blue-100/60 px-2.5 py-1 rounded-md mb-1.5">
                    نویسنده مقاله (Author)
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    جهت حفظ امنیت و یکپارچگی ارزیابی‌ها، ثبت‌نام مستقیم هم‌اکنون تنها برای نویسندگان مقالات فعال است. نقش‌های دیگر (داور علمی و مدیر نشریه) منحصراً توسط پنل مدیریت ایجاد و تخصیص می‌یابند.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-xs hover:shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  {loading ? 'در حال ثبت‌نام...' : 'عضویت و ایجاد حساب'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
