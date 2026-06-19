/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { store } from "../services/store";
import { Customer, Debt } from "../types";
import EmployeeDebtsPanel from "./EmployeeDebtsPanel";
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Search,
  Receipt,
  PiggyBank,
  ArrowRight,
  TrendingUp,
  Award,
  CircleAlert,
  MessageSquare,
  Send,
  Megaphone,
  RefreshCw,
} from "lucide-react";

export default function Clients() {
  const [customers, setCustomers] = useState(() => store.getCustomers());
  const [debts, setDebts] = useState(() => store.getDebts());
  const [sales, setSales] = useState(() => store.getSales());

  // Subscribe to changes
  useMemo(() => {
    const unsubscribe = store.subscribe(() => {
      setCustomers([...store.getCustomers()]);
      setDebts([...store.getDebts()]);
      setSales([...store.getSales()]);
    });
    return () => unsubscribe();
  }, []);

  // UI States
  const [activeTab, setActiveTab] = useState<"directory" | "sms_campaign" | "employee_debts">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Marketing Bulk SMS Campaign states
  const [smsMessage, setSmsMessage] = useState(
    "Grande Promoção na Kitanda! Toda a fuba de milho de Angola com 15% de desconto imediato esta semana. Visite a sua loja de preferência ou ligue! Boas compras."
  );
  const [smsFilter, setSmsFilter] = useState<"todos" | "frequentes" | "devedores">("todos");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSendProgress, setSmsSendProgress] = useState(0);
  const [smsLogs, setSmsLogs] = useState<string[]>([]);
  
  // Create / Edit fields
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cNif, setCNif] = useState("");
  const [cNotes, setCNotes] = useState("");

  // Selected client for side view panel details
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // New debt form fields
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtAmount, setDebtAmount] = useState("");
  const [debtDesc, setDebtDesc] = useState("");

  // Amortize popup
  const [amortizeDebtId, setAmortizeDebtId] = useState<string | null>(null);
  const [amortizeAmount, setAmortizeAmount] = useState("");
  const [amortizeMethod, setAmortizeMethod] = useState<string>("dinheiro");

  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cPhone) {
      triggerToast("Preencha o nome e o telemóvel do cliente.");
      return;
    }

    const payload = {
      name: cName,
      phone: cPhone,
      email: cEmail || undefined,
      nif: cNif || undefined,
      notes: cNotes || undefined,
    };

    if (editingId) {
      store.updateCustomer(editingId, payload);
      triggerToast("Cliente atualizado com sucesso!");
    } else {
      store.addCustomer(payload);
      triggerToast("Cliente cadastrado com sucesso!");
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setCName("");
    setCPhone("");
    setCEmail("");
    setCNif("");
    setCNotes("");
  };

  const handleEditClick = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // don't open side detail card
    setEditingId(c.id);
    setCName(c.name);
    setCPhone(c.phone);
    setCEmail(c.email || "");
    setCNif(c.nif || "");
    setCNotes(c.notes || "");
    setShowAddForm(true);
  };

  // Register a new debt for the customer
  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !debtAmount || !debtDesc) return;

    const cust = customers.find((c) => c.id === selectedClientId);
    if (!cust) return;

    const amountNum = parseFloat(debtAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    store.addDebt({
      customerId: selectedClientId,
      customerName: cust.name,
      description: debtDesc,
      initialAmount: amountNum,
    });

    triggerToast("Dívida registada com sucesso!");
    setDebtAmount("");
    setDebtDesc("");
    setShowAddDebt(false);
  };

  // Process debt amortization payment
  const handleAmortizeDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amortizeDebtId || !amortizeAmount) return;

    const amtNum = parseFloat(amortizeAmount);
    if (isNaN(amtNum) || amtNum <= 0) return;

    store.amortizeDebt(amortizeDebtId, amtNum, amortizeMethod);
    triggerToast("Pagamento registado no caixa!");
    setAmortizeDebtId(null);
    setAmortizeAmount("");
  };

  const formatKwanza = (v: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
    }).format(v);
  };

  // Filter clients
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.nif && c.nif.includes(searchQuery))
      );
    });
  }, [customers, searchQuery]);

  const selectedClient = useMemo(() => {
    return customers.find((c) => c.id === selectedClientId);
  }, [customers, selectedClientId]);

  const clientDebtsList = useMemo(() => {
    if (!selectedClientId) return [];
    return debts.filter((d) => d.customerId === selectedClientId);
  }, [debts, selectedClientId]);

  const clientSalesHistory = useMemo(() => {
    if (!selectedClientId) return [];
    return sales.filter((s) => s.clientId === selectedClientId);
  }, [sales, selectedClientId]);

  // Aggregate stats
  const clientsWithDebtsCount = useMemo(() => {
    const uniqueIds = new Set(debts.filter(d => d.status === "pendente").map(d => d.customerId));
    return uniqueIds.size;
  }, [debts]);

  const handleSendBulkSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingSms) return;
    if (!smsMessage.trim()) {
      triggerToast("Erro: A mensagem promocional não pode estar vazia.");
      return;
    }

    // Determine target clients list according to filters
    let targets = [...customers];
    if (smsFilter === "frequentes") {
      targets = targets.filter((c) => c.totalPurchases >= 100000);
    } else if (smsFilter === "devedores") {
      const devedoresIds = new Set(debts.filter(d => d.status === "pendente").map(d => d.customerId).filter(Boolean));
      targets = targets.filter((c) => devedoresIds.has(c.id));
    }

    if (targets.length === 0) {
      triggerToast("Aviso: Nenhum cliente elegível com base no filtro selecionado!");
      return;
    }

    setIsSendingSms(true);
    setSmsSendProgress(0);
    const dateStr = new Date().toLocaleTimeString("pt-AO");
    setSmsLogs([
      `[CAMPAIGN CAMP_${Math.floor(100+Math.random()*900)}] Início de emissão massiva em ${dateStr}`,
      `[FILTRO SELECIONADO: ${smsFilter.toUpperCase()}] Destinatários identificados: ${targets.length}`,
      `[BROADCAST] Abrindo canal nacional de gateways (UNITEL/MOVICEL SMS Senders)...`,
    ]);

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < targets.length) {
        const currentClient = targets[currentIndex];
        const randomCarrier = Math.random() > 0.4 ? "UNITEL-SMS" : "MOVICEL-GATEWAY";
        const randomId = `MSG_${Math.floor(10000 + Math.random() * 90000)}`;

        setSmsLogs((prev) => [
          ...prev,
          `[${randomCarrier}] Despachado com sucesso para ${currentClient.name} (${currentClient.phone}) - ID: ${randomId} ✅`,
        ]);
        
        currentIndex++;
        setSmsSendProgress(Math.floor((currentIndex / targets.length) * 100));
      } else {
        clearInterval(intervalId);
        setSmsLogs((prev) => [
          ...prev,
          `[SUCESSO] Disparo em lote de promoção concluído com sucesso para todos os ${targets.length} destinatários filtrados! 🚀`,
        ]);
        setIsSendingSms(false);
        triggerToast("Campanha Promocional enviada para as Operadoras!");
      }
    }, 700);
  };

  return (
    <div id="clients-view" className="space-y-6 font-sans">
      {toast && (
        <div className="fixed top-8 right-8 z-50 bg-zinc-900 border border-amber-500 text-amber-300 text-xs px-4 py-3 rounded-xl shadow-2xl font-bold">
          {toast}
        </div>
      )}

      {/* Summary KPI header metrics for local credit monitoring */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider block">Clientes Cadastrados</span>
              <h4 className="text-2xl font-black text-white mt-1 font-mono">{customers.length}</h4>
            </div>
            <div className="p-2 bg-amber-400/10 text-amber-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider block">Clientes com Saldo Devedor</span>
              <h4 className="text-2xl font-black text-red-400 mt-1 font-mono">{clientsWithDebtsCount}</h4>
            </div>
            <div className="p-2 bg-red-400/10 text-red-400 rounded-xl">
              <CircleAlert className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider block">Volume de Compras Registado</span>
              <h4 className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                {formatKwanza(customers.reduce((acc, c) => acc + c.totalPurchases, 0))}
              </h4>
            </div>
            <div className="p-2 bg-emerald-400/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Client Directory vs Campaign Sender */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("directory")}
          type="button"
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 px-5 transition cursor-pointer ${
            activeTab === "directory"
              ? "border-amber-400 text-amber-400 font-extrabold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <UserCheck className="w-4 h-4" /> Directório de Clientes
        </button>
        <button
          onClick={() => setActiveTab("sms_campaign")}
          type="button"
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 px-5 transition cursor-pointer ${
            activeTab === "sms_campaign"
              ? "border-amber-400 text-amber-400 font-extrabold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-400 animate-pulse" /> Campanhas e SMS em Massa
        </button>
        <button
          onClick={() => setActiveTab("employee_debts")}
          type="button"
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 px-5 transition cursor-pointer ${
            activeTab === "employee_debts"
              ? "border-amber-400 text-amber-400 font-extrabold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <PiggyBank className="w-4 h-4 text-emerald-400" /> Dívidas de Funcionários
        </button>
      </div>

      {activeTab === "directory" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: customer directory search & table list */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white tracking-tight self-start sm:self-center">Directório de Clientes</h3>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-amber-400 hover:bg-amber-500 text-black text-xs font-extrabold py-2 px-3.5 rounded-xl transition flex items-center justify-center gap-1 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Novo Cliente
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute inset-y-0 left-3 flex items-center text-zinc-500 w-4 h-4 my-auto" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquise por nome, telemóvel, NIF..."
              className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Customer list scrollable */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 italic text-xs">
                Nenhum cliente registado.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                // Check if has a active debt
                const outstandingRaw = debts
                  .filter((d) => d.customerId === c.id && d.status === "pendente")
                  .reduce((acc, d) => acc + d.currentAmount, 0);

                const isSelected = selectedClientId === c.id;

                // Mark frequent client with high total purchasing power (threshold e.g. 100,000 AOA)
                const isFrequent = c.totalPurchases >= 100000;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedClientId(isSelected ? null : c.id);
                      setShowAddDebt(false);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-amber-400/5 border-amber-400 shadow-md shadow-amber-400/5"
                        : "bg-zinc-950/60 border-zinc-850 hover:bg-zinc-850/40"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        {isFrequent && (
                          <span className="inline-flex items-center gap-1 text-[8px] bg-amber-400/10 text-amber-400 py-0.5 px-1.5 rounded font-black uppercase tracking-wider border border-amber-400/15">
                            <Award className="w-2.5 h-2.5 shrink-0" /> Frequente
                          </span>
                        )}
                        {outstandingRaw > 0 && (
                          <span className="text-[8px] bg-red-400/15 text-red-400 py-0.5 px-1.5 rounded font-bold uppercase tracking-wider">
                            fiado em aberto
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-450 text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium text-zinc-400">
                          <Phone className="w-3 h-3 text-zinc-500" /> {c.phone}
                        </span>
                        {c.nif && (
                          <span className="font-mono text-zinc-500">NIF: {c.nif}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-zinc-800/80 pt-2.5 sm:pt-0 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wide">Vol. Compras</span>
                        <span className="font-mono text-xs text-white font-bold">{formatKwanza(c.totalPurchases)}</span>
                      </div>
                      
                      {outstandingRaw > 0 && (
                        <div className="text-right">
                          <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wide">Saldo Devedor</span>
                          <span className="font-mono text-xs text-red-400 font-black">{formatKwanza(outstandingRaw)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleEditClick(c, e)}
                          className="p-1.5 bg-zinc-900 border border-zinc-800 hover:text-amber-400 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: detail drawer (Edit client OR view historical balances, debts and transaction records) */}
        <div>
          {/* Add or Edit Customer Form overlay in panel */}
          {showAddForm ? (
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-xl shadow-black/20">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest text-amber-400">
                {editingId ? "Editar Informações" : "Cadastrar Cliente"}
              </h3>
              <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="Ex: Teresa Maria Bento"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Telemóvel (Angola) *</label>
                  <input
                    type="text"
                    required
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    placeholder="Ex: 923456789"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">NIF (Opcional)</label>
                  <input
                    type="text"
                    value={cNif}
                    onChange={(e) => setCNif(e.target.value)}
                    placeholder="Ex: 123456789LA012"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Email (Opcional)</label>
                  <input
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="Ex: teresa@bento.ao"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 font-bold">Observações / Endereço</label>
                  <textarea
                    rows={2}
                    value={cNotes}
                    onChange={(e) => setCNotes(e.target.value)}
                    placeholder="Notas comerciais ou morada de entrega..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none animate-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="py-2 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-350 rounded-xl transition"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-amber-400 hover:bg-amber-500 text-xs font-extrabold text-black rounded-xl transition shadow-lg shadow-amber-400/15"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          ) : selectedClient ? (
            /* Selected Client Detail Card Panel */
            <div className="bg-zinc-900 border border-zinc-800/85 rounded-2xl p-6 shadow-xl shadow-black/25 space-y-6">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-amber-500 block mb-1">Dossier de Conta</span>
                <h3 className="text-lg font-bold text-white leading-tight">{selectedClient.name}</h3>
                <span className="text-[10px] font-mono text-zinc-550 block mt-1">ID Cliente: {selectedClient.id}</span>
                {selectedClient.notes && (
                  <p className="bg-zinc-950 p-3 rounded-xl border border-zinc-805 mt-3 text-zinc-450 italic text-[11px] leading-relaxed">
                    "{selectedClient.notes}"
                  </p>
                )}
              </div>

              {/* Debt tracking subsection */}
              <div className="border-t border-zinc-800/80 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <PiggyBank className="w-4 h-4 text-rose-300" /> Vendas a Prazo / Fiado
                  </h4>
                  {!showAddDebt && (
                    <button
                      onClick={() => setShowAddDebt(true)}
                      className="text-[10px] text-amber-400 hover:underline font-bold"
                    >
                      + Novo Fiado
                    </button>
                  )}
                </div>

                {showAddDebt && (
                  <form onSubmit={handleCreateDebt} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-4 space-y-3">
                    <span className="block text-zinc-400 font-bold text-[10px] uppercase tracking-wider">Registar Nova Dívida</span>
                    <div>
                      <input
                        type="number"
                        step="1"
                        required
                        placeholder="Valor em Kwanzas (AOA)"
                        value={debtAmount}
                        onChange={(e) => setDebtAmount(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2 text-xs text-white placeholder-zinc-700"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Motivo (Ex: Kit Fuba + Massa)"
                        value={debtDesc}
                        onChange={(e) => setDebtDesc(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2 text-xs text-white placeholder-zinc-700"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddDebt(false)}
                        className="py-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] rounded text-zinc-300"
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        className="py-1 px-3 bg-rose-400/90 text-black font-extrabold text-[10px] rounded hover:bg-rose-400 transition"
                      >
                        Registar
                      </button>
                    </div>
                  </form>
                )}

                {/* Debts listing inside the customer context */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {clientDebtsList.length === 0 ? (
                    <span className="text-zinc-650 text-[11px] italic block">Sem histórico de contas a prazo associadas.</span>
                  ) : (
                    clientDebtsList.map((d) => (
                      <div key={d.id} className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 flex items-center justify-between text-[11px]">
                        <div>
                          <p className="font-bold text-white">{d.description}</p>
                          <p className="text-zinc-500 text-[9px] mt-0.5">{new Date(d.date).toLocaleDateString("pt-AO")} • {d.status === "pago" ? "Preenchida" : "Pendente"}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <span className={`font-mono font-bold block ${d.status === "pago" ? "text-emerald-400 line-through" : "text-red-400"}`}>
                              {formatKwanza(d.currentAmount)}
                            </span>
                          </div>
                          {d.status === "pendente" && (
                            <button
                              onClick={() => {
                                setAmortizeDebtId(d.id);
                                setAmortizeAmount(String(d.currentAmount));
                              }}
                              className="bg-zinc-800 hover:bg-amber-400 hover:text-black font-extrabold px-2 py-1 rounded text-[9px] text-zinc-300 transition-all uppercase tracking-wide shrink-0"
                            >
                              Amortizar
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Purchase history list */}
              <div className="border-t border-zinc-800/80 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-3">
                  <Receipt className="w-4 h-4 text-amber-400" /> Compras Registadas
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {clientSalesHistory.length === 0 ? (
                    <span className="text-zinc-655 text-[11px] italic block">Nenhuma factura registada para este cliente.</span>
                  ) : (
                    clientSalesHistory.map((s) => (
                      <div key={s.id} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-zinc-300 block">{s.invoiceNumber}</span>
                          <span className="text-zinc-550 text-[9px] block mt-0.5">{new Date(s.date).toLocaleDateString("pt-AO")} • {s.paymentMethod}</span>
                        </div>
                        <span className="font-mono font-bold text-white">{formatKwanza(s.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8 text-center shadow-inner py-16">
              <div className="w-12 h-12 rounded-full bg-zinc-950/85 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse-subtle" />
              </div>
              <p className="text-zinc-100 font-bold text-sm">Nenhum Cliente Seleccionado</p>
              <p className="text-zinc-400 text-xs mt-1 max-w-[200px] mx-auto leading-relaxed">Clique em qualquer cliente no directório para ver o histórico detalhado, fiados e pagamentos.</p>
            </div>
          )}
        </div>
      </div>
      ) : activeTab === "sms_campaign" ? (
        /* MARKETING PROMOTIONAL CAMPAIGNS DASHBOARD */
        <div id="sms-campaigns-dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
          {/* Main Campaign Builder */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-400" /> Marketing Promocional e SMS Directo
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Envie alertas em massa de novidades, saldos e promoções para fidelizar os clientes da Kitanda.</p>
              </div>

              {/* Quick statistics badge */}
              <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl text-center font-sans">
                <span className="text-[9px] block font-black text-zinc-550 uppercase tracking-widest">Base de Marketing</span>
                <span className="text-xs font-black text-amber-400 font-mono">{customers.length} Registados</span>
              </div>
            </div>

            <form onSubmit={handleSendBulkSMS} className="space-y-6">
              {/* 1. Target Filter choice */}
              <div className="space-y-2.5">
                <span className="block text-zinc-450 text-[10px] font-black uppercase tracking-wider font-sans">1. Selecionar Público-Alvo</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`border rounded-xl p-3 flex flex-col justify-between cursor-pointer text-xs transition ${
                      smsFilter === "todos"
                        ? "bg-amber-400/5 border-amber-400/40 text-white"
                        : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Todos os Clientes</span>
                      <input
                        type="radio"
                        name="smsTarget"
                        checked={smsFilter === "todos"}
                        onChange={() => setSmsFilter("todos")}
                        className="text-amber-400 focus:ring-amber-400 bg-zinc-900 border-zinc-800 rounded"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-3 font-mono">Total de {customers.length} contactos</span>
                  </label>

                  <label
                    className={`border rounded-xl p-3 flex flex-col justify-between cursor-pointer text-xs transition ${
                      smsFilter === "frequentes"
                        ? "bg-amber-400/5 border-amber-400/40 text-white"
                        : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Clientes VIP / Frequentes</span>
                      <input
                        type="radio"
                        name="smsTarget"
                        checked={smsFilter === "frequentes"}
                        onChange={() => setSmsFilter("frequentes")}
                        className="text-amber-400 focus:ring-amber-400 bg-zinc-900 border-zinc-800 rounded"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-3 font-mono">
                      {customers.filter((c) => c.totalPurchases >= 100000).length} clientes (&gt;100k Kz)
                    </span>
                  </label>

                  <label
                    className={`border rounded-xl p-3 flex flex-col justify-between cursor-pointer text-xs transition ${
                      smsFilter === "devedores"
                        ? "bg-amber-400/5 border-amber-400/40 text-white"
                        : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Clientes em Mora / Fiados</span>
                      <input
                        type="radio"
                        name="smsTarget"
                        checked={smsFilter === "devedores"}
                        onChange={() => setSmsFilter("devedores")}
                        className="text-amber-400 focus:ring-amber-400 bg-zinc-900 border-zinc-800 rounded"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-3 font-mono">
                      {clientsWithDebtsCount} devedores ativos
                    </span>
                  </label>
                </div>
              </div>

              {/* 2. Choose template quick inserts */}
              <div className="space-y-2.5">
                <span className="block text-zinc-450 text-[10px] font-black uppercase tracking-wider font-sans">2. Modelos Prontos a Usar</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSmsMessage(
                        "Promoção de Verão na Kitanda! Grande desconto de 15% na fuba de milho, leite em pó e pacotes de óleo esta semana. Visite a nossa loja!"
                      )
                    }
                    className="py-1 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 rounded-lg text-[11px] font-medium text-zinc-300 cursor-pointer"
                  >
                    🛍️ Saldos de Stock
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSmsMessage(
                        "Alerta de Stock na Kitanda! Chegaram novos fardos de mercearia e produtos frescos de higiene de alta gama na Loja A e B. Preços imperdíveis."
                      )
                    }
                    className="py-1 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 rounded-lg text-[11px] font-medium text-zinc-300 cursor-pointer"
                  >
                    📦 Reposição Recente
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSmsMessage(
                        "Aviso Kitanda: Estimado cliente, agradecemos a preferência quotidiana nas faturas e compras. Tem novidades prontas sob medida para si em loja."
                      )
                    }
                    className="py-1 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 rounded-lg text-[11px] font-medium text-zinc-300 cursor-pointer"
                  >
                    💝 Agradecimento VIP
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSmsMessage(
                        "Estimado parceiro Kitanda, lembramos a data de vencimento da fatura fiada pendente. Agradecemos o pagamento para reabrir plafond de crédito."
                      )
                    }
                    className="py-1 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 rounded-lg text-[11px] font-medium text-zinc-300 cursor-pointer"
                  >
                    ⚠️ Cobrança de Fiado
                  </button>
                </div>
              </div>

              {/* 3. SMS Message Writer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-450 font-sans">
                  <span>3. Compositor de Conteúdo</span>
                  <span className={`${smsMessage.length > 160 ? "text-amber-400 animate-pulse" : "text-zinc-650"}`}>
                    {smsMessage.length} / 160 Chars (
                    {Math.ceil(smsMessage.length / 160)} SMS)
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Escreva a sua mensagem promocional..."
                  className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-3 px-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-amber-400 leading-relaxed font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingSms}
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-zinc-800 text-black disabled:text-zinc-500 font-extrabold text-xs rounded-xl uppercase tracking-wider transition shadow-lg shadow-amber-400/10 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSendingSms ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" /> Emitindo {smsSendProgress}%...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black" /> Transmitir Campanha de SMS em Massa
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Side: Log console terminal gateway info */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block font-sans">Canal das Operadoras de Angola</h4>

            {isSendingSms || smsLogs.length > 0 ? (
              <div className="space-y-4">
                {/* Simulated Telemetry Stats */}
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-850 text-[11px] grid grid-cols-2 gap-2 text-zinc-400">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wide text-zinc-600 font-bold">Estado Rede</span>
                    <strong className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5 font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span> CONECTADO
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wide text-zinc-600 font-bold">Taxa Disparos</span>
                    <strong className="text-zinc-200 mt-0.5 block font-mono font-bold">4.8 SMS/seg</strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 font-sans">
                    <span>Transmissão em lote</span>
                    <span className="font-mono">{smsSendProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${smsSendProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Live Output Console Code block */}
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 h-[230px] overflow-y-auto font-mono text-[9px] text-emerald-400/95 leading-normal space-y-1.5 scrollbar-thin">
                  {smsLogs.map((log, idx) => (
                    <div key={idx} className="pb-0.5 border-b border-zinc-900/40">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-zinc-850 rounded-2xl p-8 py-14 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center mx-auto mb-3 text-zinc-550">
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="block text-xs font-bold text-zinc-400 font-sans">Canal de Disparo Inativo</span>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[180px] mx-auto leading-relaxed font-sans">Defina a mensagem de desconto ao lado e inicie o disparo. As faturas, cobranças ou ofertas serão partilhadas em massa via SMS.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EMPLOYEE DEBTS MANAGEMENT */
        <EmployeeDebtsPanel />
      )}

      {/* Amortization popup overlay modal */}
      {amortizeDebtId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl max-w-sm w-full p-6 shadow-2xl shadow-red-500/5">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-1.5">
              <PiggyBank className="w-5 h-5 text-amber-400" />
              Registar Recebimento / Amortização
            </h3>
            <p className="text-zinc-400 text-xs mb-4">Escolha a quantia recebida para abater no saldo devedor do cliente.</p>

            <form onSubmit={handleAmortizeDebt} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Quantia a Pagar (Kwanza)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.1"
                  value={amortizeAmount}
                  onChange={(e) => setAmortizeAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Meio de Recebimento</label>
                <select
                  value={amortizeMethod}
                  onChange={(e) => setAmortizeMethod(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="dinheiro">Dinheiro Físico</option>
                  <option value="transferencia">Transferência Bancária</option>
                  <option value="multicaixa">Multicaixa / ATM</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAmortizeDebtId(null)}
                  className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 rounded-xl"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-amber-400 hover:bg-amber-500 font-extrabold text-black text-xs rounded-xl shadow-lg shadow-amber-400/10"
                >
                  Lançar no Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
