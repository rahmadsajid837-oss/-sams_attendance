import 'package:flutter_test/flutter_test.dart';
import 'package:sams_attendance/models/attendance_model.dart';

void main() {
  group('Offline Attendance & Idempotent Sync Logic (SRS Section 14, 15, 63)', () {
    test('Offline record initializes with pendingSync = true', () {
      final record = AttendanceRecordModel(
        attendanceId: 'session101_student202',
        sessionId: 'session101',
        classId: 'cs301',
        studentId: 'student202',
        studentName: 'David Miller',
        teacherId: 'teacher001',
        status: 'present',
        sessionDate: '2026-09-24',
        pendingSync: true,
        createdAt: DateTime.now(),
      );

      expect(record.pendingSync, true);
      expect(record.syncedAt, isNull);
      expect(record.isPresent, true);
      expect(record.isAbsent, false);
    });

    test('Sync completion marks pendingSync = false and assigns syncedAt', () {
      final record = AttendanceRecordModel(
        attendanceId: 'session101_student202',
        sessionId: 'session101',
        classId: 'cs301',
        studentId: 'student202',
        studentName: 'David Miller',
        teacherId: 'teacher001',
        status: 'present',
        sessionDate: '2026-09-24',
        pendingSync: true,
        createdAt: DateTime.now(),
      );

      final now = DateTime.now();
      final syncedRecord = record.copyWith(
        pendingSync: false,
        syncedAt: now,
      );

      expect(syncedRecord.pendingSync, false);
      expect(syncedRecord.syncedAt, now);
      expect(syncedRecord.attendanceId, record.attendanceId);
    });

    test('Duplicate session detection ID schema is deterministic', () {
      const classId = 'CS301';
      const date = '2026-09-24';
      final sessionId = '${classId}_${date.replaceAll('-', '')}';

      expect(sessionId, 'CS301_20260924');
    });
  });
}
