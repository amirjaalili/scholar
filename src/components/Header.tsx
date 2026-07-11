import { BookOpen, User, LogOut, RefreshCw, Key } from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({
  currentUser,
  onLogout,
  onOpenLogin,
  currentTab,
  onTabChange
}: HeaderProps) {
  return (
    <header id="app-header" className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Meta Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl cursor-pointer" onClick={() => onTabChange('home')}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="hidden sm:block cursor-pointer" onClick={() => onTabChange('home')}>
              <h1 className="text-sm font-black text-slate-800 tracking-tight leading-tight">
                نشریه پژوهشهای کاربردی در صنایع
              </h1>
              <p className="text-[10px] text-slate-400 font-bold">
                سیستم یکپارچه مدیریت فرآیند داوری و پذیرش مقالات
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Frontend pages) */}
          <nav className="flex items-center gap-1.5 sm:gap-4 md:gap-5 border-l border-slate-100 pl-3 md:pl-5 font-semibold text-xs">
            <button
              id="nav-home"
              onClick={() => onTabChange('home')}
              className={`px-2 py-1.5 rounded-lg transition cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-blue-50 text-blue-600 font-black'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              صفحه اصلی
            </button>
            <button
              id="nav-published"
              onClick={() => onTabChange('published')}
              className={`px-2 py-1.5 rounded-lg transition cursor-pointer ${
                currentTab === 'published'
                  ? 'bg-blue-50 text-blue-600 font-black'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              نشریه‌های منتشر شده
            </button>
            <button
              id="nav-about"
              onClick={() => onTabChange('about')}
              className={`px-2 py-1.5 rounded-lg transition cursor-pointer ${
                currentTab === 'about'
                  ? 'bg-blue-50 text-blue-600 font-black'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              درباره ما
            </button>
            <button
              id="nav-contact"
              onClick={() => onTabChange('contact')}
              className={`px-2 py-1.5 rounded-lg transition cursor-pointer ${
                currentTab === 'contact'
                  ? 'bg-blue-50 text-blue-600 font-black'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              تماس با ما
            </button>
            {currentUser && (
              <button
                id="nav-dashboard"
                onClick={() => onTabChange('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-950'
                }`}
              >
                میز کار شما
              </button>
            )}
          </nav>

          {/* User Account Controls */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-bold text-slate-800 text-right">{currentUser.name}</div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full ${
                      currentUser.role === 'admin' 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : currentUser.role === 'reviewer' 
                        ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {currentUser.role === 'admin' ? 'مدیر کل سامانه' : currentUser.role === 'reviewer' ? 'داور علمی' : 'ارسال‌کننده مقاله (نویسنده)'}
                    </span>
                  </div>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                  <User className="w-5 h-5" />
                </div>

                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="خروج از حساب کاربری"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-trigger"
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-4.5 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-xs hover:bg-blue-700 transition"
              >
                <Key className="w-4 h-4" />
                ورود به سامانه علمی
              </button>
            )}
          </div>
        </div>

        {/* Small screen mobile guide for Roles switcher */}
        <div className="md:hidden flex justify-end py-2 border-t border-slate-100">
           {/* Mobile view adjustments if needed */}
        </div>
      </div>
    </header>
  );
}
