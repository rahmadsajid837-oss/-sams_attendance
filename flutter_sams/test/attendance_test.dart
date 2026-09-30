import 'package:flutter_test/flutter_test.dart';
import 'package:sams_attendance/core/utils/attendance_calculator.dart';
import 'package:sams_attendance/core/constants/app_constants.dart';

void main() {
  group('Attendance Calculation & 75% Threshold Tests (SRS Section 20 & 64)', () {
    test('Calculates exact percentage: 17/20 = 85.0% (Above threshold)', () {
      final stats = AttendanceCalculator.calculate(
        totalSessions: 20,
        attendedSessions: 17,
      );

      expect(stats.totalSessions, 20);
      expect(stats.attendedSessions, 17);
      expect(stats.absentSessions, 3);
      expect(stats.percentage, 85.0);
      expect(stats.isBelowThreshold, false);
    });

    test('Flags student below 75% threshold: 14/20 = 70.0%', () {
      final stats = AttendanceCalculator.calculate(
        totalSessions: 20,
        attendedSessions: 14,
      );

      expect(stats.totalSessions, 20);
      expect(stats.attendedSessions, 14);
      expect(stats.absentSessions, 6);
      expect(stats.percentage, 70.0);
      expect(stats.isBelowThreshold, true);
    });

    test('Boundary test: Exactly 75.0% is NOT below threshold (15/20)', () {
      final stats = AttendanceCalculator.calculate(
        totalSessions: 20,
        attendedSessions: 15,
      );

      expect(stats.percentage, 75.0);
      expect(stats.isBelowThreshold, false);
    });

    test('Zero total sessions yields empty stats without division by zero', () {
      final stats = AttendanceCalculator.calculate(
        totalSessions: 0,
        attendedSessions: 0,
      );

      expect(stats.totalSessions, 0);
      expect(stats.percentage, 0.0);
      expect(stats.isBelowThreshold, false);
    });
  });

  group('Validation Rules (SRS Section 5)', () {
    test('Email regex validates standard and university emails', () {
      expect(AppConstants.emailRegex.hasMatch('prof.turing@cambridge.edu'), true);
      expect(AppConstants.emailRegex.hasMatch('student123@uni.ac.uk'), true);
      expect(AppConstants.emailRegex.hasMatch('invalid-email'), false);
      expect(AppConstants.emailRegex.hasMatch('user@domain'), false);
    });

    test('Phone number requires exactly 11 digits', () {
      expect(AppConstants.phoneRegex.hasMatch('03001234567'), true);
      expect(AppConstants.phoneRegex.hasMatch('1234567890'), false); // 10 digits
      expect(AppConstants.phoneRegex.hasMatch('123456789012'), false); // 12 digits
      expect(AppConstants.phoneRegex.hasMatch('0300123456a'), false); // non-digit
    });
  });
}
