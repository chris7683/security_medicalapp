import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

type UserRole = 'admin' | 'doctor' | 'nurse' | 'patient';
interface UserDto { id: string; username: string; email: string; role: UserRole }
interface AuthResponse { user: UserDto; accessToken: string; refreshToken: string }

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // API base URL - supports both HTTP and HTTPS
  // Set API_BASE_URL in environment or use defaults
  private readonly apiBase = (() => {
    // Check for explicit API base URL (useful for production)
    if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
      return (window as any).API_BASE_URL;
    }
    
    // Auto-detect protocol from current page
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol; // 'http:' or 'https:'
      const hostname = window.location.hostname;
      
      // If on HTTPS, use HTTPS for API (development: port 4443, production: same host)
      if (protocol === 'https:') {
        const port = hostname === 'localhost' ? ':4443' : '';
        return `https://${hostname}${port}/api`;
      }
    }
    
    // Default: HTTP for development
    return 'http://localhost:4000/api';
  })();
  private readonly accessTokenKey = 'accessToken';
  private readonly refreshTokenKey = 'refreshToken';
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) this.currentUserSubject.next(JSON.parse(storedUser));
  }

  get accessToken(): string | null { return localStorage.getItem(this.accessTokenKey); }
  get refreshToken(): string | null { return localStorage.getItem(this.refreshTokenKey); }
  get isAuthenticated(): boolean { return !!this.accessToken; }
  get role(): UserRole | null { return this.currentUserSubject.value?.role ?? null; }

  signup(payload: { username: string; email: string; password: string; role: UserRole }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}/auth/signup`, payload).pipe(tap(res => this.persistAuth(res)));
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse | { requiresOTP: boolean; message: string; email: string }> {
    return this.http.post<AuthResponse | { requiresOTP: boolean; message: string; email: string }>(`${this.apiBase}/auth/login`, payload);
  }

  verifyLoginOTP(payload: { email: string; otp: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}/auth/verify-login-otp`, payload).pipe(tap(res => this.persistAuth(res)));
  }

  refresh(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.apiBase}/auth/refresh`, { refreshToken: this.refreshToken }).pipe(
      tap(res => localStorage.setItem(this.accessTokenKey, res.accessToken))
    );
  }

  logout(): Observable<{ message: string }> {
    const rt = this.refreshToken;
    this.clearAuth();
    return this.http.post<{ message: string }>(`${this.apiBase}/auth/logout`, { refreshToken: rt });
  }

  private persistAuth(res: AuthResponse) {
    localStorage.setItem(this.accessTokenKey, res.accessToken);
    localStorage.setItem(this.refreshTokenKey, res.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  private clearAuth() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}
