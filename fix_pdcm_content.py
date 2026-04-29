import re

with open("src/components/dashboard/pdcm-content.tsx", "r") as f:
    code = f.read()

# We need to import PDCMBaseLayout
if "PDCMBaseLayout" not in code:
    code = code.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport { PDCMBaseLayout } from '@/components/layout/PDCMBaseLayout';")

# Replace return ( <div className="flex h-screen overflow-hidden" ... ) 
# with return ( <PDCMBaseLayout ... > ... </PDCMBaseLayout> )
import_section = """
    const globalHeaderTabs = [
        { id: 'develop', label: 'My Task', isActive: navTab === 'develop', onClick: () => router.push('/dashboard/pdcm/develop') },
        { id: 'peer-review', label: 'My Review Task', isActive: navTab === 'peer-review', onClick: () => router.push('/dashboard/pdcm/peer-review') },
    ];

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: 'dashboard', isActive: false, onClick: () => {} },
        { id: 'tasks', label: 'My Tasks', icon: 'task', isActive: navTab === 'develop', onClick: () => router.push('/dashboard/pdcm/develop') },
        { id: 'reviews', label: 'Peer Review', icon: 'rate_review', isActive: navTab === 'peer-review', onClick: () => router.push('/dashboard/pdcm/peer-review') },
        { id: 'library', label: 'Library', icon: 'folder', isActive: false, onClick: () => {} },
        { id: 'settings', label: 'Settings', icon: 'settings', isActive: false, onClick: () => {} },
    ];
"""

# Find return ( ... and replace it
return_match = re.search(r'(return\s*\(\s*<div className="flex h-screen overflow-hidden"[^>]+>)(.*?)(\Z)', code, flags=re.DOTALL)

# Let's use string replace for the entire return statement.
# We will just write the JSX directly.
