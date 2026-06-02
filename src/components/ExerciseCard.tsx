import React, { useState, useEffect } from 'react';
import { Save, Check, ChevronDown } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';

interface InputRowProps {
  label: string;
  state: { weight: string, reps: string };
  setState: React.Dispatch<React.SetStateAction<{ weight: string, reps: string }>>;
}

const InputRow = ({ label, state, setState }: InputRowProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-zinc-800/50 last:border-0 gap-2 sm:gap-4">
    <span className={`text-xs font-bold uppercase tracking-wide ${label.toLowerCase().includes('válida') ? 'text-[#D4FF00]' : 'text-zinc-400 italic'} min-w-32`}>{label}</span>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="flex-1 sm:w-24">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Kg"
          value={state.weight}
          onChange={(e) => setState(prev => ({ ...prev, weight: e.target.value }))}
          className={`w-full ${label.toLowerCase().includes('válida') ? 'bg-zinc-900 border-[#D4FF00]/30' : 'bg-zinc-900/50 border-zinc-700'} border text-zinc-100 rounded-md px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-[#D4FF00]`}
        />
      </div>
      <div className="flex-1 sm:w-24">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Reps"
          value={state.reps}
          onChange={(e) => setState(prev => ({ ...prev, reps: e.target.value }))}
          className={`w-full ${label.toLowerCase().includes('válida') ? 'bg-zinc-900 border-[#D4FF00]/30' : 'bg-zinc-900/50 border-zinc-700'} border text-zinc-100 rounded-md px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-[#D4FF00]`}
        />
      </div>
    </div>
  </div>
);

interface ExerciseCardProps {
  title: string;
  workoutType: 'TREINO A' | 'TREINO B';
  options: string[];
  key?: React.Key;
}

export function ExerciseCard({ title, workoutType, options }: ExerciseCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>(options[0]);
  
  const [warmup1, setWarmup1] = useState({ weight: '', reps: '' });
  const [warmup2, setWarmup2] = useState({ weight: '', reps: '' });
  const [work1, setWork1] = useState({ weight: '', reps: '' });
  const [work2, setWork2] = useState({ weight: '', reps: '' });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchTodayData = async () => {
      if (!auth.currentUser) return;
      setIsLoadingData(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, 'exercise_logs'),
          where('userId', '==', auth.currentUser.uid),
          where('date', '==', today),
          where('exerciseName', '==', selectedOption)
        );
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const docs = snap.docs.map(doc => doc.data());
          docs.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          const latest = docs[0];
          setWarmup1({ weight: latest.warmup1Weight || '', reps: latest.warmup1Reps || '' });
          setWarmup2({ weight: latest.warmup2Weight || '', reps: latest.warmup2Reps || '' });
          setWork1({ weight: latest.work1Weight || '', reps: latest.work1Reps || '' });
          setWork2({ weight: latest.work2Weight || '', reps: latest.work2Reps || '' });
        } else {
          setWarmup1({ weight: '', reps: '' });
          setWarmup2({ weight: '', reps: '' });
          setWork1({ weight: '', reps: '' });
          setWork2({ weight: '', reps: '' });
        }
      } catch (err) {
        console.error("Failed to load today's log", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchTodayData();
  }, [selectedOption]);

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
    setIsDropdownOpen(false);
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      toast.error('Você precisa estar logado para salvar o treino.');
      return;
    }

    const payload = {
      userId: auth.currentUser.uid,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      exerciseType: workoutType,
      exerciseName: selectedOption,
      warmup1Weight: Number(warmup1.weight) || 0,
      warmup1Reps: Number(warmup1.reps) || 0,
      warmup2Weight: Number(warmup2.weight) || 0,
      warmup2Reps: Number(warmup2.reps) || 0,
      work1Weight: Number(work1.weight) || 0,
      work1Reps: Number(work1.reps) || 0,
      work2Weight: Number(work2.weight) || 0,
      work2Reps: Number(work2.reps) || 0,
      createdAt: serverTimestamp()
    };

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'exercise_logs'), payload);
      toast.success(`Séries salvas para: ${selectedOption}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'exercise_logs');
      toast.error('Erro ao salvar as séries. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Header / Dropdown */}
      <div className="relative">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-left font-bold text-sm text-white focus:outline-none focus:border-[#D4FF00]"
        >
          <span className="truncate mr-2">{selectedOption}</span>
          <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleOptionChange(opt)}
                className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-zinc-800 transition-colors ${selectedOption === opt ? 'bg-zinc-800/50 text-[#D4FF00]' : 'text-zinc-300'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        <InputRow label="Reconhec. 1" state={warmup1} setState={setWarmup1} />
        <InputRow label="Reconhec. 2" state={warmup2} setState={setWarmup2} />
        <InputRow label="Válida 1" state={work1} setState={setWork1} />
        <InputRow label="Válida 2" state={work2} setState={setWork2} />
      </div>

      {/* Action */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D4FF00] hover:bg-[#D4FF00]/80 text-black font-bold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4FF00] focus:ring-offset-2 focus:ring-offset-[#050505] shadow-lg shadow-[#D4FF00]/10 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5 text-black" />
          )}
          <span className="text-black">{isSaving ? 'Salvando...' : 'Salvar Série'}</span>
        </button>
      </div>
    </div>
  );
}
