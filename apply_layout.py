with open('layout_block.tsx', 'r') as f:
    old_block = f.read()

with open('new_layout_block.tsx', 'r') as f:
    new_block = f.read()

with open('/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/hopdc/feedback/[formId]/design/page.tsx', 'r') as f:
    content = f.read()

content = content.replace(old_block, new_block)

with open('/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/hopdc/feedback/[formId]/design/page.tsx', 'w') as f:
    f.write(content)
