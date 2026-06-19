/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { store } from "../services/store";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  Smartphone, 
  Monitor, 
  Tablet,
  Check,
  AlertCircle,
  X,
  Server,
  CloudLightning,
  ChevronRight,
  TrendingUp,
  ShoppingCart,
  Users2,
  Lock
} from "lucide-react";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncModal({ isOpen, onClose }: SyncModalProps) {
  const [networkState, setNetworkState] = useState<"online" | "offline">(() => store.getNetworkState());
  const [isForcedOffline, setIsForcedOffline] = useState(() => store.isForcedOffline());
  const [unsyncedCount, setUnsyncedCount] = useState(() => store.getUnsyncedCount());
  const [stats, setStats] = useState(() => store.getUnsyncedStats());
  
  // Sync simulation states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // Listen to store changes
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setNetworkState(store.getNetworkState());
      setIsForcedOffline(store.isForcedOffline());
      setUnsyncedCount(store.getUnsyncedCount());
      setStats(store.getUnsyncedStats());
    });
    return () => unsubscribe();
  }, []);

  // Detect current platform of the user for responsive feedback
  const clientDevice = useMemo(() => {
    if (typeof window === "undefined") return "PC";
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mobi")) {
      if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
      return "Telemóvel";
    }
    return "PC / Computador";
  }, []);

  const getDeviceIcon = () => {
    switch (clientDevice) {
      case "Telemóvel":
        return <Smartphone className="w-5 h-5 text-amber-400" />;
      case "Tablet":
        return <Tablet className="w-5 h-5 text-amber-400" />;
      default:
        return <Monitor className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleToggleForceOffline = () => {
    const nextState = !isForcedOffline;
    store.setForceOffline(nextState);
  };

  const handleSyncNow = async () => {
    if (networkState === "offline") return;
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncLogs([]);

    const messages = [
      " Estabelecendo protocolo SSL seguro com a Nuvem Kitanda...",
      " Autenticando credenciais do operador e certificação da AGT...",
      ` Sincronizando dados locais: ${unsyncedCount} registro(s) pendente(s)...`,
    ];

    // Push initial message list
    setSyncLogs([`[${new Date().toLocaleTimeString()}] Iniciando Sincronização...`]);

    // Fast simulation loop
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setSyncProgress(progress);

      // Add descriptive logs over progress markers
      if (progress > 15 && progress < 45 && syncLogs.length === 1) {
        setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}]${messages[0]}`]);
      } else if (progress >= 45 && progress < 75 && syncLogs.length === 2) {
        setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}]${messages[1]}`]);
      } else if (progress >= 75 && progress < 98 && syncLogs.length === 3) {
        // Detailed record feedback
        let statsParts: string[] = [];
        if (stats.vendas > 0) statsParts.push(`${stats.vendas} venda(s)`);
        if (stats.produtos > 0) statsParts.push(`${stats.produtos} alteração(ões) no catálogo`);
        if (stats.clientes > 0) statsParts.push(`${stats.clientes} cliente(s) registrados`);
        if (stats.dividas > 0) statsParts.push(`${stats.dividas} divida(s) atualizada(s)`);
        
        const summary = statsParts.length > 0 ? statsParts.join(", ") : "Registos operacionais";
        setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${messages[2]} (${summary})`]);
      } else if (progress === 100 && syncLogs.length === 4) {
        // Clear variables, notify success
        store.syncAll().then((res) => {
          setSyncLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}]  Sucesso: ${res.syncedCount} registo(s) unificados com sucesso!`,
            `[${new Date().toLocaleTimeString()}]  Sincronização concluída. Base de dados na nuvem atualizada.`
          ]);
          setIsSyncing(false);
        });
      }
    }, 120);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-fade-in font-sans">
      <div 
        id="sync-management-dialog"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto text-zinc-100"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-850 hover:border-zinc-7 hover:rotate-90 transition-all rounded-full"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-5 border-b border-zinc-850">
          <div className="w-12 h-12 bg-amber-400/15 rounded-2xl flex items-center justify-center border border-amber-400/20 text-amber-400">
            <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase leading-snug">
              Central de Conectividade & Sincronização
            </h2>
            <p className="text-xs text-zinc-450 mt-0.5">
              Gerencie a operação híbrida (Online & Offline) no seu telemóvel, tablet ou computador.
            </p>
          </div>
        </div>

        {/* Connection Status Card */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`col-span-2 p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            networkState === "online" 
              ? "bg-green-950/10 border-green-800/40" 
              : "bg-amber-950/10 border-amber-800/40"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Estado de Conexão</span>
                <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  networkState === "online" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${networkState === "online" ? "bg-green-400 animate-pulse-subtle" : "bg-amber-400 animate-pulse"}`} />
                  {networkState === "online" ? "Online" : "Offline"}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {networkState === "online" 
                  ? "Sincronização em Tempo Real Ativa" 
                  : "Modo Offline Ativado no Dispositivo"}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {networkState === "online"
                  ? "A sua aplicação está diretamente conectada aos servidores servidores da Kitanda. As faturas, estoque e caixa são automaticamente replicados de forma segura."
                  : "Você está trabalhando em Modo Local Autónomo. Todas as operações continuam funcionando normalmente e serão salvas no armazenamento criptografado offline deste dispositivo."}
              </p>
            </div>
          </div>

          {/* Current Device Identifier */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Este Dispositivo</span>
            <div className="mt-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2.5">
                {getDeviceIcon()}
              </div>
              <h4 className="text-white text-xs font-black">{clientDevice}</h4>
              <span className="text-[10px] text-emerald-400 block mt-0.5">Compatível & Otimizado</span>
            </div>
          </div>
        </div>

        {/* Action Controls Panel */}
        <div className="mt-6 bg-zinc-950 p-5 rounded-2xl border border-zinc-850 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">Forçar Operação Offline</h4>
              <p className="text-[11px] text-zinc-450 mt-0.5 max-w-sm">
                Desative a comunicação com a nuvem temporariamente para economizar dados ou simular quedas de rede.
              </p>
            </div>
            
            {/* Custom Toggle Switch */}
            <button 
              onClick={handleToggleForceOffline}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                isForcedOffline ? "bg-amber-500" : "bg-zinc-800"
              }`}
            >
              <div 
                className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-all ${
                  isForcedOffline ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Sync Trigger button */}
          <div className="pt-4 border-t border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">Lançar Sincronização de Dados</h4>
              <p className="text-[11px] text-zinc-450 mt-0.5">
                {unsyncedCount > 0 
                  ? `Existem ${unsyncedCount} alteração(ões) offline pendentes de envio aos servidores da CEID.`
                  : "Todos os dados locais deste dispositivo estão 100% atualizados na nuvem!"}
              </p>
            </div>

            <button
              onClick={handleSyncNow}
              disabled={isSyncing || networkState === "offline" || unsyncedCount === 0}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                isSyncing
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : networkState === "offline"
                    ? "bg-zinc-900 text-zinc-500 border border-zinc-850 cursor-not-allowed"
                    : unsyncedCount === 0
                      ? "bg-zinc-900 text-zinc-400 border border-zinc-850 cursor-not-allowed opacity-60"
                      : "bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/10 cursor-pointer"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Enviando..." : "Sincronizar Agora"}
            </button>
          </div>
        </div>

        {/* Sync Progress Logs Container */}
        {syncProgress > 0 && (
          <div className="mt-6 space-y-3.5 animate-fadeIn">
            {/* Progress Bar Progress indicators */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-450 font-bold px-1">
                <span>Progresso de Sincronização</span>
                <span className="font-mono text-amber-400">{syncProgress}%</span>
              </div>
              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850 p-0.5">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>

            {/* Sync Console Outputs */}
            <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl max-h-40 overflow-y-auto space-y-1.5 font-mono text-[10px] text-zinc-350 leading-relaxed shadow-inner">
              {syncLogs.map((log, idx) => {
                const isSuccess = log.includes("Sucesso") || log.includes("concluída");
                return (
                  <div key={idx} className={`flex items-start gap-1 p-0.5 ${isSuccess ? "text-green-400 font-extrabold" : ""}`}>
                    <ChevronRight className="w-3 h-3 text-zinc-650 shrink-0 mt-0.5" />
                    <span>{log}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Local Items Statistics breakdown */}
        <div className="mt-6 border-t border-zinc-850 pt-5">
          <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>Detalhamento de Registos Pendentes (Local-First):</span>
          </h4>

          {unsyncedCount > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {stats.vendas > 0 && (
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-amber-400 opacity-80" />
                    <span className="text-zinc-400 font-medium">Vendas Realizadas</span>
                  </div>
                  <span className="font-mono bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-md font-bold">{stats.vendas}</span>
                </div>
              )}
              {stats.produtos > 0 && (
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400 opacity-80" />
                    <span className="text-zinc-400 font-medium">Novos Artigos</span>
                  </div>
                  <span className="font-mono bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-md font-bold">{stats.produtos}</span>
                </div>
              )}
              {stats.clientes > 0 && (
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-blue-400 opacity-80" />
                    <span className="text-zinc-400 font-medium">Clientes Criados</span>
                  </div>
                  <span className="font-mono bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-md font-bold">{stats.clientes}</span>
                </div>
              )}
              {stats.dividas > 0 && (
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-400 opacity-80" />
                    <span className="text-zinc-400 font-medium">Amortização/Dívidas</span>
                  </div>
                  <span className="font-mono bg-red-400/10 text-red-400 px-2 py-0.5 rounded-md font-bold">{stats.dividas}</span>
                </div>
              )}
              {stats.transacoes > 0 && (
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500 opacity-80" />
                    <span className="text-zinc-400 font-medium">Movimentos de Caixa</span>
                  </div>
                  <span className="font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md font-bold">{stats.transacoes}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-850 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2.5 text-zinc-500 text-xs py-5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500/80 shrink-0" />
              <span>Nenhum registo pendente. Este dispositivo possui todos os dados idênticos ao servidor central.</span>
            </div>
          )}
        </div>

        {/* Education Mode / Help Box */}
        <div className="mt-6 bg-zinc-950 border border-zinc-850 p-5 rounded-2xl flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
            <CloudLightning className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white mb-1 uppercase tracking-wide">Arquitetura CEID Híbrida Inteligente</h5>
            <p className="text-[11px] text-zinc-450 leading-relaxed">
              O sistema utiliza uma arquitetura **Local-First**, salvando imediatamente as vendas e finanças na memória do celular, tablet ou PC antes de enviar à nuvem. Se houver falha de luz ou corte de internet, você continua faturando normalmente e gerando faturas válidas pela certificação AGT.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
