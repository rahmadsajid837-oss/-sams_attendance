import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _connectionChangeController =
      StreamController<bool>.broadcast();

  bool _isOnline = true;
  bool get isOnline => _isOnline;
  Stream<bool> get connectionStream => _connectionChangeController.stream;

  ConnectivityService() {
    _init();
  }

  void _init() {
    _connectivity.onConnectivityChanged.listen((ConnectivityResult result) {
      _checkStatus(result);
    });
    _checkInitial();
  }

  Future<void> _checkInitial() async {
    final result = await _connectivity.checkConnectivity();
    _checkStatus(result);
  }

  void _checkStatus(ConnectivityResult result) {
    final bool online = result != ConnectivityResult.none;
    if (_isOnline != online) {
      _isOnline = online;
      _connectionChangeController.add(_isOnline);
    }
  }

  void dispose() {
    _connectionChangeController.close();
  }
}
