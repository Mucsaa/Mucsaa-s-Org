import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  Check,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Database,
  Info,
} from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithEmail, signUpWithEmail } from '../services/supabase/auth';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { soundManager } from '../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
  currentUser: UserProfile;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Por favor, informe seu nome.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await signUpWithEmail(email, password, name);
        if (res.error) {
          setErrorMsg(res.error);
          soundManager.playError();
        } else if (res.needsEmailConfirmation) {
          setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail para confirmar ou faça login se a confirmação estiver desativada.');
          soundManager.playCelebration();
        } else if (res.user) {
          soundManager.playCelebration();
          onLogin(res.user);
          onClose();
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setErrorMsg(res.error);
          soundManager.playError();
        } else if (res.user) {
          soundManager.playSuccess();
          onLogin(res.user);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao autenticar no Supabase.');
      soundManager.playError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md bg-white dark:bg-[#1D1A16] rounded-3xl shadow-2xl border border-orange-100/90 dark:border-amber-950/70 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-orange-100/80 dark:border-amber-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                {mode === 'login' ? 'Acessar com Supabase' : 'Criar Conta no Supabase'}
              </h3>
              <p className="text-xs text-slate-400">Banco de dados seguro com Row Level Security</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Notice if VITE_SUPABASE_URL is missing */}
        {!isConfigured && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong className="block font-bold">Variáveis de ambiente do Supabase:</strong>
              Para autenticar seus usuários no seu projeto do Supabase, adicione <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-[11px]">VITE_SUPABASE_URL</code> e <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-[11px]">VITE_SUPABASE_PUBLISHABLE_KEY</code> no seu arquivo de ambiente.
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Seu Nome
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Samuel Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Senha (mínimo 6 caracteres)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Conectando ao Supabase...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span>Entrar na Agenda</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Criar Conta no Supabase</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setSuccessMsg('');
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="text-xs text-orange-600 dark:text-amber-400 font-bold hover:underline"
            >
              {mode === 'login'
                ? 'Não tem conta no Supabase? Cadastre-se gratuitamente'
                : 'Já tem conta? Clique aqui para entrar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
