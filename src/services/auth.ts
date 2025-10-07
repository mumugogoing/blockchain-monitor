// 用户角色定义
export type UserRole = 'super' | 'stx' | 'stark';

export interface User {
  username: string;
  role: UserRole;
}

// 简单的用户数据库（生产环境应该使用真实的数据库）
const users: Record<string, { password: string; role: UserRole }> = {
  super: { password: 'super123', role: 'super' },
  stx: { password: 'stx123', role: 'stx' },
  stark: { password: 'stark123', role: 'stark' },
};

// 认证服务
class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {
    // 从 localStorage 恢复用户会话
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  login(username: string, password: string): boolean {
    const user = users[username];
    if (user && user.password === password) {
      this.currentUser = { username, role: user.role };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  hasAccess(requiredRole: UserRole | UserRole[]): boolean {
    if (!this.currentUser) return false;
    
    // super 用户可以访问所有页面
    if (this.currentUser.role === 'super') return true;
    
    // 检查用户角色是否匹配
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(this.currentUser.role);
    }
    return this.currentUser.role === requiredRole;
  }
}

export default AuthService.getInstance();
