import re

with open('/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/hopdc/feedback/[formId]/design/page.tsx', 'r') as f:
    content = f.read()

# Remove border from the outer wrapper around the two columns
content = content.replace(
    'className="rounded-3xl border border-outline/20 bg-linear-to-b from-surface/60 to-surface/30 p-6 shadow-xl shadow-black/5 backdrop-blur-3xl w-full"',
    'className="rounded-3xl bg-linear-to-b from-surface/60 to-surface/30 p-6 shadow-sm backdrop-blur-3xl w-full"'
)

# Remove border from the Sections List column wrapper
content = content.replace(
    'className="rounded-2xl border border-outline/10 bg-white/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between"',
    'className="rounded-2xl bg-white/40 p-5 shadow-sm backdrop-blur-xs flex flex-col justify-between"'
)

# Remove border from the Questions column wrapper (it probably has the same classes)
content = content.replace(
    'className="rounded-2xl border border-outline/10 bg-white/40 p-5 shadow-xs backdrop-blur-xs flex flex-col"',
    'className="rounded-2xl bg-white/40 p-5 shadow-sm backdrop-blur-xs flex flex-col"'
)

# Remove border from "Add New Section" / "Edit Section" / "Add New Question" / "Edit Question" wrappers
content = content.replace(
    'className="mt-6 space-y-3 rounded-2xl border border-outline/10 bg-linear-to-b from-surface-container-lowest/90 to-surface-container-lowest/50 p-4.5 shadow-inner shadow-black/5"',
    'className="mt-6 space-y-3 rounded-2xl bg-white/60 p-4.5 shadow-xs"'
)
content = content.replace(
    'className="mt-6 space-y-4 rounded-2xl border border-outline/10 bg-linear-to-b from-surface-container-lowest/90 to-surface-container-lowest/50 p-5 shadow-inner shadow-black/5"',
    'className="mt-6 space-y-4 rounded-2xl bg-white/60 p-5 shadow-xs"'
)

with open('/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/hopdc/feedback/[formId]/design/page.tsx', 'w') as f:
    f.write(content)
