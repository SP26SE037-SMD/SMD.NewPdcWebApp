import re

with open("src/components/layout/Header.tsx", "r") as f:
    text = f.read()

pattern = r'''    return \(
        <header className="w-full fixed top-0 left-0 right-0 z-50 bg-white border-b border-\[#f0f2ef\] h-16 flex items-center">
            <div className="grid items-center px-6 w-full h-full" style=\{\{ gridTemplateColumns: '1fr auto 1fr' \}\}>

                \{\/\* Left: Logo / Back \/\*\}
                <div className="flex items-center gap-4">
.*?
                \{\/\* Center: Tabs \/\*\}
                <nav className="flex gap-8 justify-center">
.*?
                </nav>

                \{\/\* Right: Actions \/\*\}
                <div className="flex items-center justify-end gap-5">'''

replacement = '''    return (
        <header className={className || "w-full fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#f0f2ef] h-16 flex items-center"}>
            <div className="grid items-center px-6 w-full h-full" style={!hideLeft ? { gridTemplateColumns: '1fr auto 1fr' } : { gridTemplateColumns: '1fr' }}>

                {/* Left: Logo / Back */}
                {!hideLeft && (
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-on-surface/5 transition-all text-[24px]"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                        )}
                        <img src="/icon-with-name.png" alt="SMD" className="h-8 w-auto cursor-pointer" onClick={() => router.push('/dashboard/pdcm/develop')} />
                        {title && !tabs.length && (
                            <>
                                <div className="h-6 w-px bg-gray-200"></div>
                                <h2 className="text-lg font-bold tracking-tight text-[#2d342b]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    {title}
                                </h2>
                            </>
                        )}
                    </div>
                )}

                {/* Center: Tabs */}
                {!hideLeft && (
                    <nav className="flex gap-8 justify-center">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={tab.onClick}
                                className={`transition-all duration-200 font-medium pb-2 relative whitespace-nowrap ${tab.isActive
                                        ? 'text-primary font-semibold'
                                        : 'text-on-surface/60 hover:text-on-surface'
                                    }`}
                            >
                                {tab.label}
                                {tab.isActive && (
                                    <motion.div
                                        layoutId="header-active-tab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </nav>
                )}

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-5">'''

new_text = re.sub(pattern, replacement, text, flags=re.DOTALL)
with open("src/components/layout/Header.tsx", "w") as f:
    f.write(new_text)

