import React from 'react';
import { Award, ShieldCheck, Bookmark, FileSpreadsheet, Users, HelpCircle, GraduationCap } from 'lucide-react';

export default function AboutUs() {
  const indexes = [
    { name: 'پایگاه استنادی علوم جهان اسلام (ISC)', rank: 'رتبه الف (A)', year: '۱۴۰۴' },
    { name: 'پایگاه اطلاعات علمی جهاد دانشگاهی (SID)', rank: 'نمایه‌شده کامل', year: 'از ۱۳۹۵' },
    { name: 'پایگاه سیویلیکا (Civilica)', rank: 'انتشار کامل مقالات', year: 'از ۱۳۹۳' },
    { name: 'مگ ایران (Magiran)', rank: 'نمایه‌شده', year: 'از ۱۳۹۱' }
  ];

  const boardMembers = [
    { name: 'دکتر محمدحسن عبدالهی', role: 'مدیر مسئول و عضو هیئت تحریریه' },
    { name: 'دکتر امین میرزاپور', role: 'عضو هیئت تحریریه' },
    { name: 'دکتر سید کامران یگانگی', role: 'عضو هیئت تحریریه' },
    { name: 'دکتر لیلا نظری', role: 'عضو هیئت تحریریه' }
  ];

  return (
    <div id="about-us-page" className="space-y-8 animate-fade-in RTL" style={{ direction: 'rtl' }}>
      
      {/* Hero Badge */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-850 text-white rounded-3xl p-8 md:p-12 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10" />
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-bold">
            <GraduationCap className="w-4 h-4" />
            درباره نشریه
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            نشریه پژوهشهای کاربردی در صنایع
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            مجله پژوهشهای کاربردی در صنایع به انتشار مقالات علمی و پژوهشی در زمینههای مختلف صنعت و فناوری میپردازد و هدف آن ارتقاء دانش و ارائه راهکارهای نوآورانه برای چالشهای صنعتی است. این مجله به دنبال پلزدن بین پژوهشهای نظری و کاربردهای عملی در صنایع مختلف است.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core details & aims */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              زمینه فعالیت و اهداف کلی نشریه
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              مجله پژوهشهای کاربردی در صنایع متعهد به انتشار سریع و داوری منصفانه مقالات است. کلیه پژوهشگران می‌توانند پژوهش‌های اصیل، مقالات مروری و دستاوردهای علمی خود را ارسال کنند. داوری مقالات به صورت کاملاً بی‌نام (Double Blind Peer Review) انجام می‌گردد تا عدالت پژوهشی حفظ شود.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed font-bold mt-2">
              سال شروع انتشار: ۱۴۰۳
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">فرآیند داوری شفاف</h4>
                <p className="text-xs text-slate-500">ارسال بازخوردهای جامع داوران در کمتر از ۴ هفته کاری به نویسندگان مقالات.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">دسترسی آزاد (Open Access)</h4>
                <p className="text-xs text-slate-500">کلیه مقالات پذیرفته شده بلافاصله پس از آماده‌سازی نهایی به صورت رایگان قابل دانلود هستند.</p>
              </div>
            </div>
          </div>

          {/* Editorial Board List */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-blue-600" />
              اعضای هیئت تحریریه و کادر علمی نشریه
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boardMembers.map((member, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-xs transition">
                  <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                    {member.name.substring(4, 5)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs">{member.name}</h4>
                    <p className="text-[10px] text-blue-600 font-bold">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Indexing systems and stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-amber-500" />
              نمایه‌سازها و رتبه‌بندی‌های رسمی
            </h3>
            
            <div className="space-y-3">
              {indexes.map((ind, idx) => (
                <div key={idx} className="p-3 bg-amber-50/25 border border-amber-100/60 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <div className="font-extrabold text-slate-800">{ind.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">آغاز تعامل: {ind.year}</div>
                  </div>
                  <span className="bg-white border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    {ind.rank}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100/60 rounded-2xl p-6 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-blue-600" />
              سیاست حذف سرقت علمی (Plagiarism)
            </h4>
            <p className="text-slate-600 leading-relaxed font-semibold">
              ما کلیه فایل‌های متنی مقالات را در بدو ورود با سامانه‌های مشابه‌یااب همتا بررسی می‌کنیم. هرگونه مشابهت بالای ۲۰٪ موجب رد خودکار تقاضا می‌گردد.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
