'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Ne rien afficher même en cas d'erreur (sécurité)
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Email envoyé</h2>
          <p className="text-gray-400 text-sm mb-6">
            Si cet email est associé à un compte, vous recevrez un lien de réinitialisation dans
            quelques instants.
          </p>
          <a href="/login" className="text-indigo-400 text-sm hover:underline">
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-white mb-2">Mot de passe oublié</h1>
        <p className="text-gray-400 text-sm mb-6">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register('email', { required: true })}
            type="email"
            placeholder="votre@email.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>
        <a
          href="/login"
          className="block text-center text-gray-500 text-sm mt-4 hover:text-gray-400"
        >
          ← Retour
        </a>
      </div>
    </div>
  );
}
