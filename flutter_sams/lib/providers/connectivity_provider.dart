import 'package:flutter/material.dart';
import '../services/connectivity_service.dart';

class ConnectivityProvider extends ChangeNotifier {
  final ConnectivityService _service = ConnectivityService();
  bool _isOnline = true;

  bool get isOnline => _isOnline;
  bool get isOffline => !_isOnline;

  ConnectivityProvider() {
    _isOnline = _service.isOnline;
    _service.connectionStream.listen((online) {
      _isOnline = online;
      notifyListeners();
    });
  }
}
