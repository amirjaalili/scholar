import React, { useState } from 'react';
import { 
  Plus, FileText, CheckCircle2, Clock, AlertTriangle, 
  XCircle, Upload, Search, Users, Sparkles, BookOpen, AlertCircle, RefreshCw
} from 'lucide-react';
import { Article, ArticleStatus } from '../types';

interface AuthorDashboardProps {
  articles: (Article & { assignments?: any[] })[];
  token: string;
  onRefresh: () => void;
}

export default function AuthorDashboard({ articles, token, onRefresh }: AuthorDashboardProps) {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [step, setStep] = useState(1);
  
  // Submit Form States
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [authorsList, setAuthorsList] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Correction States for "Needs Revision" re-uploader
  const [activeCorrectionId, setActiveCorrectionId] = useState<number | null>(null);
  const [correctionFileName, setCorrectionFileName] = useState('');
  const [correctionFileBase64, setCorrectionFileBase64] = useState('');
  const [correcting, setCorrecting] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Local Simulated file upload or Drag and Drop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isCorrection = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('لطماً فقط فایل با پسوند PDF بارگذاری نمایید.');
      return;
    }

    if (isCorrection) {
      setCorrectionFileName(file.name);
    } else {
      setFileName(file.name);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isCorrection) {
        setCorrectionFileBase64(reader.result as string);
      } else {
        setFileBase64(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, isCorrection = false) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('لطماً فقط فرمت پی‌دی‌اف (PDF) بارگذاری نمایید.');
      return;
    }

    if (isCorrection) {
      setCorrectionFileName(file.name);
    } else {
      setFileName(file.name);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isCorrection) {
        setCorrectionFileBase64(reader.result as string);
      } else {
        setFileBase64(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle('');
    setAbstract('');
    setKeywords('');
    setAuthorsList('');
    setFileName('');
    setFileBase64('');
    setStep(1);
    setIsSubmitOpen(false);
    setErrorMessage(null);
  };

  // Submit Submission
  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      // 1. Send simulated file data
      const uploadResp = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filename: fileName, fileData: fileBase64 })
      });
      const uploadData = await uploadResp.json();

      if (!uploadResp.ok) throw new Error(uploadData.error || 'خطا در آپلود فایل');

      // 2. Submit whole form details
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          abstract,
          keywords,
          authors_list: authorsList,
          file_path: uploadData.file_path
        })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('مقاله علمی شما با موفقیت ارسال شد و کد رهگیری دریافت کرد.');
        resetForm();
        onRefresh();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'ارسال مقاله ناموفق بود.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در برقراری ارتباط با سامانه.');
    } finally {
      setUploading(false);
    }
  };

  // Submit Corrected File
  const handleReupload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionFileName) {
      alert('لطفاً فایل جدید PDF را انتخاب کنید.');
      return;
    }

    setCorrecting(true);
    setErrorMessage(null);

    try {
      // 1. Upload new file
      const uploadResp = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filename: correctionFileName, fileData: correctionFileBase64 })
      });
      const uploadData = await uploadResp.json();

      // 2. Commit reupload to change paper state
      const response = await fetch(`/api/articles/${activeCorrectionId}/reupload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ file_path: uploadData.file_path })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('فایل تصحیح‌شده با موفقیت ثبت و مجدداً جهت ارزیابی به داوران ارسال شد.');
        setActiveCorrectionId(null);
        setCorrectionFileName('');
        setCorrectionFileBase64('');
        onRefresh();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'بروز خطا در بارگذاری تصحیح.');
      }
    } catch (err) {
      setErrorMessage('خطای شبکه رخ داده است.');
    } finally {
      setCorrecting(false);
    }
  };

  // Helper status styling mapper
  const getStatusStyle = (status: ArticleStatus) => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-50 text-amber-700 border border-amber-200',
          dot: 'bg-amber-500',
          label: 'در انتظار داور'
        };
      case 'Under Review':
        return {
          bg: 'bg-blue-50 text-blue-700 border border-blue-200',
          dot: 'bg-blue-500',
          label: 'در حال داوری'
        };
      case 'Needs Revision':
        return {
          bg: 'bg-purple-50 text-purple-700 border border-purple-200',
          dot: 'bg-purple-500',
          label: 'نیازمند اصلاحات'
        };
      case 'Approved':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'پذیرفته شده'
        };
      case 'Rejected':
        return {
          bg: 'bg-rose-50 text-rose-700 border border-rose-200',
          dot: 'bg-rose-500',
          label: 'مردود علمی'
        };
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.includes(searchTerm) || 
    a.abstract.includes(searchTerm) ||
    a.keywords.includes(searchTerm)
  );

  return (
    <div id="author-dashboard" className="space-y-6">
      {/* Banner & Submission Trigger */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5.5 h-5.5 text-blue-500" />
            داشبورد اختصاصی پژوهشگران و نویسندگان
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            در این بخش می‌توانید مقالات علمی خود را ثبت، وضعیت داوری آن‌ها را رصد، و اصلاحات خواسته‌شده را فورا ارسال کنید.
          </p>
        </div>
        <button
          id="btn-new-article"
          onClick={() => setIsSubmitOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl shadow-xs transition hover:shadow cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          ارسال و ثبت مقاله جدید
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          {successMessage}
        </div>
      )}

      {/* Primary Panels - Article Submission Step Form (If open) */}
      {isSubmitOpen && (
        <div id="submit-article-wizard" className="bg-white rounded-2xl border border-blue-100 shadow-md overflow-hidden transition-all duration-350">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                فرم چندمرحله‌ای ارسال مقاله علمی جدید
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">لطفا اطلاعات مقاله را در ۳ مرحله با دقت پر کنید.</p>
            </div>
            <button 
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-3 py-1.5 hover:bg-slate-100 rounded-lg transition"
            >
              لغو و انصراف
            </button>
          </div>

          {/* Stepper Progress bar */}
          <div className="px-6 py-4 bg-blue-50/20 border-b border-slate-100/50 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                مرحله ۱: مشخصات کلی
              </span>
              <span className="text-slate-300">←</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                مرحله ۲: همکاران و نویسندگان
              </span>
              <span className="text-slate-300">←</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                مرحله ۳: فایل مقاله (PDF)
              </span>
            </div>
            <span className="text-xs font-bold text-blue-600">{step} از ۳</span>
          </div>

          <form onSubmit={handleSubmitArticle} className="p-6 space-y-4">
            {errorMessage && (
              <div className="bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold py-3 px-4 rounded-xl">
                {errorMessage}
              </div>
            )}

            {step === 1 && (
              /* Step 1: Broad properties */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">عنوان کامل مقاله *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: واکاوی ساختاری مدلهای رفتاری کاربران در بستر فناوری اطلاعات"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">کلمات کلیدی (جدا شده با کامای فارسی) *</label>
                    <input
                      type="text"
                      required
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="امکان‌سنجی، داوری علمی، مقاله پژوهشی"
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">چکیده علمی مقاله (حداقل ۵۰ واژه) *</label>
                  <textarea
                    required
                    rows={4}
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    placeholder="چکیده پژوهش خود، شامل مقدمه، اهداف، فرضیات و نتایج نهایی را در این کادر به صورت شفاف بنویسید..."
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              /* Step 2: Authors registry */
              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                  <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">ثبت همکاران و حق مالکیت معنوی</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      نام سایر نویسندگان مقاله را به ترتیب اولویت بنویسید. نویسنده مسئول به طور خودکار حساب جاری شما در نظر گرفته می‌شود.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">نام نویسندگان همکار (به همراه مرتبه علمی) *</label>
                  <input
                    type="text"
                    required
                    value={authorsList}
                    onChange={(e) => setAuthorsList(e.target.value)}
                    placeholder="مثال: دکتر احمدی (دانشیار دانشگاه تهران)، علی میرزایی (دانشجوی دکتری)"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">اطلاعات نویسندگان به شکل دقیق در نسخه چاپی مجله درج خواهد شد.</span>
                </div>
              </div>
            )}

            {step === 3 && (
              /* Step 3: PDF Attachment drag & drop */
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-600 block">بارگذاری فایل اصلی مقاله (فرمت الزامی: PDF) *</span>
                
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, false)}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                    fileName 
                      ? 'border-emerald-400 bg-emerald-50/20' 
                      : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <Upload className={`w-12 h-12 mb-3 ${fileName ? 'text-emerald-500' : 'text-slate-400'}`} />
                  
                  {fileName ? (
                    <div>
                      <p className="text-sm font-bold text-emerald-800">{fileName}</p>
                      <p className="text-xs text-slate-400 mt-1">فایل PDF آماده ارسال نهایی است.</p>
                      <button
                        type="button"
                        onClick={() => { setFileName(''); setFileBase64(''); }}
                        className="text-xs text-rose-500 hover:underline font-bold mt-3"
                      >
                        حذف و انتخاب فایل دیگر
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-slate-700">فایل PDF مقاله را بکشید و اینجا رها کنید</p>
                      <p className="text-xs text-slate-400 mt-1">یا بر روی کادر زیر کلیک نموده و فایل را از رایانه انتخاب کنید.</p>
                      
                      <label className="inline-block mt-4 px-4.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer">
                        انتخاب فایل
                        <input 
                          type="file" 
                          accept="application/pdf" 
                          onChange={(e) => handleFileChange(e, false)} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={step === 1 || uploading}
                onClick={() => setStep(step - 1)}
                className="px-4.5 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition cursor-pointer"
              >
                مرحله قبلی
              </button>
              
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                {step === 3 ? (uploading ? 'درحال ثبت و ارسال نهایی...' : 'تایید نهایی و ارسال مقاله') : 'مرحله بعدی'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Needs Revision Form - Appears inline on active article card when clicked */}
      {activeCorrectionId && (
        <div id="correction-uploader-box" className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-5.5 h-5.5 text-amber-600" />
                بارگذاری نسخه اصلاح‌شده مقاله (فایل بازنگری)
              </h3>
              <p className="text-xs text-amber-600 mt-1">
                خواهشمند است فایل تصحیح شده خود را با توجه به کامنت‌های داوران به فرمت پی‌دی‌اف ذخیره کرده و بارگذاری فرمایید.
              </p>
            </div>
            <button
              onClick={() => { setActiveCorrectionId(null); setCorrectionFileName(''); }}
              className="text-xs text-amber-800 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg font-bold"
            >
              بستن پنل تصحیح
            </button>
          </div>

          <div className="bg-white rounded-xl p-4 border border-amber-100 text-xs space-y-2">
            <div className="font-bold text-slate-705">نظرات و درخواست‌های اصلاحات هیئت تحریریه:</div>
            {(() => {
              const art = articles.find(a => a.id === activeCorrectionId);
              const comments = art?.assignments?.filter(asg => asg.review_comment);
              if (!comments || comments.length === 0) {
                return <p className="text-slate-400 italic">نظری برای این مقاله ثبت نشده است.</p>;
              }
              return (
                <ul className="space-y-2.5 list-disc list-inside">
                  {comments.map((asg: any) => (
                    <li key={asg.id} className="text-slate-650 leading-relaxed">
                      <span className="font-bold text-blue-700">{asg.reviewer_name || 'داور محترم'}: </span>
                      {asg.review_comment}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>

          <form onSubmit={handleReupload} className="space-y-4">
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, true)}
              className="border-2 border-dashed border-amber-300 rounded-2xl bg-white p-6 text-center flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="w-10 h-10 mb-2 text-amber-500" />
              {correctionFileName ? (
                <div>
                  <p className="text-sm font-bold text-amber-800">{correctionFileName}</p>
                  <span className="text-[11px] text-slate-400">فایل برای ارسال تصحیحات آماده است.</span>
                  <button
                    type="button"
                    onClick={() => { setCorrectionFileName(''); setCorrectionFileBase64(''); }}
                    className="text-xs text-rose-500 hover:underline font-bold block mt-2 mx-auto"
                  >
                    حذف فایل
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-700">فایل اصلاح‌شده PDF را اینجا رها کنید یا کلیک کنید</p>
                  <label className="inline-block mt-3 px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition cursor-pointer">
                    انتخاب فایل پی‌دی‌اف جدید
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={(e) => handleFileChange(e, true)} 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={correcting || !correctionFileName}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs text-sm transition cursor-pointer"
              >
                {correcting ? 'درحال ارسال فایل...' : 'ثبت تصحیحات و تغییر وضعیت به تحت بررسی'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Real-time Submissions table section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            فهرست مقالات ارسال شده و وضعیت‌های لحظه‌ای
          </h3>
          
          {/* Searching articles */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در عنوان یا چکیده..."
              className="w-full text-xs border border-slate-200.5 rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </div>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
            <p className="text-sm font-bold">هیچ مقاله‌ای یافت نگردید.</p>
            <p className="text-xs text-slate-400 mt-1">شما هنوز مقاله‌ای ثبت نکرده‌اید یا با شرایط جستجو سازگار نیست.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="author-articles-table" className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                  <th className="py-4 px-5">شناسه</th>
                  <th className="py-4 px-5">عنوان مقاله علمی</th>
                  <th className="py-4 px-5">کلمات کلیدی</th>
                  <th className="py-4 px-5">تاریخ ارسال</th>
                  <th className="py-4 px-5 text-center">وضعیت داوری</th>
                  <th className="py-4 px-5 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredArticles.map((article) => {
                  const statusInfo = getStatusStyle(article.status);
                  return (
                    <tr key={article.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-5 font-mono text-slate-400">#{article.id}</td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800 line-clamp-1 max-w-md">{article.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1">نویسندگان: {article.authors_list}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex gap-1 flex-wrap">
                          {article.keywords.split('،').map((kw, i) => (
                            <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                              {kw.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-500">
                        {new Date(article.created_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold ${statusInfo?.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo?.dot}`} />
                          {statusInfo?.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-left">
                        <div className="flex justify-end gap-2">
                          <a
                            href={article.file_path}
                            download
                            className="bg-slate-150 hover:bg-slate-200.5 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200.5 font-bold cursor-pointer transition"
                          >
                            دانلود مقاله (PDF)
                          </a>
                          
                          {article.status === 'Needs Revision' && (
                            <button
                              onClick={() => setActiveCorrectionId(article.id)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-xs hover:shadow transition cursor-pointer"
                            >
                              ارسال فایل‌های اصلاحات
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
