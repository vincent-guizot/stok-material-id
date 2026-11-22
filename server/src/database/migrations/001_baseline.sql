

CREATE TYPE public."enum_debt_payments_paymentMethod" AS ENUM (
    'CASH',
    'TRANSFER',
    'QRIS'
);

CREATE TYPE public.enum_stock_movements_type AS ENUM (
    'SALE',
    'IN',
    'ADJUSTMENT',
    'RETURN'
);

CREATE TYPE public."enum_transaction_payments_paymentMethod" AS ENUM (
    'CASH',
    'TRANSFER',
    'QRIS',
    'CARD',
    'DEBT'
);

CREATE TYPE public."enum_transactions_paymentStatus" AS ENUM (
    'PAID',
    'PARTIAL',
    'UNPAID'
);

CREATE TYPE public.enum_users_role AS ENUM (
    'admin',
    'cashier',
    'warehouse'
);

CREATE TABLE public.brands (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    origin character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.categories (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    icon character varying(255) DEFAULT '📦'::character varying,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.customers (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(255),
    address text,
    "creditLimit" numeric(12,2) DEFAULT 0,
    "currentDebt" numeric(12,2) DEFAULT 0,
    "termDays" integer DEFAULT 14,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.debt_payments (
    id uuid NOT NULL,
    "customerId" uuid NOT NULL,
    "transactionId" uuid,
    amount numeric(12,2) NOT NULL,
    "paymentMethod" public."enum_debt_payments_paymentMethod" DEFAULT 'CASH'::public."enum_debt_payments_paymentMethod",
    "paymentDate" timestamp with time zone,
    "receivedBy" uuid NOT NULL,
    notes character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.product_units (
    id uuid NOT NULL,
    "productId" uuid NOT NULL,
    "unitName" character varying(255) NOT NULL,
    "conversionFactor" double precision DEFAULT '1'::double precision NOT NULL,
    "buyPrice" numeric(12,2) DEFAULT 0,
    "sellPrice" numeric(12,2) DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    "isBase" boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.products (
    id uuid NOT NULL,
    sku character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    "categoryId" uuid,
    "brandId" uuid,
    "baseUnit" character varying(255) NOT NULL,
    "minStock" double precision DEFAULT '0'::double precision,
    "currentStockBase" double precision DEFAULT '0'::double precision,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.settings (
    id character varying(255) DEFAULT 'system_settings'::character varying NOT NULL,
    "storeName" character varying(255) DEFAULT 'Toko Sentosa'::character varying,
    "storeAddress" text DEFAULT 'Jl. Raya Gresik No. 123, Gresik, Jawa Timur 61111'::text,
    "storePhone" character varying(255) DEFAULT '031-1234567'::character varying,
    "storeEmail" character varying(255) DEFAULT 'tokosentosa@gmail.com'::character varying,
    "logoUrl" text,
    "headerReceipt" text DEFAULT 'TOKO SENTOSA
Toko Bangunan & Material Konstruksi
Jl. Raya Gresik No. 123
Telp. 031-1234567'::text,
    "footerReceipt" text DEFAULT 'Terima kasih telah berbelanja
Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.'::text,
    "showLogo" boolean DEFAULT true,
    "showAddress" boolean DEFAULT true,
    "showPhone" boolean DEFAULT true,
    "showCashier" boolean DEFAULT true,
    "showThanks" boolean DEFAULT true,
    "autoPrint" boolean DEFAULT false,
    "taxRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "lowStockAlert" character varying(255) DEFAULT '50'::character varying,
    "emptyStockAlert" character varying(255) DEFAULT '0'::character varying,
    "allowMinusStock" character varying(255) DEFAULT 'no'::character varying,
    "showHppCashier" character varying(255) DEFAULT 'no'::character varying,
    branches json DEFAULT '[{"id":1,"name":"Depo Pusat Sentosa","address":"Jl. Raya Gresik No. 123","type":"Toko Utama & Gudang Pusat","status":"Aktif"},{"id":2,"name":"Cabang Sentosa Surabaya","address":"Jl. Raya Darmo Indah No. 8","type":"Depo Material Barat","status":"Aktif"},{"id":3,"name":"Cabang Sentosa Sidoarjo","address":"Jl. Pahlawan No. 56","type":"Depo Material Selatan","status":"Dalam Persiapan"}]'::json,
    "usersList" json DEFAULT '[{"id":1,"name":"Vincent (Owner)","username":"admin","role":"Admin (Bos)","status":"Aktif","badge":"👑"},{"id":2,"name":"Siti Rahmawati","username":"kasir","role":"Kasir Toko","status":"Aktif","badge":"🛒"},{"id":3,"name":"Agus Santoso","username":"gudang","role":"Staf Gudang","status":"Aktif","badge":"📦"}]'::json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.stock_movements (
    id uuid NOT NULL,
    "productId" uuid NOT NULL,
    type public.enum_stock_movements_type NOT NULL,
    "qtyBaseUnit" double precision NOT NULL,
    "previousStock" double precision DEFAULT '0'::double precision,
    "newStock" double precision DEFAULT '0'::double precision,
    notes character varying(255),
    "createdBy" uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.suppliers (
    id uuid NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(255) DEFAULT 'Umum'::character varying,
    "contactPerson" character varying(255),
    phone character varying(255),
    email character varying(255),
    address text,
    "paymentTerms" character varying(255) DEFAULT 'Tempo 30 Hari'::character varying,
    status character varying(255) DEFAULT 'Aktif'::character varying,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.transaction_items (
    id uuid NOT NULL,
    "transactionId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    "unitId" uuid,
    "productName" character varying(255) NOT NULL,
    "unitName" character varying(255) NOT NULL,
    qty double precision NOT NULL,
    "conversionFactor" double precision DEFAULT '1'::double precision NOT NULL,
    "qtyBaseUnit" double precision NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.transaction_payments (
    id uuid NOT NULL,
    "transactionId" uuid NOT NULL,
    "paymentMethod" public."enum_transaction_payments_paymentMethod" NOT NULL,
    amount numeric(12,2) NOT NULL,
    "referenceNo" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.transactions (
    id uuid NOT NULL,
    "invoiceNumber" character varying(255) NOT NULL,
    "customerId" uuid,
    "cashierId" uuid NOT NULL,
    "transactionDate" timestamp with time zone,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0,
    "taxRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "taxAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "cashReceived" numeric(12,2) DEFAULT 0 NOT NULL,
    "changeAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "idempotencyKey" character varying(64),
    "paidAmount" numeric(12,2) DEFAULT 0,
    "debtAmount" numeric(12,2) DEFAULT 0,
    "paymentStatus" public."enum_transactions_paymentStatus" DEFAULT 'PAID'::public."enum_transactions_paymentStatus",
    "dueDate" date,
    notes text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.users (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public.enum_users_role DEFAULT 'cashier'::public.enum_users_role NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_name_key UNIQUE (name);

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_units
    ADD CONSTRAINT product_units_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_code_key UNIQUE (code);

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.transaction_payments
    ADD CONSTRAINT transaction_payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_idempotencyKey_key" UNIQUE ("idempotencyKey");

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_invoiceNumber_key" UNIQUE ("invoiceNumber");

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT "debt_payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT "debt_payments_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.product_units
    ADD CONSTRAINT "product_units_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.transaction_payments
    ADD CONSTRAINT "transaction_payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


