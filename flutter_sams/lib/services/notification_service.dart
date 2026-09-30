import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/notification_model.dart';
import '../core/constants/app_constants.dart';

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  /// Initialize FCM permissions and register token
  Future<String?> initializeFcm(String userId) async {
    try {
      final NotificationSettings settings = await _fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        final String? token = await _fcm.getToken();
        if (token != null) {
          // Store token in flutter_secure_storage
          await _secureStorage.write(key: AppConstants.keyFcmToken, value: token);

          // Update Firestore user document with token
          await _firestore
              .collection(AppConstants.usersCollection)
              .doc(userId)
              .update({'fcmToken': token});

          return token;
        }
      }
      return null;
    } catch (e) {
      // Gracefully handle devices where Google Play services or notifications are unavailable
      return null;
    }
  }

  /// Trigger notification record creation for a student (Section 22: Attendance updates & absence alerts)
  Future<void> sendAttendanceNotification({
    required String studentId,
    required String className,
    required String sessionDate,
    required String status,
    String? classId,
    String? sessionId,
  }) async {
    try {
      final bool isAbsent = status.toLowerCase() == 'absent';
      final String title = isAbsent ? 'Attendance Alert' : 'Attendance Update';
      final String message = isAbsent
          ? 'You were marked Absent in $className on $sessionDate.'
          : '$className — $sessionDate — Present';
      final String type = isAbsent ? 'absence_alert' : 'attendance_update';

      final docRef = _firestore.collection(AppConstants.notificationsCollection).doc();

      final notification = NotificationModel(
        notificationId: docRef.id,
        userId: studentId,
        title: title,
        message: message,
        type: type,
        classId: classId,
        sessionId: sessionId,
        read: false,
        createdAt: DateTime.now(),
      );

      await docRef.set(notification.toMap());
    } catch (_) {
      // Non-blocking notification fail
    }
  }
}
