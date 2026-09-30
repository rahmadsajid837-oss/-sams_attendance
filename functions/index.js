/**
 * Smart Attendance Management System (SAMS)
 * Firebase Cloud Functions (SRS Section 4.5: Notifications & Alerts)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Triggered on creation of an attendance record.
 * Sends an immediate FCM push notification to the student device (SRS Section 4.5.4)
 */
exports.onAttendanceRecordCreated = functions.firestore
  .document('attendance_records/{attendanceId}')
  .onCreate(async (snap, context) => {
    const record = snap.data();
    if (!record) return null;

    const { studentId, classId, sessionDate, status } = record;
    if (!studentId) return null;

    try {
      // 1. Fetch student profile to get registered FCM token
      const userDoc = await admin.firestore().collection('users').doc(studentId).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      if (!fcmToken) {
        console.log(`No FCM token registered for student ${studentId}`);
        return null;
      }

      // 2. Fetch class name if available
      let className = 'Class';
      if (classId) {
        const classDoc = await admin.firestore().collection('classes').doc(classId).get();
        if (classDoc.exists && classDoc.data().className) {
          className = classDoc.data().className;
        }
      }

      const isAbsent = (status || '').toLowerCase() === 'absent';
      const title = isAbsent ? 'Attendance Alert' : 'Attendance Recorded';
      const body = isAbsent
        ? `You were marked Absent in ${className} on ${sessionDate}.`
        : `${className} — ${sessionDate} — Present`;

      // 3. Dispatch FCM Push Payload
      const message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: isAbsent ? 'absence_alert' : 'attendance_update',
          classId: classId || '',
          className,
          sessionDate: sessionDate || '',
          status: status || '',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: isAbsent ? 'high' : 'normal',
          notification: {
            sound: 'default',
            channelId: 'sams_attendance_alerts',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`FCM notification sent successfully to ${studentId}:`, response);

      // 4. Check cumulative 75% attendance threshold (SRS Section 20 & 4.6)
      await verifyAttendanceThresholdAndAlert(studentId, classId, className, fcmToken);

      return response;
    } catch (error) {
      console.error('Error sending attendance push notification:', error);
      return null;
    }
  });

/**
 * Checks if student attendance has dropped below 75% threshold and sends warning alert
 */
async function verifyAttendanceThresholdAndAlert(studentId, classId, className, fcmToken) {
  try {
    const recordsSnapshot = await admin.firestore()
      .collection('attendance_records')
      .where('studentId', '==', studentId)
      .where('classId', '==', classId)
      .get();

    if (recordsSnapshot.empty) return;

    const total = recordsSnapshot.size;
    let attended = 0;

    recordsSnapshot.forEach((doc) => {
      const data = doc.data();
      if ((data.status || '').toLowerCase() === 'present') {
        attended++;
      }
    });

    const percentage = (attended / total) * 100;

    // SRS Section 20: If percentage < 75.0%
    if (percentage < 75.0 && total >= 3) {
      const warningMessage = {
        token: fcmToken,
        notification: {
          title: '⚠️ Academic Attendance Warning',
          body: `Your attendance in ${className} is currently ${percentage.toFixed(1)}%, which is below the mandatory 75% threshold.`,
        },
        data: {
          type: 'threshold_warning',
          percentage: percentage.toFixed(1),
          classId,
          className,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'sams_warnings',
          },
        },
      };

      await admin.messaging().send(warningMessage);
      console.log(`Below 75% threshold warning dispatched to student ${studentId} (${percentage.toFixed(1)}%)`);
    }
  } catch (err) {
    console.error('Error verifying attendance threshold:', err);
  }
}
