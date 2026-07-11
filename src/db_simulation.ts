import fs from 'fs';
import path from 'path';
import { User, Article, ArticleAssignment, ArticleStatus, AssignmentStatus, PublishedIssue, PublishedArticle } from './types';

const DATA_FILE = path.join(process.cwd(), 'data.json');

interface DatabaseStore {
  users: User[];
  articles: Article[];
  assignments: ArticleAssignment[];
  issues?: PublishedIssue[];
  systemConfig: {
    nextUserId: number;
    nextArticleId: number;
    nextAssignmentId: number;
    nextIssueId?: number;
  };
}

const DEFAULT_ISSUES: PublishedIssue[] = [];

const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: 'مدیر سیستم',
    email: 'admin@journal.ir',
    role: 'admin',
    password: 'admin' // Ensure the admin has a default password for first login
  }
];

class DbSimulation {
  private data!: DatabaseStore;

  constructor() {
    this.load();
  }

  private load() {
    if (!fs.existsSync(DATA_FILE)) {
      this.data = {
        users: [...DEFAULT_USERS],
        articles: [],
        assignments: [],
        issues: [...DEFAULT_ISSUES],
        systemConfig: {
          nextUserId: 2,
          nextArticleId: 1,
          nextAssignmentId: 1,
          nextIssueId: 1
        }
      };
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure standard fields are populated
        if (!this.data.users) this.data.users = [...DEFAULT_USERS];
        if (!this.data.articles) this.data.articles = [];
        if (!this.data.assignments) this.data.assignments = [];
        if (!this.data.issues) this.data.issues = [...DEFAULT_ISSUES];
        if (!this.data.systemConfig) {
          this.data.systemConfig = {
            nextUserId: this.data.users.length + 1,
            nextArticleId: this.data.articles.length + 1,
            nextAssignmentId: this.data.assignments.length + 1,
            nextIssueId: 1
          };
        }
        if (!this.data.systemConfig.nextIssueId) {
          this.data.systemConfig.nextIssueId = Math.max(1, ...this.data.issues.map((i: any) => (i.id || 0) + 1));
        }
      } catch (e) {
        console.error('Failed to parse database file, rebuilding default', e);
        this.data = {
          users: [...DEFAULT_USERS],
          articles: [],
          assignments: [],
          issues: [...DEFAULT_ISSUES],
          systemConfig: { nextUserId: 2, nextArticleId: 1, nextAssignmentId: 1, nextIssueId: 1 }
        };
        this.save();
      }
    }
  }

  private save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  // --- User operations ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: number): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public registerUser(user: Omit<User, 'id'>): User {
    const existing = this.findUserByEmail(user.email);
    if (existing) {
      throw new Error('Email already registered');
    }
    const newUser: User = {
      ...user,
      id: this.data.systemConfig.nextUserId++
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public deleteUser(id: number): boolean {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Article operations ---
  public getArticles(userId?: number, reviewerId?: number): (Article & { author_name?: string })[] {
    let list = [...this.data.articles];

    // Filter by author user_id
    if (userId !== undefined) {
      list = list.filter(a => a.user_id === userId);
    }

    // Filter by assigned reviewer_id
    if (reviewerId !== undefined) {
      const assignedArticleIds = this.data.assignments
        .filter(asg => asg.reviewer_id === reviewerId)
        .map(asg => asg.article_id);
      list = list.filter(a => assignedArticleIds.includes(a.id));
    }

    // Hydrate author name
    return list.map(art => {
      const author = this.findUserById(art.user_id);
      return {
        ...art,
        author_name: author ? author.name : 'Unknown Author'
      };
    });
  }

  public getArticleById(id: number): (Article & { author_name?: string }) | undefined {
    const art = this.data.articles.find(a => a.id === id);
    if (!art) return undefined;
    const author = this.findUserById(art.user_id);
    return {
      ...art,
      author_name: author ? author.name : 'Unknown Author'
    };
  }

  public createArticle(articleData: Omit<Article, 'id' | 'status' | 'created_at' | 'updated_at'>): Article {
    const newArticle: Article = {
      ...articleData,
      id: this.data.systemConfig.nextArticleId++,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.articles.push(newArticle);
    this.save();
    return newArticle;
  }

  public updateArticleStatus(id: number, status: ArticleStatus): boolean {
    const art = this.data.articles.find(a => a.id === id);
    if (!art) return false;
    art.status = status;
    art.updated_at = new Date().toISOString();
    this.save();
    return true;
  }

  public updateArticleFile(id: number, filePath: string, status: ArticleStatus): boolean {
    const art = this.data.articles.find(a => a.id === id);
    if (!art) return false;
    art.file_path = filePath;
    art.status = status;
    art.updated_at = new Date().toISOString();
    this.save();
    return true;
  }

  // --- Assignments ---
  public getAssignments(articleId?: number, reviewerId?: number): ArticleAssignment[] {
    let list = [...this.data.assignments];
    if (articleId !== undefined) {
      list = list.filter(asg => asg.article_id === articleId);
    }
    if (reviewerId !== undefined) {
      list = list.filter(asg => asg.reviewer_id === reviewerId);
    }
    return list.map(asg => {
      const rev = this.findUserById(asg.reviewer_id);
      return {
        ...asg,
        reviewer_name: rev ? rev.name : 'Unknown Reviewer'
      };
    });
  }

  public assignReviewer(articleId: number, reviewerId: number): ArticleAssignment {
    // Check if duplicate
    const existing = this.data.assignments.find(
      asg => asg.article_id === articleId && asg.reviewer_id === reviewerId
    );
    if (existing) {
      return existing;
    }

    const newAsg: ArticleAssignment = {
      id: this.data.systemConfig.nextAssignmentId++,
      article_id: articleId,
      reviewer_id: reviewerId,
      review_comment: null,
      status: 'Pending',
      assigned_at: new Date().toISOString()
    };
    
    this.data.assignments.push(newAsg);
    
    // Auto update article status to Under Review if it is Pending
    const art = this.data.articles.find(a => a.id === articleId);
    if (art && art.status === 'Pending') {
      art.status = 'Under Review';
      art.updated_at = new Date().toISOString();
    }
    
    this.save();
    return newAsg;
  }

  public submitReview(assignmentId: number, status: AssignmentStatus, comment: string): boolean {
    const asg = this.data.assignments.find(a => a.id === assignmentId);
    if (!asg) return false;

    asg.status = status;
    asg.review_comment = comment;
    asg.reviewed_at = new Date().toISOString();

    // Map reviewer's decision back to custom workflow
    // Let's check status. If reviewer requests revision -> Set paper to Needs Revision.
    // If reviewer rejects -> Let admin make final call or set it.
    // In our system, the reviewers submit status. The Administrator reviews this and makes the permanent final decision.
    // However, let's keep the user updated.
    const art = this.data.articles.find(a => a.id === asg.article_id);
    if (art) {
      art.updated_at = new Date().toISOString();
      // If reviewer requests a revision, let's auto change article status to 'Needs Revision'
      // so Author can check immediately. This matches "Can view reviewer notes if status is Needs Revision and re-upload"
      if (status === 'Request Revision') {
        art.status = 'Needs Revision';
      }
    }

    this.save();
    return true;
  }

  public resetAssignments(articleId: number) {
    this.data.assignments = this.data.assignments.filter(asg => asg.article_id !== articleId);
    this.save();
  }

  // --- Published Issues operations ---
  public getIssues(): PublishedIssue[] {
    return this.data.issues || [];
  }

  public setIssues(newIssues: PublishedIssue[]) {
    this.data.issues = newIssues;
    this.save();
  }

  public createIssue(issueData: Omit<PublishedIssue, 'id'>): PublishedIssue {
    if (!this.data.issues) this.data.issues = [];
    if (!this.data.systemConfig.nextIssueId) this.data.systemConfig.nextIssueId = 104;
    
    const newIssue: PublishedIssue = {
      ...issueData,
      id: this.data.systemConfig.nextIssueId++
    };
    
    this.data.issues.push(newIssue);
    this.save();
    return newIssue;
  }

  public updateIssue(id: number, updatedData: Partial<PublishedIssue>): PublishedIssue | null {
    if (!this.data.issues) this.data.issues = [];
    const idx = this.data.issues.findIndex(iss => iss.id === id);
    if (idx === -1) return null;

    this.data.issues[idx] = {
      ...this.data.issues[idx],
      ...updatedData
    };
    this.save();
    return this.data.issues[idx];
  }

  public deleteIssue(id: number): boolean {
    if (!this.data.issues) return false;
    const len = this.data.issues.length;
    this.data.issues = this.data.issues.filter(iss => iss.id !== id);
    if (this.data.issues.length < len) {
      this.save();
      return true;
    }
    return false;
  }
}

export const dbSimulation = new DbSimulation();
