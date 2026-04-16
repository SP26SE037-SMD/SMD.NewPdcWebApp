export default function TestConnectionPage() {
    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-surface-container-lowest">
            <h1 className="text-3xl font-black text-primary mb-4">Connection Success (Static)</h1>
            <p className="text-on-surface-variant font-medium text-lg">
                If you see this page, Next.js successfully reached the <code>reviews/</code> directory.
            </p>
            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-sm">
                <p className="font-bold opacity-60 uppercase tracking-widest text-[10px] mb-2">Location</p>
                <code className="text-primary font-mono">src/app/dashboard/pdcm/reviews/test-connection/page.tsx</code>
            </div>
        </div>
    );
}
