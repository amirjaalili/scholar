import { useState, useEffect } from 'react';
import { 
  BookOpen, Sparkles, Shield, User, HelpCircle, FileText, 
  Key, LogIn, ExternalLink, MessageCircle, AlertCircle, Clock,
  Calendar, Download, Award
} from 'lucide-react';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import AuthorDashboard from './components/AuthorDashboard';
import ReviewerDashboard from './components/ReviewerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import PublishedIssues from './components/PublishedIssues';
import { User as UserType } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sysTime, setSysTime] = useState('');
  const [publishedIssues, setPublishedIssues] = useState<any[]>([]);

  // 1. Initial State Load - Authenticate stored token & load preseeded users
  useEffect(() => {
    // Standard system clock update for visual realism
    const interval = setInterval(() => {
      setSysTime(new Date().toLocaleTimeString('fa-IR', { timeStyle: 'short' }));
    }, 1000);
    setSysTime(new Date().toLocaleTimeString('fa-IR', { timeStyle: 'short' }));

    const initAuth = async () => {
      const storedToken = localStorage.getItem('journal_token');
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          const data = await res.json();
          if (res.ok) {
            setCurrentUser(data.user);
            setToken(storedToken);
            setCurrentTab('dashboard');
          } else {
            localStorage.removeItem('journal_token');
          }
        } catch (err) {
          console.error('Failed verification', err);
        }
      }

      // Fetch public journal issues
      try {
        const pubRes = await fetch('/api/publications/published');
        const pubData = await pubRes.json();
        if (pubRes.ok && pubData.success) {
          setPublishedIssues(pubData.issues || []);
        }
      } catch (err) {
        console.error('Failed fetching publications list on startup', err);
      }

      setLoading(false);
    };

    initAuth();
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch appropriate articles depending on active logged in user role
  const fetchArticles = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/articles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error('Failed fetching articles list', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchArticles();
    } else {
      setArticles([]);
    }
  }, [token, currentUser]);

  const handleLoginSuccess = (user: UserType, userToken: string) => {
    localStorage.setItem('journal_token', userToken);
    setCurrentUser(user);
    setToken(userToken);
    setIsLoginOpen(false);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('journal_token');
    setCurrentUser(null);
    setToken(null);
    setCurrentTab('home');
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 bg-slate-50/50">
      
      {/* Dynamic Header Component */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'dashboard' && !currentUser) {
            setIsLoginOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
      />

      {/* Main Content body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-350 border-t-blue-600 animate-spin" />
            <p className="text-xs font-bold">در حال راه‌اندازی سامانه علمی نشریه...</p>
          </div>
        ) : (
          /* Dynamic Routing and View Engine based on currentTab state */
          <div className="space-y-6">
            {currentTab === 'about' && <AboutUs />}
            {currentTab === 'contact' && <ContactUs />}
            {currentTab === 'published' && <PublishedIssues />}
            
            {currentTab === 'home' && (
              /* Home Page Panel - Suitable for fm.kar.ac.ir */
              <div className="space-y-10 py-4 max-w-5xl mx-auto">
                {currentUser && (
                  <div className="flex justify-between items-center bg-blue-50 border border-blue-150 p-4 rounded-xl text-xs text-blue-800">
                    <span className="font-bold flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-600" />
                      شما با موفقیت به عنوان {currentUser.name} به سامانه وارد شدید.
                    </span>
                    <button 
                      onClick={() => setCurrentTab('dashboard')} 
                      className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                    >
                      ورود به میز کار کارشناس خصوصی من
                    </button>
                  </div>
                )}

                {/* Display Hero Banner */}
                <div className="text-center space-y-4 py-8">
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-150 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold mb-2">
                    <Sparkles className="w-4 h-4" />
                    دسترسی آزاد به مقالات معتبر علمی و پژوهشی
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-905 tracking-tight leading-tight max-w-2xl mx-auto">
                    سامانه هوشمند ارسال، ارزیابی تخصصی و چاپ مقالات علمی و پژوهشی
                  </h2>
                  <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                    پلتفرم یکپارچه برای مدیریت چرخه عمر مقالات علمی، از دریافت و ارزیابی تا داوری تخصصی و انتشار نهایی در قالب شماره‌های نشریه.
                  </p>
                  
                  <div className="flex justify-center gap-3 pt-4">
                    {currentUser ? (
                      <button
                        onClick={() => setCurrentTab('dashboard')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md cursor-pointer transition"
                      >
                        ورود به میز کار شما
                      </button>
                    ) : (
                      <button
                        id="btn-login-hero"
                        onClick={() => setIsLoginOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md cursor-pointer transition"
                      >
                        ورود پژوهشگران / بارگذاری مقاله
                      </button>
                    )}
                    <a
                      href="#how-it-works"
                      className="bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs px-6 py-3.5 rounded-xl border border-slate-200 cursor-pointer transition"
                    >
                      راهنمای گردش کار سامانه
                    </a>
                  </div>
                </div>

                {/* 2. Listing of Published Issues & Articles (New Request) */}
                <div id="home-published-section" className="space-y-6" style={{ direction: 'rtl' }}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        آخرین نشریه‌ها و مقالات پژوهشی منتشر شده
                      </h3>
                      <p className="text-[11px] text-slate-500 font-bold">
                        پژوهش‌های علمی تایید شده و آماده استناد کادر داوران علمی سامانه
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab('published')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-705 flex items-center gap-1 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      مشاهده آرشیو کامل نشریات
                      <span>←</span>
                    </button>
                  </div>

                  {publishedIssues && publishedIssues.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Sidebar panel for latest issue cover book visual */}
                      <div className="lg:col-span-1 bg-white border border-slate-150 rounded-2xl p-5 flex flex-col justify-between items-center text-center space-y-4 shadow-3xs">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-md">
                          شماره جاری / جدیدترین انتشار
                        </span>

                        <div className={`w-28 h-36 rounded-lg bg-gradient-to-br ${publishedIssues[0].coverColor || 'from-blue-900 to-indigo-950'} text-white flex flex-col items-center justify-between p-3 shrink-0 shadow-md transform hover:rotate-2 transition duration-300`}>
                          <div className="text-[9px] opacity-75 font-black text-center leading-none">JOURNAL</div>
                          <BookOpen className="w-9 h-9 text-white/90" />
                          <div className="text-[8px] opacity-60 text-center font-mono">kar.ac.ir</div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-sm">{publishedIssues[0].title}</h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2">
                            {publishedIssues[0].specialName}
                          </p>
                          <span className="inline-block bg-slate-100 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded-full">
                            انتشار: {publishedIssues[0].publishDate}
                          </span>
                        </div>

                        <button
                          onClick={() => setCurrentTab('published')}
                          className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
                        >
                          بررسی مقالات این شماره
                        </button>
                      </div>

                      {/* Main articles listing column */}
                      <div className="lg:col-span-2 space-y-3">
                        {publishedIssues.slice(0, 2).map((issue: any) => 
                          (issue.articles || []).slice(0, 2).map((art: any) => (
                            <div 
                              key={art.id}
                              className="bg-white border border-slate-150 hover:border-slate-300 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition shadow-3xs"
                            >
                              <div className="space-y-1.5 max-w-lg text-right">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {issue.title.split(' (')[0]}
                                  </span>
                                  {art.isDynamic && (
                                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                      زمان‌حقیقی جدید
                                    </span>
                                  )}
                                  <span className="text-[9px] text-slate-400 font-mono">DOI: {art.id}</span>
                                </div>
                                <h4 className="font-extrabold text-slate-900 text-xs md:text-sm leading-snug line-clamp-1">
                                  {art.title}
                                </h4>
                                <div className="text-[11px] font-semibold text-slate-550">
                                  نویسندگان: <strong className="text-slate-850">{art.authors}</strong>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  کلمات کلیدی: {art.keywords}
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  // Open download simulation in standard fashion
                                  const win = window.open('', '_blank');
                                  if (win) {
                                    win.document.write(`
                                      <html>
                                      <head>
                                        <title>${art.title}</title>
                                        <style>
                                          body { font-family: Tahoma, sans-serif; direction: rtl; padding: 40px; background: #f8fafc; color: #1e293b; line-height: 1.8; }
                                          .card { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
                                          h1 { color: #1e3a8a; font-size: 24px; border-bottom: 2px solid #570df8; padding-bottom: 12px; }
                                          .meta { color: #475569; font-size: 13px; margin-bottom: 20px; font-weight: bold; }
                                          p { font-size: 14px; text-align: justify; }
                                          .badge { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
                                          .back { margin-top: 30px; display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: bold; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="card">
                                          <span class="badge">سند رسمی مجله پژوهشهای کاربردی در صنایع</span>
                                          <h1>${art.title}</h1>
                                          <div class="meta">نویسندگان: ${art.authors} | تاریخ انتشار در نشریه: ${art.publishDate}</div>
                                          <h3>چکیده مقاله:</h3>
                                          <p>${art.abstract}</p>
                                          <h3>کلمات کلیدی:</h3>
                                          <p><strong>${art.keywords}</strong></p>
                                          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>
                                          <p style="font-size: 12px; color: #94a3b8;">شناسه اثر دیجیتال (DOI): 10.30495/journal.fm.kar.2026.1102.1</p>
                                          <a href="#" onclick="window.close()" class="back">بستن پنجره سند</a>
                                        </div>
                                      </body>
                                      </html>
                                    `);
                                    win.document.close();
                                  }
                                }}
                                className="w-full sm:w-auto text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                دانلود PDF مقاله
                              </button>
                            </div>
                          ))
                        ).flat().slice(0, 3)}
                      </div>

                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-150 p-6 rounded-xl text-center text-slate-450 text-xs font-semibold">
                      در حال واکشی مقالات علمی منتشر شده...
                    </div>
                  )}
                </div>

                {/* Interactive workflow explanation section */}
                <div id="how-it-works" className="bg-white rounded-2xl border border-slate-100 p-8 shadow-xs space-y-6">
                  <h3 className="text-lg font-black text-slate-850 text-center">
                    چرخه کاربری و تایید محتوای علمی مجلات
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
                    <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold mx-auto">۱</div>
                      <h4 className="font-bold text-sm text-slate-800">ارسال چند مرحله‌ای پژوهشگر</h4>
                      <p className="text-slate-500 leading-relaxed font-semibold">
                        نویسنده با پر کردن مشخصات، کلید واژه‌ها، بارگذاری همکاران و فایل اصلی پروژه با فرمت PDF پرونده خود را ثبت کرده و وضعیت روی <strong className="text-amber-600 font-black">در انتظار ارجاع (Pending)</strong> قرار می‌گیرد.
                      </p>
                    </div>

                    <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold mx-auto">۲</div>
                      <h4 className="font-bold text-sm text-slate-800">تخصیص هیئت داوران توسط مدیر</h4>
                      <p className="text-slate-500 leading-relaxed font-semibold">
                        مدیر سامانه مقاله در انتظار را بررسی و به یک یا چند داور تخصصی کادر ارجاع می‌دهد؛ وضعیت اتوماتیک به <strong className="text-blue-600 font-black">تحت داوری (Under Review)</strong> تغییر می‌یابد.
                      </p>
                    </div>

                    <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mx-auto">۳</div>
                      <h4 className="font-bold text-sm text-slate-800">ارزیابی داور و تایید نهایی سردبیر</h4>
                      <p className="text-slate-500 leading-relaxed font-semibold">
                        داوران کامنت‌های خود را منعکس می‌کنند؛ در صورت درخواست تغییر، نویسنده اصلاحات را اعمال نموده و نهایتاً مدیر تصمیم بر انتشار چاپ یا رد اثر را ابلاغ می‌کند.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'dashboard' && currentUser && (
              /* Dashboard of the logged-in system controller */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-900 text-white rounded-2xl py-3.5 px-6 shadow-sm border border-blue-950">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-300" />
                    <span className="text-xs font-bold">ورود مجاز: ارتباط شما با مرکز سامانه برقرار و پایگاه داده ایمن است.</span>
                  </div>
                  <div className="text-[11px] font-bold text-blue-200 mt-2 sm:mt-0">
                    ساعت جاری سامانه: {sysTime} تهران (UTC+3.5)
                  </div>
                </div>

                {/* Dashboards Routing with active permissions checks */}
                {currentUser.role === 'author' && (
                  <AuthorDashboard 
                    articles={articles} 
                    token={token!} 
                    onRefresh={fetchArticles} 
                  />
                )}

                {currentUser.role === 'reviewer' && (
                  <ReviewerDashboard 
                    articles={articles} 
                    token={token!} 
                    onRefresh={fetchArticles} 
                  />
                )}

                {currentUser.role === 'admin' && (
                  <AdminDashboard 
                    articles={articles} 
                    token={token!} 
                    onRefresh={fetchArticles} 
                  />
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Login Modal Overlay */}
      {isLoginOpen && (
        <LoginModal
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setIsLoginOpen(false)}
        />
      )}

      {/* Footer copyright */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-center sm:text-right font-medium">
            تمامی حقوق مادی و معنوی این سامانه متعلق به نشریه پژوهشهای کاربردی در صنایع است.
          </p>
          <div className="flex gap-4 font-bold text-[11px]">
            <a href="#how-it-works" className="hover:text-white transition"> گردش کار</a>
            <span>•</span>
            <span className="text-slate-500">نسخه ۱۱.۰.۲</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
