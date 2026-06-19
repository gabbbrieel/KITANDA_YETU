/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { store } from "../services/store";
import { Product, Category, StockMovement } from "../types";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Database,
  ArrowUpDown,
  TrendingDown,
  Layers,
  FileClock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function Stock() {
  // Store subscriptions
  const [products, setProducts] = useState(() => store.getProducts());
  const [categories, setCategories] = useState(() => store.getCategories());
  const [movements, setMovements] = useState(() => store.getMovements());

  useMemo(() => {
    const unsubscribe = store.subscribe(() => {
      setProducts([...store.getProducts()]);
      setCategories([...store.getCategories()]);
      setMovements([...store.getMovements()]);
    });
    return () => unsubscribe();
  }, []);

  // UI state
  const [activeTab, setActiveTab] = useState<"list" | "movements" | "categories">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  // Create Product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pType, setPType] = useState<"produto" | "servico">("produto");
  
  const [pCode, setPCode] = useState("");
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pPurchasePrice, setPPurchasePrice] = useState("");
  const [pSellPrice, setPSellPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [pMinStock, setPMinStock] = useState("");
  const [pUnit, setPUnit] = useState("Unidade");
  const [pDesc, setPDesc] = useState("");

  // Categories helper state
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  // Adjust stock overlay state
  const [adjustingProd, setAdjustingProd] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"entrada" | "saida">("entrada");
  const [adjustReason, setAdjustReason] = useState("");

  // Local notifications
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const triggerToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.includes(searchQuery) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === "Todas" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Handle Create/Edit Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isService = pType === "servico";
    const requiredFields = isService 
      ? [pCode, pName, pCategory, pSellPrice]
      : [pCode, pName, pCategory, pPurchasePrice, pSellPrice, pStock, pMinStock];

    if (requiredFields.some(f => !f)) {
      triggerToast("error", "Preencha todos os campos obrigatórios.");
      return;
    }

    const buyPriceNum = isService ? 0 : parseFloat(pPurchasePrice);
    const sellPriceNum = parseFloat(pSellPrice);
    const stockNum = isService ? 0 : parseInt(pStock);
    const minStockNum = isService ? 0 : parseInt(pMinStock);

    if (!isService && sellPriceNum < buyPriceNum) {
      if (!window.confirm("Aviso: O preço de venda é inferior ao preço de compra. Deseja prosseguir assim mesmo?")) {
        return;
      }
    }

    const prodPayload = {
      code: pCode,
      name: pName,
      category: pCategory,
      purchasePrice: buyPriceNum,
      sellPrice: sellPriceNum,
      stock: stockNum,
      minStock: minStockNum,
      unit: pUnit,
      description: pDesc,
      type: pType,
    };

    if (editingId) {
      store.updateProduct(editingId, prodPayload);
      triggerToast("success", "Item atualizado com sucesso!");
    } else {
      // Check duplicate code
      if (products.some(p => p.code === pCode)) {
        triggerToast("error", "Já existe um item com este código SKU / de barras.");
        return;
      }
      store.addProduct(prodPayload);
      triggerToast("success", `${isService ? "Serviço" : "Produto"} registado com sucesso!`);
    }

    resetProductForm();
  };

  const resetProductForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setPType("produto");
    setPCode("");
    setPName("");
    setPCategory("");
    setPPurchasePrice("");
    setPSellPrice("");
    setPStock("");
    setPMinStock("");
    setPUnit("Unidade");
    setPDesc("");
  };

  const handleEditClick = (p: Product) => {
    setEditingId(p.id);
    setPType(p.type || "produto");
    setPCode(p.code);
    setPName(p.name);
    setPCategory(p.category);
    setPPurchasePrice(String(p.purchasePrice));
    setPSellPrice(String(p.sellPrice));
    setPStock(String(p.stock));
    setPMinStock(String(p.minStock));
    setPUnit(p.unit);
    setPDesc(p.description || "");
    setShowAddForm(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Tem a certeza que deseja excluir o produto "${name}"? Esta ação é irreversível.`)) {
      store.deleteProduct(id);
      triggerToast("success", "Produto removido com sucesso.");
    }
  };

  // Stock update adjustment operations
  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProd || !adjustQty || !adjustReason) {
      triggerToast("error", "Preencha a quantidade e o motivo.");
      return;
    }

    const qtyNum = parseInt(adjustQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      triggerToast("error", "A quantidade introduzida deve ser maior que zero.");
      return;
    }

    if (adjustType === "entrada") {
      store.addStock(adjustingProd.id, qtyNum, adjustReason);
      triggerToast("success", "Estoque adicionado com sucesso!");
    } else {
      const ok = store.removeStock(adjustingProd.id, qtyNum, adjustReason);
      if (ok) {
        triggerToast("success", "Retirada de estoque processada com sucesso!");
      } else {
        triggerToast("error", "Estoque insuficiente para processar esta saída.");
      }
    }

    setAdjustingProd(null);
    setAdjustQty("");
    setAdjustReason("");
  };

  // Create Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    if (categories.some((c) => c.name.toLowerCase() === newCatName.toLowerCase())) {
      triggerToast("error", "Esta categoria já se encontra registada.");
      return;
    }

    store.addCategory({ name: newCatName, description: newCatDesc });
    triggerToast("success", "Categoria registada!");
    setNewCatName("");
    setNewCatDesc("");
  };

  const handleDeleteCategory = (id: string, name: string) => {
    // Prevent delete if associated products exist
    const boundProducts = products.some((p) => p.category === name);
    if (boundProducts) {
      triggerToast("error", `Existem produtos associados à categoria "${name}". Modifique-os primeiro antes de apagar.`);
      return;
    }

    if (window.confirm(`Excluir a categoria "${name}"?`)) {
      store.deleteCategory(id);
      triggerToast("success", "Categoria removida.");
    }
  };

  const formatKwanza = (v: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
    }).format(v);
  };

  return (
    <div id="stock-manager-view" className="space-y-6 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div id="stock-feedback" className={`fixed top-8 right-8 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-2 max-w-sm transition-all duration-300 border ${
          toast.type === "success" 
            ? "bg-zinc-900 border-emerald-500/30 text-emerald-300 shadow-emerald-500/5 text-xs" 
            : "bg-zinc-900 border-red-500/30 text-red-300 shadow-red-500/5 text-xs"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
          <span className="font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Primary stock action topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            Gestão de Estoque e Inventário
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Organize o catálogo de vendas, controle existências e acompanhe entradas/saídas.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="tab-articles"
            onClick={() => { setActiveTab("list"); setShowAddForm(false); }}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              activeTab === "list" ? "bg-amber-400 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700/60"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Artigos
          </button>
          <button
            id="tab-movements"
            onClick={() => { setActiveTab("movements"); setShowAddForm(false); }}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              activeTab === "movements" ? "bg-amber-400 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700/60"
            }`}
          >
            <FileClock className="w-3.5 h-3.5" /> Movimentações
          </button>
          <button
            id="tab-categories"
            onClick={() => { setActiveTab("categories"); setShowAddForm(false); }}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              activeTab === "categories" ? "bg-amber-400 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Categorias
          </button>
        </div>
      </div>

      {activeTab === "list" && (
        <div className="space-y-4">
          {/* Main search / actions bar */}
          {!showAddForm && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute inset-y-0 left-3.5 flex items-center text-zinc-500 w-4 h-4 my-auto" />
                  <input
                    id="stock-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar por nome, código SKU..."
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-amber-400 tracking-wide transition"
                  />
                </div>
                <select
                  id="stock-cat-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-zinc-900 border border-zinc-850 rounded-xl py-2.5 px-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="Todas">Todas Categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                id="stock-reg-prod-btn"
                onClick={() => {
                  resetProductForm();
                  setShowAddForm(true);
                  // Auto-select first category by default
                  if (categories.length > 0 && !pCategory) setPCategory(categories[0].name);
                }}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-black font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shrink-0"
              >
                <Plus className="w-4 h-4" /> Novo Produto
              </button>
            </div>
          )}

          {/* Create or Edit Form */}
          {showAddForm && (
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl shadow-black/30">
              <h3 className="text-base font-bold text-white mb-4">
                {editingId ? "Editar Detalhes do Artigo" : "Registar Novo Artigo no Catálogo"}
              </h3>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                {/* Tipo de Item Selector */}
                <div>
                  <label className="block text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Tipo de Artigo</label>
                  <div className="grid grid-cols-2 gap-2 max-w-sm bg-zinc-950 p-1 rounded-xl border border-zinc-850/60">
                    <button
                      type="button"
                      onClick={() => setPType("produto")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        pType === "produto"
                          ? "bg-amber-400 text-black font-extrabold shadow"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Produto Físico
                    </button>
                    <button
                      type="button"
                      onClick={() => setPType("servico")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        pType === "servico"
                          ? "bg-amber-400 text-black font-extrabold shadow"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Prestação de Serviço
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SKU Code */}
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Código Barcode / SKU *</label>
                    <input
                      type="text"
                      required
                      value={pCode}
                      onChange={(e) => setPCode(e.target.value)}
                      placeholder="Ex: 560123456001"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-zinc-700 tracking-wider font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Designação comercial *</label>
                    <input
                      type="text"
                      required
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="Ex: Fuba de Milho Cuca 1kg"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-zinc-750 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Categoria *</label>
                    <select
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Measure Unit */}
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Unidade de Medida</label>
                    <select
                      value={pUnit}
                      onChange={(e) => setPUnit(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Unidade">Unidade (un)</option>
                      <option value="Serviço">Serviço (srv)</option>
                      <option value="Hora">Hora (h)</option>
                      <option value="Dia">Dia (dias)</option>
                      <option value="Caixa">Caixa (cx)</option>
                      <option value="Saco">Saco (sc)</option>
                      <option value="Lata">Lata (lt)</option>
                      <option value="Quilo">Quilo (kg)</option>
                      <option value="Garrafa">Garrafa (gf)</option>
                    </select>
                  </div>
                  {/* Cost Price */}
                  {pType === "produto" ? (
                    <div>
                      <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Preço de Compra (Kwanza) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={pPurchasePrice}
                        onChange={(e) => setPPurchasePrice(e.target.value)}
                        placeholder="Ex: 800"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  ) : (
                    <div className="opacity-60">
                      <label className="block text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Custo / Despesa Est. (Opcional)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pPurchasePrice}
                        onChange={(e) => setPPurchasePrice(e.target.value)}
                        placeholder="Opcional (ex: 0)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}
                  {/* Sell Price */}
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      {pType === "servico" ? "Preço de Cobrança *" : "Preço de Venda (Kwanza) *"}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={pSellPrice}
                      onChange={(e) => setPSellPrice(e.target.value)}
                      placeholder="Ex: 1200"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {pType === "produto" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Initial Stock */}
                    <div>
                      <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Estoque inicial *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={pStock}
                        onChange={(e) => setPStock(e.target.value)}
                        disabled={!!editingId} // Disable direct stock edit if editing, must use Restock operation
                        placeholder="Ex: 100"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-amber-400"
                      />
                      {editingId && (
                        <span className="text-[10px] text-zinc-500 mt-1 block">Para alterar existências em produtos já criados, utilize a opção "Lançar Fluxo" na listagem.</span>
                      )}
                    </div>
                    {/* Min Stock limit */}
                    <div>
                      <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Estoque Mínimo de Alerta *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={pMinStock}
                        onChange={(e) => setPMinStock(e.target.value)}
                        placeholder="Ex: 10"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Descrição do Artigo (Opcional)</label>
                  <textarea
                    rows={2}
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    placeholder="Notas adicionais sobre o produto..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                {/* Form buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="py-2 px-4 rounded-xl text-xs text-zinc-350 bg-zinc-800 hover:bg-zinc-700 font-bold transition"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-xl text-xs text-black bg-amber-400 hover:bg-amber-500 font-extrabold shadow-lg shadow-amber-400/10 transition"
                  >
                    Guardar no Estoque
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products List Table */}
          {!showAddForm && (
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-md shadow-black/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-850 font-bold">
                      <th className="py-3 px-4 font-bold tracking-wider text-[10px] uppercase">Código / SKU</th>
                      <th className="py-3 px-4 font-bold tracking-wider text-[10px] uppercase">Artigo</th>
                      <th className="py-3 px-4 font-bold tracking-wider text-[10px] uppercase">Categoria</th>
                      <th className="py-3 px-4 font-bold tracking-wider text-[10px] uppercase text-right">Compra</th>
                      <th className="py-3 px-4 font-bold tracking-wider text-[10px] uppercase text-right">Venda</th>
                      <th className="py-3 px-4 font-bold tracking-wider text-[10px] uppercase text-center">Disponível</th>
                      <th className="py-3 px-4 font-bold tracking-wider text-[10px] uppercase text-center">Estado</th>
                      <th className="py-3 px-4 font-bold tracking-wider text-[10px] uppercase text-right">Acções</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-zinc-550 italic">
                          Nenhum produto encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const isLow = p.stock < p.minStock;
                        const isAtThres = p.stock === p.minStock;
                        const isService = p.type === "servico";

                        return (
                          <tr key={p.id} className="hover:bg-zinc-850/40 transition">
                            <td className="py-3.5 px-4 font-mono text-zinc-400 font-medium">{p.code}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white block">{p.name}</span>
                                {p.syncPending && (
                                  <span 
                                    title="Registo Offline - Pendente de Sincronização" 
                                    className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0 inline-block-subtle"
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 font-sans">
                                <span className="text-zinc-500 text-[10px]">{p.unit}</span>
                                <span className={`text-[8px] font-black px-1 rounded-sm border uppercase tracking-wider leading-none py-0.5 ${
                                  isService 
                                    ? "bg-amber-400/15 text-amber-400 border-amber-450/20" 
                                    : "bg-teal-400/15 text-teal-400 border-teal-450/20"
                                }`}>
                                  {isService ? "Serviço" : "Produto"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-zinc-400 font-medium">{p.category}</td>
                            <td className="py-3.5 px-4 text-right font-mono text-zinc-500">
                              {isService && p.purchasePrice === 0 ? "-" : formatKwanza(p.purchasePrice)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{formatKwanza(p.sellPrice)}</td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                              {isService ? <span className="text-base text-zinc-550" title="Disponibilidade Ilimitada">∞</span> : p.stock}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isService ? (
                                <span className="bg-indigo-400/10 text-indigo-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-indigo-800/20 inline-block font-sans">
                                  Imaculado / Ativo
                                </span>
                              ) : isLow ? (
                                <span className="bg-red-400/10 text-red-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-red-800/10 inline-block animate-pulse">
                                  Insuficiente
                                </span>
                              ) : isAtThres ? (
                                <span className="bg-amber-400/10 text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-800/10 inline-block">
                                  Limite
                                </span>
                              ) : (
                                <span className="bg-emerald-400/10 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-emerald-800/10 inline-block">
                                  Regular
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!isService ? (
                                  <button
                                    id={`adjust-stock-${p.id}`}
                                    title="Lançar fluxo rápido de estoque"
                                    onClick={() => setAdjustingProd(p)}
                                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold tracking-wider uppercase px-2.5 py-1.5 rounded-lg border border-zinc-700/50 transition-colors"
                                  >
                                    Lançar Fluxo
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-zinc-650 italic font-semibold px-2 pointer-events-none">
                                    S/ Stock
                                  </span>
                                )}
                                <button
                                  id={`edit-prod-${p.id}`}
                                  onClick={() => handleEditClick(p)}
                                  className="p-1.5 bg-zinc-800 hover:bg-amber-400/10 text-zinc-400 hover:text-amber-400 rounded-lg transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`delete-prod-${p.id}`}
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="p-1.5 bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "movements" && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Registo e Histórico de Movimentações</h3>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {movements.map((mov) => (
                <div key={mov.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex items-center justify-between text-xs transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                        mov.type === "entrada" ? "bg-amber-400 text-black" : "bg-zinc-700 text-zinc-300"
                      }`}>
                        {mov.type}
                      </span>
                      <span className="font-bold text-white">{mov.productName}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">{mov.reason}</p>
                    <p className="text-zinc-600 text-[10px]">{new Date(mov.date).toLocaleString("pt-AO")} • Responsável: {mov.user}</p>
                  </div>
                  <span className={`font-mono font-black text-sm pr-2 ${
                    mov.type === "entrada" ? "text-amber-400" : "text-zinc-400"
                  }`}>
                    {mov.type === "entrada" ? "+" : "-"}{mov.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create category */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Registar Nova Categoria</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Talho e Peixaria"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Descrição Curta (Opcional)</label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Descreva as mercadorias contidas nesta divisão de estoque..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-400 hover:bg-amber-500 text-black font-extrabold py-2.5 px-4 rounded-xl text-xs transition"
              >
                Salvar Categoria
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Categorias Activas</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {categories.map((c) => {
                // Calculate products counts per category
                const count = products.filter(p => p.category === c.name).length;
                return (
                  <div key={c.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs hover:border-zinc-700 transition">
                    <div>
                      <span className="font-bold text-white block">{c.name}</span>
                      {c.description && <span className="text-zinc-500 text-[10px] mt-0.5 block">{c.description}</span>}
                      <span className="text-amber-400/70 text-[9px] font-bold uppercase tracking-wide mt-1 block">{count} artigos ativos</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="p-2 bg-zinc-900/60 text-zinc-500 hover:text-red-400 hover:bg-red-400/5 rounded-lg border border-zinc-850 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Manual Stock Adjust OverlayModal */}
      {adjustingProd && (
        <div id="stock-ajust-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-black">
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-amber-400" />
              Lançar Ajuste de Estoque
            </h3>
            <p className="text-zinc-400 text-xs mb-4">Registo de fluxo manual para: <span className="text-white font-bold">{adjustingProd.name}</span></p>

            <form onSubmit={handleStockAdjustment} className="space-y-4">
              {/* Type toggle */}
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tipo de Movimento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("entrada")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      adjustType === "entrada" ? "bg-amber-400 border-amber-400 text-black" : "bg-zinc-800 border-zinc-750 text-zinc-300"
                    }`}
                  >
                    Entrada (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("saida")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      adjustType === "saida" ? "bg-zinc-800 border-amber-400/20 text-white" : "bg-zinc-800 border-zinc-750 text-zinc-300"
                    }`}
                  >
                    Saída (-)
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Quantidade ({adjustingProd.unit})</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="Ex: 24"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Motivo / Justificação *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex: Reposição de carga / Quebra ou avaria"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProd(null)}
                  className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-xl text-xs text-zinc-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-amber-400 hover:bg-amber-500 font-extrabold rounded-xl text-xs text-black transition shadow-lg shadow-amber-400/10"
                >
                  Executar Operação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
