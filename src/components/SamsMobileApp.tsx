import React, { useState, useEffect } from 'react';
import {
  School,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Users,
  BarChart3,
  Bell,
  User as UserIcon,
  LogOut,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  CloudUpload,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Layers,
} from 'lucide-react';
import { User, AcademicClass, AttendanceRecord, AppNotification } from '../types/sams';
import { localDb } from '../services/localDb';

interface SamsMobileAppProps {
  isOnline: boolean;
  onSyncTriggered?: () => void;
  pendingSyncCount: number;
}

type ScreenType =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'signup'
  | 'teacher_dashboard'
  | 'student_dashboard'
  | 'teacher_classes'
  | 'teacher_mark_attendance'
  | 'reports'
  | 'student_attendance'
  | 'notifications'
  | 'profile';

export const SamsMobileApp: React.FC<SamsMobileAppProps> = ({
  isOnline,
  onSyncTriggered,
  pendingSyncCount,
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<AcademicClass | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Auth Inputs
  const [loginEmail, setLoginEmail] = useState('rahmadsajid837@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // SignUp Inputs
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRole, setSignupRole] = useState<'teacher' | 'student'>('teacher');

  // Attendance Marking State (Map studentId -> 'present' | 'absent')
  const [markingSessionDate, setMarkingSessionDate] = useState('2026-09-24');
  const [markingStatuses, setMarkingStatuses] = useState<Record<string, 'present' | 'absent'>>({});
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  // New Class Form State
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');

  // Student Filter
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Onboarding Page
  const [onboardingIndex, setOnboardingIndex] = useState(0);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Initialize and check startup flow
  useEffect(() => {
    const timer = setTimeout(() => {
      const completedOnboarding = localDb.hasCompletedOnboarding();
      if (!completedOnboarding) {
        setCurrentScreen('onboarding');
        return;
      }

      const activeUser = localDb.getActiveUser();
      if (activeUser) {
        setCurrentUser(activeUser);
        refreshAppData(activeUser);
        setCurrentScreen(activeUser.role === 'teacher' ? 'teacher_dashboard' : 'student_dashboard');
      } else {
        setCurrentScreen('login');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const refreshAppData = (user: User) => {
    const allUsers = localDb.getUsers();
    const cls = localDb.getClasses();
    setClasses(cls);
    if (cls.length > 0 && !selectedClass) {
      setSelectedClass(cls[0]);
    }

    if (user.role === 'teacher') {
      const att = localDb.getAttendance();
      setAttendanceRecords(att);
    } else {
      const att = localDb.getStudentAttendance(user.uid);
      setAttendanceRecords(att);
      const notifs = localDb.getNotifications(user.uid);
      setNotifications(notifs);
    }
  };

  // Onboarding complete
  const handleCompleteOnboarding = () => {
    localDb.setCompletedOnboarding(true);
    setCurrentScreen('login');
  };

  // Login handler
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      const user = localDb.getUserByEmail(loginEmail);
      if (user) {
        localDb.setActiveUser(user);
        setCurrentUser(user);
        refreshAppData(user);
        showToast(`Welcome back, ${user.fullName}!`, 'success');
        setCurrentScreen(user.role === 'teacher' ? 'teacher_dashboard' : 'student_dashboard');
      } else {
        showToast('Invalid email or password. User not found.', 'error');
      }
    }, 600);
  };

  // Google Sign-In handler
  const handleGoogleSignIn = (targetRole: 'teacher' | 'student' = 'teacher', customEmail?: string) => {
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      const email = customEmail || (targetRole === 'teacher' ? 'rahmadsajid837@gmail.com' : 'sarah.c@student.edu');
      let user = localDb.getUserByEmail(email);
      if (!user) {
        user = {
          uid: 'teacher-rahmad',
          fullName: 'Rahmad Sajid',
          email: 'rahmadsajid837@gmail.com',
          phoneNumber: '03001234567',
          role: targetRole,
          institutionId: 'INST-MAIN',
          createdAt: new Date().toISOString(),
        };
        localDb.saveUser(user);
      } else if (user.role !== targetRole) {
        user.role = targetRole;
        localDb.saveUser(user);
      }
      localDb.setActiveUser(user);
      setCurrentUser(user);
      refreshAppData(user);
      showToast(`Signed in with Google as ${user.fullName} (${user.role})`, 'success');
      setCurrentScreen(user.role === 'teacher' ? 'teacher_dashboard' : 'student_dashboard');
    }, 600);
  };

  // Register handler (enforcing Section 5: min 8 password, 11 digit phone)
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword || !signupPhone) {
      showToast('All fields are required', 'error');
      return;
    }
    if (signupPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (!/^\d{11}$/.test(signupPhone.trim())) {
      showToast('Phone number must be exactly 11 digits', 'error');
      return;
    }

    const newUser: User = {
      uid: `usr-${Date.now()}`,
      fullName: signupName.trim(),
      email: signupEmail.trim().toLowerCase(),
      phoneNumber: signupPhone.trim(),
      role: signupRole,
      institutionId: 'INST-MAIN',
      createdAt: new Date().toISOString(),
    };

    localDb.saveUser(newUser);
    localDb.setActiveUser(newUser);
    setCurrentUser(newUser);
    refreshAppData(newUser);
    showToast('Registration successful!', 'success');
    setCurrentScreen(newUser.role === 'teacher' ? 'teacher_dashboard' : 'student_dashboard');
  };

  // Logout handler (preserving offline records per Section 47)
  const handleLogout = () => {
    localDb.setActiveUser(null);
    setCurrentUser(null);
    showToast('Signed out. Offline records safely preserved in Hive.', 'success');
    setCurrentScreen('login');
  };

  // Setup marking status when entering attendance marking screen
  const initMarkingForClass = (cls: AcademicClass) => {
    const allUsers = localDb.getUsers().filter((u) => u.role === 'student');
    const initialMap: Record<string, 'present' | 'absent'> = {};
    allUsers.forEach((u) => {
      initialMap[u.uid] = 'present';
    });
    setMarkingStatuses(initialMap);
  };

  // Submit Attendance (enforcing Section 12, 13, 14, 63)
  const handleSubmitAttendance = () => {
    if (!selectedClass || !currentUser) return;

    const allStudents = localDb.getUsers().filter((u) => u.role === 'student');
    if (allStudents.length === 0) {
      showToast('Student list is empty. Cannot record session.', 'error');
      return;
    }

    // DUPLICATE SESSION CHECK (SRS Section 13)
    const alreadyExists = localDb.checkSessionExists(selectedClass.classId, markingSessionDate);
    if (alreadyExists) {
      showToast('Attendance for this class and session has already been recorded.', 'error');
      return;
    }

    setIsSubmittingAttendance(true);

    setTimeout(() => {
      setIsSubmittingAttendance(false);
      const sessionId = `${selectedClass.classId}_${markingSessionDate.replace(/-/g, '')}`;

      const presentCount = Object.values(markingStatuses).filter((v) => v === 'present').length;
      const absentCount = Object.values(markingStatuses).filter((v) => v === 'absent').length;

      // 1. Save Session
      localDb.saveSession({
        sessionId,
        classId: selectedClass.classId,
        teacherId: currentUser.uid,
        sessionDate: markingSessionDate,
        sessionTime: '10:00',
        totalPresent: presentCount,
        totalAbsent: absentCount,
        createdAt: new Date().toISOString(),
      });

      // 2. Build Records (Offline-first: pendingSync is true if offline!)
      const records: AttendanceRecord[] = allStudents.map((s) => {
        const status = markingStatuses[s.uid] || 'absent';
        return {
          attendanceId: `${sessionId}_${s.uid}`,
          sessionId,
          classId: selectedClass.classId,
          studentId: s.uid,
          studentName: s.fullName,
          teacherId: currentUser.uid,
          status,
          sessionDate: markingSessionDate,
          pendingSync: !isOnline, // Flagged for Hive offline sync!
          syncedAt: isOnline ? new Date().toISOString() : undefined,
          createdAt: new Date().toISOString(),
        };
      });

      localDb.saveAttendanceBatch(records);

      // 3. Dispatch Notifications to Students
      records.forEach((r) => {
        const isAbsent = r.status === 'absent';
        localDb.addNotification({
          notificationId: `notif-${Date.now()}-${r.studentId}`,
          userId: r.studentId,
          title: isAbsent ? 'Attendance Alert' : 'Attendance Update',
          message: isAbsent
            ? `You were marked Absent in ${selectedClass.className} on ${markingSessionDate}.`
            : `${selectedClass.className} — ${markingSessionDate} — Present`,
          type: isAbsent ? 'absence_alert' : 'attendance_update',
          classId: selectedClass.classId,
          sessionId,
          read: false,
          createdAt: new Date().toISOString(),
        });
      });

      if (onSyncTriggered) onSyncTriggered();

      if (!isOnline) {
        showToast('Saved offline to Hive! Will auto-sync when online.', 'warning');
      } else {
        showToast('Attendance recorded and synced successfully!', 'success');
      }

      refreshAppData(currentUser);
      setCurrentScreen('teacher_dashboard');
    }, 600);
  };

  // Create new class handler
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !currentUser) return;

    const newCls: AcademicClass = {
      classId: `class-${Date.now()}`,
      className: newClassName.trim(),
      classCode: newClassCode.trim() || 'CS-GEN',
      description: newClassDesc.trim(),
      teacherId: currentUser.uid,
      institutionId: 'INST-MAIN',
      enrolledStudentIds: localDb
        .getUsers()
        .filter((u) => u.role === 'student')
        .map((u) => u.uid),
      createdAt: new Date().toISOString(),
    };

    localDb.saveClass(newCls);
    setNewClassName('');
    setNewClassCode('');
    setNewClassDesc('');
    setShowCreateClassModal(false);
    refreshAppData(currentUser);
    showToast(`Created class ${newCls.className}!`, 'success');
  };

  // Attendance stats calculator (SRS Section 20 & 64)
  const calculateStudentStats = (studentId: string, classId?: string) => {
    const list = localDb.getStudentAttendance(studentId, classId);
    const total = list.length;
    const attended = list.filter((r) => r.status === 'present').length;
    const absent = list.filter((r) => r.status === 'absent').length;
    const percentage = total > 0 ? (attended / total) * 100 : 0;
    const isBelowThreshold = total > 0 && percentage < 75.0;

    return { total, attended, absent, percentage, isBelowThreshold };
  };

  // ---------------------------------------------------------------------------
  // RENDER: SPLASH SCREEN
  // ---------------------------------------------------------------------------
  if (currentScreen === 'splash') {
    return (
      <div className="flex-1 bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6 animate-bounce">
          <School className="w-14 h-14 text-blue-900" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-wider">SAMS</h1>
        <p className="text-blue-200 text-xs mt-1.5 font-medium max-w-[240px]">
          Smart Attendance Management System
        </p>
        <div className="mt-12 flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[11px] text-blue-300">Initializing Firebase & Hive DB...</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: ONBOARDING SCREEN (SRS Section 4)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'onboarding') {
    const slides = [
      {
        title: 'Smart Academic Attendance',
        desc: 'Real-time role-based attendance management for teachers and students with automated 75% threshold alerts.',
        icon: School,
        color: 'text-blue-600 bg-blue-50',
      },
      {
        title: 'Offline-First Attendance',
        desc: 'Mark attendance anywhere, even without Wi-Fi. Records persist locally in Hive and auto-sync when online.',
        icon: WifiOff,
        color: 'text-amber-600 bg-amber-50',
      },
      {
        title: 'Instant Analytics & Alerts',
        desc: 'Students receive push updates for attendance & absence alerts. Flag students at risk of falling below 75%.',
        icon: BarChart3,
        color: 'text-emerald-600 bg-emerald-50',
      },
    ];

    const currentSlide = slides[onboardingIndex];
    const SlideIcon = currentSlide.icon;

    return (
      <div className="flex-1 bg-white flex flex-col justify-between p-6">
        <div className="flex justify-end pt-2">
          <button
            onClick={handleCompleteOnboarding}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg"
          >
            Skip
          </button>
        </div>

        <div className="flex flex-col items-center text-center px-4 my-auto">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 ${currentSlide.color}`}>
            <SlideIcon className="w-14 h-14" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {currentSlide.title}
          </h2>
          <p className="text-xs text-slate-600 mt-3 leading-relaxed max-w-[280px]">
            {currentSlide.desc}
          </p>
        </div>

        <div className="pb-6">
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  onboardingIndex === i ? 'w-8 bg-blue-900' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => {
              if (onboardingIndex < slides.length - 1) {
                setOnboardingIndex((prev) => prev + 1);
              } else {
                handleCompleteOnboarding();
              }
            }}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-950/20 text-sm flex items-center justify-center gap-2"
          >
            {onboardingIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: LOGIN SCREEN (SRS Section 5, 6, 7)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'login') {
    return (
      <div className="flex-1 bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 pt-2 mb-6">
            <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-white">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">SAMS Attendance</h2>
              <p className="text-[11px] text-slate-500">Sign in to your account</p>
            </div>
          </div>

          {/* Quick Role Fill Buttons */}
          <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-2xl mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" /> Test with Your Account
              </span>
              <span className="text-[9px] text-blue-700 font-mono">rahmadsajid837@gmail.com</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('rahmadsajid837@gmail.com');
                  setLoginPassword('password123');
                  // Direct login as Teacher
                  handleGoogleSignIn('teacher', 'rahmadsajid837@gmail.com');
                }}
                className="bg-white hover:bg-blue-100/50 border border-blue-200 p-2.5 rounded-xl text-left shadow-2xs transition-all cursor-pointer"
              >
                <div className="text-[11px] font-extrabold text-blue-900">👤 Teacher Mode</div>
                <div className="text-[9px] text-slate-500 truncate">Mark classes &amp; sessions</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('rahmadsajid837@gmail.com');
                  setLoginPassword('password123');
                  // Direct login as Student
                  handleGoogleSignIn('student', 'rahmadsajid837@gmail.com');
                }}
                className="bg-white hover:bg-emerald-100/50 border border-emerald-200 p-2.5 rounded-xl text-left shadow-2xs transition-all cursor-pointer"
              >
                <div className="text-[11px] font-extrabold text-emerald-800">🎓 Student Mode</div>
                <div className="text-[9px] text-slate-500 truncate">75% alert &amp; notifications</div>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl mb-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Other Institutional Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('alan.turing@university.edu');
                  setLoginPassword('password123');
                }}
                className="bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-left text-[10px] text-slate-600 truncate"
              >
                Prof. Turing
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('sarah.c@student.edu');
                  setLoginPassword('password123');
                }}
                className="bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-left text-[10px] text-slate-600 truncate"
              >
                Sarah Connor (85%)
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-blue-950/20 mt-2 flex items-center justify-center gap-2"
            >
              {isAuthLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Or Sign In With
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleGoogleSignIn('teacher')}
              className="w-full border border-slate-200 hover:bg-slate-50 py-2.5 px-3 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5"
            >
              <span className="text-red-500 font-extrabold text-sm">G</span>
              <span>Google (Teacher)</span>
            </button>
            <button
              type="button"
              onClick={() => handleGoogleSignIn('student')}
              className="w-full border border-slate-200 hover:bg-slate-50 py-2.5 px-3 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5"
            >
              <span className="text-red-500 font-extrabold text-sm">G</span>
              <span>Google (Student)</span>
            </button>
          </div>
        </div>

        <div className="pt-4 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              onClick={() => setCurrentScreen('signup')}
              className="font-bold text-blue-900 hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: SIGN UP SCREEN (SRS Section 5)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'signup') {
    return (
      <div className="flex-1 bg-white p-6 flex flex-col justify-between overflow-y-auto">
        <div>
          <button
            onClick={() => setCurrentScreen('login')}
            className="text-xs text-blue-900 font-bold mb-4 flex items-center gap-1"
          >
            ← Back to Login
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">Create SAMS Account</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Register as a Teacher or Student
          </p>

          <form onSubmit={handleRegister} className="space-y-3">
            {/* Role Segmented Button */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSignupRole('teacher')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    signupRole === 'teacher'
                      ? 'bg-blue-900 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Faculty / Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole('student')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    signupRole === 'student'
                      ? 'bg-blue-900 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Dr. Alan Turing"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="user@university.edu"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Phone Number (11 digits required)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="03001234567"
                  maxLength={11}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-blue-950/20 mt-4"
            >
              Complete Registration
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: TEACHER DASHBOARD (SRS Section 9 & 44)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'teacher_dashboard' && currentUser) {
    const teacherClasses = classes.filter((c) => c.teacherId === currentUser.uid);

    return (
      <div className="flex-1 bg-slate-50 flex flex-col justify-between">
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider bg-blue-100/70 px-2 py-0.5 rounded">
                Faculty Portal
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                {currentUser.fullName}
              </h2>
            </div>
            <button
              onClick={() => {
                if (teacherClasses.length > 0) {
                  setSelectedClass(teacherClasses[0]);
                  initMarkingForClass(teacherClasses[0]);
                  setCurrentScreen('teacher_mark_attendance');
                } else {
                  showToast('Please create a class first', 'warning');
                }
              }}
              className="bg-blue-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Mark Now
            </button>
          </div>

          {/* Pending Sync Banner (SRS Section 14 & 15) */}
          {pendingSyncCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-[11px] text-amber-900 font-medium">
                  <span className="font-bold">{pendingSyncCount} offline records</span> stored in Hive.
                </div>
              </div>
              <button
                onClick={() => {
                  const res = localDb.syncPendingRecords();
                  if (onSyncTriggered) onSyncTriggered();
                  showToast(`Synced ${res.syncedCount} records to Firebase!`, 'success');
                  refreshAppData(currentUser);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
              >
                <CloudUpload className="w-3 h-3" /> Sync
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold text-slate-600">Total Classes</span>
                <School className="w-4 h-4 text-blue-900" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {teacherClasses.length}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                Active Semesters
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold text-slate-600">Total Sessions</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {localDb.getSessions().length}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Recorded Attendance
              </div>
            </div>
          </div>

          {/* Quick Actions (SRS Section 9) */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 mb-2">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  if (teacherClasses.length > 0) {
                    setSelectedClass(teacherClasses[0]);
                    initMarkingForClass(teacherClasses[0]);
                    setCurrentScreen('teacher_mark_attendance');
                  } else {
                    showToast('Create a class first!', 'warning');
                  }
                }}
                className="bg-white hover:bg-blue-50/50 p-3 rounded-xl border border-slate-200 text-center flex flex-col items-center gap-1.5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-900">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  Mark Attendance
                </span>
              </button>

              <button
                onClick={() => setCurrentScreen('teacher_classes')}
                className="bg-white hover:bg-cyan-50/50 p-3 rounded-xl border border-slate-200 text-center flex flex-col items-center gap-1.5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-900">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  My Classes
                </span>
              </button>

              <button
                onClick={() => setCurrentScreen('reports')}
                className="bg-white hover:bg-amber-50/50 p-3 rounded-xl border border-slate-200 text-center flex flex-col items-center gap-1.5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-900">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  Reports (75%)
                </span>
              </button>
            </div>
          </div>

          {/* Classes Overview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900">Active Courses</h3>
              <button
                onClick={() => setCurrentScreen('teacher_classes')}
                className="text-[11px] text-blue-900 font-bold hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {teacherClasses.map((cls) => (
                <div
                  key={cls.classId}
                  onClick={() => {
                    setSelectedClass(cls);
                    initMarkingForClass(cls);
                    setCurrentScreen('teacher_mark_attendance');
                  }}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:border-blue-300 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-extrabold text-xs">
                      {cls.classCode.slice(0, 3)}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{cls.className}</div>
                      <div className="text-[10px] text-slate-500">
                        {cls.classCode} • {cls.enrolledStudentIds.length} Students
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Teacher Bottom Nav (SRS Section 44) */}
        <div className="bg-white border-t border-slate-200/80 px-4 py-2 flex justify-between items-center z-10">
          <button
            onClick={() => setCurrentScreen('teacher_dashboard')}
            className="flex flex-col items-center gap-0.5 text-blue-900"
          >
            <School className="w-4 h-4" />
            <span className="text-[9px] font-bold">Home</span>
          </button>
          <button
            onClick={() => setCurrentScreen('teacher_classes')}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[9px] font-medium">Classes</span>
          </button>
          <button
            onClick={() => {
              if (teacherClasses.length > 0) {
                setSelectedClass(teacherClasses[0]);
                initMarkingForClass(teacherClasses[0]);
                setCurrentScreen('teacher_mark_attendance');
              }
            }}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[9px] font-medium">Attendance</span>
          </button>
          <button
            onClick={() => setCurrentScreen('reports')}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[9px] font-medium">Reports</span>
          </button>
          <button
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800"
          >
            <UserIcon className="w-4 h-4" />
            <span className="text-[9px] font-medium">Profile</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: TEACHER MARK ATTENDANCE (SRS Section 12, 13, 14, 63)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'teacher_mark_attendance' && currentUser && selectedClass) {
    const students = localDb.getUsers().filter((u) => u.role === 'student');

    return (
      <div className="flex-1 bg-slate-50 flex flex-col justify-between">
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCurrentScreen('teacher_dashboard')}
              className="text-xs font-bold text-blue-900"
            >
              ← Back
            </button>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isOnline ? '● Online Mode' : '▲ Offline Mode (Hive)'}
            </span>
          </div>

          <h2 className="text-base font-extrabold text-slate-900">Mark Attendance</h2>
          <p className="text-xs text-slate-500">{selectedClass.className}</p>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="date"
                value={markingSessionDate}
                onChange={(e) => setMarkingSessionDate(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const map: Record<string, 'present' | 'absent'> = {};
                students.forEach((s) => (map[s.uid] = 'present'));
                setMarkingStatuses(map);
              }}
              className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-1.5 rounded-lg"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => {
                const map: Record<string, 'present' | 'absent'> = {};
                students.forEach((s) => (map[s.uid] = 'absent'));
                setMarkingStatuses(map);
              }}
              className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-1.5 rounded-lg"
            >
              All Absent
            </button>
          </div>
        </div>

        {/* Student Roster List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {students.map((stu) => {
            const status = markingStatuses[stu.uid] || 'present';
            const isPresent = status === 'present';

            return (
              <div
                key={stu.uid}
                className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {stu.fullName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">{stu.fullName}</div>
                    <div className="text-[10px] text-slate-400">{stu.email}</div>
                  </div>
                </div>

                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMarkingStatuses((prev) => ({
                      ...prev,
                      [stu.uid]: isPresent ? 'absent' : 'present',
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider transition-all shadow-sm ${
                    isPresent
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {status.toUpperCase()}
                </button>
              </div>
            );
          })}
        </div>

        {/* Submit Attendance Bar */}
        <div className="bg-white border-t border-slate-200 p-4">
          <button
            onClick={handleSubmitAttendance}
            disabled={isSubmittingAttendance}
            className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 ${
              isOnline ? 'bg-blue-900 hover:bg-blue-800' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isSubmittingAttendance ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isOnline ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Save & Sync to Firebase
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" /> Save Locally in Hive (Offline)
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: TEACHER CLASSES MANAGEMENT (SRS Section 11)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'teacher_classes' && currentUser) {
    const teacherClasses = classes.filter((c) => c.teacherId === currentUser.uid);

    return (
      <div className="flex-1 bg-slate-50 flex flex-col justify-between">
        <div className="p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentScreen('teacher_dashboard')}
              className="text-xs font-bold text-blue-900"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={() => setShowCreateClassModal(true)}
              className="bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Create Class
            </button>
          </div>

          <h2 className="text-base font-extrabold text-slate-900 mb-1">My Managed Courses</h2>
          <p className="text-xs text-slate-500 mb-4">
            Create and organize classes for your faculty department
          </p>

          <div className="space-y-3">
            {teacherClasses.map((cls) => (
              <div
                key={cls.classId}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                    {cls.classCode}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {cls.enrolledStudentIds.length} Students
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">{cls.className}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{cls.description}</p>
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      initMarkingForClass(cls);
                      setCurrentScreen('teacher_mark_attendance');
                    }}
                    className="flex-1 bg-blue-900 text-white text-xs font-bold py-2 rounded-lg"
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for Creating Class */}
        {showCreateClassModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-[340px] rounded-3xl p-5 shadow-2xl">
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">New Class</h3>
              <p className="text-xs text-slate-500 mb-4">Add course syllabus & section</p>

              <form onSubmit={handleCreateClass} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Class Title *
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. Advanced AI Engineering"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    placeholder="e.g. CS-405"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Description
                  </label>
                  <textarea
                    value={newClassDesc}
                    onChange={(e) => setNewClassDesc(e.target.value)}
                    rows={2}
                    placeholder="Semester outline, room location..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateClassModal(false)}
                    className="flex-1 border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-900 text-white text-xs font-bold py-2.5 rounded-xl"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: STUDENT DASHBOARD (SRS Section 10 & 20)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'student_dashboard' && currentUser) {
    const stats = calculateStudentStats(currentUser.uid);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
      <div className="flex-1 bg-slate-50 flex flex-col justify-between">
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/70 px-2 py-0.5 rounded">
                Student Portal
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                {currentUser.fullName}
              </h2>
            </div>
            <button
              onClick={() => setCurrentScreen('notifications')}
              className="relative p-2 bg-white rounded-xl border border-slate-200 text-slate-600"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* CRITICAL 75% THRESHOLD WARNING BANNER (SRS Section 10 & 20) */}
          {stats.isBelowThreshold && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold text-red-900">
                  Academic Attendance Warning (&lt; 75%)
                </div>
                <div className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                  Your overall attendance is currently{' '}
                  <span className="font-extrabold">{stats.percentage.toFixed(1)}%</span>. You must maintain at least 75.0% to sit in final semester examinations.
                </div>
              </div>
            </div>
          )}

          {/* Hero Overall Metric Card */}
          <div
            className={`p-5 rounded-3xl text-white shadow-lg ${
              stats.isBelowThreshold
                ? 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-950/20'
                : 'bg-gradient-to-br from-blue-900 to-blue-950 shadow-blue-950/20'
            }`}
          >
            <div className="text-xs text-white/80 font-semibold mb-1">
              Overall Academic Attendance
            </div>
            <div className="text-4xl font-black tracking-tight">
              {stats.total > 0 ? `${stats.percentage.toFixed(1)}%` : 'No Records'}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  stats.isBelowThreshold ? 'bg-red-900 text-white' : 'bg-emerald-500 text-white'
                }`}
              >
                {stats.isBelowThreshold ? '⚠️ Below 75% Risk' : '✓ Good Standing (≥ 75%)'}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-slate-500">Total</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{stats.total}</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-emerald-600">Present</div>
              <div className="text-lg font-black text-emerald-600 mt-0.5">{stats.attended}</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-red-600">Absent</div>
              <div className="text-lg font-black text-red-600 mt-0.5">{stats.absent}</div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900">Recent Attendance History</h3>
              <button
                onClick={() => setCurrentScreen('student_attendance')}
                className="text-[11px] text-blue-900 font-bold hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {attendanceRecords.slice(0, 4).map((r) => {
                const isPresent = r.status === 'present';
                return (
                  <div
                    key={r.attendanceId}
                    className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {isPresent ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">
                          {classes.find((c) => c.classId === r.classId)?.className || r.classId}
                        </div>
                        <div className="text-[10px] text-slate-400">{r.sessionDate}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        isPresent ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Student Bottom Navigation (SRS Section 45) */}
        <div className="bg-white border-t border-slate-200/80 px-4 py-2 flex justify-between items-center z-10">
          <button
            onClick={() => setCurrentScreen('student_dashboard')}
            className="flex flex-col items-center gap-0.5 text-blue-900"
          >
            <School className="w-4 h-4" />
            <span className="text-[9px] font-bold">Home</span>
          </button>
          <button
            onClick={() => setCurrentScreen('student_attendance')}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[9px] font-medium">Attendance</span>
          </button>
          <button
            onClick={() => setCurrentScreen('reports')}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[9px] font-medium">Reports</span>
          </button>
          <button
            onClick={() => setCurrentScreen('notifications')}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800"
          >
            <Bell className="w-4 h-4" />
            <span className="text-[9px] font-medium">Alerts</span>
          </button>
          <button
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800"
          >
            <UserIcon className="w-4 h-4" />
            <span className="text-[9px] font-medium">Profile</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: STUDENT MY ATTENDANCE (SRS Section 17 & 18)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'student_attendance' && currentUser) {
    let filteredRecords = attendanceRecords;
    if (studentStatusFilter === 'present') {
      filteredRecords = filteredRecords.filter((r) => r.status === 'present');
    } else if (studentStatusFilter === 'absent') {
      filteredRecords = filteredRecords.filter((r) => r.status === 'absent');
    }

    return (
      <div className="flex-1 bg-slate-50 flex flex-col justify-between">
        <div className="p-4 overflow-y-auto">
          <button
            onClick={() => setCurrentScreen('student_dashboard')}
            className="text-xs font-bold text-blue-900 mb-3"
          >
            ← Back to Dashboard
          </button>
          <h2 className="text-base font-extrabold text-slate-900 mb-1">My Attendance Log</h2>
          <p className="text-xs text-slate-500 mb-3">
            Real-time verified classroom attendance
          </p>

          {/* Filter Chips */}
          <div className="flex gap-2 mb-4">
            {(['all', 'present', 'absent'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setStudentStatusFilter(mode)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full capitalize transition-all ${
                  studentStatusFilter === mode
                    ? 'bg-blue-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredRecords.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                No attendance records available for this filter.
              </div>
            ) : (
              filteredRecords.map((r) => {
                const isPresent = r.status === 'present';
                return (
                  <div
                    key={r.attendanceId}
                    className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isPresent ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">
                          {classes.find((c) => c.classId === r.classId)?.className || r.classId}
                        </div>
                        <div className="text-[10px] text-slate-400">{r.sessionDate}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        isPresent ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: REPORTS & ANALYTICS (SRS Section 19, 20, 21)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'reports' && currentUser) {
    const isTeacher = currentUser.role === 'teacher';
    const allStudents = localDb.getUsers().filter((u) => u.role === 'student');

    return (
      <div className="flex-1 bg-slate-50 p-4 overflow-y-auto">
        <button
          onClick={() =>
            setCurrentScreen(isTeacher ? 'teacher_dashboard' : 'student_dashboard')
          }
          className="text-xs font-bold text-blue-900 mb-3"
        >
          ← Back to Dashboard
        </button>

        <h2 className="text-base font-extrabold text-slate-900 mb-1">
          Attendance Analytics &amp; Reports
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Calculated dynamically from verified Firestore records
        </p>

        {isTeacher ? (
          <div className="space-y-4">
            {/* 75% Threshold Alert for Teachers */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">
                  Student Risk Analysis (75% Rule)
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  SRS Section 20
                </span>
              </div>

              <div className="space-y-2">
                {allStudents.map((stu) => {
                  const stats = calculateStudentStats(stu.uid);
                  return (
                    <div
                      key={stu.uid}
                      className="p-3 rounded-xl border border-slate-100 flex items-center justify-between bg-slate-50/50"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{stu.fullName}</div>
                        <div className="text-[10px] text-slate-500">
                          {stats.attended}/{stats.total} Sessions Attended
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-black ${
                            stats.isBelowThreshold ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {stats.total > 0 ? `${stats.percentage.toFixed(1)}%` : 'N/A'}
                        </div>
                        {stats.isBelowThreshold && (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                            BELOW 75%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Student Personal Breakdown */}
            {(() => {
              const stats = calculateStudentStats(currentUser.uid);
              return (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="text-xs font-bold text-slate-500">Cumulative Attendance</div>
                  <div className="text-3xl font-black text-slate-900">
                    {stats.percentage.toFixed(1)}%
                  </div>

                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.isBelowThreshold ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-500">
                    {stats.isBelowThreshold ? (
                      <span className="text-red-600 font-bold">
                        ⚠️ Critical: Below institutional 75% requirement.
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold">
                        ✓ In good academic standing (Above 75%).
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: NOTIFICATIONS (SRS Section 22, 23, 24)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'notifications' && currentUser) {
    return (
      <div className="flex-1 bg-slate-50 p-4 overflow-y-auto">
        <button
          onClick={() => setCurrentScreen('student_dashboard')}
          className="text-xs font-bold text-blue-900 mb-3"
        >
          ← Back to Dashboard
        </button>

        <h2 className="text-base font-extrabold text-slate-900 mb-1">
          Notification Alerts (FCM)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Real-time attendance updates &amp; academic absence alerts
        </p>

        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => {
              const isAlert = n.type === 'absence_alert';
              return (
                <div
                  key={n.notificationId}
                  onClick={() => {
                    localDb.markNotificationRead(n.notificationId);
                    setNotifications(localDb.getNotifications(currentUser.uid));
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-white border-slate-200/80'
                      : isAlert
                      ? 'bg-red-50/70 border-red-200'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-extrabold ${
                        isAlert ? 'text-red-700' : 'text-slate-900'
                      }`}
                    >
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: PROFILE SCREEN (SRS Section 46 & 47)
  // ---------------------------------------------------------------------------
  if (currentScreen === 'profile' && currentUser) {
    const isTeacher = currentUser.role === 'teacher';

    return (
      <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
        <button
          onClick={() =>
            setCurrentScreen(isTeacher ? 'teacher_dashboard' : 'student_dashboard')
          }
          className="text-xs font-bold text-blue-900"
        >
          ← Back
        </button>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center font-extrabold text-xl mx-auto mb-2">
            {currentUser.fullName.slice(0, 1)}
          </div>
          <h2 className="text-base font-extrabold text-slate-900">{currentUser.fullName}</h2>
          <p className="text-xs text-slate-500">{currentUser.email}</p>
          <span className="inline-block mt-2 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
            {currentUser.role}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Phone (11 Digits)</span>
            <span className="font-bold text-slate-800">{currentUser.phoneNumber}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Institution</span>
            <span className="font-bold text-slate-800">{currentUser.institutionId}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Network State</span>
            <span
              className={`font-bold ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}
            >
              {isOnline ? 'Online (Firebase)' : 'Offline (Hive)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Pending Sync Queue</span>
            <span
              className={`font-bold ${
                pendingSyncCount > 0 ? 'text-amber-600' : 'text-slate-800'
              }`}
            >
              {pendingSyncCount} records
            </span>
          </div>
        </div>

        {/* Switch Role Button */}
        <button
          onClick={() => {
            const updated = localDb.toggleUserRole(currentUser.uid);
            if (updated) {
              setCurrentUser(updated);
              refreshAppData(updated);
              showToast(`Switched account to ${updated.role.toUpperCase()} role`, 'success');
              setCurrentScreen(updated.role === 'teacher' ? 'teacher_dashboard' : 'student_dashboard');
            }
          }}
          className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          <span>Switch to {isTeacher ? 'Student View (75% Alert)' : 'Teacher View (Mark Classes)'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out (Preserves Offline Sync)
        </button>
      </div>
    );
  }

  return null;
};
