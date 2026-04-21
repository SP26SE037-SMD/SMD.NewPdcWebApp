
interface StepNavigationProps {
    onNext?: () => void;
    onBack?: () => void;
    nextLabel?: string;
    backLabel?: string;
    nextIcon?: string;
    showBack?: boolean;
    isNextDisabled?: boolean;
    className?: string;
}

export default function StepNavigation({
    onNext,
    onBack,
    nextLabel = 'Next Step',
    backLabel = 'Back',
    nextIcon = 'arrow_forward',
    showBack = true,
    isNextDisabled = false,
    className = ''
}: StepNavigationProps) {
    return (
        <div className={`fixed bottom-8 right-8 flex gap-4 z-50 ${className}`}>
            {showBack && onBack && (
                <button 
                    onClick={onBack}
                    className="btn-charcoal px-8 h-14"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    {backLabel}
                </button>
            )}
            
            {onNext && (
                <button 
                    onClick={onNext}
                    disabled={isNextDisabled}
                    className={`px-10 h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 transition-all active:scale-95 ${isNextDisabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:translate-y-[-2px]'}`}
                >
                    <span className="text-sm uppercase tracking-widest">{nextLabel}</span>
                    <span className="material-symbols-outlined">{nextIcon}</span>
                </button>
            )}
        </div>
    );
}
