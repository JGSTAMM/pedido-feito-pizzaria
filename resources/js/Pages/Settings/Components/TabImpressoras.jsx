import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';

function Card({ children }) {
    return (
        <div className="bg-surface rounded-2xl border border-border-subtle p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {children}
        </div>
    );
}

function Label({ children }) {
    return <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">{children}</label>;
}

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#18181F] w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-border-subtle">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button type="button" onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-5 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

function formatPlatformLabel(platform) {
    if (platform === 'linux') return 'Online no Linux';
    if (platform === 'win32') return 'Online no Windows';
    if (platform === 'darwin') return 'Online no macOS';
    return 'Online';
}

export default function TabImpressoras({ printers = [], printAgent = {} }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [testingTarget, setTestingTarget] = useState(null);
    const [copiedToken, setCopiedToken] = useState(false);
    const [queueBusy, setQueueBusy] = useState(false);

    const { data, setData, post, put, processing, reset, clearErrors, errors } = useForm({
        name: '',
        type: 'receipt',
        target: 'cash_register',
        ip_address: '',
    });

    const initialAgentConfig = printAgent?.config || {};
    const agentForm = useForm({
        mode: initialAgentConfig.mode || 'auto',
        kitchen_printer: initialAgentConfig.kitchen_printer || 'POS-58',
        kitchen_paper_width: initialAgentConfig.kitchen_paper_width || '58mm',
        cashier_printer: initialAgentConfig.cashier_printer || 'POS-58',
        cashier_paper_width: initialAgentConfig.cashier_paper_width || '58mm',
        default_printer: initialAgentConfig.default_printer || 'POS-58',
        fallback_printer: initialAgentConfig.fallback_printer || '',
        tcp_ip: initialAgentConfig.tcp_ip || '',
        tcp_port: initialAgentConfig.tcp_port || 9100,
        poll_interval_ms: initialAgentConfig.poll_interval_ms || 1500,
    });

    const openCreate = () => {
        clearErrors();
        reset();
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (p) => {
        clearErrors();
        setData({ name: p.name, type: p.type, target: p.target, ip_address: p.ip_address || '' });
        setEditingId(p.id);
        setModalOpen(true);
    };

    const submitPrinter = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/settings/printers/${editingId}`, { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        } else {
            post('/settings/printers', { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        }
    };

    const submitAgentConfig = (e) => {
        e.preventDefault();
        agentForm.post('/settings/printers/agent-config', { preserveScroll: true });
    };

    const handleDelete = (id) => {
        if (confirm('Excluir esta impressora?')) {
            router.delete(`/settings/printers/${id}`, { preserveScroll: true });
        }
    };

    const handleTestAgent = (target) => {
        setTestingTarget(target);
        router.post('/settings/printers/test-agent', { target }, {
            preserveScroll: true,
            onFinish: () => setTestingTarget(null),
        });
    };

    const handleRegenerateToken = () => {
        if (confirm('Deseja gerar um novo token? Após gerar, baixe o novo config.json ou o pacote .zip atualizado.')) {
            router.post('/settings/printers/regenerate-token', {}, { preserveScroll: true });
        }
    };

    const handleClearQueue = () => {
        if (!confirm('Remover todas as impressões pendentes da fila?')) return;
        setQueueBusy(true);
        router.post('/settings/printers/clear-queue', {}, {
            preserveScroll: true,
            onFinish: () => setQueueBusy(false),
        });
    };

    const handleRetryFailed = () => {
        setQueueBusy(true);
        router.post('/settings/printers/retry-failed', {}, {
            preserveScroll: true,
            onFinish: () => setQueueBusy(false),
        });
    };

    const handleCopyToken = () => {
        if (printAgent?.token) {
            navigator.clipboard.writeText(printAgent.token);
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2000);
        }
    };

    const isAgentOnline = Boolean(printAgent?.status?.is_online ?? printAgent?.status?.online);
    const canManageAgent = printAgent?.canManage !== false;
    const agentPlatform = printAgent?.status?.platform || '';
    const detectedPrinters = Array.isArray(printAgent?.status?.printers)
        ? printAgent.status.printers
        : (Array.isArray(printAgent?.status?.details?.printers) ? printAgent.status.details.printers : []);

    const suggestedPrinters = Array.from(new Set([
        ...detectedPrinters,
        ...printers.map(p => p.name).filter(Boolean),
    ]));

    const queueStats = printAgent?.queueStats || { pending: 0, processing: 0, failed: 0, printed_today: 0 };
    const pendingTotal = Number(queueStats.pending || 0) + Number(queueStats.processing || 0);
    const failedTotal = Number(queueStats.failed || 0);

    const targetLabel = (t) => (t === 'kitchen' ? 'Cozinha (Produção)' : 'Caixa (Recibo)');
    const typeLabel = (t) => (t === 'production' ? 'Produção' : 'Recibos');

    return (
        <div className="space-y-6">
            {/* ── Local/Cloud Print Agent Card (Windows & Linux) ── */}
            <Card>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                    <div className="flex items-start gap-3">
                        <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${isAgentOnline ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                            <span className="material-symbols-outlined text-[24px]">hub</span>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-black text-white">Agente de Impressão Direta (Nuvem)</h3>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isAgentOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                    <span className={`size-1.5 rounded-full ${isAgentOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                    {isAgentOnline ? formatPlatformLabel(agentPlatform) : 'Aguardando Conexão'}
                                </span>
                            </div>
                            <p className="text-xs text-text-muted mt-1">
                                Conecta as impressoras térmicas locais (Windows ou Linux, 58mm/80mm, USB ou Rede TCP 9100) diretamente à VPS, sem janela de impressão.
                            </p>
                        </div>
                    </div>

                    {canManageAgent && (
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <a
                                href="/settings/printers/download-agent"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black shadow-lg shadow-primary/25 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Baixar Agente (Windows & Linux .zip)
                            </a>
                            <a
                                href="/settings/printers/download-config"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">settings_ethernet</span>
                                Baixar config.json
                            </a>
                        </div>
                    )}
                </div>

                {/* Download Instructions + Token */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-border-subtle/50">
                    {/* Left: Token, Server URL & Quick Install Steps */}
                    <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-primary">key</span>
                                Token de Autenticação (já vai no .zip)
                            </span>
                            {canManageAgent && (
                                <button
                                    type="button"
                                    onClick={handleRegenerateToken}
                                    className="text-[10px] font-bold text-text-muted hover:text-white transition-colors"
                                >
                                    Regenerar
                                </button>
                            )}
                        </div>
                        {canManageAgent ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={printAgent?.token || 'Carregando...'}
                                    className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-mono text-white/90 select-all"
                                />
                                <button
                                    type="button"
                                    onClick={handleCopyToken}
                                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px]">{copiedToken ? 'check' : 'content_copy'}</span>
                                    {copiedToken ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                                Somente um Administrador pode visualizar o token e baixar o pacote do agente.
                            </p>
                        )}

                        <div className="text-[11px] text-text-muted space-y-1.5 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                            <p className="text-white/90 font-bold">Servidor na nuvem: <code className="text-primary font-mono">{printAgent?.serverUrl}</code></p>
                            <p><strong className="text-white/80">1.</strong> Instale o <strong>Node.js LTS</strong> no computador da impressora.</p>
                            <p><strong className="text-white/80">2. Windows:</strong> extraia o <code className="text-white/80 font-mono">.zip</code> e abra <code className="text-primary font-mono">iniciar-agente-impressao.bat</code> (opcional: <code className="text-white/80 font-mono">instalar-inicializacao-windows.bat</code>).</p>
                            <p><strong className="text-white/80">3. Linux:</strong> extraia o <code className="text-white/80 font-mono">.zip</code> e execute <code className="text-primary font-mono">./iniciar-agente-impressao.sh</code> (opcional: <code className="text-white/80 font-mono">./instalar-inicializacao-linux.sh</code>).</p>
                        </div>
                    </div>

                    {/* Right: Printers Detected, Queue Stats & Tests */}
                    <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-emerald-400">print</span>
                                    Impressoras Detectadas no Computador
                                </span>
                                <span className="text-[10px] text-text-muted">
                                    {detectedPrinters.length > 0 ? `${detectedPrinters.length} encontrada(s)` : 'Nenhuma reportada'}
                                </span>
                            </div>

                            {detectedPrinters.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {detectedPrinters.map((prn, idx) => (
                                        <div
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-mono text-emerald-300"
                                        >
                                            <span>{prn}</span>
                                            <button
                                                type="button"
                                                title="Definir como Impressora da Cozinha"
                                                onClick={() => agentForm.setData('kitchen_printer', prn)}
                                                className="px-1.5 py-0.5 rounded bg-orange-500/20 hover:bg-orange-500/35 text-orange-300 text-[10px] font-sans font-bold transition-colors"
                                            >
                                                Cozinha
                                            </button>
                                            <button
                                                type="button"
                                                title="Definir como Impressora do Caixa"
                                                onClick={() => agentForm.setData('cashier_printer', prn)}
                                                className="px-1.5 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/35 text-blue-300 text-[10px] font-sans font-bold transition-colors"
                                            >
                                                Caixa
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-text-muted italic">
                                    Assim que o agente iniciar no Windows ou Linux, as impressoras do sistema (e portas /dev/usb/lp*) aparecerão aqui.
                                </p>
                            )}

                            {/* Queue Status */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px]">
                                <div className="flex items-center gap-3 text-text-muted">
                                    <span>Na fila: <strong className={pendingTotal > 0 ? 'text-amber-400' : 'text-white'}>{pendingTotal}</strong></span>
                                    <span>Falhas: <strong className={failedTotal > 0 ? 'text-red-400' : 'text-white'}>{failedTotal}</strong></span>
                                    <span>Impressos hoje: <strong className="text-emerald-400">{queueStats.printed_today || 0}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {failedTotal > 0 && (
                                        <button
                                            type="button"
                                            disabled={queueBusy}
                                            onClick={handleRetryFailed}
                                            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold disabled:opacity-50"
                                        >
                                            Reenviar Falhas
                                        </button>
                                    )}
                                    {pendingTotal > 0 && (
                                        <button
                                            type="button"
                                            disabled={queueBusy}
                                            onClick={handleClearQueue}
                                            className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold disabled:opacity-50"
                                        >
                                            Limpar Fila ({pendingTotal})
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex gap-2">
                            <button
                                type="button"
                                disabled={testingTarget !== null}
                                onClick={() => handleTestAgent('kitchen')}
                                className="flex-1 py-2 px-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px]">soup_kitchen</span>
                                {testingTarget === 'kitchen' ? 'Enviando...' : `Testar Cozinha (${agentForm.data.kitchen_paper_width})`}
                            </button>
                            <button
                                type="button"
                                disabled={testingTarget !== null}
                                onClick={() => handleTestAgent('cash_register')}
                                className="flex-1 py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px]">receipt</span>
                                {testingTarget === 'cash_register' ? 'Enviando...' : `Testar Caixa (${agentForm.data.cashier_paper_width})`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Agent Configuration Form (saved into printer_settings for generated config.json) */}
                <form onSubmit={submitAgentConfig} className="mt-5 pt-5 border-t border-border-subtle/50 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h4 className="text-sm font-black text-white">Mapeamento das Impressoras no config.json</h4>
                            <p className="text-xs text-text-muted">Ao salvar aqui, o agente conectado sincroniza automaticamente em poucos segundos (e o próximo download do .zip ou config.json também já sai atualizado).</p>
                        </div>
                        <button
                            type="submit"
                            disabled={agentForm.processing || !canManageAgent}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all disabled:opacity-50"
                        >
                            {agentForm.processing ? 'Salvando...' : 'Salvar Configuração do Agente'}
                        </button>
                    </div>

                    <datalist id="suggested-printers-list">
                        {suggestedPrinters.map((name, idx) => (
                            <option key={idx} value={name} />
                        ))}
                    </datalist>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Modo de Conexão</Label>
                            <select
                                value={agentForm.data.mode}
                                onChange={e => agentForm.setData('mode', e.target.value)}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                            >
                                <option value="auto">Automático (Windows Spooler / Linux CUPS ou USB)</option>
                                <option value="tcp">Rede TCP/IP Direta (Porta 9100 — Windows & Linux)</option>
                            </select>
                        </div>
                        <div>
                            <Label>Impressora Padrão</Label>
                            <input
                                type="text"
                                list="suggested-printers-list"
                                value={agentForm.data.default_printer}
                                onChange={e => agentForm.setData('default_printer', e.target.value)}
                                placeholder="Ex: POS-58 ou /dev/usb/lp0"
                                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                required
                            />
                        </div>
                        <div>
                            <Label>Contingência / Reserva (Opcional)</Label>
                            <input
                                type="text"
                                list="suggested-printers-list"
                                value={agentForm.data.fallback_printer}
                                onChange={e => agentForm.setData('fallback_printer', e.target.value)}
                                placeholder="Ex: POS-58"
                                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Impressora da Cozinha</Label>
                            <input
                                type="text"
                                list="suggested-printers-list"
                                value={agentForm.data.kitchen_printer}
                                onChange={e => agentForm.setData('kitchen_printer', e.target.value)}
                                placeholder="Ex: POS-80 ou pos-58"
                                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                required
                            />
                        </div>
                        <div>
                            <Label>Largura Cozinha</Label>
                            <select
                                value={agentForm.data.kitchen_paper_width}
                                onChange={e => agentForm.setData('kitchen_paper_width', e.target.value)}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                            >
                                <option value="58mm">58mm (32 colunas)</option>
                                <option value="80mm">80mm (48 colunas)</option>
                            </select>
                        </div>
                        <div>
                            <Label>Impressora do Caixa</Label>
                            <input
                                type="text"
                                list="suggested-printers-list"
                                value={agentForm.data.cashier_printer}
                                onChange={e => agentForm.setData('cashier_printer', e.target.value)}
                                placeholder="Ex: POS-58"
                                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                required
                            />
                        </div>
                        <div>
                            <Label>Largura Caixa</Label>
                            <select
                                value={agentForm.data.cashier_paper_width}
                                onChange={e => agentForm.setData('cashier_paper_width', e.target.value)}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                            >
                                <option value="58mm">58mm (32 colunas)</option>
                                <option value="80mm">80mm (48 colunas)</option>
                            </select>
                        </div>
                    </div>

                    {agentForm.data.mode === 'tcp' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                            <div>
                                <Label>IP da Impressora TCP</Label>
                                <input
                                    type="text"
                                    value={agentForm.data.tcp_ip}
                                    onChange={e => agentForm.setData('tcp_ip', e.target.value)}
                                    placeholder="Ex: 192.168.1.100"
                                    className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                    required
                                />
                                {agentForm.errors.tcp_ip && <p className="text-red-400 text-xs mt-1">{agentForm.errors.tcp_ip}</p>}
                            </div>
                            <div>
                                <Label>Porta TCP (Padrão: 9100)</Label>
                                <input
                                    type="number"
                                    value={agentForm.data.tcp_port}
                                    onChange={e => agentForm.setData('tcp_port', e.target.value)}
                                    min={1}
                                    max={65535}
                                    className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>
                    )}
                </form>
            </Card>

            {/* Standard Network/Thermal Printers List */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Impressoras Configuradas (Cadastro do Sistema)</h3>
                        <p className="text-sm text-text-muted">Gerencie as impressoras térmicas cadastradas no PDV e KDS.</p>
                    </div>
                    <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">add</span> Nova Impressora
                    </button>
                </div>

                {printers.length === 0 ? (
                    <div className="p-8 text-center text-text-muted">Nenhuma impressora cadastrada.</div>
                ) : (
                    <div className="space-y-3">
                        {printers.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-background-dark">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 bg-surface border border-border-subtle rounded-lg flex items-center justify-center text-text-muted">
                                        <span className="material-symbols-outlined">print</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">{p.name}</h4>
                                        <p className="text-xs text-text-muted">Destino: {targetLabel(p.target)} · Tipo: {typeLabel(p.type)}</p>
                                        {p.ip_address && <p className="text-xs text-text-muted mt-0.5">IP: {p.ip_address}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${p.is_online ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_online ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                        {p.is_online ? 'Online' : 'Offline'}
                                    </span>
                                    <button type="button" onClick={() => openEdit(p)} className="text-text-muted hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button type="button" onClick={() => handleDelete(p.id)} className="text-text-muted hover:text-red-400 transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Impressora' : 'Nova Impressora'}>
                <form onSubmit={submitPrinter} className="flex flex-col gap-4">
                    <div>
                        <Label>Nome da Impressora</Label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            required
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo</Label>
                            <select value={data.type} onChange={e => setData('type', e.target.value)} className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none">
                                <option value="receipt">Recibos</option>
                                <option value="production">Produção</option>
                            </select>
                        </div>
                        <div>
                            <Label>Destino</Label>
                            <select value={data.target} onChange={e => setData('target', e.target.value)} className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none">
                                <option value="cash_register">Caixa</option>
                                <option value="kitchen">Cozinha</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <Label>Endereço IP (Opcional)</Label>
                        <input
                            type="text"
                            value={data.ip_address}
                            onChange={e => setData('ip_address', e.target.value)}
                            placeholder="Ex: 192.168.1.100"
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                    </div>
                    <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border-subtle">
                        <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={processing} className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
                            {processing ? 'Salvando...' : (editingId ? 'Salvar' : 'Adicionar')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
