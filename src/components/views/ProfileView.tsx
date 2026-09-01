import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Sparkles,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  Smartphone,
  Laptop,
  Radio,
  Info,
  Sun,
  Moon,
  Palette,
  Target,
  Download,
  Upload,
  RotateCcw,
  Shield,
  LogOut,
  Check,
  Database,
  CheckCircle2,
  KeyRound,
  ExternalLink,
  Copy,
  Code2,
  AlertCircle,
  RefreshCw,
  Play,
  Square,
  Sliders,
  Mic,
  Smile,
  Heart,
  MoonStar,
  Flame,
  Clock,
} from 'lucide-react';
import {
  UserProfile,
  NinoPersonality,
  NinoThemeColor,
  Task,
} from '../../types';
import {
  PERSONALITY_CONFIGS,
  THEME_COLORS,
} from '../../utils/constants';
import { NinoAvatar } from '../NinoAvatar';
import { soundManager } from '../../utils/sound';
import {
  speechService,
  POLARIS_VOICE_PRESETS,
  POLARIS_PERSONALITIES,
  PolarisPhraseType,
  PolarisVocalPersonality,
} from '../../utils/speech';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { signOutUser } from '../../services/supabase/auth';
import {
  isPushNotificationSupported,
  getNotificationPermissionState,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getCurrentPushSubscription,
  testDevicePushNotification,
  getDeviceType,
  isIOSDevice,
  isPWAStandalone,
} from '../../utils/pushNotifications';
import {
  fetchUserPushSubscriptions,
  PushSubscriptionRecord,
} from '../../services/supabase/push';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onResetDemoData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => boolean;
  onTestNotification: () => void;
  onOpenAuthModal: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onResetDemoData,
  onExportData,
  onImportData,
  onTestNotification,
  onOpenAuthModal,
  isDark,
  onToggleTheme,
  onSignOut,
}) => {
  const [nameInput, setNameInput] = useState(user.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const isConfigured = isSupabaseConfigured();
  const isAuthUser = Boolean(user.id && !user.id.startsWith('demo-') && user.email);

  // Push Notifications State
  const isPushSupported = isPushNotificationSupported();
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermissionState()
  );
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [pushLoading, setPushLoading] = useState<boolean>(false);
  const [pushMessage, setPushMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<PushSubscriptionRecord[]>([]);

  // Polaris Voice & Vocal Personalities State
  const [voicesList, setVoicesList] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('');
  const [isVoiceTesting, setIsVoiceTesting] = useState<boolean>(false);
  const [activeTestPersonality, setActiveTestPersonality] = useState<PolarisVocalPersonality | null>(null);
  const [activeTestPhrase, setActiveTestPhrase] = useState<PolarisPhraseType | null>(null);

  const activePersonality: PolarisVocalPersonality = user.preferences.vocalPersonality || 'cute';

  useEffect(() => {
    const updateVoiceInfo = () => {
      const allVoices = speechService.getAvailableVoices();
      setVoicesList(allVoices);
      const active = speechService.getPolarisVoice(user.preferences.vocalPersonality || 'cute', user.preferences.voiceURI);
      if (active) {
        setCurrentVoiceName(active.name);
      }
    };

    updateVoiceInfo();
    const unsubscribe = speechService.onVoicesLoaded(updateVoiceInfo);
    return () => unsubscribe();
  }, [user.preferences.vocalPersonality, user.preferences.voiceURI]);

  const deviceType = getDeviceType();
  const isIOS = isIOSDevice();
  const isPWA = isPWAStandalone();

  // Refresh push state & active subscriptions
  const refreshPushStatus = async () => {
    const perm = getNotificationPermissionState();
    setPushPermission(perm);

    if (perm === 'granted') {
      const sub = await getCurrentPushSubscription();
      setIsPushSubscribed(Boolean(sub));
    } else {
      setIsPushSubscribed(false);
    }

    if (isAuthUser && user.id) {
      const subs = await fetchUserPushSubscriptions(user.id);
      setUserSubscriptions(subs);
    }
  };

  useEffect(() => {
    refreshPushStatus();
  }, [user.id, isAuthUser]);

  const handleTogglePushSubscription = async () => {
    setPushLoading(true);
    setPushMessage(null);

    try {
      if (isPushSubscribed) {
        const success = await unsubscribeUserFromPush(isAuthUser ? user.id : undefined);
        if (success) {
          setIsPushSubscribed(false);
          setPushMessage({
            text: 'Notificações push desativadas neste dispositivo.',
            type: 'info',
          });
          onUpdateUser({
            ...user,
            preferences: {
              ...user.preferences,
              browserNotificationsEnabled: false,
            },
          });
        } else {
          setPushMessage({
            text: 'Não foi possível desativar as notificações no dispositivo.',
            type: 'error',
          });
        }
      } else {
        const result = await subscribeUserToPush(isAuthUser ? user.id : undefined);
        if (result.success && result.subscription) {
          setIsPushSubscribed(true);
          setPushPermission('granted');
          setPushMessage({
            text: '⭐ Notificações push reais ativadas e registradas com sucesso no dispositivo!',
            type: 'success',
          });

          // Enable browser notifications and task reminders in preferences
          onUpdateUser({
            ...user,
            preferences: {
              ...user.preferences,
              browserNotificationsEnabled: true,
              taskRemindersEnabled: user.preferences.taskRemindersEnabled ?? true,
            },
          });
        } else {
          const perm = getNotificationPermissionState();
          setPushPermission(perm);
          setIsPushSubscribed(false);
          setPushMessage({
            text: result.error || 'Não foi possível registrar a notificação push no dispositivo.',
            type: 'error',
          });
        }
      }
      await refreshPushStatus();
    } catch (err: any) {
      setPushMessage({
        text: err?.message || 'Erro ao configurar notificações push.',
        type: 'error',
      });
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendRealTestPush = async () => {
    setPushLoading(true);
    setPushMessage(null);
    try {
      const result = await testDevicePushNotification();
      if (result.success) {
        setPushMessage({
          text: '⭐ Notificação Push REAL enviada com sucesso! Verifique sua central de notificações.',
          type: 'success',
        });
      } else {
        setPushMessage({
          text: result.error || 'Falha ao disparar notificação push no dispositivo.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setPushMessage({
        text: err?.message || 'Erro ao enviar notificação de teste.',
        type: 'error',
      });
    } finally {
      setPushLoading(false);
    }
  };

  const personalityList: NinoPersonality[] = ['divertido', 'profissional', 'motivador', 'tranquilo'];
  const colorList: NinoThemeColor[] = ['indigo', 'emerald', 'amber', 'rose', 'violet', 'cyan'];

  const handleSignOutClick = async () => {
    if (onSignOut) {
      await onSignOut();
    } else {
      await signOutUser();
    }
  };

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    onUpdateUser({ ...user, name: nameInput.trim() });
    setIsEditingName(false);
  };

  const handlePersonalityChange = (p: NinoPersonality) => {
    soundManager.playPop();
    const updated = {
      ...user,
      preferences: { ...user.preferences, ninoPersonality: p },
    };
    onUpdateUser(updated);

    if (user.preferences.voiceEnabled) {
      speechService.speak(
        p === 'divertido'
          ? 'Eba! Agora sou seu Polaris versão super divertida! Vamos nessa!'
          : p === 'profissional'
          ? 'Configuração atualizada. Modo profissional ativado para máxima eficiência.'
          : p === 'motivador'
          ? 'Modo motivador ativado! Prepare-se para bater todas as suas metas!'
          : 'Modo tranquilo ativado. Vamos cuidar da sua rotina com paz e serenidade.'
      );
    }
  };

  const handleColorChange = (c: NinoThemeColor) => {
    soundManager.playPop();
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, ninoColor: c },
    });
  };

  const handleToggleVoice = () => {
    const nextVal = !user.preferences.voiceEnabled;
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, voiceEnabled: nextVal },
    });
    if (nextVal) {
      soundManager.playPop();
      speechService.testVoice({
        volume: user.preferences.voiceVolume ?? 1.0,
        pitch: user.preferences.voicePitch ?? 1.28,
        rate: user.preferences.voiceRate ?? 0.96,
        voiceURI: user.preferences.voiceURI,
      });
    } else {
      speechService.stop();
      setIsVoiceTesting(false);
      setActiveTestPhrase(null);
      setActiveTestPersonality(null);
    }
  };

  const handleSelectPersonality = (p: PolarisVocalPersonality) => {
    soundManager.playPop();
    const cfg = POLARIS_PERSONALITIES[p] || POLARIS_PERSONALITIES.cute;
    onUpdateUser({
      ...user,
      preferences: {
        ...user.preferences,
        vocalPersonality: p,
        voicePitch: cfg.defaultPitch,
        voiceRate: cfg.defaultRate,
        voiceVolume: cfg.defaultVolume,
      },
    });

    const activeVoice = speechService.getPolarisVoice(p, user.preferences.voiceURI);
    if (activeVoice) {
      setCurrentVoiceName(activeVoice.name);
    }
  };

  const handleResetPersonalityDefaults = () => {
    soundManager.playPop();
    const cfg = POLARIS_PERSONALITIES[activePersonality] || POLARIS_PERSONALITIES.cute;
    onUpdateUser({
      ...user,
      preferences: {
        ...user.preferences,
        voicePitch: cfg.defaultPitch,
        voiceRate: cfg.defaultRate,
        voiceVolume: cfg.defaultVolume,
        voiceURI: undefined,
      },
    });
    const defaultVoice = speechService.getPolarisVoice(activePersonality);
    if (defaultVoice) {
      setCurrentVoiceName(defaultVoice.name);
    }
  };

  const handlePlayTestPersonality = (p: PolarisVocalPersonality) => {
    if (isVoiceTesting && activeTestPersonality === p && !activeTestPhrase) {
      speechService.stop();
      setIsVoiceTesting(false);
      setActiveTestPersonality(null);
      return;
    }

    setIsVoiceTesting(true);
    setActiveTestPersonality(p);
    setActiveTestPhrase(null);

    const cfg = POLARIS_PERSONALITIES[p] || POLARIS_PERSONALITIES.cute;
    speechService.testPersonality(p, {
      pitch: user.preferences.voicePitch ?? cfg.defaultPitch,
      rate: user.preferences.voiceRate ?? cfg.defaultRate,
      volume: user.preferences.voiceVolume ?? cfg.defaultVolume,
      voiceURI: user.preferences.voiceURI,
      onEnd: () => {
        setIsVoiceTesting(false);
        setActiveTestPersonality(null);
      },
      onError: () => {
        setIsVoiceTesting(false);
        setActiveTestPersonality(null);
      },
    });
  };

  const handleVoiceVolumeChange = (vol: number) => {
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, voiceVolume: vol },
    });
  };

  const handleVoicePitchChange = (pitch: number) => {
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, voicePitch: pitch },
    });
  };

  const handleVoiceRateChange = (rate: number) => {
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, voiceRate: rate },
    });
  };

  const handleVoiceSelect = (uri: string) => {
    speechService.getPolarisVoice(activePersonality, uri);
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, voiceURI: uri },
    });
    const selected = voicesList.find((v) => v.voiceURI === uri);
    if (selected) {
      setCurrentVoiceName(selected.name);
    }
  };

  const handlePlayTestVoice = (phraseKey: PolarisPhraseType = 'TEST_VOICE') => {
    if (isVoiceTesting && activeTestPhrase === phraseKey) {
      speechService.stop();
      setIsVoiceTesting(false);
      setActiveTestPhrase(null);
      return;
    }

    setIsVoiceTesting(true);
    setActiveTestPhrase(phraseKey);
    setActiveTestPersonality(null);

    speechService.speakPolaris(phraseKey, {
      personality: activePersonality,
      volume: user.preferences.voiceVolume,
      pitch: user.preferences.voicePitch,
      rate: user.preferences.voiceRate,
      voiceURI: user.preferences.voiceURI,
      onEnd: () => {
        setIsVoiceTesting(false);
        setActiveTestPhrase(null);
      },
      onError: () => {
        setIsVoiceTesting(false);
        setActiveTestPhrase(null);
      },
    });
  };

  const handleStopTestVoice = () => {
    speechService.stop();
    setIsVoiceTesting(false);
    setActiveTestPhrase(null);
    setActiveTestPersonality(null);
  };

  const handleToggleSound = () => {
    const nextVal = !user.preferences.soundEffectsEnabled;
    soundManager.setEnabled(nextVal);
    if (nextVal) soundManager.playPop();
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, soundEffectsEnabled: nextVal },
    });
  };

  const handleDailyGoalChange = (newGoal: number) => {
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, dailyGoal: newGoal },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportData(content);
        if (ok) {
          setImportStatus('Backup importado com sucesso!');
        } else {
          setImportStatus('Erro ao importar arquivo. Verifique o formato JSON.');
        }
        setTimeout(() => setImportStatus(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-24 overflow-x-hidden min-w-0">
      {/* Profile Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 sm:gap-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-orange-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="px-3 py-1 text-base font-bold rounded-xl border border-orange-500 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  {user.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-orange-600 hover:text-orange-700 hover:underline font-bold"
                >
                  Editar
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400">{user.email}</p>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
              🔥 {user.streakDays} dias de sequência ativa
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAuthModal}
          className="px-4 py-2 rounded-2xl border border-orange-200 dark:border-amber-900/60 hover:border-orange-300 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 hover:bg-orange-50/50 dark:hover:bg-amber-950/30"
        >
          <Shield className="w-4 h-4 text-orange-500" />
          Trocar Conta / Login
        </button>
      </div>

      {/* Nino Companion Customizer Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-amber-950/70 text-orange-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                Personalizar o Polaris
              </h3>
              <p className="text-xs text-slate-400">
                Escolha o estilo, a voz e a aparência do seu companheiro
              </p>
            </div>
          </div>

          <div className="w-14 h-14">
            <NinoAvatar
              expression="excited"
              color={user.preferences.ninoColor}
              size="sm"
              stage={user.polaris?.stage || 'baby'}
              accessory={user.polaris?.equippedAccessory || 'none'}
              aura={user.polaris?.equippedAura || 'none'}
              interactive={false}
            />
          </div>
        </div>

        {/* 1. Personality Options */}
        <div>
          <label className="block text-xs font-bold text-orange-950/80 dark:text-amber-200/80 mb-2 uppercase tracking-wide">
            Estilo de Personalidade
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personalityList.map((pKey) => {
              const p = PERSONALITY_CONFIGS[pKey];
              const isSelected = user.preferences.ninoPersonality === pKey;
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => handlePersonalityChange(pKey)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/60 dark:bg-amber-950/40 shadow-xs'
                      : 'border-orange-100/80 dark:border-amber-950/60 hover:border-orange-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {p.badge}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Polaris Theme Color Picker */}
        <div>
          <label className="block text-xs font-bold text-orange-950/80 dark:text-amber-200/80 mb-2 uppercase tracking-wide">
            Cor do Polaris & Interface
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {colorList.map((cKey) => {
              const c = THEME_COLORS[cKey];
              const isSelected = user.preferences.ninoColor === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => handleColorChange(cKey)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all text-xs font-semibold ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 dark:bg-amber-950/50 shadow-xs text-orange-700 dark:text-orange-300 font-bold'
                      : 'border-orange-100/80 dark:border-amber-950/60 text-slate-600 dark:text-slate-300 hover:border-orange-200'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shadow-inner"
                    style={{ backgroundColor: c.primary }}
                  />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Audio & Polaris Cute Voice Settings */}
        <div className="space-y-4 pt-2">
          {/* Main Cute Voice Studio Card */}
          <div className="p-5 rounded-3xl border border-orange-200/90 dark:border-amber-900/60 bg-gradient-to-b from-orange-50/60 via-amber-50/20 to-transparent dark:from-amber-950/30 dark:via-transparent dark:to-transparent space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100 block font-['Outfit',sans-serif]">
                      Voz Falada do Polaris
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                      🦊 Fofa & Carismática
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Ouvir o Polaris com voz fofa, alegre, carinhosa e natural em pt-BR
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs ${
                  user.preferences.voiceEnabled
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {user.preferences.voiceEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Voz Ativada</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Desativada</span>
                  </>
                )}
              </button>
            </div>

            {/* If voice is enabled, show granular tuning controls */}
            {user.preferences.voiceEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-2 border-t border-orange-100 dark:border-amber-950/70"
              >
                {/* Detected Voice info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-orange-100 dark:border-amber-950/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-orange-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Voz do Dispositivo:
                      </span>{' '}
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {currentVoiceName || 'Voz Padrão Português (Brasil)'}
                      </span>
                    </div>
                  </div>
                  {voicesList.length > 1 && (
                    <select
                      value={user.preferences.voiceURI || ''}
                      onChange={(e) => handleVoiceSelect(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-orange-200 dark:border-amber-900 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="">✨ Automático (Melhor Voz Natural)</option>
                      {voicesList
                        .filter((v) => v.lang.toLowerCase().startsWith('pt'))
                        .map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Audio Tuning Sliders (Volume, Pitch, Rate) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Volume */}
                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-orange-100/80 dark:border-amber-950/60 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-orange-500" />
                        Volume da Voz
                      </span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {Math.round((user.preferences.voiceVolume ?? 1.0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={user.preferences.voiceVolume ?? 1.0}
                      onChange={(e) => handleVoiceVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-orange-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Suave</span>
                      <span>Alto (100%)</span>
                    </div>
                  </div>

                  {/* Pitch / Tom Fofo */}
                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-orange-100/80 dark:border-amber-950/60 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Tom da Voz (Pitch)
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                        {(user.preferences.voicePitch ?? 1.28) >= 1.35
                          ? '✨ Hiper Fofa'
                          : (user.preferences.voicePitch ?? 1.28) >= 1.25
                          ? '⭐ Fofa e Alegre'
                          : '🌙 Suave'}
                      </span>
                    </div>
                    <div className="flex gap-1.5 pt-0.5">
                      {[
                        { label: 'Suave', pitch: 1.15 },
                        { label: 'Fofa ⭐', pitch: 1.28 },
                        { label: 'Hiper Fofa', pitch: 1.38 },
                      ].map((p) => {
                        const isCur = Math.abs((user.preferences.voicePitch ?? 1.28) - p.pitch) < 0.06;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => handleVoicePitchChange(p.pitch)}
                            className={`flex-1 py-1 px-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                              isCur
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rate / Velocidade */}
                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-orange-100/80 dark:border-amber-950/60 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        Velocidade da Fala
                      </span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {user.preferences.voiceRate ?? 0.96}x
                      </span>
                    </div>
                    <div className="flex gap-1.5 pt-0.5">
                      {[
                        { label: 'Calma', rate: 0.88 },
                        { label: 'Natural ⭐', rate: 0.96 },
                        { label: 'Animada', rate: 1.08 },
                      ].map((r) => {
                        const isCur = Math.abs((user.preferences.voiceRate ?? 0.96) - r.rate) < 0.05;
                        return (
                          <button
                            key={r.label}
                            type="button"
                            onClick={() => handleVoiceRateChange(r.rate)}
                            className={`flex-1 py-1 px-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                              isCur
                                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Prominent Test Voice Button & Live Audio Waveform */}
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white shadow-md shadow-orange-500/20">
                  <div className="flex-1 text-center sm:text-left">
                    <span className="font-bold text-sm block">
                      {isVoiceTesting ? '🎙️ Polaris falando agora...' : '✨ Testar a Voz do Polaris'}
                    </span>
                    <span className="text-xs text-white/90">
                      "Oi! Eu sou o Polaris! ⭐ Vamos conquistar o dia juntos?"
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isVoiceTesting ? (
                      <button
                        type="button"
                        onClick={handleStopTestVoice}
                        className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-xs transition-all border border-white/30 shadow-xs"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>Pausar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePlayTestVoice('TEST_VOICE')}
                        className="px-4 py-2 rounded-xl bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-orange-600" />
                        <span>Ouvir voz de teste</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Phrase Presets Explorer */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    💬 Testar Frases Especiais do Polaris:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      {
                        key: 'TASK_COMPLETED' as PolarisPhraseType,
                        label: '⭐ Conclusão',
                        text: 'Yaaay! Você conseguiu! ⭐ Eu sabia que você dava conta!',
                      },
                      {
                        key: 'TASK_OVERDUE' as PolarisPhraseType,
                        label: '🥺 Atrasada',
                        text: 'Ei... temos uma tarefinha esperando você. 🥺 Vamos resolver isso juntos?',
                      },
                      {
                        key: 'TASK_REMINDER' as PolarisPhraseType,
                        label: '✨ Lembrete',
                        text: 'Psst! ✨ Só passando para lembrar que você tem uma tarefa chegando!',
                      },
                      {
                        key: 'LEVEL_UP' as PolarisPhraseType,
                        label: '🌟 Nível Up',
                        text: 'Uau! Você subiu de nível! 🌟 Estou ficando cada vez mais poderoso!',
                      },
                      {
                        key: 'FOCUS_START' as PolarisPhraseType,
                        label: '💜 Foco',
                        text: 'Shhh... vamos focar juntos? Você consegue! 💜',
                      },
                      {
                        key: 'REST_ADVICE' as PolarisPhraseType,
                        label: '🌙 Descanso',
                        text: 'Você trabalhou bastante hoje. 🌙 Que tal descansar um pouquinho?',
                      },
                    ].map((p) => {
                      const isThisActive = isVoiceTesting && activeTestPhrase === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => handlePlayTestVoice(p.key)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isThisActive
                              ? 'border-orange-500 bg-orange-50 dark:bg-amber-950/70 text-orange-800 dark:text-orange-200 shadow-xs'
                              : 'border-orange-100/80 dark:border-amber-950/60 bg-white/70 dark:bg-slate-900/50 hover:border-orange-300 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">{p.label}</span>
                            {isThisActive ? (
                              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                            ) : (
                              <Play className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                            "{p.text}"
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sound Effects Toggle */}
          <div className="p-4 rounded-2xl border border-orange-100/80 dark:border-amber-950/60 flex items-center justify-between bg-white dark:bg-[#1D1A16]">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                Efeitos Sonoros (Chimes)
              </span>
              <span className="text-[11px] text-slate-400">
                Sons e melodias cósmicas ao concluir tarefas e metas
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition-colors ${
                user.preferences.soundEffectsEnabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications & Push Engine */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Notificações Push Reais
                </h3>
                {!isPushSupported ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-slate-500" />
                    Não Suportado
                  </span>
                ) : pushPermission === 'denied' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Bloqueadas
                  </span>
                ) : pushPermission === 'granted' && isPushSubscribed ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ativadas
                  </span>
                ) : pushPermission === 'granted' && !isPushSubscribed ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Inscrição Pendente
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Permissão Necessária
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Receba lembretes pontuais de suas tarefas mesmo com o aplicativo fechado.
              </p>
            </div>
          </div>

          {/* Push Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTogglePushSubscription}
              disabled={pushLoading || !isPushSupported}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isPushSubscribed
                  ? 'border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white shadow-md shadow-orange-500/20'
              }`}
            >
              {pushLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Bell className="w-3.5 h-3.5" />
              )}
              <span>{isPushSubscribed ? 'Desativar Push' : 'Ativar Push no Dispositivo'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendRealTestPush}
              disabled={pushLoading}
              className="px-3.5 py-2 rounded-xl border border-orange-200 dark:border-amber-900/60 text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-[#251E18] active:scale-95 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-orange-500" />
              Testar Push Real
            </button>
          </div>
        </div>

        {/* Permission Denied Assistance Banner */}
        {pushPermission === 'denied' && (
          <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/70 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div>
              <strong className="block mb-0.5">Permissão de notificações bloqueada no navegador:</strong>
              Para reativar os lembretes reais, clique no ícone de <strong>cadeado/configurações</strong> ao lado do endereço do site (URL), altere <strong>Notificações</strong> para <strong>Permitir</strong> e recarregue a página.
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {pushMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
              pushMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                : pushMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
            }`}
          >
            {pushMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : pushMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            ) : (
              <Info className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <span className="font-medium">{pushMessage.text}</span>
          </div>
        )}

        {/* Device and Subscriptions info */}
        <div className="p-4 rounded-2xl bg-orange-50/40 dark:bg-[#251E18]/60 border border-orange-100/70 dark:border-amber-950/60 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              {deviceType.includes('android') || deviceType.includes('ios') ? (
                <Smartphone className="w-4 h-4 text-orange-500" />
              ) : (
                <Laptop className="w-4 h-4 text-orange-500" />
              )}
              <span>
                Dispositivo atual: <strong className="text-slate-800 dark:text-slate-100 capitalize">{deviceType}</strong>
              </span>
            </div>

            {isAuthUser && userSubscriptions.length > 0 && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {userSubscriptions.length} {userSubscriptions.length === 1 ? 'dispositivo conectado' : 'dispositivos conectados'} no Supabase
              </div>
            )}
          </div>

          {/* iOS Special Banner */}
          {isIOS && !isPWA && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong className="block">Dica para iPhone/iOS:</strong>
                Para receber notificações com a tela bloqueada ou app fechado no iOS, adicione o Polaris à Tela de Início (toque em <em>Compartilhar</em> ➔ <em>Adicionar à Tela de Início</em>).
              </div>
            </div>
          )}
        </div>

        {/* Configurações Individuais de Lembretes */}
        <div className="space-y-3 pt-2">
          {/* 1. Notificações Push do Dispositivo */}
          <div className="p-4 rounded-2xl border border-orange-100/80 dark:border-amber-950/60 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                🔔 Notificações Push
              </span>
              <span className="text-[11px] text-slate-400">
                Permitir envio de alertas Web Push diretamente para este dispositivo
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const current = user.preferences.browserNotificationsEnabled ?? true;
                onUpdateUser({
                  ...user,
                  preferences: {
                    ...user.preferences,
                    browserNotificationsEnabled: !current,
                  },
                });
                soundManager.playPop();
              }}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                (user.preferences.browserNotificationsEnabled ?? true)
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
              aria-label="Alternar Notificações Push"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Lembretes de tarefas */}
          <div className="p-4 rounded-2xl border border-orange-100/80 dark:border-amber-950/60 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                📋 Lembretes de tarefas
              </span>
              <span className="text-[11px] text-slate-400">
                Notificar nos horários definidos para suas atividades agendadas
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const current = user.preferences.taskRemindersEnabled ?? true;
                onUpdateUser({
                  ...user,
                  preferences: {
                    ...user.preferences,
                    taskRemindersEnabled: !current,
                  },
                });
                soundManager.playPop();
              }}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                (user.preferences.taskRemindersEnabled ?? true)
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
              aria-label="Alternar lembretes de tarefas"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* 3. Tarefas atrasadas */}
          <div className="p-4 rounded-2xl border border-rose-100/80 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/10 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block flex items-center gap-1.5">
                <span>⚠️ Tarefas atrasadas</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Avisar quando uma tarefa ultrapassar a data ou horário sem conclusão
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const current = user.preferences.overdueAlertsEnabled ?? true;
                onUpdateUser({
                  ...user,
                  preferences: {
                    ...user.preferences,
                    overdueAlertsEnabled: !current,
                  },
                });
                soundManager.playPop();
              }}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                (user.preferences.overdueAlertsEnabled ?? true)
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
              aria-label="Alternar alertas de tarefas atrasadas"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* 4. Lembretes antes do vencimento */}
          <div className="p-4 rounded-2xl border border-orange-100/80 dark:border-amber-950/60 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                ⏰ Lembretes antes do vencimento
              </span>
              <span className="text-[11px] text-slate-400">
                Notificar com antecedência configurada (15 min, 30 min, 1 hora antes)
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const current = user.preferences.advanceRemindersEnabled ?? true;
                onUpdateUser({
                  ...user,
                  preferences: {
                    ...user.preferences,
                    advanceRemindersEnabled: !current,
                  },
                });
                soundManager.playPop();
              }}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                (user.preferences.advanceRemindersEnabled ?? true)
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
              aria-label="Alternar lembretes antes do horário"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Preferências Visuais e Metas */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
          Preferências Visuais & Metas
        </h3>

        {/* Theme Mode Selector (Dark / Light) */}
        <div className="p-4 rounded-2xl bg-orange-50/40 dark:bg-[#251E18]/60 border border-orange-100/70 dark:border-amber-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                Tema Visual da Interface
              </span>
              <span className="text-[11px] text-slate-400">
                Alterne entre o tema claro suave e o tema escuro contrastante
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (isDark) onToggleTheme();
                onUpdateUser({
                  ...user,
                  preferences: { ...user.preferences, theme: 'light' },
                });
              }}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isDark
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-300 border-orange-100 dark:border-amber-900/50 hover:border-orange-200'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>☀️ Modo Claro</span>
              {!isDark && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isDark) onToggleTheme();
                onUpdateUser({
                  ...user,
                  preferences: { ...user.preferences, theme: 'dark' },
                });
              }}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-300 border-orange-100 dark:border-amber-900/50 hover:border-orange-200'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>🌙 Modo Escuro</span>
              {isDark && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Daily Goal Setting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-orange-50/40 dark:bg-[#251E18]/60 border border-orange-100/70 dark:border-amber-950/60">
          <div>
            <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
              Meta Diária de Tarefas
            </span>
            <span className="text-[11px] text-slate-400">
              Quantas tarefas você deseja concluir por dia
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[3, 5, 8, 10].map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => handleDailyGoalChange(goal)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  user.preferences.dailyGoal === goal
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs'
                    : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-300 border-orange-100 dark:border-amber-900/50 hover:border-orange-200'
                }`}
              >
                {goal} / dia
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Supabase Database & Auth Live Status */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Integração Supabase
                </h3>
                {isConfigured ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                    Aguardando Chaves
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isAuthUser
                  ? `Sessão ativa autenticada via Supabase Auth (${user.email})`
                  : 'Sessão local (conecte sua conta para persistência total em nuvem)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthUser ? (
              <button
                type="button"
                onClick={handleSignOutClick}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Desconectar
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Entrar com Supabase
              </button>
            )}
          </div>
        </div>

        {/* Database Tables & Security Checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
          {['categories', 'tasks', 'character_settings', 'task_history'].map((tbl) => (
            <div
              key={tbl}
              className="p-2.5 rounded-xl bg-orange-50/50 dark:bg-[#251E18] border border-orange-100/70 dark:border-amber-950/50 text-[11px] font-bold text-slate-700 dark:text-slate-300"
            >
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                RLS Ativo
              </div>
              <span className="font-mono text-xs">{tbl}</span>
            </div>
          ))}
        </div>

        {/* SQL Schema helper toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="text-xs text-orange-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            {showSqlGuide ? 'Ocultar Script SQL das Tabelas' : 'Ver / Copiar Script SQL do Supabase'}
          </button>

          {showSqlGuide && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 text-xs space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Execute no SQL Editor do Supabase:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`-- TABELAS & POLÍTICAS RLS DO SUPABASE (AGENDA POLARIS)

-- 1. TABELA: categories
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  bg_light TEXT,
  bg_dark TEXT,
  text_light TEXT,
  border_light TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- 2. TABELA: tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL DEFAULT 'work',
  custom_category_name TEXT,
  custom_color TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  recurrence TEXT NOT NULL DEFAULT 'none',
  estimated_minutes INTEGER,
  reminders JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA: character_settings
CREATE TABLE IF NOT EXISTS public.character_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  stardust INTEGER DEFAULT 0,
  age_days INTEGER DEFAULT 1,
  stage TEXT DEFAULT 'baby',
  affinity INTEGER DEFAULT 50,
  equipped_accessory TEXT DEFAULT 'none',
  equipped_aura TEXT DEFAULT 'none',
  unlocked_items TEXT[] DEFAULT ARRAY['none']::TEXT[],
  claimed_missions TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_fed_date DATE,
  total_care_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA: task_history
CREATE TABLE IF NOT EXISTS public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- POLÍTICA: categories
DROP POLICY IF EXISTS "categories_user_policy" ON public.categories;
CREATE POLICY "categories_user_policy" ON public.categories
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICA: tasks
DROP POLICY IF EXISTS "tasks_user_policy" ON public.tasks;
CREATE POLICY "tasks_user_policy" ON public.tasks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICA: character_settings
DROP POLICY IF EXISTS "character_settings_user_policy" ON public.character_settings;
CREATE POLICY "character_settings_user_policy" ON public.character_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICA: task_history
DROP POLICY IF EXISTS "task_history_user_policy" ON public.task_history;
CREATE POLICY "task_history_user_policy" ON public.task_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);`);
                    setCopiedSql(true);
                    soundManager.playPop();
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedSql ? 'Copiado!' : 'Copiar SQL'}
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Todas as 4 tabelas contam com Row Level Security (RLS) baseado em <code className="text-emerald-400">auth.uid() = user_id</code>, garantindo privacidade total para cada usuário.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
          Dados & Backup
        </h3>
        <p className="text-xs text-slate-400">
          Seus dados são salvos localmente com segurança. Você pode exportar, importar ou reiniciar a demonstração.
        </p>

        {importStatus && (
          <div className="p-3 rounded-2xl bg-orange-50 dark:bg-amber-950/70 border border-orange-200 dark:border-amber-900 text-xs font-bold text-orange-700 dark:text-amber-300">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {/* Export JSON */}
          <button
            type="button"
            onClick={onExportData}
            className="px-4 py-2.5 rounded-2xl bg-orange-50/70 dark:bg-[#251E18] hover:bg-orange-100/70 dark:hover:bg-[#2E251E] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-2 border border-orange-100 dark:border-amber-950/60"
          >
            <Download className="w-4 h-4 text-orange-500" />
            Exportar Backup JSON
          </button>

          {/* Import JSON */}
          <label className="px-4 py-2.5 rounded-2xl bg-orange-50/70 dark:bg-[#251E18] hover:bg-orange-100/70 dark:hover:bg-[#2E251E] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-2 border border-orange-100 dark:border-amber-950/60 cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-500" />
            Importar Backup
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Reset Demo Data */}
          <button
            type="button"
            onClick={onResetDemoData}
            className="px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Recarregar Dados de Exemplo
          </button>
        </div>
      </div>
    </div>
  );
};
