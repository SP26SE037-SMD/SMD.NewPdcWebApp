
interface ProgressStepperProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: 'Info' },
  { id: 2, label: 'PLO' },
  { id: 3, label: 'Mapping' },
  { id: 4, label: 'Builder' },
  { id: 5, label: 'Review' },
];

export default function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <div className="max-w-5xl mb-12 mx-auto pt-8 font-['Plus_Jakarta_Sans']">
      <div className="flex justify-between items-start relative px-10">
        {/* Progress Line */}
        <div className="absolute top-[28px] left-[100px] right-[100px] h-[2px] bg-zinc-200 z-0"></div>
        
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center gap-3 relative z-10 w-24">
              <div
                className={`flex items-center justify-center font-bold transition-all duration-500 rounded-full ${
                  isActive
                    ? 'w-14 h-14 bg-[var(--primary)] text-white ring-8 ring-[#b1f0ce]/30 shadow-xl shadow-[var(--primary)]/20 scale-110'
                    : isCompleted
                    ? 'w-12 h-12 bg-[#b1f0ce] text-[var(--primary)] shadow-md'
                    : 'w-12 h-12 bg-zinc-100 text-zinc-400 border-2 border-zinc-200'
                }`}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                ) : (
                  <span className={isActive ? 'text-xl' : 'text-base'}>
                    {step.id}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                  isActive ? 'font-black text-[var(--primary)]' : 'font-bold text-zinc-500'
                } ${!isActive && !isCompleted ? 'opacity-40' : ''}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
