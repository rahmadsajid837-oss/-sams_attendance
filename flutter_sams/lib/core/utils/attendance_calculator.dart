import '../constants/app_constants.dart';

class AttendanceStats {
  final int totalSessions;
  final int attendedSessions;
  final int absentSessions;
  final double percentage;
  final bool isBelowThreshold;

  const AttendanceStats({
    required this.totalSessions,
    required this.attendedSessions,
    required this.absentSessions,
    required this.percentage,
    required this.isBelowThreshold,
  });

  static AttendanceStats empty() {
    return const AttendanceStats(
      totalSessions: 0,
      attendedSessions: 0,
      absentSessions: 0,
      percentage: 0.0,
      isBelowThreshold: false,
    );
  }
}

class AttendanceCalculator {
  /// Calculates attendance metrics following the SRS Section 20 formula:
  /// Attendance Percentage = (Attended Sessions / Total Sessions) * 100
  static AttendanceStats calculate({
    required int totalSessions,
    required int attendedSessions,
    double threshold = AppConstants.minimumAttendancePercentage,
  }) {
    if (totalSessions <= 0) {
      return AttendanceStats.empty();
    }

    final int safeAttended = attendedSessions.clamp(0, totalSessions);
    final int absentSessions = totalSessions - safeAttended;
    final double rawPercentage = (safeAttended / totalSessions) * 100.0;
    final double percentage = double.parse(rawPercentage.toStringAsFixed(1));
    final bool isBelowThreshold = percentage < threshold;

    return AttendanceStats(
      totalSessions: totalSessions,
      attendedSessions: safeAttended,
      absentSessions: absentSessions,
      percentage: percentage,
      isBelowThreshold: isBelowThreshold,
    );
  }
}
