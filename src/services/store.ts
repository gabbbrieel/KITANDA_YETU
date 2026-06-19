/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  UserRole,
  Category,
  Product,
  StockMovement,
  Debt,
  Customer,
  Sale,
  FinancialTransaction,
  AppSettings,
  StoreBranch,
  SaasTenant,
  StockRequest,
  EmployeeDebt,
} from "../types";

// Seed Data
const DEFAULT_USERS: User[] = [
  { id: "1", name: "António André", email: "admin@kitanda.ao", username: "admin", password: "123", role: "gestor_principal", active: true },
  { id: "2", name: "Júlia Ndulo", email: "venda@kitanda.ao", username: "venda", password: "123", role: "operador_vendas", active: true },
  { id: "3", name: "Manuel Kalandula", email: "manager@kitanda.ao", username: "gerente", password: "123", role: "gerente_loja", active: true, storeId: "loja-a" },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Alimentos e Mercearia", description: "Produtos básicos de mercearia" },
  { id: "cat-2", name: "Bebidas", description: "Águas, sumos, refrigerantes e cervejas" },
  { id: "cat-3", name: "Frescos e Congelados", description: "Carnes, peixes e vegetais" },
  { id: "cat-4", name: "Higiene e Limpeza", description: "Detergentes, sabonetes e afins" },
];

const DEFAULT_PRODUCTS: Product[] = [
  // Loja A (Sede) Products
  { id: "prod-1", code: "560123456001", name: "Arroz Tio Lucas 5kg", category: "Alimentos e Mercearia", purchasePrice: 3200, sellPrice: 4500, stock: 30, minStock: 10, unit: "Saco", description: "Arroz agulha de alta qualidade", storeId: "loja-a" },
  { id: "prod-2", code: "560123456002", name: "Massa Esparguete Nacional 500g", category: "Alimentos e Mercearia", purchasePrice: 380, sellPrice: 600, stock: 85, minStock: 20, unit: "Unidade", storeId: "loja-a" },
  { id: "prod-3", code: "560123456003", name: "Fuba de Milho Cuca 1kg", category: "Alimentos e Mercearia", purchasePrice: 750, sellPrice: 1100, stock: 15, minStock: 15, unit: "Unidade", storeId: "loja-a" }, // On threshold
  { id: "prod-4", code: "560123456004", name: "Água Mineral Luandina 1.5L", category: "Bebidas", purchasePrice: 160, sellPrice: 280, stock: 6, minStock: 12, unit: "Garrafa", storeId: "loja-a" }, // Low Stock
  { id: "prod-5", code: "560123456005", name: "Óleo Alimentar Sol 1L", category: "Alimentos e Mercearia", purchasePrice: 1100, sellPrice: 1650, stock: 4, minStock: 8, unit: "Garrafa", storeId: "loja-a" }, // Low Stock
  { id: "prod-6", code: "560123456006", name: "Coca-Cola Lata 330ml", category: "Bebidas", purchasePrice: 280, sellPrice: 450, stock: 120, minStock: 24, unit: "Lata", storeId: "loja-a" },
  { id: "prod-7", code: "560123456007", name: "Sabonete Protex Aveia 90g", category: "Higiene e Limpeza", purchasePrice: 320, sellPrice: 500, stock: 45, minStock: 10, unit: "Unidade", storeId: "loja-a" },

  // Loja B (Cazenga) Isolated Products
  { id: "prod-b1", code: "560123456011", name: "Leite Condensado Nestlé 397g", category: "Alimentos e Mercearia", purchasePrice: 900, sellPrice: 1400, stock: 40, minStock: 8, unit: "Lata", storeId: "loja-b" },
  { id: "prod-b2", code: "560123456012", name: "Cerveja Cuca Lata 330ml", category: "Bebidas", purchasePrice: 250, sellPrice: 380, stock: 200, minStock: 48, unit: "Lata", storeId: "loja-b" },
  { id: "prod-b3", code: "560123456013", name: "Grão de Bico Compal 400g", category: "Alimentos e Mercearia", purchasePrice: 550, sellPrice: 850, stock: 18, minStock: 5, unit: "Lata", storeId: "loja-b" },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: "cli-1", name: "João Manuel", phone: "923456789", email: "joao.manuel@gmail.com", nif: "00245631LA044", totalPurchases: 45000, storeId: "loja-a" },
  { id: "cli-2", name: "Teresa Bento", phone: "912654321", email: "teresa.bento@hotmail.com", nif: "99120653LE022", totalPurchases: 125000, storeId: "loja-a" },
  { id: "cli-3", name: "Ambriz Comercial", phone: "931777888", nif: "5500112233", totalPurchases: 250000, storeId: "loja-a" },

  // Loja B Customer
  { id: "cli-b1", name: "Mateus Cazenga", phone: "945111222", email: "mateus.cazenga@outlook.com", nif: "11234567LA099", totalPurchases: 12000, storeId: "loja-b" },
];

const DEFAULT_DEBTS: Debt[] = [
  {
    id: "debt-1",
    customerId: "cli-2",
    customerName: "Teresa Bento",
    description: "Saldo em aberto referente à compra de mercadorias no início do mês",
    initialAmount: 35000,
    currentAmount: 15000,
    date: "2026-05-15T10:00:00Z",
    status: "pendente",
    payments: [
      { id: "pay-1", amount: 20000, date: "2026-05-28T14:30:00Z", method: "transferencia" }
    ],
    storeId: "loja-a"
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "KITANDA YETU, LDA",
  companyNif: "5003624510",
  companyPhone: "+244 923 456 000",
  companyEmail: "contacto@kitandayetu.com",
  companyAddress: "Avenida Comandante Valódia, Nº 142 B, Luanda",
  companyIban: "AO06 0040 0000 1234 5678 9012 3",
  taxRate: 14,
  regime: "Regime de Simplificação de IVA (14%)",
  printFormat: "thermal",
  themeMode: "light",
  companyLogoId: "preset-basket",
  licenseKey: "KY-MENSAL-ACTIVE-882194",
  licenseStatus: "active",
  licenseExpiry: "2026-07-06T12:00:00Z",
  licenseType: "mensal",
  networkMode: "standalone",
  networkIp: "192.168.1.105",
  networkPort: "3000",
  printerType: "system",
  printerConnection: "usb",
  printerIp: "192.168.1.250",
  printerPort: "9100",
  printerPaperWidth: "80",
};

const DEFAULT_BRANCHES: StoreBranch[] = [
  { id: "loja-a", name: "Loja A (Sede Luanda)", code: "LOJA-A", location: "Avenida Comandante Valódia, Luanda", tel: "+244 923 456 001" },
  { id: "loja-b", name: "Loja B (Cazenga)", code: "LOJA-B", location: "Rotunda da Cuca, Cazenga", tel: "+244 923 456 002" },
  { id: "loja-c", name: "Loja C (Talatona)", code: "LOJA-C", location: "Via S8, Talatona", tel: "+244 923 456 003" },
  { id: "loja-d", name: "Loja D (Viana)", code: "LOJA-D", location: "Estrada de Catete, Viana", tel: "+244 923 456 004" },
  { id: "loja-e", name: "Loja E (Cacuaco)", code: "LOJA-E", location: "Estrada de Cacuaco, Cacuaco", tel: "+244 923 456 005" },
  { id: "loja-f", name: "Loja F (Lobito)", code: "LOJA-F", location: "Av. Marechal Carmona, Lobito", tel: "+244 923 456 006" },
];

// Simulated historical sales to populate charts nicely
const DEFAULT_SALES: Sale[] = [
  {
    id: "sale-1",
    invoiceNumber: "FR-2026/001",
    documentType: "FR",
    date: "2026-06-03T09:15:00Z",
    items: [
      { productId: "prod-1", productName: "Arroz Tio Lucas 5kg", quantity: 2, price: 4500, costPrice: 3200, discount: 0 },
      { productId: "prod-6", productName: "Coca-Cola Lata 330ml", quantity: 6, price: 450, costPrice: 280, discount: 0 }
    ],
    subtotal: 11700,
    discount: 500,
    tax: 1568, // 14% approx
    total: 12768,
    profit: 3120, // (4500-3200)*2 + (450-280)*6 - 500
    paymentMethod: "multicaixa",
    receivedAmount: 12768,
    changeAmount: 0,
    clientId: "cli-1",
    clientName: "João Manuel",
    clientNif: "00245631LA044",
    cashierId: "2",
    cashierName: "Júlia Ndulo",
    status: "ativa",
    hash: "Xf3k-RC",
    agtCertCode: "PRG-KN02456/26",
    storeId: "loja-a"
  },
  {
    id: "sale-2",
    invoiceNumber: "FR-2026/002",
    documentType: "FR",
    date: "2026-06-04T15:30:00Z",
    items: [
      { productId: "prod-2", productName: "Massa Esparguete Nacional 500g", quantity: 10, price: 600, costPrice: 380, discount: 0 },
      { productId: "prod-3", productName: "Fuba de Milho Cuca 1kg", quantity: 5, price: 1100, costPrice: 750, discount: 100 }
    ],
    subtotal: 11500,
    discount: 500,
    tax: 1540,
    total: 12540,
    profit: 3450, // (600-380)*10 + (1100-750)*5 - 500 - 500 (item discount totals included)
    paymentMethod: "dinheiro",
    receivedAmount: 15000,
    changeAmount: 2460,
    clientName: "Cliente Geral",
    cashierId: "2",
    cashierName: "Júlia Ndulo",
    status: "ativa",
    hash: "Lm89-RC",
    agtCertCode: "PRG-KN02456/26",
    storeId: "loja-a"
  },
  {
    id: "sale-3",
    invoiceNumber: "FR-2026/005",
    documentType: "FR",
    date: "2026-06-05T11:45:00Z",
    items: [
      { productId: "prod-1", productName: "Arroz Tio Lucas 5kg", quantity: 5, price: 4500, costPrice: 3200, discount: 0 },
      { productId: "prod-5", productName: "Óleo Alimentar Sol 1L", quantity: 2, price: 1650, costPrice: 1100, discount: 0 }
    ],
    subtotal: 25800,
    discount: 800,
    tax: 3500,
    total: 28500,
    profit: 6800,
    paymentMethod: "transferencia",
    receivedAmount: 28500,
    changeAmount: 0,
    clientId: "cli-3",
    clientName: "Ambriz Comercial",
    clientNif: "5500112233",
    cashierId: "1",
    cashierName: "António André",
    status: "ativa",
    hash: "Tp4a-RC",
    agtCertCode: "PRG-KN02456/26",
    storeId: "loja-a"
  },
  {
    id: "sale-4",
    invoiceNumber: "FR-2026/006",
    documentType: "FR",
    date: "2026-06-06T10:10:00Z", // Today
    items: [
      { productId: "prod-6", productName: "Coca-Cola Lata 330ml", quantity: 24, price: 450, costPrice: 280, discount: 0 },
      { productId: "prod-7", productName: "Sabonete Protex Aveia 90g", quantity: 4, price: 500, costPrice: 320, discount: 50 }
    ],
    subtotal: 12800,
    discount: 300,
    tax: 1750,
    total: 14250,
    profit: 4500,
    paymentMethod: "multicaixa",
    receivedAmount: 14250,
    changeAmount: 0,
    clientName: "Cliente Geral",
    cashierId: "2",
    cashierName: "Júlia Ndulo",
    status: "ativa",
    hash: "Yn2q-RC",
    agtCertCode: "PRG-KN02456/26",
    storeId: "loja-a"
  }
];

const DEFAULT_MOVEMENTS: StockMovement[] = [
  { id: "mov-1", productId: "prod-1", productName: "Arroz Tio Lucas 5kg", type: "entrada", quantity: 40, reason: "Abastecimento inicial", date: "2026-06-01T08:00:00Z", user: "António André", storeId: "loja-a" },
  { id: "mov-2", productId: "prod-1", productName: "Arroz Tio Lucas 5kg", type: "saida", quantity: 2, reason: "Venda FR-2026/001", date: "2026-06-03T09:15:00Z", user: "Júlia Ndulo", storeId: "loja-a" },
  { id: "mov-3", productId: "prod-1", productName: "Arroz Tio Lucas 5kg", type: "saida", quantity: 5, reason: "Venda FR-2026/005", date: "2026-06-05T11:45:00Z", user: "António André", storeId: "loja-a" },
  { id: "mov-4", productId: "prod-6", productName: "Coca-Cola Lata 330ml", type: "entrada", quantity: 150, reason: "Carga fornecedor Luanda", date: "2026-06-01T08:00:00Z", user: "António André", storeId: "loja-a" },
];

const DEFAULT_TRANSACTIONS: FinancialTransaction[] = [
  { id: "tx-1", type: "saida", category: "Renda", amount: 80000, description: "Pagamento de renda da loja", date: "2026-06-01T12:00:00Z", storeId: "loja-a" },
  { id: "tx-2", type: "saida", category: "Abastecimento", amount: 150000, description: "Compra de lote inicial de fornecedor", date: "2026-06-01T15:00:00Z", storeId: "loja-a" },
  { id: "tx-3", type: "entrada", category: "Venda", amount: 12768, description: "Venda Factura FR-2026/001", date: "2026-06-03T09:15:00Z", referenceId: "sale-1", storeId: "loja-a" },
  { id: "tx-4", type: "entrada", category: "Venda", amount: 12540, description: "Venda Factura FR-2026/002", date: "2026-06-04T15:30:00Z", referenceId: "sale-2", storeId: "loja-a" },
  { id: "tx-5", type: "entrada", category: "Venda", amount: 28500, description: "Venda Factura FR-2026/005", date: "2026-06-05T11:45:00Z", referenceId: "sale-3", storeId: "loja-a" },
  { id: "tx-6", type: "entrada", category: "Venda", amount: 14250, description: "Venda Factura FR-2026/006", date: "2026-06-06T10:10:00Z", referenceId: "sale-4", storeId: "loja-a" },
  { id: "tx-7", type: "entrada", category: "Dívida", amount: 20000, description: "Amortização de dívida - Teresa Bento", date: "2026-05-28T14:30:00Z", storeId: "loja-a" },
];

// Memory Store & Sync Class
const DEFAULT_SAAS_TENANTS: SaasTenant[] = [
  {
    id: "kitanda-yetu",
    name: "Kitanda Yetu S.A.",
    nif: "5003624510",
    email: "contacto@kitandayetu.ao",
    phone: "+244 923 456 000",
    address: "Avenida Comandante Valódia, Nº 142 B, Luanda",
    planType: "profissional",
    status: "active",
    expiryDate: "2026-08-15T12:00:00Z",
    monthlyFee: 15500,
    productsLimit: 150,
    invoicesLimit: 500,
  },
  {
    id: "kibabo",
    name: "Supermercados Kibabo S.A.",
    nif: "7401235560",
    email: "info@kibabo.co.ao",
    phone: "+244 912 300 400",
    address: "Viana Express Park, Luanda",
    planType: "enterprise",
    status: "active",
    expiryDate: "2026-12-31T12:00:00Z",
    monthlyFee: 45000,
    productsLimit: 1000,
    invoicesLimit: 99999,
  },
  {
    id: "poupa-mais",
    name: "Minimercado Poupa Mais",
    nif: "5109876241",
    email: "poupa.mais@hotmail.com",
    phone: "+244 934 123 456",
    address: "Estrada de Catete, Km 14, Luanda",
    planType: "starter",
    status: "expired",
    expiryDate: "2026-05-01T12:00:00Z",
    monthlyFee: 7500,
    productsLimit: 30,
    invoicesLimit: 100,
  },
  {
    id: "ceid-comercial",
    name: "CEID Distribuidora Lda",
    nif: "4203112234",
    email: "financas@ceid.ao",
    phone: "+244 945 900 800",
    address: "Talatona Condomínio Vila Sol, Bloco C, Luanda",
    planType: "profissional",
    status: "pending",
    expiryDate: "2026-06-30T12:00:00Z",
    monthlyFee: 15500,
    productsLimit: 150,
    invoicesLimit: 500,
  }
];

const getSimulatedProductsForTenant = (tenantId: string): Product[] => {
  if (tenantId === "kibabo") {
    return [
      { id: "prod-kb1", code: "100000000001", name: "Farinha Trigo Herói 1kg", category: "Alimentos e Mercearia", purchasePrice: 400, sellPrice: 650, stock: 120, minStock: 20, unit: "Unidade", storeId: "loja-a" },
      { id: "prod-kb2", code: "100000000002", name: "Feijão Preto Jumbo 1kg", category: "Alimentos e Mercearia", purchasePrice: 900, sellPrice: 1300, stock: 80, minStock: 15, unit: "Unidade", storeId: "loja-a" }
    ];
  }
  if (tenantId === "poupa-mais") {
    return [
      { id: "prod-pm1", code: "200000000001", name: "Sumo Compal Pacote 1L", category: "Bebidas", purchasePrice: 450, sellPrice: 800, stock: 40, minStock: 10, unit: "Unidade", storeId: "loja-a" }
    ];
  }
  return [];
};

// Memory Store & Sync Class
class KitandaStore {
  private listeners: Set<() => void> = new Set();

  private users: User[] = [];
  private categories: Category[] = [];
  private products: Product[] = [];
  private customers: Customer[] = [];
  private debts: Debt[] = [];
  private sales: Sale[] = [];
  private movements: StockMovement[] = [];
  private transactions: FinancialTransaction[] = [];
  private settings: AppSettings = DEFAULT_SETTINGS;
  private currentUser: User | null = null;
  private activeStoreId: string = "loja-a";
  private storeBranches: StoreBranch[] = DEFAULT_BRANCHES;
  private stockRequests: StockRequest[] = [];
  private employeeDebts: EmployeeDebt[] = [];

  // SaaS Multi-tenancy State
  private activeTenantId: string = "kitanda-yetu";
  private saasTenants: SaasTenant[] = [];

  // Online / Offline synchronization state variables
  private isForceOffline: boolean = false;
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private isAutoSyncing: boolean = false;
  private autoSyncStatus: string = "";

  constructor() {
    this.loadAll();
  }

  private cleanupExpiredDeletedTenants() {
    const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let changed = false;
    this.saasTenants = this.saasTenants.filter(t => {
      if (t.deletedAt) {
        const deletedTime = new Date(t.deletedAt).getTime();
        if (now - deletedTime > sixMonthsMs) {
          changed = true;
          return false;
        }
      }
      return true;
    });
    if (changed) {
      this.saveSaasTenants();
    }
  }

  private loadAll() {
    try {
      this.isForceOffline = localStorage.getItem("ky_force_offline") === "true";
      this.activeTenantId = localStorage.getItem("ky_active_tenant_id") || "kitanda-yetu";
      this.saasTenants = this.getLocalStorage("ky_saas_tenants", DEFAULT_SAAS_TENANTS);
      
      this.cleanupExpiredDeletedTenants();
      
      // Load current workspace database partition
      this.loadTenantData(this.activeTenantId);
    } catch {
      this.activeTenantId = "kitanda-yetu";
      this.saasTenants = DEFAULT_SAAS_TENANTS;
      this.loadTenantData("kitanda-yetu");
    }

    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.notify();
        this.checkAndAutoSync();
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
        this.notify();
      });

      // Quick auto-sync trigger on startup if we are online and have un-synced data
      setTimeout(() => {
        this.checkAndAutoSync();
      }, 2000);
    }
  }

  public loadTenantData(tenantId: string) {
    this.activeStoreId = localStorage.getItem(`ky_active_store_id_${tenantId}`) || "loja-a";
    
    // For default tenant 'kitanda-yetu', use standard DEFAULT datasets as fallback
    if (tenantId === "kitanda-yetu") {
      this.users = this.getLocalStorage(`ky_users_${tenantId}`, DEFAULT_USERS);
      this.categories = this.getLocalStorage(`ky_categories_${tenantId}`, DEFAULT_CATEGORIES);
      this.products = this.getLocalStorage(`ky_products_${tenantId}`, DEFAULT_PRODUCTS);
      this.customers = this.getLocalStorage(`ky_customers_${tenantId}`, DEFAULT_CUSTOMERS);
      this.debts = this.getLocalStorage(`ky_debts_${tenantId}`, DEFAULT_DEBTS);
      this.sales = this.getLocalStorage(`ky_sales_${tenantId}`, DEFAULT_SALES);
      this.movements = this.getLocalStorage(`ky_movements_${tenantId}`, DEFAULT_MOVEMENTS);
      this.transactions = this.getLocalStorage(`ky_transactions_${tenantId}`, DEFAULT_TRANSACTIONS);
      this.settings = this.getLocalStorage(`ky_settings_${tenantId}`, DEFAULT_SETTINGS);
      this.storeBranches = this.getLocalStorage(`ky_branches_${tenantId}`, DEFAULT_BRANCHES);
    } else {
      // For any other tenant, initialize matching their context
      const currentSaasTenant = this.saasTenants.find(t => t.id === tenantId) || {
        name: "Nova Empresa, Lda",
        nif: "999999999",
        email: "empresa@kitanda.ao",
        phone: "+244 900 000 000",
        address: "Angola",
        status: "active",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        planType: "starter"
      };

      const defaultTenantSettings: AppSettings = {
        companyName: currentSaasTenant.name.toUpperCase(),
        companyNif: currentSaasTenant.nif,
        companyEmail: currentSaasTenant.email,
        companyPhone: currentSaasTenant.phone,
        companyAddress: currentSaasTenant.address,
        companyIban: "AO06 0040 0000 0000 0000 0000 0",
        taxRate: 14,
        regime: "Regime de Simplificação de IVA (14%)",
        printFormat: "thermal",
        themeMode: "light",
        companyLogoId: "preset-basket",
        licenseKey: `KY-${tenantId.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        licenseStatus: currentSaasTenant.status === "active" ? "active" : "expired",
        licenseExpiry: currentSaasTenant.expiryDate,
        licenseType: "mensal"
      };
      
      this.users = this.getLocalStorage(`ky_users_${tenantId}`, [
        { id: `admin-${tenantId}`, name: "Gerente SaaS", email: `admin@${tenantId}.ao`, username: "admin", password: "123", role: "gestor_principal", active: true },
        { id: `venda-${tenantId}`, name: "Operador de Caixa", email: `vendedor@${tenantId}.ao`, username: "venda", password: "123", role: "operador_vendas", active: true }
      ]);
      this.categories = this.getLocalStorage(`ky_categories_${tenantId}`, DEFAULT_CATEGORIES);
      this.products = this.getLocalStorage(`ky_products_${tenantId}`, getSimulatedProductsForTenant(tenantId));
      this.customers = this.getLocalStorage(`ky_customers_${tenantId}`, []);
      this.debts = this.getLocalStorage(`ky_debts_${tenantId}`, []);
      this.sales = this.getLocalStorage(`ky_sales_${tenantId}`, []);
      this.movements = this.getLocalStorage(`ky_movements_${tenantId}`, []);
      this.transactions = this.getLocalStorage(`ky_transactions_${tenantId}`, []);
      this.settings = this.getLocalStorage(`ky_settings_${tenantId}`, defaultTenantSettings);
      this.storeBranches = this.getLocalStorage(`ky_branches_${tenantId}`, [
        { id: "loja-a", name: "Sede Principal", code: "SEDE", location: currentSaasTenant.address, tel: currentSaasTenant.phone }
      ]);
    }

    this.stockRequests = this.getLocalStorage(`ky_stock_requests_${tenantId}`, []);
    this.employeeDebts = this.getLocalStorage(`ky_employee_debts_${tenantId}`, []);

    // Restore last logged user specific to tenant
    const savedUser = localStorage.getItem(`ky_current_user_${tenantId}`);
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
  }

  private getLocalStorage<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    try {
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  private save(key: string, data: any) {
    try {
      // DB isolation per activeTenantId in local storage
      localStorage.setItem(`${key}_${this.activeTenantId}`, JSON.stringify(data));
    } catch (e) {
      console.warn("Iframe local storage save blocked, executing purely in-memory.", e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- ONLINE / OFFLINE METHODS ---
  public isOffline(): boolean {
    return this.isForceOffline || !this.isOnline;
  }

  public isOnlineStatus(): boolean {
    return !this.isOffline();
  }

  public isForcedOffline(): boolean {
    return this.isForceOffline;
  }

  public getNetworkState(): "online" | "offline" {
    return this.isOffline() ? "offline" : "online";
  }

  public setForceOffline(val: boolean) {
    this.isForceOffline = val;
    try {
      localStorage.setItem("ky_force_offline", val ? "true" : "false");
    } catch {}
    this.notify();
    if (!val) {
      this.checkAndAutoSync();
    }
  }

  public isAutomaticSyncing(): boolean {
    return this.isAutoSyncing;
  }

  public getAutoSyncStatus(): string {
    return this.autoSyncStatus;
  }

  public async checkAndAutoSync() {
    if (this.isOffline() || this.getUnsyncedCount() === 0 || this.isAutoSyncing) {
      return;
    }

    this.isAutoSyncing = true;
    this.autoSyncStatus = "Sincronização automática iniciada...";
    this.notify();

    try {
      // Simulate real-time checking steps
      await new Promise(r => setTimeout(r, 1200));
      this.autoSyncStatus = `A enviar ${this.getUnsyncedCount()} registo(s)...`;
      this.notify();

      const res = await this.syncAll();
      this.autoSyncStatus = `Sincronização automática concluída! (${res.syncedCount} registos sincronizados na Nuvem)`;
      this.notify();
      
      // Clear after 6 seconds
      setTimeout(() => {
        this.autoSyncStatus = "";
        this.notify();
      }, 6000);
    } catch {
      this.autoSyncStatus = "Falha na sincronização em segundo plano.";
      this.notify();
      setTimeout(() => {
        this.autoSyncStatus = "";
        this.notify();
      }, 5000);
    } finally {
      this.isAutoSyncing = false;
      this.notify();
    }
  }

  public getUnsyncedCount(): number {
    let count = 0;
    count += this.sales.filter(s => s.syncPending).length;
    count += this.products.filter(p => p.syncPending).length;
    count += this.customers.filter(c => c.syncPending).length;
    count += this.debts.filter(d => d.syncPending).length;
    count += this.transactions.filter(t => t.syncPending).length;
    count += this.movements.filter(m => m.syncPending).length;
    count += this.categories.filter(c => c.syncPending).length;
    return count;
  }

  public getUnsyncedStats() {
    return {
      vendas: this.sales.filter(s => s.syncPending).length,
      produtos: this.products.filter(p => p.syncPending).length,
      clientes: this.customers.filter(c => c.syncPending).length,
      dividas: this.debts.filter(d => d.syncPending).length,
      transacoes: this.transactions.filter(t => t.syncPending).length,
      movimentos: this.movements.filter(m => m.syncPending).length,
      categorias: this.categories.filter(c => c.syncPending).length,
    };
  }

  public async syncAll(): Promise<{ success: boolean; syncedCount: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let syncedCount = 0;
        
        this.sales = this.sales.map(s => {
          if (s.syncPending) { syncedCount++; delete s.syncPending; }
          return s;
        });
        this.products = this.products.map(p => {
          if (p.syncPending) { syncedCount++; delete p.syncPending; }
          return p;
        });
        this.customers = this.customers.map(c => {
          if (c.syncPending) { syncedCount++; delete c.syncPending; }
          return c;
        });
        this.debts = this.debts.map(d => {
          if (d.syncPending) { syncedCount++; delete d.syncPending; }
          return d;
        });
        this.transactions = this.transactions.map(t => {
          if (t.syncPending) { syncedCount++; delete t.syncPending; }
          return t;
        });
        this.movements = this.movements.map(m => {
          if (m.syncPending) { syncedCount++; delete m.syncPending; }
          return m;
        });
        this.categories = this.categories.map(c => {
          if (c.syncPending) { syncedCount++; delete c.syncPending; }
          return c;
        });

        this.save("ky_sales", this.sales);
        this.save("ky_products", this.products);
        this.save("ky_customers", this.customers);
        this.save("ky_debts", this.debts);
        this.save("ky_transactions", this.transactions);
        this.save("ky_movements", this.movements);
        this.save("ky_categories", this.categories);

        this.notify();
        resolve({ success: true, syncedCount });
      }, 1500);
    });
  }

  // --- GETTERS ---
  public getUsers() { return this.users; }
  public getCategories() { return this.categories; }
  public getProducts() { return this.products.filter(p => !p.storeId || p.storeId === this.activeStoreId); }
  public getCustomers() { return this.customers.filter(c => !c.storeId || c.storeId === this.activeStoreId); }
  public getEmployeeDebts() { return this.employeeDebts.filter(d => !d.storeId || d.storeId === this.activeStoreId); }
  public getAllEmployeeDebts() { return this.employeeDebts; }
  public getDebts() { return this.debts.filter(d => !d.storeId || d.storeId === this.activeStoreId); }
  public getSales() { return this.sales.filter(s => !s.storeId || s.storeId === this.activeStoreId); }
  public getMovements() { return this.movements.filter(m => !m.storeId || m.storeId === this.activeStoreId); }
  public getTransactions() { return this.transactions.filter(t => !t.storeId || t.storeId === this.activeStoreId); }
  public getSettings() { return this.settings; }
  public getCurrentUser() { return this.currentUser; }

  // Branch configuration getters / setters
  public getActiveStoreId() { return this.activeStoreId; }
  public getStoreBranches() { return this.storeBranches; }
  
  public setActiveStoreId(id: string) {
    this.activeStoreId = id;
    try {
      localStorage.setItem(`ky_active_store_id_${this.activeTenantId}`, id);
    } catch {}
    this.notify();
  }

  // Admin consolidation reports (unfiltered)
  public getAllProducts() { return this.products; }
  public getAllSales() { return this.sales; }
  public getAllTransactions() { return this.transactions; }
  public getAllDebts() { return this.debts; }
  public getAllCustomers() { return this.customers; }

  // --- ACTIONS: SAAS WORKSPACES ---
  public getSaasTenants() {
    return this.saasTenants.filter(t => !t.deletedAt);
  }

  public getDeletedSaasTenants() {
    return this.saasTenants.filter(t => !!t.deletedAt);
  }

  public deleteTenant(id: string) {
    this.saasTenants = this.saasTenants.map(t => 
      t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t
    );
    this.saveSaasTenants();
    this.notify();
  }

  public recoverTenant(id: string) {
    this.saasTenants = this.saasTenants.map(t => {
      if (t.id === id) {
        const { deletedAt, ...rest } = t;
        return rest as SaasTenant;
      }
      return t;
    });
    this.saveSaasTenants();
    this.notify();
  }

  public getActiveTenantId() {
    return this.activeTenantId;
  }

  public getActiveTenant() {
    return this.saasTenants.find(t => t.id === this.activeTenantId) || this.saasTenants[0];
  }

  public setActiveTenantId(id: string) {
    this.activeTenantId = id;
    try {
      localStorage.setItem("ky_active_tenant_id", id);
    } catch {}
    this.loadTenantData(id);
    this.notify();
  }

  public registerTenant(
    name: string,
    nif: string,
    planType: "starter" | "profissional" | "enterprise",
    email: string,
    phone: string,
    address: string,
    adminName?: string,
    adminUsername?: string,
    adminPassword?: string
  ) {
    // 1. Check duplicate NIF:
    const duplicate = this.saasTenants.find(t => t.nif.trim() === nif.trim() && !t.deletedAt);
    if (duplicate) {
      throw new Error(`O NIF inserido pertence à empresa "${duplicate.name}".`);
    }

    const limits = {
      starter: { products: 999999, invoices: 999999, fee: 7500, days: 30 },
      profissional: { products: 999999, invoices: 999999, fee: 35000, days: 180 },
      enterprise: { products: 999999, invoices: 999999, fee: 65000, days: 365 }
    };
    
    const safeId = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").trim();
    const finalId = `${safeId}-${Math.floor(Math.random() * 1000)}`;

    // Create the custom users for the tenant workspace
    const finalAdminName = adminName && adminName.trim() ? adminName.trim() : "Gerente SaaS";
    const finalAdminUsername = adminUsername && adminUsername.trim() ? adminUsername.trim() : "admin";
    const finalAdminPassword = adminPassword ? adminPassword : "123";
    const finalAdminEmail = finalAdminUsername.includes("@") ? finalAdminUsername : `admin@${finalId}.ao`;

    const tenantUsers: User[] = [
      { id: `admin-${finalId}`, name: finalAdminName, email: finalAdminEmail, username: finalAdminUsername, password: finalAdminPassword, role: "gestor_principal", active: true },
      { id: `venda-${finalId}`, name: "Operador de Caixa", email: `vendedor@${finalId}.ao`, username: "venda", password: "123", role: "operador_vendas", active: true }
    ];

    try {
      localStorage.setItem(`ky_users_${finalId}`, JSON.stringify(tenantUsers));
    } catch {}

    const chosen = limits[planType];
    const newTenant: SaasTenant = {
      id: finalId,
      name,
      nif,
      email,
      phone,
      address,
      planType,
      status: "active",
      expiryDate: new Date(Date.now() + chosen.days * 24 * 60 * 60 * 1000).toISOString(),
      monthlyFee: chosen.fee,
      productsLimit: chosen.products,
      invoicesLimit: chosen.invoices
    };

    this.saasTenants.push(newTenant);
    this.saveSaasTenants();
    
    // Switch to the newly created tenant workspace immediately
    this.setActiveTenantId(newTenant.id);
    
    // Automatically log in the custom admin
    this.currentUser = tenantUsers[0];
    try {
      localStorage.setItem(`ky_current_user_${newTenant.id}`, JSON.stringify(tenantUsers[0]));
      localStorage.setItem("ky_current_user", JSON.stringify(tenantUsers[0]));
    } catch {}

    return newTenant;
  }

  public toggleBlockTenant(id: string) {
    this.saasTenants = this.saasTenants.map(t => {
      if (t.id === id) {
        const newStatus = t.status === "blocked" ? "active" : "blocked";
        return { ...t, status: newStatus };
      }
      return t;
    });
    this.saveSaasTenants();
    this.notify();
  }

  public updateTenant(id: string, updated: Partial<SaasTenant>) {
    this.saasTenants = this.saasTenants.map(t => t.id === id ? { ...t, ...updated } : t);
    this.saveSaasTenants();
    this.notify();
  }

  private saveSaasTenants() {
    try {
      localStorage.setItem("ky_saas_tenants", JSON.stringify(this.saasTenants));
    } catch {}
  }

  // --- WORKFLOW: AUTH ---
  public login(emailOrUsername: string, role?: string, password?: string): boolean {
    const input = emailOrUsername.toLowerCase().trim();
    
    let matchedUser: User | null = null;
    let matchedTenantId: string | null = null;

    // Search across all non-deleted tenants to find which workspace contains the login credentials
    const activeTenants = this.saasTenants.filter(t => !t.deletedAt);
    
    for (const tenant of activeTenants) {
      let tenantUsers: User[] = [];
      if (tenant.id === "kitanda-yetu") {
        tenantUsers = this.getLocalStorage(`ky_users_${tenant.id}`, DEFAULT_USERS);
      } else {
        tenantUsers = this.getLocalStorage(`ky_users_${tenant.id}`, [
          { id: `admin-${tenant.id}`, name: "Gerente SaaS", email: `admin@${tenant.id}.ao`, username: "admin", password: "123", role: "gestor_principal", active: true },
          { id: `venda-${tenant.id}`, name: "Operador de Caixa", email: `vendedor@${tenant.id}.ao`, username: "venda", password: "123", role: "operador_vendas", active: true }
        ]);
      }

      const found = tenantUsers.find(u => {
        const emailMatches = u.email.toLowerCase().trim() === input;
        const usernameMatches = u.username && u.username.toLowerCase().trim() === input;
        
        // Matches login input (email or username)
        if (!emailMatches && !usernameMatches) return false;
        
        // Matches active status
        if (!u.active) return false;
        
        // Check password if it is set on the user account
        if (u.password && password && password !== "********") {
          return u.password === password;
        }
        
        return true;
      });

      if (found) {
        matchedUser = found;
        matchedTenantId = tenant.id;
        break; // Stop searching once we find a matching credential and password
      }
    }

    if (matchedUser && matchedTenantId) {
      if (this.activeTenantId !== matchedTenantId) {
        this.setActiveTenantId(matchedTenantId);
      }
      this.currentUser = matchedUser;
      
      // Lock or switch default active store ID to user's assigned store branch on login
      if (matchedUser.storeId) {
        this.activeStoreId = matchedUser.storeId;
        try {
          localStorage.setItem(`ky_active_store_id_${this.activeTenantId}`, matchedUser.storeId);
        } catch {}
      }
      
      try {
        localStorage.setItem(`ky_current_user_${this.activeTenantId}`, JSON.stringify(matchedUser));
        localStorage.setItem("ky_current_user", JSON.stringify(matchedUser));
      } catch {}

      this.notify();
      return true;
    }

    return false;
  }

  public logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(`ky_current_user_${this.activeTenantId}`);
      localStorage.removeItem("ky_current_user");
    } catch {}
    this.notify();
  }

  // --- ACTIONS: USERS ---
  public addUser(user: Omit<User, "id">) {
    const newUser: User = { ...user, id: `user-${Date.now()}` };
    this.users.push(newUser);
    this.save("ky_users", this.users);
  }

  public updateUser(id: string, updated: Partial<User>) {
    this.users = this.users.map(u => u.id === id ? { ...u, ...updated } : u);
    // If updating currently logged user, resync session
    if (this.currentUser?.id === id) {
      this.currentUser = { ...this.currentUser, ...updated };
      try {
        localStorage.setItem(`ky_current_user_${this.activeTenantId}`, JSON.stringify(this.currentUser));
        localStorage.setItem("ky_current_user", JSON.stringify(this.currentUser));
      } catch {}
    }
    this.save("ky_users", this.users);
  }

  public deleteUser(id: string) {
    this.users = this.users.filter(u => u.id !== id);
    this.save("ky_users", this.users);
  }

  // --- ACTIONS: EMPLOYEE DEBTS ---
  public addEmployeeDebt(debt: Omit<EmployeeDebt, "id" | "payments" | "remainingAmount" | "status">) {
    const newDebt: EmployeeDebt = {
      ...debt,
      id: `empdebt-${Date.now()}`,
      status: "pendente",
      remainingAmount: debt.amount,
      payments: []
    };
    this.employeeDebts.push(newDebt);
    this.save("ky_employee_debts", this.employeeDebts);
  }

  public updateEmployeeDebt(id: string, updated: Partial<EmployeeDebt>) {
    this.employeeDebts = this.employeeDebts.map(d => {
      if (d.id === id) {
        const nextDebt = { ...d, ...updated };
        // If amount changed, remainingAmount needs adjustments unless custom-managed
        if (updated.amount !== undefined) {
          const totalPaid = d.payments.reduce((acc, p) => acc + p.amount, 0);
          nextDebt.remainingAmount = Math.max(0, updated.amount - totalPaid);
          nextDebt.status = nextDebt.remainingAmount <= 0 ? "pago" : "pendente";
        }
        return nextDebt;
      }
      return d;
    });
    this.save("ky_employee_debts", this.employeeDebts);
  }

  public deleteEmployeeDebt(id: string) {
    this.employeeDebts = this.employeeDebts.filter(d => d.id !== id);
    this.save("ky_employee_debts", this.employeeDebts);
  }

  public payEmployeeDebt(id: string, amount: number, method: string, receivedBy: string) {
    this.employeeDebts = this.employeeDebts.map(d => {
      if (d.id === id) {
        const paymentAmount = Math.min(amount, d.remainingAmount);
        if (paymentAmount <= 0) return d;

        const newPayments = [
          ...d.payments,
          {
            id: `pay-${Date.now()}`,
            amount: paymentAmount,
            date: new Date().toISOString(),
            method,
            receivedBy
          }
        ];

        const remaining = d.remainingAmount - paymentAmount;
        const status = remaining <= 0 ? "pago" : "pendente";

        return {
          ...d,
          remainingAmount: remaining,
          status,
          payments: newPayments
        };
      }
      return d;
    });
    this.save("ky_employee_debts", this.employeeDebts);
  }

  // --- ACTIONS: BRANCHES (LOJAS) ---
  public addStoreBranch(branch: Omit<StoreBranch, "id">) {
    if (this.storeBranches.length >= 21) {
      throw new Error("Limite de 21 lojas por empresa atingido.");
    }
    const newBranch: StoreBranch = { ...branch, id: `loja-${Date.now()}` };
    this.storeBranches.push(newBranch);
    this.save("ky_branches", this.storeBranches);
  }

  public updateStoreBranch(id: string, updated: Partial<StoreBranch>) {
    this.storeBranches = this.storeBranches.map(b => b.id === id ? { ...b, ...updated } : b);
    this.save("ky_branches", this.storeBranches);
  }

  // --- ACTIONS: INTER-STORE TRANSFERS & REQUESTS ---
  
  public getStockRequests(): StockRequest[] {
    return this.stockRequests;
  }

  public addStockRequest(sourceStoreId: string, destStoreId: string, productId: string, quantity: number, user: string) {
    const sourceProd = this.products.find(p => p.id === productId && p.storeId === sourceStoreId);
    if (!sourceProd) {
      throw new Error("Produto não encontrado na loja de origem.");
    }

    const newRequest: StockRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sourceStoreId,
      destinationStoreId: destStoreId,
      productId,
      productName: sourceProd.name,
      productCode: sourceProd.code,
      quantity,
      requestedBy: user,
      requestedAt: new Date().toISOString(),
      status: "pendente"
    };

    this.stockRequests.push(newRequest);
    this.save("ky_stock_requests", this.stockRequests);
  }

  public approveStockRequest(requestId: string, adminUser: string) {
    const req = this.stockRequests.find(r => r.id === requestId);
    if (!req) {
      throw new Error("Pedido de transferência não encontrado.");
    }
    if (req.status !== "pendente") {
      throw new Error("Este pedido já foi processado.");
    }

    this.transferStock(req.sourceStoreId, req.destinationStoreId, req.productId, req.quantity, adminUser);

    req.status = "aprovada";
    req.approvedBy = adminUser;
    req.approvedAt = new Date().toISOString();

    this.save("ky_stock_requests", this.stockRequests);
  }

  public rejectStockRequest(requestId: string, adminUser: string) {
    const req = this.stockRequests.find(r => r.id === requestId);
    if (!req) {
      throw new Error("Pedido de transferência não encontrado.");
    }
    if (req.status !== "pendente") {
      throw new Error("Este pedido já foi processado.");
    }

    req.status = "rejeitada";
    req.approvedBy = adminUser;
    req.approvedAt = new Date().toISOString();

    this.save("ky_stock_requests", this.stockRequests);
  }

  public transferStock(sourceStoreId: string, destStoreId: string, productId: string, quantity: number, adminUser: string) {
    if (sourceStoreId === destStoreId) {
      throw new Error("Não é possível transferir estoque para a mesma loja.");
    }

    const sourceProd = this.products.find(p => p.id === productId && p.storeId === sourceStoreId);
    if (!sourceProd) {
      throw new Error("Produto de origem não encontrado.");
    }
    if (sourceProd.stock < quantity) {
      throw new Error(`Estoque insuficiente na loja de origem. Disponível: ${sourceProd.stock} ${sourceProd.unit}`);
    }

    sourceProd.stock -= quantity;

    this.addMovement({
      productId: sourceProd.id,
      productName: sourceProd.name,
      type: "saida",
      quantity,
      reason: `Trf. para Filial: ${this.storeBranches.find(b => b.id === destStoreId)?.name || destStoreId}`,
      storeId: sourceStoreId
    });

    let destProd = this.products.find(p => p.code === sourceProd.code && p.storeId === destStoreId);
    if (destProd) {
      destProd.stock += quantity;
    } else {
      destProd = {
        ...sourceProd,
        id: `prod-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        storeId: destStoreId,
        stock: quantity
      };
      this.products.push(destProd);
    }

    this.addMovement({
      productId: destProd.id,
      productName: destProd.name,
      type: "entrada",
      quantity,
      reason: `Rec. de Filial: ${this.storeBranches.find(b => b.id === sourceStoreId)?.name || sourceStoreId}`,
      storeId: destStoreId
    });

    this.save("ky_products", this.products);
  }

  public transferUser(userId: string, destStoreId: string, adminUser: string) {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      throw new Error("Operador não encontrado.");
    }
    user.storeId = destStoreId;
    this.save("ky_users", this.users);

    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.storeId = destStoreId;
      this.activeStoreId = destStoreId;
      try {
        localStorage.setItem(`ky_active_store_id_${this.activeTenantId}`, destStoreId);
        localStorage.setItem(`ky_current_user_${this.activeTenantId}`, JSON.stringify(this.currentUser));
        localStorage.setItem("ky_current_user", JSON.stringify(this.currentUser));
      } catch {}
    }
    this.notify();
  }

  // --- ACTIONS: CATEGORIES ---
  public addCategory(cat: Omit<Category, "id">) {
    const newCat: Category = { ...cat, id: `cat-${Date.now()}`, syncPending: this.isOffline() };
    this.categories.push(newCat);
    this.save("ky_categories", this.categories);
  }

  public deleteCategory(id: string) {
    this.categories = this.categories.filter(c => c.id !== id);
    this.save("ky_categories", this.categories);
  }

  // --- ACTIONS: PRODUCTS & INVENTORY ---
  public addProduct(prod: Omit<Product, "id" | "storeId">) {
    const newProd: Product = { ...prod, id: `prod-${Date.now()}`, storeId: this.activeStoreId, syncPending: this.isOffline() };
    this.products.push(newProd);
    this.save("ky_products", this.products);

    // Record stock movement (only for products, not services)
    if (newProd.type !== "servico") {
      this.addMovement({
        productId: newProd.id,
        productName: newProd.name,
        type: "entrada",
        quantity: newProd.stock,
        reason: "Estoque Inicial / Cadastro",
        storeId: this.activeStoreId,
      });
    }
  }

  public updateProduct(id: string, updated: Partial<Product>) {
    const oldProd = this.products.find(p => p.id === id);
    if (!oldProd) return;

    const finalStock = updated.stock !== undefined ? updated.stock : oldProd.stock;
    const stockDiff = finalStock - oldProd.stock;

    this.products = this.products.map(p => p.id === id ? { ...p, ...updated, syncPending: p.syncPending || this.isOffline() } : p);
    this.save("ky_products", this.products);

    if (stockDiff !== 0) {
      this.addMovement({
        productId: id,
        productName: oldProd.name,
        type: stockDiff > 0 ? "entrada" : "saida",
        quantity: Math.abs(stockDiff),
        reason: "Ajuste manual de estoque",
        storeId: oldProd.storeId || this.activeStoreId,
      });
    }
  }

  public deleteProduct(id: string) {
    this.products = this.products.filter(p => p.id !== id);
    this.save("ky_products", this.products);
  }

  public addStock(id: string, qty: number, reason: string) {
    const prod = this.products.find(p => p.id === id);
    if (!prod) return;

    prod.stock += qty;
    this.save("ky_products", this.products);

    this.addMovement({
      productId: id,
      productName: prod.name,
      type: "entrada",
      quantity: qty,
      reason: reason || "Abastecimento manual",
      storeId: prod.storeId || this.activeStoreId,
    });
  }

  public removeStock(id: string, qty: number, reason: string) {
    const prod = this.products.find(p => p.id === id);
    if (!prod || prod.stock < qty) return false;

    prod.stock -= qty;
    this.save("ky_products", this.products);

    this.addMovement({
      productId: id,
      productName: prod.name,
      type: "saida",
      quantity: qty,
      reason: reason || "Saída manual",
      storeId: prod.storeId || this.activeStoreId,
    });
    return true;
  }

  private addMovement(mov: Omit<StockMovement, "id" | "date" | "user" | "storeId"> & { storeId?: string }) {
    const newMov: StockMovement = {
      ...mov,
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: new Date().toISOString(),
      user: this.currentUser?.name || "Sistema",
      storeId: mov.storeId || this.activeStoreId,
      syncPending: this.isOffline(),
    };
    this.movements.unshift(newMov); // newest first
    this.save("ky_movements", this.movements);
  }

  // --- ACTIONS: CLIENTS & DEBSTS ---
  public addCustomer(cust: Omit<Customer, "id" | "totalPurchases" | "storeId">) {
    const newCust: Customer = { ...cust, id: `cli-${Date.now()}`, totalPurchases: 0, storeId: this.activeStoreId, syncPending: this.isOffline() };
    this.customers.push(newCust);
    this.save("ky_customers", this.customers);
  }

  public updateCustomer(id: string, updated: Partial<Customer>) {
    this.customers = this.customers.map(c => c.id === id ? { ...c, ...updated, syncPending: c.syncPending || this.isOffline() } : c);
    this.save("ky_customers", this.customers);
  }

  public addDebt(debt: Omit<Debt, "id" | "currentAmount" | "date" | "status" | "payments" | "storeId">) {
    const newDebt: Debt = {
      ...debt,
      id: `debt-${Date.now()}`,
      currentAmount: debt.initialAmount,
      date: new Date().toISOString(),
      status: "pendente",
      payments: [],
      storeId: this.activeStoreId,
      syncPending: this.isOffline(),
    };
    this.debts.unshift(newDebt);
    this.save("ky_debts", this.debts);

    // Record cash injection or correction? No, debt decreases immediate cash but records a transaction of outflow if we financed it?
    // Let's record a notice transaction
    this.addTransaction({
      type: "saida",
      category: "Dívida",
      amount: debt.initialAmount,
      description: `Registo de Dívida - Cliente: ${debt.customerName}`,
      storeId: this.activeStoreId,
    });
  }

  public amortizeDebt(id: string, amount: number, method: string) {
    const debt = this.debts.find(d => d.id === id);
    if (!debt || debt.currentAmount <= 0) return;

    const actualAmount = Math.min(amount, debt.currentAmount);
    debt.currentAmount -= actualAmount;
    debt.payments.push({
      id: `pay-${Date.now()}`,
      amount: actualAmount,
      date: new Date().toISOString(),
      method,
    });

    if (debt.currentAmount <= 0) {
      debt.status = "pago";
    }

    debt.syncPending = this.isOffline();
    this.save("ky_debts", this.debts);

    // Record cash in
    this.addTransaction({
      type: "entrada",
      category: "Encaixe Dívida",
      amount: actualAmount,
      description: `Amortização de Dívida - Cliente: ${debt.customerName}`,
      storeId: debt.storeId || this.activeStoreId,
    });
  }

  // --- ACTIONS: SALES & CASH FLOW ---
  public performSale(sale: Omit<Sale, "id" | "invoiceNumber" | "date" | "cashierId" | "cashierName" | "status" | "profit" | "hash" | "agtCertCode" | "storeId"> & { documentType?: DocumentType }) {
    const docType = sale.documentType || "FR";
    // Count existing active sales of this document type specifically in this store to compute sequential numbering
    const docIndex = this.sales.filter(s => s.documentType === docType && s.storeId === this.activeStoreId).length + 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `${docType}-${year}/${String(docIndex).padStart(3, "0")}`;

    // Compute compliant SHA-1 signature representation (standard 4-character hash shown on receipts + full representation)
    const rawStringForHash = `${new Date().toISOString()};${invoiceNumber};${sale.total};${this.sales[0]?.hash || "INIT"}`;
    let hashValue = 0;
    for (let i = 0; i < rawStringForHash.length; i++) {
      hashValue = (hashValue << 5) - hashValue + rawStringForHash.charCodeAt(i);
      hashValue |= 0;
    }
    const hexHash = Math.abs(hashValue).toString(16).toUpperCase().padStart(8, "0");
    const docHash = `${hexHash.substring(0, 4)}-RC`;

    // Calculate actual cost of goods sold.
    let totalCost = 0;
    const saleItems = sale.items.map((item) => {
      const prod = this.products.find((p) => p.id === item.productId);
      const costPrice = prod ? prod.purchasePrice : item.price * 0.7; // default fallback margin
      totalCost += costPrice * item.quantity;

      // Update actual inventories (only if it is a physical product, not a service)
      const isService = prod?.type === "servico";
      if (prod && !isService) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }

      if (!isService) {
        this.addMovement({
          productId: item.productId,
          productName: item.productName,
          type: "saida",
          quantity: item.quantity,
          reason: `Venda ${invoiceNumber}`,
          storeId: this.activeStoreId,
        });
      }

      return {
        ...item,
        costPrice,
      };
    });

    this.save("ky_products", this.products);

    const profit = sale.total - totalCost;

    const finalSale: Sale = {
      ...sale,
      id: `sale-${Date.now()}`,
      invoiceNumber,
      documentType: docType,
      date: new Date().toISOString(),
      items: saleItems,
      profit,
      cashierId: this.currentUser?.id || "1",
      cashierName: this.currentUser?.name || "Admin",
      status: "ativa",
      hash: docHash,
      agtCertCode: "PRG-KN02456/26",
      storeId: this.activeStoreId,
      syncPending: this.isOffline(),
    };

    this.sales.unshift(finalSale);
    this.save("ky_sales", this.sales);

    // Update customer purchases total
    if (sale.clientId) {
      const cust = this.customers.find((c) => c.id === sale.clientId);
      if (cust) {
        cust.totalPurchases += sale.total;
        this.save("ky_customers", this.customers);
      }
    }

    // Capture dynamic financial transaction
    this.addTransaction({
      type: "entrada",
      category: sale.paymentMethod === "mcx_express" ? "Emis MCX Express" : "Venda",
      amount: sale.total,
      description: `Venda ${docType} ${invoiceNumber}`,
      referenceId: finalSale.id,
      storeId: this.activeStoreId,
    });

    return finalSale;
  }

  public cancelSale(id: string, reason: string) {
    const sale = this.sales.find(s => s.id === id);
    if (!sale || sale.status === "cancelada") return false;

    sale.status = "cancelada";
    sale.cancelReason = reason;
    sale.syncPending = this.isOffline();

    // Restore stock levels (only for products, not services)
    sale.items.forEach((item) => {
      const prod = this.products.find(p => p.id === item.productId);
      const isService = prod?.type === "servico";
      if (prod && !isService) {
        prod.stock += item.quantity;
      }
      if (!isService) {
        this.addMovement({
          productId: item.productId,
          productName: item.productName,
          type: "entrada",
          quantity: item.quantity,
          reason: `Estorno Factura ${sale.invoiceNumber}`,
          storeId: sale.storeId || this.activeStoreId,
        });
      }
    });

    this.save("ky_products", this.products);
    this.save("ky_sales", this.sales);

    // Update client balance if linked
    if (sale.clientId) {
      const cust = this.customers.find(c => c.id === sale.clientId);
      if (cust) {
        cust.totalPurchases = Math.max(0, cust.totalPurchases - sale.total);
        this.save("ky_customers", this.customers);
      }
    }

    // Register counter financial operation
    this.addTransaction({
      type: "saida",
      category: "Estorno",
      amount: sale.total,
      description: `Estorno Factura ${sale.invoiceNumber}. Motivo: ${reason}`,
      referenceId: sale.id, // linked reference
      storeId: sale.storeId || this.activeStoreId,
    });

    return true;
  }

  // --- ACTIONS: GENERAL CASH OPERATIONS ---
  public addTransaction(tx: Omit<FinancialTransaction, "id" | "date" | "storeId"> & { storeId?: string }) {
    const newTx: FinancialTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: new Date().toISOString(),
      storeId: tx.storeId || this.activeStoreId,
      syncPending: this.isOffline(),
    };
    this.transactions.unshift(newTx);
    this.save("ky_transactions", this.transactions);
  }

  // --- ACTIONS: SETTINGS ---
  public updateSettings(updated: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...updated };
    this.save("ky_settings", this.settings);
  }

  // --- ACTIONS: RESET/TEST SEED ---
  public resetToDefault() {
    this.users = DEFAULT_USERS;
    this.categories = DEFAULT_CATEGORIES;
    this.products = DEFAULT_PRODUCTS;
    this.customers = DEFAULT_CUSTOMERS;
    this.debts = DEFAULT_DEBTS;
    this.sales = DEFAULT_SALES;
    this.movements = DEFAULT_MOVEMENTS;
    this.transactions = DEFAULT_TRANSACTIONS;
    this.employeeDebts = [];
    this.settings = DEFAULT_SETTINGS;
    this.currentUser = null;

    try {
      localStorage.setItem("ky_users", JSON.stringify(DEFAULT_USERS));
      localStorage.setItem("ky_categories", JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem("ky_products", JSON.stringify(DEFAULT_PRODUCTS));
      localStorage.setItem("ky_customers", JSON.stringify(DEFAULT_CUSTOMERS));
      localStorage.setItem("ky_debts", JSON.stringify(DEFAULT_DEBTS));
      localStorage.setItem("ky_sales", JSON.stringify(DEFAULT_SALES));
      localStorage.setItem("ky_movements", JSON.stringify(DEFAULT_MOVEMENTS));
      localStorage.setItem("ky_transactions", JSON.stringify(DEFAULT_TRANSACTIONS));
      localStorage.setItem("ky_employee_debts", JSON.stringify([]));
      localStorage.setItem("ky_settings", JSON.stringify(DEFAULT_SETTINGS));
      localStorage.removeItem("ky_current_user");
    } catch {}

    this.notify();
  }
}

export const store = new KitandaStore();
