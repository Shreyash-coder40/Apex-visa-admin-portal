-- Drop any broken policies just in case
DROP POLICY IF EXISTS "Super Admins have full control on leads" ON leads;
DROP POLICY IF EXISTS "Branch Admins can view unassigned leads or assigned to their branch" ON leads;
DROP POLICY IF EXISTS "Branch Admins can update leads assigned to their branch" ON leads;
DROP POLICY IF EXISTS "Branch Admins can update leads assigned to their branch or claim unassigned leads" ON leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;

DROP POLICY IF EXISTS "Super Admins full control fee_records" ON fee_records;
DROP POLICY IF EXISTS "Branch Admins access fee_records of assigned branch students" ON fee_records;

DROP POLICY IF EXISTS "Super Admins can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Staff can read activity logs" ON activity_logs;

-- RLS POLICIES FOR LEADS
CREATE POLICY "Super Admins have full control on leads" ON leads
    FOR ALL TO authenticated
    USING (fn_is_super_admin())
    WITH CHECK (fn_is_super_admin());

CREATE POLICY "Branch Admins can view unassigned leads or assigned to their branch" ON leads
    FOR SELECT TO authenticated
    USING (assigned_branch_id IS NULL OR fn_is_branch_admin_for(assigned_branch_id));

CREATE POLICY "Branch Admins can update leads assigned to their branch or claim unassigned leads" ON leads
    FOR UPDATE TO authenticated
    USING (assigned_branch_id IS NULL OR fn_is_branch_admin_for(assigned_branch_id))
    WITH CHECK (fn_is_branch_admin_for(assigned_branch_id));

CREATE POLICY "Anyone can insert leads" ON leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- RLS POLICIES FOR FEE RECORDS
CREATE POLICY "Super Admins full control fee_records" ON fee_records
    FOR ALL TO authenticated
    USING (fn_is_super_admin())
    WITH CHECK (fn_is_super_admin());

CREATE POLICY "Branch Admins access fee_records of assigned branch students" ON fee_records
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM students s WHERE s.id = fee_records.student_id AND fn_is_branch_admin_for(s.branch_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.id = fee_records.student_id AND fn_is_branch_admin_for(s.branch_id)));

-- RLS POLICIES FOR ACTIVITY LOGS
CREATE POLICY "Super Admins can view all activity logs" ON activity_logs
    FOR SELECT TO authenticated
    USING (fn_is_super_admin());

-- For simplicity in v1, let's allow all authenticated to read, but UI filters it.
CREATE POLICY "Staff can read activity logs" ON activity_logs
    FOR SELECT TO authenticated
    USING (true);


-- AUDIT TRIGGERS FOR PRD 4.7
-- Trigger for Document Items (Status or Notes changes)
CREATE OR REPLACE FUNCTION fn_audit_document_item_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO activity_logs (entity_type, entity_id, field_changed, old_value, new_value, changed_by)
        VALUES ('DocumentItem', NEW.id, 'status', OLD.status, NEW.status, auth.uid());
    END IF;
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
        INSERT INTO activity_logs (entity_type, entity_id, field_changed, old_value, new_value, changed_by)
        VALUES ('DocumentItem', NEW.id, 'notes', OLD.notes, NEW.notes, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_document_item_changes ON document_items;
CREATE TRIGGER trg_audit_document_item_changes
AFTER UPDATE ON document_items
FOR EACH ROW EXECUTE FUNCTION fn_audit_document_item_changes();

-- Trigger for Payment Transactions
CREATE OR REPLACE FUNCTION fn_audit_payment_transactions()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (entity_type, entity_id, field_changed, old_value, new_value, changed_by)
    VALUES ('PaymentTransaction', NEW.id, 'amount', '0', NEW.amount::text, NEW.recorded_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_payment_transactions ON payment_transactions;
CREATE TRIGGER trg_audit_payment_transactions
AFTER INSERT ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION fn_audit_payment_transactions();

-- Trigger for Refund Records
CREATE OR REPLACE FUNCTION fn_audit_refund_records()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (entity_type, entity_id, field_changed, old_value, new_value, changed_by)
    VALUES ('RefundRecord', NEW.id, 'amount', '0', NEW.amount::text, NEW.recorded_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_refund_records ON refund_records;
CREATE TRIGGER trg_audit_refund_records
AFTER INSERT ON refund_records
FOR EACH ROW EXECUTE FUNCTION fn_audit_refund_records();
