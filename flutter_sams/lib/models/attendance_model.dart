class AttendanceRecordModel {
  final String attendanceId;
  final String sessionId;
  final String classId;
  final String studentId;
  final String studentName;
  final String teacherId;
  final String status; // 'present' or 'absent'
  final String sessionDate;
  final bool pendingSync;
  final DateTime? syncedAt;
  final DateTime createdAt;

  AttendanceRecordModel({
    required this.attendanceId,
    required this.sessionId,
    required this.classId,
    required this.studentId,
    required this.studentName,
    required this.teacherId,
    required this.status,
    required this.sessionDate,
    this.pendingSync = false,
    this.syncedAt,
    required this.createdAt,
  });

  bool get isPresent => status.toLowerCase() == 'present';
  bool get isAbsent => status.toLowerCase() == 'absent';

  Map<String, dynamic> toMap() {
    return {
      'attendanceId': attendanceId,
      'sessionId': sessionId,
      'classId': classId,
      'studentId': studentId,
      'studentName': studentName,
      'teacherId': teacherId,
      'status': status,
      'sessionDate': sessionDate,
      'pendingSync': pendingSync,
      'syncedAt': syncedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory AttendanceRecordModel.fromMap(Map<String, dynamic> map, {String? docId}) {
    return AttendanceRecordModel(
      attendanceId: (map['attendanceId'] ?? docId ?? '') as String,
      sessionId: (map['sessionId'] ?? '') as String,
      classId: (map['classId'] ?? '') as String,
      studentId: (map['studentId'] ?? '') as String,
      studentName: (map['studentName'] ?? 'Student') as String,
      teacherId: (map['teacherId'] ?? '') as String,
      status: (map['status'] ?? 'absent') as String,
      sessionDate: (map['sessionDate'] ?? '') as String,
      pendingSync: (map['pendingSync'] ?? false) as bool,
      syncedAt: map['syncedAt'] != null
          ? DateTime.tryParse(map['syncedAt'].toString())
          : null,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  AttendanceRecordModel copyWith({
    String? status,
    bool? pendingSync,
    DateTime? syncedAt,
  }) {
    return AttendanceRecordModel(
      attendanceId: attendanceId,
      sessionId: sessionId,
      classId: classId,
      studentId: studentId,
      studentName: studentName,
      teacherId: teacherId,
      status: status ?? this.status,
      sessionDate: sessionDate,
      pendingSync: pendingSync ?? this.pendingSync,
      syncedAt: syncedAt ?? this.syncedAt,
      createdAt: createdAt,
    );
  }
}
