import re

with open('layout_block.tsx', 'r') as f:
    content = f.read()

# Replace the grid wrapper
content = content.replace(
    '<div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">',
    '<div className="mt-5 flex flex-col xl:flex-row gap-8 items-start">'
)

# SECTIONS PANEL wrapper
content = content.replace(
    '<div className="rounded-2xl bg-white/40 p-5 shadow-sm backdrop-blur-xs flex flex-col justify-between">',
    '<div className="xl:w-[35%] w-full flex flex-col gap-6 sticky top-6">'
)

# Sections List header
content = content.replace(
    '<h3 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">',
    '<h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/70 flex items-center gap-2">'
)

# Section Item cards: remove group rounded-xl border p-3.5 transition-all...
content = content.replace(
    'className={`group rounded-xl border p-3.5 transition-all duration-300 ${',
    'className={`group rounded-xl p-4 transition-all duration-300 cursor-pointer ${'
)
content = content.replace(
    '? "border-primary bg-linear-to-r from-primary/10 to-primary/5 shadow-xs translate-x-0.5"',
    '? "bg-white shadow-sm ring-1 ring-primary/20 translate-x-1"'
)
content = content.replace(
    ': "border-outline/15 bg-white/70 hover:bg-white hover:border-primary/30 hover:shadow-xs translate-x-0"',
    ': "bg-transparent hover:bg-white/60 hover:translate-x-0.5"'
)

# Save section form editor wrapper
content = content.replace(
    '<div className="mt-6 space-y-3 rounded-2xl bg-white/60 p-4.5 shadow-xs">',
    '<div className="mt-2 space-y-3 rounded-2xl bg-surface-container-lowest/50 p-4">'
)
content = content.replace(
    'className="w-full rounded-xl border border-outline/20 bg-white/70 px-3 py-2 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15"',
    'className="w-full rounded-xl bg-white px-3 py-2 text-sm outline-none transition shadow-sm border-b-2 border-transparent focus:border-primary focus:shadow-md"'
)

# QUESTIONS PANEL wrapper
content = content.replace(
    '<div className="rounded-2xl bg-white/40 p-5 shadow-sm backdrop-blur-xs flex flex-col justify-between">',
    '<div className="xl:w-[65%] w-full flex flex-col gap-6">'
)
content = content.replace(
    '<h3 className="mb-4 text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2 border-b border-outline/5 pb-2.5">',
    '<h3 className="mb-6 text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2 border-b border-outline/10 pb-4">'
)

# Question Items cards
content = content.replace(
    'className="group/q bg-white/70 hover:bg-white border border-outline/15 hover:border-primary/20 transition-all duration-300 shadow-xs hover:shadow-sm rounded-xl p-3.5 flex flex-col justify-between"',
    'className="group/q bg-white transition-all duration-300 shadow-sm hover:shadow-md rounded-2xl p-6 flex flex-col justify-between ring-1 ring-outline/5"'
)

# Save question form editor wrapper
content = content.replace(
    '<div className="mt-6 space-y-3 rounded-2xl bg-white/60 p-4.5 shadow-xs">',
    '<div className="mt-4 space-y-4 rounded-2xl bg-surface/50 p-6 ring-1 ring-outline/5">'
)

with open('new_layout_block.tsx', 'w') as f:
    f.write(content)
