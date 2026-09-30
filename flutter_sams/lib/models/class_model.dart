class ClassModel {
  final String classId;
  final String className;
  final String? classCode;
  final String? description;
  final String teacherId;
  final String? institutionId;
  final List<String> enrolledStudentIds;
  final DateTime createdAt;

  ClassModel({
    required this.classId,
    required this.className,
    this.classCode,
    this.description,
    required this.teacherId,
    this.institutionId,
    this.enrolledStudentIds = const [],
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'classId': classId,
      'className': className,
      'classCode': classCode ?? '',
      'description': description ?? '',
      'teacherId': teacherId,
      'institutionId': institutionId ?? 'INST-MAIN',
      'enrolledStudentIds': enrolledStudentIds,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory ClassModel.fromMap(Map<String, dynamic> map, {String? docId}) {
    return ClassModel(
      classId: (map['classId'] ?? docId ?? '') as String,
      className: (map['className'] ?? '') as String,
      classCode: map['classCode'] as String?,
      description: map['description'] as String?,
      teacherId: (map['teacherId'] ?? '') as String,
      institutionId: map['institutionId'] as String?,
      enrolledStudentIds: List<String>.from(map['enrolledStudentIds'] ?? []),
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
