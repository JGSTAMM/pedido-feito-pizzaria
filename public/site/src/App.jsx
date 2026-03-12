import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import PizzaScene from './components/PizzaScene'
import { ShoppingBag, ChevronRight, MapPin, Clock } from 'lucide-react'

function App() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll()

    useEffect(() => {
        const lenis = new Lenis()
        function raf(time) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }
        requestAnimationFrame(raf)
        return () => lenis.destroy()
    }, [])

    const xTransform = useTransform(scrollYProgress, [0.3, 0.6], ['0%', '-100%'])

    return (
        <div ref={containerRef} className="bg-[#0A0A0B] text-white selection:bg-violet-500 selection:text-white font-inter">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center backdrop-blur-md bg-black/10 border-b border-white/5">
                <h1 className="font-outfit text-2xl font-bold tracking-tighter">LUCCHESE</h1>
                <div className="flex gap-8 items-center list-none font-medium text-sm text-gray-400">
                    <li className="hover:text-violet-400 cursor-pointer transition-colors">Menu</li>
                    <li className="hover:text-violet-400 cursor-pointer transition-colors">Tradição</li>
                    <button className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-500/20">
                        Pedir Agora <ShoppingBag size={18} />
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                <PizzaScene />
                <div className="z-10 text-center px-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="font-outfit text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-6"
                    >
                        A ARTE DA <br />
                        <span className="text-violet-500">PIZZA 2026</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto mb-10"
                    >
                        Tradição italiana fundida com tecnologia de ponta. Experiência imersiva, sabor inesquecível.
                    </motion.p>
                </div>
                <motion.div
                    style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
                >
                    <span className="text-[10px] uppercase tracking-widest font-bold">Scroll</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-violet-500 to-transparent"></div>
                </motion.div>
            </section>

            {/* Horizontal Scroll Section */}
            <section className="h-[300vh]">
                <div className="sticky top-0 h-screen overflow-hidden">
                    <motion.div style={{ x: xTransform }} className="flex h-full">
                        <div className="min-w-full h-full flex items-center justify-center p-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center max-w-7xl">
                                <div>
                                    <h3 className="font-outfit text-5xl font-bold mb-8">Nossa Tradição</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                        Desde 1924, a Lucchese traz o segredo da longa fermentação e ingredientes importados diretamente de Nápoles.
                                    </p>
                                    <div className="flex gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
                                            <Clock className="text-violet-500 mb-2" />
                                            <span className="block text-sm font-bold">48h</span>
                                            <span className="text-[10px] text-gray-500 uppercase">Fermentação</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
                                            <MapPin className="text-emerald-500 mb-2" />
                                            <span className="block text-sm font-bold">Direto</span>
                                            <span className="text-[10px] text-gray-500 uppercase">Da Itália</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-96 rounded-3xl bg-violet-900/20 border border-white/10 flex items-center justify-center overflow-hidden">
                                    <div className="text-violet-500/30 font-outfit text-9xl font-black">2026</div>
                                </div>
                            </div>
                        </div>
                        <div className="min-w-full h-full flex items-center justify-center p-20 bg-violet-600">
                            <h3 className="font-outfit text-8xl md:text-[12rem] font-black tracking-tighter text-white/20 select-none">INOVAÇÃO</h3>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer / CTA */}
            <footer className="py-40 px-8 border-t border-white/5 text-center">
                <h4 className="font-outfit text-5xl font-bold mb-12">Pronto para o Próximo Nível?</h4>
                <button className="group bg-white text-black px-10 py-5 rounded-full text-xl font-bold transition-all hover:bg-violet-500 hover:text-white active:scale-95 flex items-center gap-3 mx-auto">
                    Acessar Cardápio Digital <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </footer>
        </div>
    )
}

export default App
