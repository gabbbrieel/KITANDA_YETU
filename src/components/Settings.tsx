/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { store } from "../services/store";
import { AppSettings, User, UserRole } from "../types";
import { CompanyLogo } from "./InvoiceModal";
import {
  Settings as SettingsIcon,
  Building,
  Users,
  Database,
  UserPlus,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Gift,
  Upload,
  Wifi,
  Printer,
  Edit,
  Trash2,
  Lock,
  Unlock,
  UserX,
} from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState(() => store.getSettings());
  const [users, setUsers] = useState(() => store.getUsers());
  const [currentUser] = useState(() => store.getCurrentUser());
  const [branches, setBranches] = useState(() => store.getStoreBranches());
  const [stockRequests, setStockRequests] = useState(() => store.getStockRequests());
  const [products, setProducts] = useState(() => store.getAllProducts());
  const [saasTenants, setSaasTenants] = useState(() => store.getSaasTenants());
  const [deletedTenants, setDeletedTenants] = useState(() => store.getDeletedSaasTenants());

  // Subscribe to updates
  useMemo(() => {
    const unsubscribe = store.subscribe(() => {
      setSettings({ ...store.getSettings() });
      setUsers([...store.getUsers()]);
      setBranches([...store.getStoreBranches()]);
      setStockRequests([...store.getStockRequests()]);
      setProducts([...store.getAllProducts()]);
      setSaasTenants([...store.getSaasTenants()]);
      setDeletedTenants([...store.getDeletedSaasTenants()]);
    });
    return () => unsubscribe();
  }, []);

  // Form states: Company details
  const [cName, setCName] = useState(settings.companyName);
  const [cNif, setCNif] = useState(settings.companyNif);
  const [cPhone, setCPhone] = useState(settings.companyPhone);
  const [cEmail, setCEmail] = useState(settings.companyEmail);
  const [cAddress, setCAddress] = useState(settings.companyAddress);
  const [cIban, setCIban] = useState(settings.companyIban || "");
  const [cTaxRate, setCTaxRate] = useState(String(settings.taxRate));
  const [cRegime, setCRegime] = useState(settings.regime);
  const [cFormat, setCFormat] = useState<"a4" | "thermal">(settings.printFormat);
  const [cLogoId, setCLogoId] = useState(settings.companyLogoId || "preset-basket");
  const [cCustomLogoUrl, setCCustomLogoUrl] = useState(settings.customLogoUrl || "");

  const [netMode, setNetMode] = useState(settings.networkMode || "standalone");
  const [netIp, setNetIp] = useState(settings.networkIp || "192.168.1.105");
  const [netPort, setNetPort] = useState(settings.networkPort || "3000");
  const [pType, setPType] = useState(settings.printerType || "system");
  const [pConn, setPConn] = useState(settings.printerConnection || "usb");
  const [pIp, setPIp] = useState(settings.printerIp || "192.168.1.250");
  const [pPort, setPPort] = useState(settings.printerPort || "9100");
  const [pWidth, setPWidth] = useState(settings.printerPaperWidth || "80");

  // Form states: Manage Users
  const [showAddUser, setShowAddUser] = useState(false);
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uUsername, setUUsername] = useState("");
  const [uPassword, setUPassword] = useState("");
  const [uRole, setURole] = useState<UserRole>("operador_vendas");
  const [uStoreId, setUStoreId] = useState("loja-a");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states: Manage Branches (Lojas)
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchLocation, setBranchLocation] = useState("");
  const [branchTel, setBranchTel] = useState("");
  const [isBranchCodeManual, setIsBranchCodeManual] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  const handleBranchNameChange = (val: string) => {
    setBranchName(val);
    if (!isBranchCodeManual) {
      const codeSuggestion = val
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 8);
      
      if (codeSuggestion) {
        let uniqueCode = codeSuggestion;
        let counter = 1;
        while (branches.some(b => b.code.toUpperCase() === uniqueCode.toUpperCase())) {
          counter++;
          uniqueCode = `${codeSuggestion}${counter}`;
        }
        setBranchCode(uniqueCode);
      } else {
        setBranchCode("");
      }
    }
  };

  // License renew state variables
  const [selectedPlan, setSelectedPlan] = useState<"mensal" | "trimestral" | "semestral" | "anual">("mensal");
  const [renewPhone, setRenewPhone] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewStep, setRenewStep] = useState(1);
  const [showRenewModal, setShowRenewModal] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  // Form states: Inter-branch transfers
  const [trfSource, setTrfSource] = useState("");
  const [trfDest, setTrfDest] = useState("");
  const [trfProd, setTrfProd] = useState("");
  const [trfQty, setTrfQty] = useState("");

  const [reqSource, setReqSource] = useState("");
  const [reqProd, setReqProd] = useState("");
  const [reqQty, setReqQty] = useState("");

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRenewLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewPhone.trim()) {
      triggerToast("Erro: Indique o número de telemóvel Multicaixa Express.");
      return;
    }
    setIsRenewing(true);
    setRenewStep(1);

    // Progressive EMIS Multicaixa trigger simulator steps
    setTimeout(() => {
      setRenewStep(2); // A aguardar aprovação de pagamento no telemóvel...
      setTimeout(() => {
        setRenewStep(3); // Pagamento efetuado! Registando licença...
        setTimeout(() => {
          // Expiry calculation
          const currentExpiry = new Date(settings.licenseExpiry || new Date());
          const start = currentExpiry > new Date() ? currentExpiry : new Date();
          let daysToAdd = 30;
          if (selectedPlan === "trimestral") daysToAdd = 90;
          else if (selectedPlan === "semestral") daysToAdd = 180;
          else if (selectedPlan === "anual") daysToAdd = 365;

          const baseDate = new Date(start.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
          const nextExpiryStr = baseDate.toISOString().split("T")[0];

          store.updateSettings({
            licenseStatus: "active",
            licenseExpiry: nextExpiryStr,
            licenseType: selectedPlan,
            licenseKey: `KY-EMIS-${Math.floor(100000 + Math.random() * 900000)}-${selectedPlan.toUpperCase()}`,
          });

          setIsRenewing(false);
          setShowRenewModal(false);
          triggerToast(`Licença renovada! Nova validade: ${nextExpiryStr}`);
        }, 1205);
      }, 1500);
    }, 1200);
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cNif || !cPhone || !cEmail || !cAddress) {
      triggerToast("Preencha todos os dados obrigatórios da empresa.");
      return;
    }

    store.updateSettings({
      companyName: cName,
      companyNif: cNif,
      companyPhone: cPhone,
      companyEmail: cEmail,
      companyAddress: cAddress,
      companyIban: cIban || undefined,
      taxRate: parseFloat(cTaxRate) || 14,
      regime: cRegime,
      printFormat: cFormat,
      companyLogoId: cLogoId,
      customLogoUrl: cCustomLogoUrl || undefined,
      networkMode: netMode as any,
      networkIp: netIp,
      networkPort: netPort,
      printerType: pType as any,
      printerConnection: pConn as any,
      printerIp: pIp,
      printerPort: pPort,
      printerPaperWidth: pWidth as any,
    });

    triggerToast("Perfil fiscal da Kitanda gravado com êxito!");
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uName || !uEmail) {
      triggerToast("Erro: Preencha o nome e e-mail.");
      return;
    }

    if (editingUserId) {
      if (users.some((u) => u.email.toLowerCase() === uEmail.toLowerCase() && u.id !== editingUserId)) {
        triggerToast("Erro: Este e-mail já está registado noutro utilizador.");
        return;
      }
      if (uUsername && users.some((u) => u.username && u.username.toLowerCase() === uUsername.toLowerCase() && u.id !== editingUserId)) {
        triggerToast("Erro: Este nome de utilizador já está registado noutro utilizador.");
        return;
      }

      store.updateUser(editingUserId, {
        name: uName,
        email: uEmail,
        username: uUsername,
        password: uPassword,
        role: uRole,
        storeId: uStoreId,
      });

      triggerToast("Colaborador atualizado com sucesso!");
    } else {
      if (users.some((u) => u.email.toLowerCase() === uEmail.toLowerCase())) {
        triggerToast("Erro: Este e-mail já está registado noutro utilizador.");
        return;
      }
      if (uUsername && users.some((u) => u.username && u.username.toLowerCase() === uUsername.toLowerCase())) {
        triggerToast("Erro: Este nome de utilizador já está registado noutro utilizador.");
        return;
      }

      store.addUser({
        name: uName,
        email: uEmail,
        username: uUsername,
        password: uPassword,
        role: uRole,
        active: true,
        storeId: uStoreId,
      });

      triggerToast("Colaborador registado e activo no sistema!");
    }

    setUName("");
    setUEmail("");
    setUUsername("");
    setUPassword("");
    setURole("operador_vendas");
    setEditingUserId(null);
    setShowAddUser(false);
  };

  const handleAddNewBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || !branchCode) {
      triggerToast("Erro: Forneça pelo menos o nome e o código da filial.");
      return;
    }

    if (editingBranchId) {
      if (branches.some(b => b.code.toUpperCase() === branchCode.toUpperCase() && b.id !== editingBranchId)) {
        triggerToast("Erro: Já existe uma filial com este código.");
        return;
      }
      try {
        store.updateStoreBranch(editingBranchId, {
          name: branchName,
          code: branchCode.toUpperCase(),
          location: branchLocation || "Sem endereço listado",
          tel: branchTel || "Sem telefone listado"
        });
        triggerToast(`Filial "${branchName}" atualizada com êxito!`);
      } catch (err: any) {
        triggerToast(`Erro: ${err.message || "Não foi possível cadastrar a filial."}`);
        return;
      }
    } else {
      if (branches.some(b => b.code.toUpperCase() === branchCode.toUpperCase())) {
        triggerToast("Erro: Já existe uma filial com este código.");
        return;
      }
      try {
        store.addStoreBranch({
          name: branchName,
          code: branchCode.toUpperCase(),
          location: branchLocation || "Sem endereço listado",
          tel: branchTel || "Sem telefone listado"
        });
        triggerToast(`Filial "${branchName}" registada com êxito!`);
      } catch (err: any) {
        triggerToast(`Erro: ${err.message || "Não foi possível cadastrar a filial."}`);
        return;
      }
    }

    setBranchName("");
    setBranchCode("");
    setBranchLocation("");
    setBranchTel("");
    setIsBranchCodeManual(false);
    setEditingBranchId(null);
    setShowAddBranch(false);
  };

  const handleDirectTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfSource || !trfDest || !trfProd || !trfQty) {
      triggerToast("Erro: Selecione todos os campos para a transferência.");
      return;
    }
    const qtyNum = parseInt(trfQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      triggerToast("Erro: Forneça uma quantidade positiva.");
      return;
    }
    try {
      store.transferStock(trfSource, trfDest, trfProd, qtyNum, currentUser?.name || "Admin");
      triggerToast("Transferência de estoque realizada com sucesso!");
      setTrfProd("");
      setTrfQty("");
    } catch (err: any) {
      triggerToast(`Erro: ${err.message || "Falha na transferência."}`);
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqSource || !reqProd || !reqQty) {
      triggerToast("Erro: Selecione todos os campos para a solicitação.");
      return;
    }
    const qtyNum = parseInt(reqQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      triggerToast("Erro: Forneça uma quantidade positiva.");
      return;
    }
    try {
      store.addStockRequest(reqSource, store.getActiveStoreId(), reqProd, qtyNum, currentUser?.name || "Operador");
      triggerToast("Solicitação de estoque enviada com sucesso!");
      setReqProd("");
      setReqQty("");
    } catch (err: any) {
      triggerToast(`Erro: ${err.message || "Falha ao solicitar estoque."}`);
    }
  };

  const handleApproveRequest = (id: string) => {
    try {
      store.approveStockRequest(id, currentUser?.name || "Admin");
      triggerToast("Solicitação aprovada e estoque transferido!");
    } catch (err: any) {
      triggerToast(`Erro: ${err.message || "Erro na aprovação."}`);
    }
  };

  const handleRejectRequest = (id: string) => {
    try {
      store.rejectStockRequest(id, currentUser?.name || "Admin");
      triggerToast("Solicitação de transferência rejeitada.");
    } catch (err: any) {
      triggerToast(`Erro: ${err.message || "Erro ao rejeitar."}`);
    }
  };

  const handleToggleUserActivation = (userId: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      triggerToast("Erro: Não pode desactivar ou bloquear a sua própria conta ativa em sessão.");
      return;
    }

    const action = currentStatus ? "suspenso / bloqueado" : "ativado";
    store.updateUser(userId, { active: !currentStatus });
    triggerToast(`Utilizador ${action} com sucesso!`);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      triggerToast("Erro: Não pode eliminar a sua própria conta ativa em sessão.");
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    const name = targetUser ? targetUser.name : "Colaborador";
    const confirmDelete = window.confirm(
      `Tem a certeza absoluta de que deseja ELIMINAR DEFINITIVAMENTE o utilizador "${name}"? Esta ação removerá totalmente as suas credenciais de acesso de forma irreversível.`
    );
    if (confirmDelete) {
      store.deleteUser(userId);
      triggerToast(`Utilizador "${name}" eliminado com sucesso!`);
    }
  };

  const handleResetDatabase = () => {
    if (
      window.confirm(
        "Tem a certeza que deseja REINICIAR a base de dados comercial? Toda a facturação recente, stocks e moras de clientes serão submetidos às credenciais padrão."
      )
    ) {
      store.resetToDefault();
      triggerToast("Base de dados restaurada com os valores padrão!");
      
      // Resync form local fields
      const fresh = store.getSettings();
      setCName(fresh.companyName);
      setCNif(fresh.companyNif);
      setCPhone(fresh.companyPhone);
      setCEmail(fresh.companyEmail);
      setCAddress(fresh.companyAddress);
      setCIban(fresh.companyIban || "");
      setCTaxRate(String(fresh.taxRate));
      setCRegime(fresh.regime);
      setCFormat(fresh.printFormat);
      setCLogoId(fresh.companyLogoId || "preset-basket");
      setCCustomLogoUrl(fresh.customLogoUrl || "");
      setNetMode(fresh.networkMode || "standalone");
      setNetIp(fresh.networkIp || "192.168.1.105");
      setNetPort(fresh.networkPort || "3000");
      setPType(fresh.printerType || "system");
      setPConn(fresh.printerConnection || "usb");
      setPIp(fresh.printerIp || "192.168.1.250");
      setPPort(fresh.printerPort || "9100");
      setPWidth(fresh.printerPaperWidth || "80");
    }
  };

  return (
    <div id="settings-manager-view" className="space-y-6 font-sans">
      {toast && (
        <div className="fixed top-8 right-8 z-55 bg-zinc-900 border border-amber-500 text-amber-300 text-xs px-4 py-3 rounded-xl shadow-2xl font-bold">
          {toast}
        </div>
      )}

      {/* Settings Sections bento grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Company Settings Board */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-amber-500" />
            Perfil da Empresa & Facturação Legal
          </h3>

          <form onSubmit={handleSaveCompanySettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Denominação Comercial / Nome Legal *</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white uppercase focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">NIF da Empresa (AGT) *</label>
                <input
                  type="text"
                  required
                  value={cNif}
                  onChange={(e) => setCNif(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Telemóvel Comercial *</label>
                <input
                  type="text"
                  required
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Endereço Físico Principal *</label>
              <input
                type="text"
                required
                value={cAddress}
                onChange={(e) => setCAddress(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-805 pt-4 mt-2">
              <div className="sm:col-span-2">
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">IBAN para Facturas Coordenadas</label>
                <input
                  type="text"
                  value={cIban}
                  onChange={(e) => setCIban(e.target.value)}
                  placeholder="Ex: AO06 0040 ..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Taxa Padrão IVA (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={cTaxRate}
                  onChange={(e) => setCTaxRate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Enquadramento / Regime Fiscal</label>
                <select
                  value={cRegime}
                  onChange={(e) => setCRegime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Regime Geral de IVA (14%)">Regime Geral de IVA (14%)</option>
                  <option value="Regime de Simplificação de IVA (14%)">Regime de Simplificação de IVA (14%)</option>
                  <option value="Isento de IVA nos termos do artigo 12º">Regime de Isenção (Artigo 12º)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Layout de Impressão Padrão</label>
                <select
                  value={cFormat}
                  onChange={(e) => setCFormat(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:ring-1 focus:ring-amber-505"
                >
                  <option value="thermal">Talão Térmico de Caixa (80mm)</option>
                  <option value="a4">Folha Completa de Factura (A4)</option>
                </select>
              </div>
            </div>

            {/* Secção do Logótipo da Empresa */}
            <div className="border-t border-zinc-800/80 pt-4 mt-2 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Logótipo da Empresa</h4>
                <p className="text-[11px] text-zinc-500">Escolha um dos logótipos pré-definidos ou carregue a imagem da sua empresa para aparecer nas faturas (formatos PNG, JPG, recomendável proporção quadrada).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Seleção de Pré-definições */}
                <div className="space-y-2">
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Selecione o Modelo ou Personalizado</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "preset-basket", label: "Cesta de Vendas" },
                      { id: "preset-palma", label: "Palmeira" },
                      { id: "preset-shield", label: "Escudo Fiscal" },
                      { id: "preset-modern", label: "Moderno" },
                      { id: "custom", label: "Personalizado" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCLogoId(item.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition text-xs flex items-center gap-2 cursor-pointer ${
                          cLogoId === item.id
                            ? "bg-amber-400/5 border-amber-400 text-white"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="w-5 h-5 flex items-center justify-center shrink-0 bg-zinc-900 border border-zinc-850 p-0.5 rounded">
                          <CompanyLogo logoId={item.id} customUrl={cCustomLogoUrl || undefined} className="w-4 h-4 rounded-sm" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Section / Preview */}
                <div className="space-y-2">
                  {cLogoId === "custom" ? (
                    <div className="space-y-2">
                      <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Carregar Imagem Logótipo</label>
                      
                      {cCustomLogoUrl ? (
                        <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
                          <div className="w-16 h-16 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0 border border-zinc-800 overflow-hidden">
                            <img src={cCustomLogoUrl} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-bold text-white truncate">Logótipo Customizado</span>
                            <span className="block text-[10px] text-zinc-500 font-medium">Imagem ativa para faturas</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCCustomLogoUrl("");
                                setCLogoId("preset-basket"); // Voltar ao padrão
                              }}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold mt-1 block hover:underline cursor-pointer"
                            >
                              Remover Imagem
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const file = e.dataTransfer.files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setCCustomLogoUrl(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="border-2 border-dashed border-zinc-800 hover:border-amber-400/50 bg-zinc-950 hover:bg-zinc-950/80 transition rounded-xl p-4 text-center cursor-pointer relative min-h-[90px] flex flex-col items-center justify-center"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setCCustomLogoUrl(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Upload className="w-5 h-5 text-zinc-500 mb-1 animate-pulse" />
                          <span className="block text-xs font-bold text-zinc-300">Arraste ou clique para carregar</span>
                          <span className="block text-[10px] text-zinc-500 mt-0.5">PNG, JPG de preferência quadrado</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center h-full text-center py-5 min-h-[90px]">
                      <CompanyLogo logoId={cLogoId} className="w-8 h-8 mb-1.5" />
                      <span className="text-xs text-zinc-400 font-bold">Pré-visualização do Modelo Ativo</span>
                      <span className="text-[10px] text-zinc-550">Aplicado automaticamente no layout selecionado.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Configuração de Operação em Rede Local */}
            <div className="border-t border-zinc-800/80 pt-5 mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-400/10 text-amber-400 rounded-lg">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Operabilidade em Rede (Sincronização Multi-Dispositivo)</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Prepare este terminal para partilhar faturas e stocks em tempo real com outros computadores, tablets ou telemóveis do estabelecimento.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Modo de Operação</label>
                  <select
                    value={netMode}
                    onChange={(e) => setNetMode(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="standalone">Caixa Monoterminal (Autónomo)</option>
                    <option value="server">Servidor Principal (Host de Base de Dados)</option>
                    <option value="node">Terminal de Apoio (Cliente de Rede)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Endereço IP do Host / Terminal</label>
                  <input
                    type="text"
                    required={netMode !== "standalone"}
                    disabled={netMode === "standalone"}
                    value={netIp}
                    onChange={(e) => setNetIp(e.target.value)}
                    placeholder="Ex: 192.168.1.100"
                    className="w-full bg-zinc-950 disabled:bg-zinc-900disabled:text-zinc-600 border border-zinc-800 disabled:border-zinc-850 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Porta de Comunicação</label>
                  <input
                    type="text"
                    required={netMode !== "standalone"}
                    disabled={netMode === "standalone"}
                    value={netPort}
                    onChange={(e) => setNetPort(e.target.value)}
                    placeholder="3000"
                    className="w-full bg-zinc-950 disabled:bg-zinc-900 disabled:text-zinc-600 border border-zinc-800 disabled:border-zinc-850 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {netMode !== "standalone" && (
                <div className="bg-zinc-950 border border-zinc-800/80 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {netMode === "server" ? "Servidor de Sincronização Ativo" : "Ligação de Terminal Autenticado"}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">Status: Prontificado</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    {netMode === "server" ? (
                      <>
                        Outros operadores e caixas podem conetar-se a este computador usando o endereço de rede: <strong className="text-amber-300 font-mono">http://{netIp}:{netPort}</strong>. Toda a faturação, créditos fiados e fluxos de caixa serão integrados instantaneamente num só concentrador central corporativo da Kitanda.
                      </>
                    ) : (
                      <>
                        Este terminal de vendas está configurado para ler e gravar dados em tempo real no servidor master localizado na rede local em <strong className="text-amber-300 font-mono">http://{netIp}:{netPort}</strong>. Desempenho e fiabilidade de resposta otimizados por WebSocket POS Bridge.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Configuração de Impressoras Gerais */}
            <div className="border-t border-zinc-800/80 pt-5 mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-400/10 text-amber-400 rounded-lg">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Configuração de Impressoras (Aceita Todos os Modelos)</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Configure qualquer tipo de impressora conectada ao sistema (Térmicas POS de 80mm e 58mm, jato de tinta, laser de escritório, Bluetooth ou rede).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Controlador */}
                <div className="space-y-1.5">
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Controlador de Hardware / Driver</label>
                  <select
                    value={pType}
                    onChange={(e) => setPType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="system">Spooler do Sistema (PDF / Diálogo de Impressão Padrão)</option>
                    <option value="escpos">Protocolo Raw ESC/POS (Envio Direto à Impressora Térmica)</option>
                  </select>
                </div>

                {/* Interface / Conexão */}
                <div className="space-y-1.5">
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Meio de Conexão Física</label>
                  <select
                    value={pConn}
                    onChange={(e) => setPConn(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="usb">USB local (Filtro Virtual / Spool Nativo)</option>
                    <option value="network">Impressora de Rede (Cabo Ethernet / Endereço IP)</option>
                    <option value="bluetooth">Tecnologia Bluetooth (Portátil / BLE Móvel)</option>
                    <option value="serial">Ligação de Porta de Série / COM (RS-232 / DB9 Legacy)</option>
                  </select>
                </div>
              </div>

              {pConn === "network" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Endereço IP da Impressora de Rede</label>
                    <input
                      type="text"
                      value={pIp}
                      onChange={(e) => setPIp(e.target.value)}
                      placeholder="Ex: 192.168.1.251"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Porta TCP da Impressora (RAW)</label>
                    <input
                      type="text"
                      value={pPort}
                      onChange={(e) => setPPort(e.target.value)}
                      placeholder="9100"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {pConn === "bluetooth" && (
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="block font-bold text-white">Dispositivo Bluetooth Emulado</span>
                    <span className="block text-[10px] text-zinc-500">Impressora portátil configurável para emissão ambulante</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerToast("Procura de impressoras térmicas Bluetooth iniciada...")}
                    className="py-1 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-extrabold text-amber-300 rounded-lg uppercase tracking-wider shrink-0 cursor-pointer"
                  >
                    Procurar / Emparelhar
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Largura da fita térmica */}
                <div className="space-y-1.5">
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Largura do Papel de Impressão</label>
                  <select
                    value={pWidth}
                    onChange={(e) => setPWidth(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="80">Padrão Supermercado (Fita Larga de 80mm)</option>
                    <option value="58">Padrão Portátil / Retalho (Fita Estreita de 58mm)</option>
                    <option value="a4">Escritório Tradicional (Folha Completa A4 / Carta)</option>
                  </select>
                </div>

                <div className="flex items-end h-full">
                  <button
                    type="button"
                    onClick={() => triggerToast("Teste de Impressão enviado com êxito! Foi emitido um talão de teste no equipamento.")}
                    className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-400/20 text-zinc-300 hover:text-white font-extrabold text-xs rounded-xl uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-amber-400 animate-pulse" /> Emitir Teste de Conexão (.ESC)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-805">
              <button
                type="submit"
                className="py-2.5 px-5 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-400/10 transition"
              >
                Gravar Configuração
              </button>
            </div>
          </form>
        </div>

        {/* Database Sync status & system tools */}
        <div className="space-y-6">
          {/* Licenciamento & Renovação de Licença Board */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400 animate-pulse" />
              Licenciamento e Renovação
            </h3>

            <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-semibold font-sans">Estado da Licença:</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                  settings.licenseStatus === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                }`}>
                  {settings.licenseStatus === "active" ? "ATIVA DE ASSINATURA" : "VENCIDO / INATIVO"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-900 pt-2">
                <span className="text-zinc-500">Modalidade:</span>
                <span className="text-zinc-300 font-bold uppercase">
                  {settings.licenseType === "teste" ? "Teste Grátis (30 Dias)" : (settings.licenseType || "MENSAL")}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-900 pt-2">
                <span className="text-zinc-500">Data de Expiração:</span>
                <span className="text-zinc-300 font-mono font-bold">
                  {settings.licenseExpiry ? new Date(settings.licenseExpiry).toLocaleDateString("pt-AO") : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-900 pt-2">
                <span className="text-zinc-500">Chave de Série:</span>
                <span className="text-zinc-400 font-mono truncate max-w-[140px]" title={settings.licenseKey}>
                  {settings.licenseKey}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowRenewModal(true);
                  setRenewStep(1);
                }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-400/5 transition text-center uppercase cursor-pointer"
              >
                Renovar / Prorrogar Licença
              </button>

              <button
                type="button"
                onClick={() => {
                  const start = new Date();
                  const baseDate = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
                  const nextExpiryStr = baseDate.toISOString().split("T")[0];

                  store.updateSettings({
                    licenseStatus: "active",
                    licenseExpiry: nextExpiryStr,
                    licenseType: "teste",
                    licenseKey: `KY-TESTE-${Math.floor(100000 + Math.random() * 900000)}-FREE`,
                  });
                  triggerToast("Licença de Teste Grátis (30 Dias) Activada!");
                }}
                className="w-full py-2 px-5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-805 hover:border-amber-400/25 text-amber-300 font-extrabold text-xs rounded-xl shadow transition text-center uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4 text-amber-400 animate-pulse" /> Iniciar Teste Grátis (30 Dias)
              </button>
            </div>
          </div>

          {/* Cloud representation status */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-500" />
              Estado da Sincronização
            </h3>

            {/* Simulated Firebase sync indicator */}
            <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs text-[11px] font-semibold">Motor de Armazenamento:</span>
                <span className="text-[10px] bg-emerald-400/10 text-emerald-400 font-black px-2 py-0.5 rounded-md border border-emerald-800/10 uppercase">
                  Firebase/Local
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-900 pt-2 text-[11px]">
                <span className="text-zinc-500">Última Cópia de Segurança:</span>
                <span className="text-zinc-300 font-mono">Em tempo real (Automático)</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                id="reset-db-btn"
                onClick={handleResetDatabase}
                className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700/60 border border-zinc-700 hover:text-white text-zinc-350 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-zinc-500" /> Reiniciar Base de Dados
              </button>
            </div>
          </div>

          {/* Gestão de Filiais (Lojas) - Único NIF */}
          <div id="branches-manager-card" className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                Filiais & Armazéns (Único NIF)
              </h3>
              {!showAddBranch && (
                <button
                  onClick={() => setShowAddBranch(true)}
                  className="text-xs text-amber-400 font-semibold hover:underline"
                >
                  + Criar Filial
                </button>
              )}
            </div>

            {showAddBranch && (
              <form onSubmit={handleAddNewBranch} className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl space-y-3">
                <span className="block font-bold text-white text-[10px] uppercase tracking-wider">
                  {editingBranchId ? "Editar Filial / Loja" : "Nova Filial / Loja"}
                </span>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nome da Filial (Ex: Kitanda Morro Bento)"
                    value={branchName}
                    onChange={(e) => handleBranchNameChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white rounded-lg placeholder-zinc-700"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Código Único (Ex: LOJA-C)"
                    value={branchCode}
                    onChange={(e) => {
                      setBranchCode(e.target.value);
                      setIsBranchCodeManual(true);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white rounded-lg placeholder-zinc-700 font-mono tracking-wider uppercase"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Localização / Endereço"
                    value={branchLocation}
                    onChange={(e) => setBranchLocation(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white rounded-lg placeholder-zinc-700"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Telefone de Contacto"
                    value={branchTel}
                    onChange={(e) => setBranchTel(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white rounded-lg placeholder-zinc-700"
                  />
                </div>
                <div className="flex justify-end gap-1.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBranchName("");
                      setBranchCode("");
                      setBranchLocation("");
                      setBranchTel("");
                      setIsBranchCodeManual(false);
                      setEditingBranchId(null);
                      setShowAddBranch(false);
                    }}
                    className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] rounded text-zinc-450"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-1 px-3.5 bg-amber-400 hover:bg-amber-500 font-extrabold text-[10px] rounded text-black shadow-lg"
                  >
                    {editingBranchId ? "Gravar Alterações" : "Cadastrar Filial"}
                  </button>
                </div>
              </form>
            )}

            {/* List existing branches with physical details */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {branches.map((b) => (
                <div key={b.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-xs">{b.name}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingBranchId(b.id);
                          setBranchName(b.name);
                          setBranchCode(b.code);
                          setBranchLocation(b.location || "");
                          setBranchTel(b.tel || "");
                          setIsBranchCodeManual(true);
                          setShowAddBranch(true);
                        }}
                        className="text-[9px] bg-zinc-900 hover:bg-zinc-805 text-zinc-400 hover:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-zinc-800 transition flex items-center gap-1"
                      >
                        <Edit className="w-2.5 h-2.5" /> Editar
                      </button>
                      <span className="bg-amber-400/10 text-amber-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-amber-400/20">
                        {b.code}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-450 space-y-0.5">
                    <p>📍 Endereço: <span className="text-zinc-300 font-medium">{b.location}</span></p>
                    <p>📞 Contacto: <span className="text-zinc-300 font-medium">{b.tel}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inter-branch stocks transfers & request administration */}
          <div id="stock-transfers-card" className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                Intercâmbio de Estoque
              </h3>
              <span className="text-[10px] bg-amber-400/10 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-400/20 uppercase">
                {currentUser?.role === "admin" ? "Soberano Admin" : "Gerente Local"}
              </span>
            </div>

            {/* DIRECT STOCK TRANSFERS - Admin Only */}
            {currentUser?.role === "admin" ? (
              <form onSubmit={handleDirectTransfer} className="space-y-3 bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
                <span className="block font-extrabold text-white text-[10px] uppercase tracking-wider">
                  ⚡ Transferência Direta (Admin)
                </span>
                <p className="text-zinc-550 text-[10px] leading-snug">
                  Mova instantaneamente o estoque de um produto entre duas filiais autorizadas.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-zinc-400 font-bold uppercase mb-1">Origem</label>
                    <select
                      value={trfSource}
                      required
                      onChange={(e) => {
                        setTrfSource(e.target.value);
                        setTrfProd("");
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50"
                    >
                      <option value="">Selecione...</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-400 font-bold uppercase mb-1">Destino</label>
                    <select
                      value={trfDest}
                      required
                      onChange={(e) => setTrfDest(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50"
                    >
                      <option value="">Selecione...</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {trfSource && (
                  <div>
                    <label className="block text-[9px] text-zinc-400 font-bold uppercase mb-1">Produto da Origem</label>
                    <select
                      value={trfProd}
                      required
                      onChange={(e) => setTrfProd(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50"
                    >
                      <option value="">Selecione o produto...</option>
                      {products
                        .filter(p => p.storeId === trfSource && p.type !== "servico")
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.code}] - Atual: {p.stock} {p.unit}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] text-zinc-400 font-bold uppercase mb-1">Quantidade a Transferir</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ex: 10"
                    value={trfQty}
                    onChange={(e) => setTrfQty(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black font-extrabold py-2 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                >
                  Transferir Estoque
                </button>
              </form>
            ) : null}

            {/* REQUEST STOCK - Managers / Operators */}
            <form onSubmit={handleCreateRequest} className="space-y-3 bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
              <span className="block font-extrabold text-amber-400 text-[10px] uppercase tracking-wider">
                📥 Solicitar Estoque de Outra Loja
              </span>
              <p className="text-zinc-550 text-[10px] leading-snug">
                Solicite produtos em falta para abastecer a sua loja ativa atual (<b>{branches.find(b => b.id === store.getActiveStoreId())?.name || store.getActiveStoreId()}</b>).
              </p>

              <div>
                <label className="block text-[9px] text-zinc-400 font-bold uppercase mb-1">Loja Cedente (Origem)</label>
                <select
                  value={reqSource}
                  required
                  onChange={(e) => {
                    setReqSource(e.target.value);
                    setReqProd("");
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50"
                >
                  <option value="">Selecione a loja...</option>
                  {branches.filter(b => b.id !== store.getActiveStoreId()).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {reqSource && (
                <div>
                  <label className="block text-[9px] text-zinc-400 font-bold uppercase mb-1">Selecione o Artigo</label>
                  <select
                    value={reqProd}
                    required
                    onChange={(e) => setReqProd(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50"
                  >
                    <option value="">Selecione o artigo...</option>
                    {products
                      .filter(p => p.storeId === reqSource && p.type !== "servico")
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.code}] - Estoque: {p.stock}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[9px] text-zinc-400 font-bold uppercase mb-1">Quantidade Necessária</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Ex: 5"
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-white font-extrabold py-2 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
              >
                Solicitar Transferência
              </button>
            </form>

            {/* STOCK REQUESTS DASHBOARD */}
            <div className="space-y-2.5">
              <span className="block font-bold text-white text-[10px] uppercase tracking-wider">
                📋 Pedidos de Transferência da Empresa
              </span>

              {stockRequests.length === 0 ? (
                <p className="text-zinc-650 text-[10px] italic">Sem pedidos de transferência registados de momento.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {stockRequests.map((req) => {
                    const fromBranch = branches.find(b => b.id === req.sourceStoreId)?.name || req.sourceStoreId;
                    const toBranch = branches.find(b => b.id === req.destinationStoreId)?.name || req.destinationStoreId;
                    
                    return (
                      <div key={req.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-[11px] space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-white uppercase">{req.productName} ({req.quantity})</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            req.status === "pendente" ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                            req.status === "aprovada" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" :
                            "bg-red-500/10 text-red-500 border border-red-500/15"
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        
                        <div className="text-zinc-500 text-[10px] space-y-0.5">
                          <p>📍 De: <span className="text-zinc-350">{fromBranch}</span></p>
                          <p>📍 Para: <span className="text-zinc-350">{toBranch}</span></p>
                          <p>👤 Pedido por: <span className="text-zinc-400">{req.requestedBy}</span></p>
                          {req.approvedBy && (
                            <p>👤 Decidido por: <span className="text-zinc-400">{req.approvedBy}</span></p>
                          )}
                        </div>

                        {req.status === "pendente" && currentUser?.role === "admin" && (
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleApproveRequest(req.id)}
                              className="flex-1 py-1 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[9px] rounded uppercase transition cursor-pointer"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-350 font-extrabold text-[9px] rounded uppercase transition cursor-pointer"
                            >
                              Rejeitar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* System users manager sidebar box */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Operadores & Staff
              </h3>
              {!showAddUser && (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="text-xs text-amber-400 font-semibold hover:underline"
                >
                  + Criar
                </button>
              )}
            </div>

            {showAddUser && (
              <form onSubmit={handleAddNewUser} className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl space-y-3">
                <span className="block font-bold text-white text-[10px] uppercase tracking-wider">
                  {editingUserId ? "Editar Colaborador" : "Novo Colaborador"}
                </span>
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome Completo"
                    value={uName}
                    onChange={(e) => setUName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white rounded-lg placeholder-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-1">E-mail de Login</label>
                  <input
                    type="email"
                    required
                    placeholder="E-mail de Login"
                    value={uEmail}
                    onChange={(e) => setUEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white rounded-lg placeholder-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-1">Nome de Utilizador</label>
                  <input
                    type="text"
                    required
                    placeholder="nome_de_utilizador"
                    value={uUsername}
                    onChange={(e) => setUUsername(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white rounded-lg placeholder-zinc-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-1">Palavra-passe</label>
                  <input
                    type="password"
                    required
                    placeholder="Senha de acesso"
                    value={uPassword}
                    onChange={(e) => setUPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white rounded-lg placeholder-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-1">Nível de Acesso</label>
                  <select
                    value={uRole}
                    onChange={(e) => setURole(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-850 p-2 text-xs text-white rounded-lg"
                  >
                    <option value="operador_vendas">Gestor de Vendas (Operador)</option>
                    <option value="gerente_loja">Gerente de Loja</option>
                    <option value="gestor_principal">Gestor Principal (Soberano)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-1">Filial Principal (Lotação)</label>
                  <select
                    value={uStoreId}
                    onChange={(e) => setUStoreId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 p-2 text-xs text-white rounded-lg"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        📍 {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-1.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUName("");
                      setUEmail("");
                      setUUsername("");
                      setUPassword("");
                      setURole("operador_vendas");
                      setEditingUserId(null);
                      setShowAddUser(false);
                    }}
                    className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] rounded text-zinc-450"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-1 px-3.5 bg-amber-400 hover:bg-amber-500 font-extrabold text-[10px] rounded text-black shadow-lg"
                  >
                    {editingUserId ? "Gravar Alterações" : "Criar Operador"}
                  </button>
                </div>
              </form>
            )}

            {/* List users and give trigger options to suspend or reactive & transfer stores */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {users.map((u) => {
                return (
                  <div key={u.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">{u.name}</span>
                        <span className="text-zinc-500 text-[9px] mt-0.5 block">{u.email} • {u.role.toUpperCase()}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingUserId(u.id);
                            setUName(u.name);
                            setUEmail(u.email);
                            setUUsername(u.username || "");
                            setUPassword(u.password || "");
                            setURole(u.role);
                            setUStoreId(u.storeId || "loja-a");
                            setShowAddUser(true);
                          }}
                          className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2 py-1 rounded text-[9px] font-black uppercase transition flex items-center gap-1 cursor-pointer"
                          title="Editar Utilizador"
                        >
                          <Edit className="w-2.5 h-2.5 text-zinc-400" /> Editar
                        </button>

                        <button
                          onClick={() => handleToggleUserActivation(u.id, u.active)}
                          className={`px-2 py-1 rounded text-[9px] font-black uppercase transition flex items-center gap-1 cursor-pointer ${
                            u.active
                              ? "bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-550/10"
                              : "bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-555/10"
                          }`}
                          title={u.active ? "Bloquear / Suspender" : "Desbloquear / Ativar"}
                          disabled={u.id === currentUser?.id}
                        >
                          {u.active ? (
                            <>
                              <Lock className="w-2.5 h-2.5 shrink-0" /> Bloquear
                            </>
                          ) : (
                            <>
                              <Unlock className="w-2.5 h-2.5 shrink-0" /> Ativar
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 px-2 py-1 rounded text-[9px] font-black uppercase transition flex items-center gap-1 cursor-pointer disabled:opacity-20"
                          title="Eliminar Utilizador"
                          disabled={u.id === currentUser?.id}
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Store Branch Transfer assignment dropdown */}
                    <div className="pt-2 border-t border-zinc-900/40 flex items-center justify-between gap-1">
                      <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">📍 Filial:</span>
                      <select
                        value={u.storeId || "loja-a"}
                        onChange={(e) => {
                          try {
                            store.transferUser(u.id, e.target.value, currentUser?.name || "Admin");
                            triggerToast(`Utilizador ${u.name} transferido para a filial ${branches.find(b => b.id === e.target.value)?.name}!`);
                          } catch (err: any) {
                            triggerToast(`Erro: ${err.message || "Não foi possível transferir o utilizador."}`);
                          }
                        }}
                        className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none focus:border-amber-400/50 cursor-pointer max-w-[155px] truncate"
                      >
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SaaS Admin Section - displayed ONLY inside the central 'kitanda-yetu' tenant for sovereign management */}
      {store.getActiveTenantId() === "kitanda-yetu" && (currentUser?.role === "gestor_principal" || currentUser?.role === "admin") && (
        <div id="saas-corporate-admin" className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10 space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-805 pb-4 gap-2">
            <div>
              <h3 className="text-base font-black text-white tracking-widest uppercase flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500 animate-pulse-subtle" />
                Área Administrativa SaaS (Soberano)
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">Gestão central de empresas parceiras, assinaturas e lixeira de recuperação de 6 meses.</p>
            </div>
            <div className="text-[10px] bg-amber-400/10 border border-amber-500/25 text-amber-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Sovereign Console Activo
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Column 1: Active SaaS Corporate Tenants List */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  📁 Empresas Activas no Ecossistema ({saasTenants.length})
                </h4>
              </div>

              <div className="space-y-3.5">
                {saasTenants.map((tenant) => {
                  return (
                    <div key={tenant.id} className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-zinc-800">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-white text-sm font-bold">{tenant.name}</strong>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            tenant.planType === "enterprise"
                              ? "bg-purple-500/15 text-purple-400 border border-purple-500/10"
                              : tenant.planType === "profissional"
                                ? "bg-amber-400/10 text-amber-400 border border-amber-400/10"
                                : "bg-blue-500/15 text-blue-400 border border-blue-500/10"
                          }`}>
                            Plano {tenant.planType}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            tenant.status === "blocked"
                              ? "bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                          }`}>
                            {tenant.status === "blocked" ? "🚨 BLOQUEADA" : "🟢 ATIVA"}
                          </span>
                          <span className="text-[9px] bg-zinc-850 text-zinc-400 font-mono px-1.5 py-0.5 rounded">
                            ID: {tenant.id}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-mono">
                          <p>NIF: <span className="text-zinc-300">{tenant.nif}</span></p>
                          <p>E-mail: <span className="text-zinc-300">{tenant.email}</span></p>
                          <p>Contacto: <span className="text-zinc-300">{tenant.phone}</span></p>
                          <p>Mensalidade: <span className="text-amber-400 font-semibold">{tenant.monthlyFee?.toLocaleString()} KZ</span></p>
                          <p className="sm:col-span-2 text-zinc-450 font-sans mt-0.5">
                            📍 Endereço: <span className="text-zinc-300">{tenant.address}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right action buttons to block and delete */}
                      <div className="flex gap-2 self-end md:self-auto">
                        <button
                          onClick={() => {
                            if (tenant.id === "kitanda-yetu") {
                              triggerToast("Não é possível bloquear a empresa de controle soberano.");
                              return;
                            }
                            store.toggleBlockTenant(tenant.id);
                            triggerToast(
                              tenant.status === "blocked"
                                ? `Empresa "${tenant.name}" reativada com sucesso!`
                                : `Empresa "${tenant.name}" suspensa / bloqueada com sucesso!`
                            );
                          }}
                          disabled={tenant.id === "kitanda-yetu"}
                          className={`py-1.5 px-3 border text-[10px] font-extrabold uppercase rounded-lg transition disabled:opacity-30 cursor-pointer ${
                            tenant.status === "blocked"
                              ? "bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/10 hover:bg-amber-500 hover:text-white border-amber-500/20 text-amber-400"
                          }`}
                        >
                          {tenant.status === "blocked" ? "Desbloquear" : "Bloquear"}
                        </button>

                        <button
                          onClick={() => {
                            if (tenant.id === "kitanda-yetu") {
                              triggerToast("Não é possível apagar a empresa de controle soberano.");
                              return;
                            }
                            const confirmDelete = window.confirm(`Tem a certeza absoluta que deseja apagar a empresa "${tenant.name}"? Ela será enviada para a lixeira por 6 meses.`);
                            if (confirmDelete) {
                              store.deleteTenant(tenant.id);
                              triggerToast(`Empresa "${tenant.name}" apagada com sucesso! Guardada na lixeira.`);
                            }
                          }}
                          disabled={tenant.id === "kitanda-yetu"}
                          className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-550 text-[10px] font-extrabold uppercase rounded-lg transition disabled:opacity-30 disabled:hover:bg-red-500/10 disabled:hover:text-red-450 cursor-pointer"
                        >
                          Apagar
                        </button>
                      </div>
                    </div>
                  );
                })}

                {saasTenants.length === 0 && (
                  <div className="bg-zinc-950 p-6 border border-zinc-855 rounded-2xl text-center text-zinc-500 text-xs font-mono">
                    Sem empresas activas no sistema.
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Trash Bin (Lixeira com prazo de 6 meses) */}
            <div className="space-y-4 font-sans">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                🗑/ Lixeira de Recuperação (6 Meses) ({deletedTenants.length})
              </h4>

              <div className="space-y-3">
                {deletedTenants.map((tenant) => {
                  const deletedDate = tenant.deletedAt ? new Date(tenant.deletedAt) : new Date();
                  const expireDate = new Date(deletedDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
                  const daysLeft = Math.ceil((expireDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

                  return (
                    <div key={tenant.id} className="bg-zinc-950 border border-zinc-850/60 p-4 rounded-2xl space-y-3">
                      <div>
                        <strong className="text-white text-xs block truncate pr-1">{tenant.name}</strong>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-bold mt-1.5 w-fit">
                          <span>⏳ Restam aprox. {daysLeft} dias para sumir</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-550 space-y-1 font-mono leading-relaxed">
                        <p>NIF: {tenant.nif}</p>
                        <p>Apagada em: {deletedDate.toLocaleDateString("pt-AO")}</p>
                        <p className="text-[9px] text-zinc-650">Deleção definitiva em: {expireDate.toLocaleDateString("pt-AO")}</p>
                      </div>

                      <button
                        onClick={() => {
                          store.recoverTenant(tenant.id);
                          triggerToast(`Empresa "${tenant.name}" recuperada com sucesso!`);
                        }}
                        className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 text-[10px] font-black uppercase rounded-lg transition cursor-pointer"
                      >
                        Recuperar Empresa
                      </button>
                    </div>
                  );
                })}

                {deletedTenants.length === 0 && (
                  <div className="bg-zinc-950 p-6 border border-zinc-850/65 rounded-2xl text-center text-zinc-600 text-xs font-mono">
                    Lixeira vazia. Nenhuma empresa eliminada recentemente.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* License Renewal Modal Simulator overlay */}
      {showRenewModal && (
        <div id="renew-license-modal-overlay" className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl max-w-md w-full p-6 space-y-4 text-left shadow-2xl animate-fadeIn">
            <div className="text-center">
              <span className="text-[9px] bg-amber-400/10 text-amber-300 border border-amber-500/25 font-black px-2 py-0.5 rounded tracking-widest uppercase inline-block">
                EMIS Multicaixa Express
              </span>
              <h3 className="text-base font-bold text-white mt-1">Prorrogar Licença de Software</h3>
              <p className="text-zinc-400 text-[11px] mt-0.5">Renove sua assinatura para manter a sincronização com a AGT ativa.</p>
            </div>

            {!isRenewing ? (
              <form onSubmit={handleRenewLicenseSubmit} className="space-y-4">
                {/* Modality selectors */}
                <div className="space-y-2">
                  <label className="block text-zinc-500 text-[10px] font-black uppercase tracking-wider">Selecione o Plano Comercial Ilimitado</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan("mensal")}
                      className={`p-3 rounded-xl border text-left transition text-xs cursor-pointer ${
                        selectedPlan === "mensal"
                          ? "bg-amber-400/5 border-amber-400 text-white"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <strong className="block font-bold">Licença de 1 Mês (Ilimitado)</strong>
                          <span className="text-[9px] text-zinc-400">Totalmente livre de limites • 30 dias ativos</span>
                        </div>
                        <span className="font-mono text-amber-400 font-bold">7.500 kz</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan("semestral")}
                      className={`p-3 rounded-xl border text-left transition text-xs cursor-pointer ${
                        selectedPlan === "semestral"
                          ? "bg-amber-400/5 border-amber-400 text-white"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <strong className="block font-bold">Licença de 6 Mês (Ilimitado)</strong>
                          <span className="text-[9px] text-zinc-400">Totalmente livre de limites • 180 dias ativos</span>
                        </div>
                        <span className="font-mono text-amber-400 font-bold">35.000 kz</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan("anual")}
                      className={`p-3 rounded-xl border text-left transition text-xs cursor-pointer ${
                        selectedPlan === "anual"
                          ? "bg-amber-400/5 border-amber-400 text-white"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <strong className="block font-bold">Licença Anual (Ilimitado)</strong>
                          <span className="text-[9px] text-zinc-400">Melhor custo-benefício • 365 dias ativos</span>
                        </div>
                        <span className="font-mono text-amber-400 font-bold">65.000 kz</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* MCX Phone */}
                <div>
                  <label className="block text-zinc-500 text-[10px] font-black uppercase tracking-wider mb-1">Telemóvel MCX Express (Angola) *</label>
                  <input
                    type="tel"
                    required
                    value={renewPhone}
                    onChange={(e) => setRenewPhone(e.target.value)}
                    placeholder="Ex: 923 111 222"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRenewModal(false)}
                    className="py-2 px-4 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-zinc-300 rounded-xl cursor-pointer"
                  >
                    Recuar
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-amber-400 hover:bg-amber-500 font-extrabold text-black text-xs rounded-xl shadow cursor-pointer"
                  >
                    Confirmar e Chamar Express
                  </button>
                </div>
              </form>
            ) : (
              /* Steps overlay rendering */
              <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-2xl text-center space-y-4 font-mono text-[11px]">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-amber-400/10 text-amber-400 rounded-full flex items-center justify-center animate-pulse">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                </div>

                <div className="space-y-2 text-zinc-300 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${renewStep >= 1 ? "bg-amber-400" : "bg-zinc-700"}`}></span>
                    <span className={renewStep === 1 ? "text-amber-300 font-bold" : "text-zinc-550"}>1. Contatando Rede EMIS...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${renewStep >= 2 ? "bg-amber-400 animate-pulse" : "bg-zinc-700"}`}></span>
                    <span className={renewStep === 2 ? "text-amber-300 font-bold" : "text-zinc-550"}>2. Aguardando PIN no telemóvel {renewPhone}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${renewStep >= 3 ? "bg-amber-400" : "bg-zinc-700"}`}></span>
                    <span className={renewStep === 3 ? "text-amber-400 font-bold" : "text-zinc-550"}>3. Pagamento Validado! Ativando licença...</span>
                  </div>
                </div>

                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${renewStep * 33.3}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
