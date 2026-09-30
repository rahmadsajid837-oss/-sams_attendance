/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  FileCode,
  CheckSquare,
  BookOpen,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  Maximize2,
  Minimize2,
  Users,
  ShieldAlert,
  School,
  ExternalLink,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { MobileFrame } from './components/MobileFrame';
import { SamsMobileApp } from './components/SamsMobileApp';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { TestSuiteViewer } from './components/TestSuiteViewer';
import { SrsGuide } from './components/SrsGuide';
import { MobileTestGuideModal } from './components/MobileTestGuideModal';
import { localDb } from './services/localDb';

export default function App() {
  const [activeTab, setActiveTab] = useState<'app' | 'code' | 'tests' | 'srs'>('app');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);

  const SHARED_APP_URL = 'https://ais-pre-fmz3ibceaqlmcqpbct5yzb-19500774353.asia-southeast1.run.app';
  const USER_EMAIL = 'rahmadsajid837@gmail.com';

  // Sync state with local database
  const refreshPendingCount = () => {
    setPendingSyncCount(localDb.getPendingSyncCount());
  };

  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 1500);
    return () => clearInterval(interval);
  }, []);

  // When toggling online, trigger automatic sync if going from offline -> online (SRS Section 63)
  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    if (nextState) {
      // Auto-sync triggered upon internet return
      const res = localDb.syncPendingRecords();
      refreshPendingCount();
    }
  };

  const handleManualSync = () => {
    if (!isOnline) {
      alert('Cannot sync while in Offline mode. Please toggle Network to "Online" first.');
      return;
    }
    const res = localDb.syncPendingRecords();
    refreshPendingCount();
    alert(`Auto-Sync Complete: ${res.syncedCount} records synced to Firebase Firestore.`);
  };

  const handleResetData = () => {
    if (confirm('Reset database to initial institutional seed state?')) {
      localDb.resetDemoData();
      refreshPendingCount();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wide text-white">SAMS</h1>
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Flutter &amp; Firebase
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Smart Attendance Management System • Offline-First (Hive) &amp; ABAC
            </p>
          </div>
        </div>

        {/* Global Controls & Network Mode Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Test on Mobile Device with QR Code */}
          <button
            onClick={() => setShowMobileModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer transition-all"
            title="Scan QR Code or open on mobile phone"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-200" />
            <span>Test on Mobile</span>
          </button>

          {/* Network Switcher (SRS Section 14 & 15 Simulation) */}
          <button
            onClick={handleToggleOnline}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 animate-pulse'
            }`}
            title="Simulate network connectivity to test offline Hive saving and auto-sync"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Online (Firebase)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline (Hive Storage)</span>
              </>
            )}
          </button>

          {/* Pending Sync Trigger */}
          {pendingSyncCount > 0 && (
            <button
              onClick={handleManualSync}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Sync {pendingSyncCount} Record(s)</span>
            </button>
          )}

          {/* Reset Demo Data */}
          <button
            onClick={handleResetData}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs cursor-pointer transition-colors"
            title="Reset database to seed records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('app')}
          className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'app'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Mobile App (Material 3 Simulator)</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'code'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Flutter Source &amp; ZIP Export</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tests'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>SRS Test Suite Runner</span>
        </button>

        <button
          onClick={() => setActiveTab('srs')}
          className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'srs'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>SRS Architecture Matrix</span>
        </button>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col bg-slate-900">
        {activeTab === 'app' && (
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-2 sm:p-6 gap-6 max-w-7xl mx-auto w-full">
            {/* Mobile App Device Screen */}
            <div className="flex-1 flex justify-center w-full">
              <MobileFrame
                isOnline={isOnline}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                pendingSyncCount={pendingSyncCount}
              >
                <SamsMobileApp
                  isOnline={isOnline}
                  onSyncTriggered={refreshPendingCount}
                  pendingSyncCount={pendingSyncCount}
                />
              </MobileFrame>
            </div>

            {/* Side Testing & Scenario Panel */}
            <div className="w-full lg:w-96 bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 shrink-0 text-slate-300">
              <div className="border-b border-slate-800/80 pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                  Interactive Evaluation Assistant
                </span>
                <h3 className="text-sm font-extrabold text-white mt-0.5">
                  SRS Feature Test Scenarios
                </h3>
              </div>

              {/* Test on Physical Phone Card */}
              <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-blue-500/40 space-y-2.5 shadow-lg shadow-blue-950/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span>Run on Your Physical Mobile</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold">
                    Quick Connect
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Open with your smartphone camera and test directly with your pre-configured account: <span className="font-mono text-blue-300 font-bold block mt-0.5">{USER_EMAIL}</span>
                </p>
                <button
                  onClick={() => setShowMobileModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-900/40 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show QR Code &amp; Mobile Setup</span>
                </button>
              </div>

              {/* Offline-First Guide */}
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <WifiOff className="w-4 h-4 shrink-0" />
                  <span>1. Test Offline Hive Attendance</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Click the <strong>Online/Offline</strong> toggle above. Go to Teacher → <em>Mark Attendance</em> and submit.
                  The record will be flagged with <code className="text-amber-300">pendingSync = true</code>.
                  Toggle back to <strong>Online</strong> to watch it auto-sync idempotently.
                </p>
              </div>

              {/* 75% Threshold Guide */}
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>2. Test 75% Academic Warning</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sign in with Student account <code className="text-blue-300">sarah.c@student.edu</code> (85% good standing) vs
                  <code className="text-red-300">david.m@student.edu</code> (below 75% threshold) to see the prominent warning banner.
                </p>
              </div>

              {/* Duplicate Prevention Guide */}
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  <span>3. Duplicate Session Guard</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Mark attendance for a date that was already submitted (e.g. 2026-09-22). The app will block it with:
                  <span className="block mt-1 italic text-slate-300">
                    "Attendance for this class and session has already been recorded."
                  </span>
                </p>
              </div>

              {/* Quick Info */}
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span>Flutter 3.x / Dart 3.x</span>
                <span>Hive DB + Firebase Auth</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'code' && <FlutterCodeViewer />}
        {activeTab === 'tests' && <TestSuiteViewer />}
        {activeTab === 'srs' && <SrsGuide />}
      </main>

      {/* Mobile Testing Modal with QR Code */}
      <MobileTestGuideModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        sharedUrl={SHARED_APP_URL}
        userEmail={USER_EMAIL}
      />
    </div>
  );
}
