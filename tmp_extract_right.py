import re
with open("src/components/layout/HeaderRightActions.tsx", "r") as f:
    content = f.read()

# Replace export function Header({ title, tabs, onBack, actionButton }: HeaderProps) {
content = re.sub(
    r'export function Header.*?{',
    'export function HeaderRightActions() {\n',
    content,
    flags=re.DOTALL
)

# Remove HeaderProps interface
content = re.sub(r'interface HeaderProps \{.*?\}', '', content, flags=re.DOTALL)

# Find the return (
#         <header ...>
#             <div ...>
#                 {/* Left: Logo / Back */}
start_idx = content.find('return (')

end_header_div = content.find('{/* Right: Actions */}')
right_actions_content = content[end_header_div:]

# Construct new return
new_return = "return (\n        <>\n            " + right_actions_content
new_return = new_return.replace('</header>', '</>')

with open("src/components/layout/HeaderRightActions.tsx", "w") as f:
    f.write(content[:start_idx] + new_return)

