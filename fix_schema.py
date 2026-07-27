import os

schema_path = r"C:\Users\HP PC\.gemini\antigravity\scratch\visa-portal\sql\schema.sql"
with open(schema_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will append the missing RLS policies
missing_policies = """
-- RLS POLICIES FOR STUDENTS
CREATE POLICY "Super Admins have full control on students" ON students
    FOR ALL TO authenticated
    USING (fn_is_super_admin())
    WITH CHECK (fn_is_super_admin());

CREATE POLICY "Branch Admins can access students in assigned branches" ON students
    FOR ALL TO authenticated
    USING (fn_is_branch_admin_for(branch_id))
    WITH CHECK (fn_is_branch_admin_for(branch_id));

CREATE POLICY "Anyone can insert leads" ON leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);
"""

with open(schema_path, "a", encoding="utf-8") as f:
    f.write(missing_policies)
