/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Dumbbell, LogOut, User, Droplet } from 'lucide-react';
import { Toaster } from 'sonner';
import { auth, signIn, logOut } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ExerciseCard } from './components/ExerciseCard';
import { WaterTracker } from './components/WaterTracker';

const treinos = {
  A: [
    { title: "Costas Largura", options: ["Puxada Aberta Pronada (Máquina Eunápolis)", "Puxada Aberta Pronada (Máquina Conquista)"] },
    { title: "Costas Espessura", options: ["Remada Alta Pegada Pronada (Eunápolis)", "Remada Alta Pegada Pronada (Conquista)"] },
    { title: "Peitoral Superior", options: ["Supino Inclinado Máquina", "Supino Inclinado com Halteres"] },
    { title: "Peitoral Isolamento", options: ["Crucifixo Máquina (Eunápolis)", "Crucifixo Máquina (Conquista)"] },
    { title: "Ombro Lateral", options: ["Elevação Lateral na polia Eunápolis", "Elevação Lateral na polia Conquista"] }
  ],
  B: [
    { title: "Quadríceps", options: ["Cadeira Extensora (Eunápolis)", "Cadeira Extensora (Conquista)", "Leg Press 45º"] },
    { title: "Posterior de Coxa", options: ["Mesa Flexora Eunápolis", "Mesa Flexora Conquista"] },
    { title: "Tríceps", options: ["Tríceps na polia Eunápolis", "Tríceps na polia Conquista"] },
    { title: "Bíceps", options: ["Rosca W Conquista", "Rosca W Eunápolis"] }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'WATER'>('A');
  const [user, setUser] = useState(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4FF00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
        <Dumbbell className="w-16 h-16 text-[#D4FF00] mb-6" />
        <h1 className="text-3xl font-black mb-2 text-center tracking-tighter uppercase">Hyper<span className="text-[#D4FF00]">Track</span></h1>
        <p className="text-zinc-400 mb-8 text-center max-w-sm">
          Seu diário de hipertrofia minimalista. Acesse para registrar seu progresso.
        </p>
        <button
          onClick={signIn}
          className="bg-[#D4FF00] hover:bg-[#D4FF00]/80 text-black font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-3 transition-colors border border-transparent"
        >
          <User className="w-5 h-5" />
          <span>Entrar com Google</span>
        </button>
      </div>
    );
  }

  const currentWorkout = activeTab === 'A' ? treinos.A : treinos.B;
  const currentWorkoutLabel = activeTab === 'A' ? 'TREINO A' : 'TREINO B';

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-[#D4FF00]/30">
      <Toaster theme="dark" position="top-center" />
      
      {/* Navbar */}
      <nav className="bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-[#D4FF00]" />
            <span className="text-xl font-black tracking-tighter text-white uppercase">Hyper<span className="text-[#D4FF00]">Track</span></span>
          </div>
          <button
            onClick={logOut}
            className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* Tabs */}
        <div className="flex bg-zinc-900 p-1 rounded-xl mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <button
            onClick={() => setActiveTab('A')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'A' 
                ? 'bg-zinc-800 text-[#D4FF00] shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Treino A
          </button>
          <button
            onClick={() => setActiveTab('B')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'B' 
                ? 'bg-zinc-800 text-[#D4FF00] shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Treino B
          </button>
          <button
            onClick={() => setActiveTab('WATER')}
            className={`flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'WATER' 
                ? 'bg-zinc-800 text-[#D4FF00] shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Droplet size={16} />
            Água
          </button>
        </div>

        {/* Workout list */}
        {activeTab !== 'WATER' ? (
          <div className="flex flex-col gap-6">
            {currentWorkout.map((exercise, index) => (
              <ExerciseCard
                key={`${activeTab}-${index}`}
                title={exercise.title}
                options={exercise.options}
                workoutType={currentWorkoutLabel}
              />
            ))}
          </div>
        ) : (
          <WaterTracker />
        )}
      </main>
    </div>
  );
}
