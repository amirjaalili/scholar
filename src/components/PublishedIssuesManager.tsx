import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Trash2, Edit3, CheckCircle, AlertCircle, 
  FileText, ArrowDown, ChevronDown, ChevronUp, RefreshCw, X, Save, Sparkles, Send, MoveUp, MoveDown
} from 'lucide-react';
import { Article, PublishedIssue, PublishedArticle } from '../types';

interface PublishedIssuesManagerProps {
  token: string;
  approvedArticles: Article[];
}

export default function PublishedIssuesManager({ token, approvedArticles }: PublishedIssuesManagerProps) {
  const [issues, setIssues] = useState<PublishedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Accordion & selection states
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);

  // Forms states
  const [editingIssue, setEditingIssue] = useState<PublishedIssue | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: '',
    specialName: '',
    publishDate: '',
    editorInChief: 'دکتر علیرضا محمدی',
    coverColor: 'from-blue-900 to-indigo-950'
  });

  // Article Editor Modal/Form values
  const [editingArticle, setEditingArticle] = useState<{ issueId: number; article: PublishedArticle | null } | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleForm, setArticleForm] = useState({
    id: 0,
    title: '',
    abstract: '',
    authors: '',
    keywords: '',
    file_path: '/uploads/sample_paper_1.pdf',
    publishDate: '',
    isDynamic: false
  });

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const triggerDirectUpload = async (file: File) => {
    setUploadingFile(true);
    setUploadProgress('در حال بارگذاری فایل...');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result as string;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              filename: file.name,
              fileData: fileData
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setArticleForm(prev => ({ ...prev, file_path: data.file_path }));
            setUploadProgress(`بارگذاری فایل موفقیت‌آمیز بود: ${file.name}`);
          } else {
            setUploadProgress('خطا در بارگذاری فایل در سرور مجله.');
          }
        } catch (err) {
          setUploadProgress('خطای شبکه در مسیر ارتباطی.');
        } finally {
          setUploadingFile(false);
        }
      };
      reader.onerror = () => {
        setUploadProgress('خطا در خواندن فایل محلی.');
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadProgress('خطای پردازش فایل.');
      setUploadingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerDirectUpload(file);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/publications/published');
      const data = await res.json();
      if (res.ok && data.success) {
        setIssues(data.issues || []);
        if (data.issues && data.issues.length > 0 && expandedIssueId === null) {
          setExpandedIssueId(data.issues[0].id);
        }
      }
    } catch (err) {
      setErrorMessage('خطا در ارزیابی و دریافت آرشیو نشریات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.title || !issueForm.publishDate) {
      setErrorMessage('عنوان نشریه و تاریخ انتشار الزامی است.');
      return;
    }

    try {
      const res = await fetch('/api/admin/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(issueForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('شماره جدید نشریه با موفقیت ایجاد گردید.');
        setIssueForm({
          title: '',
          specialName: '',
          publishDate: '',
          editorInChief: 'دکتر علیرضا محمدی',
          coverColor: 'from-blue-900 to-indigo-950'
        });
        setShowIssueForm(false);
        fetchIssues();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در ثبت شماره نشریه.');
      }
    } catch (err) {
      setErrorMessage('ارتباط با سرور برقرار نشد.');
    }
  };

  const handleUpdateIssueMetadata = async (issue: PublishedIssue) => {
    try {
      const res = await fetch(`/api/admin/issues/${issue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: issue.title,
          specialName: issue.specialName,
          publishDate: issue.publishDate,
          editorInChief: issue.editorInChief,
          coverColor: issue.coverColor,
          articles: issue.articles
        })
      });
      if (res.ok) {
        setSuccessMessage('تغییرات با موفقیت ذخیره شد.');
        setEditingIssue(null);
        fetchIssues();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      setErrorMessage('خطای ارتباط با شبکه.');
    }
  };

  const handleDeleteIssue = async (id: number) => {
    if (!confirm('آیا از حذف کامل این شماره نشریه و کلیه مقالات زیرمجموعه آن اطمینان دارید؟ این کار غیرقابل بازگشت است.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/issues/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMessage('شماره نشریه انتخابی با موفقیت حذف گردید.');
        if (expandedIssueId === id) setExpandedIssueId(null);
        fetchIssues();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      setErrorMessage('ناموفق در ارتباط شبکه.');
    }
  };

  // Article operation handlers (client-mediated to be saved via PUT)
  const saveArticlesListToIssue = async (issueId: number, updatedArticles: PublishedArticle[]) => {
    const parentIssue = issues.find(i => i.id === issueId);
    if (!parentIssue) return;

    try {
      const res = await fetch(`/api/admin/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...parentIssue,
          articles: updatedArticles
        })
      });
      if (res.ok) {
        setSuccessMessage('لیست مقالات نشریه با موفقیت به‌روزرسانی شد.');
        fetchIssues();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setErrorMessage('خطا در ذخیره تغییرات مقالات.');
    }
  };

  const handleAddOrEditArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    const { issueId, article } = editingArticle;
    const parentIssue = issues.find(i => i.id === issueId);
    if (!parentIssue) return;

    let updatedArticlesList = [...parentIssue.articles];

    if (article) {
      // Edit mode
      updatedArticlesList = updatedArticlesList.map(a => 
        a.id === article.id ? { ...a, ...articleForm } : a
      );
    } else {
      // Create mode
      const newId = articleForm.id || Math.floor(Math.random() * 1000000);
      updatedArticlesList.push({
        ...articleForm,
        id: newId,
        publishDate: articleForm.publishDate || new Date().toLocaleDateString('fa-IR')
      });
    }

    saveArticlesListToIssue(issueId, updatedArticlesList);
    setShowArticleForm(false);
    setEditingArticle(null);
  };

  const handleDeleteArticle = (issueId: number, articleId: number) => {
    const parentIssue = issues.find(i => i.id === issueId);
    if (!parentIssue) return;

    if (!confirm('آیا مایل به حذف این مقاله/نوشته از این شماره نشریه هستید؟')) {
      return;
    }

    const updatedArticlesList = parentIssue.articles.filter(a => a.id !== articleId);
    saveArticlesListToIssue(issueId, updatedArticlesList);
  };

  // Import directly from the approved papers collection
  const handleImportApprovedArticle = (issueId: number, approvedPaper: Article) => {
    const parentIssue = issues.find(i => i.id === issueId);
    if (!parentIssue) return;

    // Check if duplicate
    const isDuplicate = parentIssue.articles.some(a => a.title === approvedPaper.title);
    if (isDuplicate) {
      alert('این مقاله قبلاً به فهرست این شماره اضافه شده است.');
      return;
    }

    const newArticle: PublishedArticle = {
      id: approvedPaper.id,
      title: approvedPaper.title,
      abstract: approvedPaper.abstract,
      authors: approvedPaper.authors_list || approvedPaper.author_name || 'نویسنده ناشناس',
      keywords: approvedPaper.keywords,
      file_path: approvedPaper.file_path,
      publishDate: new Date().toLocaleDateString('fa-IR'),
      isDynamic: true
    };

    const updatedArticlesList = [...parentIssue.articles, newArticle];
    saveArticlesListToIssue(issueId, updatedArticlesList);
  };

  const openNewArticleForm = (issueId: number) => {
    setEditingArticle({ issueId, article: null });
    setUploadProgress(null);
    setArticleForm({
      id: 0,
      title: '',
      abstract: '',
      authors: '',
      keywords: '',
      file_path: '',
      publishDate: new Date().toLocaleDateString('fa-IR'),
      isDynamic: true
    });
    setShowArticleForm(true);
  };

  const openEditArticleForm = (issueId: number, art: PublishedArticle) => {
    setEditingArticle({ issueId, article: art });
    setUploadProgress(null);
    setArticleForm({
      id: art.id,
      title: art.title,
      abstract: art.abstract,
      authors: art.authors,
      keywords: art.keywords,
      file_path: art.file_path,
      publishDate: art.publishDate,
      isDynamic: art.isDynamic
    });
    setShowArticleForm(true);
  };

  const coverColorOptions = [
    { value: 'from-blue-900 to-indigo-950', label: 'سرمه‌ای تیره علمی' },
    { value: 'from-emerald-800 to-slate-900', label: 'سبز کله‌غازی تخصصی' },
    { value: 'from-amber-800 to-slate-950', label: 'کهربایی مجلل' },
    { value: 'from-slate-800 to-slate-950', label: 'دغالی متین' },
    { value: 'from-rose-900 to-slate-900', label: 'قرمز یاقوتی دانشگاهی' }
  ];

  if (loading && issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
        <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
        <p className="text-xs font-bold font-sans">در حال لود دیتابیس نشریات و آرشیو منتشر شده...</p>
      </div>
    );
  }

  return (
    <div id="published-issues-manager" className="space-y-6 text-right RTL" style={{ direction: 'rtl' }}>
      
      {/* Informational Header */}
      <div className="bg-gradient-to-l from-slate-850 to-slate-900 border border-slate-200/5 bg-slate-950 text-white p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-white text-base md:text-lg flex items-center gap-2">
            <BookOpen className="w-5.5 h-5.5 text-blue-400" />
            سیستم مدیریت شماره‌ها و نوشته‌های منتشر شده (چاپ نهایی)
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            در این بخش می‌توانید سازماندهی شماره‌های نشریه، تعریف مقالات، و ارجاع سریع مقالات پذیرش‌شده به شماره‌های فعال را مدیریت کنید.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingIssue(null);
            setShowIssueForm(!showIssueForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap scroll-mx-6 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          افزودن شماره جدید (ایجاد نشریه)
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="mr-auto font-mono text-xs">✕</button>
        </div>
      )}

      {/* New / Edit Issue Form */}
      {showIssueForm && (
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs transition animate-fade-in">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-blue-600" />
              فرم ایجاد شماره جدید برای مجله علمی
            </h4>
            <button 
              onClick={() => setShowIssueForm(false)} 
              className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <form onSubmit={handleCreateIssue} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs font-semibold">
            <div className="space-y-1.5">
              <label className="text-slate-600 block">عنوان و شماره مجله</label>
              <input
                type="text"
                value={issueForm.title}
                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                placeholder="مثال: دوره ۱۲، شماره ۴ (پیاپی ۴۸)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-600 block">نام ویژه یا تخصص نشریه (عنوان فرعی)</label>
              <input
                type="text"
                value={issueForm.specialName}
                onChange={(e) => setIssueForm({ ...issueForm, specialName: e.target.value })}
                placeholder="مثال: ویژه‌نامه سیستم‌های هوشمند و اینترنت اشیا"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-600 block">تاریخ انتشار (فصلی / ماهانه)</label>
              <input
                type="text"
                value={issueForm.publishDate}
                onChange={(e) => setIssueForm({ ...issueForm, publishDate: e.target.value })}
                placeholder="مثال: بهار ۱۴۰۵"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-600 block">سردبیر و مدیر علمی شماره مجله</label>
              <input
                type="text"
                value={issueForm.editorInChief}
                onChange={(e) => setIssueForm({ ...issueForm, editorInChief: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-600 block">رنگ و تم گرافیکی جلد نشریه</label>
              <select
                value={issueForm.coverColor}
                onChange={(e) => setIssueForm({ ...issueForm, coverColor: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              >
                {coverColorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 pt-2 flex justify-end gap-2 text-xs font-black">
              <button
                type="button"
                onClick={() => setShowIssueForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                انصراف و بستن
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                ایجاد و انتشار شماره
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main split grid: Right = Issues list, Left = Issue Articles and WordPress Post Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: LIST OF ISSUES */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-150 p-4 shadow-xs h-fit space-y-3">
          <h4 className="font-extrabold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>شماره‌های تعریف شده نشریه ({issues.length})</span>
            <span className="text-[10px] text-slate-400">آرشیو وردپرس</span>
          </h4>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {issues.map(iss => {
              const isSelected = expandedIssueId === iss.id;
              const isEditing = editingIssue?.id === iss.id;
              
              return (
                <div 
                  key={iss.id}
                  onClick={() => !isEditing && setExpandedIssueId(iss.id)}
                  className={`p-4 rounded-xl border transition text-xs font-semibold cursor-pointer select-none relative ${
                    isSelected 
                      ? 'border-blue-350 bg-blue-50/5/10 bg-blue-50/20 shadow-xs' 
                      : 'border-slate-100 hover:border-slate-350 hover:bg-slate-50/50'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="text-[10px] text-blue-600 font-bold">ویرایش سریع مجله:</div>
                      <input
                        type="text"
                        value={editingIssue.title}
                        onChange={(e) => setEditingIssue({ ...editingIssue, title: e.target.value })}
                        className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs"
                        placeholder="عنوان"
                      />
                      <input
                        type="text"
                        value={editingIssue.specialName}
                        onChange={(e) => setEditingIssue({ ...editingIssue, specialName: e.target.value })}
                        className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs"
                        placeholder="عنوان فرعی"
                      />
                      <input
                        type="text"
                        value={editingIssue.publishDate}
                        onChange={(e) => setEditingIssue({ ...editingIssue, publishDate: e.target.value })}
                        className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs"
                        placeholder="تاریخ پیوند"
                      />
                      <div className="flex justify-end gap-1 text-[11px] font-black pt-1">
                        <button 
                          onClick={() => setEditingIssue(null)} 
                          className="px-2.5 py-1.5 bg-slate-150 hover:bg-slate-200 rounded-lg cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button 
                          onClick={() => handleUpdateIssueMetadata(editingIssue)} 
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                        >
                          بروزرسانی شماره
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-10.5 rounded bg-gradient-to-br ${iss.coverColor} text-white flex flex-col items-center justify-between p-1 shrink-0`}>
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-xs">{iss.title}</h5>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{iss.specialName}</span>
                          </div>
                        </div>

                        <span className="text-[10px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded font-black">
                          {iss.publishDate}
                        </span>
                      </div>

                      <div className="mt-3 flex justify-between items-center pt-2.5 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>تعداد مقالات منتشر شده: <strong className="text-blue-600 font-bold">{iss.articles.length} مقاله</strong></span>
                        
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingIssue({ ...iss })}
                            className="p-1 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                            title="ویرایش سریع مشخصات"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteIssue(iss.id)}
                            className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded transition cursor-pointer"
                            title="حذف کامل این شماره نشریه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* LEFT COLUMN: ACTIVE ISSUE ARTICLES (The WordPress style post list) */}
        <div className="lg:col-span-7 space-y-4">
          {expandedIssueId ? (() => {
            const currentIssue = issues.find(i => i.id === expandedIssueId);
            if (!currentIssue) return null;

            return (
              <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <span className="text-[10px] bg-blue-50 border border-blue-150 text-blue-750 font-bold px-2.5 py-1 rounded-full">
                      مدیریت مقالات شماره: {currentIssue.title}
                    </span>
                    <h4 className="font-extrabold text-slate-850 text-sm mt-2">{currentIssue.specialName}</h4>
                  </div>

                  <button
                    onClick={() => openNewArticleForm(currentIssue.id)}
                    className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن نوشته/مقاله جدید
                  </button>
                </div>

                {/* سامانه انتشار مستقل صفر تا صد */}
                <div className="bg-gradient-to-l from-slate-50 to-blue-50/20 border border-slate-150 rounded-xl p-4 text-right font-semibold text-xs text-slate-700 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-800 block text-xs">میزکار انتشار دستی و مستقیم مقالات نشریه</span>
                    <span className="text-[10px] text-slate-500 block leading-relaxed">در این بخش، شما به صورت کاملا مجزا از روند اصلی ارسال‌ها و داوری‌ها عمل می‌کنید. با کلیک بر روی دکمه فوق نسبت به ثبت عنوان، چکیده و بارگذاری مستقیم فایل پی‌دی‌اف نهایی (PDF) اقدام ورزید تا مقاله با شناسه‌ی دیجیتال اختصاصی در آرشیو نشریه چاپ شود.</span>
                  </div>
                </div>

                {/* Articles inside Issue (WordPress Posts style list representation) */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">مقالات نهایی شده در این شماره ({currentIssue.articles.length}):</span>
                  
                  {currentIssue.articles.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs flex flex-col items-center justify-center gap-2">
                      <FileText className="w-10 h-10 stroke-1 text-slate-300" />
                      <p className="font-bold">هیچ مقاله یا نوشته‌ای هنوز به این نشریه افزوده نشده است.</p>
                      <p className="text-[10px] text-slate-400">از دکمه بالا برای نوشتن دستی مقاله، یا جعبه زیر آن برای درج مقالات پذیرفته شده سیستم استفاده کنید.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th className="py-2.5 px-3">ردیف</th>
                            <th className="py-2.5 px-3">مشخصات نوشته / مقاله</th>
                            <th className="py-2.5 px-3">نویسندگان</th>
                            <th className="py-2.5 px-3">تاریخ چاپ</th>
                            <th className="py-2.5 px-3 text-left">عملیات اداری</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentIssue.articles.map((art, index) => (
                            <tr key={art.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 font-mono text-slate-400">{(index + 1).toLocaleString('fa-IR')}</td>
                              <td className="py-3 px-3">
                                <div className="font-extrabold text-slate-800 line-clamp-1 max-w-xs">{art.title}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">DOI: 10.30495/kar.{art.id}</div>
                              </td>
                              <td className="py-3 px-3 text-slate-500 font-bold">{art.authors}</td>
                              <td className="py-3 px-3 font-mono text-slate-405">{art.publishDate}</td>
                              <td className="py-3 px-3 text-left">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => openEditArticleForm(currentIssue.id, art)}
                                    className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition font-bold"
                                  >
                                    ویرایش
                                  </button>
                                  <button
                                    onClick={() => handleDeleteArticle(currentIssue.id, art.id)}
                                    className="bg-slate-100 border border-slate-200 text-slate-650 px-2 py-1 rounded hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition font-bold"
                                  >
                                    حذف
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs h-full flex flex-col items-center justify-center">
              <BookOpen className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="font-bold">هیچ نشریه‌ای جهت سازماندهی انتخاب نشده است.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">یک شماره را از لیست سمت راست انتخاب کنید تا پرونده و نوشته‌های زیرمجموعه آن نمایان شود.</p>
            </div>
          )}
        </div>
      </div>

      {/* ARTICLE WRITING MODAL (WordPress post style popup) */}
      {showArticleForm && editingArticle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right RTL" style={{ direction: 'rtl' }}>
          <div className="bg-white border border-slate-150 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl space-y-4 transition animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-blue-600" />
                {editingArticle.article ? 'در حال ویرایش مقاله علمی چاپ‌شده' : 'ثبت نوشته / مقاله جدید در این شماره نشریه'}
              </h4>
              <button 
                onClick={() => setShowArticleForm(false)} 
                className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrEditArticle} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-600 block">عنوان مقاله علمی</label>
                <input
                  type="text"
                  required
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  placeholder="عنوان کامل مقاله پژوهشی را وارد کنید..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 block">مرور کلی / چکیده (Abstract)</label>
                <textarea
                  required
                  rows={4}
                  value={articleForm.abstract}
                  onChange={(e) => setArticleForm({ ...articleForm, abstract: e.target.value })}
                  placeholder="تببین مسئله، رویکرد حل، یافته‌های اصلی پژوهش..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-600 block">نویسنده(ها) و وابستگی سازمانی</label>
                  <input
                    type="text"
                    required
                    value={articleForm.authors}
                    onChange={(e) => setArticleForm({ ...articleForm, authors: e.target.value })}
                    placeholder="مثال: دکتر سارا احمدی، علی کریمی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 block">کلمات کلیدی (بخش‌بندی با کاما)</label>
                  <input
                    type="text"
                    required
                    value={articleForm.keywords}
                    onChange={(e) => setArticleForm({ ...articleForm, keywords: e.target.value })}
                    placeholder="مثال: هوش مصنوعی، یادگیری عمیق، پردازش سیگنال"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 block">تاریخ انتشار یا پیوند استناد</label>
                  <input
                    type="text"
                    value={articleForm.publishDate}
                    onChange={(e) => setArticleForm({ ...articleForm, publishDate: e.target.value })}
                    placeholder="مثال: ۱۴۰۵/۰۱/۲۰"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-slate-600 block">فایل اصلی سند مقاله علمی (PDF / Word / متن)</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        triggerDirectUpload(file);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      isDragging ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:border-slate-350 bg-slate-50'
                    }`}
                  >
                    <ArrowDown className={`w-8 h-8 ${uploadingFile ? 'animate-bounce text-blue-600' : 'text-slate-400'}`} />
                    <div className="text-slate-700">
                      <span className="font-extrabold text-blue-600 hover:underline">یک فایل انتخاب کنید</span> یا به این ناحیه بکشید (Drag & Drop)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">فرمت‌های مجاز: PDF, DOCX, DOC و متنی مجاز است. به عنوان بخشی از آرشیو وردپرسی نشریه بارگذاری می‌شود.</div>
                    
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden" 
                      id="file-uploader-inputs-dir"
                    />
                    <label htmlFor="file-uploader-inputs-dir" className="mt-2.5 bg-white border border-slate-200 hover:border-slate-300 px-4 py-1.5 rounded-lg shadow-2xs text-slate-705 text-[11px] font-bold cursor-pointer transition">
                      انتخاب و آپلود از کامپیوتر
                    </label>
                  </div>
                  
                  {uploadProgress && (
                    <div className="text-[11px] font-bold text-slate-700 bg-slate-100/80 p-2 rounded-xl flex items-center justify-between border border-slate-200">
                      <span>{uploadProgress}</span>
                      <button type="button" onClick={() => setUploadProgress(null)} className="text-rose-600 font-mono text-xs hover:bg-slate-200 p-1 rounded">✕</button>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-550 font-bold shrink-0">مسیر آدرس سند (می‌توانید مستقیم نیز ویرایش کنید):</span>
                    <input
                      type="text"
                      required
                      value={articleForm.file_path}
                      onChange={(e) => setArticleForm({ ...articleForm, file_path: e.target.value })}
                      placeholder="/uploads/sample_paper_1.pdf"
                      className="w-full bg-slate-50 border border-slate-200 font-mono text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-is-dynamic"
                  checked={articleForm.isDynamic}
                  onChange={(e) => setArticleForm({ ...articleForm, isDynamic: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 w-4.5 h-4.5"
                />
                <label htmlFor="chk-is-dynamic" className="text-slate-600 text-[11px] block select-none">نشان دادن به عنوان پذیرش زمان‌حقیقی تحریریه (Dynamic Article)</label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setShowArticleForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  بستن پنجره
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingArticle.article ? 'ذخیره اصلاحات نوشته علمی' : 'انتشار و ثبت قطعی مقاله'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
