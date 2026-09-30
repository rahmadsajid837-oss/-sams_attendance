import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final NotificationService _notificationService = NotificationService();

  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;
  bool get isTeacher => _user?.isTeacher ?? false;
  bool get isStudent => _user?.isStudent ?? false;

  /// Check initial auth state on app startup
  Future<void> checkCurrentUser() async {
    _isLoading = true;
    notifyListeners();

    try {
      final User? firebaseUser = _authService.currentUser;
      if (firebaseUser != null) {
        _user = await _authService.getUserProfile(firebaseUser.uid);
        // Register FCM
        _notificationService.initializeFcm(firebaseUser.uid);
      } else {
        _user = null;
      }
    } catch (e) {
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Sign In with Email and Password
  Future<bool> signIn(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _user = await _authService.signInWithEmailPassword(
        email: email,
        password: password,
      );
      if (_user != null) {
        _notificationService.initializeFcm(_user!.uid);
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } on FirebaseAuthException catch (e) {
      _errorMessage = _mapFirebaseAuthError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Authentication failed. Please verify credentials.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Sign Up with Email and Password
  Future<bool> signUp({
    required String fullName,
    required String email,
    required String password,
    required String role,
    required String phoneNumber,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _user = await _authService.signUpWithEmailPassword(
        fullName: fullName,
        email: email,
        password: password,
        role: role,
        phoneNumber: phoneNumber,
      );
      if (_user != null) {
        _notificationService.initializeFcm(_user!.uid);
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } on FirebaseAuthException catch (e) {
      _errorMessage = _mapFirebaseAuthError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Sign In with Google
  Future<bool> signInWithGoogle({String defaultRole = 'student'}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _user = await _authService.signInWithGoogle(defaultRole: defaultRole);
      if (_user != null) {
        _notificationService.initializeFcm(_user!.uid);
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Sign Out (Preserves pending offline attendance records as required by Section 47)
  Future<void> signOut() async {
    await _authService.signOut();
    _user = null;
    notifyListeners();
  }

  String _mapFirebaseAuthError(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return 'Invalid email or password';
      case 'email-already-in-use':
        return 'Email already in use';
      case 'weak-password':
        return 'Weak password. Minimum 8 characters required.';
      case 'invalid-email':
        return 'Invalid email format';
      case 'network-request-failed':
        return 'Network unavailable. Please check your connection.';
      default:
        return e.message ?? 'Authentication failed.';
    }
  }
}
