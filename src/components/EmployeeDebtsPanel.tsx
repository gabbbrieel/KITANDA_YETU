/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { store } from "../services/store";
import { EmployeeDebt, User } from "../types";
import {
  PiggyBank,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  UserCheck,
  TrendingDown,
  Coins,
  History,
  X,
  Filter,
  Lock,
} from "lucide-react";

export default function EmployeeDebtsPanel() {
  const [currentUser, setCurrentUser] = useState(() => store.getCurrentUser());
  const [users, setUsers] = useState(() => store.getUsers());
  const [debts, setDebts] = useState(() => store.getEmployeeDebts());

  // Subscribe to reactive store changes
  useMemo(() => {
    const unsubscribe = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setUsers(store.getUsers());
      setDebts(store.getEmployeeDebts());
    });
    return () => unsubscribe();
  }, []);

  // Check role authorization
  const isPrincipalManager = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === "gestor_principal" || currentUser.role === "admin";
  }, [currentUser]);

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterReason, setFilterReason] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<EmployeeDebt | null>(null);
  const [payingDebt, setPayingDebt] = useState<EmployeeDebt | null>(null);

  // Form Fields - Register / Edit
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formReason, setFormReason] = useState<"falta_relatorio" | "adiantamento_salario" | "produto_fiado" | "outro">("falta_relatorio");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Form Fields - Pay/Amortize
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("dinheiro");

  // Notification Toast state
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Helper formatting currency
  const formatKwanza = (v: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
    }).format(v).replace("AOA", "Kz");
  };

  // Prepare fields for registering a new debt
  const openAddModal = () => {
    if (!currentUser) return;
    setEditingDebt(null);
    setFormReason("falta_relatorio");
    setFormDescription("");
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);

    // If principal manager, default to first user or empty. If regular employee, force to themselves.
    if (isPrincipalManager) {
      setFormEmployeeId(users[0]?.id || "");
    } else {
      setFormEmployeeId(currentUser.id);
    }
    setShowAddModal(true);
  };

  // Submit debt handler (Register and Edit)
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formEmployeeId || !formAmount || !formReason || !formDescription) {
      triggerToast("Erro: Preencha todos os campos obrigatórios.");
      return;
    }

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      triggerToast("Erro: O valor da dívida deve ser maior que zero.");
      return;
    }

    // Identify target employee
    const targetUser = users.find((u) => u.id === formEmployeeId) || currentUser;

    // Security Gate check: If not gestor principal, you can ONLY register for YOURSELF
    if (!isPrincipalManager && formEmployeeId !== currentUser.id) {
      triggerToast("Erro de Permissão: Apenas pode registar as suas próprias dívidas.");
      return;
    }

    if (editingDebt) {
      // Security Gate check: non-manager cannot edit
      if (!isPrincipalManager) {
        triggerToast("Erro de Permissão: Não possui permissão para editar registos.");
        return;
      }

      store.updateEmployeeDebt(editingDebt.id, {
        userId: formEmployeeId,
        userName: targetUser.name,
        amount: amt,
        reason: formReason,
        description: formDescription,
        date: formDate,
      });
      triggerToast("Dívida de funcionário atualizada!");
    } else {
      store.addEmployeeDebt({
        userId: formEmployeeId,
        userName: targetUser.name,
        amount: amt,
        reason: formReason,
        description: formDescription,
        date: formDate,
        storeId: currentUser.storeId || "loja-a",
        registeredByUserId: currentUser.id,
        registeredByName: currentUser.name,
      });
      triggerToast("Dívida registada no sistema com sucesso!");
    }

    setShowAddModal(false);
    setEditingDebt(null);
  };

  // Open edit modal (gestor_principal only)
  const openEditModal = (debt: EmployeeDebt) => {
    if (!isPrincipalManager) {
      triggerToast("Apenas o Gestor Principal pode editar estas dívidas.");
      return;
    }
    setEditingDebt(debt);
    setFormEmployeeId(debt.userId);
    setFormAmount(debt.amount.toString());
    setFormReason(debt.reason);
    setFormDescription(debt.description);
    setFormDate(debt.date);
    setShowAddModal(true);
  };

  // Delete handler (gestor_principal only)
  const handleDeleteDebt = (id: string, name: string) => {
    if (!isPrincipalManager) {
      triggerToast("Apenas o Gestor Principal pode apagar estes registos.");
      return;
    }

    if (window.confirm(`Tem a certeza absoluta que deseja ELIMINAR permanentemente a dívida de "${name}"? Esta ação é irreversível.`)) {
      store.deleteEmployeeDebt(id);
      triggerToast("Registo de dívida eliminado com sucesso!");
    }
  };

  // Submit amortize/payment handler
  const handleAmortizeDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt || !currentUser) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      triggerToast("Erro: O valor do pagamento deve ser válido.");
      return;
    }

    if (amt > payingDebt.remainingAmount) {
      triggerToast(`Erro: O valor inserido é superior à dívida pendente (${formatKwanza(payingDebt.remainingAmount)}).`);
      return;
    }

    // Launch amortization
    store.payEmployeeDebt(payingDebt.id, amt, payMethod, currentUser.name);
    
    // Also, we register this as an incoming financial transaction if it's repaid in cash/bank to the company box!
    store.addTransaction({
      type: "entrada",
      category: "Reembolso de Funcionário",
      amount: amt,
      description: `Amortização de dívida (${payingDebt.userName}) - Motivo: ${translateReason(payingDebt.reason)}`,
    });

    triggerToast(`Recebimento de ${formatKwanza(amt)} amortizado!`);
    setPayingDebt(null);
    setPayAmount("");
  };

  // Helper translations for reasons
  const translateReason = (r: string) => {
    switch (r) {
      case "falta_relatorio":
        return "Falta no Relatório";
      case "adiantamento_salario":
        return "Adiantamento Salarial";
      case "produto_fiado":
        return "Produto Fiado (Consumo)";
      default:
        return "Outros Motivos";
    }
  };

  // Filter list of debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      // 1. Search Query
      const matchSearch =
        d.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Reason Filter
      const matchReason = filterReason === "todos" || d.reason === filterReason;

      // 3. Status Filter
      const matchStatus = filterStatus === "todos" || d.status === filterStatus;

      return matchSearch && matchReason && matchStatus;
    });
  }, [debts, searchQuery, filterReason, filterStatus]);

  // Statistics summaries
  const stats = useMemo(() => {
    const pendingTotal = debts
      .filter((d) => d.status === "pendente")
      .reduce((acc, d) => acc + d.remainingAmount, 0);

    const paidTotal = debts.reduce((acc, d) => {
      const dbPaid = d.payments.reduce((pAcc, p) => pAcc + p.amount, 0);
      return acc + dbPaid;
    }, 0);

    const totalDebtsRegistered = debts.reduce((acc, d) => acc + d.amount, 0);

    const pendingCount = debts.filter((d) => d.status === "pendente").length;

    return {
      pendingTotal,
      paidTotal,
      totalDebtsRegistered,
      pendingCount,
    };
  }, [debts]);

  return (
    <div id="employee-debts-management" className="space-y-6">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-8 right-8 z-55 bg-zinc-900 border border-amber-400/50 text-white text-xs px-5 py-3.5 rounded-2xl shadow-2xl font-bold animate-fade-in flex items-center gap-2">
          <span className="text-amber-400 text-sm">✨</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <PiggyBank className="w-6 h-6 text-emerald-400" />
            Controle de Dívidas de Funcionários
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Lançamento e monitoramento de faltas nos relatórios, vales/adiantamentos de salário e compras de consumo interno de colaboradores.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-extrabold text-xs py-3 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Registar Dívida / Vale
        </button>
      </div>

      {/* Stats Board Bento-Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[10px] font-black uppercase tracking-wider">Apenas Pendente</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="block text-xl font-black text-amber-400 font-mono">
            {formatKwanza(stats.pendingTotal)}
          </span>
          <span className="text-[10px] text-zinc-500 block">Total de valores por receber</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Liquidado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="block text-xl font-black text-emerald-400 font-mono">
            {formatKwanza(stats.paidTotal)}
          </span>
          <span className="text-[10px] text-zinc-500 block">Valores já reembolsados</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[10px] font-black uppercase tracking-wider">Acumulado Histórico</span>
            <Coins className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="block text-xl font-black text-white font-mono">
            {formatKwanza(stats.totalDebtsRegistered)}
          </span>
          <span className="text-[10px] text-zinc-500 block">Soma de todos os empréstimos</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[10px] font-black uppercase tracking-wider">Funcionários Ativos em Débito</span>
            <UserCheck className="w-4 h-4 text-teal-400" />
          </div>
          <span className="block text-xl font-black text-teal-400 font-mono">
            {stats.pendingCount} Colaboradores
          </span>
          <span className="text-[10px] text-zinc-500 block">Registos em aberto no POS</span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute inset-y-0 left-3 flex items-center text-zinc-500 w-4 h-4 my-auto" />
          <input
            type="text"
            placeholder="Pesquisar por colaborador ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Quick select filters */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          {/* Reason filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos os Motivos</option>
              <option value="falta_relatorio">Falta de Relatório</option>
              <option value="adiantamento_salario">Adiantamento de Salário</option>
              <option value="produto_fiado">Produto Fiado</option>
              <option value="outro">Outros motivos</option>
            </select>
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos os Estados</option>
            <option value="pendente">Pendentes (Em aberto)</option>
            <option value="pago">Liquidados (Pago)</option>
          </select>
        </div>
      </div>

      {/* Main Records List / Table */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden">
        {filteredDebts.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center mx-auto text-zinc-650">
              <History className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="space-y-1">
              <p className="text-zinc-400 text-sm font-bold">Nenhum registo de dívida encontrado</p>
              <p className="text-zinc-600 text-xs max-w-sm mx-auto leading-relaxed">
                Não existem dívidas ativas para os filtros selecionados, ou todos os vales de adiantamentos estão liquidados.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-450 text-[10px] uppercase font-black tracking-widest bg-zinc-950 font-sans">
                  <th className="py-4 px-6">Funcionário</th>
                  <th className="py-4 px-4">Motivo / Tipo</th>
                  <th className="py-4 px-4">Data Emissão</th>
                  <th className="py-4 px-4 text-right">Valor Inicial</th>
                  <th className="py-4 px-4 text-right">Saldo Pendente</th>
                  <th className="py-4 px-4 text-center">Estado</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-xs">
                {filteredDebts.map((d) => {
                  const initialAmtStr = formatKwanza(d.amount);
                  const remainingAmtStr = formatKwanza(d.remainingAmount);

                  // Set badges styling per reason
                  let reasonColor = "bg-zinc-950 border-zinc-850 text-zinc-400";
                  if (d.reason === "falta_relatorio") {
                    reasonColor = "bg-red-500/10 border-red-500/10 text-red-400";
                  } else if (d.reason === "adiantamento_salario") {
                    reasonColor = "bg-amber-500/10 border-amber-500/10 text-amber-400";
                  } else if (d.reason === "produto_fiado") {
                    reasonColor = "bg-blue-500/10 border-blue-500/10 text-blue-400";
                  }

                  const isOwnDebt = currentUser?.id === d.userId;

                  return (
                    <tr key={d.id} className="hover:bg-zinc-850/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-white">
                        <div className="flex flex-col">
                          <span>{d.userName}</span>
                          <span className="text-[9px] text-zinc-500 font-normal mt-0.5 max-w-[220px] truncate" title={d.description}>
                            {d.description}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${reasonColor}`}>
                          {translateReason(d.reason)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-400 font-mono">
                        {new Date(d.date).toLocaleDateString("pt-AO")}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-zinc-300 font-bold">
                        {initialAmtStr}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-white font-black">
                        {remainingAmtStr}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            d.status === "pago"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {d.status === "pago" ? "Liquidado" : "Pendente"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Payment button (Amortize) */}
                          {d.status === "pendente" && (
                            <button
                              onClick={() => {
                                setPayingDebt(d);
                                setPayAmount(d.remainingAmount.toString());
                                setPayMethod("dinheiro");
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-black px-2.5 py-1 rounded-lg font-black uppercase text-[10px] tracking-wide cursor-pointer transition"
                            >
                              Pagar/Vale
                            </button>
                          )}

                          {/* Edit Button (Gestor Principal ONLY) */}
                          {isPrincipalManager ? (
                            <button
                              onClick={() => openEditModal(d)}
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-350 hover:text-white p-1.5 rounded-lg transition"
                              title="Editar Dívida"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="p-1.5 opacity-20 text-zinc-600 cursor-not-allowed" title="Edição bloqueada">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* Delete Button (Gestor Principal ONLY) */}
                          {isPrincipalManager ? (
                            <button
                              onClick={() => handleDeleteDebt(d.id, d.userName)}
                              className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 p-1.5 rounded-lg transition"
                              title="Eliminar Dívida"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="p-1.5 opacity-20 text-red-600 cursor-not-allowed" title="Eliminação bloqueada">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL: RECORD / EDIT DEBT --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-850 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <PiggyBank className="w-4.5 h-4.5 text-emerald-400" />
                {editingDebt ? "Editar Registo de Dívida" : "Registar Nova Dívida / Vale"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDebt} className="p-6 space-y-4">
              {/* Employee Selection Dropdown */}
              <div>
                <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
                  Selecione o Colaborador
                </label>
                {isPrincipalManager ? (
                  <select
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="" disabled>Escolha um funcionário da lista...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.replace("_", " ").toUpperCase()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-3 text-xs text-zinc-400 select-none flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>{currentUser?.name} (Apenas próprio)</span>
                  </div>
                )}
                {!isPrincipalManager && (
                  <span className="text-[10px] text-zinc-550 block mt-1">Como funcionário de vendas, o seu registo de débito é obrigatoriamente preenchido sob a sua titularidade e não pode ser editado nem excluído após submetido.</span>
                )}
              </div>

              {/* Grid: Amount & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
                    Valor Dívida (Kz)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    required
                    placeholder="Ex: 15000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
                    Data Emissão
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Debt Reason Selector */}
              <div>
                <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
                  Motivo da Dívida / Vale
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "falta_relatorio", name: "Falta de Relatório" },
                    { id: "adiantamento_salario", name: "Adiantamento Salarial" },
                    { id: "produto_fiado", name: "Produto Fiado (Consumo)" },
                    { id: "outro", name: "Outro Motivo" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`border rounded-xl p-3 flex items-center justify-between gap-1 cursor-pointer transition select-none ${
                        formReason === item.id
                          ? "bg-emerald-500/10 border-emerald-500 text-white"
                          : "bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-400"
                      }`}
                    >
                      <span className="text-[10px] font-bold leading-tight">{item.name}</span>
                      <input
                        type="radio"
                        name="debtReason"
                        checked={formReason === item.id}
                        onChange={() => setFormReason(item.id as any)}
                        className="text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-800 accent-emerald-500 w-3 h-3"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Description TextArea */}
              <div>
                <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
                  Justificação / Notas de Descrição
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva detalhadamente a justificação... Por exemplo: Código dos produtos retirados ou data acordada para desconto salarial."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-2.5 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  {editingDebt ? "Gravar Parâmetros" : "Lançar Dívida"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: PAY OR AMORTIZE DEBT --- */}
      {payingDebt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-850 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <TrendingDown className="w-4.5 h-4.5 text-emerald-400" />
                Receção de Reembolso / Amortização
              </h3>
              <button
                onClick={() => setPayingDebt(null)}
                className="text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-xs space-y-1">
                <span className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold block">Colaborador em Débito</span>
                <strong className="text-white text-sm block">{payingDebt.userName}</strong>
                <div className="flex justify-between text-zinc-400 pt-1 border-t border-zinc-850 mt-1.5">
                  <span>Dívida em aberto:</span>
                  <strong className="font-mono text-amber-400 font-black">{formatKwanza(payingDebt.remainingAmount)}</strong>
                </div>
              </div>

              <form onSubmit={handleAmortizeDebt} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
                    Quantia Entregue para Abate (Kz)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={payingDebt.remainingAmount}
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1.5">
                    <span>Restará após reembolso:</span>
                    <span className="font-mono text-zinc-400">
                      {formatKwanza(Math.max(0, payingDebt.remainingAmount - (parseFloat(payAmount) || 0)))}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
                    Canal / Método de Receção
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-white uppercase font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="dinheiro">Dinheiro Físico / Caixa</option>
                    <option value="transferencia">Transferência Bancária</option>
                    <option value="multicaixa">Multicaixa / ATM</option>
                  </select>
                  <span className="text-[10px] text-zinc-550 block mt-1.5">
                    Este valor será incorporado no registo geral de tesouraria como um lançamento de entrada de capital.
                  </span>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingDebt(null)}
                    className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-zinc-350 rounded-xl"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-black text-xs rounded-xl shadow-lg transition cursor-pointer"
                  >
                    Confirmar Abate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
