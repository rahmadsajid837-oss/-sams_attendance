import 'package:flutter/material.dart';
import '../models/class_model.dart';
import '../models/user_model.dart';
import '../services/firestore_service.dart';
import '../services/local_database_service.dart';

class ClassProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();
  final LocalDatabaseService _localDb = LocalDatabaseService();

  List<ClassModel> _classes = [];
  ClassModel? _selectedClass;
  List<UserModel> _enrolledStudents = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<ClassModel> get classes => _classes;
  ClassModel? get selectedClass => _selectedClass;
  List<UserModel> get enrolledStudents => _enrolledStudents;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Load classes for a teacher (with offline cache fallback)
  Future<void> loadTeacherClasses(String teacherId, {bool isOnline = true}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (isOnline) {
        _classes = await _firestoreService.getTeacherClasses(teacherId);
        // Cache to Hive
        await _localDb.cacheClasses(_classes);
      } else {
        // Fallback to Hive cache
        _classes = _localDb.getCachedClasses();
      }
    } catch (e) {
      _classes = _localDb.getCachedClasses();
      _errorMessage = 'Could not fetch live classes. Loaded cached data.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load enrolled classes for a student
  Future<void> loadStudentClasses(String studentId, {bool isOnline = true}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (isOnline) {
        _classes = await _firestoreService.getStudentClasses(studentId);
      } else {
        _classes = _localDb.getCachedClasses();
      }
    } catch (e) {
      _errorMessage = 'Failed to load classes.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Create a new class (Teacher only)
  Future<ClassModel?> createClass({
    required String className,
    required String teacherId,
    String? classCode,
    String? description,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final newClass = await _firestoreService.createClass(
        className: className,
        teacherId: teacherId,
        classCode: classCode,
        description: description,
      );

      _classes.insert(0, newClass);
      await _localDb.cacheClasses(_classes);

      _isLoading = false;
      notifyListeners();
      return newClass;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  void selectClass(ClassModel? c) {
    _selectedClass = c;
    notifyListeners();
  }

  Future<void> loadEnrolledStudents(List<String> studentIds) async {
    _isLoading = true;
    notifyListeners();

    try {
      _enrolledStudents = await _firestoreService.getEnrolledStudents(studentIds);
    } catch (_) {
      _enrolledStudents = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
