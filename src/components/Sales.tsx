/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { store } from "../services/store";
import { Product, Customer, Sale, SaleItem } from "../types";
import {
  ShoppingCart,
  Search,
  Check,
  Trash2,
  Trash,
  ChevronRight,
  Printer,
  History,
  XCircle,
  PiggyBank,
  Ban,
  UserCheck,
  Smartphone,
} from "lucide-react";
import InvoiceModal from "./InvoiceModal";

export default function Sales() {
  const [products, setProducts] = useState(() => store.getProducts());
  const [customers, setCustomers] = useState(() => store.getCustomers());
  const [sales, setSales] = useState(() => store.getSales());
  const [settings, setSettings] = useState(() => store.getSettings());

  // Listen for changes
  useMemo(() => {
    const unsubscribe = store.subscribe(() => {
      setProducts([...store.getProducts()]);
      setCustomers([...store.getCustomers()]);
      setSales([...store.getSales()]);
      setSettings({ ...store.getSettings() });
    });
    return () => unsubscribe();
  }, []);

  // UI state
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const [searchInvoiceQuery, setSearchInvoiceQuery] = useState("");

  const currentUser = useMemo(() => store.getCurrentUser(), []);
  const systemUsers = useMemo(() => store.getUsers(), []);

  // Invoice History Advanced Filters
  const [historyDateFilter, setHistoryDateFilter] = useState<"todos" | "hoje" | "semana" | "mes">("todos");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"todos" | "produto" | "servico">("todos");
  const [historyCustomerIdFilter, setHistoryCustomerIdFilter] = useState<string>("");
  const [historyOperatorIdFilter, setHistoryOperatorIdFilter] = useState<string>("");

  // Sale cart state
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<"dinheiro" | "transferencia" | "multicaixa" | "misto" | "mcx_express">("dinheiro");
  const [receivedAmount, setReceivedAmount] = useState<string>("");

  // Fiscal document and MCX integration states
  const [documentType, setDocumentType] = useState<"FR" | "FP" | "OR" | "FT" | "FG">("FR");
  const [mcxPhone, setMcxPhone] = useState("");
  const [mcxRef, setMcxRef] = useState("");
  const [isTriggeringMcx, setIsTriggeringMcx] = useState(false);
  const [mcxStep, setMcxStep] = useState(1);

  // Invoice view trigger
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<Sale | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Sale | null>(null);

  // Cancellation state
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // 1. POS Mechanics
  // Filter products for quick search
  const searchedProducts = useMemo(() => {
    if (!searchProductQuery) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
        p.code.includes(searchProductQuery)
    );
  }, [products, searchProductQuery]);

  // Quick add to cart
  const handleAddToCart = (product: Product) => {
    const isService = product.type === "servico";
    if (!isService && product.stock <= 0) {
      triggerToast("Erro: Produto esgotado.");
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    const inCartQty = existingIndex !== -1 ? cart[existingIndex].quantity : 0;

    if (!isService && inCartQty + 1 > product.stock) {
      triggerToast("Aviso: Quantidade adicionada ultrapassa o estoque disponível.");
      return;
    }

    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.sellPrice,
        costPrice: product.purchasePrice,
        discount: 0,
      };
      setCart([...cart, newItem]);
    }
    setSearchProductQuery(""); // reset search input
  };

  const handleUpdateQtyInCart = (productId: string, delta: number) => {
    const prodRef = products.find((p) => p.id === productId);
    if (!prodRef) return;

    const isService = prodRef.type === "servico";

    const updatedCart = cart
      .map((item) => {
        if (item.productId === productId) {
          const finalQty = item.quantity + delta;
          if (!isService && finalQty > prodRef.stock) {
            triggerToast("Aviso: Acima das unidades atualmente em estoque.");
            return item;
          }
          return { ...item, quantity: finalQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    setCart(updatedCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  // Calculations for current cart
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity - item.discount, 0);
  }, [cart]);

  const globalDiscount = useMemo(() => {
    if (currentUser?.role !== "admin") return 0;
    const dVal = parseFloat(discountAmount);
    return isNaN(dVal) ? 0 : dVal;
  }, [discountAmount, currentUser]);

  const cartTotalWithDiscount = useMemo(() => {
    return Math.max(0, cartSubtotal - globalDiscount);
  }, [cartSubtotal, globalDiscount]);

  const vatAmountCalculated = useMemo(() => {
    // Standard Angolan IVA is 14%
    const rate = settings.taxRate || 14;
    return (cartTotalWithDiscount * rate) / (100 + rate);
  }, [cartTotalWithDiscount, settings.taxRate]);

  // Troco / Change calculations
  const cashChangeCalculated = useMemo(() => {
    if (paymentMethod !== "dinheiro") return 0;
    const rAmt = parseFloat(receivedAmount);
    if (isNaN(rAmt) || rAmt < cartTotalWithDiscount) return 0;
    return rAmt - cartTotalWithDiscount;
  }, [receivedAmount, cartTotalWithDiscount, paymentMethod]);

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerToast("Erro: O carrinho de compras está vazio.");
      return;
    }

    if (paymentMethod === "dinheiro") {
      const rAmt = parseFloat(receivedAmount);
      if (isNaN(rAmt) || rAmt < cartTotalWithDiscount) {
        triggerToast("Erro: O valor inserido como recebido é inferior ao total cobrado.");
        return;
      }
    }

    if (paymentMethod === "mcx_express" && !mcxPhone.trim()) {
      triggerToast("Erro: Por favor, indique o número de telemóvel associado ao Multicaixa Express.");
      return;
    }

    const matchedClient = customers.find((c) => c.id === selectedClientId);

    const checkOutPayload = {
      items: cart,
      subtotal: cartSubtotal,
      discount: globalDiscount,
      tax: parseFloat(vatAmountCalculated.toFixed(2)),
      total: cartTotalWithDiscount,
      paymentMethod,
      receivedAmount: paymentMethod === "dinheiro" ? parseFloat(receivedAmount) : cartTotalWithDiscount,
      changeAmount: parseFloat(cashChangeCalculated.toFixed(2)),
      clientId: matchedClient?.id,
      clientName: matchedClient ? matchedClient.name : "Cliente Geral",
      clientNif: matchedClient ? matchedClient.nif : undefined,
      documentType,
      mcxPhone: paymentMethod === "mcx_express" ? mcxPhone : undefined,
      mcxRef: paymentMethod === "mcx_express" ? (mcxRef || `EMIS-${Math.floor(100000 + Math.random() * 900000)}`) : undefined,
    };

    if (paymentMethod === "mcx_express") {
      setIsTriggeringMcx(true);
      setMcxStep(1);
      // Wait 1.2s -> push sent
      setTimeout(() => {
        setMcxStep(2); // A aguardar confirmação pelo cliente...
        setTimeout(() => {
          setMcxStep(3); // Pagamento autorizado! Gerando documentos fiscais...
          setTimeout(() => {
            const finalInvoice = store.performSale(checkOutPayload);
            setLastCreatedInvoice(finalInvoice);
            setPreviewInvoice(finalInvoice); // automatically preview standard invoice format on screen!
            triggerToast("Factura liquidada com Multicaixa Express emitida em tempo real!");

            // Clear cart states & close MCX terminal popup
            setCart([]);
            setSelectedClientId("");
            setDiscountAmount("0");
            setReceivedAmount("");
            setMcxPhone("");
            setMcxRef("");
            setIsTriggeringMcx(false);
          }, 1205);
        }, 1800);
      }, 1200);
    } else {
      const finalInvoice = store.performSale(checkOutPayload);
      setLastCreatedInvoice(finalInvoice);
      setPreviewInvoice(finalInvoice); // automatically preview standard invoice format on screen!
      triggerToast("Factura registada e emitida em tempo real!");

      // Clear cart states
      setCart([]);
      setSelectedClientId("");
      setDiscountAmount("0");
      setReceivedAmount("");
    }
  };

  // Voiding sales cancellation handler
  const handlePerformCancelInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingSale || !cancelReason) return;

    const ok = store.cancelSale(cancellingSale.id, cancelReason);
    if (ok) {
      triggerToast("Factura anulada e stocks restabelecidos!");
      setCancellingSale(null);
      setCancelReason("");
    } else {
      triggerToast("Erro: Esta venda já se encontra cancelada.");
    }
  };

  // Search sales invoices history
  const filteredSalesInvoices = useMemo(() => {
    return sales.filter((s) => {
      // Role & Operator permission filter
      if (currentUser && currentUser.role !== "admin") {
        if (s.cashierId !== currentUser.id) return false;
      } else {
        if (historyOperatorIdFilter !== "" && s.cashierId !== historyOperatorIdFilter) return false;
      }

      // 1. Live text search
      const query = searchInvoiceQuery.toLowerCase();
      const textMatches = (
        s.invoiceNumber.toLowerCase().includes(query) ||
        s.clientName.toLowerCase().includes(query) ||
        (s.clientNif && s.clientNif.includes(query))
      );
      if (!textMatches) return false;

      // 2. Customer Filter
      if (historyCustomerIdFilter !== "") {
        if (historyCustomerIdFilter === "geral") {
          if (s.clientId && s.clientId !== "") return false;
        } else {
          if (s.clientId !== historyCustomerIdFilter) return false;
        }
      }

      // 3. Date Filter
      if (historyDateFilter !== "todos") {
        const saleDate = new Date(s.date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const saleDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());

        if (historyDateFilter === "hoje") {
          if (saleDay.getTime() !== today.getTime()) return false;
        } else if (historyDateFilter === "semana") {
          const currentDayOfWeek = now.getDay();
          const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() + diffToMonday);

          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);

          if (saleDay < startOfWeek || saleDay >= tomorrow) return false;
        } else if (historyDateFilter === "mes") {
          if (saleDate.getFullYear() !== now.getFullYear() || saleDate.getMonth() !== now.getMonth()) return false;
        }
      }

      // 4. Products / Services inside items type Filter
      if (historyTypeFilter !== "todos") {
        const hasMatchingItem = s.items.some((item) => {
          const originalProd = products.find((p) => p.id === item.productId);
          const itemType = originalProd?.type || "produto";
          return itemType === historyTypeFilter;
        });
        if (!hasMatchingItem) return false;
      }

      return true;
    });
  }, [sales, searchInvoiceQuery, historyDateFilter, historyTypeFilter, historyCustomerIdFilter, historyOperatorIdFilter, products, currentUser]);

  const formatKwanza = (v: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
    }).format(v);
  };

  return (
    <div id="sales-pos-view" className="space-y-6 font-sans">
      {toast && (
        <div className="fixed top-8 right-8 z-50 bg-zinc-900 border border-amber-500 text-amber-300 text-xs px-4 py-3 rounded-xl shadow-2xl font-bold">
          {toast}
        </div>
      )}

      {/* POS Top selector headers */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl">
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-850">
          <button
            id="pos-menu-btn"
            onClick={() => setActiveTab("pos")}
            className={`py-1.5 px-3.5 text-xs font-extrabold rounded-md flex items-center gap-1.5 transition ${
              activeTab === "pos" ? "bg-amber-400 text-black shadow-md" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Venda Rápida (POS)
          </button>
          <button
            id="hist-menu-btn"
            onClick={() => setActiveTab("history")}
            className={`py-1.5 px-3.5 text-xs font-extrabold rounded-md flex items-center gap-1.5 transition ${
              activeTab === "history" ? "bg-amber-400 text-black shadow-md" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <History className="w-4 h-4" /> Histórico de Facturação
          </button>
        </div>

        <span className="text-[10px] bg-zinc-950 border border-zinc-850 px-2 py-1 rounded text-zinc-500 font-mono">
          Operador Activo: {store.getCurrentUser()?.name || "Administrador"}
        </span>
      </div>

      {activeTab === "pos" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: search item catalog layout */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-500">Registon e Pesquisa de Artigos</h3>
                <p className="text-zinc-400 text-xs mt-0.5">Introduza o código de barras ou digite o nome do artigo abaixo.</p>
              </div>

              {/* Dynamic incremental lookup input */}
              <div className="relative">
                <Search className="absolute inset-y-0 left-3 flex items-center text-zinc-500 w-4 h-4 my-auto" />
                <input
                  type="text"
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  placeholder="Pesquise por nome, SKU ou Código (ex: Arroz, Óleo, Sabonete)..."
                  className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-zinc-700/80 focus:outline-none focus:border-amber-440 transition"
                />
              </div>

              {/* Incremental lookup suggestions panel */}
              {searchProductQuery && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-h-60 overflow-y-auto divide-y divide-zinc-850">
                  {searchedProducts.length === 0 ? (
                    <div className="p-4 text-center text-zinc-600 text-xs">Nenhum artigo encontrado para esta consulta.</div>
                  ) : (
                    searchedProducts.map((p) => (
                      <div
                        key={p.id}
                        id={`product-row-${p.id}`}
                        onClick={() => handleAddToCart(p)}
                        className="p-3 hover:bg-zinc-900 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white block">{p.name}</span>
                            {p.type === "servico" && (
                              <span className="text-[8px] uppercase tracking-widest font-black bg-amber-400/10 text-amber-400 px-1 py-0.2 rounded border border-amber-400/20">Serviço</span>
                            )}
                          </div>
                          <span className="text-zinc-500 text-[10px] block mt-0.5">SKU: {p.code} • Categoria: {p.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-white font-bold block">{formatKwanza(p.sellPrice)}</span>
                          {p.type === "servico" ? (
                            <span className="text-[9px] uppercase font-bold text-zinc-500">Ilimitado</span>
                          ) : (
                            <span className={`text-[9px] uppercase font-bold ${p.stock <= p.minStock ? "text-red-400" : "text-zinc-400"}`}>
                              Reserva: {p.stock} un
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quick checkout hot items layout */}
            <div className="bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-450 mb-3 flex items-center gap-1">
                <span>⚡</span> Artigos de Rápida Saída
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.slice(0, 6).map((p) => {
                  return (
                    <button
                      key={p.id}
                      id={`hot-prod-${p.id}`}
                      onClick={() => handleAddToCart(p)}
                      className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-850/80 p-3 rounded-xl text-left hover:border-amber-400/40 transition flex flex-col justify-between h-24 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="font-bold block text-white text-xs truncate max-w-[80%]">{p.name}</span>
                          {p.type === "servico" && (
                            <span className="text-[7px] text-amber-400 font-black border border-amber-400/25 px-0.8 py-0.2 rounded shrink-0 leading-none">SRV</span>
                          )}
                        </div>
                        <span className="text-zinc-650 text-[9px] mt-0.5 block truncate">{p.category}</span>
                      </div>
                      <div className="flex items-center justify-between w-full border-t border-zinc-900 pt-1.5 mt-1.5">
                        <span className="font-mono text-[11px] font-bold text-amber-400">{formatKwanza(p.sellPrice)}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {p.type === "servico" ? "∞" : p.stock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: POS cart drawer and check out details */}
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Carrinho de Compras
            </h3>

            {/* Cart listing */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 border border-zinc-850/50 rounded-xl border-dashed">
                  <span className="text-zinc-550 text-xs italic block">Carrinho de compras vazio. Adicione artigos.</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                    <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                      <span className="font-bold text-white block truncate">{item.productName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-zinc-400">{formatKwanza(item.price)}/un</span>
                        <span className="text-[10px] text-zinc-600 font-mono">Subt: {formatKwanza(item.price * item.quantity)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Qty modifiers */}
                      <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
                        <button
                          onClick={() => handleUpdateQtyInCart(item.productId, -1)}
                          className="w-5 h-5 flex items-center justify-center text-xs text-zinc-400 hover:text-white"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-zinc-200 px-2">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQtyInCart(item.productId, 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs text-zinc-400 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.productId)}
                        className="text-zinc-550 hover:text-red-400 hover:bg-red-400/5 p-1.5 border border-zinc-850 rounded-lg transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* General form: Client & discounts */}
            <form onSubmit={handleCompleteSale} id="pos-checkout-form" className="border-t border-zinc-800 pt-4 space-y-3.5">
              {/* Linked Customer */}
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Cliente Receptor / Emitir para: *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="">Cliente Geral (Não Registado)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.nif ? `[NIF: ${c.nif}]` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tipo de Documento Fiscal */}
                <div>
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Tipo Documento *</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="FR">Factura Recibo (Liquidada)</option>
                    <option value="FP">Factura Pro-Forma</option>
                    <option value="OR">Orçamento Oficial</option>
                    <option value="FT">Factura de Cobrança (Prazo)</option>
                    <option value="FG">Factura Global</option>
                  </select>
                </div>

                {/* Payments */}
                <div>
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Meio de Pagamento *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="dinheiro">Dinheiro Físico</option>
                    <option value="transferencia">Transferência</option>
                    <option value="multicaixa">Multicaixa / ATM</option>
                    <option value="misto">Misto</option>
                    <option value="mcx_express">Multicaixa Express (EMIS)</option>
                  </select>
                </div>
              </div>

               <div className="grid grid-cols-2 gap-3">
                {/* Global discount input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Desconto Global (AOA)</label>
                    {currentUser?.role !== "admin" && (
                      <span className="text-[9px] text-rose-400 font-bold flex items-center gap-0.5">
                        [🔒 Só Admin]
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    disabled={currentUser?.role !== "admin"}
                    value={currentUser?.role === "admin" ? discountAmount : "0"}
                    onChange={(e) => {
                      if (currentUser?.role === "admin") {
                        setDiscountAmount(e.target.value);
                      }
                    }}
                    placeholder={currentUser?.role === "admin" ? "Ex: 500" : "Bloqueado"}
                    className={`w-full rounded-xl py-2 px-3 text-xs font-mono transition-colors ${
                      currentUser?.role === "admin"
                        ? "bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-400"
                        : "bg-zinc-900 border border-zinc-850 text-zinc-500 cursor-not-allowed"
                    }`}
                  />
                </div>

                {/* Multicaixa Express Phone Trigger */}
                {paymentMethod === "mcx_express" && (
                  <div>
                    <label className="block text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1">Telemóvel MCX *</label>
                    <input
                      type="text"
                      required
                      value={mcxPhone}
                      onChange={(e) => {
                        setMcxPhone(e.target.value);
                        if (!mcxRef) {
                          setMcxRef(`EMIS-${Math.floor(100000 + Math.random() * 900000)}`);
                        }
                      }}
                      placeholder="Ex: 923111222"
                      className="w-full bg-amber-400/5 border border-amber-400/30 rounded-xl py-2 px-3 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Extra Multicaixa Express Reference Input */}
              {paymentMethod === "mcx_express" && (
                <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl space-y-1 text-zinc-100">
                  <span className="block text-zinc-500 text-[9px] font-bold uppercase tracking-wider">Referência EMIS Opcional (Autoconfigurada)</span>
                  <input
                    type="text"
                    value={mcxRef}
                    onChange={(e) => setMcxRef(e.target.value)}
                    placeholder="Ex: EMIS-102931-AO"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-400 font-mono focus:outline-none"
                  />
                </div>
              )}

              {/* Dinheiro Recebido & Troco */}
              {paymentMethod === "dinheiro" && (
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 grid grid-cols-2 gap-4 animate-fadeIn">
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Valor Entregue pelo Cliente</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="Introduza valor"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Troco Automático</span>
                    <span className={`font-mono font-black text-sm block pt-1.5 ${cashChangeCalculated > 0 ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                      {formatKwanza(cashChangeCalculated)}
                    </span>
                  </div>
                </div>
              )}

              {/* Price summary details panel */}
              <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl space-y-2 mt-4">
                <div className="flex justify-between items-center text-xs text-zinc-450">
                  <span>Subtotal bruto:</span>
                  <span className="font-mono text-zinc-400">{formatKwanza(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-420">
                  <span>Descontos deduzidos:</span>
                  <span className="font-mono text-zinc-400">-{formatKwanza(globalDiscount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-420">
                  <span>IVA incluído ({settings.taxRate}%):</span>
                  <span className="font-mono text-zinc-400">{formatKwanza(vatAmountCalculated)}</span>
                </div>
                <div className="flex justify-between items-center text-white border-t border-zinc-900 pt-2.5 mt-2.5">
                  <span className="font-bold text-xs uppercase tracking-wide">Valor Total Líquido:</span>
                  <span className="font-mono text-base font-black text-amber-400">{formatKwanza(cartTotalWithDiscount)}</span>
                </div>
              </div>

              <button
                id="pos-submit-checkout-btn"
                type="submit"
                className="w-full bg-amber-400 hover:bg-amber-500 text-black font-black py-3 px-4 rounded-xl shadow-lg shadow-amber-400/10 text-xs tracking-wider transition uppercase"
              >
                Concluir Venda e Emitir (A4/Thermal)
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Sales history log list */
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Histórico de Factulação e Vendas</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Consulte facturas emitidas, emita duplicados ou efetue cancelamento de lançamentos.</p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute inset-y-0 left-3 flex items-center text-zinc-500 w-4 h-4 my-auto" />
              <input
                type="text"
                value={searchInvoiceQuery}
                onChange={(e) => setSearchInvoiceQuery(e.target.value)}
                placeholder="Nº de Factura, cliente, NIF..."
                className="w-full bg-zinc-950 border border-zinc-805 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Advanced Report filters for invoice history */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-805/45">
            <div>
              <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block mb-1">Período Fiscal</label>
              <select
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400 transition"
              >
                <option value="todos">Todas as Datas</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mês</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block mb-1">Tipologia de Item</label>
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400 transition"
              >
                <option value="todos">Todos (Produtos e Serviços)</option>
                <option value="produto">Apenas Produtos</option>
                <option value="servico">Apenas Serviços</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block mb-1">Filtrar por Cliente</label>
              <select
                value={historyCustomerIdFilter}
                onChange={(e) => setHistoryCustomerIdFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400 transition"
              >
                <option value="">Todos os Clientes</option>
                <option value="geral">Cliente Geral / Diversos</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    👤 {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block mb-1">Filtrar por Operador</label>
              {currentUser?.role === "admin" ? (
                <select
                  value={historyOperatorIdFilter}
                  onChange={(e) => setHistoryOperatorIdFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400 transition"
                >
                  <option value="">Todos os Operadores</option>
                  {systemUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      👤 {u.name} ({u.role === "admin" ? "Admin/Gerente" : "Vendedor"})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  disabled
                  value={currentUser?.id || ""}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg py-1.5 px-2.5 text-xs text-zinc-500 cursor-not-allowed"
                >
                  <option value={currentUser?.id || ""}>🔒 Apenas Eu ({currentUser?.name})</option>
                </select>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-850">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950 text-zinc-400 font-bold border-b border-zinc-850">
                  <th className="py-3 px-4 font-bold text-[10px] uppercase">Factura nº</th>
                  <th className="py-3 px-4 font-bold text-[10px] uppercase">Data / Emissão</th>
                  <th className="py-3 px-4 font-bold text-[10px] uppercase">Cliente</th>
                  <th className="py-3 px-4 font-bold text-[10px] uppercase text-right">Líquido</th>
                  <th className="py-3 px-4 font-bold text-[10px] uppercase text-center">Pagamento</th>
                  <th className="py-3 px-4 font-bold text-[10px] uppercase text-center">Operador</th>
                  <th className="py-3 px-4 font-bold text-[10px] uppercase text-center">Estado</th>
                  <th className="py-3 px-4 font-bold text-[10px] uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredSalesInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-zinc-500 italic">
                      Nenhuma factura registada.
                    </td>
                  </tr>
                ) : (
                  filteredSalesInvoices.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-850/35 transition">
                      <td className="py-3 px-4 font-mono font-bold text-white text-xs flex items-center gap-1.5">
                        {s.invoiceNumber}
                        {s.syncPending && (
                          <span 
                            title="Operado Offline - Pendente de Sincronização" 
                            className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block shrink-0"
                          />
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{new Date(s.date).toLocaleString("pt-AO")}</td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {s.clientName}
                        {s.clientNif && <span className="block font-mono text-[9px] text-zinc-550 mt-0.5">NIF: {s.clientNif}</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatKwanza(s.total)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-zinc-950 text-[10px] border border-zinc-800 text-zinc-300 font-semibold uppercase px-2 py-0.5 rounded-md">
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-400">{s.cashierName}</td>
                      <td className="py-3 px-4 text-center">
                        {s.status === "ativa" ? (
                          <span className="bg-emerald-400/10 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-emerald-800/10 inline-block">
                            Ativa
                          </span>
                        ) : (
                          <span
                            title={`Cancelada por: ${s.cancelReason}`}
                            className="bg-red-400/10 text-red-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-red-800/10 inline-block"
                          >
                            Anulada
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`dupl-invoice-${s.id}`}
                            onClick={() => setPreviewInvoice(s)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-350 hover:text-white rounded-lg transition"
                            title="Ver Factura e Imprimir"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {s.status === "ativa" && (
                            <button
                              id={`cancel-invoice-${s.id}`}
                              onClick={() => setCancellingSale(s)}
                              className="p-1.5 bg-zinc-800 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition"
                              title="Anular Factura"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern custom modal for cancelling sale reason */}
      {cancellingSale && (
        <div id="cancel-pos-modal" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-1.5 text-red-400">
              <XCircle className="w-5 h-5" />
              Anular Factura Emitida
            </h3>
            <p className="text-zinc-400 text-xs mb-4">Anular a factura <span className="text-white font-extrabold">{cancellingSale.invoiceNumber}</span>. Os artigos retornarão ao inventário físico.</p>

            <form onSubmit={handlePerformCancelInvoice} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Motivo legal do Cancelamento ou Retificação *</label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Erro do operador / Desistência do cliente"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-405"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingSale(null)}
                  className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-350 rounded-xl"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-red-500 hover:bg-red-650 font-extrabold text-white text-xs rounded-xl shadow-lg shadow-red-500/10"
                >
                  Confirmar Estorno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice modal renderer */}
      {previewInvoice && (
        <InvoiceModal
          sale={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {/* Multicaixa Express EMIS Live Integration Simulator Trigger Modal */}
      {isTriggeringMcx && (
        <div id="mcx-emulator-modal" className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center relative">
                <span className="absolute animate-ping inline-flex h-12 w-12 rounded-full bg-amber-400/15"></span>
                <Smartphone className="w-8 h-8 text-amber-400 animate-bounce" />
              </div>
            </div>

            <div>
              <span className="text-[9px] bg-amber-400/10 text-amber-300 border border-amber-500/20 font-black px-2 py-0.5 rounded uppercase tracking-widest block mx-auto w-max mb-1">
                EMIS Multicaixa Express
              </span>
              <h4 className="text-sm font-bold text-white tracking-tight">Transação Pendente</h4>
              <p className="text-[11px] text-zinc-400 mt-1">A enviar solicitação de cobrança imediata para o terminal móvel.</p>
            </div>

            {/* Steps indicator */}
            <div className="bg-zinc-900/60 p-4 border border-zinc-850 rounded-xl space-y-3.5 text-left text-xs font-mono text-zinc-300">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${mcxStep >= 1 ? "bg-amber-400 animate-pulse" : "bg-zinc-700"}`}></span>
                <span className={mcxStep === 1 ? "text-amber-300 font-bold" : "text-zinc-500"}>1. Canalizando via Gateway...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${mcxStep >= 2 ? "bg-amber-400 animate-pulse" : "bg-zinc-700"}`}></span>
                <span className={mcxStep === 2 ? "text-amber-300 font-bold" : "text-zinc-500"}>2. A aguardar senha no {mcxPhone}...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${mcxStep >= 3 ? "bg-amber-400 animate-pulse" : "bg-zinc-700"}`}></span>
                <span className={mcxStep === 3 ? "text-amber-300 font-bold" : "text-zinc-500"}>3. Liquidação EMIS Autorizada!</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${mcxStep * 33.3}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 italic">
              Empresa credenciada: <strong>{settings.companyName}</strong> • NIF: {settings.companyNif}
              <br />
              Total a pagar: <strong>{formatKwanza(cartTotalWithDiscount)}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
