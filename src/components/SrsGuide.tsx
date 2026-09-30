import React from 'react';
import { BookOpen, CheckCircle, ShieldCheck, WifiOff, Bell, Cpu, Layers } from 'lucide-react';

export const SrsGuide: React.FC = () => {
  const srsMappings = [
    {
      section: 'Section 1: General & Device Scope',
      rule: 'Mobile application targeting Android 8.0 (API 26) and above. Fixed portrait orientation.',
      status: 'Implemented',
      details: '`android/app/build.gradle` set to minSdkVersion 26, `AndroidManifest.xml` locked to `android:screenOrientation="portrait"`.',
    },
    {
      section: 'Section 2 & 5: Authentication & ABAC Roles',
      rule: 'Email/Password and Google Sign-In. Dual roles: Teacher & Student. 11-digit phone number validation.',
      status: 'Implemented',
      details: 'Firebase Auth integration with custom user profile doc in `/users/{uid}`. Client and server regex validation for 11 numerical digits.',
    },
    {
      section: 'Section 9 & 10: Role Dashboards',
      rule: 'Teacher: Classes, sessions, quick mark actions. Student: Overall %, below 75% warning alert, recent history.',
      status: 'Implemented',
      details: 'Material Design 3 interfaces with dynamic role routing and real-time aggregate statistics calculation.',
    },
    {
      section: 'Section 12 & 13: Attendance Marking & Duplicate Prevention',
      rule: 'Mark attendance per class session. Prevent duplicate sessions with exact warning: "Attendance for this class and session has already been recorded."',
      status: 'Implemented',
      details: 'Deterministic composite key `${classId}_${sessionDate}` verified against existing Firestore/Hive sessions before persisting.',
    },
    {
      section: 'Section 14, 15, & 63: Offline-First & Idempotent Sync',
      rule: 'Offline recording in Hive local database. Auto-synchronization when connectivity is restored without duplicates.',
      status: 'Implemented',
      details: 'Hive database with `pendingSync: true`. `SyncService` verifies record presence in Firestore prior to insert, marking synced on completion.',
    },
    {
      section: 'Section 20 & 64: 75% Threshold Calculation',
      rule: 'Formula: (Attended / Total) * 100. If < 75.0%, flag academic warning to student and teacher reports.',
      status: 'Implemented',
      details: '`AttendanceCalculator.dart` handles floating-point math, boundary tests (75.0% is compliant), and flags low attendance.',
    },
    {
      section: 'Section 22, 23, & 24: FCM Notifications',
      rule: 'Push notifications for attendance updates and absence alerts. Historical notification log with read/unread flags.',
      status: 'Implemented',
      details: 'Firebase Cloud Messaging integration with background handler, Firestore `/notifications/{id}` document stream, and in-app badge.',
    },
    {
      section: 'Section 47: Logout & Offline Preservation',
      rule: 'Signing out must preserve all offline un-synchronized attendance records in Hive local database.',
      status: 'Implemented',
      details: 'Logout only purges active user session tokens; offline pending sync box remains untouched until verified sync.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-6 h-6 text-blue-900" />
          <h2 className="text-xl font-extrabold text-slate-900">
            SAMS SRS Specification &amp; Implementation Guide
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Comprehensive compliance mapping between the official SAMS Software Requirements Specification and the Flutter/Firebase codebase architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {srsMappings.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100/70 text-blue-900">
                  {item.section}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {item.status}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{item.rule}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                {item.details}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
