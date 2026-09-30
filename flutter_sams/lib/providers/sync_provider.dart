import 'dart:async';
import 'package:flutter/material.dart';
import '../services/sync_service.dart';
import '../services/local_database_service.dart';
import '../services/connectivity_service.dart';

class SyncProvider extends ChangeNotifier {
  final SyncService _syncService = SyncService();
  final LocalDatabaseService _localDb = LocalDatabaseService();
  final ConnectivityService _connectivityService = ConnectivityService();

  StreamSubscription<bool>? _connectivitySub;
  bool _isSyncing = false;
  int _pendingCount = 0;
  String? _syncMessage;

  bool get isSyncing => _isSyncing;
  int get pendingCount => _pendingCount;
  String? get syncMessage => _syncMessage;
  bool get hasPending => _pendingCount > 0;

  SyncProvider() {
    _init();
  }

  void _init() {
    updatePendingCount();

    // Listen to network transitions
    _connectivitySub = _connectivityService.connectionStream.listen((isOnline) {
      if (isOnline) {
        // Automatically trigger synchronization when connectivity returns (Section 15 & 63)
        triggerAutoSync();
      }
    });
  }

  void updatePendingCount() {
    _pendingCount = _localDb.getPendingSyncRecords().length;
    notifyListeners();
  }

  /// Trigger sync manually or automatically upon reconnection
  Future<void> triggerAutoSync() async {
    updatePendingCount();
    if (_pendingCount == 0 || _isSyncing) return;

    _isSyncing = true;
    _syncMessage = 'Syncing offline attendance...';
    notifyListeners();

    try {
      final result = await _syncService.syncPendingAttendance();
      updatePendingCount();

      if (result.hasSyncedAny) {
        _syncMessage = 'Attendance synced successfully (${result.synced} records).';
      } else if (result.hasFailures) {
        _syncMessage = 'Sync failed. Will retry when connection improves.';
      }
    } catch (_) {
      _syncMessage = 'Sync failed. Records preserved locally.';
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }
}
