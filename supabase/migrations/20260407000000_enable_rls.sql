-- =============================================================================
-- Row-Level Security (RLS) Migration
-- =============================================================================
-- Все таблицы используют organizationId для изоляции данных.
-- Политики опираются на сессионную переменную app.current_org_id, которую
-- приложение должно устанавливать перед выполнением запросов.
--
-- Как установить переменную в Prisma (middleware):
--   await prisma.$executeRaw`SELECT set_config('app.current_org_id', ${orgId}, true)`
--
-- Заметка: service_role в Supabase автоматически обходит RLS (BYPASSRLS),
-- поэтому серверный Prisma-клиент, использующий сервисный ключ, не затронут.
-- =============================================================================

-- Вспомогательная функция для получения текущего org_id из сессии
CREATE OR REPLACE FUNCTION current_org_id() RETURNS text
  LANGUAGE sql STABLE
  AS $$
    SELECT NULLIF(current_setting('app.current_org_id', true), '')
  $$;

-- =============================================================================
-- 1. Organization
-- =============================================================================
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select" ON "Organization";
DROP POLICY IF EXISTS "org_update" ON "Organization";
DROP POLICY IF EXISTS "org_delete" ON "Organization";

CREATE POLICY "org_select" ON "Organization"
  FOR SELECT USING (id = current_org_id());

CREATE POLICY "org_update" ON "Organization"
  FOR UPDATE USING (id = current_org_id());

CREATE POLICY "org_delete" ON "Organization"
  FOR DELETE USING (id = current_org_id());

-- INSERT разрешён без ограничений (регистрация новой организации)
CREATE POLICY "org_insert" ON "Organization"
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 2. User
-- =============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_all" ON "User";

CREATE POLICY "user_all" ON "User"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 3. Account
-- =============================================================================
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_all" ON "Account";

CREATE POLICY "account_all" ON "Account"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 4. Transaction
-- =============================================================================
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transaction_all" ON "Transaction";

CREATE POLICY "transaction_all" ON "Transaction"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 5. Category
-- =============================================================================
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "category_all" ON "Category";

CREATE POLICY "category_all" ON "Category"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 6. Project
-- =============================================================================
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_all" ON "Project";

CREATE POLICY "project_all" ON "Project"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 7. Counterparty
-- =============================================================================
ALTER TABLE "Counterparty" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "counterparty_all" ON "Counterparty";

CREATE POLICY "counterparty_all" ON "Counterparty"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 8. Budget
-- =============================================================================
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_all" ON "Budget";

CREATE POLICY "budget_all" ON "Budget"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 9. AutomationRule
-- =============================================================================
ALTER TABLE "AutomationRule" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_rule_all" ON "AutomationRule";

CREATE POLICY "automation_rule_all" ON "AutomationRule"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 10. PaymentRequest
-- =============================================================================
ALTER TABLE "PaymentRequest" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_request_all" ON "PaymentRequest";

CREATE POLICY "payment_request_all" ON "PaymentRequest"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 11. AiConversation
-- =============================================================================
ALTER TABLE "AiConversation" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_conversation_all" ON "AiConversation";

CREATE POLICY "ai_conversation_all" ON "AiConversation"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 12. Invite
-- =============================================================================
ALTER TABLE "Invite" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invite_all" ON "Invite";

CREATE POLICY "invite_all" ON "Invite"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 13. PaymentHistory
-- =============================================================================
ALTER TABLE "PaymentHistory" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_history_all" ON "PaymentHistory";

CREATE POLICY "payment_history_all" ON "PaymentHistory"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- =============================================================================
-- 14. NotificationSettings
-- =============================================================================
ALTER TABLE "NotificationSettings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_settings_all" ON "NotificationSettings";
1111
CREATE POLICY "notification_settings_all" ON "NotificationSettings"
  FOR ALL USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());
