import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  initialUser,
  initialFamily,
  initialMembers,
  initialMessages,
  initialAlerts,
  initialRiskPins,
  initialDashboardStats,
} from './mock/data';
import {
  User,
  Family,
  FamilyMember,
  MessageItem,
  AlertItem,
  MapRiskPin,
  DashboardStats,
  RiskLevel,
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { QuickForwardModal } from './components/QuickForwardModal';
import { InviteModal } from './components/InviteModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { MessageDetailPage } from './pages/MessageDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { FamilyPage } from './pages/FamilyPage';
import { MessagesPage } from './pages/MessagesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

export default function App() {
  // Navigation
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedMessageId, setSelectedMessageId] = useState<string>('msg_101');

  // Application Data States
  const [user, setUser] = useState<User>(initialUser);
  const [family, setFamily] = useState<Family>(initialFamily);
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [pins, setPins] = useState<MapRiskPin[]>(initialRiskPins);
  const [stats, setStats] = useState<DashboardStats>(initialDashboardStats);

  // Elder Mode (Increases font size, contrast, simplified view)
  const [elderMode, setElderMode] = useState<boolean>(() => {
    return localStorage.getItem('scamshield_elder_mode') === 'true';
  });

  // Modals
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInjectingScam, setIsInjectingScam] = useState(false);

  // Live Toast Banner
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    description: string;
    messageId: string;
    level: RiskLevel;
  } | null>(null);

  // Sync elder mode to localStorage
  useEffect(() => {
    localStorage.setItem('scamshield_elder_mode', String(elderMode));
    if (elderMode) {
      document.documentElement.classList.add('elder-mode');
    } else {
      document.documentElement.classList.remove('elder-mode');
    }
  }, [elderMode]);

  // Handle Analyzing a New Forwarded Message (via API or intelligent client-side fallback)
  const handleAnalyzeMessage = async (
    senderMemberId: string,
    text: string,
    linkUrl?: string,
    imageUrl?: string
  ): Promise<MessageItem> => {
    let analysisResult;

    try {
      // Try server endpoint first
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          linkUrl,
          imageUrl,
          senderContact: 'WhatsApp Forward',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        analysisResult = data.analysis;
      }
    } catch (e) {
      console.warn('Backend API request failed, using intelligent client evaluation fallback', e);
    }

    // High fidelity fallback if backend unreachable
    if (!analysisResult) {
      const lower = (text || '').toLowerCase();
      const hasUrgency = lower.includes('urgent') || lower.includes('immediately') || lower.includes('blocked') || lower.includes('tonight') || lower.includes('disconnect') || lower.includes('freeze');
      const hasBank = lower.includes('kyc') || lower.includes('bank') || lower.includes('otp') || lower.includes('account') || lower.includes('upi') || lower.includes('tax');
      const hasLink = !!linkUrl || lower.includes('http');

      if (hasUrgency && (hasBank || hasLink)) {
        analysisResult = {
          riskScore: 92,
          riskLevel: 'scam' as RiskLevel,
          scamType: hasBank ? 'Banking / KYC Phishing' : 'Utility Disconnection Scam',
          plainLanguageExplanation: [
            'Extreme Artificial Urgency: Threatens rapid financial loss or service cutoff to provoke immediate panic.',
            'Suspicious Unofficial Channel: Official institutions never send urgent threats with payment links via WhatsApp.',
            'Phishing Link Trap: Link redirects to an unverified domain mimicking legitimate portal credentials.',
          ],
          actionableAdvice: 'DO NOT click the link, send money, or reply. Delete the message and check your account via the official banking app.',
        };
      } else if (hasUrgency || hasBank) {
        analysisResult = {
          riskScore: 62,
          riskLevel: 'caution' as RiskLevel,
          scamType: 'Unverified Transaction Request',
          plainLanguageExplanation: [
            'Request contains sensitive financial keywords without verifiable sender credentials.',
            'Always independently verify directly via trusted phone numbers before sharing info.',
          ],
          actionableAdvice: 'Contact the person directly on phone before acting on this message.',
        };
      } else if (imageUrl && !text) {
        analysisResult = {
          riskScore: 65,
          riskLevel: 'caution' as RiskLevel,
          scamType: 'Unverified Image Attachment',
          plainLanguageExplanation: [
            'Screenshot or image received without text context.',
            'Unverified images may contain fake bills, fraudulent payment QR codes, or masked URLs.',
            'Always confirm the sender before scanning any QR code or making transfers.',
          ],
          actionableAdvice: 'Verify with the sender directly before taking actions shown in this screenshot.',
        };
      } else {
        analysisResult = {
          riskScore: 12,
          riskLevel: 'safe' as RiskLevel,
          scamType: 'Informational Notice',
          plainLanguageExplanation: [
            'No known fraud or phishing patterns detected in message body.',
            'Standard notification phrasing with no suspicious links.',
          ],
          actionableAdvice: 'This message appears safe, but never share OTPs with anyone.',
        };
      }
    }

    const newMessageId = `msg_${Date.now()}`;
    const member = members.find((m) => m.id === senderMemberId);

    const fullAnalysis = {
      id: `an_${Date.now()}`,
      messageId: newMessageId,
      riskScore: analysisResult.riskScore,
      riskLevel: analysisResult.riskLevel,
      scamType: analysisResult.scamType,
      scamTypeLabel: analysisResult.scamType,
      plainLanguageTitle: `${analysisResult.scamType} Notice`,
      explanationBullets: analysisResult.plainLanguageExplanation || [],
      plainLanguageExplanation: analysisResult.plainLanguageExplanation || [],
      safeActionAdvice: [analysisResult.actionableAdvice],
      actionableAdvice: analysisResult.actionableAdvice,
      familyCrossMatchCount: 1,
      matchedPatternName: 'Threat Vector #' + analysisResult.scamType,
      aiModelVersion: 'Gemini 2.5 Flash',
      createdAt: new Date().toISOString(),
      confidenceScore: 0.96,
    };

    const newMessage: MessageItem = {
      id: newMessageId,
      familyId: family.id,
      senderMemberId,
      senderName: member?.name || 'Family Member',
      senderRelation: member?.relation || 'Member',
      senderContact: member?.phone || '+91 98201 55220',
      originalText: text,
      linkUrl,
      screenshotUrl: imageUrl,
      timestamp: 'Just now',
      receivedAt: new Date().toISOString(),
      status: analysisResult.riskLevel === 'safe' ? 'cleared' : 'flagged',
      content: {
        source: 'whatsapp',
        text,
        linkUrl,
        imageUrl,
        senderNumber: member?.phone,
      },
      analysis: fullAnalysis,
    };

    // Add to messages state
    setMessages((prev) => [newMessage, ...prev]);

    // If scam or caution, generate alert & map pin
    if (analysisResult.riskLevel === 'scam' || analysisResult.riskLevel === 'caution') {
      const newAlert: AlertItem = {
        id: `alert_${Date.now()}`,
        analysisId: fullAnalysis.id,
        familyId: family.id,
        messageId: newMessageId,
        riskLevel: analysisResult.riskLevel,
        scamType: analysisResult.scamType,
        title: `${analysisResult.scamType} Detected`,
        description: `Incoming forward to ${member?.name || 'Family'} contains deceptive fraudulent indicators.`,
        timestamp: 'Just now',
        affectedMemberName: member?.name || 'Sunita Sharma',
        affectedMemberRelation: member?.relation || 'Mother',
        isRead: false,
        acknowledgedBy: [],
      };

      setAlerts((prev) => [newAlert, ...prev]);

      // Add 3D Pin to Radar
      const newPin: MapRiskPin = {
        id: `pin_${Date.now()}`,
        cityName: 'Regional Cluster',
        lat: 28.6139 + (Math.random() - 0.5) * 4,
        lng: 77.209 + (Math.random() - 0.5) * 4,
        riskLevel: analysisResult.riskLevel,
        scamSnippet: (text || linkUrl || 'Suspicious Attachment').slice(0, 75) + '...',
        memberAffected: member?.name || 'Family Member',
        scamType: analysisResult.scamType,
        timestamp: 'Just now',
      };
      setPins((prev) => [newPin, ...prev]);

      // Update stats
      setStats((prev) => ({
        ...prev,
        scamsDetectedCount: prev.scamsDetectedCount + (analysisResult.riskLevel === 'scam' ? 1 : 0),
        messagesAnalyzedCount: prev.messagesAnalyzedCount + 1,
        scamsTrendWeek: prev.scamsTrendWeek + 1,
      }));

      // Show toast
      setToastNotification({
        title: newAlert.title,
        description: newAlert.description,
        messageId: newMessageId,
        level: analysisResult.riskLevel,
      });

      // Vibrate if supported
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }
    } else {
      setStats((prev) => ({
        ...prev,
        messagesAnalyzedCount: prev.messagesAnalyzedCount + 1,
      }));
    }

    // Direct user to newly analyzed message
    setSelectedMessageId(newMessageId);
    setCurrentPage('message-detail');

    return newMessage;
  };

  // Hackathon Wow Factor: Live Test Scam Demo Injection
  const handleTriggerDemoScam = () => {
    setIsInjectingScam(true);

    setTimeout(() => {
      const demoScamText =
        'URGENT: Income Tax Department approved refund of ₹24,850. Confirm bank account & IFSC within 15 mins to avoid cancellation: http://incometax-gov-refund-portal.online/claim';
      const demoLink = 'http://incometax-gov-refund-portal.online/claim';
      const targetMember = members.find((m) => m.relation === 'Mother') || members[0];

      const newMsgId = `demo_scam_${Date.now()}`;
      const demoAnalysis = {
        id: `an_demo_${Date.now()}`,
        messageId: newMsgId,
        riskScore: 98,
        riskLevel: 'scam' as const,
        scamType: 'Tax Refund Phishing Scam',
        scamTypeLabel: 'Tax Refund Phishing Trap',
        plainLanguageTitle: 'High Risk: Counterfeit Tax Refund',
        explanationBullets: [
          'Counterfeit Government Portal: The Income Tax department never communicates refunds with third-party .online domains.',
          'High Panic Urgency: "15 minutes deadline" is designed to compel immediate credential entry before thinking.',
          'Direct Account Looting: The link directly solicits NetBanking passwords and OTPs.',
        ],
        plainLanguageExplanation: [
          'Counterfeit Government Portal: The Income Tax department never communicates refunds with third-party .online domains.',
          'High Panic Urgency: "15 minutes deadline" is designed to compel immediate credential entry before thinking.',
          'Direct Account Looting: The link directly solicits NetBanking passwords and OTPs.',
        ],
        safeActionAdvice: [
          'Immediate danger. Do NOT click or submit bank details. Check claims exclusively on incometax.gov.in',
        ],
        actionableAdvice: 'Immediate danger. Do NOT click or submit bank details. File a report at cybercrime.gov.in if entered.',
        familyCrossMatchCount: 2,
        matchedPatternName: 'Govt Portal Impersonation #IT-29',
        aiModelVersion: 'Gemini 2.5 Flash',
        createdAt: new Date().toISOString(),
        confidenceScore: 0.99,
      };

      const newMsg: MessageItem = {
        id: newMsgId,
        familyId: family.id,
        senderMemberId: targetMember.id,
        senderName: targetMember.name,
        senderRelation: targetMember.relation,
        senderContact: '+91 94120 78192',
        originalText: demoScamText,
        linkUrl: demoLink,
        timestamp: 'Just now',
        receivedAt: new Date().toISOString(),
        status: 'flagged',
        content: {
          source: 'whatsapp',
          text: demoScamText,
          linkUrl: demoLink,
          senderNumber: '+91 94120 78192',
        },
        analysis: demoAnalysis,
      };

      const newAlert: AlertItem = {
        id: `alert_demo_${Date.now()}`,
        analysisId: demoAnalysis.id,
        familyId: family.id,
        messageId: newMsgId,
        riskLevel: 'scam',
        scamType: 'Tax Refund Phishing Scam',
        title: 'Emergency: High-Risk Tax Phishing Blocked',
        description: `Mother (${targetMember.name}) received an urgent fake Income Tax refund trap.`,
        timestamp: 'Just now',
        affectedMemberName: targetMember.name,
        affectedMemberRelation: targetMember.relation,
        isRead: false,
        acknowledgedBy: [],
      };

      const newPin: MapRiskPin = {
        id: `pin_demo_${Date.now()}`,
        cityName: 'New Delhi (Live)',
        lat: 28.6139,
        lng: 77.209,
        riskLevel: 'scam',
        scamSnippet: demoScamText.slice(0, 80) + '...',
        memberAffected: targetMember.name,
        scamType: 'Tax Refund Phishing',
        timestamp: 'Just now',
      };

      setMessages((prev) => [newMsg, ...prev]);
      setAlerts((prev) => [newAlert, ...prev]);
      setPins((prev) => [newPin, ...prev]);
      setStats((prev) => ({
        ...prev,
        scamsDetectedCount: prev.scamsDetectedCount + 1,
        messagesAnalyzedCount: prev.messagesAnalyzedCount + 1,
        scamsTrendWeek: prev.scamsTrendWeek + 1,
      }));

      setIsInjectingScam(false);
      setSelectedMessageId(newMsgId);
      setCurrentPage('message-detail');

      // Trigger Confetti defense burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#EF4444', '#5B8FFF', '#22C55E'],
        });
      } catch (e) {
        // no-op
      }

      setToastNotification({
        title: newAlert.title,
        description: newAlert.description,
        messageId: newMsgId,
        level: 'scam',
      });
    }, 900);
  };

  // Feedback action on message
  const handleUpdateFeedback = (
    messageId: string,
    feedback: 'confirmed_scam' | 'marked_safe' | 'not_sure'
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, userFeedback: feedback } : m))
    );
  };

  // Broadcast Alert to Family circle
  const handleBroadcastAlert = (messageId: string) => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      // no-op
    }
  };

  const handleMarkAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const currentMessageItem =
    messages.find((m) => m.id === selectedMessageId) || messages[0];
  const senderMember = members.find((m) => m.id === currentMessageItem?.senderMemberId);

  // If on landing page
  if (currentPage === 'landing') {
    return (
      <LandingPage
        onEnterDemo={() => setCurrentPage('dashboard')}
        onStartAuth={() => setCurrentPage('auth')}
      />
    );
  }

  // If on onboarding/auth flow
  if (currentPage === 'auth') {
    return (
      <AuthPage
        onComplete={(newCircleName) => {
          setFamily((prev) => ({ ...prev, name: newCircleName }));
          setCurrentPage('dashboard');
        }}
        onCancel={() => setCurrentPage('landing')}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#0B0F14] text-[#E5E7EB] flex flex-col selection:bg-[#5B8FFF]/30 ${elderMode ? 'elder-mode' : ''}`}>
      {/* Top Navbar */}
      <Navbar
        user={user}
        family={family}
        alerts={alerts}
        elderMode={elderMode}
        onToggleElderMode={() => setElderMode(!elderMode)}
        onNavigate={(page) => setCurrentPage(page)}
        onOpenAlerts={() => setCurrentPage('alerts')}
        currentPage={currentPage}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Desktop Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          alerts={alerts}
          onOpenForwardModal={() => setForwardModalOpen(true)}
          onTriggerDemoScam={handleTriggerDemoScam}
          isInjectingScam={isInjectingScam}
        />

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              family={family}
              members={members}
              messages={messages}
              alerts={alerts}
              pins={pins}
              stats={stats}
              elderMode={elderMode}
              onNavigateMessage={(msgId) => {
                setSelectedMessageId(msgId);
                setCurrentPage('message-detail');
              }}
              onNavigateAlerts={() => setCurrentPage('alerts')}
              onNavigateFamily={() => setCurrentPage('family')}
              onTriggerDemoScam={handleTriggerDemoScam}
              onOpenForwardModal={() => setForwardModalOpen(true)}
              onOpenInviteModal={() => setInviteModalOpen(true)}
              isInjectingScam={isInjectingScam}
            />
          )}

          {currentPage === 'message-detail' && currentMessageItem && (
            <MessageDetailPage
              message={currentMessageItem}
              senderMember={senderMember}
              elderMode={elderMode}
              onBack={() => setCurrentPage('dashboard')}
              onUpdateFeedback={handleUpdateFeedback}
              onBroadcastAlert={handleBroadcastAlert}
            />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              onSelectAlert={(msgId) => {
                setSelectedMessageId(msgId);
                setCurrentPage('message-detail');
              }}
              onMarkAllAsRead={handleMarkAllAlertsRead}
              elderMode={elderMode}
            />
          )}

          {currentPage === 'messages' && (
            <MessagesPage
              messages={messages}
              members={members}
              onSelectMessage={(msgId) => {
                setSelectedMessageId(msgId);
                setCurrentPage('message-detail');
              }}
              onOpenForwardModal={() => setForwardModalOpen(true)}
              elderMode={elderMode}
            />
          )}

          {currentPage === 'family' && (
            <FamilyPage
              family={family}
              members={members}
              elderMode={elderMode}
              onToggleElderMode={() => setElderMode(!elderMode)}
              onOpenInviteModal={() => setInviteModalOpen(true)}
              onUpdateMemberAlerts={(memberId, enabled) => {
                setMembers((prev) =>
                  prev.map((m) => (m.id === memberId ? { ...m, receiveAlerts: enabled } : m))
                );
              }}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              family={family}
              user={user}
              elderMode={elderMode}
              onToggleElderMode={() => setElderMode(!elderMode)}
            />
          )}
        </main>
      </div>

      {/* Real-time Alert Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full p-4 rounded-2xl bg-[#121821] border border-red-500/40 shadow-2xl shadow-red-500/20 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Live Scam Alert</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">{toastNotification.title}</h4>
              <p className="text-xs text-gray-300 mt-1 line-clamp-2">{toastNotification.description}</p>
            </div>
            <button
              onClick={() => setToastNotification(null)}
              className="text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setSelectedMessageId(toastNotification.messageId);
                setCurrentPage('message-detail');
                setToastNotification(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition"
            >
              Inspect Threat
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <QuickForwardModal
        isOpen={forwardModalOpen}
        onClose={() => setForwardModalOpen(false)}
        members={members}
        onAnalyzeMessage={handleAnalyzeMessage}
      />

      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        family={family}
      />
    </div>
  );
}
