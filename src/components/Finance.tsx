/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { store } from "../services/store";
import { FinancialTransaction, TransactionType } from "../types";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Wallet,
  Coins,
  FileSpreadsheet,
  Calendar,
  Layers,
} from "lucide-react";

export default function Finance() {
  const [transactions, setTransactions] = useState(() => store.getTransactions());
  
  useMemo(() => {
    const unsubscribe = store.subscribe(() => {
      setTransactions([...store.getTransactions()]);
    });
    return () => unsubscribe();
  }, []);

  // Form states
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<TransactionType>("saida");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("Despesas Diversas");
  const [txDesc, setTxDesc] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "entrada" | "saida">("todos");

  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Calculations
  const stats = useMemo(() => {
    const totalInflow = transactions
      .filter((t) => t.type === "entrada")
      .reduce((acc, t) => acc + t.amount, 0);

    const totalOutflow = transactions
      .filter((t) => t.type === "saida")
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = totalInflow - totalOutflow;

    return {
      totalInflow,
      totalOutflow,
      balance,
    };
  }, [transactions]);

  // Handle transaction launcher
  const handleLaunchTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txCategory || !txDesc) {
      triggerToast("Erro: Preencha todos os campos obrigatórios.");
      return;
    }

    const amtNum = parseFloat(txAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      triggerToast("Erro: O valor deve ser maior do que zero.");
      return;
    }

    store.addTransaction({
      type: txType,
      category: txCategory,
      amount: amtNum,
      description: txDesc,
    });

    triggerToast(`Lançamento de ${txType} executado com sucesso!`);
    setTxAmount("");
    setTxDesc("");
    setShowAddTx(false);
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === "todos" || t.type === filterType;
      return matchSearch && matchType;
    });
  }, [transactions, searchQuery, filterType]);

  const formatKwanza = (v: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
    }).format(v);
  };

  const handleExportCSV = () => {
    const headers = "Identificador;Tipo;Categoria;Descricao;Valor (AOA);Data Lancamento\n";
    const bodyRows = transactions
      .map(
        (t) =>
          `"${t.id}";"${t.type.toUpperCase()}";"${t.category}";"${t.description}";${t.amount};"${new Date(
            t.date
          ).toLocaleDateString("pt-AO")}"`
      )
      .join("\n");

    const blob = new Blob([headers + bodyRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `FLUXO_CAIXA_KITANDA_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Ficheiro CSV gerado e descarregado!");
  };

  return (
    <div id="finance-ledger-view" className="space-y-6 font-sans">
      {toast && (
        <div className="fixed top-8 right-8 z-50 bg-zinc-900 border border-amber-500 text-amber-300 text-xs px-4 py-3 rounded-xl shadow-2xl font-bold">
          {toast}
        </div>
      )}

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Dynamic Cash balance */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden shadow-lg shadow-black/10">
          <div className="absolute right-4 top-4 text-emerald-400/10">
            <Wallet className="w-12 h-12" />
          </div>
          <span className="text-zinc-550 text-[10px] font-black uppercase tracking-wider block">Disponibilidade Líquida em Caixa</span>
          <h3 className={`text-2xl font-black mt-2 font-mono ${stats.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatKwanza(stats.balance)}
          </h3>
          <p className="text-zinc-500 text-[10px] mt-1.5 font-medium">Saldo corrente reconciliado em tempo real</p>
        </div>

        {/* Dynamic Inflow revenues */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden shadow-lg shadow-black/10">
          <div className="absolute right-4 top-4 text-amber-400/10">
            <TrendingUp className="w-12 h-12" />
          </div>
          <span className="text-zinc-550 text-[10px] font-black uppercase tracking-wider block">Receitas Brutas (Entradas)</span>
          <h3 className="text-2xl font-black text-white mt-2 font-mono">
            {formatKwanza(stats.totalInflow)}
          </h3>
          <p className="text-zinc-500 text-[10px] mt-1.5 font-medium">Vendas no POS + Amortizações de fiados</p>
        </div>

        {/* Dynamic costs and outflows */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden shadow-lg shadow-black/10">
          <div className="absolute right-4 top-4 text-red-400/10">
            <Coins className="w-12 h-12" />
          </div>
          <span className="text-zinc-550 text-[10px] font-black uppercase tracking-wider block">Despesas Processadas (Saídas)</span>
          <h3 className="text-2xl font-black text-zinc-300 mt-2 font-mono">
            {formatKwanza(stats.totalOutflow)}
          </h3>
          <p className="text-zinc-500 text-[10px] mt-1.5 font-medium">Fornecedores, salários e levantamentos manuais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Ledger listing */}
        <div className="bg-zinc-900 border border-zinc-800/85 rounded-2xl p-6 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Razão do Fluxo de Caixa</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Histórico cronológico de lançamentos financeiros operacionais.</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                id="export-csv-btn"
                onClick={handleExportCSV}
                className="p-2 bg-zinc-805 hover:bg-zinc-705 border border-zinc-800 hover:text-white rounded-xl text-xs text-zinc-400 flex items-center gap-1.5 transition w-full sm:w-auto justify-center"
              >
                <FileSpreadsheet className="w-4 h-4 text-zinc-500" /> Exportar CSV
              </button>
              <button
                onClick={() => setShowAddTx(true)}
                className="py-2 px-3.5 bg-amber-400 hover:bg-amber-500 text-black text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0 transition"
              >
                <Plus className="w-4 h-4" /> Novo Lançamento
              </button>
            </div>
          </div>

          {/* Filtering bar tool */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="absolute inset-y-0 left-3 flex items-center text-zinc-550 w-4 h-4 my-auto" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquise movimentos por descrição ou divisão..."
                className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-750 focus:outline-none focus:border-amber-440 transition"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-440"
            >
              <option value="todos">Todos Lançamentos</option>
              <option value="entrada">Apenas Entradas (+)</option>
              <option value="saida">Apenas Saídas (-)</option>
            </select>
          </div>

          {/* Core Table listing logs */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-zinc-650 text-xs italic">
                Nenhum lançamento corresponde à filtragem efectuada.
              </div>
            ) : (
              filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-850 hover:border-zinc-700/60 transition flex justify-between items-center text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      t.type === "entrada" ? "bg-amber-400/10 text-amber-400" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {t.type === "entrada" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="font-extrabold text-white block text-xs">{t.description}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-zinc-500 text-[10px]">
                        <span className="font-semibold">{t.category}</span>
                        <span>•</span>
                        <span>{new Date(t.date).toLocaleDateString("pt-AO")}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`font-mono font-black text-xs pr-1 ${t.type === "entrada" ? "text-amber-400" : "text-zinc-450"}`}>
                    {t.type === "entrada" ? "+" : "-"}{formatKwanza(t.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: informational summary or analytics breakdown breakdown */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-450">Categorização das Finanças</h4>
          <p className="text-zinc-500 text-xs text-[11px] leading-relaxed">
            O software quantifica e separa despesa comercial local face a amortizações ocorridas no POS de venda directa.
          </p>

          <div className="py-2 border-t border-zinc-805 space-y-3.5">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Apoio Legal de Contas</span>
              <p className="text-xs text-zinc-400 leading-normal mt-1">
                Todas as facturas emitidas por via computorizada pelo KITANDA YETU incorporam IVA à taxa legal correspondente. O encerramento de caixa recolhe despesas para simplificação de impostos junto da AGT.
              </p>
            </div>

            <div className="bg-zinc-950 p-4 border border-zinc-855 rounded-xl space-y-3">
              <span className="block font-bold text-white text-[11px] uppercase tracking-wide">Previsões e Recomendações</span>
              <div className="space-y-1.5 text-xs text-zinc-400">
                <p>💡 <span className="text-zinc-200">Margem saudável:</span> Mantenha gastos de abastecimento limitados a 70% da facturação líquida.</p>
                <p>💡 <span className="text-zinc-200">Alertas de fiados:</span> Evite moras acima de 15 dias sem registar recebimentos fraccionais.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Launcher popup Transaction overlay modal */}
      {showAddTx && (
        <div id="add-tx-modal-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-amber-400" />
              Lançar Movimento de Caixa manual
            </h3>
            <p className="text-zinc-450 text-xs mb-4">Insira o tipo de operação correspondente para afetar o saldo consolidado.</p>

            <form onSubmit={handleLaunchTransaction} className="space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="block text-zinc-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tipo de Lançamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType("entrada")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      txType === "entrada" ? "bg-amber-400 border-amber-400 text-black font-extrabold" : "bg-zinc-800 border-zinc-750 text-zinc-300"
                    }`}
                  >
                    Entrada / Faturamento (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType("saida")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      txType === "saida" ? "bg-zinc-800 border-amber-400/10 text-white font-extrabold" : "bg-zinc-800 border-zinc-750 text-zinc-300"
                    }`}
                  >
                    Saída / Pagamentos (-)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-zinc-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">Quantia em Kwanzas (AOA) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="Ex: 15000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-zinc-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">Divisão / Categoria *</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Abastecimento de Fornecedores">Fornecedores / Mercadorias</option>
                    <option value="Salários e Retribuição">Salários de Funcionários</option>
                    <option value="Serviços Gerais (Luz/Água)">Serviços Úteis / Renda</option>
                    <option value="Amortização Manual">Lançamento Auxiliar</option>
                    <option value="Gastos Gerais Extras">Outras Despesas Diversas</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-zinc-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">Resumo Descritivo *</label>
                  <input
                    type="text"
                    required
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    placeholder="Ex: Pagamento da Conta de Água EPAL"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTx(false)}
                  className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 rounded-xl"
                >
                  Regressar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-amber-400 hover:bg-amber-500 font-extrabold text-black text-xs rounded-xl shadow-lg shadow-amber-400/10"
                >
                  Efectivar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
