/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { store } from "./services/store";
import { User, AppSettings } from "./types";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Sales from "./components/Sales";
import Stock from "./components/Stock";
import Clients from "./components/Clients";
import Finance from "./components/Finance";
import Settings from "./components/Settings";
import EmployeeDebtsPanel from "./components/EmployeeDebtsPanel";
import SyncModal from "./components/SyncModal";
import {
  LayoutDashboard,
  ShoppingCart,
  Database,
  Users2,
  TrendingUp,
  Settings as SettingsIcon,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Lock,
  UserCheck,
  CloudLightning,
  RefreshCw,
  Wifi,
  WifiOff,
  Key,
  PiggyBank,
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => store.getCurrentUser());
  const [settings, setSettings] = useState<AppSettings>(() => store.getSettings());
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(() => store.isOffline());
  const [unsyncedCount, setUnsyncedCount] = useState(() => store.getUnsyncedCount());
  const [isAutoSyncing, setIsAutoSyncing] = useState(() => store.isAutomaticSyncing());
  const [autoSyncStatus, setAutoSyncStatus] = useState(() => store.getAutoSyncStatus());
  const [lastAutoSyncStatus, setLastAutoSyncStatus] = useState("");
  const [toastDismissed, setToastDismissed] = useState(false);
  const [activeStoreId, setActiveStoreIdState] = useState(() => store.getActiveStoreId());

  // Profile password modification state variables
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newProfilePassword, setNewProfilePassword] = useState("");
  const [confirmProfilePassword, setConfirmProfilePassword] = useState("");
  const [passwordModalError, setPasswordModalError] = useState("");

  const handleChangeProfilePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordModalError("");

    if (!currentUser) return;

    if (oldPassword !== currentUser.password && currentUser.password !== "********") {
      setPasswordModalError("A palavra-passe atual está incorreta.");
      return;
    }
    if (newProfilePassword.length < 4) {
      setPasswordModalError("A nova palavra-passe deve ter pelo menos 4 caracteres.");
      return;
    }
    if (newProfilePassword !== confirmProfilePassword) {
      setPasswordModalError("Os campos da nova palavra-passe não coincidem.");
      return;
    }

    store.updateUser(currentUser.id, { password: newProfilePassword });
    triggerToast("Palavra-passe alterada com sucesso!");
    setOldPassword("");
    setNewProfilePassword("");
    setConfirmProfilePassword("");
    setPasswordModalOpen(false);
  };

  useEffect(() => {
    if (autoSyncStatus && autoSyncStatus !== lastAutoSyncStatus) {
      setLastAutoSyncStatus(autoSyncStatus);
      setToastDismissed(false);
    }
  }, [autoSyncStatus, lastAutoSyncStatus]);

  // Subscribe to central store
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setSettings({ ...store.getSettings() });
      setIsOffline(store.isOffline());
      setUnsyncedCount(store.getUnsyncedCount());
      setIsAutoSyncing(store.isAutomaticSyncing());
      setAutoSyncStatus(store.getAutoSyncStatus());
      setActiveStoreIdState(store.getActiveStoreId());
    });
    return () => unsubscribe();
  }, []);

  // Sync dark mode style directly with local body class for complete ocular safety
  useEffect(() => {
    const isDark = settings.themeMode === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.backgroundColor = "#09090b"; // zinc-950 background
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#09090b"; // keep elegant dark overall dark themes
    }
  }, [settings.themeMode]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleStoreChange = (storeId: string) => {
    store.setActiveStoreId(storeId);
    setActiveStoreIdState(storeId);
    triggerToast(`Troca para filial: ${store.getStoreBranches().find(b => b.id === storeId)?.name}`);
  };

  const handleLoginSuccess = () => {
    const freshUser = store.getCurrentUser();
    setCurrentUser(freshUser);
    if (freshUser?.storeId) {
      setActiveStoreIdState(freshUser.storeId);
    } else {
      setActiveStoreIdState(store.getActiveStoreId());
    }
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    store.logout();
    setCartPlaceholder();
  };

  const setCartPlaceholder = () => {
    setActiveTab("dashboard");
    setMobileMenuOpen(false);
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.themeMode === "dark" ? "light" : "dark";
    store.updateSettings({ themeMode: nextTheme });
  };

  // Guard routing role limits
  const isAuthorized = (tabName: string) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin" || currentUser.role === "gestor_principal") return true;
    if (currentUser.role === "gerente_loja") return true;
    
    // Limits: vendedor / operador_vendas staff can only access Dashboard, POS sales and basic customer lists
    const staffAllowedTabs = ["dashboard", "sales", "clients", "employee_debts"];
    return staffAllowedTabs.includes(tabName);
  };

  // Safe tab selection
  const selectTab = (tabName: string) => {
    if (isAuthorized(tabName)) {
      setActiveTab(tabName);
    }
    setMobileMenuOpen(false);
  };

  // If no safe operator session, force login page out-of-the-box
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Check if current corporate tenant workspace is blocked
  const activeTenant = store.getActiveTenant();
  if (activeTenant && activeTenant.status === "blocked" && store.getActiveTenantId() !== "kitanda-yetu") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Decorative glowing background radial */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex p-4 bg-red-550/10 border border-red-500/20 text-red-500 rounded-2xl animate-pulse">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">Espaço Suspenso</h2>
            <p className="text-zinc-400 text-xs font-mono">Empresa: <span className="text-zinc-200 font-bold">{activeTenant.name}</span></p>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto bg-zinc-950 border border-zinc-850 p-4 rounded-xl">
            Este espaço de trabalho foi temporariamente suspenso ou bloqueado pelo administrador geral do ecossistema. 
            Todas as operações de vendas, faturamento e acessos estão congeladas.
          </p>

          <div className="space-y-3 pt-2">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Tem dúvidas sobre a assinatura ou faturação?</p>
            <div className="flex flex-col gap-2">
              <a 
                href="mailto:suporte@kitandayetu.ao" 
                className="py-2.5 px-4 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-extrabold uppercase rounded-xl transition cursor-pointer"
              >
                Contactar o Suporte
              </a>
              <button 
                onClick={handleLogout}
                className="py-2.5 px-4 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/20 text-xs font-extrabold uppercase rounded-xl transition cursor-pointer"
              >
                Terminar Sessão
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Dynamic Desktop Left Sidebar layout */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-850 shrink-0 hidden md:flex flex-col justify-between p-6">
        <div className="space-y-6">
          {/* Main customized Brand Logo representing growth, commercio and intelligence */}
          <div className="flex items-center gap-3 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850 shadow-md">
            <svg
              className="w-10 h-10 shrink-0 select-none animate-pulse-subtle filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.15)]"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Modern shopping cart merged with rising data charts */}
              <circle cx="50" cy="50" r="46" fill="#18181b" stroke="#facc15" strokeWidth="2" />
              {/* Growth arrow */}
              <path
                d="M32 72L50 54L62 66L72 40M72 40H60M72 40V52"
                stroke="#facc15"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Basket line bar */}
              <path
                d="M26 62H42V68H26V62Z"
                fill="#ffffff"
                opacity="0.3"
              />
              <path
                d="M58 62H74V68H58V62Z"
                fill="#ffffff"
                opacity="0.3"
              />
            </svg>
            <div>
              <h1 className="text-sm font-black tracking-widest text-white leading-tight uppercase">
                Kitanda <span className="text-amber-400">Yetu</span>
              </h1>
              <span className="text-[10px] text-amber-300 font-bold block max-w-[130px] truncate mt-0.5" title={store.getActiveTenant().name}>
                🏢 {store.getActiveTenant().name}
              </span>
            </div>
          </div>

          {/* User details info widget container */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 space-y-2 text-xs shadow-inner">
            <div className="flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="text-zinc-500 font-bold text-[9px] block uppercase tracking-wider">Operador</span>
                <span className="font-extrabold text-white truncate block">{currentUser.name}</span>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                (currentUser.role === "admin" || currentUser.role === "gestor_principal") ? "bg-amber-400 text-black shadow-sm" : "bg-zinc-800 text-zinc-300"
              }`}>
                {currentUser.role === "admin" ? "Admin" : currentUser.role === "gestor_principal" ? "Gestor" : currentUser.role === "gerente_loja" ? "Gerente" : "Vendedor"}
              </span>
            </div>
            <button
              onClick={() => setPasswordModalOpen(true)}
              className="w-full py-1 px-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850/60 text-[9px] text-zinc-400 hover:text-amber-400 font-bold rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Key className="w-2.5 h-2.5 text-zinc-500" />
              Alterar Palavra-passe
            </button>
          </div>

          {/* Active Store Branch Selector Widget */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-bold text-[9px] block uppercase tracking-wider">🏢 Filial Activa</span>
              {currentUser.role !== "admin" && currentUser.role !== "gestor_principal" && (
                <span className="text-[8px] bg-zinc-800 text-zinc-400 font-black px-1.5 py-0.5 rounded uppercase border border-zinc-700/50">🔒 Trancada</span>
              )}
            </div>
            {currentUser.role === "admin" || currentUser.role === "gestor_principal" ? (
              <select
                value={activeStoreId}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2 text-[11px] text-zinc-200 focus:outline-none focus:border-amber-400/50 cursor-pointer transition select-none scrollbar-none"
              >
                {store.getStoreBranches().map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    📍 {branch.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs font-semibold text-zinc-300 bg-zinc-900/40 p-2 rounded-lg border border-zinc-850/60 flex items-center justify-between">
                <span>📍 {store.getStoreBranches().find(b => b.id === activeStoreId)?.name || "Sede Principal"}</span>
              </div>
            )}
          </div>

          {/* Connection Status & Sync Mode Widget */}
          <div 
            onClick={() => setSyncModalOpen(true)}
            className="cursor-pointer bg-zinc-950 p-3 rounded-2xl border border-zinc-850/80 hover:border-zinc-700/80 transition-all flex items-center justify-between text-xs group"
          >
            <div>
              <span className="text-zinc-500 font-bold text-[9px] block uppercase tracking-wider">Conectividade</span>
              <span className="font-semibold text-white flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-green-500 animate-pulse-subtle'}`} />
                {isOffline ? 'Modo Offline' : 'Modo Online'}
              </span>
            </div>
            {unsyncedCount > 0 ? (
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
                {unsyncedCount}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 font-extrabold group-hover:text-amber-400 uppercase tracking-wider transition-all">
                Painel
              </span>
            )}
          </div>

          {/* Nav Items menu */}
          <nav className="space-y-1.5" id="sidebar-nav">
            <span className="block text-[10px] text-zinc-550 uppercase tracking-widest font-black pb-1 px-3">Geral</span>
            
            {/* Dashboard tab */}
            <button
              id="sidebar-dashboard-tab"
              onClick={() => selectTab("dashboard")}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                activeTab === "dashboard"
                  ? "bg-amber-400 text-black font-black shadow-lg shadow-amber-400/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-805"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Painel Geral</span>
            </button>

            {/* Sales Point POS tab */}
            <button
              id="sidebar-sales-tab"
              onClick={() => selectTab("sales")}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all relative ${
                activeTab === "sales"
                  ? "bg-amber-400 text-black font-black shadow-lg shadow-amber-400/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-805"
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>Ponto de Venda (POS)</span>
            </button>

            {/* Catalog control tab */}
            <button
              id="sidebar-stock-tab"
              onClick={() => selectTab("stock")}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                activeTab === "stock"
                  ? "bg-amber-400 text-black font-black shadow-lg shadow-amber-400/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-805"
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>Estoque & Artigos</span>
            </button>

            {/* Clients registry tab */}
            <button
              id="sidebar-clients-tab"
              onClick={() => selectTab("clients")}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                activeTab === "clients"
                  ? "bg-amber-400 text-black font-black shadow-lg shadow-amber-400/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-805"
              }`}
            >
              <Users2 className="w-4 h-4 shrink-0" />
              <span>Clientes & Fiados</span>
            </button>

            {/* Employee Debts tab */}
            <button
              id="sidebar-employee-debts-tab"
              onClick={() => selectTab("employee_debts")}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                activeTab === "employee_debts"
                  ? "bg-emerald-400 text-black font-black shadow-lg shadow-emerald-400/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-805"
              }`}
            >
              <PiggyBank className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Dívidas de Funcionários</span>
            </button>

            <span className="block text-[10px] text-zinc-550 uppercase tracking-widest font-black pt-4 pb-1 px-3">Administração</span>

            {/* Financial tab */}
            <button
              id="sidebar-finance-tab"
              disabled={!isAuthorized("finance")}
              onClick={() => selectTab("finance")}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                activeTab === "finance"
                  ? "bg-amber-400 text-black font-black shadow-lg shadow-amber-400/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-805 disabled:opacity-40"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Tesouraria e Caixa</span>
              </div>
              {!isAuthorized("finance") && <Lock className="w-3 h-3 text-zinc-600 shrink-0" />}
            </button>

            {/* Settings tab */}
            <button
              id="sidebar-settings-tab"
              disabled={!isAuthorized("settings")}
              onClick={() => selectTab("settings")}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                activeTab === "settings"
                  ? "bg-amber-400 text-black font-black shadow-lg shadow-amber-400/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-805 disabled:opacity-40"
              }`}
            >
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-4 h-4 shrink-0" />
                <span>Configurações</span>
              </div>
              {!isAuthorized("settings") && <Lock className="w-3 h-3 text-zinc-600 shrink-0" />}
            </button>
          </nav>
        </div>

        {/* Bottom Actions of Sidebar */}
        <div className="space-y-2 pt-4 border-t border-zinc-850">
          {/* Eyecare night-mode toggle button */}
          <button
            id="sidebar-theme-toggle"
            onClick={handleToggleTheme}
            className="w-full text-left py-2.5 px-4 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-805 font-semibold flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              {settings.themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{settings.themeMode === "dark" ? "Modo Diurno" : "Modo Nocturno"}</span>
            </span>
            <span className="text-[9px] bg-zinc-800 text-zinc-400 font-bold px-1.5 py-0.5 rounded uppercase">
              {settings.themeMode}
            </span>
          </button>

          {/* Secure exit Logout */}
          <button
            id="sidebar-logout"
            onClick={handleLogout}
            className="w-full text-left py-2.5 px-4 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/10 font-bold flex items-center gap-3 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Turno</span>
          </button>
        </div>
      </aside>

      {/* Dynamic Mobile top navigation header */}
      <header className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow">
            KY
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white uppercase text-xs tracking-wider">
              Kitanda <span className="text-amber-400">Yetu</span>
            </span>
            <span className="text-[9px] text-zinc-400 font-medium truncate max-w-[120px]">
              🏢 {store.getActiveTenant().name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Connecticity indicator with sync icon selection mobile */}
          <button
            onClick={() => { setSyncModalOpen(true); setMobileMenuOpen(false); }}
            className={`p-1.5 border hover:text-white rounded-lg transition flex items-center gap-1.5 text-xs font-semibold ${
              isOffline 
                ? "bg-amber-950/20 border-amber-800/60 text-amber-400" 
                : "bg-zinc-950 border-zinc-850 text-green-400"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
            {unsyncedCount > 0 && <span className="font-bold text-[9px]">({unsyncedCount})</span>}
          </button>

          {/* Quick theme toggler mobile */}
          <button
            onClick={handleToggleTheme}
            className="p-1.5 bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white rounded-lg transition"
          >
            {settings.themeMode === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white rounded-lg transition"
          >
            {mobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu overlay content */}
      {mobileMenuOpen && (
        <div className="fixed inset-y-0 left-0 right-0 top-[57px] bg-zinc-950 z-40 p-6 space-y-6 flex flex-col justify-between animate-fadeIn border-t border-zinc-900 md:hidden font-sans">
          <div className="space-y-4">
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-850 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 font-bold text-[9px] uppercase">Operador Ativo</span>
                  <span className="font-extrabold text-white block mt-0.5">{currentUser.name}</span>
                </div>
                <span className="text-[10px] bg-amber-400 text-black font-extrabold px-2 py-0.5 rounded uppercase">
                  {currentUser.role === "admin" ? "Admin" : currentUser.role === "gestor_principal" ? "Gestor" : currentUser.role === "gerente_loja" ? "Gerente" : "Vendedor"}
                </span>
              </div>
              <button
                onClick={() => {
                  setPasswordModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full py-1.5 px-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-855 text-[10px] text-zinc-400 hover:text-amber-400 font-bold rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Key className="w-2.5 h-2.5 text-zinc-505" />
                Alterar Palavra-passe
              </button>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => selectTab("dashboard")}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${
                  activeTab === "dashboard" ? "bg-amber-400 text-black" : "text-zinc-400"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Painel Geral</span>
              </button>

              <button
                onClick={() => selectTab("sales")}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${
                  activeTab === "sales" ? "bg-amber-400 text-black" : "text-zinc-400"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Venda Rápida (POS)</span>
              </button>

              <button
                onClick={() => selectTab("stock")}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${
                  activeTab === "stock" ? "bg-amber-400 text-black" : "text-zinc-400"
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Estoque & Artigos</span>
              </button>

              <button
                onClick={() => selectTab("clients")}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${
                  activeTab === "clients" ? "bg-amber-400 text-black" : "text-zinc-400"
                }`}
              >
                <Users2 className="w-4 h-4" />
                <span>Clientes & Fiados</span>
              </button>

              <button
                onClick={() => selectTab("employee_debts")}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${
                  activeTab === "employee_debts" ? "bg-emerald-400 text-black" : "text-zinc-400"
                }`}
              >
                <PiggyBank className="w-4 h-4 text-emerald-400" />
                <span>Dívidas de Funcionários</span>
              </button>

              {isAuthorized("finance") && (
                <button
                  onClick={() => selectTab("finance")}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${
                    activeTab === "finance" ? "bg-amber-400 text-black" : "text-zinc-400"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Tesouraria e Caixa</span>
                </button>
              )}

              {isAuthorized("settings") && (
                <button
                  onClick={() => selectTab("settings")}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${
                    activeTab === "settings" ? "bg-amber-400 text-black" : "text-zinc-400"
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Configurações</span>
                </button>
              )}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      )}

      {/* Main workspace frame viewport */}
      <main className="flex-1 bg-zinc-950 p-6 md:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full relative z-10 select-none">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "sales" && <Sales />}
        {activeTab === "stock" && <Stock />}
        {activeTab === "clients" && <Clients />}
        {activeTab === "employee_debts" && <EmployeeDebtsPanel />}
        {activeTab === "finance" && <Finance />}
        {activeTab === "settings" && <Settings />}
      </main>

      <SyncModal isOpen={syncModalOpen} onClose={() => setSyncModalOpen(false)} />

      {/* Floating Auto-Sync Toast Notify Banner */}
      {autoSyncStatus && !toastDismissed && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl shadow-black/80 flex items-center gap-3 animate-fade-in">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
            isAutoSyncing 
              ? "bg-amber-400/15 border-amber-400/20 text-amber-400" 
              : autoSyncStatus.includes("concluída") || autoSyncStatus.includes("sucesso") || autoSyncStatus.includes("concluido")
                ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-300"
          }`}>
            {isAutoSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : autoSyncStatus.includes("concluída") || autoSyncStatus.includes("sucesso") || autoSyncStatus.includes("concluido") ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <CloudLightning className="w-4 h-4 animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Sincronização Híbrida</h5>
            <p className="text-xs text-white font-bold mt-0.5 leading-snug">{autoSyncStatus}</p>
          </div>
          <button 
            onClick={() => setToastDismissed(true)}
            className="p-1.5 hover:text-white text-zinc-500 hover:bg-zinc-800 rounded-lg cursor-pointer transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Custom float Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 border border-amber-400 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-55 animate-fadeIn flex items-center gap-3 font-mono text-xs">
          <span className="text-amber-400">✨</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Profile Password Modifier Modal Dialog */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-55 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" /> Alterar Palavra-passe
              </h3>
              <button
                onClick={() => {
                  setPasswordModalOpen(false);
                  setPasswordModalError("");
                }}
                className="text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordModalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs font-semibold leading-relaxed">
                ⚠️ {passwordModalError}
              </div>
            )}

            <form onSubmit={handleChangeProfilePassword} className="space-y-3.5">
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Palavra-passe Atual</label>
                <input
                  type="password"
                  required
                  placeholder="Palavra-passe atual"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 p-2.5 text-xs text-white rounded-xl placeholder-zinc-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Nova Palavra-passe</label>
                <input
                  type="password"
                  required
                  placeholder="Nova palavra-passe"
                  value={newProfilePassword}
                  onChange={(e) => setNewProfilePassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 p-2.5 text-xs text-white rounded-xl placeholder-zinc-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Confirmar Nova Palavra-passe</label>
                <input
                  type="password"
                  required
                  placeholder="Confirmar palavra-passe"
                  value={confirmProfilePassword}
                  onChange={(e) => setConfirmProfilePassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-550 p-2.5 text-xs text-white rounded-xl placeholder-zinc-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordModalError("");
                  }}
                  className="flex-1 py-2 bg-zinc-805 hover:bg-zinc-800 text-zinc-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-black rounded-xl transition shadow-lg shadow-amber-400/10 cursor-pointer"
                >
                  Gravar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
