/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { store } from "../services/store";
import {
  TrendingUp,
  AlertTriangle,
  Users,
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Download,
  Printer,
  Share2,
  FileText,
  X,
  Info,
  ExternalLink,
} from "lucide-react";

export default function Dashboard() {
  const [sales, setSales] = useState(() => store.getAllSales());
  const [products, setProducts] = useState(() => store.getAllProducts());
  const [customers, setCustomers] = useState(() => store.getAllCustomers());
  const [transactions, setTransactions] = useState(() => store.getAllTransactions());
  const [debts, setDebts] = useState(() => store.getAllDebts());

  // Listen to store updates
  useMemo(() => {
    const unsubscribe = store.subscribe(() => {
      setSales([...store.getAllSales()]);
      setProducts([...store.getAllProducts()]);
      setCustomers([...store.getAllCustomers()]);
      setTransactions([...store.getAllTransactions()]);
      setDebts([...store.getAllDebts()]);
    });
    return () => unsubscribe();
  }, []);

  // Format monetary value
  const formatKwanza = (v: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
    }).format(v);
  };

  const currentUser = useMemo(() => store.getCurrentUser(), []);
  const systemUsers = useMemo(() => store.getUsers(), []);
  const branches = useMemo(() => store.getStoreBranches(), []);

  // State-based Filters for advanced sales report
  const [dateFilter, setDateFilter] = useState<"hoje" | "semana" | "mes" | "custom">("hoje");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"todos" | "produto" | "servico">("todos");
  const [productIdFilter, setProductIdFilter] = useState<string>("");
  const [customerIdFilter, setCustomerIdFilter] = useState<string>("");
  const [operatorIdFilter, setOperatorIdFilter] = useState<string>("");
  const [storeIdFilter, setStoreIdFilter] = useState<string>(() => {
    const user = store.getCurrentUser();
    if (user?.role === "admin" || user?.role === "gestor_principal") return "";
    return user?.storeId || store.getActiveStoreId() || "loja-a";
  });

  const handleResetFilters = () => {
    setDateFilter("hoje");
    setStartDate("");
    setEndDate("");
    setTypeFilter("todos");
    setProductIdFilter("");
    setCustomerIdFilter("");
    setOperatorIdFilter("");
    if (currentUser?.role === "admin" || currentUser?.role === "gestor_principal") {
      setStoreIdFilter("");
    }
  };

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [detailSearchQuery, setDetailSearchQuery] = useState("");

  // Funcão para exportar faturas filtradas para Excel (CSV)
  const handleExportCSV = () => {
    // Definir as colunas
    const headers = [
      "No. Fatura",
      "Tipo Documento",
      "Data/Hora",
      "Cliente",
      "NIF",
      "Quantidade de Itens",
      "Subtotal (AOA)",
      "Desconto (AOA)",
      "Total Liquido (AOA)",
      "Lucro Estimado (AOA)",
      "Metodo Pagamento",
      "Operador/Caixa",
      "Status",
      "Itens Detalhados"
    ];

    const rows = filteredSales.map((s) => {
      const itemsDescription = s.items
        .map((it) => `${it.productName} (x${it.quantity} @ ${formatKwanza(it.price)})`)
        .join(" | ");

      return [
        s.invoiceNumber,
        s.documentType,
        s.date.replace("T", " "),
        s.clientName,
        s.clientNif || "Consumidor Final",
        s.items.reduce((acc, current) => acc + current.quantity, 0),
        s.subtotal.toFixed(2),
        s.discount.toFixed(2),
        s.total.toFixed(2),
        s.profit.toFixed(2),
        s.paymentMethod.toUpperCase(),
        s.cashierName,
        s.status.toUpperCase(),
        `"${itemsDescription.replace(/"/g, '""')}"`
      ];
    });

    // Content compilation with BOM for perfect Excel UTF-8 representation (crucial for Portuguese accents and Kwanzas)
    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const formattedDate = new Date().toISOString().split("T")[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_comercial_filtrado_${formattedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enviar sumário executivo via WhatsApp
  const handleShareWhatsApp = () => {
    const formattedTotal = formatKwanza(stats.soldToday);
    const formattedProfit = formatKwanza(stats.profitMonth);
    const formattedVolume = `${stats.unitsFiltered} un/srv`;
    
    const message = 
      `*SISTEMA COMERCIAL - RELATÓRIO DO PERÍODO*\n` +
      `-------------------------------------------\n` +
      `👉 *Período/Data:* ${dateFilter === "hoje" ? "HOJE" : dateFilter === "semana" ? "ESTA SEMANA" : dateFilter === "mes" ? "ESTE MÊS" : "ESPECIFICADO (CUSTOMIZÁVEL)"}\n` +
      `🌐 *Filtrado por tipo:* ${typeFilter === "todos" ? "Geral/Todos" : typeFilter === "produto" ? "Apenas Produtos" : "Apenas Serviços"}\n` +
      `-------------------------------------------\n` +
      `🔸 *Faturação Total:* ${formattedTotal}\n` +
      `🔸 *Lucro Líquido Estimado:* ${formattedProfit}\n` +
      `🔸 *Documentos Emitidos:* ${stats.invoicesTodayCount} faturas\n` +
      `🔸 *Volume de Itens Vendidos:* ${formattedVolume}\n` +
      `🔸 *Ativos em Caixa:* ${formatKwanza(globalStats.totalInflow - globalStats.totalOutflow)}\n` +
      `🔸 *Saldo de Fiados:* ${formatKwanza(globalStats.outstandingDebtsAmount)}\n` +
      `-------------------------------------------\n` +
      `ℹ️ _Relatório sumário gerado para fins de gestão comercial._\n` +
      `📅 _Data de Emissão: ${new Date().toLocaleString("pt-AO")}_`;

    const encodedText = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
  };

  // Global totals (not affected by other status filters, but isolated by store if selected)
  const globalStats = useMemo(() => {
    // Isolate by selected store/branch
    const filteredProds = storeIdFilter === "" ? products : products.filter((p) => p.storeId === storeIdFilter);
    const filteredDebts = storeIdFilter === "" ? debts : debts.filter((d) => d.storeId === storeIdFilter);
    const filteredTxs = storeIdFilter === "" ? transactions : transactions.filter((t) => t.storeId === storeIdFilter);

    // Total low stock products count (excluding services)
    const lowStockCount = filteredProds.filter((p) => p.type !== "servico" && p.stock <= p.minStock).length;

    // Total outstanding debts
    const outstandingDebtsAmount = filteredDebts
      .filter((d) => d.status === "pendente")
      .reduce((acc, d) => acc + d.currentAmount, 0);

    // Cash flow metrics
    const totalInflow = filteredTxs
      .filter((t) => t.type === "entrada")
      .reduce((acc, t) => acc + t.amount, 0);

    const totalOutflow = filteredTxs
      .filter((t) => t.type === "saida")
      .reduce((acc, t) => acc + t.amount, 0);

    const netCashflow = totalInflow - totalOutflow;

    return {
      lowStockCount,
      outstandingDebtsAmount,
      totalInflow,
      totalOutflow,
      netCashflow,
    };
  }, [products, debts, transactions, storeIdFilter]);

  // Filtered active sales according to selected criteria
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // For statistics, only consider valid, active invoices/sales
      if (s.status !== "ativa") return false;

      // 0. Store Filter
      let finalStoreIdFilter = storeIdFilter;
      if (currentUser && (currentUser.role === "gerente_loja" || currentUser.role === "operador_vendas" || currentUser.role === "vendedor")) {
        finalStoreIdFilter = currentUser.storeId || "loja-a";
      }
      if (finalStoreIdFilter !== "" && s.storeId !== finalStoreIdFilter) return false;

      // Operator & Role security Filter
      if (currentUser && (currentUser.role === "operador_vendas" || currentUser.role === "vendedor")) {
        // operador_vendas/vendedor can only see their own sales
        if (s.cashierId !== currentUser.id) return false;
      } else if (currentUser && currentUser.role === "gerente_loja") {
        // gerente_loja can only see sales for their branch, but of any cashier
        if (s.storeId !== currentUser.storeId) return false;
        if (operatorIdFilter !== "" && s.cashierId !== operatorIdFilter) return false;
      } else {
        // gestor_principal or admin can see any operator sales in matching store scope
        if (operatorIdFilter !== "" && s.cashierId !== operatorIdFilter) return false;
      }

      // 1. Customer Filter
      if (customerIdFilter !== "") {
        if (customerIdFilter === "geral") {
          // If customer is general / not registered (i.e. empty or null clientId)
          if (s.clientId && s.clientId !== "") return false;
        } else {
          if (s.clientId !== customerIdFilter) return false;
        }
      }

      // 2. Date Filter
      const saleDate = new Date(s.date);
      const now = new Date();
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const saleDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());

      if (dateFilter === "hoje") {
        if (saleDay.getTime() !== today.getTime()) return false;
      } else if (dateFilter === "semana") {
        // Monday represented in standard ISO
        const currentDayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
        const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + diffToMonday);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (saleDay < startOfWeek || saleDay >= tomorrow) return false;
      } else if (dateFilter === "mes") {
        if (saleDate.getFullYear() !== now.getFullYear() || saleDate.getMonth() !== now.getMonth()) return false;
      } else if (dateFilter === "custom") {
        if (startDate) {
          const start = new Date(startDate);
          const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          if (saleDay < startDay) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          if (saleDay > endDay) return false;
        }
      }

      // 3. Product or Service Type Filter (does the sale contain at least one matching item?)
      const hasMatchingItem = s.items.some((item) => {
        // Specific item check
        if (productIdFilter !== "" && item.productId !== productIdFilter) return false;

        // Type check
        if (typeFilter !== "todos") {
          const originalProd = products.find((p) => p.id === item.productId);
          const itemType = originalProd?.type || "produto";
          if (itemType !== typeFilter) return false;
        }

        return true;
      });

      return hasMatchingItem;
    });
  }, [sales, dateFilter, startDate, endDate, typeFilter, productIdFilter, customerIdFilter, operatorIdFilter, storeIdFilter, products, currentUser]);

  // Aggregated Report Metrics based on filters of items in sales
  const stats = useMemo(() => {
    let filteredRevenue = 0;
    let filteredProfit = 0;
    let filteredUnitsCount = 0;
    const productSalesMap: { [name: string]: { qty: number; revenue: number } } = {};

    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        // Check if specific product selected
        if (productIdFilter !== "" && item.productId !== productIdFilter) return;

        const originalProd = products.find((p) => p.id === item.productId);
        const itemType = originalProd?.type || "produto";

        // Check if specific item type matches
        if (typeFilter !== "todos" && itemType !== typeFilter) return;

        const itemRevenue = item.price * item.quantity - item.discount;
        const itemCost = item.costPrice * item.quantity;
        const itemProfit = itemRevenue - itemCost;

        filteredRevenue += itemRevenue;
        filteredProfit += itemProfit;
        filteredUnitsCount += item.quantity;

        if (!productSalesMap[item.productName]) {
          productSalesMap[item.productName] = { qty: 0, revenue: 0 };
        }
        productSalesMap[item.productName].qty += item.quantity;
        productSalesMap[item.productName].revenue += itemRevenue;
      });
    });

    const topSelling = Object.entries(productSalesMap)
      .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      soldToday: filteredRevenue, // Keep this name for easy dynamic mapping in original KPI cards
      invoicesTodayCount: filteredSales.length,
      profitMonth: filteredProfit, // Keep this name for easy dynamic mapping in original KPI cards
      lowStockCount: globalStats.lowStockCount,
      outstandingDebtsAmount: globalStats.outstandingDebtsAmount,
      totalInflow: globalStats.totalInflow,
      totalOutflow: globalStats.totalOutflow,
      netCashflow: globalStats.netCashflow,
      topSelling,
      unitsFiltered: filteredUnitsCount,
    };
  }, [filteredSales, typeFilter, productIdFilter, products, globalStats]);

  // Dynamic Cash flow bars that adapt to filters!
  const chartDays = useMemo(() => {
    const daysData = [];
    const now = new Date();
    // Generate data for the last 6 days including today
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      let dayRevenue = 0;
      sales
        .filter((s) => {
          if (s.status !== "ativa" || !s.date.startsWith(dateStr)) return false;
          // 0. Store Filter
          let finalStoreIdFilter = storeIdFilter;
          if (currentUser && (currentUser.role === "gerente_loja" || currentUser.role === "operador_vendas" || currentUser.role === "vendedor")) {
            finalStoreIdFilter = currentUser.storeId || "loja-a";
          }
          if (finalStoreIdFilter !== "" && s.storeId !== finalStoreIdFilter) return false;

          // Operator & Role security Filter
          if (currentUser && (currentUser.role === "operador_vendas" || currentUser.role === "vendedor")) {
            if (s.cashierId !== currentUser.id) return false;
          } else if (currentUser && currentUser.role === "gerente_loja") {
            if (s.storeId !== currentUser.storeId) return false;
            if (operatorIdFilter !== "" && s.cashierId !== operatorIdFilter) return false;
          } else {
            if (operatorIdFilter !== "" && s.cashierId !== operatorIdFilter) return false;
          }
          return true;
        })
        .forEach((s) => {
          // Check customer filter for this chart day
          if (customerIdFilter !== "") {
            if (customerIdFilter === "geral") {
              if (s.clientId && s.clientId !== "") return;
            } else {
              if (s.clientId !== customerIdFilter) return;
            }
          }
          
          s.items.forEach((item) => {
            if (productIdFilter !== "" && item.productId !== productIdFilter) return;
            
            const originalProd = products.find((p) => p.id === item.productId);
            const itemType = originalProd?.type || "produto";
            if (typeFilter !== "todos" && itemType !== typeFilter) return;
            
            dayRevenue += item.price * item.quantity - item.discount;
          });
        });

      // Show outflows only if general view
      let dayExpenses = 0;
      if (typeFilter === "todos" && productIdFilter === "" && customerIdFilter === "") {
        transactions
          .filter((t) => {
            if (t.type !== "saida" || !t.date.startsWith(dateStr)) return false;
            if (storeIdFilter !== "" && t.storeId !== storeIdFilter) return false;
            return true;
          })
          .forEach((t) => {
            dayExpenses += t.amount;
          });
      }

      const weekdayLabel = d.toLocaleDateString("pt-AO", { weekday: "short" });
      const formattedLabel = weekdayLabel.charAt(0).toUpperCase() + weekdayLabel.slice(1, 3) + ` (${String(d.getDate()).padStart(2, '0')})`;
      daysData.push({
        label: formattedLabel,
        inflow: dayRevenue,
        outflow: dayExpenses,
      });
    }
    return daysData;
  }, [sales, products, transactions, typeFilter, productIdFilter, customerIdFilter, operatorIdFilter, storeIdFilter, currentUser]);

  const finalDetailedSales = useMemo(() => {
    if (!detailSearchQuery) return filteredSales;
    const q = detailSearchQuery.toLowerCase();
    return filteredSales.filter(s => 
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.clientName.toLowerCase().includes(q) ||
      (s.clientNif && s.clientNif.includes(q)) ||
      s.items.some(item => item.productName.toLowerCase().includes(q))
    );
  }, [filteredSales, detailSearchQuery]);

  return (
    <div id="dashboard-view" className="space-y-6 font-sans">
      {/* Módulo de Relatório de Vendas e Filtros Analíticos */}
      <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl shadow-lg space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-805 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-xl border border-amber-400/15">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Relatório Comercial Inteligente</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Filtre vendas, faturamento, lucros e artigos por datas, tipologia ou cliente.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetFilters}
              title="Limpar todos os filtros ativos"
              className="text-xs bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-350 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400" /> Limpar Filtros
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredSales.length === 0}
              title={filteredSales.length === 0 ? "Sem dados para exportar" : "Exportar dados filtrados para Excel/CSV"}
              className="text-xs bg-zinc-950 hover:bg-zinc-850 text-amber-400 border border-amber-400/35 hover:disabled:opacity-40 disabled:touch-none disabled:cursor-not-allowed disabled:opacity-50 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" /> Exportar Excel
            </button>

            <button
              onClick={handleShareWhatsApp}
              disabled={filteredSales.length === 0}
              title="Partilhar sumário das vendas por WhatsApp"
              className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 disabled:opacity-50 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-500" /> Enviar WhatsApp
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              disabled={filteredSales.length === 0}
              title="Visualizar e Imprimir Relatório em PDF"
              className="text-xs bg-amber-400 hover:bg-amber-500 text-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-black transition shadow-md shadow-amber-400/5 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Gerar PDF / Imprimir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* 1. Date filter tabs */}
          <div className="space-y-2">
            <label className="text-zinc-450 text-[10px] font-black uppercase tracking-wider block">Filtro de Datas / Período</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "hoje", label: "Hoje" },
                { id: "semana", label: "Semana" },
                { id: "mes", label: "Mensal" },
                { id: "custom", label: "Customizável" }
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setDateFilter(b.id as any)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border ${
                    dateFilter === b.id
                      ? "bg-amber-400 border-amber-400 text-black font-black shadow-md shadow-amber-400/5"
                      : "bg-zinc-950 border-zinc-805 text-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Products / services type tabs */}
          <div className="space-y-2">
            <label className="text-zinc-450 text-[10px] font-black uppercase tracking-wider block">Tipo de Negócio (Filtro)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "todos", label: "Geral" },
                { id: "produto", label: "Produtos" },
                { id: "servico", label: "Serviços" }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id as any)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border ${
                    typeFilter === t.id
                      ? "bg-amber-400 border-amber-400 text-black font-black shadow-md shadow-amber-400/5"
                      : "bg-zinc-950 border-zinc-805 text-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Specific article dropdown */}
          <div className="space-y-2">
            <label className="text-zinc-450 text-[10px] font-black uppercase tracking-wider block">Artigo Específico</label>
            <select
              value={productIdFilter}
              onChange={(e) => setProductIdFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50 transition"
            >
              <option value="">Todos os Artigos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.type === "servico" ? "⚙️ [Serviço]" : "📦 [Produto]"} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Customer dropdown */}
          <div className="space-y-2">
            <label className="text-zinc-450 text-[10px] font-black uppercase tracking-wider block">Filtrar por Cliente</label>
            <select
              value={customerIdFilter}
              onChange={(e) => setCustomerIdFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50 transition"
            >
              <option value="">Todos os Clientes</option>
              <option value="geral">Cliente Geral & Diversos</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} {c.nif ? `[NIF: ${c.nif}]` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Operator dropdown */}
          <div className="space-y-2">
            <label className="text-zinc-450 text-[10px] font-black uppercase tracking-wider block">Filtrar por Operador</label>
            {currentUser?.role === "admin" || currentUser?.role === "gestor_principal" ? (
              <select
                value={operatorIdFilter}
                onChange={(e) => setOperatorIdFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50 transition cursor-pointer"
              >
                <option value="">Todos os Operadores</option>
                {systemUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                     👤 {u.name} ({u.role === "gestor_principal" ? "Gestor Principal" : u.role === "gerente_loja" ? "Gerente de Loja" : "Vendedor"})
                  </option>
                ))}
              </select>
            ) : currentUser?.role === "gerente_loja" ? (
              <select
                value={operatorIdFilter}
                onChange={(e) => setOperatorIdFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50 transition cursor-pointer"
              >
                <option value="">Todos os Operadores da Loja</option>
                {systemUsers
                  .filter((u) => u.storeId === currentUser.storeId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                       👤 {u.name} ({u.role === "gerente_loja" ? "Gerente" : "Vendedor"})
                    </option>
                  ))}
              </select>
            ) : (
              <select
                disabled
                value={currentUser?.id || ""}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-500 cursor-not-allowed"
              >
                <option value={currentUser?.id || ""}>🔒 Apenas Eu ({currentUser?.name})</option>
              </select>
            )}
          </div>

          {/* 6. Store Branch dropdown filter */}
          <div className="space-y-2">
            <label className="text-zinc-450 text-[10px] font-black uppercase tracking-wider block">Filtrar por Loja / Filial</label>
            {currentUser?.role === "admin" || currentUser?.role === "gestor_principal" ? (
              <select
                value={storeIdFilter}
                onChange={(e) => setStoreIdFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-400/50 transition cursor-pointer"
              >
                <option value="">Todas as Lojas</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            ) : (
              <select
                disabled
                value={storeIdFilter}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-500 cursor-not-allowed"
              >
                <option value={storeIdFilter}>
                  📍 {branches.find(b => b.id === storeIdFilter)?.name || "Esta Loja"}
                </option>
              </select>
            )}
          </div>
        </div>

        {/* Real-time custom datepicker fields under custom date range selection */}
        {dateFilter === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-850 pt-4 animate-fadeIn">
            <div className="space-y-1.5">
              <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block">De: Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block">Até: Data Final (Inclusive)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>
        )}

        {/* Active scope feedback badge indicator line */}
        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-850 pt-4 text-[10px] text-zinc-400">
          <span className="font-bold text-zinc-500 uppercase tracking-wide">Foco Ativo:</span>
          <span className="bg-zinc-950 border border-zinc-805 px-2 py-0.5 rounded text-amber-400 font-mono font-medium">
            Data: {dateFilter === "hoje" ? "Hoje" : dateFilter === "semana" ? "Esta Semana" : dateFilter === "mes" ? "Este Mês" : `Intervalo [${startDate || "N/A"} a ${endDate || "N/A"}]`}
          </span>
          <span className="bg-zinc-950 border border-zinc-805 px-2 py-0.5 rounded text-zinc-300 font-mono font-medium">
            Loja: {storeIdFilter === "" ? "Consolidado (Todas as Lojas)" : branches.find(b => b.id === storeIdFilter)?.name || "Filial"}
          </span>
          <span className="bg-zinc-950 border border-zinc-805 px-2 py-0.5 rounded text-zinc-300 font-mono font-medium">
            Tipo: {typeFilter === "todos" ? "Todos os Artigos" : typeFilter === "produto" ? "Apenas Produtos" : "Apenas Serviços"}
          </span>
          {productIdFilter && (
            <span className="bg-zinc-950 border border-zinc-805 px-2 py-0.5 rounded text-zinc-300 font-mono font-medium">
              Item: {products.find(p => p.id === productIdFilter)?.name || "Artigo"}
            </span>
          )}
          {customerIdFilter && (
            <span className="bg-zinc-950 border border-zinc-805 px-2 py-0.5 rounded text-zinc-300 font-mono font-medium">
              Cliente: {customerIdFilter === "geral" ? "Cliente Geral" : customers.find(c => c.id === customerIdFilter)?.name || "Cliente"}
            </span>
          )}
          <span className="ml-auto text-zinc-450 text-[10px] font-bold font-mono">
            {filteredSales.length} {filteredSales.length === 1 ? "Factura correspondente" : "Facturas correspondentes"}
          </span>
        </div>
      </div>

      {/* Alert Banner for Low Stock */}
      {stats.lowStockCount > 0 && (
        <div id="low-stock-banner" className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-black rounded-xl">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Alerta de Rotura de Estoque!</p>
              <p className="text-zinc-400 text-xs mt-0.5">
                Existem <span className="font-extrabold text-amber-400">{stats.lowStockCount} produtos</span> operando no limite ou abaixo do estoque mínimo de segurança.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg">
            Revisar Inventário
          </span>
        </div>
      )}

      {/* Main KPI Row representing dynamic Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtered Period Revenue */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group shadow-md shadow-black/30">
          <div className="absolute right-4 top-4 text-amber-400/20 group-hover:text-amber-400/30 transition-colors">
            <TrendingUp className="w-12 h-12" />
          </div>
          <span className="text-zinc-500 text-xs font-bold tracking-wider uppercase block">Faturação do Período</span>
          <h3 className="text-2xl font-black text-white mt-1.5 font-mono">
            {formatKwanza(stats.soldToday)}
          </h3>
          <div className="flex items-center gap-1.5 mt-3 text-emerald-400 text-xs font-medium">
            <span className="bg-emerald-400/10 px-1.5 py-0.5 rounded-md font-bold">{stats.invoicesTodayCount}</span>
            <span className="text-zinc-400">faturas geradas no escopo</span>
          </div>
        </div>

        {/* Filtered Profit Estimate */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group shadow-md shadow-black/30">
          <div className="absolute right-4 top-4 text-amber-400/20 group-hover:text-amber-400/30 transition-colors">
            <DollarSign className="w-12 h-12" />
          </div>
          <span className="text-zinc-500 text-xs font-bold tracking-wider uppercase block">Lucro Líquido do Período</span>
          <h3 className="text-2xl font-black text-amber-400 mt-1.5 font-mono">
            {formatKwanza(stats.profitMonth)}
          </h3>
          <div className="flex items-center gap-1.5 mt-3 text-zinc-400 text-xs font-medium">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Deduzido do preço de custo</span>
          </div>
        </div>

        {/* Filtered Volume Counter */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group shadow-md shadow-black/30">
          <div className="absolute right-4 top-4 text-zinc-500/10 group-hover:text-amber-400/20 transition-colors">
            <Layers className="w-12 h-12" />
          </div>
          <span className="text-zinc-500 text-xs font-bold tracking-wider uppercase block">Volume Transacionado</span>
          <h3 className="text-2xl font-black mt-1.5 font-mono text-white">
            {stats.unitsFiltered} <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans">un/srv</span>
          </h3>
          <div className="flex items-center gap-1 mt-3 text-zinc-400 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Volume total de itens vendidos</span>
          </div>
        </div>

        {/* Dynamic Credit Debt Balance (Always Live for Store Management) */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group shadow-md shadow-black/30">
          <div className="absolute right-4 top-4 text-zinc-500/10 group-hover:text-amber-400/20 transition-colors">
            <Users className="w-12 h-12" />
          </div>
          <span className="text-zinc-500 text-xs font-bold tracking-wider uppercase block">Saldo Total de Fiados</span>
          <h3 className="text-2xl font-black text-rose-300 mt-1.5 font-mono">
            {formatKwanza(stats.outstandingDebtsAmount)}
          </h3>
          <div className="flex items-center gap-1.5 mt-3 text-zinc-400 text-xs font-medium">
            <span>{debts.filter(d => d.status === "pendente").length} contas em mora por amortizar</span>
          </div>
        </div>
      </div>

      {/* Graphical Section & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Timeline Card */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-lg shadow-black/20">
          <div>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Fluxo de Caixa (Esta Semana)</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Visão analítica de Entradas vs Saídas na moeda nacional Kwanza (AOA)</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Entradas
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-zinc-600 inline-block" /> Saídas
                </span>
              </div>
            </div>

            {/* Custom Responsive Quick SVG chart block to prevent high charts dependency breaks */}
            <div className="w-full h-56 pt-2 select-none relative">
              <svg className="w-full h-full" viewBox="0 0 540 200" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="50" x2="540" y2="50" stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="100" x2="540" y2="100" stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="150" x2="540" y2="150" stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" />

                {/* Bars Chart - Dynamic render simulation */}
                {chartDays.map((d, index) => {
                  const x = 35 + index * 85;
                  // Inflow representation scaled (max is 30,000 for visibility of standard sales)
                  const scaledInflow = Math.min(130, (d.inflow / 35000) * 110);
                  const inflowHeight = d.inflow > 0 ? Math.max(8, scaledInflow) : 1;
                  const inflowY = 170 - inflowHeight;

                  // Outflow representation scaled (max was initial outflow 140,000 scaled down)
                  const scaledOutflow = Math.min(130, (d.outflow / 230000) * 125);
                  const outflowHeight = d.outflow > 0 ? Math.max(8, scaledOutflow) : 1;
                  const outflowY = 170 - outflowHeight;

                  return (
                    <g key={index}>
                      {/* Inflow Bar */}
                      {d.inflow > 0 && (
                        <rect
                          x={x}
                          y={inflowY}
                          width="16"
                          height={inflowHeight}
                          rx="4"
                          fill="#facc15"
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      )}
                      
                      {/* Outflow Bar */}
                      {d.outflow > 0 && (
                        <rect
                          x={x + 20}
                          y={outflowY}
                          width="16"
                          height={outflowHeight}
                          rx="4"
                          fill="#52525b"
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      )}

                      {/* X Axis Label */}
                      <text x={x + 10} y="192" fill="#71717a" fontSize="10" className="font-mono text-center" textAnchor="middle">
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-400/10 text-amber-400 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Estoque Disponível em Caixa</span>
                <span className="text-xs font-bold text-white font-mono">{formatKwanza(stats.totalInflow - stats.totalOutflow)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Despesas Operacionais Pagas</span>
                <span className="text-xs font-bold text-zinc-300 font-mono">{formatKwanza(stats.totalOutflow)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Demanded Products Widget */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Produtos Mais Vendidos</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Por volume de unidades transacionadas.</p>

            <div className="mt-5 space-y-4">
              {stats.topSelling.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-zinc-600 text-xs italic">Nenhuma venda registada até ao momento.</span>
                </div>
              ) : (
                stats.topSelling.map((p, index) => {
                  const maxQty = Math.max(...stats.topSelling.map(item => item.qty));
                  const percentageWidth = maxQty > 0 ? (p.qty / maxQty) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-zinc-300">
                        <span className="font-semibold truncate max-w-[170px] text-white">{p.name}</span>
                        <span className="font-mono text-zinc-500 font-bold">{p.qty} un • <span className="text-amber-400">{formatKwanza(p.revenue)}</span></span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${percentageWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-400 flex items-center gap-2 mt-4">
            <span className="inline-block shrink-0 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Métricas geradas em tempo real pelas vendas dos seus canais activos.</span>
          </div>
        </div>
      </div>

      {/* Recents Lists Split Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Transactions list */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center justify-between mb-4">
            <span>Últimos Lançamentos</span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Fluxo de Caixa</span>
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {transactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="bg-zinc-950/60 border border-zinc-800/40 rounded-xl p-3 flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${tx.type === "entrada" ? "bg-amber-400/10 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
                    {tx.type === "entrada" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="font-semibold block text-white">{tx.description}</span>
                    <span className="text-zinc-500 text-[10px] font-medium tracking-normal mt-0.5 block">{tx.category} • {new Date(tx.date).toLocaleDateString("pt-AO")}</span>
                  </div>
                </div>
                <span className={`font-mono font-bold ${tx.type === "entrada" ? "text-amber-400" : "text-zinc-400"}`}>
                  {tx.type === "entrada" ? "+" : "-"}{formatKwanza(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Client Receivables Overview */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-md shadow-black/10">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center justify-between mb-4">
            <span>Dívidas de Clientes Pendentes</span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Crédito</span>
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {debts.filter(d => d.status === "pendente").length === 0 ? (
              <div className="text-center py-10">
                <span className="text-zinc-650 text-xs italic block">Nenhum cliente com dívida pendente. Muito bom!</span>
              </div>
            ) : (
              debts.filter(d => d.status === "pendente").slice(0, 4).map((d) => (
                <div key={d.id} className="bg-zinc-950/60 border border-zinc-800/40 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">{d.customerName}</span>
                    <span className="text-zinc-500 text-[10px] mt-0.5 block">Desde {new Date(d.date).toLocaleDateString("pt-AO")}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-red-400 block">{formatKwanza(d.currentAmount)}</span>
                    <span className="text-[9px] bg-red-400/15 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">Mora Activa</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Seção Detalhada de Transações do Período */}
      <div className="bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> Detalhamento das Operações do Período
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5">Visão analítica de cada fatura e item comercializado do escopo atual.</p>
          </div>
          
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Pesquisar fatura, cliente ou item..."
              value={detailSearchQuery}
              onChange={(e) => setDetailSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-400 placeholder-zinc-650 transition"
            />
          </div>
        </div>

        {finalDetailedSales.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950/45 rounded-xl border border-dashed border-zinc-800/80">
            <Info className="w-8 h-8 text-zinc-750 mx-auto mb-2.5" />
            <p className="text-zinc-400 text-xs font-semibold">Nenhum registo detalhado corresponde aos filtros ou pesquisa actual.</p>
            <p className="text-zinc-600 text-[10px] mt-1">Altere o escopo do foco ativo ou limpe os filtros para visualizar dados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-850">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-850 text-zinc-400 uppercase text-[9px] font-black tracking-wider">
                  <th className="py-3 px-4">Documento</th>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Adquirente / Cliente</th>
                  <th className="py-3 px-4">Itens Comercializados</th>
                  <th className="py-3 px-4">Modo Pagamento</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right text-rose-300">Desconto</th>
                  <th className="py-3 px-4 text-right text-amber-400">Total Líquido</th>
                  <th className="py-3 px-4 text-right text-emerald-400">Lucro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 bg-zinc-900/40">
                {finalDetailedSales.map((sale) => {
                  const itemMargin = sale.total > 0 ? (sale.profit / sale.total) * 100 : 0;
                  return (
                    <tr key={sale.id} className="hover:bg-zinc-950/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-zinc-800 border border-zinc-700 text-zinc-350 px-1 py-0.5 rounded text-[8px] font-mono leading-none">{sale.documentType}</span>
                          <span>{sale.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono whitespace-nowrap">
                        {new Date(sale.date).toLocaleString("pt-AO", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-200">{sale.clientName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{sale.clientNif || "Consumidor Final"}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="flex flex-wrap gap-1">
                          {sale.items.map((it, idx) => (
                            <span key={idx} className="bg-zinc-950/85 text-[10px] text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded flex items-center gap-1">
                              {it.productName} <span className="text-amber-400 font-mono font-bold">x{it.quantity}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                          sale.paymentMethod === "dinheiro" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" :
                          sale.paymentMethod === "transferencia" ? "bg-sky-400/10 text-sky-400 border-sky-400/20" :
                          sale.paymentMethod === "multicaixa" ? "bg-indigo-400/10 text-indigo-400 border-indigo-400/20" :
                          sale.paymentMethod === "mcx_express" ? "bg-purple-400/10 text-purple-400 border-purple-400/20" :
                          "bg-amber-400/10 text-amber-400 border-amber-400/20"
                        }`}>
                          {sale.paymentMethod === "mcx_express" ? "MCX Express" : sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-400 font-medium">
                        {formatKwanza(sale.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-300">
                        {sale.discount > 0 ? `-${formatKwanza(sale.discount)}` : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-400 font-bold">
                        {formatKwanza(sale.total)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono text-emerald-400 font-bold">{formatKwanza(sale.profit)}</div>
                        <div className="text-[9px] text-zinc-500 font-mono mt-0.5">Margem: {itemMargin.toFixed(0)}%</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de pré-visualização e impressão de Relatório em PDF */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #print-section-area, #print-section-area * {
                visibility: visible !important;
              }
              #print-section-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: black !important;
                padding: 1.5rem !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-zinc-950/80 px-6 py-4 border-b border-zinc-850 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Visualização do Relatório Oficial (PDF)</h3>
                  <p className="text-zinc-500 text-[11px]">Gerado de acordo com seus filtros comerciais ativos.</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 hover:bg-zinc-850 text-zinc-450 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Area Preview */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 bg-zinc-950/30 no-print">
              <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-450 leading-relaxed">
                  <strong className="text-amber-400 block font-bold mb-0.5">Dica de Exportação Inteligente:</strong>
                  Ao clicar no botão "Confirmar e Imprimir" abaixo, o sistema chamará as diretivas oficiais do navegador. No painel de destino, selecione <strong className="text-zinc-200">"Guardar como PDF / Salvar como PDF"</strong> para gerar o arquivo digital exportado com paginação limpa.
                </div>
              </div>

              {/* The high-contrast container mimicking beautiful white paper layout */}
              <div 
                id="print-section-area" 
                className="bg-white text-zinc-900 p-8 rounded-xl shadow-md border border-zinc-200 font-sans leading-normal max-w-full mx-auto"
              >
                {/* Printable Header */}
                <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-5">
                  <div>
                    <h1 className="text-2xl font-black text-zinc-950 leading-tight tracking-tight">RELATÓRIO COMERCIAL DE VENDAS</h1>
                    <p className="text-xs text-zinc-700 font-bold uppercase tracking-wider mt-1">EMITIDO POR: GESTÃO COMERCIAL CERTIFICADA</p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Data de emissão: {new Date().toLocaleString("pt-AO")}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-zinc-950 bg-zinc-100 border border-zinc-300 py-1 px-2.5 rounded uppercase inline-block font-sans">
                      Sistema Comercial
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">Luanda, Angola</p>
                  </div>
                </div>

                {/* Scope Information */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 my-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-4">
                  <div>
                    <span className="text-zinc-500 font-black uppercase text-[9px] block">Período Selecionado</span>
                    <span className="font-bold text-zinc-850">
                      {dateFilter === "hoje" ? "Hoje" : dateFilter === "semana" ? "Esta Semana" : dateFilter === "mes" ? "Este Mês" : `Customizável [De ${startDate || "Abertura"} até ${endDate || "Atalho"}]`}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-black uppercase text-[9px] block">Filtro de Categoria</span>
                    <span className="font-bold text-zinc-850">
                      {typeFilter === "todos" ? "Todos os Itens (Produtos e Serviços)" : typeFilter === "produto" ? "Somente Produtos" : "Somente Serviços"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-black uppercase text-[9px] block">Artigo Restrito</span>
                    <span className="font-bold text-zinc-805">
                      {productIdFilter ? products.find(p => p.id === productIdFilter)?.name : "Sem Restrições"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-black uppercase text-[9px] block">Entidade/Adquirente</span>
                    <span className="font-bold text-zinc-805">
                      {customerIdFilter ? (customerIdFilter === "geral" ? "Cliente Geral" : customers.find(c => c.id === customerIdFilter)?.name) : "Todos os Clientes"}
                    </span>
                  </div>
                </div>

                {/* Printable Totals row */}
                <div className="grid grid-cols-3 gap-3 border-t border-b border-zinc-200 py-4 my-4">
                  <div className="text-center border-r border-zinc-200">
                    <span className="text-zinc-650 block text-[9px] font-black uppercase tracking-wider">Faturação Total</span>
                    <span className="text-lg font-black text-zinc-950 font-mono block mt-0.5">{formatKwanza(stats.soldToday)}</span>
                    <span className="text-[10px] text-zinc-500">{stats.invoicesTodayCount} faturas validadas</span>
                  </div>
                  <div className="text-center border-r border-zinc-200">
                    <span className="text-zinc-650 block text-[9px] font-black uppercase tracking-wider">Lucro Comercial Líquido</span>
                    <span className="text-lg font-black text-zinc-900 font-mono block mt-0.5">{formatKwanza(stats.profitMonth)}</span>
                    <span className="text-[10px] text-zinc-500">Deduzido custo de reposição</span>
                  </div>
                  <div className="text-center">
                    <span className="text-zinc-650 block text-[9px] font-black uppercase tracking-wider">Volume Transacionado</span>
                    <span className="text-lg font-black text-zinc-950 font-mono block mt-0.5">{stats.unitsFiltered} un/srv</span>
                    <span className="text-[10px] text-zinc-500">Fluxo físico de estoques</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="mt-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 mb-3 block border-l-2 border-zinc-950 pl-2">
                    RELAÇÃO DE FATURAS RELACIONADAS
                  </h3>
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 border-b-2 border-zinc-300 text-zinc-700 uppercase font-bold text-[9px]">
                        <th className="py-2.5 px-3">Nº Fatura</th>
                        <th className="py-2.5 px-3">Data/Hora</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Itens Discriminados</th>
                        <th className="py-2.5 px-3">Método Pagamento</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-3 text-right">Desconto</th>
                        <th className="py-2.5 px-3 text-right font-black">Total Líquido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-250">
                      {filteredSales.map((sale) => (
                        <tr key={sale.id} className="text-zinc-850">
                          <td className="py-2.5 px-3 font-mono font-bold text-zinc-950">{sale.invoiceNumber}</td>
                          <td className="py-2.5 px-3 text-zinc-600 font-mono whitespace-nowrap">
                            {new Date(sale.date).toLocaleString("pt-AO", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            {sale.clientName}
                            <span className="text-[9px] text-zinc-500 block font-mono">NIF: {sale.clientNif || "Consumidor Final"}</span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px] leading-snug">
                            {sale.items.map((it, i) => (
                              <div key={i} className="text-zinc-650">
                                - {it.productName} <span className="font-bold text-zinc-805">x{it.quantity}</span>
                              </div>
                            ))}
                          </td>
                          <td className="py-2.5 px-3 uppercase text-[9px] font-bold text-zinc-750 font-mono">
                            {sale.paymentMethod}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-600">
                            {formatKwanza(sale.subtotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-600">
                            {sale.discount > 0 ? `-${formatKwanza(sale.discount)}` : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950 font-semibold">
                            {formatKwanza(sale.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Report Signature Footer */}
                <div className="mt-12 pt-8 border-t border-dashed border-zinc-300 grid grid-cols-2 gap-6 text-center text-xs">
                  <div>
                    <div className="w-48 border-b border-zinc-500 mx-auto h-8" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-2">ASSINATURA DO OPERADOR</p>
                  </div>
                  <div>
                    <div className="w-48 border-b border-zinc-500 mx-auto h-8" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-2">DSTR. COMERCIAL / AUDITORIA</p>
                  </div>
                </div>

                {/* Certified Footnote */}
                <p className="text-center text-[8px] text-zinc-500 mt-10 font-mono uppercase tracking-wider">
                  Processado por Software de Facturação Certificado pela AGT • Relatório Comercial Informatizado
                </p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-zinc-950/90 px-6 py-4 border-t border-zinc-850 flex items-center justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl font-bold transition"
              >
                Voltar e Ajustar Filtros
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="text-xs bg-amber-400 hover:bg-amber-500 text-black px-5 py-2.5 rounded-xl font-black flex items-center gap-1.5 transition shadow-lg shadow-amber-400/5 select-none"
              >
                <Printer className="w-4 h-4" /> Confirmar e Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
