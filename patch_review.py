import re

with open("src/app/dashboard/hocfdc/curriculums/[id]/review/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
'''  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {/* Sticky Header */}''',
'''  return (
    <div className={`bg-zinc-50/50 ${isEmbedded ? 'h-full flex-1 overflow-y-auto' : 'min-h-screen pb-20'}`}>
      {/* Sticky Header */}
      {!isEmbedded && ('''
)

text = text.replace(
'''              {mutation.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Enact Architecture
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-12 space-y-12">''',
'''              {mutation.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Enact Architecture
            </button>
          </div>
        </div>
      </div>
      )}

      {isEmbedded && (
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-white sticky top-0 z-50">
          <div className="flex flex-col">
            <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest">
              Simulation Active
            </span>
            <span className="text-sm font-bold text-zinc-400">
              {stats.totalSubjects} Subjects • {stats.totalCredits} Credits
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="px-8 py-3 bg-zinc-900 text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-primary transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Enact Architecture
          </button>
        </div>
      )}

      <div className={`max-w-6xl mx-auto space-y-12 ${isEmbedded ? 'py-8 px-6' : 'pt-12'}`}>'''
)

with open("src/app/dashboard/hocfdc/curriculums/[id]/review/page.tsx", "w", encoding="utf-8") as f:
    f.write(text)

