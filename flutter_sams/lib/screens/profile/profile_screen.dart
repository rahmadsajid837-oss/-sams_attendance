import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/connectivity_provider.dart';
import '../../providers/sync_provider.dart';
import '../../core/theme/app_theme.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _handleLogout(BuildContext context) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final syncProvider = Provider.of<SyncProvider>(context, listen: false);

    // Confirm dialog, noting offline records safety
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Logout'),
        content: Text(
          syncProvider.hasPending
              ? 'You have ${syncProvider.pendingCount} offline attendance records pending sync. These will remain securely preserved locally on this device.'
              : 'Are you sure you want to sign out from SAMS?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorRed),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await auth.signOut();
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final conn = Provider.of<ConnectivityProvider>(context);
    final syncProvider = Provider.of<SyncProvider>(context);
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('Profile & Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // User Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppTheme.primaryBlue.withOpacity(0.12),
                    child: Text(
                      user?.fullName.isNotEmpty == true ? user!.fullName.substring(0, 1) : 'U',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.primaryBlue),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? 'Authenticated User',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user?.email ?? '',
                          style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlue,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            (user?.role ?? 'User').toUpperCase(),
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Profile Info List
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildInfoTile(Icons.phone_rounded, 'Phone Number', user?.phoneNumber ?? 'N/A'),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  _buildInfoTile(Icons.account_balance_rounded, 'Institution', user?.institutionId ?? 'State University'),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  _buildInfoTile(
                    conn.isOnline ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                    'Network Status',
                    conn.isOnline ? 'Online (Firebase Connected)' : 'Offline (Hive Local Storage)',
                    valueColor: conn.isOnline ? AppTheme.successGreen : AppTheme.warningOrange,
                  ),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  _buildInfoTile(
                    Icons.cloud_sync_rounded,
                    'Offline Pending Records',
                    '${syncProvider.pendingCount} records waiting to sync',
                    valueColor: syncProvider.hasPending ? AppTheme.warningOrange : AppTheme.successGreen,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: AppTheme.errorRed),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  foregroundColor: AppTheme.errorRed,
                ),
                icon: const Icon(Icons.logout_rounded, color: AppTheme.errorRed),
                label: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w700)),
                onPressed: () => _handleLogout(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value, {Color? valueColor}) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryBlue, size: 22),
      title: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
      subtitle: Text(
        value,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: valueColor ?? AppTheme.textPrimary,
        ),
      ),
    );
  }
}
