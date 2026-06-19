/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import { Sale } from "../types";
import { store } from "../services/store";
import { X, Printer, Copy, FileText, Check, Phone, Mail, Send, CheckCircle, Smartphone, Award } from "lucide-react";

// Inline vector logo presets mapping retail & Angolan indicators
const BasketIcon = () => (
  <svg className="w-10 h-10 text-amber-500 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const PalmaIcon = () => (
  <svg className="w-10 h-10 text-emerald-500 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 7l4-4M12 11l6-4M12 15l4-4M12 7l-4-4M12 11l-6-4M12 15l-4-4" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-10 h-10 text-amber-500 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ModernIcon = () => (
  <svg className="w-10 h-10 text-amber-500 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

export function CompanyLogo({ logoId, customUrl, className = "w-10 h-10" }: { logoId: string; customUrl?: string; className?: string }) {
  if (logoId === "custom" && customUrl) {
    return <img src={customUrl} alt="Logo" className={`${className} object-contain rounded-lg`} referrerPolicy="no-referrer" />;
  }
  switch (logoId) {
    case "preset-basket":
      return <BasketIcon />;
    case "preset-palma":
      return <PalmaIcon />;
    case "preset-shield":
      return <ShieldIcon />;
    case "preset-modern":
    default:
      return <ModernIcon />;
  }
}

interface InvoiceModalProps {
  sale: Sale;
  onClose: () => void;
}

export default function InvoiceModal({ sale, onClose }: InvoiceModalProps) {
  const [format, setFormat] = useState<"a4" | "thermal">("thermal");
  const [settings] = useState(() => store.getSettings());
  const [copied, setCopied] = useState(false);
  const saleBranch = store.getStoreBranches().find(b => b.id === sale.storeId);

  // Communications Delivery simulation states
  const [commChannel, setCommChannel] = useState<"not_sent" | "whatsapp" | "sms" | "email">("not_sent");
  const [commRecipient, setCommRecipient] = useState("");
  const [deliveryStep, setDeliveryStep] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Automatically lookup matching customer details to fill recipient fields
  useEffect(() => {
    if (sale.clientId) {
      const customers = store.getCustomers();
      const match = customers.find(c => c.id === sale.clientId);
      if (match) {
        if (commChannel === "email") {
          setCommRecipient(match.email || "geral@cliente.ao");
        } else if (commChannel === "whatsapp" || commChannel === "sms") {
          setCommRecipient(match.phone || "923 000 000");
        }
      }
    } else {
      if (commChannel === "email") {
        setCommRecipient("consumidor@cliente.ao");
      } else {
        setCommRecipient("923 000 000");
      }
    }
  }, [commChannel, sale.clientId]);

  const formatKwanza = (v: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
    }).format(v);
  };

  const calculateSubtotalItems = () => {
    return sale.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCSV = () => {
    const headers = "Designacao;Qtd;Preco Unit;Desconto;Total\n";
    const bodyStr = sale.items
      .map(
        (item) =>
          `"${item.productName}";${item.quantity};${item.price};${item.discount};${
            item.price * item.quantity - item.discount
          }`
      )
      .join("\n");
    const footerStr = `\n\nSubtotal;${sale.subtotal}\nDesconto;${sale.discount}\nIVA (${settings.taxRate}%);${sale.tax}\nTotal Liquido;${sale.total}\nAssinatura AGT;${sale.hash}`;

    navigator.clipboard.writeText(headers + bodyStr + footerStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const executeSimulatedSending = () => {
    if (!commRecipient.trim()) return;
    setIsSending(true);
    setDeliveryStep(1);

    setTimeout(() => {
      setDeliveryStep(2);
      setTimeout(() => {
        setDeliveryStep(3);
        setTimeout(() => {
          setIsSending(false);
          setSendSuccess(true);
        }, 1200);
      }, 1000);
    }, 800);
  };

  const getDocTypeTitle = (type: string) => {
    switch (type) {
      case "FP":
        return "Factura Pro-Forma";
      case "OR":
        return "Orçamento Comercial";
      case "FT":
        return "Factura de Cobrança";
      case "FG":
        return "Factura Global";
      case "FR":
      default:
        return "Factura Recibo";
    }
  };

  return (
    <div id="invoice-preview-modal-overlay" className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full flex flex-col md:flex-row max-h-[90vh] shadow-2xl relative overflow-hidden">
        
        {/* Left Side: Document printouts & toggle */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Modal Header Controls */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0 bg-zinc-900">
            <div>
              <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400 animate-pulse" />
                Regulatório AGT: {getDocTypeTitle(sale.documentType)}
              </h3>
              <p className="text-zinc-500 text-[10px] mt-0.5">Nº de Série: {sale.invoiceNumber}  •  Hash: {sale.hash}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  id="invoice-select-thermal"
                  onClick={() => setFormat("thermal")}
                  className={`py-1 px-2.5 text-[9px] font-black rounded uppercase transition ${
                    format === "thermal" ? "bg-amber-400 text-black shadow" : "text-zinc-400"
                  }`}
                >
                  Térmico
                </button>
                <button
                  id="invoice-select-a4"
                  onClick={() => setFormat("a4")}
                  className={`py-1 px-2.5 text-[9px] font-black rounded uppercase transition ${
                    format === "a4" ? "bg-amber-400 text-black shadow" : "text-zinc-400"
                  }`}
                >
                  A4 Oficial
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition md:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invoice Document Canvas Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-950 flex justify-center text-black">
            {format === "thermal" ? (
              /* THERMAL SLIP CASE */
              <div
                id="print-area-thermal"
                className="bg-zinc-50 p-5 max-w-[310px] w-full font-mono text-[9px] space-y-4 shadow-xl border border-zinc-200 self-start text-zinc-900 leading-tight"
              >
                {/* Header preset logo/brand */}
                <div className="text-center space-y-1.5 pb-2 border-b border-zinc-300 border-dashed">
                  <div className="flex justify-center shrink-0">
                    <CompanyLogo logoId={settings.companyLogoId} customUrl={settings.customLogoUrl} className="w-8 h-8" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider">{settings.companyName}</h4>
                  <p className="text-[8px] text-zinc-650">
                    {saleBranch ? saleBranch.location : settings.companyAddress}
                    <br />
                    Tel: {saleBranch ? saleBranch.tel : settings.companyPhone}
                    {settings.companyEmail && (
                      <>
                        <br />
                        E-mail: {settings.companyEmail}
                      </>
                    )}
                  </p>
                  <p className="font-bold border border-black/10 py-0.5 rounded bg-black/5">NIF: {settings.companyNif}</p>
                </div>

                {/* Details list */}
                <div className="space-y-0.5 text-zinc-700 py-1">
                  <p><span className="font-bold text-black">{getDocTypeTitle(sale.documentType)}:</span> {sale.invoiceNumber}</p>
                  <p><span className="font-bold text-black">Data Emissão:</span> {new Date(sale.date).toLocaleString("pt-AO")}</p>
                  <p><span className="font-bold text-black">Operador:</span> {sale.cashierName}</p>
                  <p><span className="font-bold text-black">Estado:</span> {sale.status === "ativa" ? "PAGO / VÁLIDO" : "ANULADO"}</p>
                  <p><span className="font-bold text-black">Cliente:</span> {sale.clientName}</p>
                  {sale.clientNif && <p><span className="font-bold text-black">NIF Cliente:</span> {sale.clientNif}</p>}
                </div>

                {/* Items Table Grid */}
                <div className="space-y-1 border-t border-b border-black border-dashed py-2">
                  <div className="flex justify-between font-bold text-black border-b border-black border-dotted pb-1">
                    <span>Artigo</span>
                    <span>Qtd x Unit</span>
                    <span>Total</span>
                  </div>
                  <div className="divide-y divide-zinc-300 divide-dashed">
                    {sale.items.map((item, index) => (
                      <div key={index} className="py-1.5 flex justify-between">
                        <div className="max-w-[130px] truncate">
                          <span className="font-bold text-black">{item.productName}</span>
                        </div>
                        <span>
                          {item.quantity} x {item.price}
                        </span>
                        <span className="font-bold text-zinc-900">
                          {item.price * item.quantity - item.discount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arithmetic totals panel */}
                <div className="space-y-0.5 text-right font-mono text-zinc-850">
                  <p>Subtotal Bruto: {formatKwanza(calculateSubtotalItems())}</p>
                  {sale.discount > 0 && <p className="text-red-600">Desconto Comercial: -{formatKwanza(sale.discount)}</p>}
                  <p>Taxa IVA ({settings.taxRate}%): {formatKwanza(sale.tax)}</p>
                  <p className="text-xs font-black text-black pt-1 border-t border-zinc-200 uppercase">
                    TOTAL KWANZA: {formatKwanza(sale.total)}
                  </p>
                </div>

                {/* Payment info */}
                <div className="border-t border-zinc-300 border-dashed pt-2 space-y-0.5 text-[8px] text-zinc-600">
                  <p>Forma Pagamento: {sale.paymentMethod === "mcx_express" ? "MULTICAIXA EXPRESS" : sale.paymentMethod.toUpperCase()}</p>
                  {sale.paymentMethod === "mcx_express" && sale.mcxPhone && (
                    <>
                      <p>Telemóvel MCX: {sale.mcxPhone}</p>
                      <p>Aut. EMIS: {sale.mcxRef || "MCX-AUTH-SIM"}</p>
                    </>
                  )}
                  <p>Pago: {formatKwanza(sale.receivedAmount)}</p>
                  <p>Troco Oferecido: {formatKwanza(sale.changeAmount)}</p>
                  {settings.companyIban && (
                    <p className="text-[7.5px] truncate text-zinc-500 font-sans">IBAN: {settings.companyIban}</p>
                  )}
                </div>

                {/* AGT Certification rules */}
                <div className="text-center pt-3 border-t border-zinc-300 border-dashed text-[7.5px] text-zinc-550 space-y-1">
                  <p className="font-bold text-black uppercase tracking-tight">{settings.regime}</p>
                  <p className="leading-tight px-1 font-sans">
                    {sale.hash}-{sale.agtCertCode}/26
                    <br />
                    Este documento foi processado por programa certificado de acordo com as normas tributárias da AGT de Angola.
                  </p>
                  <p className="font-black text-zinc-800">MUITO OBRIGADO PELA SUA VISITA!</p>
                </div>

              </div>
            ) : (
              /* A4 METICULOUS PRINTER COPY */
              <div
                id="print-area-a4"
                className="bg-white p-8 w-full font-sans text-xs space-y-6 shadow-xl border border-zinc-205 self-start text-zinc-900 leading-normal"
              >
                {/* Upper row header */}
                <div className="flex justify-between items-start border-b border-zinc-150 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0">
                        <CompanyLogo logoId={settings.companyLogoId} customUrl={settings.customLogoUrl} className="w-10 h-10" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-wide">{settings.companyName}</span>
                    </div>
                    <p className="text-zinc-500 text-[10px] leading-relaxed max-w-sm mt-1">
                      {saleBranch ? saleBranch.location : settings.companyAddress}
                      <br />
                      Telefone: {saleBranch ? saleBranch.tel : settings.companyPhone} {settings.companyEmail && `| E-mail: ${settings.companyEmail}`}
                      <br />
                      Contribuinte NIF: <span className="font-bold text-zinc-800">{settings.companyNif}</span>
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider inline-block">
                      {getDocTypeTitle(sale.documentType)}
                    </span>
                    <h3 className="text-base font-black text-zinc-900 mt-1">{sale.invoiceNumber}</h3>
                    <p className="text-zinc-500 text-[10px]">Data Emissão: {new Date(sale.date).toLocaleDateString("pt-AO")}</p>
                    <p className="text-zinc-500 text-[10px]">Operador Caixa: {sale.cashierName}</p>
                  </div>
                </div>

                {/* Cliente details */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200/50">
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase font-black tracking-wider block">Entidade Adquirente</span>
                    <p className="font-bold text-zinc-800 text-xs mt-1">{sale.clientName}</p>
                    {sale.clientNif ? (
                      <p className="font-mono text-zinc-500 text-[10px] mt-0.5">NIF Cliente: {sale.clientNif}</p>
                    ) : (
                      <p className="text-zinc-400 text-[10px] mt-0.5">NIF: Consumidor Final</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-400 uppercase font-black tracking-wider block">Condições de Venda</span>
                    <p className="font-semibold text-zinc-700 text-xs mt-1">Forma de Pagamento: {sale.paymentMethod === "mcx_express" ? "MULTICAIXA EXPRESS" : sale.paymentMethod.toUpperCase()}</p>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">Moeda Oficial: Kwanza Angolano (AOA)</span>
                  </div>
                </div>

                {/* Grid list of articles */}
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200">
                        <th className="py-2 px-3">Designação do Artigo</th>
                        <th className="py-2 px-3 text-center">Código</th>
                        <th className="py-2 px-3 text-center">Qtd</th>
                        <th className="py-2 px-3 text-right">P. Unitário</th>
                        <th className="py-2 px-3 text-right">Desconto</th>
                        <th className="py-2 px-3 text-right">Total Líquido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {sale.items.map((item, index) => (
                        <tr key={index} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-3 font-semibold text-zinc-800">{item.productName}</td>
                          <td className="py-2 px-3 text-center font-mono text-zinc-400">PRD-{item.productId.substr(0,4).toUpperCase()}</td>
                          <td className="py-2 px-3 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatKwanza(item.price)}</td>
                          <td className="py-2 px-3 text-right font-mono text-red-500">-{formatKwanza(item.discount)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">
                            {formatKwanza(item.price * item.quantity - item.discount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sign and calculations */}
                <div className="flex justify-between items-start pt-4 border-t border-zinc-200">
                  <div className="space-y-1.5 max-w-sm">
                    <p className="font-bold text-zinc-800 text-[10px] uppercase tracking-wider">Notas Relevantes</p>
                    {settings.companyIban && (
                      <p className="text-zinc-500 leading-tight text-[10px]">
                        Coordenadas Bancárias (IBAN):<br />
                        <span className="font-mono text-zinc-800 font-bold block bg-zinc-100 border border-zinc-200 p-1 rounded mt-0.5 text-[9.5px]">{settings.companyIban}</span>
                      </p>
                    )}
                    <p className="text-zinc-400 italic text-[9px] mt-2">{settings.regime}</p>
                  </div>

                  <div className="space-y-1 w-60 text-right text-[10px]">
                    <div className="flex justify-between text-zinc-500">
                      <span>Total Ilíquido:</span>
                      <span className="font-mono">{formatKwanza(calculateSubtotalItems())}</span>
                    </div>
                    {sale.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Desconto Global:</span>
                        <span className="font-mono">-{formatKwanza(sale.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-500">
                      <span>IVA Incluído ({settings.taxRate}%):</span>
                      <span className="font-mono">{formatKwanza(sale.tax)}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-300 pt-2 text-zinc-950 font-black text-xs">
                      <span>TOTAL KWANZA:</span>
                      <span className="font-mono text-amber-600 block text-sm">{formatKwanza(sale.total)}</span>
                    </div>
                  </div>
                </div>

                {/* AGT Certification Warning block */}
                <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg flex items-start gap-2.5 text-[8px] text-zinc-500 font-sans">
                  <Award className="w-6 h-6 text-amber-500 shrink-0 self-center" strokeWidth={1.5} />
                  <div>
                    <p className="font-black text-zinc-805 uppercase tracking-wide">CERTIFICAÇÃO ADMINISTRATIVA INTEGRAL</p>
                    <p className="leading-relaxed mt-0.5">
                      Este documento de número <span className="font-bold text-zinc-700">{sale.invoiceNumber}</span> foi assinado electronicamente nos termos do Regulamento de Faturamento Eletrónico através do algoritmo SHA-1, sendo atribuído o fragmento de hash de assinatura <span className="font-mono text-zinc-800 font-black px-1 py-0.5 bg-zinc-200 rounded">{sale.hash}</span>, emitido pelo software certificado com o nº <strong className="text-zinc-700">{sale.agtCertCode}</strong> correspondente à série legal de vendas de Angola.
                    </p>
                  </div>
                </div>

                {/* Footer credit */}
                <div className="flex justify-between pt-4 text-[8px] text-zinc-400 border-t border-zinc-100">
                  <span>Desenvolvido por KITANDA YETU, LDA</span>
                  <span className="text-right">Agradecemos pela preferência, volte sempre!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Communication Deliveries Panel */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 p-5 flex flex-col shrink-0 bg-zinc-900/60 justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black tracking-wider text-amber-400 uppercase">Apoio a Clientes</span>
              <h4 className="text-sm font-bold text-white tracking-tight mt-0.5">Enviar Comprovativo</h4>
              <p className="text-[11px] text-zinc-400 mt-1">Envie o talão em tempo real por SMS, WhatsApp ou E-mail angolano.</p>
            </div>

            {/* Channels tab header */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
              <button
                onClick={() => { setCommChannel("whatsapp"); setSendSuccess(false); }}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center gap-1 transition ${
                  commChannel === "whatsapp" ? "bg-amber-400 text-black shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => { setCommChannel("sms"); setSendSuccess(false); }}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center gap-1 transition ${
                  commChannel === "sms" ? "bg-amber-400 text-black shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>SMS</span>
              </button>
              <button
                onClick={() => { setCommChannel("email"); setSendSuccess(false); }}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center gap-1 transition ${
                  commChannel === "email" ? "bg-amber-400 text-black shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>E-mail</span>
              </button>
            </div>

            {/* Form workspace */}
            {commChannel !== "not_sent" && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 animate-fadeIn text-zinc-100">
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                  {commChannel === "email" ? "Endereço de E-mail" : "Telemóvel de Destino"}
                </label>
                <input
                  type="text"
                  value={commRecipient}
                  onChange={(e) => setCommRecipient(e.target.value)}
                  placeholder={commChannel === "email" ? "exemplo@cliente.ao" : "923 456 789"}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />

                {!isSending && !sendSuccess && (
                  <button
                    onClick={executeSimulatedSending}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-xs font-black text-black rounded-lg flex items-center justify-center gap-1.5 transition mt-2 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar Comprovativo
                  </button>
                )}

                {/* Live simulation progress bar */}
                {isSending && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-amber-400 font-bold animate-pulse">Enviando boletim...</span>
                      <span className="text-zinc-500 font-mono">{deliveryStep * 33}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${deliveryStep * 33.3}%` }}
                      ></div>
                    </div>
                    <p className="text-[9.5px] italic text-zinc-450 mt-1 font-mono text-center">
                      {deliveryStep === 1 && "Estabelecendo ligação segura de API..."}
                      {deliveryStep === 2 && "Autenticando assinaturas digitais AGT..."}
                      {deliveryStep === 3 && "Sincronizando gateways angolanos..."}
                    </p>
                  </div>
                )}

                {/* Live Success Summary */}
                {sendSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2 text-zinc-200">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-black">Boletim Enviado!</p>
                        <p className="text-[9px] text-zinc-400">Entrega simulada com sucesso.</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-zinc-400 font-mono border-t border-zinc-800 pt-1.5 leading-snug">
                      <strong className="text-zinc-200 text-[10px] block mb-1">Cópia do Comprovativo:</strong>
                      {commChannel === "sms" && (
                        `KITANDA YETU: Fatura ${sale.invoiceNumber} de ${formatKwanza(sale.total)} gerada para ${sale.clientName}. Assinado AGT: ${sale.hash}.`
                      )}
                      {commChannel === "whatsapp" && (
                        `Olá ${sale.clientName}! Segue o comprovativo da Kitanda Yetu. Doc: ${sale.invoiceNumber} no valor de ${formatKwanza(sale.total)}. Hash AGT: ${sale.hash}. Telefone de envio: ${commRecipient}`
                      )}
                      {commChannel === "email" && (
                        `Assunto: Fatura Oficial ${sale.invoiceNumber} - Kitanda Yetu, Lda.\nPrezado cliente ${sale.clientName}, anexamos a sua fatura eletrónica assinada digitalmente de acordo com as normas da AGT no valor de ${formatKwanza(sale.total)}.`
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Print / Export buttons */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-4 shrink-0 mt-4 md:mt-0">
            <button
              onClick={handleCopyCSV}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 font-bold text-xs text-zinc-300 rounded-xl flex items-center justify-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              {copied ? "Descarregado!" : "Exportar Excel (CSV)"}
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 font-extrabold text-xs text-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-405/5 transition"
            >
              <Printer className="w-4 h-4" />
              Imprimir Fatura
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition hidden md:block"
            >
              Fechar Visualização
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
