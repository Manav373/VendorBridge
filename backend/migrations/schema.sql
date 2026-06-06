-- ============================================================
-- VendorBridge ERP — PostgreSQL Database Schema
-- Run: psql -U postgres -d vendorbridge_db -f schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM TYPES ───────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'procurement_officer', 'manager', 'vendor');
CREATE TYPE vendor_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
CREATE TYPE rfq_status AS ENUM ('draft', 'active', 'pending', 'completed', 'cancelled');
CREATE TYPE quotation_status AS ENUM ('draft', 'submitted', 'shortlisted', 'rejected', 'accepted');
CREATE TYPE po_status AS ENUM ('draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 'completed', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'escalated');
CREATE TYPE notification_type AS ENUM ('rfq', 'quotation', 'approval', 'invoice', 'vendor', 'po', 'system');
CREATE TYPE activity_module AS ENUM ('auth', 'vendor', 'rfq', 'quotation', 'approval', 'po', 'invoice', 'report', 'ai', 'system');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- ─── USERS TABLE ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          user_role NOT NULL DEFAULT 'procurement_officer',
  company       VARCHAR(255),
  department    VARCHAR(100),
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  is_verified   BOOLEAN DEFAULT FALSE,
  last_login    TIMESTAMPTZ,
  otp_code      VARCHAR(6),
  otp_expiry    TIMESTAMPTZ,
  refresh_token TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ─── VENDORS TABLE ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code     VARCHAR(20) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(30),
  website         VARCHAR(255),
  category        VARCHAR(100) NOT NULL,
  status          vendor_status DEFAULT 'pending',
  country         VARCHAR(100),
  state           VARCHAR(100),
  city            VARCHAR(100),
  address         TEXT,
  pincode         VARCHAR(20),
  gst_number      VARCHAR(50),
  pan_number      VARCHAR(30),
  bank_name       VARCHAR(100),
  bank_account    VARCHAR(50),
  bank_ifsc       VARCHAR(20),
  rating          NUMERIC(3,2) DEFAULT 0.00,
  total_orders    INTEGER DEFAULT 0,
  total_value     NUMERIC(15,2) DEFAULT 0.00,
  contact_person  VARCHAR(100),
  notes           TEXT,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_vendor_code ON vendors(vendor_code);

-- ─── RFQs TABLE ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rfqs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number      VARCHAR(30) UNIQUE NOT NULL,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  category        VARCHAR(100) NOT NULL,
  status          rfq_status DEFAULT 'draft',
  priority        priority_level DEFAULT 'medium',
  deadline        DATE NOT NULL,
  estimated_value NUMERIC(15,2),
  created_by      UUID REFERENCES users(id),
  assigned_to     UUID REFERENCES users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_created_by ON rfqs(created_by);
CREATE INDEX idx_rfqs_deadline ON rfqs(deadline);

-- ─── RFQ ITEMS TABLE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rfq_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  item_name   VARCHAR(255) NOT NULL,
  description TEXT,
  quantity    NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit        VARCHAR(30) DEFAULT 'pcs',
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rfq_items_rfq_id ON rfq_items(rfq_id);

-- ─── RFQ VENDORS (many-to-many) ───────────────────────────────

CREATE TABLE IF NOT EXISTS rfq_vendors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  email_sent  BOOLEAN DEFAULT FALSE,
  responded   BOOLEAN DEFAULT FALSE,
  UNIQUE(rfq_id, vendor_id)
);

CREATE INDEX idx_rfq_vendors_rfq_id ON rfq_vendors(rfq_id);
CREATE INDEX idx_rfq_vendors_vendor_id ON rfq_vendors(vendor_id);

-- ─── ATTACHMENTS TABLE ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  VARCHAR(50) NOT NULL,
  entity_id    UUID NOT NULL,
  file_name    VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path    TEXT NOT NULL,
  file_size    INTEGER,
  mime_type    VARCHAR(100),
  uploaded_by  UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);

-- ─── QUOTATIONS TABLE ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quotations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(30) UNIQUE NOT NULL,
  rfq_id          UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  status          quotation_status DEFAULT 'draft',
  total_amount    NUMERIC(15,2) DEFAULT 0.00,
  delivery_days   INTEGER,
  valid_until     DATE,
  notes           TEXT,
  vendor_remarks  TEXT,
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rfq_id, vendor_id)
);

CREATE INDEX idx_quotations_rfq_id ON quotations(rfq_id);
CREATE INDEX idx_quotations_vendor_id ON quotations(vendor_id);
CREATE INDEX idx_quotations_status ON quotations(status);

-- ─── QUOTATION ITEMS TABLE ────────────────────────────────────

CREATE TABLE IF NOT EXISTS quotation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  rfq_item_id     UUID REFERENCES rfq_items(id),
  item_name       VARCHAR(255) NOT NULL,
  quantity        NUMERIC(12,2) NOT NULL,
  unit            VARCHAR(30),
  unit_price      NUMERIC(12,2) NOT NULL,
  total_price     NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes           TEXT,
  sort_order      INTEGER DEFAULT 0
);

CREATE INDEX idx_quotation_items_quotation_id ON quotation_items(quotation_id);

-- ─── APPROVALS TABLE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_number VARCHAR(30) UNIQUE NOT NULL,
  rfq_id          UUID REFERENCES rfqs(id),
  quotation_id    UUID REFERENCES quotations(id),
  po_number       VARCHAR(30),
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  amount          NUMERIC(15,2),
  status          approval_status DEFAULT 'pending',
  priority        priority_level DEFAULT 'medium',
  requested_by    UUID NOT NULL REFERENCES users(id),
  current_approver UUID REFERENCES users(id),
  approved_by     UUID REFERENCES users(id),
  rejected_by     UUID REFERENCES users(id),
  remarks         TEXT,
  approved_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_requested_by ON approvals(requested_by);

-- ─── APPROVAL TIMELINE TABLE ──────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_timeline (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id  UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  step_name    VARCHAR(100) NOT NULL,
  step_status  VARCHAR(30) DEFAULT 'waiting',
  actioned_by  UUID REFERENCES users(id),
  actioned_by_name VARCHAR(200),
  remarks      TEXT,
  actioned_at  TIMESTAMPTZ,
  sort_order   INTEGER DEFAULT 0
);

CREATE INDEX idx_approval_timeline_approval_id ON approval_timeline(approval_id);

-- ─── PURCHASE ORDERS TABLE ────────────────────────────────────

CREATE TABLE IF NOT EXISTS purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number       VARCHAR(30) UNIQUE NOT NULL,
  rfq_id          UUID REFERENCES rfqs(id),
  quotation_id    UUID REFERENCES quotations(id),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  approval_id     UUID REFERENCES approvals(id),
  status          po_status DEFAULT 'draft',
  order_date      DATE DEFAULT CURRENT_DATE,
  delivery_date   DATE,
  due_date        DATE,
  subtotal        NUMERIC(15,2) DEFAULT 0.00,
  tax_amount      NUMERIC(15,2) DEFAULT 0.00,
  tax_percent     NUMERIC(5,2) DEFAULT 18.00,
  shipping        NUMERIC(15,2) DEFAULT 0.00,
  grand_total     NUMERIC(15,2) DEFAULT 0.00,
  paid_amount     NUMERIC(15,2) DEFAULT 0.00,
  due_amount      NUMERIC(15,2) DEFAULT 0.00,
  bill_to         TEXT,
  ship_to         TEXT,
  notes           TEXT,
  terms           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pos_status ON purchase_orders(status);
CREATE INDEX idx_pos_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX idx_pos_po_number ON purchase_orders(po_number);

-- ─── PO ITEMS TABLE ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS po_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id        UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_name    VARCHAR(255) NOT NULL,
  description  TEXT,
  quantity     NUMERIC(12,2) NOT NULL,
  unit         VARCHAR(30),
  unit_price   NUMERIC(12,2) NOT NULL,
  total_price  NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order   INTEGER DEFAULT 0
);

CREATE INDEX idx_po_items_po_id ON po_items(po_id);

-- ─── INVOICES TABLE ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  VARCHAR(30) UNIQUE NOT NULL,
  po_id           UUID REFERENCES purchase_orders(id),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  status          invoice_status DEFAULT 'draft',
  invoice_date    DATE DEFAULT CURRENT_DATE,
  due_date        DATE,
  subtotal        NUMERIC(15,2) DEFAULT 0.00,
  tax_percent     NUMERIC(5,2) DEFAULT 18.00,
  tax_amount      NUMERIC(15,2) DEFAULT 0.00,
  discount        NUMERIC(15,2) DEFAULT 0.00,
  grand_total     NUMERIC(15,2) DEFAULT 0.00,
  paid_amount     NUMERIC(15,2) DEFAULT 0.00,
  due_amount      NUMERIC(15,2) DEFAULT 0.00,
  bill_to         TEXT,
  notes           TEXT,
  payment_terms   TEXT,
  paid_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX idx_invoices_po_id ON invoices(po_id);

-- ─── INVOICE ITEMS TABLE ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_name     VARCHAR(255) NOT NULL,
  description   TEXT,
  quantity      NUMERIC(12,2) NOT NULL,
  unit          VARCHAR(30),
  unit_price    NUMERIC(12,2) NOT NULL,
  total_price   NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order    INTEGER DEFAULT 0
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ─── NOTIFICATIONS TABLE ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  entity_id   UUID,
  entity_type VARCHAR(50),
  is_read     BOOLEAN DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ─── ACTIVITY LOGS TABLE ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  user_name   VARCHAR(200),
  module      activity_module NOT NULL,
  action      VARCHAR(100) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50),
  entity_id   UUID,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_module ON activity_logs(module);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ─── UPDATED_AT TRIGGER FUNCTION ──────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','vendors','rfqs','quotations','approvals','purchase_orders','invoices']
  LOOP
    EXECUTE format('
      CREATE TRIGGER trigger_update_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END;
$$;

-- ─── SEQUENCE FOR CODES ───────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS vendor_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS rfq_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS approval_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
