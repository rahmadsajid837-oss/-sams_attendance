export type UserRole = 'teacher' | 'student';

export interface User {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  institutionId?: string;
  fcmToken?: string;
  createdAt: string;
}

export interface AcademicClass {
  classId: string;
  className: string;
  classCode: string;
  description: string;
  teacherId: string;
  institutionId?: string;
  enrolledStudentIds: string[];
  createdAt: string;
}

export interface AttendanceSession {
  sessionId: string;
  classId: string;
  teacherId: string;
  sessionDate: string; // YYYY-MM-DD
  sessionTime: string; // HH:mm
  totalPresent: number;
  totalAbsent: number;
  createdAt: string;
}

export interface AttendanceRecord {
  attendanceId: string;
  sessionId: string;
  classId: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  status: 'present' | 'absent';
  sessionDate: string;
  pendingSync: boolean;
  syncedAt?: string;
  createdAt: string;
}

export interface AppNotification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'attendance_update' | 'absence_alert' | 'class_reminder';
  classId?: string;
  sessionId?: string;
  read: boolean;
  createdAt: string;
}

export interface AttendanceStats {
  totalSessions: number;
  attendedSessions: number;
  absentSessions: number;
  percentage: number;
  isBelowThreshold: boolean;
}
