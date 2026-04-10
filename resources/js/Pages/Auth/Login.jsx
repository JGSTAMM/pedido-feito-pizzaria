import { useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ storeName }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col sm:justify-center items-center font-['Work_Sans'] sm:pt-0 relative overflow-hidden">
            <Head title={`Login - ${storeName}`} />

            {/* Fix para remover o fundo branco do Chrome Autofill e manter o Dark Theme */}
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    transition: background-color 5000s ease-in-out 0s;
                    -webkit-text-fill-color: white !important;
                }
            `}</style>


            {/* Elementos visuais de fundo sutis (opcional, para dar mais profundidade) */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#06b6d4]/20 rounded-full blur-[120px] pointer-events-none hidden sm:block"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#0891b2]/10 rounded-full blur-[100px] pointer-events-none hidden sm:block"></div>

            {/* Container Responsivo: Fullscreen no Mobile (sem borda/fundo), Card Glassmorphism real no Desktop */}
            <div className="w-full sm:max-w-[440px] h-screen sm:h-auto z-10 
                            sm:bg-white/5 sm:backdrop-blur-lg sm:border sm:border-white/10 sm:rounded-3xl sm:shadow-2xl sm:p-10
                            p-8 flex flex-col justify-center">
                
                {/* Branding Dinâmico */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-violet-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)] mb-6">
                        <span className="material-symbols-outlined text-white text-3xl">storefront</span>
                    </div>
                    {/* Tipografia Limpa */}
                    <h1 className="text-2xl font-semibold tracking-tight text-white mb-2 text-center">
                        {storeName}
                    </h1>
                    <p className="text-gray-400 text-sm text-center">
                        Acesse sua conta para continuar.
                    </p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-5 w-full">
                    {/* E-mail */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="email">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className={`w-full bg-white/5 border ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-white/10 focus:border-violet-500 focus:ring-violet-500/50'} focus:ring-2 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none transition-all`}
                            placeholder="seu@email.com"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoFocus
                        />
                        {errors.email && (
                            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Senha */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="password">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className={`w-full bg-white/5 border ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-white/10 focus:border-violet-500 focus:ring-violet-500/50'} focus:ring-2 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none transition-all`}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        {errors.password && (
                            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Botão de Login (Call to Action) */}
                    <div className="mt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-medium py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-violet-600/25 ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {processing ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                    <span>Autenticando...</span>
                                </>
                            ) : (
                                <>
                                    <span>ENTRAR</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Rodapé Dinâmico */}
                    <p className="text-center text-gray-500 text-xs mt-6">
                        &copy; {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
                    </p>
                </form>
            </div>
        </div>
    );
}
