/**
 * Sistema Avançado de Voz e Personalidades Vocais do Polaris
 * Especialmente arquitetado para a língua portuguesa (pt-BR)
 * com distinção real de vozes, limpeza fonética e modulação natural.
 */

import { PolarisVocalPersonality } from '../types';

export type { PolarisVocalPersonality };

export interface PolarisPersonalityConfig {
  id: PolarisVocalPersonality;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  testPhrase: string;
  defaultPitch: number;
  defaultRate: number;
  defaultVolume: number;
  preferredKeywords: string[];
}

export const POLARIS_PERSONALITIES: Record<PolarisVocalPersonality, PolarisPersonalityConfig> = {
  cute: {
    id: 'cute',
    name: 'Fofo',
    emoji: '🌟',
    tagline: 'Voz suave, alegre e carinhosa',
    description: 'Sensação de mascote jovem, leve e acolhedor.',
    testPhrase: 'Oi! Eu sou o Polaris! ✨ Vamos fazer um pouquinho do nosso dia juntos?',
    defaultPitch: 1.22,
    defaultRate: 0.94,
    defaultVolume: 1.0,
    preferredKeywords: [
      'francisca',
      'luciana',
      'leticia',
      'camila',
      'yara',
      'thalita',
      'google português do brasil',
      'vitoria',
      'female',
      'natural',
    ],
  },
  energetic: {
    id: 'energetic',
    name: 'Energético',
    emoji: '⚡',
    tagline: 'Voz animada, expressiva e empolgada',
    description: 'Motivação ativa e foco dinâmico para atingir metas.',
    testPhrase: 'Vamos lá! ⚡ Hoje é um ótimo dia para conquistar suas metas!',
    defaultPitch: 1.12,
    defaultRate: 1.04,
    defaultVolume: 1.0,
    preferredKeywords: [
      'antonio',
      'felipe',
      'daniel',
      'rodrigo',
      'male',
      'man',
      'online',
      'google português do brasil',
    ],
  },
  calm: {
    id: 'calm',
    name: 'Calmo',
    emoji: '🌙',
    tagline: 'Voz tranquila, suave e relaxante',
    description: 'Serenidade para momentos de foco, pausas e reflexão.',
    testPhrase: 'Respire fundo... 🌙 Vamos fazer tudo com calma, um passo de cada vez.',
    defaultPitch: 1.00,
    defaultRate: 0.85,
    defaultVolume: 0.95,
    preferredKeywords: [
      'maria',
      'heloisa',
      'joana',
      'natural',
      'luciana',
      'google português do brasil',
    ],
  },
  celebration: {
    id: 'celebration',
    name: 'Comemorativo',
    emoji: '🎉',
    tagline: 'Voz vibrante para conquistas e vitórias',
    description: 'Celebração comemorativa para tarefas concluídas e Level Up.',
    testPhrase: 'UAAAAU! 🎉 Você conseguiu! Eu estou muito orgulhoso de você!',
    defaultPitch: 1.20,
    defaultRate: 1.05,
    defaultVolume: 1.0,
    preferredKeywords: [
      'francisca',
      'luciana',
      'google português do brasil',
      'thalita',
      'leticia',
      'vitoria',
    ],
  },
  concerned: {
    id: 'concerned',
    name: 'Preocupado',
    emoji: '🥺',
    tagline: 'Voz delicada e empática',
    description: 'Apoio gentil para tarefas atrasadas e lembretes amigáveis.',
    testPhrase: 'Ei... 🥺 parece que temos uma tarefa esperando você. Vamos resolver isso juntos?',
    defaultPitch: 1.08,
    defaultRate: 0.90,
    defaultVolume: 0.95,
    preferredKeywords: [
      'leticia',
      'camila',
      'yara',
      'luciana',
      'maria',
      'google português do brasil',
    ],
  },
};

export interface SpeakOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  personality?: PolarisVocalPersonality;
  voiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export const POLARIS_VOICE_PRESETS = {
  TASK_COMPLETED: 'Yaaay! Você conseguiu! ⭐ Eu sabia que você dava conta!',
  TASK_COMPLETED_ALL: 'Uhuuul! Você zerou todas as tarefas de hoje! Você é sensacional! 🌟',
  TASK_OVERDUE: 'Ei... temos uma tarefinha esperando você. 🥺 Vamos resolver isso juntos?',
  TASK_REMINDER: 'Psst! ✨ Só passando para lembrar que você tem uma tarefa chegando!',
  LEVEL_UP: 'Uau! Você subiu de nível! 🌟 Estou ficando cada vez mais poderoso!',
  FOCUS_START: 'Shhh... vamos focar juntos? Você consegue! 💜',
  FOCUS_COMPLETED: 'Fantástico! Sessão de foco finalizada com sucesso! Você brilhou! ✨',
  REST_ADVICE: 'Você trabalhou bastante hoje. 🌙 Que tal descansar um pouquinho?',
  GOOD_MORNING: 'Bom diaaa! ☀️ Preparado para mais uma aventura cósmica?',
  GOOD_NIGHT: 'Boa noite! 🌙 Você fez um ótimo trabalho hoje. Descanse bem!',
  TEST_VOICE: 'Oi! Eu sou o Polaris! ⭐ Vamos conquistar o dia juntos?',
} as const;

export type PolarisPhraseType = keyof typeof POLARIS_VOICE_PRESETS;

/**
 * Limpa o texto antes de enviar para a síntese de voz:
 * - Remove todos os emojis para não serem lidos literalmente como caracteres ou códigos
 * - Limpa tags HTML e formatação markdown (*, _, ~, #, backticks, [], ())
 * - Converte símbolos numéricos úteis (+50 XP -> mais 50 XP, % -> por cento, horários -> horas)
 * - Preserva pontuação relevante (..., !, ?, , .) para garantir pausas e cadência natural
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove tags HTML
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 2. Converte símbolos numéricos e termos comuns
  cleaned = cleaned.replace(/\+(\d+)\s*(xp|pontos)?/gi, 'mais $1 $2');
  cleaned = cleaned.replace(/(\d+)%/g, '$1 por cento');
  cleaned = cleaned.replace(/\b(\d{1,2}):00\b/g, '$1 horas');
  cleaned = cleaned.replace(/\b(\d{1,2}):(\d{2})\b/g, '$1 horas e $2 minutos');
  cleaned = cleaned.replace(/\b(\d{1,2})h(\d{2})\b/gi, '$1 horas e $2 minutos');
  cleaned = cleaned.replace(/\b(\d{1,2})h\b/gi, '$1 horas');
  cleaned = cleaned.replace(/&/g, ' e ');
  cleaned = cleaned.replace(/@/g, ' arroba ');

  // 3. Remove caracteres de markdown
  cleaned = cleaned.replace(/[*#_~`[\]()]/g, '');

  // 4. Remove todos os emojis através de faixas unicode completas
  cleaned = cleaned.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F200}-\u{1F2FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
    ''
  );

  // 5. Normaliza reticências e pontuações para pausas naturais
  cleaned = cleaned.replace(/\.{3,}/g, '... ');
  cleaned = cleaned.replace(/!{2,}/g, '!');
  cleaned = cleaned.replace(/\?{2,}/g, '?');

  // 6. Remove hífens soltos no início de frases
  cleaned = cleaned.replace(/^[\s\-–—]+/gm, '');

  // 7. Normaliza espaços múltiplos
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private isLoaded: boolean = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private voiceListeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.refreshVoices();

      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.refreshVoices();
        };
      }

      // Fallback assíncrono para navegadores como Chrome, Edge e Safari
      setTimeout(() => this.refreshVoices(), 250);
      setTimeout(() => this.refreshVoices(), 800);
      setTimeout(() => this.refreshVoices(), 2000);
    }
  }

  private refreshVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices() || [];
    if (voices.length > 0) {
      this.availableVoices = voices;
      this.isLoaded = true;
      this.voiceListeners.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    }
  }

  public onVoicesLoaded(callback: () => void): () => void {
    this.voiceListeners.push(callback);
    if (this.isLoaded) {
      callback();
    }
    return () => {
      this.voiceListeners = this.voiceListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Retorna todas as vozes em português (preferencialmente pt-BR)
   */
  public getPtBrVoices(): SpeechSynthesisVoice[] {
    const all = this.getAvailableVoices();
    const ptVoices = all.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('pt') ||
        v.name.toLowerCase().includes('portuguese') ||
        v.name.toLowerCase().includes('brasil') ||
        v.name.toLowerCase().includes('brazil')
    );

    // Prioriza pt-BR sobre pt-PT
    ptVoices.sort((a, b) => {
      const aIsBr = a.lang.toLowerCase().includes('br') || a.name.toLowerCase().includes('brasil') ? 1 : 0;
      const bIsBr = b.lang.toLowerCase().includes('br') || b.name.toLowerCase().includes('brasil') ? 1 : 0;
      return bIsBr - aIsBr;
    });

    return ptVoices;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && this.synth) {
      this.availableVoices = this.synth.getVoices() || [];
    }
    return this.availableVoices;
  }

  /**
   * Escolhe a melhor voz real do dispositivo para uma determinada personalidade do Polaris
   */
  public getPolarisVoice(
    personality: PolarisVocalPersonality = 'cute',
    preferredVoiceURI?: string
  ): SpeechSynthesisVoice | null {
    const allVoices = this.getAvailableVoices();
    if (!allVoices.length) return null;

    // Se o usuário solicitou uma voz específica manualmente
    if (preferredVoiceURI) {
      const manualMatch = allVoices.find((v) => v.voiceURI === preferredVoiceURI);
      if (manualMatch) return manualMatch;
    }

    const ptVoices = this.getPtBrVoices();
    const config = POLARIS_PERSONALITIES[personality] || POLARIS_PERSONALITIES.cute;

    // 1. Procura na lista de vozes em português pela palavra-chave prioritária da personalidade
    if (ptVoices.length > 0) {
      for (const keyword of config.preferredKeywords) {
        const found = ptVoices.find((v) =>
          v.name.toLowerCase().includes(keyword.toLowerCase())
        );
        if (found) return found;
      }

      // Se houver múltiplas vozes em português, distribui inteligentemente:
      if (ptVoices.length >= 3) {
        if (personality === 'energetic') {
          // Busca voz masculina ou 2ª voz
          const male = ptVoices.find((v) =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('antonio') ||
            v.name.toLowerCase().includes('felipe') ||
            v.name.toLowerCase().includes('daniel')
          );
          return male || ptVoices[1] || ptVoices[0];
        }

        if (personality === 'calm') {
          // Busca voz suave/calma ou 3ª voz
          const calmVoice = ptVoices.find((v) =>
            v.name.toLowerCase().includes('maria') ||
            v.name.toLowerCase().includes('heloisa') ||
            v.name.toLowerCase().includes('joana')
          );
          return calmVoice || ptVoices[2] || ptVoices[0];
        }

        if (personality === 'celebration' || personality === 'cute') {
          return ptVoices[0];
        }

        if (personality === 'concerned') {
          return ptVoices[1] || ptVoices[0];
        }
      } else if (ptVoices.length === 2) {
        if (personality === 'energetic' || personality === 'celebration') {
          return ptVoices[1];
        }
        return ptVoices[0];
      }

      // Fallback para a primeira voz pt-BR
      return ptVoices[0];
    }

    // 2. Se não houver voz pt-BR, busca qualquer voz portuguesa ou a padrão do sistema
    const fallbackPt = allVoices.find((v) => v.lang.toLowerCase().startsWith('pt'));
    if (fallbackPt) return fallbackPt;

    const defaultVoice = allVoices.find((v) => v.default) || allVoices[0];
    return defaultVoice || null;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Fala um texto qualquer utilizando as configurações da personalidade escolhida
   */
  public speak(text: string, options?: SpeakOptions) {
    if (!this.synth) return;

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    try {
      // Cancela qualquer fala pendente para evitar enfileiramento infinito
      this.synth.cancel();

      if (this.synth.paused) {
        this.synth.resume();
      }

      const personalityKey = options?.personality || 'cute';
      const personalityConfig = POLARIS_PERSONALITIES[personalityKey] || POLARIS_PERSONALITIES.cute;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Seleciona a voz apropriada
      const voice = this.getPolarisVoice(personalityKey, options?.voiceURI);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'pt-BR';
      } else {
        utterance.lang = 'pt-BR';
      }

      // Aplica pitch, rate e volume com limites de naturalidade
      const finalPitch = options?.pitch ?? personalityConfig.defaultPitch;
      const finalRate = options?.rate ?? personalityConfig.defaultRate;
      const finalVolume = options?.volume ?? personalityConfig.defaultVolume;

      utterance.pitch = Math.max(0.8, Math.min(1.5, finalPitch));
      utterance.rate = Math.max(0.7, Math.min(1.3, finalRate));
      utterance.volume = Math.max(0.0, Math.min(1.0, finalVolume));

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.activeUtterance = null;
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.activeUtterance = null;
        options?.onError?.(e);
        options?.onEnd?.();
      };

      this.activeUtterance = utterance;
      this.synth.speak(utterance);
    } catch (e) {
      options?.onError?.(e);
      options?.onEnd?.();
    }
  }

  /**
   * Fala a frase de teste de uma personalidade específica
   */
  public testPersonality(personality: PolarisVocalPersonality, options?: SpeakOptions) {
    const config = POLARIS_PERSONALITIES[personality] || POLARIS_PERSONALITIES.cute;
    this.speak(config.testPhrase, {
      personality,
      pitch: options?.pitch ?? config.defaultPitch,
      rate: options?.rate ?? config.defaultRate,
      volume: options?.volume ?? config.defaultVolume,
      voiceURI: options?.voiceURI,
      ...options,
    });
  }

  /**
   * Executa frase pré-definida com a personalidade contextual adequada
   */
  public speakPolaris(phraseType: PolarisPhraseType, options?: SpeakOptions) {
    const rawText = POLARIS_VOICE_PRESETS[phraseType];
    let contextualPersonality: PolarisVocalPersonality = options?.personality || 'cute';

    // Mapeamento contextual inteligente
    if (phraseType === 'TASK_COMPLETED' || phraseType === 'TASK_COMPLETED_ALL' || phraseType === 'LEVEL_UP' || phraseType === 'FOCUS_COMPLETED') {
      contextualPersonality = 'celebration';
    } else if (phraseType === 'TASK_OVERDUE') {
      contextualPersonality = 'concerned';
    } else if (phraseType === 'FOCUS_START' || phraseType === 'GOOD_NIGHT' || phraseType === 'REST_ADVICE') {
      contextualPersonality = 'calm';
    } else if (phraseType === 'GOOD_MORNING') {
      contextualPersonality = 'energetic';
    }

    this.speak(rawText, {
      personality: contextualPersonality,
      ...options,
    });
  }

  /**
   * Para a fala imediatamente
   */
  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
      this.activeUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Fornece um relatório diagnóstico das vozes disponíveis no navegador
   */
  public getVoiceDiagnostics(): {
    allVoicesCount: number;
    ptVoices: Array<{ name: string; lang: string; voiceURI: string; default: boolean }>;
    personalityVoiceMap: Record<PolarisVocalPersonality, string>;
  } {
    const all = this.getAvailableVoices();
    const pt = this.getPtBrVoices();

    const personalityVoiceMap: Record<PolarisVocalPersonality, string> = {
      cute: this.getPolarisVoice('cute')?.name || 'Padrão do Sistema',
      energetic: this.getPolarisVoice('energetic')?.name || 'Padrão do Sistema',
      calm: this.getPolarisVoice('calm')?.name || 'Padrão do Sistema',
      celebration: this.getPolarisVoice('celebration')?.name || 'Padrão do Sistema',
      concerned: this.getPolarisVoice('concerned')?.name || 'Padrão do Sistema',
    };

    return {
      allVoicesCount: all.length,
      ptVoices: pt.map((v) => ({
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
        default: v.default,
      })),
      personalityVoiceMap,
    };
  }
}

export const speechService = new SpeechService();
