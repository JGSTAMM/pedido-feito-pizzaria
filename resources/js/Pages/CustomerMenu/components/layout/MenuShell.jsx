export default function MenuShell({ children }) {
    return (
        <main className="relative min-h-screen overflow-x-clip bg-background-dark text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.24)_0%,rgba(139,92,246,0.08)_35%,rgba(10,10,11,0)_70%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),rgba(10,10,11,0)_40%)]" />
            </div>

            <div className="relative z-10">{children}</div>
        </main>
    );
}
