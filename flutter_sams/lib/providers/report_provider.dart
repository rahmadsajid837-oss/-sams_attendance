import 'package:flutter/material.dart';
import '../models/attendance_model.dart';
import '../models/user_model.dart';
import '../services/firestore_service.dart';
import '../core/utils/attendance_calculator.dart';

class StudentReportItem {
  final UserModel student;
  final AttendanceStats stats;

  StudentReportItem({
    required this.student,
    required this.stats,
  });
}

class ReportProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();

  bool _isLoading = false;
  String? _errorMessage;

  // Teacher aggregated reports
  List<StudentReportItem> _studentReportItems = [];
  AttendanceStats _overallClassStats = AttendanceStats.empty();
  int _belowThresholdCount = 0;

  // Student personal report
  AttendanceStats _personalStats = AttendanceStats.empty();

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<StudentReportItem> get studentReportItems => _studentReportItems;
  AttendanceStats get overallClassStats => _overallClassStats;
  int get belowThresholdCount => _belowThresholdCount;
  AttendanceStats get personalStats => _personalStats;

  /// Generate Teacher class report
  Future<void> generateClassReport({
    required String classId,
    required List<UserModel> enrolledStudents,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final List<AttendanceRecordModel> records =
          await _firestoreService.getClassAttendanceRecords(classId);

      if (records.isEmpty) {
        _studentReportItems = [];
        _overallClassStats = AttendanceStats.empty();
        _belowThresholdCount = 0;
        _isLoading = false;
        notifyListeners();
        return;
      }

      // Group records by student
      final Map<String, List<AttendanceRecordModel>> recordsByStudent = {};
      for (final r in records) {
        recordsByStudent.putIfAbsent(r.studentId, () => []).add(r);
      }

      final List<StudentReportItem> items = [];
      int totalAttendedAll = 0;
      int totalSessionsAll = 0;
      int flaggedCount = 0;

      for (final student in enrolledStudents) {
        final studentRecords = recordsByStudent[student.uid] ?? [];
        final int total = studentRecords.length;
        final int attended = studentRecords.where((r) => r.isPresent).length;

        final stats = AttendanceCalculator.calculate(
          totalSessions: total,
          attendedSessions: attended,
        );

        if (stats.isBelowThreshold && total > 0) {
          flaggedCount++;
        }

        totalAttendedAll += attended;
        totalSessionsAll += total;

        items.add(StudentReportItem(student: student, stats: stats));
      }

      _studentReportItems = items;
      _belowThresholdCount = flaggedCount;
      _overallClassStats = AttendanceCalculator.calculate(
        totalSessions: totalSessionsAll,
        attendedSessions: totalAttendedAll,
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Failed to generate class report.';
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Generate Student personal report
  Future<void> generateStudentPersonalReport({
    required String studentId,
    String? classId,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final records = await _firestoreService.getStudentAttendanceRecords(
        studentId: studentId,
        classId: classId,
      );

      final int total = records.length;
      final int attended = records.where((r) => r.isPresent).length;

      _personalStats = AttendanceCalculator.calculate(
        totalSessions: total,
        attendedSessions: attended,
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Failed to compute attendance report.';
      _isLoading = false;
      notifyListeners();
    }
  }
}
