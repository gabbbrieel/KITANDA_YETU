/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { store } from "../services/store";
import { LogIn, Key, Compass, AlertCircle, HelpCircle, CheckCircle, Building2, Zap, ShieldAlert, Award, Phone, Mail, MapPin, Eye, EyeOff, User } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [currentMode, setCurrentMode] = useState<"login" | "signup">("login");
  
  // Login fields
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"gestor_principal" | "gerente_loja" | "operador_vendas">("gestor_principal");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // SaaS self-signup fields
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyNif, setNewCompanyNif] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [newCompanyPhone, setNewCompanyPhone] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");
  const [newCompanyPlan, setNewCompanyPlan] = useState<"starter" | "profissional" | "enterprise">("profissional");

  // SaaS self-signup Admin credentials
  const [signupAdminName, setSignupAdminName] = useState("");
  const [signupAdminUsername, setSignupAdminUsername] = useState("");
  const [signupAdminPassword, setSignupAdminPassword] = useState("");

  const [error, setError] = useState("");
  const [showRecover, setShowRecover] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<number>(1); // 1: request, 2: verify OTP, 3: set new password, 4: success
  const [recoveredUser, setRecoveredUser] = useState<any>(null);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [smsStatus, setSmsStatus] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleRequestSMS = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");
    if (!recoveryPhone || !recoveryEmail) {
      setRecoveryError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const foundUser = store.getUsers().find(u => 
      u.email.toLowerCase().trim() === recoveryEmail.toLowerCase().trim() || 
      (u.username && u.username.toLowerCase().trim() === recoveryEmail.toLowerCase().trim())
    );

    if (!foundUser) {
      setRecoveryError("Não foi encontrado nenhum utilizador com este e-mail/utilizador no Espaço de Trabalho selecionado.");
      return;
    }

    setRecoveredUser(foundUser);
    setIsSendingSMS(true);
    setSmsStatus("A gerar token seguro de recuperação...");
    
    setTimeout(() => {
      setSmsStatus("A ligar ao Gateway de Mensagens (UNITEL/MOVICEL)...");
      setTimeout(() => {
        setSmsStatus("Código SMS despachado com sucesso!");
        setTimeout(() => {
          setIsSendingSMS(false);
          setRecoveryStep(2);
        }, 800);
      }, 1000);
    }, 1000);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");
    if (!otpCode) {
      setRecoveryError("Por favor, introduza o código de verificação.");
      return;
    }
    if (otpCode !== "123456" && otpCode.length < 4) {
      setRecoveryError("Código incorreto. Utilize a dica padrão de demonstração: 123456.");
      return;
    }
    setRecoveryStep(3);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");
    if (newPassword.length < 4) {
      setRecoveryError("A nova palavra-passe deve conter pelo menos 4 caracteres.");
      return;
    }
    if (recoveredUser) {
      store.updateUser(recoveredUser.id, { password: newPassword });
    }
    triggerToast("Palavra-passe redefinida com sucesso!");
    setRecoveryStep(4);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newCompanyName.trim()) {
      setError("Por favor, introduza o nome da sua empresa.");
      return;
    }
    if (!newCompanyNif.trim()) {
      setError("Por favor, introduza o NIF da sua empresa.");
      return;
    }
    if (!newCompanyEmail.trim()) {
      setError("Por favor, introduza o e-mail corporativo.");
      return;
    }
    if (!newCompanyPhone.trim()) {
      setError("Por favor, introduza o número de telefone.");
      return;
    }

    if (!signupAdminName.trim()) {
      setError("Por favor, crie o nome completo do operador/administrador.");
      return;
    }
    if (!signupAdminUsername.trim()) {
      setError("Por favor, defina o nome de utilizador ou e-mail de login.");
      return;
    }
    if (signupAdminPassword.length < 4) {
      setError("A palavra-passe de administrador deve conter pelo menos 4 caracteres.");
      return;
    }

    try {
      const newTenant = store.registerTenant(
        newCompanyName.trim(),
        newCompanyNif.trim(),
        newCompanyPlan,
        newCompanyEmail.trim(),
        newCompanyPhone.trim(),
        newCompanyAddress.trim() || "Angola",
        signupAdminName.trim(),
        signupAdminUsername.trim(),
        signupAdminPassword
      );

      triggerToast(`Espaço de Trabalho "${newCompanyName}" registado com sucesso!`);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao registar empresa. Verifique os dados introduzidos.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Por favor, preencha o seu e-mail ou nome de utilizador.");
      return;
    }
    if (!password) {
      setError("Por favor, introduza a sua palavra-passe.");
      return;
    }

    // Since we are running in pre-saved demonstration environment,
    // we bypass hashing but validate matching user accounts in the store
    const success = store.login(email, role, password);

    if (success) {
      onLoginSuccess();
    } else {
      setError("Credenciais inválidas ou conta inativa. Verifique os dados inseridos.");
    }
  };

  const handleQuickFill = (quickEmail: string, quickRole: any) => {
    setEmail(quickEmail);
    setRole(quickRole);
    setPassword("********");
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {toast && (
        <div className="fixed top-8 right-8 z-55 bg-white border border-blue-600 text-slate-800 text-xs px-5 py-3.5 rounded-2xl shadow-2xl font-bold animate-fadeIn flex items-center gap-2">
          <span className="text-[#0066FF]">✨</span>
          {toast}
        </div>
      )}

      {/* LEFT COLUMN: Deep Blue Branding (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-gradient-to-br from-[#003ca6] via-[#0046C7] to-indigo-950 p-12 text-white flex-col justify-between relative overflow-hidden min-h-screen select-none">
        {/* Abstract vector ripples in background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top brand indication */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-xl bg-white text-[#0046C7] flex items-center justify-center font-black text-base shadow-md">
            K
          </div>
          <span className="text-sm font-semibold tracking-wider uppercase text-blue-100 font-mono">
            KITANDA YETU Ecosystem
          </span>
        </div>

        {/* Hero contents */}
        <div className="my-auto space-y-8 z-10 max-w-lg">
          <div>
            <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/20 font-black tracking-widest uppercase px-2.5 py-1 rounded inline-block mb-3">
              FACTURAÇÃO CERTIFICADA AGT
            </span>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white">
              Gira o teu negócio à velocidade da luz.
            </h1>
            <p className="text-blue-100/80 text-sm mt-3.5 leading-relaxed font-sans">
              O software KITANDA YETU é ideal para lojas comerciais, pastelarias, armazéns e serviços em Angola. Emita faturas certificadas de forma simples e totalmente offline-first.
            </p>
          </div>

          {/* List features with elegant microcards */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl space-y-1.5 hover:bg-white/10 transition">
              <div className="flex items-center gap-2 text-blue-300">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Multi-Filial</span>
              </div>
              <p className="text-[11px] text-blue-100/70">Gerencie múltiplas lojas físicas sob o mesmo NIF com facilidade.</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl space-y-1.5 hover:bg-white/10 transition">
              <div className="flex items-center gap-2 text-blue-300">
                <Zap className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Sincronização</span>
              </div>
              <p className="text-[11px] text-blue-100/70">Trabalhe totalmente sem internet. Sincronize quando desejar.</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl space-y-1.5 hover:bg-white/10 transition">
              <div className="flex items-center gap-2 text-blue-300">
                <Award className="w-4 h-4 shrink-0 text-blue-300" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Licença Livre</span>
              </div>
              <p className="text-[11px] text-blue-100/70">Planos sem limites de produtos ou faturas lançadas na sua máquina.</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl space-y-1.5 hover:bg-white/10 transition">
              <div className="flex items-center gap-2 text-blue-300">
                <Building2 className="w-4 h-4 shrink-0 text-purple-300" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Gestão Local</span>
              </div>
              <p className="text-[11px] text-blue-100/70">Armazenamento local super seguro para total confidencialidade do negócio.</p>
            </div>
          </div>
        </div>

        {/* Footer info in deep blue pane */}
        <div className="text-xs text-blue-200/50 flex justify-between border-t border-white/10 pt-4 z-10 font-mono">
          <span>Licenciado para Angola</span>
          <span>KITANDA YETU Software S.A.</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Cegid Styled White Login Box */}
      <div className="w-full md:w-1/2 lg:w-[45%] xl:w-[40%] bg-white flex flex-col justify-between p-8 md:p-12 min-h-screen z-10 border-l border-slate-100 text-slate-800 shadow-2xl">
        
        {/* Brand Logo Header top margin */}
        <div className="text-center md:text-left mt-2 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tighter text-[#0046C7]">
              KITANDA<span className="text-[#00Bbf5] font-light mx-1">|</span><span className="text-slate-700 font-normal">YETU</span>
            </span>
          </div>
          <span className="text-[10px] bg-slate-100 font-mono text-slate-500 rounded-lg px-2.5 py-1 border border-slate-200">
            Angola ERP v7.8
          </span>
        </div>

        {/* Main core interactive form */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {!showRecover ? (
            <>
              {/* SaaS Mode Switcher (Login vs Sign-up Tabs) */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200/55">
                <button
                  id="tab-login-btn"
                  type="button"
                  onClick={() => { setCurrentMode("login"); setError(""); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all text-center ${
                    currentMode === "login"
                      ? "bg-white text-[#0046C7] shadow-md shadow-slate-200/60 border border-slate-200/40"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Iniciar Sessão
                </button>
                <button
                  id="tab-signup-btn"
                  type="button"
                  onClick={() => { setCurrentMode("signup"); setError(""); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all text-center ${
                    currentMode === "signup"
                      ? "bg-white text-[#0046C7] shadow-md shadow-slate-200/60 border border-slate-200/40"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Criar Espaço (Registar-se)
                </button>
              </div>

              {/* Action Headline */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {currentMode === "login" ? "Aceder à sua Área Comercial" : "Experimente Grátis o ERP Comercial"}
                </h2>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  {currentMode === "login" 
                    ? "Inicie a sua sessão com o seu utilizador ou e-mail correspondente." 
                    : "Obtenha acesso instantâneo a uma licença comercial totalmente ilimitada."}
                </p>
              </div>

              {error && (
                <div id="login-error" className="mb-5 bg-red-50 border border-red-200 text-red-800 text-[11px] p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {currentMode === "login" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Access Role Selector */}
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1.5">Nível de Permissão</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        id="role-gestor-btn"
                        type="button"
                        onClick={() => setRole("gestor_principal")}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold transition border text-center ${
                          role === "gestor_principal"
                            ? "bg-[#0046C7] border-[#0046C7] text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Gestor Principal
                      </button>
                      <button
                        id="role-gerente-btn"
                        type="button"
                        onClick={() => setRole("gerente_loja")}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold transition border text-center ${
                          role === "gerente_loja"
                            ? "bg-[#0046C7] border-[#0046C7] text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Gerente de Loja
                      </button>
                      <button
                        id="role-seller-btn"
                        type="button"
                        onClick={() => setRole("operador_vendas")}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold transition border text-center ${
                          role === "operador_vendas"
                            ? "bg-[#0046C7] border-[#0046C7] text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Gestor de Vendas
                      </button>
                    </div>
                  </div>

                   {/* Email Address or Username */}
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1.5">E-mail ou Nome de Utilizador</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <LogIn className="w-4 h-4" />
                      </div>
                      <input
                        id="email-input"
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Utilizador ou e-mail"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0046C7] focus:ring-1 focus:ring-[#0046C7] transition"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider">Palavra-passe</label>
                      <button
                        id="forgot-password"
                        type="button"
                        onClick={() => setShowRecover(true)}
                        className="text-[11px] text-[#0046C7] font-semibold hover:underline"
                      >
                        Recuperar Palavra-passe
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <input
                        id="password-input"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-12 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0046C7] focus:ring-1 focus:ring-[#0046C7] transition"
                      />
                      <button
                        type="button"
                        id="toggle-login-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit-login-btn"
                    type="submit"
                    className="w-full bg-[#0046C7] hover:bg-[#003ca6] text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/10 text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    Entrar no KITANDA YETU
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* New Company Name */}
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Nome da Empresa Comercial *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-company-name"
                        type="text"
                        required
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Ex: Armazém Comercial Angola Lda"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0046C7] focus:ring-1 focus:ring-[#0046C7] transition"
                      />
                    </div>
                  </div>

                  {/* NIF and Phone Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">NIF Geral Angola *</label>
                      <input
                        id="signup-company-nif"
                        type="text"
                        required
                        value={newCompanyNif}
                        onChange={(e) => setNewCompanyNif(e.target.value)}
                        placeholder="Ex: 5003624510"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0046C7]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Telemóvel *</label>
                      <input
                        id="signup-company-phone"
                        type="tel"
                        required
                        value={newCompanyPhone}
                        onChange={(e) => setNewCompanyPhone(e.target.value)}
                        placeholder="Ex: 923456000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0046C7]"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">E-mail de Contacto do Espaço *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-company-email"
                        type="email"
                        required
                        value={newCompanyEmail}
                        onChange={(e) => setNewCompanyEmail(e.target.value)}
                        placeholder="geral@suaempresa.ao"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0046C7] transition"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Localização da Sede</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-company-address"
                        type="text"
                        value={newCompanyAddress}
                        onChange={(e) => setNewCompanyAddress(e.target.value)}
                        placeholder="Ex: Talatona, Edifício Kwanza, Luanda"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0046C7]"
                      />
                    </div>
                  </div>

                  {/* Admin Credentials Setup Block */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-inner">
                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                      <User className="w-3.5 h-3.5 text-[#0046C7]" />
                      Credenciais do Administrador da Empresa *
                    </h4>
                    
                    <div>
                      <label className="block text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Nome Completo do Admin *</label>
                      <input
                        type="text"
                        required
                        value={signupAdminName}
                        onChange={(e) => setSignupAdminName(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full bg-white border border-slate-205 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0046C7] focus:ring-1 focus:ring-[#0046C7] transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Login (Utilizador) *</label>
                        <input
                          type="text"
                          required
                          value={signupAdminUsername}
                          onChange={(e) => setSignupAdminUsername(e.target.value)}
                          placeholder="Ex: joao.admin"
                          className="w-full bg-white border border-slate-205 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0046C7] focus:ring-1 focus:ring-[#0046C7] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Palavra-passe *</label>
                        <input
                          type="password"
                          required
                          value={signupAdminPassword}
                          onChange={(e) => setSignupAdminPassword(e.target.value)}
                          placeholder="Mín. 4 caracteres"
                          className="w-full bg-white border border-slate-205 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0046C7] focus:ring-1 focus:ring-[#0046C7] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SaaS Subscription Plans */}
                  <div>
                    <label className="block text-slate-600 text-[10px] font-black uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-[#0046C7]" />
                      Plano Comercial Escolhido (Todos os Planos são Ilimitados)
                    </label>
                    <div className="space-y-2">
                      <label className={`block p-2.5 rounded-xl border cursor-pointer transition ${
                        newCompanyPlan === "starter" ? "border-[#0046C7] bg-slate-100/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}>
                        <input
                          type="radio"
                          name="saas_plan"
                          checked={newCompanyPlan === "starter"}
                          onChange={() => setNewCompanyPlan("starter")}
                          className="sr-only"
                        />
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">Licença de 1 Mês</span>
                            <span className="text-[10px] text-slate-500 font-medium">Capacidade total sem limites • 30 dias ativo</span>
                          </div>
                          <span className="text-xs font-extrabold text-[#0046C7]">7.500 Kz</span>
                        </div>
                      </label>

                      <label className={`block p-2.5 rounded-xl border cursor-pointer transition ${
                        newCompanyPlan === "profissional" ? "border-[#0046C7] bg-slate-100/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}>
                        <input
                          type="radio"
                          name="saas_plan"
                          checked={newCompanyPlan === "profissional"}
                          onChange={() => setNewCompanyPlan("profissional")}
                          className="sr-only"
                        />
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">Licença de 6 Mêses (Económico)</span>
                            <span className="text-[10px] text-slate-500 font-medium font-sans">Sincronização AGT ativa • 180 dias ativos</span>
                          </div>
                          <span className="text-xs font-extrabold text-[#0046C7]">35.000 Kz</span>
                        </div>
                      </label>

                      <label className={`block p-2.5 rounded-xl border cursor-pointer transition ${
                        newCompanyPlan === "enterprise" ? "border-[#0046C7] bg-slate-100/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}>
                        <input
                          type="radio"
                          name="saas_plan"
                          checked={newCompanyPlan === "enterprise"}
                          onChange={() => setNewCompanyPlan("enterprise")}
                          className="sr-only"
                        />
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block font-sans">Licença Anual (Melhor Preço)</span>
                            <span className="text-[10px] text-slate-500 font-medium block">Completo para alta faturação • 365 dias ativos</span>
                          </div>
                          <span className="text-xs font-extrabold text-[#0046C7]">65.000 Kz</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    id="signup-submit-btn"
                    type="submit"
                    className="w-full bg-[#0046C7] hover:bg-[#003ca6] text-white font-extrabold py-3 px-4 rounded-xl shadow-lg text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    Activar Espaço & Entrar no Dashboard
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="space-y-4 animate-fadeIn text-slate-700">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-[#0046C7] rounded-full flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Recuperação de Acesso</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Recupere a palavra-passe do seu funcionário por verificação de código SMS EMIS.
                </p>
              </div>

              {recoveryError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-[11px] p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoveryStep === 1 && (
                <form onSubmit={handleRequestSMS} className="space-y-4 text-left">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1.5">E-mail Registado *</label>
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="exemplo@empresa.ao"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#003ca6] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1.5">Telemóvel Associado (Angola) *</label>
                    <input
                      type="tel"
                      required
                      value={recoveryPhone}
                      onChange={(e) => setRecoveryPhone(e.target.value)}
                      placeholder="Ex: 923 000 000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:bg-white focus:border-[#003ca6] transition"
                    />
                  </div>

                  {!isSendingSMS ? (
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#0046C7] hover:bg-[#003ca6] text-white font-black uppercase text-xs tracking-wider rounded-xl transition shadow"
                    >
                      Transmitir Token por SMS
                    </button>
                  ) : (
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center space-y-2">
                      <span className="text-xs text-[#0046C7] font-bold animate-pulse inline-block">{smsStatus}</span>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0046C7] animate-progressBar"></div>
                      </div>
                    </div>
                  )}
                </form>
              )}

              {recoveryStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-4 text-left">
                  <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl text-[11px] text-slate-500 text-center">
                    Código despachado para o número <strong className="text-slate-800">{recoveryPhone}</strong>.
                    <br />
                    <span className="text-[#0046C7] font-medium mt-1 inline-block">Dica de Teste: Use o código <strong>123456</strong></span>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1.5 text-center">Código OTP de 6 Dígitos *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Introduza os 6 dígitos"
                      className="w-full tracking-[0.3em] font-mono text-center bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm font-bold text-[#0046C7] focus:outline-none focus:bg-white focus:border-[#0046C7]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0046C7] hover:bg-[#003ca6] text-white font-black uppercase text-xs tracking-wider rounded-xl transition shadow"
                  >
                    Verificar Código
                  </button>
                </form>
              )}

              {recoveryStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-800 text-center">
                    Identidade móvel confirmada com sucesso via EMIS.
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1.5">Nova Palavra-passe *</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0046C7]"
                      />
                      <button
                        type="button"
                        id="toggle-new-password-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0046C7] hover:bg-[#003ca6] text-white font-black uppercase text-xs tracking-wider rounded-xl transition shadow"
                  >
                    Atualizar Palavra-passe
                  </button>
                </form>
              )}

              {recoveryStep === 4 && (
                <div className="py-4 space-y-4 text-center">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">Sucesso Total!</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      A sua palavra-passe foi redefinida com sucesso. Já pode iniciar sessão normalmente com os novos dados.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRecover(false);
                      setRecoveryStep(1);
                      setRecoveryPhone("");
                      setRecoveryEmail("");
                      setOtpCode("");
                      setNewPassword("");
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold rounded-xl transition"
                  >
                    Voltar ao Formulário de Login
                  </button>
                </div>
              )}

              {recoveryStep < 4 && (
                <button
                  id="back-login-btn"
                  type="button"
                  onClick={() => {
                    setShowRecover(false);
                    setRecoveryStep(1);
                    setRecoveryError("");
                  }}
                  className="text-xs text-[#0046C7] font-semibold hover:underline mt-4 block mx-auto text-center"
                >
                  Cancelar e Voltar ao Início
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer legal copyrights centered branding */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4 mt-auto">
          <p>© {new Date().getFullYear()} KITANDA YETU Angola • Software Certificado nº 132/AGT</p>
          <p className="mt-1 font-medium text-[#0046C7]/70">Sistema completo para a faturacão e gestão inteligente de múltiplos pontos de venda.</p>
        </div>
      </div>
    </div>
  );
}
