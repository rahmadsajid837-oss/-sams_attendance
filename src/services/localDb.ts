import { User, AcademicClass, AttendanceSession, AttendanceRecord, AppNotification } from '../types/sams';
import { SEED_USERS, SEED_CLASSES, SEED_ATTENDANCE, SEED_NOTIFICATIONS } from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'sams_hive_users',
  CLASSES: 'sams_hive_classes',
  SESSIONS: 'sams_hive_sessions',
  ATTENDANCE: 'sams_hive_attendance',
  NOTIFICATIONS: 'sams_hive_notifications',
  SETTINGS: 'sams_hive_settings',
  ACTIVE_USER: 'sams_active_user',
};

class LocalDatabaseManager {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  }

  // Initialize DB with seed data if fresh
  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, SEED_USERS);
    } else {
      // Ensure rahmadsajid837@gmail.com exists in existing installations
      const currentUsers = this.get<User[]>(STORAGE_KEYS.USERS, []);
      if (!currentUsers.some((u) => u.email.toLowerCase() === 'rahmadsajid837@gmail.com')) {
        currentUsers.unshift({
          uid: 'teacher-rahmad',
          fullName: 'Rahmad Sajid',
          email: 'rahmadsajid837@gmail.com',
          phoneNumber: '03001234567',
          role: 'teacher',
          institutionId: 'INST-MAIN',
          createdAt: '2026-09-01T08:00:00Z',
        });
        this.set(STORAGE_KEYS.USERS, currentUsers);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      this.set(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      this.set(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      const initialSessions: AttendanceSession[] = [
        {
          sessionId: 'cs301_20260915',
          classId: 'class-cs301',
          teacherId: 'teacher-001',
          sessionDate: '2026-09-15',
          sessionTime: '10:00',
          totalPresent: 4,
          totalAbsent: 1,
          createdAt: '2026-09-15T10:00:00Z',
        },
        {
          sessionId: 'cs301_20260917',
          classId: 'class-cs301',
          teacherId: 'teacher-001',
          sessionDate: '2026-09-17',
          sessionTime: '10:00',
          totalPresent: 4,
          totalAbsent: 1,
          createdAt: '2026-09-17T10:00:00Z',
        },
        {
          sessionId: 'cs301_20260920',
          classId: 'class-cs301',
          teacherId: 'teacher-001',
          sessionDate: '2026-09-20',
          sessionTime: '10:00',
          totalPresent: 5,
          totalAbsent: 0,
          createdAt: '2026-09-20T10:00:00Z',
        },
        {
          sessionId: 'cs301_20260922',
          classId: 'class-cs301',
          teacherId: 'teacher-001',
          sessionDate: '2026-09-22',
          sessionTime: '10:00',
          totalPresent: 4,
          totalAbsent: 1,
          createdAt: '2026-09-22T10:00:00Z',
        },
      ];
      this.set(STORAGE_KEYS.SESSIONS, initialSessions);
    }
  }

  public resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.init();
  }

  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, []);
  }

  public getUserByEmail(email: string): User | undefined {
    const users = this.getUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (found) return found;

    if (email.trim().toLowerCase() === 'rahmadsajid837@gmail.com') {
      const defaultUser: User = {
        uid: 'teacher-rahmad',
        fullName: 'Rahmad Sajid',
        email: 'rahmadsajid837@gmail.com',
        phoneNumber: '03001234567',
        role: 'teacher',
        institutionId: 'INST-MAIN',
        createdAt: '2026-09-01T08:00:00Z',
      };
      this.saveUser(defaultUser);
      return defaultUser;
    }
    return undefined;
  }

  public toggleUserRole(uid: string): User | null {
    const user = this.getUserById(uid);
    if (!user) return null;
    const nextRole = user.role === 'teacher' ? 'student' : 'teacher';
    const updated: User = { ...user, role: nextRole };
    this.saveUser(updated);
    if (this.getActiveUser()?.uid === uid) {
      this.setActiveUser(updated);
    }
    return updated;
  }

  public getUserById(uid: string): User | undefined {
    const users = this.getUsers();
    return users.find((u) => u.uid === uid);
  }

  public saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.uid === user.uid);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.set(STORAGE_KEYS.USERS, users);
  }

  public getActiveUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.ACTIVE_USER, null);
  }

  public setActiveUser(user: User | null): void {
    this.set(STORAGE_KEYS.ACTIVE_USER, user);
  }

  // -------------------------------------------------------------
  // CLASSES
  // -------------------------------------------------------------
  public getClasses(): AcademicClass[] {
    return this.get<AcademicClass[]>(STORAGE_KEYS.CLASSES, []);
  }

  public getTeacherClasses(teacherId: string): AcademicClass[] {
    return this.getClasses().filter((c) => c.teacherId === teacherId);
  }

  public saveClass(newClass: AcademicClass): void {
    const classes = this.getClasses();
    classes.unshift(newClass);
    this.set(STORAGE_KEYS.CLASSES, classes);
  }

  // -------------------------------------------------------------
  // SESSIONS & DUPLICATE PREVENTIONS
  // -------------------------------------------------------------
  public getSessions(): AttendanceSession[] {
    return this.get<AttendanceSession[]>(STORAGE_KEYS.SESSIONS, []);
  }

  public checkSessionExists(classId: string, sessionDate: string): boolean {
    const sessions = this.getSessions();
    return sessions.some(
      (s) => s.classId === classId && s.sessionDate === sessionDate
    );
  }

  public saveSession(session: AttendanceSession): void {
    const sessions = this.getSessions();
    sessions.unshift(session);
    this.set(STORAGE_KEYS.SESSIONS, sessions);
  }

  // -------------------------------------------------------------
  // ATTENDANCE & HIVE OFFLINE SYNC
  // -------------------------------------------------------------
  public getAttendance(): AttendanceRecord[] {
    return this.get<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  }

  public getPendingSyncCount(): number {
    return this.getAttendance().filter((a) => a.pendingSync).length;
  }

  public saveAttendanceBatch(records: AttendanceRecord[]): void {
    const all = this.getAttendance();
    for (const r of records) {
      const idx = all.findIndex((x) => x.attendanceId === r.attendanceId);
      if (idx >= 0) {
        all[idx] = r;
      } else {
        all.unshift(r);
      }
    }
    this.set(STORAGE_KEYS.ATTENDANCE, all);
  }

  public syncPendingRecords(): { syncedCount: number } {
    const all = this.getAttendance();
    let count = 0;
    const now = new Date().toISOString();

    for (let i = 0; i < all.length; i++) {
      if (all[i].pendingSync) {
        all[i] = {
          ...all[i],
          pendingSync: false,
          syncedAt: now,
        };
        count++;
      }
    }

    if (count > 0) {
      this.set(STORAGE_KEYS.ATTENDANCE, all);
    }
    return { syncedCount: count };
  }

  public getStudentAttendance(studentId: string, classId?: string): AttendanceRecord[] {
    let list = this.getAttendance().filter((a) => a.studentId === studentId);
    if (classId) {
      list = list.filter((a) => a.classId === classId);
    }
    return list.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  }

  public getClassAttendance(classId: string): AttendanceRecord[] {
    return this.getAttendance().filter((a) => a.classId === classId);
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  public getNotifications(userId: string): AppNotification[] {
    const all = this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return all
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public addNotification(notification: AppNotification): void {
    const all = this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    all.unshift(notification);
    this.set(STORAGE_KEYS.NOTIFICATIONS, all);
  }

  public markNotificationRead(notifId: string): void {
    const all = this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const idx = all.findIndex((n) => n.notificationId === notifId);
    if (idx >= 0) {
      all[idx].read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  }

  // -------------------------------------------------------------
  // SETTINGS (ONBOARDING)
  // -------------------------------------------------------------
  public hasCompletedOnboarding(): boolean {
    const settings = this.get<{ hasCompletedOnboarding?: boolean }>(STORAGE_KEYS.SETTINGS, {});
    return !!settings.hasCompletedOnboarding;
  }

  public setCompletedOnboarding(completed: boolean): void {
    const settings = this.get<{ hasCompletedOnboarding?: boolean }>(STORAGE_KEYS.SETTINGS, {});
    settings.hasCompletedOnboarding = completed;
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }
}

export const localDb = new LocalDatabaseManager();
localDb.init();
