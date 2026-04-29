import re

with open("src/components/dashboard/pdcm-content.tsx", "r") as f:
    text = f.read()

# Make background white
text = text.replace("    surface: '#f6fbf5',", "    surface: '#ffffff',")
text = text.replace("    surfaceContainerLow: '#eff7ee',", "    surfaceContainerLow: '#ffffff',")

# Update Pipeline titles
text = text.replace("navTab === 'develop' ? 'Development Pipeline' : 'Peer Review Queue'", "navTab === 'develop' ? 'Develop syllabus task' : 'Review task management'")

# Simplify Sidebar nav
nav_start = text.find('                    <nav className="space-y-1">')
nav_end = text.find('                    </nav>', nav_start) + len('                    </nav>')

new_nav = '''                    <nav className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40 px-4">Menu</p>
                        <NavItem icon="dashboard" label="My Tasks" active />
                    </nav>'''

text = text[:nav_start] + new_nav + text[nav_end:]

# Remove sidebar bottom user part
footer_start = text.find('                <div className="mt-auto p-6">')
footer_end = text.find('                </div>', text.find('                </div>', footer_start) + 10) + len('                </div>') + 10
# find the accurate end
text = text.replace('''                <div className="mt-auto p-6">
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: C.surfaceContainerLowest, border: `1px solid ${C.outline}15` }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold truncate" style={{ color: C.onSurface }}>{user?.fullName || 'User Name'}</p>
                                <p className="text-[10px] opacity-60 truncate" style={{ color: C.onSurfaceVariant }}>{user?.email || 'email@edu.vn'}</p>
                            </div>
                        </div>
                    </div>
                </div>''', '')

# Replace Layout structure
old_layout = '''    return (
        <div className="flex h-screen overflow-hidden text-sm" style={{ background: C.surface, color: C.onSurface }}>
            {/* Sidebar */}
            <aside className="w-64 shrink-0 flex flex-col pt-6 z-10" style={{ background: C.surfaceContainerLow, borderRight: `1px solid ${C.outline}15` }}>
'''

new_layout = '''    return (
        <div className="flex flex-col h-screen overflow-hidden text-sm" style={{ background: '#ffffff', color: C.onSurface }}>
            <Header title="PDCM Workspace" />
            <div className="flex flex-1 pt-16">
            {/* Sidebar */}
            <aside className="w-64 shrink-0 flex flex-col pt-6 z-10" style={{ background: '#ffffff', borderRight: `1px solid ${C.outline}15` }}>
'''
text = text.replace(old_layout, new_layout)

# Remove the inner Header rendering
header_remove_start = text.find('                <Header ')
header_remove_end = text.find('                />', header_remove_start) + len('                />\n')
text = text[:header_remove_start] + text[header_remove_end:]

# Close the new div at the end
end_idx = text.rfind('        </div>')
text = text[:end_idx] + '            </div>\n' + text[end_idx:]

with open("src/components/dashboard/pdcm-content.tsx", "w") as f:
    f.write(text)

