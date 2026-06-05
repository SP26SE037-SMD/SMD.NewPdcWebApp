import re

with open('/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/hopdc/feedback/[formId]/design/page.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'border' in line and 'className=' in line:
        print(f"{i+1}: {line.strip()}")
