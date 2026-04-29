const fs = require('fs');

const path = "src/components/layout/Header.tsx";
let code = fs.readFileSync(path, "utf-8");

code = code.replace("interface HeaderProps {\n    title?: string;", "interface HeaderProps {\n    title?: string;\n    hideLeft?: boolean;\n    className?: string;");
code = code.replace("export function Header({ title, showSearch = true, tabs = [], onBack, actionButton }: HeaderProps) {", "export function Header({ title, showSearch = true, hideLeft = false, className, tabs = [], onBack, actionButton }: HeaderProps) {");

code = code.replace('<header className="w-full fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#f0f2ef] h-16 flex items-center">', '<header className={className || "w-full fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#f0f2ef] h-16 flex items-center"}>');
code = code.replace('<div className="grid items-center px-6 w-full h-full" style={{ gridTemplateColumns: \'1fr auto 1fr\' }}>', '<div className="grid items-center px-6 w-full h-full" style={!hideLeft ? { gridTemplateColumns: \'1fr auto 1fr\' } : { gridTemplateColumns: \'1fr\' }}>');

code = code.replace('                {/* Left: Logo / Back */}\n                <div className="flex items-center gap-4">', '                {/* Left: Logo / Back */}\n                {!hideLeft && (\n                <div className="flex items-center gap-4">');

// find end of left part
let leftIdx = code.indexOf('{/* Center: Tabs */}');
let leftEnd = code.lastIndexOf('</div>', leftIdx);
code = code.substring(0, leftEnd + 6) + '\n                )}\n' + code.substring(leftEnd + 6);

// Center part
code = code.replace('                {/* Center: Tabs */}\n                <nav className="flex gap-8 justify-center">', '                {/* Center: Tabs */}\n                {!hideLeft && (\n                <nav className="flex gap-8 justify-center">');

let rightIdx = code.indexOf('{/* Right: Actions */}');
let centerEnd = code.lastIndexOf('</nav>', rightIdx);
code = code.substring(0, centerEnd + 6) + '\n                )}\n' + code.substring(centerEnd + 6);

fs.writeFileSync(path, code);
console.log("Replaced safely");

