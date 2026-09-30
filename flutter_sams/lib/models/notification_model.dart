class NotificationModel {
  final String notificationId;
  final String userId;
  final String title;
  final String message;
  final String type; // 'attendance_update', 'absence_alert', 'class_reminder'
  final String? classId;
  final String? sessionId;
  final bool read;
  final DateTime createdAt;

  NotificationModel({
    required this.notificationId,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    this.classId,
    this.sessionId,
    this.read = false,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'notificationId': notificationId,
      'userId': userId,
      'title': title,
      'message': message,
      'type': type,
      'classId': classId,
      'sessionId': sessionId,
      'read': read,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory NotificationModel.fromMap(Map<String, dynamic> map, {String? docId}) {
    return NotificationModel(
      notificationId: (map['notificationId'] ?? docId ?? '') as String,
      userId: (map['userId'] ?? '') as String,
      title: (map['title'] ?? '') as String,
      message: (map['message'] ?? '') as String,
      type: (map['type'] ?? 'attendance_update') as String,
      classId: map['classId'] as String?,
      sessionId: map['sessionId'] as String?,
      read: (map['read'] ?? false) as bool,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  NotificationModel copyWith({bool? read}) {
    return NotificationModel(
      notificationId: notificationId,
      userId: userId,
      title: title,
      message: message,
      type: type,
      classId: classId,
      sessionId: sessionId,
      read: read ?? this.read,
      createdAt: createdAt,
    );
  }
}
