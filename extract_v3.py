with open('/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/hopdc/feedback/[formId]/design/page.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
braces = 0

for i, line in enumerate(lines):
    if '<div className="space-y-8 p-4 bg-white min-h-screen">' in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        braces += lines[i].count('<div') - lines[i].count('</div')
        if braces == 0 and i > start_idx:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    with open('layout_full.tsx', 'w') as f:
        f.writelines(lines[start_idx:end_idx+1])
    print(f"Extracted full DOM to layout_full.tsx")
else:
    print("Could not find boundaries")
