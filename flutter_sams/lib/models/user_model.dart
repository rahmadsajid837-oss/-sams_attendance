class UserModel {
  final String uid;
  final String fullName;
  final String email;
  final String phoneNumber;
  final String role; // 'teacher' or 'student'
  final String? institutionId;
  final String? fcmToken;
  final DateTime createdAt;

  UserModel({
    required this.uid,
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.role,
    this.institutionId,
    this.fcmToken,
    required this.createdAt,
  });

  bool get isTeacher => role.toLowerCase() == 'teacher';
  bool get isStudent => role.toLowerCase() == 'student';

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'fullName': fullName,
      'email': email,
      'phoneNumber': phoneNumber,
      'role': role,
      'institutionId': institutionId ?? 'INST-MAIN',
      'fcmToken': fcmToken,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory UserModel.fromMap(Map<String, dynamic> map, {String? docId}) {
    return UserModel(
      uid: (map['uid'] ?? docId ?? '') as String,
      fullName: (map['fullName'] ?? '') as String,
      email: (map['email'] ?? '') as String,
      phoneNumber: (map['phoneNumber'] ?? '') as String,
      role: (map['role'] ?? 'student') as String,
      institutionId: map['institutionId'] as String?,
      fcmToken: map['fcmToken'] as String?,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  UserModel copyWith({
    String? fullName,
    String? phoneNumber,
    String? fcmToken,
  }) {
    return UserModel(
      uid: uid,
      fullName: fullName ?? this.fullName,
      email: email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      role: role,
      institutionId: institutionId,
      fcmToken: fcmToken ?? this.fcmToken,
      createdAt: createdAt,
    );
  }
}
