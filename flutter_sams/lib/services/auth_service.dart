import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user_model.dart';
import '../core/constants/app_constants.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Sign Up with Email and Password and save User Profile to Firestore
  Future<UserModel> signUpWithEmailPassword({
    required String fullName,
    required String email,
    required String password,
    required String role,
    required String phoneNumber,
    String? institutionId,
  }) async {
    // 1. Create Firebase Auth user
    final UserCredential credential = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );

    final User? firebaseUser = credential.user;
    if (firebaseUser == null) {
      throw FirebaseAuthException(
        code: 'user-null',
        message: 'Failed to create user account.',
      );
    }

    // 2. Create User Profile Model
    final UserModel newUser = UserModel(
      uid: firebaseUser.uid,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      role: role.toLowerCase(),
      institutionId: institutionId ?? 'INST-MAIN',
      createdAt: DateTime.now(),
    );

    // 3. Save to Firestore
    await _firestore
        .collection(AppConstants.usersCollection)
        .doc(firebaseUser.uid)
        .set(newUser.toMap());

    // Update display name
    await firebaseUser.updateDisplayName(fullName.trim());

    return newUser;
  }

  /// Sign In with Email and Password
  Future<UserModel> signInWithEmailPassword({
    required String email,
    required String password,
  }) async {
    final UserCredential credential = await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );

    final User? firebaseUser = credential.user;
    if (firebaseUser == null) {
      throw FirebaseAuthException(
        code: 'user-null',
        message: 'Authentication failed.',
      );
    }

    return await getUserProfile(firebaseUser.uid);
  }

  /// Google Sign-In Flow
  Future<UserModel> signInWithGoogle({String defaultRole = 'student'}) async {
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
    if (googleUser == null) {
      throw Exception('Google Sign-In was cancelled by the user.');
    }

    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    final AuthCredential credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final UserCredential userCredential = await _auth.signInWithCredential(credential);
    final User? firebaseUser = userCredential.user;
    if (firebaseUser == null) {
      throw Exception('Google Authentication failed.');
    }

    // Check if Firestore user document exists
    final DocumentSnapshot userDoc = await _firestore
        .collection(AppConstants.usersCollection)
        .doc(firebaseUser.uid)
        .get();

    if (userDoc.exists) {
      return UserModel.fromMap(userDoc.data() as Map<String, dynamic>, docId: userDoc.id);
    } else {
      // First time Google login: create profile
      final UserModel newUser = UserModel(
        uid: firebaseUser.uid,
        fullName: firebaseUser.displayName ?? 'Google User',
        email: firebaseUser.email ?? '',
        phoneNumber: '00000000000',
        role: defaultRole,
        institutionId: 'INST-MAIN',
        createdAt: DateTime.now(),
      );

      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(firebaseUser.uid)
          .set(newUser.toMap());

      return newUser;
    }
  }

  /// Retrieve user profile from Firestore
  Future<UserModel> getUserProfile(String uid) async {
    final DocumentSnapshot doc = await _firestore
        .collection(AppConstants.usersCollection)
        .doc(uid)
        .get();

    if (!doc.exists || doc.data() == null) {
      throw Exception('User profile not found in database.');
    }

    return UserModel.fromMap(doc.data() as Map<String, dynamic>, docId: doc.id);
  }

  /// Password Reset
  Future<void> sendPasswordResetEmail(String email) async {
    await _auth.sendPasswordResetEmail(email: email.trim());
  }

  /// Sign Out
  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }
}
