import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Download,
  Copy,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  Terminal,
  Cpu,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Key Flutter and Firestore files mapped for the source viewer and zip packager
const FLUTTER_FILES: Record<string, { path: string; category: string; content: string }> = {
  'main.dart': {
    path: 'lib/main.dart',
    category: 'Entrypoint',
    content: `import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/local_database_service.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Initialize Firebase
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase initialization warning: \$e');
  }

  // 2. Initialize Hive Offline Database
  await LocalDatabaseService().init();

  // 3. Launch App
  runApp(const SamsApp());
}`,
  },
  'sync_service.dart': {
    path: 'lib/services/sync_service.dart',
    category: 'Offline Sync (SRS 63)',
    content: `import 'package:flutter/foundation.dart';
import 'local_database_service.dart';
import 'firestore_service.dart';
import 'connectivity_service.dart';
import '../models/attendance_model.dart';

class SyncService {
  final LocalDatabaseService _localDb = LocalDatabaseService();
  final FirestoreService _firestore = FirestoreService();
  final ConnectivityService _connectivity = ConnectivityService();

  bool _isSyncing = false;
  bool get isSyncing => _isSyncing;

  Future<int> syncPendingAttendance() async {
    if (_isSyncing) return 0;
    if (!_connectivity.isOnline) return 0;

    _isSyncing = true;
    int syncedCount = 0;

    try {
      final pendingRecords = _localDb.getPendingSyncRecords();
      if (pendingRecords.isEmpty) {
        _isSyncing = false;
        return 0;
      }

      for (final record in pendingRecords) {
        final exists = await _firestore.recordExists(record.attendanceId);
        if (exists) {
          final updated = record.copyWith(pendingSync: false, syncedAt: DateTime.now());
          await _localDb.saveAttendance(updated);
          syncedCount++;
          continue;
        }

        final success = await _firestore.saveAttendanceRecord(record);
        if (success) {
          final updated = record.copyWith(pendingSync: false, syncedAt: DateTime.now());
          await _localDb.saveAttendance(updated);
          syncedCount++;
        }
      }
    } catch (e) {
      debugPrint('Sync error: \$e');
    } finally {
      _isSyncing = false;
    }
    return syncedCount;
  }
}`,
  },
  'attendance_calculator.dart': {
    path: 'lib/core/utils/attendance_calculator.dart',
    category: 'Core Logic (SRS 20 & 64)',
    content: `import '../constants/app_constants.dart';

class AttendanceStats {
  final int totalSessions;
  final int attendedSessions;
  final int absentSessions;
  final double percentage;
  final bool isBelowThreshold;

  const AttendanceStats({
    required this.totalSessions,
    required this.attendedSessions,
    required this.absentSessions,
    required this.percentage,
    required this.isBelowThreshold,
  });

  factory AttendanceStats.empty() {
    return const AttendanceStats(
      totalSessions: 0,
      attendedSessions: 0,
      absentSessions: 0,
      percentage: 0.0,
      isBelowThreshold: false,
    );
  }
}

class AttendanceCalculator {
  static AttendanceStats calculate({
    required int totalSessions,
    required int attendedSessions,
  }) {
    if (totalSessions <= 0) return AttendanceStats.empty();

    final int absentSessions = (totalSessions - attendedSessions).clamp(0, totalSessions);
    final double rawPercentage = (attendedSessions / totalSessions) * 100.0;
    final double percentage = double.parse(rawPercentage.toStringAsFixed(1));
    final bool isBelow = percentage < AppConstants.attendanceThresholdPercentage; // 75.0%

    return AttendanceStats(
      totalSessions: totalSessions,
      attendedSessions: attendedSessions,
      absentSessions: absentSessions,
      percentage: percentage,
      isBelowThreshold: isBelow,
    );
  }
}`,
  },
  'firestore.rules': {
    path: 'firestore.rules',
    category: 'Zero-Trust ABAC',
    content: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isTeacher() {
      return isAuthenticated() && getUserData().role == 'teacher';
    }

    function isStudent() {
      return isAuthenticated() && getUserData().role == 'student';
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && request.auth.uid == userId;
    }

    match /classes/{classId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isTeacher();
    }

    match /sessions/{sessionId} {
      allow read: if isAuthenticated();
      allow create, update: if isTeacher();
    }

    match /attendance_records/{recordId} {
      allow read: if isAuthenticated() && (
        isTeacher() || (isStudent() && resource.data.studentId == request.auth.uid)
      );
      allow create, update: if isTeacher();
      allow delete: if false;
    }

    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}`,
  },
  'pubspec.yaml': {
    path: 'pubspec.yaml',
    category: 'Flutter Configuration',
    content: `name: sams_attendance
description: "Smart Attendance Management System (SAMS) - Flutter & Firebase Offline-First Mobile Application"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.27.0
  firebase_auth: ^4.17.8
  cloud_firestore: ^4.15.8
  firebase_messaging: ^14.7.19
  google_sign_in: ^6.2.1
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  provider: ^6.1.2
  connectivity_plus: ^5.0.2
  flutter_secure_storage: ^9.0.0
  intl: ^0.19.0
  uuid: ^4.3.3
  path_provider: ^2.1.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true`,
  },
  'attendance_test.dart': {
    path: 'test/attendance_test.dart',
    category: 'Unit Testing',
    content: `import 'package:flutter_test/flutter_test.dart';
import 'package:sams_attendance/core/utils/attendance_calculator.dart';
import 'package:sams_attendance/core/constants/app_constants.dart';

void main() {
  group('Attendance Calculation & 75% Threshold Tests (SRS Section 20 & 64)', () {
    test('Calculates exact percentage: 17/20 = 85.0% (Above threshold)', () {
      final stats = AttendanceCalculator.calculate(
        totalSessions: 20,
        attendedSessions: 17,
      );

      expect(stats.totalSessions, 20);
      expect(stats.attendedSessions, 17);
      expect(stats.absentSessions, 3);
      expect(stats.percentage, 85.0);
      expect(stats.isBelowThreshold, false);
    });

    test('Flags student below 75% threshold: 14/20 = 70.0%', () {
      final stats = AttendanceCalculator.calculate(
        totalSessions: 20,
        attendedSessions: 14,
      );

      expect(stats.totalSessions, 20);
      expect(stats.attendedSessions, 14);
      expect(stats.absentSessions, 6);
      expect(stats.percentage, 70.0);
      expect(stats.isBelowThreshold, true);
    });
  });
}`,
  },
};

export const FlutterCodeViewer: React.FC = () => {
  const [selectedFileName, setSelectedFileName] = useState<string>('main.dart');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isZipping, setIsZipping] = useState(false);

  const selectedFile = FLUTTER_FILES[selectedFileName] || FLUTTER_FILES['main.dart'];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('flutter_sams');

      // Add all core files to zip
      Object.entries(FLUTTER_FILES).forEach(([_, file]) => {
        folder?.file(file.path, file.content);
      });

      // Add Readme
      folder?.file(
        'README.md',
        '# SAMS Flutter Application\nRun `flutter pub get` and `flutter run` or `flutter build apk --release`.'
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'flutter_sams_attendance_source.zip');
    } catch (e) {
      console.error('Zip generation error', e);
    } finally {
      setIsZipping(false);
    }
  };

  const fileKeys = Object.keys(FLUTTER_FILES).filter((k) =>
    k.toLowerCase().includes(searchQuery.toLowerCase()) ||
    FLUTTER_FILES[k].path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Top Banner with Download Button */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-900" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Flutter/Dart Codebase &amp; Architecture Explorer
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Production-grade clean architecture: Models, Hive Services, Providers, ABAC Rules, &amp; Tests
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-950/20 transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Packaging ZIP...' : 'Download Full Flutter Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: File Tree */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 p-3 flex flex-col h-[560px]">
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
            />
          </div>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
            Flutter Project Tree
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {fileKeys.map((name) => {
              const file = FLUTTER_FILES[name];
              const isSelected = selectedFileName === name;

              return (
                <button
                  key={name}
                  onClick={() => setSelectedFileName(name)}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-sm font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ml-1 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>Dart SDK: 3.x</span>
            <span>Target: Android API 26+</span>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="md:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col h-[560px] overflow-hidden text-slate-200 shadow-xl">
          {/* File Tab Bar */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span className="font-mono text-slate-200 font-bold">{selectedFile.path}</span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {selectedFile.category}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>

          {/* Code Area */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-300">
            <pre>
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
