import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Layers, Users, CheckCircle2, AlertTriangle, 
  XCircle, UserCheck, Plus, Check, Settings, Download, Search, Info, HelpCircle
} from 'lucide-react';
import { Article, ArticleAssignment, ArticleStatus } from '../types';
import PublishedIssuesManager from './PublishedIssuesManager';

interface AdminDashboardProps {
  articles: (Article & { assignments: ArticleAssignment[] })[];
  token: string;
  onRefresh: () => void;
}

interface ReviewerOption {
  id: number;
  name: string;
  email: string;
}

export default function AdminDashboard({ articles, token, onRefresh }: AdminDashboardProps) {
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
  const [adminMenu, setAdminMenu] = useState<'submissions' | 'publications' | 'users'>('submissions');
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<number[]>([]);
  
  // Admin final decision states
  const [finalComment, setFinalComment] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Under Review' | 'Needs Revision' | 'Approved' | 'Rejected'>('All');

  // User management states
  const [usersList, setUsersList] = useState<{ id: number; name: string; email: string; role: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'reviewer' | 'author'>('reviewer');
  const [userSuccessMessage, setUserSuccessMessage] = useState<string | null>(null);
  const [userErrorMessage, setUserErrorMessage] = useState<string | null>(null);

  const fetchReviewers = async () => {
    try {
      const res = await fetch('/api/reviewers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReviewers(data.reviewers || []);
      }
    } catch (err) {
      console.error('Failed to load reviewers list', err);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUserErrorMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users || []);
      } else {
        setUserErrorMessage(data.error || 'خطا در بارگذاری فهرست کاربران.');
      }
    } catch (err) {
      setUserErrorMessage('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load list of available reviewers on boot
  useEffect(() => {
    fetchReviewers();
  }, [token]);

  // Load list of users when active tab is 'users'
  useEffect(() => {
    if (adminMenu === 'users') {
      fetchUsers();
    }
  }, [adminMenu, token]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccessMessage(null);
    setUserErrorMessage(null);

    if (!newUserName || !newUserEmail || !newUserPassword || !newUserRole) {
      setUserErrorMessage('لطفاً تمامی فیلدهای فرم ایجاد کاربر را پر کنید.');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
        })
      });
      const data = await res.json();

      if (res.ok) {
        setUserSuccessMessage(`کاربر جدید با نام "${newUserName}" با موفقیت ایجاد شد.`);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('reviewer');
        fetchUsers();
        fetchReviewers(); // Refresh reviewers list too
        setTimeout(() => setUserSuccessMessage(null), 5000);
      } else {
        setUserErrorMessage(data.error || 'خطا در ایجاد کاربر جدید.');
      }
    } catch (err) {
      setUserErrorMessage('خطای شبکه در مسیر ارتباطی.');
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`آیا از حذف حساب کاربری "${userName}" از سیستم نشریه به طور کامل اطمینان دارید؟`)) {
      return;
    }

    setUserSuccessMessage(null);
    setUserErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setUserSuccessMessage(`حساب کاربری "${userName}" با موفقیت به صورت کامل حذف شد.`);
        fetchUsers();
        fetchReviewers(); // Refresh reviewers list too
        setTimeout(() => setUserSuccessMessage(null), 5000);
      } else {
        setUserErrorMessage(data.error || 'خطا در حذف کاربر.');
      }
    } catch (err) {
      setUserErrorMessage('خطای ارتباط با سرور.');
    }
  };

  // Handle Reviewer allocation
  const handleAssignReviewers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReviewerIds.length === 0) {
      alert('لطفاً حداقل یک داور را انتخاب نمایید.');
      return;
    }

    setSubmittingAssign(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/articles/${activeArticleId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reviewerIds: selectedReviewerIds
        })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('داور(ها) با موفقیت تخصیص یافتند و وضعیت مقاله به "در حال داوری" تغییر یافت.');
        setSelectedReviewerIds([]);
        onRefresh();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در ارجاع داور.');
      }
    } catch (err) {
      setErrorMessage('ارتباط با سرور قطع شده است.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Handle final decision publication / reject
  const handleFinalDecision = async (decisionStatus: ArticleStatus) => {
    if (!confirm(`آیا از تغییر وضعیت نهایی این مقاله علمی به "${decisionStatus === 'Approved' ? 'پذیرش شده' : decisionStatus === 'Rejected' ? 'مردود علمی' : 'نیازمند اصلاحات'}" اطمینان دارید؟`)) {
      return;
    }

    setSubmittingDecision(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/articles/${activeArticleId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          finalStatus: decisionStatus
        })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('تصمیم سردبیری و وضعیت نهایی پذیرش مقاله با موفقیت به نویسنده ابلاغ شد.');
        onRefresh();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در اعمال تصمیم نهایی.');
      }
    } catch (err) {
      setErrorMessage('خطای ارتباط با سرور.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // High-level dashboard counters calculations
  const totalSubmissions = articles.length;
  const pendingAssign = articles.filter(a => a.status === 'Pending').length;
  const underReview = articles.filter(a => a.status === 'Under Review').length;
  const needsRevision = articles.filter(a => a.status === 'Needs Revision').length;
  const approvedCount = articles.filter(a => a.status === 'Approved').length;
  const rejectedCount = articles.filter(a => a.status === 'Rejected').length;

  const filteredArticles = articles.filter(art => {
    if (activeTab === 'All') return true;
    return art.status === activeTab;
  });

  const activeArticle = articles.find(a => a.id === activeArticleId);
  const activeAssignments = activeArticle?.assignments || [];

  const getStatusColor = (status: ArticleStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Under Review': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Needs Revision': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'Approved': return 'bg-emerald-100 text-emerald-750 border border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border border-rose-200';
    }
  };

  const getStatusLabelPersian = (status: ArticleStatus) => {
    switch (status) {
      case 'Pending': return 'در انتظار انتساب داور';
      case 'Under Review': return 'تحت بررسی داوران';
      case 'Needs Revision': return 'نیازمند اصلاحات نویسنده';
      case 'Approved': return 'پذیرش نهایی (انتشار)';
      case 'Rejected': return 'مردود و بایگانی شده';
    }
  };

  const toggleReviewerSelection = (id: number) => {
    if (selectedReviewerIds.includes(id)) {
      setSelectedReviewerIds(selectedReviewerIds.filter(rid => rid !== id));
    } else {
      setSelectedReviewerIds([...selectedReviewerIds, id]);
    }
  };

  return (
    <div id="admin-dashboard" className="space-y-6">
      {/* Top statistics overview block */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4.5 text-right shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">کل مقالات واصله</span>
          <div className="text-2xl font-black text-slate-805">{totalSubmissions}</div>
        </div>
        <div className="bg-amber-50/40 rounded-2xl border border-amber-100 p-4.5 text-right">
          <span className="text-[10px] text-amber-600 font-bold block mb-1">نیاز به داور</span>
          <div className="text-2xl font-black text-amber-800">{pendingAssign}</div>
        </div>
        <div className="bg-blue-50/40 rounded-2xl border border-blue-100 p-4.5 text-right">
          <span className="text-[10px] text-blue-600 font-bold block mb-1">در حال داوری</span>
          <div className="text-2xl font-black text-blue-800">{underReview}</div>
        </div>
        <div className="bg-purple-50/40 rounded-2xl border border-purple-100 p-4.5 text-right">
          <span className="text-[10px] text-purple-600 font-bold block mb-1">نیازمند اصلاحات</span>
          <div className="text-2xl font-black text-purple-800">{needsRevision}</div>
        </div>
        <div className="bg-emerald-50/40 rounded-2xl border border-emerald-100 p-4.5 text-right">
          <span className="text-[10px] text-emerald-600 font-bold block mb-1">پذیرفته‌شده نهایی</span>
          <div className="text-2xl font-black text-emerald-800">{approvedCount}</div>
        </div>
        <div className="bg-rose-50/40 rounded-2xl border border-rose-100 p-4.5 text-right">
          <span className="text-[10px] text-rose-600 font-bold block mb-1">مردود شده علمی</span>
          <div className="text-2xl font-black text-rose-800">{rejectedCount}</div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          {successMessage}
        </div>
      )}

      {/* Admin High-level Sub-Tabs Dashboard Navigation */}
      <div className="flex border border-slate-100 text-xs font-black gap-2 bg-slate-50/60 p-1.5 rounded-xl">
        <button
          onClick={() => setAdminMenu('submissions')}
          className={`py-2.5 px-5 rounded-lg transition cursor-pointer ${
            adminMenu === 'submissions' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          کارتابل بررسی مقالات علمی ارسالی
        </button>
        <button
          onClick={() => setAdminMenu('publications')}
          className={`py-2.5 px-5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            adminMenu === 'publications' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          مدیریت نشریه‌ها و نوشته‌های منتخب (وردپرسی)
        </button>
        <button
          onClick={() => setAdminMenu('users')}
          className={`py-2.5 px-5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            adminMenu === 'users' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          مدیریت کاربران و نقش‌های سامانه (ایجاد مدیر و داور)
        </button>
      </div>

      {adminMenu === 'submissions' ? (
        /* Grid structure: Right = Table Directory, Left = Reviewer Assigner & Decision Board */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Table Directory for Submissions */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden h-fit">
          <div className="p-5 border-b border-indigo-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm sm:text-base">
                <ShieldCheck className="w-5.5 h-5.5 text-blue-600" />
                کارتابل هیئت تحریریه و تصمیم‌گیری نهایی
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">مدیریت ردیابی، ارجاع، و ابلاغ نتایج داوری مقالات جاری</p>
            </div>
          </div>

          {/* Quick status tabs filter */}
          <div className="flex border-b border-slate-100 overflow-x-auto text-[11px] font-bold bg-slate-50">
            {(['All', 'Pending', 'Under Review', 'Needs Revision', 'Approved', 'Rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setActiveArticleId(null); }}
                className={`py-3.5 px-4 scroll-mx-4 transition whitespace-nowrap cursor-pointer hover:bg-slate-100 ${
                  activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600 font-black' : 'text-slate-500'
                }`}
              >
                {tab === 'All' ? 'انواع مقالات' : getStatusLabelPersian(tab as ArticleStatus)}
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Layers className="w-12 h-12 mx-auto mb-3 text-slate-350 stroke-1" />
              <p className="text-xs font-bold">هیچ مقاله‌ای در این وضعیت تصفیه ثبت نشده است.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table id="admin-articles-table" className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="py-3 px-4">شناسه</th>
                    <th className="py-3 px-4">مشخصات مقاله علمی و نویسنده</th>
                    <th className="py-3 px-4">داوران منتسب</th>
                    <th className="py-3 px-4">وضعیت سامانه</th>
                    <th className="py-3 px-4 text-left">عملیات اداری</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArticles.map((art) => {
                    const isSelected = art.id === activeArticleId;
                    return (
                      <tr 
                        key={art.id} 
                        className={`transition hover:bg-slate-55/15 cursor-pointer ${
                          isSelected ? 'bg-blue-50/20' : ''
                        }`}
                        onClick={() => setActiveArticleId(art.id)}
                      >
                        <td className="py-3 px-4 font-mono text-slate-400">#{art.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 line-clamp-1 max-w-sm">{art.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            نویسنده مسوول: {art.author_name} ({art.authors_list})
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {art.assignments && art.assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {art.assignments.map((asg, index) => (
                                <span 
                                  key={index} 
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    asg.status === 'Approve' 
                                      ? 'bg-emerald-50 text-emerald-600' 
                                      : asg.status === 'Reject' 
                                      ? 'bg-rose-50 text-rose-600' 
                                      : asg.status === 'Request Revision'
                                      ? 'bg-purple-50 text-purple-600'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {asg.reviewer_name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-amber-500 text-[10px] font-bold">بدون داور</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-md font-bold text-[10px] inline-block ${getStatusColor(art.status)}`}>
                            {getStatusLabelPersian(art.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveArticleId(art.id);
                            }}
                            className="bg-slate-100 hover:bg-slate-200.5 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold border border-slate-200.5 transition cursor-pointer"
                          >
                            بررسی و ارجاع
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assigner Tool, Reviewer Scorecard, or Decision Board Column */}
        <div className="lg:col-span-4 space-y-4">
          {activeArticle ? (
            <div id="admin-action-deck" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] text-blue-600 font-black bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                  پنل اقدام مدیر سامانه (سردبیر)
                </span>
                <h3 className="font-bold text-slate-850 text-sm leading-relaxed mt-2.5">
                  {activeArticle.title}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  نویسندگان همکار: <strong>{activeArticle.authors_list}</strong>
                </p>
              </div>

              {/* Sub-block 1: Assign Reviewer (If article status is Pending) */}
              {activeArticle.status === 'Pending' && (
                <div id="assign-reviewer-card" className="border border-amber-250 bg-amber-50/15 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    تخصیص داوران جدید (Reviewer Assignment)
                  </h4>
                  <p className="text-[10px] text-slate-405 leading-relaxed font-semibold">
                    جهت بررسی مقاله، داوران واجد شرایط زیر را انتخاب نموده و ارجاع دهید. تخصیص داور وضعیت مقاله را خودکار به "در حال داوری" می‌برد.
                  </p>

                  <form onSubmit={handleAssignReviewers} className="space-y-3">
                    <div className="border border-slate-200/60 bg-white rounded-xl divide-y max-h-36 overflow-y-auto">
                      {reviewers.map((rev) => {
                        const isChecked = selectedReviewerIds.includes(rev.id);
                        return (
                          <div 
                            key={rev.id} 
                            onClick={() => toggleReviewerSelection(rev.id)}
                            className="flex items-center gap-2.5 p-2 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              readOnly
                              checked={isChecked}
                              className="rounded text-blue-600 border-slate-300 w-4.5 h-4.5"
                            />
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-700 block">{rev.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{rev.email}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAssign || selectedReviewerIds.length === 0}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {submittingAssign ? 'در حال ثبت پرونده ارجاع...' : 'ثبت قطعی ارجاع به داوران منتخب'}
                    </button>
                  </form>
                </div>
              )}

              {/* Sub-block 2: Existing Assignments Status Indicator */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">امتیازات و نظرات هیئت داوران مرجع:</span>
                
                {activeAssignments.length === 0 ? (
                  <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 p-3 rounded-lg font-bold">
                    هیچ داوری هنوز برای این مقاله منصوب نشده است.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeAssignments.map((asg) => (
                      <div key={asg.id} className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl space-y-1 text-right text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">{asg.reviewer_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            asg.status === 'Approve' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : asg.status === 'Reject' 
                              ? 'bg-rose-50 text-rose-700' 
                              : asg.status === 'Request Revision'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {asg.status === 'Approve' ? 'پذیرش شد' : asg.status === 'Reject' ? 'رد شد' : asg.status === 'Request Revision' ? 'درخواست اصلاحات' : 'در انتظار داوری'}
                          </span>
                        </div>
                        {asg.review_comment ? (
                          <p className="text-[10px] text-slate-550 leading-relaxed bg-white border border-slate-100 p-2 rounded-lg mt-1 italic">
                            "{asg.review_comment}"
                          </p>
                        ) : (
                          <p className="text-[9px] text-slate-400 italic">هنوز نظری از سمت داور منعکس نشده است.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-block 3: Final Administrative Verdict Actions */}
              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                <span className="text-xs font-bold text-slate-600 block">اتخاذ تصمیم نهایی سردبیر (Publish Status):</span>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  پس از دریافت ارزیابی‌های تخصصی داوران، می‌توانید وضعیت مقاله را برای پذیرش نهایی، ارجاع جهت اصلاحات، یا رد کلی سیستم ثبت و ابلاغ کنید.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleFinalDecision('Approved')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    تایید مقاله و پذیرش برای انتشار نهایی
                  </button>

                  <button
                    onClick={() => handleFinalDecision('Needs Revision')}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    درخواست انجام اصلاحات توسط نویسنده
                  </button>

                  <button
                    onClick={() => handleFinalDecision('Rejected')}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    رد نهایی مقاله و مختومه کردن فرآیند
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs h-full flex flex-col items-center justify-center">
              <HelpCircle className="w-10 h-10 mb-2 stroke-1 text-slate-350" />
              <p className="font-bold">هیچ مقاله‌ای جهت تصمیم‌گیری انتخاب نشده است.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">یک مقاله را از کارتابل انتخاب کنید تا دکمه‌های اقدام فعال شوند.</p>
            </div>
          )}
        </div>
      </div>
      ) : adminMenu === 'users' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-slate-800">
          {/* Create User Form - Left Side */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-xs h-fit space-y-4">
            <div>
              <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                افزودن عضو جدید به تحریریه
              </span>
              <h3 className="font-extrabold text-slate-800 text-sm mt-2.5">
                ایجاد مدیر، داور یا کاربر جدید
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                رمز عبور و مشخصات همکار علمی را وارد نمایید. این حساب بلافاصله فعال شده و نام کاربری همان نشانی آدرس ایمیل انتخابی خواهد بود.
              </p>
            </div>

            {userSuccessMessage && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[11px] font-bold py-2.5 px-3 rounded-xl">
                {userSuccessMessage}
              </div>
            )}

            {userErrorMessage && (
              <div className="bg-rose-50 text-rose-700 border border-rose-150 text-[11px] font-bold py-2.5 px-3 rounded-xl">
                {userErrorMessage}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">نام و نام خانوادگی به فارسی</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: دکتر سارا احمدی"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">نشانی ایمیل (نام کاربری ورود)</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="name@university.ir"
                  dir="ltr"
                  className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition text-left font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">رمز عبور اولیه سامانه</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition text-left font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">تعیین نقش اختصاصی کاربر علمی</label>
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setNewUserRole('reviewer')}
                    className={`py-2 px-1 border rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center ${
                      newUserRole === 'reviewer'
                        ? 'border-amber-600 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    داور علمی
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserRole('admin')}
                    className={`py-2 px-1 border rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center ${
                      newUserRole === 'admin'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    مدیر سامانه
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserRole('author')}
                    className={`py-2 px-1 border rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center ${
                      newUserRole === 'author'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    نویسنده
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-0"
                >
                  <Plus className="w-4 h-4" />
                  ایجاد و ثبت حساب جدید
                </button>
              </div>
            </form>
          </div>

          {/* List of Users - Right Side */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden h-fit">
            <div className="p-5 border-b border-indigo-50/50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm sm:text-base">
                  <Users className="w-5 h-5 text-indigo-600" />
                  مدیریت کاربران و مراجع سامانه علمی نشریه
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">نمایش کامل کادر تحریریه، داوران علمی و نویسندگان ثبت نام شده</p>
              </div>
              <button 
                onClick={fetchUsers} 
                className="bg-white hover:bg-slate-50 text-slate-705 border border-slate-200 px-3 py-1 text-[10px] font-bold rounded-lg transition shadow-xs cursor-pointer"
              >
                بروزرسانی فهرست
              </button>
            </div>

            {loadingUsers ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-xs font-bold animate-pulse">در حال بارگذاری اطلاعات کاربران...</p>
              </div>
            ) : usersList.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-xs font-bold">هیچ کاربری یافت نشد.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100 text-[11px]">
                      <th className="py-3 px-4 text-slate-450 text-center">شناسه</th>
                      <th className="py-3 px-4">نام و نام خانوادگی</th>
                      <th className="py-3 px-4">نشانی پست الکترونیک</th>
                      <th className="py-3 px-4">نقش جاری کاربر</th>
                      <th className="py-3 px-4 text-left">عملیات اداری</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-55/10 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-center">#{usr.id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{usr.name}</td>
                        <td className="py-3.5 px-4 text-slate-550 font-mono text-left" dir="ltr">{usr.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block ${
                            usr.role === 'admin'
                              ? 'bg-rose-50 border border-rose-100 text-rose-700'
                              : usr.role === 'reviewer'
                              ? 'bg-amber-50 border border-amber-100 text-amber-700'
                              : 'bg-blue-50 border border-blue-100 text-blue-700'
                          }`}>
                            {usr.role === 'admin' ? 'مدیر سامانه' : usr.role === 'reviewer' ? 'داور علمی' : 'نویسنده مقاله'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.name)}
                            disabled={usr.id === 1}
                            className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition ${
                              usr.id === 1
                                ? 'bg-slate-50 border-slate-150 text-slate-300 cursor-not-allowed'
                                : 'bg-rose-50 border-rose-150 text-rose-650 hover:bg-rose-100 cursor-pointer'
                            }`}
                          >
                            حذف کاربر
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <PublishedIssuesManager 
          token={token} 
          approvedArticles={articles.filter(a => a.status === 'Approved')} 
        />
      )}
    </div>
  );
}
