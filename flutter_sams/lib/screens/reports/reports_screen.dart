import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/class_provider.dart';
import '../../providers/report_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../core/theme/app_theme.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadReports();
    });
  }

  void _loadReports() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final reportProvider = Provider.of<ReportProvider>(context, listen: false);
    final classProvider = Provider.of<ClassProvider>(context, listen: false);

    if (auth.isTeacher) {
      if (classProvider.classes.isNotEmpty) {
        final c = classProvider.selectedClass ?? classProvider.classes.first;
        reportProvider.generateClassReport(
          classId: c.classId,
          enrolledStudents: classProvider.enrolledStudents,
        );
      }
    } else if (auth.isStudent && auth.user != null) {
      reportProvider.generateStudentPersonalReport(studentId: auth.user!.uid);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final reportProvider = Provider.of<ReportProvider>(context);
    final attProvider = Provider.of<AttendanceProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('Attendance Reports & Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadReports,
          ),
        ],
      ),
      body: auth.isTeacher
          ? _buildTeacherReportView(reportProvider)
          : _buildStudentReportView(attProvider),
    );
  }

  Widget _buildTeacherReportView(ReportProvider report) {
    final stats = report.overallClassStats;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Class Aggregated Summary
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Class Summary Statistics',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricTile(
                        label: 'Avg Attendance',
                        value: '${stats.percentage.toStringAsFixed(1)}%',
                        color: stats.isBelowThreshold ? AppTheme.errorRed : AppTheme.successGreen,
                      ),
                    ),
                    Expanded(
                      child: _buildMetricTile(
                        label: 'Below 75% Risk',
                        value: '${report.belowThresholdCount}',
                        color: AppTheme.warningOrange,
                      ),
                    ),
                    Expanded(
                      child: _buildMetricTile(
                        label: 'Total Sessions',
                        value: '${stats.totalSessions}',
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // 75% Threshold Alert if students flagged
          if (report.belowThresholdCount > 0)
            Container(
              margin: const EdgeInsets.only(bottom: 20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.errorRed.withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.errorRed.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppTheme.errorRed),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '${report.belowThresholdCount} student(s) below the 75% minimum attendance threshold.',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.errorRed),
                    ),
                  ),
                ],
              ),
            ),

          // Student Roster Breakdown
          const Text(
            'Enrolled Students Performance',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 12),

          if (report.studentReportItems.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Center(
                child: Text('No attendance data available for this class.'),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: report.studentReportItems.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final item = report.studentReportItems[i];
                final s = item.stats;

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: s.isBelowThreshold
                          ? AppTheme.errorRed.withOpacity(0.3)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: s.isBelowThreshold
                            ? AppTheme.errorRed.withOpacity(0.12)
                            : AppTheme.primaryBlue.withOpacity(0.12),
                        child: Text(
                          item.student.fullName.substring(0, 1),
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: s.isBelowThreshold ? AppTheme.errorRed : AppTheme.primaryBlue,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.student.fullName,
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${s.attendedSessions}/${s.totalSessions} Sessions Attended',
                              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${s.percentage.toStringAsFixed(1)}%',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: s.isBelowThreshold ? AppTheme.errorRed : AppTheme.successGreen,
                            ),
                          ),
                          if (s.isBelowThreshold)
                            const Text(
                              'Below 75%',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.errorRed),
                            ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildStudentReportView(AttendanceProvider att) {
    final records = att.studentRecords;
    final int total = records.length;
    final int attended = records.where((r) => r.isPresent).length;
    final int absent = records.where((r) => r.isAbsent).length;
    final double percentage = total > 0 ? (attended / total) * 100 : 0.0;
    final bool isBelow = total > 0 && percentage < 75.0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                const Text(
                  'My Academic Attendance Metric',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 12),
                Text(
                  total > 0 ? '${percentage.toStringAsFixed(1)}%' : 'No Data',
                  style: TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.w900,
                    color: isBelow ? AppTheme.errorRed : AppTheme.primaryBlue,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  isBelow
                      ? '⚠️ Below 75% required threshold.'
                      : '✓ Meeting institutional 75% requirement.',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isBelow ? AppTheme.errorRed : AppTheme.successGreen,
                  ),
                ),
                const SizedBox(height: 24),
                LinearProgressIndicator(
                  value: total > 0 ? (percentage / 100).clamp(0.0, 1.0) : 0,
                  backgroundColor: const Color(0xFFE2E8F0),
                  color: isBelow ? AppTheme.errorRed : AppTheme.successGreen,
                  minHeight: 10,
                  borderRadius: BorderRadius.circular(6),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  label: 'Attended',
                  value: '$attended',
                  color: AppTheme.successGreen,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricTile(
                  label: 'Absences',
                  value: '$absent',
                  color: AppTheme.errorRed,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricTile(
                  label: 'Total Sessions',
                  value: '$total',
                  color: AppTheme.primaryBlue,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricTile({
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}
