const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });

async function fixRLS() {
  await client.connect();
  
  const policies = [
    // Configuration Tables (Global, all can read, super_admin can write)
    "DROP POLICY IF EXISTS \"Global read config\" ON branches;",
    "CREATE POLICY \"Global read config\" ON branches FOR SELECT TO authenticated USING (true);",
    "DROP POLICY IF EXISTS \"Super admin write branches\" ON branches;",
    "CREATE POLICY \"Super admin write branches\" ON branches FOR ALL TO authenticated USING (fn_is_super_admin());",

    "DROP POLICY IF EXISTS \"Global read fee_types\" ON fee_types;",
    "CREATE POLICY \"Global read fee_types\" ON fee_types FOR SELECT TO authenticated USING (true);",
    "DROP POLICY IF EXISTS \"Super admin write fee_types\" ON fee_types;",
    "CREATE POLICY \"Super admin write fee_types\" ON fee_types FOR ALL TO authenticated USING (fn_is_super_admin());",

    "DROP POLICY IF EXISTS \"Global read checklist_templates\" ON checklist_templates;",
    "CREATE POLICY \"Global read checklist_templates\" ON checklist_templates FOR SELECT TO authenticated USING (true);",
    "DROP POLICY IF EXISTS \"Super admin write checklist_templates\" ON checklist_templates;",
    "CREATE POLICY \"Super admin write checklist_templates\" ON checklist_templates FOR ALL TO authenticated USING (fn_is_super_admin());",

    "DROP POLICY IF EXISTS \"Global read checklist_template_items\" ON checklist_template_items;",
    "CREATE POLICY \"Global read checklist_template_items\" ON checklist_template_items FOR SELECT TO authenticated USING (true);",
    "DROP POLICY IF EXISTS \"Super admin write checklist_template_items\" ON checklist_template_items;",
    "CREATE POLICY \"Super admin write checklist_template_items\" ON checklist_template_items FOR ALL TO authenticated USING (fn_is_super_admin());",

    // CRM Tables (All authenticated users for now, can restrict later)
    "DROP POLICY IF EXISTS \"Staff full access student_destinations\" ON student_destinations;",
    "CREATE POLICY \"Staff full access student_destinations\" ON student_destinations FOR ALL TO authenticated USING (true);",
    
    "DROP POLICY IF EXISTS \"Staff full access checklist_instances\" ON checklist_instances;",
    "CREATE POLICY \"Staff full access checklist_instances\" ON checklist_instances FOR ALL TO authenticated USING (true);",
    
    "DROP POLICY IF EXISTS \"Staff full access document_items\" ON document_items;",
    "CREATE POLICY \"Staff full access document_items\" ON document_items FOR ALL TO authenticated USING (true);",
    
    "DROP POLICY IF EXISTS \"Staff full access payment_transactions\" ON payment_transactions;",
    "CREATE POLICY \"Staff full access payment_transactions\" ON payment_transactions FOR ALL TO authenticated USING (true);",

    "DROP POLICY IF EXISTS \"Staff full access refund_records\" ON refund_records;",
    "CREATE POLICY \"Staff full access refund_records\" ON refund_records FOR ALL TO authenticated USING (true);"
  ];

  for (let sql of policies) {
    try {
      await client.query(sql);
      console.log('Executed:', sql);
    } catch (e) {
      console.log('Error executing', sql, e.message);
    }
  }

  await client.end();
}

fixRLS();
