import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/local_database_service.dart';
import 'firebase_options.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Initialize Firebase
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase initialization warning: $e');
  }

  // 2. Initialize Hive Offline Database
  await LocalDatabaseService().init();

  // 3. Launch App
  runApp(const SamsApp());
}
