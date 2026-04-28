const fs = require('fs');

const file = 'src/app/dashboard/pdcm/materials/new/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

const regex = /const fileInputRef = useRef<HTMLInputElement>\(null\);/;
const insert = `const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto import trigger if routed from dashboard with parameter
    useEffect(() => {
        if (mounted && searchParams.get('autoImport')) {
            const timer = setTimeout(() => {
                fileInputRef.current?.click();
                // Strip URL query to prevent re-triggering randomly
                const url = new URL(window.location.href);
                url.searchParams.delete('autoImport');
                window.history.replaceState({}, '', url.toString());
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [mounted, searchParams]);`;

content = content.replace(regex, insert);
fs.writeFileSync(file, content, 'utf-8');
console.log("Auto-import patch applied");
