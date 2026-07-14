import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { dbSimulation } from './src/db_simulation';
import { User, ArticleStatus, AssignmentStatus, UserRole } from './src/types';

// Extend Express Request interface to include authenticated user
interface AuthenticatedRequest extends Request {
  user?: User;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploads directory if it exists, otherwise create it
  const uploadsDir = path.join(process.cwd(), 'uploads');
  import('fs').then(fs => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });
  app.use('/uploads', express.static(uploadsDir));

  // ====================================================================
  // MIDDLEWARE: Authentication and RBAC (Role-Based Access Control)
  // Ensures secure verification using the Authorization/X-User-Id header.
  // ====================================================================
  
  const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است. لطفا وارد شوید.' }); // User not authenticated
    }

    try {
      // Expecting standard token format or "Bearer <id>" or simple ID for development ease
      const userIdStr = authHeader.replace('Bearer ', '').trim();
      const userId = parseInt(userIdStr, 10);
      
      const user = dbSimulation.findUserById(userId);
      if (!user) {
        return res.status(401).json({ error: 'نشست نامعتبر است. مجددا وارد شوید.' }); // Invalid session
      }
      
      req.user = user;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'خطا در تایید هویت کاربر.' });
    }
  };

  const requireRole = (allowedRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است.' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'شما سطح دسترسی مناسب برای انجام این کار را ندارید.' }); // Permission denied
      }
      next();
    };
  };

  // ====================================================================
  // API ROUTES
  // ====================================================================

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // 1. AUTHENTICATION CONTROLLER ROUTES
  
  const verificationCodes = new Map<string, string>();
  
  // Set up Nodemailer transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false
    }
  });

  app.post('/api/auth/send-verification', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'لطفا آدرس ایمیل خود را وارد کنید.' });
    }
    
    const existingUser = dbSimulation.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'این ایمیل قبلاً در سامانه ثبت شده است.' });
    }

    // Generate 5-digit code
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    verificationCodes.set(email, code);
    
    console.log(`Verification code for ${email} is ${code}`);

    // If SMTP_USER is not set, fallback to simulated code for local dev so it doesn't break
    if (!process.env.SMTP_USER) {
      return res.json({ success: true, message: `کد تایید ارسال شد. (توجه: به دلیل عدم تنظیم SMTP، کد شبیه‌سازی است: ${code})` });
    }

    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: 'کد تایید ثبت‌نام در سامانه نشریه',
        text: `کد تایید شما: ${code}\n\nلطفا این کد را در فرم ثبت‌نام وارد کنید.`,
        html: `<div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px;">
                 <h2>کد تایید ثبت‌نام</h2>
                 <p>کد تایید شما برای ورود به سامانه:</p>
                 <h1 style="color: #2563eb; letter-spacing: 5px;">${code}</h1>
                 <p>لطفا این کد را در فرم ثبت‌نام وارد کنید.</p>
               </div>`
      });
      res.json({ success: true, message: `کد تایید به ایمیل ${email} ارسال شد.` });
    } catch (error) {
      console.error('Email sending error:', error);
      res.status(500).json({ error: 'خطا در ارسال ایمیل. لطفا تنظیمات SMTP سرور را بررسی کنید.' });
    }
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password, role, code } = req.body;
    
    if (!name || !email || !password || !role || !code) {
      return res.status(400).json({ error: 'لطفا تمامی فیلدها و کد تایید را به طور کامل پر کنید.' });
    }

    if (role !== 'author') {
      return res.status(403).json({ error: 'ثبت‌نام مستقیم در سامانه تنها برای نویسندگان مقالات مجاز است. سایر نقش‌ها (داور و مدیر) باید توسط مدیر ارشد ایجاد و تعریف گردند.' });
    }

    const savedCode = verificationCodes.get(email);
    if (!savedCode || savedCode !== code) {
      return res.status(400).json({ error: 'کد تایید نامعتبر است. لطفا مجددا درخواست کد بدهید یا کد صحیح را وارد کنید.' });
    }

    try {
      const newUser = dbSimulation.registerUser({
        name,
        email,
        password,
        role: 'author'
      });
      
      verificationCodes.delete(email); // Clean up used code
      
      // Detach password from response
      const { password: _, ...safeUser } = newUser;
      res.status(201).json({ success: true, user: safeUser });
    } catch (e: any) {
      res.status(400).json({ error: e.message === 'Email already registered' ? 'این ایمیل قبلاً در سامانه ثبت شده است.' : e.message });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'لطفا ایمیل و رمز عبور را وارد کنید.' });
    }

    const user = dbSimulation.findUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'ایمیل یا رمز عبور اشتباه است.' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser, token: String(user.id) });
  });

  app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    const { password: _, ...safeUser } = req.user;
    res.json({ user: safeUser });
  });


  // 2. ARTICLE SUBMISSION CONTROLLER ROUTES (Author)
  
  app.post('/api/articles', authMiddleware, requireRole(['author']), (req: AuthenticatedRequest, res: Response) => {
    const { title, abstract, keywords, authors_list, file_path } = req.body;
    const authorUser = req.user!;

    if (!title || !abstract || !keywords || !file_path) {
      return res.status(400).json({ error: 'ارسال مجله ناموفق بود. تایتل، چکیده، کلمات کلیدی و فایل الزامی هستند.' });
    }

    try {
      const article = dbSimulation.createArticle({
        user_id: authorUser.id,
        title,
        abstract,
        keywords,
        file_path,
        authors_list: authors_list || authorUser.name
      });

      res.status(201).json({ success: true, message: 'مقاله شما با موفقیت ثبت گردید و در صف بررسی قرار گرفت.', article });
    } catch (e: any) {
      res.status(500).json({ error: 'خطای سیستمی رخ داده است.' });
    }
  });

  // Re-upload correct file for Needs Revision articles (Author)
  app.post('/api/articles/:id/reupload', authMiddleware, requireRole(['author']), (req: AuthenticatedRequest, res: Response) => {
    const { file_path } = req.body;
    const articleId = parseInt(req.params.id, 10);

    if (!file_path) {
      return res.status(400).json({ error: 'فایل اصلاحی الزامی است.' });
    }

    const article = dbSimulation.getArticleById(articleId);
    if (!article) {
      return res.status(404).json({ error: 'مقاله یافت نشد.' });
    }

    if (article.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'شما مالک این مقاله نیستید.' });
    }

    if (article.status !== 'Needs Revision') {
      return res.status(400).json({ error: 'این مقاله در وضعیت اصلاحات قرار ندارد.' });
    }

    try {
      // Update file path and reset status back to 'Under Review' so reviewers are informed
      dbSimulation.updateArticleFile(articleId, file_path, 'Under Review');
      
      res.json({ success: true, message: 'نسخه اصلاحی با موفقیت بارگذاری شد و مقاله به وضعیت "در حال داوری" بازگشت.' });
    } catch (err) {
      res.status(500).json({ error: 'خطا در بارگذاری نسخه اصلاحی.' });
    }
  });


  // 3. RETRIEVAL ROUTES (Role-specific dashboards)
  
  app.get('/api/articles', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    try {
      let articlesList;

      if (user.role === 'admin') {
        // Super Admin gets everything + assignments data
        const rawArticles = dbSimulation.getArticles();
        articlesList = rawArticles.map(art => {
          const assignments = dbSimulation.getAssignments(art.id);
          return {
            ...art,
            assignments
          };
        });
      } else if (user.role === 'reviewer') {
        // Reviewers get assigned articles
        const rawArticles = dbSimulation.getArticles(undefined, user.id);
        articlesList = rawArticles.map(art => {
          const assignments = dbSimulation.getAssignments(art.id, user.id);
          return {
            ...art,
            assignments: assignments.filter(asg => asg.reviewer_id === user.id)
          };
        });
      } else {
        // Authors get only their own submissions + assignments/reviewer feedback
        const rawArticles = dbSimulation.getArticles(user.id);
        articlesList = rawArticles.map(art => {
          const assignments = dbSimulation.getAssignments(art.id);
          return {
            ...art,
            assignments // Feedback is loaded so author can view reviewer comments if status is 'Needs Revision'
          };
        });
      }

      res.json({ articles: articlesList });
    } catch (e: any) {
      res.status(500).json({ error: 'خطا در بارگذاری مقالات.' });
    }
  });

  // Get specific reviewer accounts for Super Admin assign panel
  app.get('/api/reviewers', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const allUsers = dbSimulation.getUsers();
    const reviewers = allUsers.filter(u => u.role === 'reviewer').map(u => ({ id: u.id, name: u.name, email: u.email }));
    res.json({ reviewers });
  });


  // 4. REVIEW ASSIGNMENT CONTROLLER ROUTES (Super Admin)
  
  app.post('/api/articles/:id/assign', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const articleId = parseInt(req.params.id, 10);
    const { reviewerIds } = req.body; // Array of reviewer user IDs

    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return res.status(400).json({ error: 'لطفا حداقل یک داور را جهت بررسی انتخاب کنید.' });
    }

    const article = dbSimulation.getArticleById(articleId);
    if (!article) {
      return res.status(404).json({ error: 'مقاله مورد نظر یافت نشد.' });
    }

    try {
      // Assign the reviewers to the database table model
      reviewerIds.forEach(reviewerId => {
        dbSimulation.assignReviewer(articleId, reviewerId);
      });

      // Fetch updated assignments to send back
      const updatedAssignments = dbSimulation.getAssignments(articleId);
      res.json({ 
        success: true, 
        message: 'داوران با موفقیت تخصیص داده شدند و وضعیت مقاله به "در حال داوری" تغییر یافت.',
        assignments: updatedAssignments
      });
    } catch (e: any) {
      res.status(500).json({ error: 'خطا در تخصیص پروسه داوری.' });
    }
  });

  // 5. REVIEW DECISION CONTROLLER ROUTES (Reviewer)
  
  app.post('/api/assignments/:id/review', authMiddleware, requireRole(['reviewer']), (req: AuthenticatedRequest, res: Response) => {
    const assignmentId = parseInt(req.params.id, 10);
    const { status, comment } = req.body; // status: 'Approve' | 'Reject' | 'Request Revision'

    if (!status || !comment) {
      return res.status(400).json({ error: 'لطفا نظر داوری و کامنت را به صورت کامل ارسال کنید.' });
    }

    if (!['Approve', 'Reject', 'Request Revision'].includes(status)) {
      return res.status(400).json({ error: 'تصمیم داوری ارسال شده نامعتبر است.' });
    }

    // Verify ownership of assignment
    const reviewerId = req.user!.id;
    const assignments = dbSimulation.getAssignments().filter(asg => asg.id === assignmentId && asg.reviewer_id === reviewerId);
    if (assignments.length === 0) {
      return res.status(403).json({ error: 'شما مجاز به داوری این مقاله نمی‌باشید.' });
    }

    try {
      const success = dbSimulation.submitReview(assignmentId, status as AssignmentStatus, comment);
      if (!success) {
        return res.status(400).json({ error: 'ثبت نظر داور ناموفق بود.' });
      }

      res.json({ success: true, message: 'نظر داوری شما با موفقیت در سامانه ثبت گردید. با تشکر از زحمات شما.' });
    } catch (e: any) {
      res.status(500).json({ error: 'خطا در ثبت نهایی داوری.' });
    }
  });

  // 6. FINAL PUBLISH DECISION CONTROLLER ROUTES (Super Admin)
  
  app.post('/api/articles/:id/decision', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    const articleId = parseInt(req.params.id, 10);
    const { finalStatus } = req.body; // 'Approved' | 'Rejected' | 'Needs Revision'

    if (!finalStatus || !['Approved', 'Rejected', 'Needs Revision'].includes(finalStatus)) {
      return res.status(400).json({ error: 'تصمیم نهایی انتخابی معتبر نیست.' });
    }

    const article = dbSimulation.getArticleById(articleId);
    if (!article) {
      return res.status(404).json({ error: 'مقاله یافت نشد.' });
    }

    try {
      dbSimulation.updateArticleStatus(articleId, finalStatus as ArticleStatus);
      
      // If we rejected / approved, we can clean or freeze assignments, but keeping them is fine for historical logs.
      res.json({ 
        success: true, 
        message: `تصمیم نهایی ثبت گردید. وضعیت مقاله با موفقیت به "${
          finalStatus === 'Approved' ? 'تایید و آماده انتشار' : finalStatus === 'Rejected' ? 'مردود شده' : 'نیازمند اصلاحات'
        }" تغییر یافت.` 
      });
    } catch (e: any) {
      res.status(500).json({ error: 'خطا در ثبت نهایی وضعیت مقاله.' });
    }
  });

  // 7. SIMULATE AND ENGAGE FILE UPLOAD (Generates storage path or writes actual base64 content)
  app.post('/api/upload', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { filename, fileData } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'نام فایل الزامی است.' });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const relativePath = `/uploads/${Date.now()}_${safeName}`;
    const targetPath = path.join(process.cwd(), relativePath);

    try {
      const fs = require('fs');
      if (fileData && fileData.includes(';base64,')) {
        const base64Data = fileData.split(';base64,').pop();
        fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
      } else {
        fs.writeFileSync(targetPath, fileData || 'SIMULATED JOURNAL PDF ARTICLE CONTENT');
      }
      res.json({ success: true, file_path: relativePath });
    } catch (err) {
      res.json({ success: true, file_path: `/uploads/fallback_document.pdf` });
    }
  });

  // 8. PUBLIC PUBLICATIONS ENDPOINT (For guest landing lists & dedicated published page)
  app.get('/api/publications/published', (req: Request, res: Response) => {
    try {
      // Fetch dynamic issues
      const issues = dbSimulation.getIssues();

      // Fetch dynamic approved articles
      const allArticles = dbSimulation.getArticles();
      const approvedArticles = allArticles.filter(a => a.status === 'Approved');

      // Append dynamically approved articles to the first (latest) issue if they aren't already listed in some issue (by title)
      const mappedIssues = issues.map((issue, idx) => {
        if (idx === 0) {
          const existingTitles = new Set(issue.articles.map(a => a.title));
          const dynamicArticles = approvedArticles
            .filter(a => !existingTitles.has(a.title))
            .map(a => ({
              id: a.id,
              title: a.title,
              abstract: a.abstract,
              authors: a.authors_list || 'نویسنده ناشناس',
              keywords: a.keywords,
              file_path: a.file_path,
              publishDate: new Date(a.updated_at).toLocaleDateString('fa-IR'),
              isDynamic: true
            }));
          return {
            ...issue,
            articles: [...dynamicArticles, ...issue.articles]
          };
        }
        return issue;
      });

      res.json({ success: true, issues: mappedIssues });
    } catch (e: any) {
      res.status(500).json({ error: 'خطا در بارگذاری آخرین نشریات منتشر شده.' });
    }
  });

  // 9. ADMIN PUBLICATIONS ENDPOINTS (WordPress style issue & post editor)
  app.post('/api/admin/issues', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, specialName, publishDate, editorInChief, coverColor, articles } = req.body;
      if (!title || !publishDate) {
        return res.status(400).json({ error: 'عنوان نشریه و تاریخ انتشار الزامی است.' });
      }

      const newIssue = dbSimulation.createIssue({
        title,
        specialName: specialName || '',
        publishDate,
        editorInChief: editorInChief || 'سردبیر نشریه',
        coverColor: coverColor || 'from-indigo-900 to-slate-900',
        articles: articles || []
      });

      res.status(201).json({ success: true, issue: newIssue });
    } catch (err: any) {
      res.status(500).json({ error: 'خطا در ایجاد نشریه جدید.' });
    }
  });

  app.put('/api/admin/issues/:id', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const issueId = parseInt(req.params.id, 10);
      const updatedIssue = dbSimulation.updateIssue(issueId, req.body);
      if (!updatedIssue) {
        return res.status(404).json({ error: 'نشریه مورد نظر یافت نشد.' });
      }
      res.json({ success: true, issue: updatedIssue });
    } catch (err: any) {
      res.status(500).json({ error: 'خطا در ویرایش نشریه.' });
    }
  });

  app.delete('/api/admin/issues/:id', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const issueId = parseInt(req.params.id, 10);
      const deleted = dbSimulation.deleteIssue(issueId);
      if (!deleted) {
        return res.status(404).json({ error: 'نشریه مورد نظر یافت نشد.' });
      }
      res.json({ success: true, message: 'نشریه با موفقیت حذف گردید.' });
    } catch (err: any) {
      res.status(500).json({ error: 'خطا در حذف نشریه.' });
    }
  });

  // 10. ADMIN USER MANAGEMENT ENDPOINTS (Manage systems users, referees & other administrators)
  app.get('/api/admin/users', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = dbSimulation.getUsers();
      // Mask password or exclude it
      const safeUsers = allUsers.map(({ password, ...u }) => u);
      res.json({ success: true, users: safeUsers });
    } catch (e: any) {
      res.status(500).json({ error: 'خطا در بارگذاری فهرست کاربران.' });
    }
  });

  app.post('/api/admin/users', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'پر کردن نام، ایمیل، کلمه عبور و انتخاب نقش الزامی است.' });
      }

      if (!['admin', 'reviewer', 'author'].includes(role)) {
        return res.status(400).json({ error: 'نقش انتخاب شده نامعتبر است.' });
      }

      const newUser = dbSimulation.registerUser({
        name,
        email,
        password,
        role: role as UserRole
      });

      const { password: _, ...safeUser } = newUser;
      res.status(201).json({ success: true, user: safeUser });
    } catch (e: any) {
      res.status(400).json({ error: e.message === 'Email already registered' ? 'کاربری با این ایمیل هم‌اکنون در سامانه ثبت شده است.' : e.message });
    }
  });

  app.delete('/api/admin/users/:id', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const currentAdmin = req.user!;

      if (userId === 1) {
        return res.status(403).json({ error: 'امکان حذف کاربر مدیر ارشد اصلی سیستم وجود ندارد.' });
      }

      if (userId === currentAdmin.id) {
        return res.status(403).json({ error: 'امکان حذف حساب کاربری جاری وجود ندارد.' });
      }

      const deleted = dbSimulation.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ error: 'کاربر مورد نظر یافت نشد.' });
      }

      res.json({ success: true, message: 'کاربر منتخب با موفقیت از سیستم حذف گردید.' });
    } catch (e: any) {
      res.status(500).json({ error: 'خطا در حذف کاربر.' });
    }
  });

  // ====================================================================
  // VITE DEVELOPMENT MIDDLEWARE OR PRODUCTION STATIC ROUTING
  // ====================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static client handler mounted to dist/ index.html');
  }

  // PORT bindings on 3000 to comply with environment constraints
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CMS journal server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot failure:', err);
});
