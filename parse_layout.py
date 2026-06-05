with open('/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/hopdc/feedback/[formId]/design/page.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Sections List' in line or 'Questions inside section' in line.lower() or 'border' in line:
        if 1200 < i < 1400:  # Only look in the relevant UI section
            print(f"{i+1}: {line.strip()}")
