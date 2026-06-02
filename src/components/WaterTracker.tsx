import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Droplet, RotateCcw, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function WaterTracker() {
  const [totalMl, setTotalMl] = useState<number>(0);
  const [inputMl, setInputMl] = useState<string>('250');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchWater = async () => {
      if (!auth.currentUser) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, 'water_logs', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTotalMl(docSnap.data().totalMl || 0);
        } else {
          setTotalMl(0);
        }
      } catch (err) {
        console.error("Failed to load water log", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWater();
  }, []);

  const handleAddWater = async () => {
    if (!auth.currentUser) return;
    const amount = Number(inputMl);
    if (!amount || amount <= 0) {
      toast.error('Insira um valor válido de ml');
      return;
    }

    const newTotal = totalMl + amount;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'water_logs', auth.currentUser.uid);
      await setDoc(docRef, {
        userId: auth.currentUser.uid,
        totalMl: newTotal,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setTotalMl(newTotal);
      toast.success(`${amount}ml adicionados!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'water_logs');
      toast.error('Erro ao adicionar água.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'water_logs', auth.currentUser.uid);
      await setDoc(docRef, {
        userId: auth.currentUser.uid,
        totalMl: 0,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setTotalMl(0);
      toast.success('Ciclo de água resetado (Novo Dia)');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'water_logs');
      toast.error('Erro ao resetar.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[250px] shadow-xl">
         <div className="w-8 h-8 border-4 border-[#D4FF00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const goal = 5000;
  const percentage = Math.min((totalMl / goal) * 100, 100);

  return (
    <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-6 flex flex-col gap-6 shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 text-[#D4FF00]/5 pointer-events-none">
        <Droplet size={150} fill="currentColor" strokeWidth={0} />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Droplet className="text-[#D4FF00]" size={24} />
            Hidratação
          </h2>
          <p className="text-xs text-zinc-400 font-medium">Meta sugerida: {goal}ml/dia</p>
        </div>
        <button 
          onClick={handleReset}
          disabled={isSaving}
          className="p-2 bg-zinc-900/80 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg border border-zinc-700 transition-colors"
          title="Resetar (Novo Dia)"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 my-2 relative z-10">
        <span className="text-5xl font-black text-[#D4FF00] tracking-tighter">
          {totalMl} <span className="text-xl text-zinc-500 font-bold ml-1">ml</span>
        </span>
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-zinc-500 uppercase">Progresso</span>
          <span className="text-[#D4FF00]">{Math.round(percentage)}%</span>
        </div>
        <div className="h-2.5 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#D4FF00] rounded-full shadow-[0_0_10px_rgba(212,255,0,0.3)] transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="flex gap-3 relative z-10 mt-2">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="numeric"
            value={inputMl}
            onChange={(e) => setInputMl(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-700 text-white rounded-xl py-3 pl-4 pr-10 font-bold text-center focus:outline-none focus:border-[#D4FF00]"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm pointer-events-none">ml</span>
        </div>
        <button
          onClick={handleAddWater}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-2 bg-[#D4FF00] hover:bg-[#D4FF00]/80 text-black font-bold py-3 px-4 rounded-xl transition-colors focus:outline-none shadow-lg shadow-[#D4FF00]/10 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          <span>Bebi</span>
        </button>
      </div>
    </div>
  );
}
