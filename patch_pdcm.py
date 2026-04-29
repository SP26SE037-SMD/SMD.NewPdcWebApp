with open("src/components/dashboard/pdcm-content.tsx", "r") as f:
    lines = f.readlines()

# add Header import
import_idx = 0
for i, line in enumerate(lines):
    if "import { SyllabusService }" in line:
        import_idx = i
        break

lines.insert(import_idx + 1, "import { Header } from '@/components/layout/Header';\n")

# find the header
start_idx = -1
for i, line in enumerate(lines):
    if '<header className="h-20 px-8 flex items-center justify-between border-b shrink-0 bg-white" style={{ borderColor: C.outline + \'10\' }}>' in line:
        start_idx = i
        break

end_idx = -1
for i in range(start_idx, len(lines)):
    if '</header>' in lines[i]:
        end_idx = i
        break

replacement = """                <Header 
                    hideLeft={true} 
                    className="h-20 px-8 flex items-center justify-between border-b shrink-0 bg-white" 
                />
"""

new_lines = lines[:start_idx] + [replacement] + lines[end_idx + 1:]

with open("src/components/dashboard/pdcm-content.tsx", "w") as f:
    f.writelines(new_lines)

