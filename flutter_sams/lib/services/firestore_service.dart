import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/class_model.dart';
import '../models/session_model.dart';
import '../models/attendance_model.dart';
import '../models/notification_model.dart';
import '../models/user_model.dart';
import '../core/constants/app_constants.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // ---------------------------------------------------------------------------
  // CLASSES
  // ---------------------------------------------------------------------------

  /// Create Class (Teacher only)
  Future<ClassModel> createClass({
    required String className,
    required String teacherId,
    String? classCode,
    String? description,
    String? institutionId,
  }) async {
    final DocumentReference docRef =
        _firestore.collection(AppConstants.classesCollection).doc();

    final ClassModel newClass = ClassModel(
      classId: docRef.id,
      className: className.trim(),
      classCode: classCode?.trim(),
      description: description?.trim(),
      teacherId: teacherId,
      institutionId: institutionId ?? 'INST-MAIN',
      enrolledStudentIds: [],
      createdAt: DateTime.now(),
    );

    await docRef.set(newClass.toMap());
    return newClass;
  }

  /// Get classes created by a specific teacher
  Future<List<ClassModel>> getTeacherClasses(String teacherId) async {
    final QuerySnapshot snapshot = await _firestore
        .collection(AppConstants.classesCollection)
        .where('teacherId', isEqualTo: teacherId)
        .get();

    return snapshot.docs
        .map((doc) => ClassModel.fromMap(doc.data() as Map<String, dynamic>, docId: doc.id))
        .toList();
  }

  /// Get enrolled classes for a student
  Future<List<ClassModel>> getStudentClasses(String studentId) async {
    final QuerySnapshot snapshot = await _firestore
        .collection(AppConstants.classesCollection)
        .where('enrolledStudentIds', arrayContains: studentId)
        .get();

    return snapshot.docs
        .map((doc) => ClassModel.fromMap(doc.data() as Map<String, dynamic>, docId: doc.id))
        .toList();
  }

  /// Get list of students enrolled in a class
  Future<List<UserModel>> getEnrolledStudents(List<String> studentIds) async {
    if (studentIds.isEmpty) return [];

    final List<UserModel> students = [];
    // Firestore supports 'whereIn' up to 30 items per batch
    for (int i = 0; i < studentIds.length; i += 30) {
      final sublist = studentIds.sublist(
        i,
        i + 30 > studentIds.length ? studentIds.length : i + 30,
      );

      final QuerySnapshot snapshot = await _firestore
          .collection(AppConstants.usersCollection)
          .where(FieldPath.documentId, whereIn: sublist)
          .get();

      students.addAll(
        snapshot.docs.map((doc) =>
            UserModel.fromMap(doc.data() as Map<String, dynamic>, docId: doc.id)),
      );
    }
    return students;
  }

  // ---------------------------------------------------------------------------
  // ATTENDANCE SESSIONS & DUPLICATE PREVENTIONS
  // ---------------------------------------------------------------------------

  /// Checks if an attendance session already exists for the given class and date.
  /// Enforces SRS Section 13: "Prevent duplicate attendance sessions for the same class and session date."
  Future<bool> checkSessionExists({
    required String classId,
    required String sessionDate,
  }) async {
    final QuerySnapshot snapshot = await _firestore
        .collection(AppConstants.sessionsCollection)
        .where('classId', isEqualTo: classId)
        .where('sessionDate', isEqualTo: sessionDate)
        .limit(1)
        .get();

    return snapshot.docs.isNotEmpty;
  }

  /// Record Attendance Session and Granular Student Records atomically
  Future<SessionModel> submitAttendanceSession({
    required String classId,
    required String teacherId,
    required String sessionDate,
    required String sessionTime,
    required List<AttendanceRecordModel> records,
  }) async {
    // 1. Strict Duplicate Check
    final bool isDuplicate = await checkSessionExists(
      classId: classId,
      sessionDate: sessionDate,
    );

    if (isDuplicate) {
      throw Exception('Attendance for this class and session has already been recorded.');
    }

    if (records.isEmpty) {
      throw Exception('Student list is empty. Cannot record attendance for empty session.');
    }

    // 2. Compute Summary
    final int presentCount = records.where((r) => r.isPresent).length;
    final int absentCount = records.where((r) => r.isAbsent).length;

    final DocumentReference sessionRef =
        _firestore.collection(AppConstants.sessionsCollection).doc();

    final SessionModel session = SessionModel(
      sessionId: sessionRef.id,
      classId: classId,
      teacherId: teacherId,
      sessionDate: sessionDate,
      sessionTime: sessionTime,
      totalPresent: presentCount,
      totalAbsent: absentCount,
      createdAt: DateTime.now(),
    );

    // 3. Firestore Batch Write for Atomicity
    final WriteBatch batch = _firestore.batch();
    batch.set(sessionRef, session.toMap());

    for (final record in records) {
      final DocumentReference recordRef = _firestore
          .collection(AppConstants.attendanceCollection)
          .doc(record.attendanceId);

      final updatedRecord = record.copyWith(
        pendingSync: false,
        syncedAt: DateTime.now(),
      );

      batch.set(recordRef, updatedRecord.toMap());
    }

    await batch.commit();
    return session;
  }

  // ---------------------------------------------------------------------------
  // ATTENDANCE RETRIEVAL (STUDENT & TEACHER)
  // ---------------------------------------------------------------------------

  /// Get attendance history for a single student (with optional class filter)
  Future<List<AttendanceRecordModel>> getStudentAttendanceRecords({
    required String studentId,
    String? classId,
  }) async {
    Query query = _firestore
        .collection(AppConstants.attendanceCollection)
        .where('studentId', isEqualTo: studentId);

    if (classId != null && classId.isNotEmpty) {
      query = query.where('classId', isEqualTo: classId);
    }

    final QuerySnapshot snapshot = await query.get();

    final list = snapshot.docs
        .map((doc) => AttendanceRecordModel.fromMap(
              doc.data() as Map<String, dynamic>,
              docId: doc.id,
            ))
        .toList();

    // Sort descending by sessionDate
    list.sort((a, b) => b.sessionDate.compareTo(a.sessionDate));
    return list;
  }

  /// Get all attendance records for a class (Teacher reports)
  Future<List<AttendanceRecordModel>> getClassAttendanceRecords(String classId) async {
    final QuerySnapshot snapshot = await _firestore
        .collection(AppConstants.attendanceCollection)
        .where('classId', isEqualTo: classId)
        .get();

    return snapshot.docs
        .map((doc) => AttendanceRecordModel.fromMap(
              doc.data() as Map<String, dynamic>,
              docId: doc.id,
            ))
        .toList();
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------

  /// Fetch notifications for a user
  Future<List<NotificationModel>> getUserNotifications(String userId) async {
    final QuerySnapshot snapshot = await _firestore
        .collection(AppConstants.notificationsCollection)
        .where('userId', isEqualTo: userId)
        .get();

    final list = snapshot.docs
        .map((doc) => NotificationModel.fromMap(
              doc.data() as Map<String, dynamic>,
              docId: doc.id,
            ))
        .toList();

    list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }

  /// Mark notification as read
  Future<void> markNotificationAsRead(String notificationId) async {
    await _firestore
        .collection(AppConstants.notificationsCollection)
        .doc(notificationId)
        .update({'read': true});
  }
}
