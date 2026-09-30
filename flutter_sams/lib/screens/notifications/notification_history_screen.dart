import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import '../../core/theme/app_theme.dart';

class NotificationHistoryScreen extends StatelessWidget {
  const NotificationHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final notifProvider = Provider.of<NotificationProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('Notifications & Alerts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              if (auth.user != null) {
                notifProvider.loadNotifications(auth.user!.uid);
              }
            },
          ),
        ],
      ),
      body: notifProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : notifProvider.notifications.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.notifications_none_rounded, size: 56, color: AppTheme.textSecondary),
                        const SizedBox(height: 16),
                        const Text(
                          'No notifications yet.',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Attendance alerts and reminders will appear here in real-time.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: notifProvider.notifications.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final n = notifProvider.notifications[i];
                    final bool isAlert = n.type == 'absence_alert';

                    return GestureDetector(
                      onTap: () => notifProvider.markAsRead(n.notificationId),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: n.read ? Colors.white : const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: n.read
                                ? const Color(0xFFE2E8F0)
                                : isAlert ? AppTheme.errorRed.withOpacity(0.3) : AppTheme.successGreen.withOpacity(0.3),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              backgroundColor: isAlert
                                  ? AppTheme.errorRed.withOpacity(0.12)
                                  : AppTheme.primaryBlue.withOpacity(0.12),
                              child: Icon(
                                isAlert ? Icons.warning_rounded : Icons.notifications_active_rounded,
                                color: isAlert ? AppTheme.errorRed : AppTheme.primaryBlue,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        n.title,
                                        style: TextStyle(
                                          fontWeight: n.read ? FontWeight.w600 : FontWeight.w800,
                                          fontSize: 14,
                                          color: isAlert ? AppTheme.errorRed : AppTheme.textPrimary,
                                        ),
                                      ),
                                      Text(
                                        DateFormat('dd MMM HH:mm').format(n.createdAt),
                                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    n.message,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: n.read ? AppTheme.textSecondary : AppTheme.textPrimary,
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
