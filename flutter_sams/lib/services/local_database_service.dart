import 'package:hive_flutter/hive_flutter.dart';
import '../models/attendance_model.dart';
import '../models/class_model.dart';
import '../models/session_model.dart';
import '../core/constants/app_constants.dart';

class LocalDatabaseService {
  static final LocalDatabaseService _instance = LocalDatabaseService._internal();
  factory LocalDatabaseService() => _instance;
  LocalDatabaseService._internal();

  late Box<Map> _attendanceBox;
  late Box<Map> _classesBox;
  late Box<Map> _sessionsBox;
  late Box _settingsBox;

  bool _isInitialized = false;

  /// Initialize Hive boxes
  Future<void> init() async {
    if (_isInitialized) return;

    await Hive.initFlutter();

    _attendanceBox = await Hive.openBox<Map>(AppConstants.attendanceBox);
    _classesBox = await Hive.openBox<Map>(AppConstants.classesBox);
    _sessionsBox = await Hive.openBox<Map>(AppConstants.sessionsBox);
    _settingsBox = await Hive.openBox(AppConstants.appSettingsBox);

    _isInitialized = true;
  }

  // ---------------------------------------------------------------------------
  // ATTENDANCE & PENDING SYNC
  // ---------------------------------------------------------------------------

  /// Save attendance records locally into Hive immediately
  Future<void> saveAttendanceLocally(List<AttendanceRecordModel> records) async {
    for (final record in records) {
      await _attendanceBox.put(record.attendanceId, record.toMap());
    }
  }

  /// Get all records currently pending synchronization with Firestore
  List<AttendanceRecordModel> getPendingSyncRecords() {
    final List<AttendanceRecordModel> pendingList = [];
    for (final key in _attendanceBox.keys) {
      final data = _attendanceBox.get(key);
      if (data != null) {
        final record = AttendanceRecordModel.fromMap(Map<String, dynamic>.from(data));
        if (record.pendingSync) {
          pendingList.add(record);
        }
      }
    }
    return pendingList;
  }

  /// Update local attendance record to mark as successfully synchronized
  Future<void> markRecordAsSynced(String attendanceId, DateTime syncedAt) async {
    final rawData = _attendanceBox.get(attendanceId);
    if (rawData != null) {
      final record = AttendanceRecordModel.fromMap(Map<String, dynamic>.from(rawData));
      final updated = record.copyWith(
        pendingSync: false,
        syncedAt: syncedAt,
      );
      await _attendanceBox.put(attendanceId, updated.toMap());
    }
  }

  /// Get locally cached attendance records for a student
  List<AttendanceRecordModel> getCachedStudentAttendance(String studentId, {String? classId}) {
    final List<AttendanceRecordModel> list = [];
    for (final key in _attendanceBox.keys) {
      final data = _attendanceBox.get(key);
      if (data != null) {
        final record = AttendanceRecordModel.fromMap(Map<String, dynamic>.from(data));
        if (record.studentId == studentId) {
          if (classId == null || classId.isEmpty || record.classId == classId) {
            list.add(record);
          }
        }
      }
    }
    list.sort((a, b) => b.sessionDate.compareTo(a.sessionDate));
    return list;
  }

  // ---------------------------------------------------------------------------
  // CLASS CACHE
  // ---------------------------------------------------------------------------

  Future<void> cacheClasses(List<ClassModel> classes) async {
    await _classesBox.clear();
    for (final c in classes) {
      await _classesBox.put(c.classId, c.toMap());
    }
  }

  List<ClassModel> getCachedClasses() {
    final List<ClassModel> list = [];
    for (final key in _classesBox.keys) {
      final data = _classesBox.get(key);
      if (data != null) {
        list.add(ClassModel.fromMap(Map<String, dynamic>.from(data)));
      }
    }
    return list;
  }

  // ---------------------------------------------------------------------------
  // ONBOARDING STATUS
  // ---------------------------------------------------------------------------

  bool hasCompletedOnboarding() {
    return _settingsBox.get('hasCompletedOnboarding', defaultValue: false) as bool;
  }

  Future<void> setCompletedOnboarding(bool completed) async {
    await _settingsBox.put('hasCompletedOnboarding', completed);
  }
}
