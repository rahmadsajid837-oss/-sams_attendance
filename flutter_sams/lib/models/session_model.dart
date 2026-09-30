class SessionModel {
  final String sessionId;
  final String classId;
  final String teacherId;
  final String sessionDate; // YYYY-MM-DD
  final String sessionTime; // HH:mm
  final int totalPresent;
  final int totalAbsent;
  final DateTime createdAt;

  SessionModel({
    required this.sessionId,
    required this.classId,
    required this.teacherId,
    required this.sessionDate,
    required this.sessionTime,
    this.totalPresent = 0,
    this.totalAbsent = 0,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'sessionId': sessionId,
      'classId': classId,
      'teacherId': teacherId,
      'sessionDate': sessionDate,
      'sessionTime': sessionTime,
      'totalPresent': totalPresent,
      'totalAbsent': totalAbsent,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory SessionModel.fromMap(Map<String, dynamic> map, {String? docId}) {
    return SessionModel(
      sessionId: (map['sessionId'] ?? docId ?? '') as String,
      classId: (map['classId'] ?? '') as String,
      teacherId: (map['teacherId'] ?? '') as String,
      sessionDate: (map['sessionDate'] ?? '') as String,
      sessionTime: (map['sessionTime'] ?? '') as String,
      totalPresent: (map['totalPresent'] ?? 0) as int,
      totalAbsent: (map['totalAbsent'] ?? 0) as int,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
