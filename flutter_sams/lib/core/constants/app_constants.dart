class AppConstants {
  static const String appName = 'SAMS';
  static const String appFullName = 'Smart Attendance Management System';
  static const String appVersion = '1.0.0';

  // Attendance Rules
  static const double minimumAttendancePercentage = 75.0;

  // Firebase Collections
  static const String usersCollection = 'users';
  static const String classesCollection = 'classes';
  static const String sessionsCollection = 'sessions';
  static const String attendanceCollection = 'attendance_records';
  static const String notificationsCollection = 'notifications';

  // Hive Box Names
  static const String userBox = 'user_box';
  static const String classesBox = 'classes_box';
  static const String sessionsBox = 'sessions_box';
  static const String attendanceBox = 'attendance_box';
  static const String pendingSyncBox = 'pending_sync_box';
  static const String appSettingsBox = 'app_settings_box';

  // Secure Storage Keys
  static const String keyUserToken = 'sams_user_jwt_token';
  static const String keyFcmToken = 'sams_fcm_device_token';
  static const String keyUserRole = 'sams_user_role';

  // Validation Patterns
  static final RegExp emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );
  static final RegExp phoneRegex = RegExp(r'^\d{11}$');
}

enum UserRole { teacher, student }
enum AttendanceStatus { present, absent }
enum SyncStatus { synced, pending, failed }
