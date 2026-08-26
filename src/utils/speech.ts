/**
 * Speech synthesis utility for Nino in Portuguese
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private isLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      // Find PT-BR voice or fallback to PT or first voice
      const ptBr = voices.find(v => v.lang.toLowerCase().startsWith('pt-br') || v.lang.toLowerCase().startsWith('pt_br'));
      const pt = voices.find(v => v.lang.toLowerCase().startsWith('pt'));
      this.voice = ptBr || pt || voices[0];
      this.isLoaded = true;
    }
  }

  public speak(text: string, options?: { pitch?: number; rate?: number }) {
    if (!this.synth) return;
    
    // Clean emojis and text formatting for clearer speech
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\*/g, '')
      .trim();

    if (!cleanText) return;

    try {
      this.synth.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.lang = 'pt-BR';
      utterance.pitch = options?.pitch ?? 1.15; // Friendly higher pitch for Nino
      utterance.rate = options?.rate ?? 1.05;

      this.synth.speak(utterance);
    } catch {
      // Speech may fail if user hasn't interacted
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const speechService = new SpeechService();
