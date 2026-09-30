# Smart Attendance Management System (SAMS)
## Production-Grade Flutter Mobile Application with Firebase & Hive Offline Synchronization

![SAMS Platform](https://img.shields.io/badge/Platform-Flutter%20%7C%20Dart-02569B?logo=flutter)
![Backend](https://img.shields.io/badge/Backend-Firebase%20Auth%20%26%20Firestore-FFA611?logo=firebase)
![Local DB](https://img.shields.io/badge/Offline%20DB-Hive%20Local%20Storage-F97316)
![Target](https://img.shields.io/badge/Target-Android%208.0%2B%20(API%2026%2B)-3DDC84?logo=android)
![Security](https://img.shields.io/badge/Security-Zero--Trust%20ABAC%20Rules-10B981)

---

## 1. Project Overview

The **Smart Attendance Management System (SAMS)** is an enterprise academic attendance tracking application engineered strictly in accordance with the official **SAMS Software Requirements Specification (SRS)**.

It provides dual-role access for **Teachers** and **Students** with:
- **Zero-Latency Offline Attendance Marking** using Hive local database.
- **Idempotent Background Synchronization** to Cloud Firestore when internet returns.
- **Strict Role-Based Access Control (RBAC)** enforced by Firebase Cloud Security Rules.
- **Automated 75% Attendance Threshold Flagging** and academic warning alerts.
- **Firebase Cloud Messaging (FCM)** push notifications for absence alerts and session updates.
- **Material Design 3 Mobile Interface** constrained to portrait orientation.

---

## 2. Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| **Framework** | Flutter 3.x / Dart 3.x | Cross-platform mobile development (Android Target) |
| **Authentication** | Firebase Authentication | Email/Password & Google Sign-In |
| **Cloud Database** | Cloud Firestore | Cloud persistence with ABAC Security Rules |
| **Offline Database** | Hive & Hive Flutter | Encrypted local caching & pending sync persistence |
| **State Management** | Provider (`ChangeNotifier`) | Clean Architecture separation of UI & Business Logic |
| **Network Monitoring** | `connectivity_plus` | Real-time connectivity change detection |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Attendance update & absence alert delivery |
| **Secure Storage** | `flutter_secure_storage` | Local device token encryption |
| **Design System** | Material Design 3 | Academic palette, portrait orientation |

---

## 3. Architecture & Directory Structure

```text
flutter_sams/
├── android/
│   └── app/
│       ├── build.gradle               # minSdkVersion 26, targetSdkVersion 34, multiDex
│       └── src/main/AndroidManifest.xml# Permissions & portrait orientation lock
├── lib/
│   ├── main.dart                      # App initialization & service bootstrapping
│   ├── app.dart                       # MultiProvider DI setup & MaterialApp
│   ├── core/
│   │   ├── constants/app_constants.dart # Thresholds (75%), Collection names, Hive keys
│   │   ├── theme/app_theme.dart       # Material Design 3 palette & typography
│   │   └── utils/attendance_calculator.dart # Attendance % formula & below 75% flagging
│   ├── models/
│   │   ├── user_model.dart            # Teacher & Student profile data models
│   │   ├── class_model.dart           # Academic classes & student enrollment
│   │   ├── session_model.dart         # Attendance sessions (date, time, totals)
│   │   ├── attendance_model.dart      # Granular student record with pendingSync
│   │   └── notification_model.dart    # Alerts & FCM payload history
│   ├── services/
│   │   ├── auth_service.dart          # Firebase Auth & Google Sign-In
│   │   ├── firestore_service.dart     # Firestore queries & duplicate prevention
│   │   ├── local_database_service.dart# Hive offline box CRUD & cache preservation
│   │   ├── connectivity_service.dart  # connectivity_plus network streams
│   │   ├── sync_service.dart          # Section 63 Idempotent Sync Algorithm
│   │   └── notification_service.dart  # FCM token handling & alert dispatch
│   ├── providers/
│   │   ├── auth_provider.dart         # Authentication lifecycle & session
│   │   ├── class_provider.dart        # Class creation & roster management
│   │   ├── attendance_provider.dart   # Interactive marking & offline submission
│   │   ├── report_provider.dart       # Teacher and student analytics calculations
│   │   ├── sync_provider.dart         # Auto-sync orchestrator & queue watcher
│   │   ├── connectivity_provider.dart # Online/Offline reactive status
│   │   └── notification_provider.dart # In-app notification history
│   └── screens/
│       ├── splash/splash_screen.dart  # Startup routing by authenticated role
│       ├── onboarding/onboarding_screen.dart # Multi-slide introductory tour
│       ├── auth/                      # Login & SignUp with 11-digit phone validation
│       ├── teacher/                   # Dashboard, My Classes, Mark Attendance
│       ├── student/                   # Dashboard (75% Warning), My Attendance
│       ├── reports/reports_screen.dart# Visual charts & 75% threshold flags
│       ├── notifications/             # Notification history & unread states
│       └── profile/profile_screen.dart# User profile & safe logout
├── test/
│   ├── attendance_test.dart           # Unit tests for attendance formulas & 75%
│   └── sync_test.dart                 # Unit tests for offline sync state machine
├── firestore.rules                    # Hardened ABAC Security Rules
├── firestore.indexes.json             # Composite query indexes
└── pubspec.yaml                       # Production dependencies
```

---

## 4. Key Business Rules & Algorithms

### 4.1 Attendance Percentage Formula (SRS Section 20 & 64)
$$\text{Attendance Percentage} = \left(\frac{\text{Attended Sessions}}{\text{Total Sessions}}\right) \times 100$$
- If $\text{Percentage} < 75.0\%$: The student is immediately flagged on Teacher Reports, and a prominent warning banner is displayed on the Student Dashboard.

### 4.2 Offline-First & Idempotent Synchronization (SRS Section 63)
```text
ON ATTENDANCE SUBMIT:
  1. Save record immediately to Hive local storage.
  2. IF offline:
       Set pendingSync = true.
       Show "Saved offline. Will sync when connection is restored."
  3. IF online:
       Check duplicate session in Firestore.
       Write session and attendance batch to Firestore.
       IF success: Set pendingSync = false, save syncedAt.
       ELSE: Keep pendingSync = true in Hive for background retry.

ON CONNECTIVITY RESTORED (Auto-Sync):
  1. Query Hive for all records where pendingSync == true.
  2. FOR each pending record:
       Query Firestore by attendanceId.
       IF document exists: Mark local record as synced.
       ELSE: Write to Firestore. IF write succeeds -> mark local record synced.
  3. Never delete unsynchronized attendance data.
```

### 4.3 Duplicate Session Prevention (SRS Section 13)
- SAMS generates deterministic session IDs using `${classId}_${sessionDate}`.
- If a session already exists for the same class and calendar date, submission is rejected with:
  `"Attendance for this class and session has already been recorded."`

---

## 5. Firebase Setup Guide

1. Create a Firebase Project in the [Firebase Console](https://console.firebase.google.com/).
2. Register an Android Application with package name `com.sams.attendance`.
3. Download `google-services.json` and place it in `flutter_sams/android/app/`.
4. Enable **Authentication**:
   - Enable **Email/Password**.
   - Enable **Google Sign-In** (add SHA-1 certificate fingerprint from `keytool`).
5. Enable **Cloud Firestore**:
   - Deploy `firestore.rules` using the Firebase CLI:
     ```bash
     firebase deploy --only firestore:rules,firestore:indexes
     ```
6. Enable **Cloud Messaging (FCM)** for push alerts.

---

## 6. Build & APK Generation Instructions

### Step 1: Install Dependencies
```bash
cd flutter_sams
flutter pub get
```

### Step 2: Run Unit Tests
```bash
flutter test
```

### Step 3: Run on Android Device / Emulator
```bash
flutter run
```

### Step 4: Build Production Release APK
```bash
flutter build apk --release
```
The output APK will be located at:
`flutter_sams/build/app/outputs/flutter-apk/app-release.apk`

---

## 7. Security Hardening

- **No Plain-Text Passwords**: Handled exclusively via Firebase Auth.
- **Firestore Security Rules**: Students cannot write or tamper with attendance records. Students are constrained so `resource.data.studentId == request.auth.uid`.
- **Role Verification**: Verified on the backend using the Firestore `/users/{uid}` document, not trusted from client headers.
- **Offline Data Retention**: Pending sync records are never discarded during logout or app restart until confirmed written to Firestore.
