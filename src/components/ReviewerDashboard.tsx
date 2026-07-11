import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, ChevronRight, MessageSquare, Download, CheckSquare, 
  AlertTriangle, XCircle, Clock, ShieldAlert, Check, HelpCircle
} from 'lucide-react';
import { Article, ArticleAssignment } from '../types';

interface ReviewerDashboardProps {
  articles: (Article & { assignments: ArticleAssignment[] })[];
  token: string;
  onRefresh: () => void;
}

export default function ReviewerDashboard({ articles, token, onRefresh }: ReviewerDashboardProps) {
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
  const [decision, setDecision] = useState<'Approve' | 'Reject' | 'Request Revision' | ''>('');
  const [comment, setComment] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter active assignments for this reviewer
  const reviewerArticles = articles.filter(art => 
    art.assignments && art.assignments.length > 0
  );

  const handleReviewSubmit = async (assignmentId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) {
      alert('لطفا یکی از تصمیمات داوری را انتخاب کنید.');
      return;
    }
    if (!comment) {
      alert('لطفا نظر و استدلال داوری خود را بنویسید.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/assignments/${assignmentId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: decision,
          comment
        })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('تصمیم داوری شما با موفقیت در سامانه همگام‌سازی و ثبت شد.');
        setDecision('');
        setComment('');
        setActiveArticleId(null);
        onRefresh();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در ثبت داوری.');
      }
    } catch (err) {
      setErrorMessage('خطای سروری رخ داد.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabelAndStyle = (status: string) => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-50 text-amber-700 border border-amber-100',
          label: 'در انتظار نظر داوری شما'
        };
      case 'Approve':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
          label: 'تایید مقاله (پذیرش نهایی)'
        };
      case 'Reject':
        return {
          bg: 'bg-rose-50 text-rose-700 border border-rose-100',
          label: 'رد نهایی مقاله العلمي'
        };
      case 'Request Revision':
        return {
          bg: 'bg-purple-50 text-purple-700 border border-purple-100',
          label: 'درخواست بازنگری و اصلاحات'
        };
      default:
        return { bg: 'bg-gray-100 text-gray-750', label: status };
    }
  };

  const activeArticle = reviewerArticles.find(a => a.id === activeArticleId);
  // Find assignment correlating to active paper
  const activeAssignment = activeArticle?.assignments?.[0]; // Filtered by backend user ID on retrieval

  return (
    <div id="reviewer-dashboard" className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare className="w-5.5 h-6 text-amber-500" />
          داشبورد اختصاصی داوران علمی (هیئت داوری نشریه)
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
          لیست مقالاتی که توسط سردبیر یا مدیر کل سیستم جهت اظهار نظر داوری تخصصی به شما سپرده شده‌اند، در زیر نمایش داده می‌شود.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          {successMessage}
        </div>
      )}

      {/* Grid Layout: Left Column = List, Right Column = Selected Article details and review panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Assigned Papers list */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden h-fit">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">ارزیابی‌های تخصصی محول شده</h3>
          </div>

          {reviewerArticles.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-slate-350 stroke-1" />
              <p className="text-sm font-bold">هیچ مقاله‌ای در کارتابل شما وجود ندارد.</p>
              <p className="text-xs text-slate-400 mt-1">مدیر هنوز مقاله‌ای را به شما واگذار نکرده است.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviewerArticles.map((art) => {
                const asg = art.assignments[0];
                const asgStyle = getStatusLabelAndStyle(asg.status);
                const isSelected = art.id === activeArticleId;

                return (
                  <div
                    key={art.id}
                    onClick={() => {
                      setActiveArticleId(art.id);
                      setDecision(asg.status === 'Pending' ? '' : asg.status);
                      setComment(asg.review_comment || '');
                    }}
                    className={`p-5 transition cursor-pointer flex gap-4 items-start ${
                      isSelected ? 'bg-blue-50/20 border-r-4 border-blue-600' : 'hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="p-2 bg-slate-150 rounded-xl text-slate-600">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-1.5 text-right">
                      <div className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                        {art.title}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold">
                        <span>شناسه رهگیری: #{art.id}</span>
                        <span>•</span>
                        <span>ثبت در تاریخ: {new Date(art.created_at).toLocaleDateString('fa-IR')}</span>
                      </div>

                      <div className="pt-1">
                        <span className={`inline-block text-[10px] px-2 py-1 rounded-md font-bold ${asgStyle.bg}`}>
                          {asgStyle.label}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform hidden sm:block ${isSelected ? 'translate-x-1' : ''}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Paper action Form */}
        <div className="lg:col-span-5 space-y-4">
          {activeArticle && activeAssignment ? (
            <div id="reviewer-action-panel" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  جزئیات مقاله در کارتابل
                </span>
                <h3 className="font-bold text-slate-850 text-sm sm:text-base leading-relaxed mt-2">
                  {activeArticle.title}
                </h3>
              </div>

              {/* Abstract details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block mb-1">چکیده علمی:</span>
                <p className="text-slate-650 leading-relaxed max-h-48 overflow-y-auto pr-1">
                  {activeArticle.abstract}
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-200/50">
                  <span className="font-semibold text-slate-600">کلمات کلیدی: </span>
                  <span className="text-slate-550">{activeArticle.keywords}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-y border-slate-100">
                <span className="text-xs font-bold text-slate-500">فایل اصلی مقاله (جهت مطالعه):</span>
                <a
                  href={activeArticle.file_path}
                  download
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer bg-blue-50/40 hover:bg-blue-50 border border-blue-150 px-3.5 py-1.5 rounded-xl transition"
                >
                  <Download className="w-4 h-4" />
                  دانلود فایل PDF
                </a>
              </div>

              {/* Submission of review Form */}
              {activeAssignment.status === 'Pending' ? (
                <form onSubmit={(e) => handleReviewSubmit(activeAssignment.id, e)} className="space-y-4 pt-1">
                  {errorMessage && (
                    <div className="bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold py-2 px-3 rounded-lg">
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600">تصمیم علمی داوری شما *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDecision('Approve')}
                        className={`py-2 px-1 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                          decision === 'Approve'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                            : 'bg-white text-slate-550 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        تایید و پذیرش
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setDecision('Request Revision')}
                        className={`py-2 px-1 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                          decision === 'Request Revision'
                            ? 'bg-purple-50 text-purple-700 border-purple-500'
                            : 'bg-white text-slate-550 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Clock className="w-4 h-4 text-purple-600" />
                        درخواست اصلاحات
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecision('Reject')}
                        className={`py-2 px-1 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                          decision === 'Reject'
                            ? 'bg-rose-50 text-rose-700 border-rose-500'
                            : 'bg-white text-slate-550 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        مردود و رد مقاله
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">گزارش داوری و ادله علمی (جهت اطلاع نویسنده) *</label>
                    <textarea
                      required
                      rows={5}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="دلایل پذیرش، رد، یا موارد اصلاحی خود را بند‌به‌بند درج فرمایید..."
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 bg-slate-850 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {submitting ? 'در حال ثبت تصمیم داور...' : 'ثبت قطعی نظر داوری'}
                  </button>
                </form>
              ) : (
                /* Already completed evaluation */
                <div id="already-completed-box" className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 text-right text-xs">
                    <p className="font-bold text-slate-800">داوری این مقاله با موفقیت نهایی شده است.</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      تصمیم ثبت شده شما: <strong className="text-slate-800">{
                        activeAssignment.status === 'Approve' ? 'تایید و پذیرش' : activeAssignment.status === 'Request Revision' ? 'درخواست اصلاحات' : 'رد قطعی علمی'
                      }</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed bg-white border border-emerald-50/50 p-2.5 rounded-xl">
                      <strong>نظر شما:</strong> {activeAssignment.review_comment}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs h-full flex flex-col items-center justify-center">
              <HelpCircle className="w-10 h-10 mb-2 stroke-1 text-slate-350" />
              <p className="font-bold">هیچ مقاله‌ای جهت شروع ارزیابی انتخاب نشده است.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">لطفاً برای شروع روی یکی از ردیف‌های لیست مقابل کلیک کنید.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
