// File generated for Smart Attendance Management System (SAMS)
// Contains real Firebase configuration options for Android and Web.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not configured for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDgysR8gLA1UqCGZLeuhPAHGsADcnhOAdo',
    appId: '1:118511426232:web:b2e2b8950aa41e7f64724d',
    messagingSenderId: '118511426232',
    projectId: 'sams-attendance-c4882',
    authDomain: 'sams-attendance-c4882.firebaseapp.com',
    storageBucket: 'sams-attendance-c4882.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDgysR8gLA1UqCGZLeuhPAHGsADcnhOAdo',
    appId: '1:118511426232:android:b2e2b8950aa41e7f64724d',
    messagingSenderId: '118511426232',
    projectId: 'sams-attendance-c4882',
    storageBucket: 'sams-attendance-c4882.firebasestorage.app',
  );
}
