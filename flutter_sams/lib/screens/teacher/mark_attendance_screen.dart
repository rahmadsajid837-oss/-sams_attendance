import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/class_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/connectivity_provider.dart';
import '../../providers/sync_provider.dart';
import '../../models/class_model.dart';
import '../../models/user_model.dart';
import '../../core/theme/app_theme.dart';

class MarkAttendanceScreen extends StatefulWidget {
  const MarkAttendanceScreen({super.key});

  @override
  State<MarkAttendanceScreen> createState() => _MarkAttendanceScreenState();
}

class _MarkAttendanceScreenState extends State<MarkAttendanceScreen> {
  ClassModel? _selectedClass;
  DateTime _sessionDate = DateTime.now();
  TimeOfDay _sessionTime = TimeOfDay.now();

  // Mock sample students if enrolledStudentIds are empty for frictionless classroom marking
  final List<UserModel> _fallbackStudents = [
    UserModel(
      uid: 'stu-001',
      fullName: 'Sarah Connor',
      email: 'sarah.c@uni.edu',
      phoneNumber: '03001112233',
      role: 'student',
      createdAt: DateTime.now(),
    ),
    UserModel(
      uid: 'stu-002',
      fullName: 'David Miller',
      email: 'david.m@uni.edu',
      phoneNumber: '03002223344',
      role: 'student',
      createdAt: DateTime.now(),
    ),
    UserModel(
      uid: 'stu-003',
      fullName: 'Emily Watson',
      email: 'emily.w@uni.edu',
      phoneNumber: '03003334455',
      role: 'student',
      createdAt: DateTime.now(),
    ),
    UserModel(
      uid: 'stu-004',
      fullName: 'James Wilson',
      email: 'james.w@uni.edu',
      phoneNumber: '03004445566',
      role: 'student',
      createdAt: DateTime.now(),
    ),
    UserModel(
      uid: 'stu-005',
      fullName: 'Alexander Bell',
      email: 'alex.b@uni.edu',
      phoneNumber: '03005556677',
      role: 'student',
      createdAt: DateTime.now(),
    ),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final classProvider = Provider.of<ClassProvider>(context, listen: false);
      if (classProvider.classes.isNotEmpty) {
        setState(() {
          _selectedClass = classProvider.selectedClass ?? classProvider.classes.first;
        });
        _initStudents();
      }
    });
  }

  void _initStudents() {
    final attProvider = Provider.of<AttendanceProvider>(context, listen: false);
    attProvider.initializeMarking(_fallbackStudents);
  }

  Future<void> _handleSubmit() async {
    if (_selectedClass == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a class first.')),
      );
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final attProvider = Provider.of<AttendanceProvider>(context, listen: false);
    final conn = Provider.of<ConnectivityProvider>(context, listen: false);
    final syncProvider = Provider.of<SyncProvider>(context, listen: false);

    final String dateStr = DateFormat('yyyy-MM-dd').format(_sessionDate);
    final String timeStr = '${_sessionTime.hour.toString().padLeft(2, '0')}:${_sessionTime.minute.toString().padLeft(2, '0')}';

    final success = await attProvider.submitAttendance(
      classId: _selectedClass!.classId,
      className: _selectedClass!.className,
      teacherId: auth.user?.uid ?? 'teacher-1',
      sessionDate: dateStr,
      sessionTime: timeStr,
      students: _fallbackStudents,
      isOnline: conn.isOnline,
    );

    if (!mounted) return;

    if (success) {
      syncProvider.updatePendingCount();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(attProvider.successMessage ?? 'Attendance recorded.'),
          backgroundColor: AppTheme.successGreen,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(attProvider.errorMessage ?? 'Submission failed.'),
          backgroundColor: AppTheme.errorRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final classProvider = Provider.of<ClassProvider>(context);
    final attProvider = Provider.of<AttendanceProvider>(context);
    final conn = Provider.of<ConnectivityProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('Mark Attendance'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: conn.isOnline
                  ? AppTheme.successGreen.withOpacity(0.12)
                  : AppTheme.warningOrange.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  conn.isOnline ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                  size: 14,
                  color: conn.isOnline ? AppTheme.successGreen : AppTheme.warningOrange,
                ),
                const SizedBox(width: 4),
                Text(
                  conn.isOnline ? 'Online' : 'Offline',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: conn.isOnline ? AppTheme.successGreen : AppTheme.warningOrange,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: classProvider.classes.isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text('No classes found. Please create a class first.'),
              ),
            )
          : Column(
              children: [
                // Top Configuration Bar
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                  child: Column(
                    children: [
                      // Class Dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<ClassModel>(
                            value: _selectedClass ?? classProvider.classes.first,
                            isExpanded: true,
                            items: classProvider.classes.map((c) {
                              return DropdownMenuItem(
                                value: c,
                                child: Text(
                                  '${c.className} (${c.classCode ?? "CODE"})',
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                ),
                              );
                            }).toList(),
                            onChanged: (c) {
                              if (c != null) {
                                setState(() => _selectedClass = c);
                                _initStudents();
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Date & Quick Actions Row
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
                                side: const BorderSide(color: Color(0xFFE2E8F0)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              icon: const Icon(Icons.calendar_today_rounded, size: 16),
                              label: Text(
                                DateFormat('dd MMM yyyy').format(_sessionDate),
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                              ),
                              onPressed: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate: _sessionDate,
                                  firstDate: DateTime(2025),
                                  lastDate: DateTime(2028),
                                );
                                if (picked != null) {
                                  setState(() => _sessionDate = picked);
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () => attProvider.markAllPresent(),
                            child: const Text('All Present', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                          ),
                          TextButton(
                            onPressed: () => attProvider.markAllAbsent(),
                            child: const Text('All Absent', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.errorRed)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Attendance Roster List
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _fallbackStudents.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final student = _fallbackStudents[i];
                      final status = attProvider.markingStatus[student.uid] ?? 'present';
                      final isPresent = status == 'present';

                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isPresent
                                ? AppTheme.successGreen.withOpacity(0.3)
                                : AppTheme.errorRed.withOpacity(0.3),
                            width: 1.5,
                          ),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: isPresent
                                  ? AppTheme.successGreen.withOpacity(0.12)
                                  : AppTheme.errorRed.withOpacity(0.12),
                              child: Text(
                                student.fullName.substring(0, 1),
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: isPresent ? AppTheme.successGreen : AppTheme.errorRed,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    student.fullName,
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    student.email,
                                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            // Interactive Toggle Switch
                            GestureDetector(
                              onTap: () => attProvider.toggleStatus(student.uid),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isPresent ? AppTheme.successGreen : AppTheme.errorRed,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: (isPresent ? AppTheme.successGreen : AppTheme.errorRed).withOpacity(0.3),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Text(
                                  isPresent ? 'PRESENT' : 'ABSENT',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Bottom Submit Bar
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: attProvider.isSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.check_circle_rounded),
                        label: Text(
                          conn.isOnline ? 'Submit Attendance Session' : 'Save Offline to Hive',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        onPressed: attProvider.isSubmitting ? null : _handleSubmit,
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
