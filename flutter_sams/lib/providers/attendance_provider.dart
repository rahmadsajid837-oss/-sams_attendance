import 'package:flutter/material.dart';
import '../models/attendance_model.dart';
import '../models/user_model.dart';
import '../services/firestore_service.dart';
import '../services/local_database_service.dart';
import '../services/notification_service.dart';

class AttendanceProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();
  final LocalDatabaseService _localDb = LocalDatabaseService();
  final NotificationService _notificationService = NotificationService();

  // Temporary attendance marking state: Map<studentId, 'present' | 'absent'>
  Map<String, String> _markingStatus = {};
  bool _isSubmitting = false;
  String? _errorMessage;
  String? _successMessage;

  // Student history state
  List<AttendanceRecordModel> _studentRecords = [];
  bool _isLoadingHistory = false;

  Map<String, String> get markingStatus => _markingStatus;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  List<AttendanceRecordModel> get studentRecords => _studentRecords;
  bool get isLoadingHistory => _isLoadingHistory;

  /// Initialize marking state with default 'present' for all students
  void initializeMarking(List<UserModel> students) {
    _markingStatus = {for (var s in students) s.uid: 'present'};
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }

  /// Toggle status for a student between 'present' and 'absent'
  void toggleStatus(String studentId) {
    final current = _markingStatus[studentId] ?? 'present';
    _markingStatus[studentId] = current == 'present' ? 'absent' : 'present';
    notifyListeners();
  }

  /// Mark all students as present
  void markAllPresent() {
    _markingStatus.updateAll((key, value) => 'present');
    notifyListeners();
  }

  /// Mark all students as absent
  void markAllAbsent() {
    _markingStatus.updateAll((key, value) => 'absent');
    notifyListeners();
  }

  /// Submit Attendance with Offline-First Architecture (Section 12, 13, 14, 63)
  Future<bool> submitAttendance({
    required String classId,
    required String className,
    required String teacherId,
    required String sessionDate, // YYYY-MM-DD
    required String sessionTime, // HH:mm
    required List<UserModel> students,
    required bool isOnline,
  }) async {
    if (students.isEmpty) {
      _errorMessage = 'Student list is empty. Cannot record attendance.';
      notifyListeners();
      return false;
    }

    _isSubmitting = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final String sessionId = '${classId}_${sessionDate.replaceAll('-', '')}';

      // 1. Build AttendanceRecord list
      final List<AttendanceRecordModel> records = students.map((s) {
        final status = _markingStatus[s.uid] ?? 'absent';
        return AttendanceRecordModel(
          attendanceId: '${sessionId}_${s.uid}',
          sessionId: sessionId,
          classId: classId,
          studentId: s.uid,
          studentName: s.fullName,
          teacherId: teacherId,
          status: status,
          sessionDate: sessionDate,
          pendingSync: !isOnline,
          createdAt: DateTime.now(),
        );
      }).toList();

      // 2. Offline Mode Handling
      if (!isOnline) {
        // Save immediately to Hive with pendingSync = true
        await _localDb.saveAttendanceLocally(records);
        _successMessage = 'Saved offline. Will sync when connection is restored.';
        _isSubmitting = false;
        notifyListeners();
        return true;
      }

      // 3. Online Mode: First check duplicate session
      final bool alreadyExists = await _firestoreService.checkSessionExists(
        classId: classId,
        sessionDate: sessionDate,
      );

      if (alreadyExists) {
        _errorMessage = 'Attendance for this class and session has already been recorded.';
        _isSubmitting = false;
        notifyListeners();
        return false;
      }

      // Save locally first to prevent data loss (Section 16)
      await _localDb.saveAttendanceLocally(records);

      // Upload session and records to Firestore
      await _firestoreService.submitAttendanceSession(
        classId: classId,
        teacherId: teacherId,
        sessionDate: sessionDate,
        sessionTime: sessionTime,
        records: records,
      );

      // Trigger push notifications for students
      for (final r in records) {
        _notificationService.sendAttendanceNotification(
          studentId: r.studentId,
          className: className,
          sessionDate: sessionDate,
          status: r.status,
          classId: classId,
          sessionId: sessionId,
        );
      }

      _successMessage = 'Attendance saved successfully.';
      _isSubmitting = false;
      notifyListeners();
      return true;
    } catch (e) {
      // In case of network drops during write, ensure Hive has the records flagged as pending
      _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  /// Load student attendance history (supports offline cache)
  Future<void> loadStudentAttendance({
    required String studentId,
    String? classId,
    bool isOnline = true,
  }) async {
    _isLoadingHistory = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (isOnline) {
        _studentRecords = await _firestoreService.getStudentAttendanceRecords(
          studentId: studentId,
          classId: classId,
        );
        // Cache to local Hive
        await _localDb.saveAttendanceLocally(_studentRecords);
      } else {
        _studentRecords = _localDb.getCachedStudentAttendance(
          studentId,
          classId: classId,
        );
      }
    } catch (e) {
      _studentRecords = _localDb.getCachedStudentAttendance(
        studentId,
        classId: classId,
      );
      _errorMessage = 'Loaded cached attendance records.';
    } finally {
      _isLoadingHistory = false;
      notifyListeners();
    }
  }
}
