import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, Globe, ShieldAlert } from 'lucide-react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    affiliation: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setLoading(true);
    // Simulate real database insertion delay
    setTimeout(() => {
      setIsSubmitted(true);
      setLoading(false);
      setFormData({ name: '', email: '', affiliation: '', subject: '', message: '' });
    }, 850);
  };

  return (
    <div id="contact-us-page" className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in RTL" style={{ direction: 'rtl' }}>
      
      {/* Contact sidebar cards info */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-5">
          <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            اطلاعات دبیرخانه نشریه
          </h3>
          
          <div className="space-y-4 text-xs font-semibold">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-slate-400 font-bold">نشانی دبیرخانه:</div>
                <div className="text-slate-800 leading-relaxed font-bold">
                  تهران، بزرگراه شهید همت، خیابان دهکده المپیک، پژوهشکده مرکزی علوم پایه نشریات دانشگاه کار
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-slate-400">تلفن‌های تماس:</div>
                <div className="text-slate-800 font-mono" dir="ltr">
                  +98 (21) 4473 - 8000
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-slate-400">پشتیبانی الکترونیک:</div>
                <div className="text-slate-800 font-mono" dir="ltr">
                  info@journal.fm.kar.ac.ir
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-slate-400">وب‌سایت رسمی:</div>
                <div className="text-slate-800 font-mono" dir="ltr">
                  https://fm.kar.ac.ir
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 text-xs space-y-3">
          <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            ساعت اداری پاسخگویی تلفنی
          </h4>
          <p className="text-slate-650 leading-relaxed font-semibold">
            شنبه تا چهارشنبه از ساعت ۸:۰۰ صبح الی ۱۵:۰۰ بعد از ظهر پشتیبانان تلفنی پاسخگوی مشکلات شما در فرآیند ارسال فایل یا مکاتبه سردبیری خواهند بود.
          </p>
        </div>
      </div>

      {/* Main Interactive Contact Message form */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">ارسال پیام مستقیم به ادیتور ارشد</h3>
            <p className="text-xs text-slate-450 mt-1">مشکلات، انتقادات و یا هرگونه سوال در مورد تعهدات مقالات را از اینجا ارسال نمایید.</p>
          </div>

          {isSubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-150 rounded-xl space-y-3 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-emerald-800 text-sm">پیام شما با موفقیت به دبیرخانه ارسال شد</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
                یک شماره رهگیری فرضی برای درخواست شما ثبت شد. پاسخ مکتوب کارشناسان حداکثر ظرف مدت ۲۴ ساعت کاری به آدرس پست الکترونیکی شما ارسال می‌گردد.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline"
              >
                ارسال پیام جدید دیگر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label id="lbl-contact-name" className="text-xs font-bold text-slate-600 block">نام و نام خانوادگی <span className="text-rose-500">*</span></label>
                  <input
                    id="input-contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="مثال: نام شما"
                  />
                </div>
                <div className="space-y-1">
                  <label id="lbl-contact-email" className="text-xs font-bold text-slate-600 block">پست الکترونیکی <span className="text-rose-500">*</span></label>
                  <input
                    id="input-contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="example@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label id="lbl-contact-affil" className="text-xs font-bold text-slate-600 block">مرکز دانشگاهی / سازمانی</label>
                  <input
                    id="input-contact-affil"
                    type="text"
                    value={formData.affiliation}
                    onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="مثال: دانشگاه صنعتی شریف"
                  />
                </div>
                <div className="space-y-1">
                  <label id="lbl-contact-sub" className="text-xs font-bold text-slate-600 block">موضوع پیام</label>
                  <input
                    id="input-contact-sub"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="مثال: استعلام وضعیت بازبینی نهایی"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label id="lbl-contact-msg" className="text-xs font-bold text-slate-600 block">متن پیام <span className="text-rose-500">*</span></label>
                <textarea
                  id="textarea-contact-msg"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  placeholder="متن سوال خود را با جزئیات به همراه شماره مقاله (در صورت وجود) بنویسید..."
                />
              </div>

              <button
                id="btn-contact-submit"
                type="submit"
                disabled={loading}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                ارسال پیام مکتوب به دبیرخانه
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
