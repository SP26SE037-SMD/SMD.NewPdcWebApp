import os

path = 'src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx'
with open(path, 'r') as f:
    text = f.read()

# Fix 1: Description
text = text.replace(
    '"{curriculum?.description || "The Bachelor of Science provides a rigorous foundation in computational theory and practical software engineering. Our curriculum focuses on sustainable AI, high-performance computing, and cross-platform architecture, preparing students for the intellectual challenges of the next decade\'s digital economy."}"',
    '"{curriculum?.description || `Detailed specification and governance matrix.`}"'
)

# Fix 2: Major Name fallback
text = text.replace(
    "{curriculum?.major?.majorName || 'Computing'}",
    "{curriculum?.major?.majorName || curriculum?.curriculumName || 'N/A'}"
)

# Fix 3: PO fallbacks
text = text.replace(
    "{po.description || po.poName || 'Design and implement complex software systems using industry-standard paradigms.'}",
    "{po.description || 'No description available.'}"
)

# Fix 4: PLO Name -> Code
text = text.replace(
    "{plo.ploName || `Outcome ${idx + 1}`}",
    "{plo.ploCode || plo.ploName || `Outcome ${idx + 1}`}"
)

# Fix 5: PLO in matrix th
text = text.replace(
    "{plo.ploName}",
    "{plo.ploCode || plo.ploName}"
)

# Fix 6: PO in matrix td
text = text.replace(
    "{po.poCode || po.poName}",
    "{po.poCode || 'Unknown PO'}"
)

with open(path, 'w') as f:
    f.write(text)

print("Done fixing fields!")
