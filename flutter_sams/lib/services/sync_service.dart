import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/attendance_model.dart';
import '../core/constants/app_constants.dart';
import 'local_database_service.dart';

class SyncService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final LocalDatabaseService _localDb = LocalDatabaseService();

  bool _isSyncing = false;
  bool get isSyncing => _isSyncing;

  /// Synchronize all pending offline attendance records with Firestore
  /// Following the SRS Section 63 Idempotent Sync Algorithm
  Future<SyncResult> syncPendingAttendance() async {
    if (_isSyncing) {
      return SyncResult(total: 0, synced: 0, failed: 0);
    }

    _isSyncing = true;
    int syncedCount = 0;
    int failedCount = 0;

    try {
      final List<AttendanceRecordModel> pendingRecords = _localDb.getPendingSyncRecords();

      if (pendingRecords.isEmpty) {
        _isSyncing = false;
        return SyncResult(total: 0, synced: 0, failed: 0);
      }

      for (final record in pendingRecords) {
        try {
          final docRef = _firestore
              .collection(AppConstants.attendanceCollection)
              .doc(record.attendanceId);

          // 1. Idempotency Check: check if already exists in Firestore
          final docSnap = await docRef.get();
          final DateTime now = DateTime.now();

          if (docSnap.exists) {
            // Already synced upstream; reconcile local state
            await _localDb.markRecordAsSynced(record.attendanceId, now);
            syncedCount++;
          } else {
            // 2. Upload to Firestore
            final updatedRecord = record.copyWith(
              pendingSync: false,
              syncedAt: now,
            );

            await docRef.set(updatedRecord.toMap());

            // 3. Mark local as synced only AFTER confirmed write
            await _localDb.markRecordAsSynced(record.attendanceId, now);
            syncedCount++;
          }
        } catch (e) {
          // Keep pendingSync = true for retry on next network event
          failedCount++;
        }
      }

      return SyncResult(
        total: pendingRecords.length,
        synced: syncedCount,
        failed: failedCount,
      );
    } finally {
      _isSyncing = false;
    }
  }
}

class SyncResult {
  final int total;
  final int synced;
  final int failed;

  SyncResult({
    required this.total,
    required this.synced,
    required this.failed,
  });

  bool get hasSyncedAny => synced > 0;
  bool get hasFailures => failed > 0;
}
