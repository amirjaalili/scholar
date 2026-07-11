import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, User, Search, Download, FileText, 
  ChevronRight, ArrowLeftRight, ChevronDown, ChevronUp, Sparkles, HelpCircle 
} from 'lucide-react';

export interface PublishedArticle {
  id: number;
  title: string;
  abstract: string;
  authors: string;
  keywords: string;
  file_path: string;
  publishDate: string;
  isDynamic: boolean;
}

export interface PublishedIssue {
  id: number;
  title: string;
  specialName: string;
  publishDate: string;
  editorInChief: string;
  coverColor: string;
  articles: PublishedArticle[];
}

export default function PublishedIssues() {
  const [issues, setIssues] = useState<PublishedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(101); // default expands the latest one
  const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null);

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const res = await fetch('/api/publications/published');
        const data = await res.json();
        if (res.ok && data.success) {
          setIssues(data.issues);
        }
      } catch (err) {
        console.error('Error fetching published archives', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublished();
  }, []);

  const toggleIssue = (issueId: number) => {
    setExpandedIssueId(expandedIssueId === issueId ? null : issueId);
  };

  const toggleArticleAbstract = (artId: number) => {
    setExpandedArticleId(expandedArticleId === artId ? null : artId);
  };

  // Safe download link simulation
  const handleDownload = (e: React.MouseEvent, art: PublishedArticle) => {
    e.stopPropagation();
    // Simulate real PDF opening or download
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
  };

  // Compute total dynamic & seeded search filter across all issues
  const filteredIssues = searchQuery.trim() === '' 
    ? issues 
    : issues.map(iss => {
        const matchingArticles = iss.articles.filter(art => 
          art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.keywords.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return {
          ...iss,
          articles: matchingArticles
        };
      }).filter(iss => iss.articles.length > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-slate-350 border-t-blue-600 animate-spin" />
        <p className="text-xs font-bold font-sans">در حال واکشی اطلاعات آرشیو نشریات منتشر شده...</p>
      </div>
    );
  }

  return (
    <div id="published-issues-page" className="space-y-8 animate-fade-in RTL" style={{ direction: 'rtl' }}>
      
      {/* Banner / Title Header */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute left-0 bottom-0 top-0 w-1/3 bg-radial from-blue-600/10 via-transparent to-transparent -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-black">
              <BookOpen className="w-4 h-4 text-blue-400" />
              آرشیو الکترونیک با دسترسی باز (Open Access)
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-100">
              دسترسی به آخرین نشریه‌ها و مقالات پذیرفته شده علمی
            </h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              کلیه مقالاتی که پس از طی فرآیند ارزیابی چند مرحله‌ای به تایید داوران و سردبیر رسیده‌اند، در شماره‌های مختلف این بخش مرتب گردیده و برای عموم پژوهشگران قابل دانلود و استفاده است.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-80 relative shrink-0">
            <input
              id="published-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold text-slate-200 bg-slate-950 border border-slate-800 rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder-slate-500"
              placeholder="جستجو در عنوان، نویسنده یا کلمات کلیدی..."
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
          </div>
        </div>
      </div>

      {searchQuery.trim() !== '' && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-855 font-bold flex items-center justify-between">
          <span>نتایج جستجو برای عبارت "{searchQuery}"</span>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            پاک کردن فیلتر جستجو
          </button>
        </div>
      )}

      {filteredIssues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-450 space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-extrabold text-sm text-slate-755">هیچ مقاله یا نشریه منطبق با جستجوی شما یافت نشد</h4>
          <p className="text-xs max-w-md mx-auto leading-relaxed">لطفاً املای عبارات یا کلمات کلیدی خود را بررسی کنید یا کلیدواژه ساده‌تری را جستجو کنید.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredIssues.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;
            return (
              <div 
                key={issue.id}
                className="bg-white rounded-2xl border border-slate-150/80 shadow-xs overflow-hidden transition"
              >
                {/* Issue Header / Accordion Trigger button */}
                <div 
                  onClick={() => toggleIssue(issue.id)}
                  className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-slate-50/60 transition"
                >
                  <div className="flex gap-4 items-center">
                    {/* Visual Mini Cover Book representation */}
                    <div className={`w-12 h-16 rounded bg-gradient-to-br ${issue.coverColor} text-white flex flex-col items-center justify-between p-1.5 shrink-0 shadow-xs`}>
                      <div className="text-[6px] opacity-75 font-black text-center leading-none">JOURNAL</div>
                      <BookOpen className="w-5 h-5 text-white/90" />
                      <div className="text-[5px] opacity-60 text-center font-mono">kar.ac.ir</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-sm leading-snug">{issue.title}</h3>
                        <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {issue.publishDate}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500">{issue.specialName}</p>
                      <div className="text-[10px] text-slate-450 font-semibold flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        سردبیر و مدیر علمی شماره: {issue.editorInChief}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <span className="text-xs font-extrabold text-blue-650 flex items-center gap-1 bg-blue-50/50 border border-blue-100/50 px-3 py-1.5 rounded-xl">
                      <Sparkles className="w-3.5 h-3.5" />
                      {issue.articles.length} مقاله منتشر شده
                    </span>

                    <div className="text-slate-400 p-1.5 bg-slate-50 border border-slate-200/50 rounded-lg">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Nested Articles inside expanded Issue folder */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/30 p-4 md:p-6 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">فهرست مقالات علمی پذیرفته شده در این شماره</h4>
                    
                    <div className="space-y-4">
                      {issue.articles.map((art, idx) => {
                        const isAbstractExpanded = expandedArticleId === art.id;
                        return (
                          <div 
                            key={art.id}
                            className="bg-white border border-slate-100 rounded-xl shadow-2xs hover:border-slate-300 transition overflow-hidden"
                          >
                            <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start gap-4">
                              <div className="space-y-2 max-w-3xl">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="bg-slate-100 text-slate-600 text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                                    {(idx + 1).toLocaleString('fa-IR')}
                                  </span>
                                  {art.isDynamic && (
                                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                                      پذیرش و تحریریه زمان‌حقیقی
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-mono">DOI: 10.30495/kar.{art.id}</span>
                                </div>

                                <h5 className="font-extrabold text-slate-900 text-xs md:text-sm leading-relaxed">
                                  {art.title}
                                </h5>

                                <div className="text-xs font-semibold text-slate-550 flex items-center gap-1.5 flex-wrap">
                                  <span className="text-slate-400">نویسندگان:</span>
                                  <span className="text-slate-700 font-black">{art.authors}</span>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-slate-400">تاریخ ثبت استناد:</span>
                                  <span className="text-slate-650">{art.publishDate}</span>
                                </div>
                                
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[10px] text-slate-400 font-bold">کلمات کلیدی:</span>
                                  <span className="text-[10px] text-slate-600 font-semibold bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5">{art.keywords}</span>
                                </div>
                              </div>

                              <div className="flex md:flex-col items-stretch gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                <button
                                  type="button"
                                  onClick={() => toggleArticleAbstract(art.id)}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                                >
                                  {isAbstractExpanded ? 'بستن چکیده' : 'مشاهده چکیده'}
                                  {isAbstractExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={(e) => handleDownload(e, art)}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  دریافت نسخه PDF
                                </button>
                              </div>
                            </div>

                            {/* Collapsible Abstract Content details */}
                            {isAbstractExpanded && (
                              <div className="bg-slate-50/50 border-t border-slate-100/60 p-4 md:p-5 text-xs text-slate-600 leading-relaxed font-semibold">
                                <div className="space-y-1">
                                  <h6 className="font-black text-slate-800 text-xs border-r-2 border-blue-500 pr-2">چکیده پژوهش علمی:</h6>
                                  <p className="text-justify pt-1 pr-2 max-w-4xl text-slate-650">{art.abstract}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
