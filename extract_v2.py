with open('/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/hopdc/feedback/[formId]/design/page.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
braces = 0

for i, line in enumerate(lines):
    if '{/* Grid layout for Sections vs Questions */}' in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if '<div className="mt-5 flex flex-col xl:flex-row gap-8 items-start">' in lines[i]:
            for j in range(i, len(lines)):
                braces += lines[j].count('<div') - lines[j].count('</div')
                if braces == 0 and j > i:
                    end_idx = j
                    break
            break

if start_idx != -1 and end_idx != -1:
    with open('layout_block_v2.tsx', 'w') as f:
        f.writelines(lines[start_idx:end_idx+1])
    print(f"Extracted lines {start_idx+1} to {end_idx+1} into layout_block_v2.tsx")
else:
    print("Could not find boundaries")
