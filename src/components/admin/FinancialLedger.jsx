import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle2, AlertCircle, Clock, ShieldCheck, ArrowDownRight, ArrowUpRight, Building2, RefreshCw, FileText, Loader2, X, ChevronDown, ChevronUp, User, Search, Filter, CreditCard, CornerDownLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function FinancialLedger({ currentRole, currentBranch, showToast }) {
  const isSuperAdmin = currentRole === 'super_admin';
  const [studentsWithFees, setStudentsWithFees] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [globalPayments, setGlobalPayments] = useState([]);
  const [globalRefunds, setGlobalRefunds] = useState([]);

  // Tabs state
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts', 'payments', 'refunds'

  // Modals state
  const [selectedFeeId, setSelectedFeeId] = useState(null); // For Payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [showAssignFeeModal, setShowAssignFeeModal] = useState(false);
  const [assignFormData, setAssignFormData] = useState({ student_id: '', fee_type_id: '', total_amount: '', currency: 'USD' });

  const [refundFeeId, setRefundFeeId] = useState(null); // For Refund
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [expandedStudentIds, setExpandedStudentIds] = useState(new Set());
  const [expandedTxnIds, setExpandedTxnIds] = useState(new Set());

  useEffect(() => {
    fetchFinancials();
  }, [currentRole, currentBranch]);

  const toggleStudent = (id) => {
    const newSet = new Set(expandedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedStudentIds(newSet);
  };

  const toggleTxns = (id) => {
    const newSet = new Set(expandedTxnIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedTxnIds(newSet);
  };

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      
      const { data: studentsData, error: stdErr } = await supabase
        .from('students')
        .select(`
          id, 
          name,
          branch_id,
          leads(name), 
          branches(name, code, id),
          fee_records(
            *,
            fee_types(name)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (stdErr) throw stdErr;

      let allStds = studentsData || [];
      if (currentRole === 'branch_admin' && currentBranch) {
        const branchId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch;
        if (branchId) {
          allStds = allStds.filter(s => s.branches?.id === branchId || s.branch_id === branchId);
        }
      }

      const withFees = allStds.filter(s => s.fee_records && s.fee_records.length > 0);
      setStudentsWithFees(withFees);
      setAllStudents(allStds);

      const { data: typesData, error: typesErr } = await supabase.from('fee_types').select('*');
      if (typesErr) throw typesErr;
      setFeeTypes(typesData || []);

      // Fetch Payments globally
      const { data: txnsData, error: txnsErr } = await supabase
        .from('payment_transactions')
        .select('*, staff_users(name), fee_records(student_id, fee_types(name), students(name, branch_id, leads(name), branches(name, id)))')
        .order('created_at', { ascending: false });
      
      let pTxns = txnsData || [];

      // Fetch Refunds globally
      const { data: rfsData, error: rfsErr } = await supabase
        .from('refund_records')
        .select('*, staff_users(name), fee_records(student_id, fee_types(name), students(name, branch_id, leads(name), branches(name, id)))')
        .order('created_at', { ascending: false });
        
      let pRfs = rfsData || [];

      if (currentRole === 'branch_admin' && currentBranch) {
        const branchId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch;
        if (branchId) {
          pTxns = pTxns.filter(t => t.fee_records?.students?.branch_id === branchId || t.fee_records?.students?.branches?.id === branchId);
          pRfs = pRfs.filter(r => r.fee_records?.students?.branch_id === branchId || r.fee_records?.students?.branches?.id === branchId);
        }
      }

      setGlobalPayments(pTxns);
      setGlobalRefunds(pRfs);

    } catch (err) {
      console.error('Error fetching financials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    let feeRec = null;
    for (const s of studentsWithFees) {
      const found = s.fee_records.find(r => r.id === selectedFeeId);
      if (found) { feeRec = found; break; }
    }
    
    if (!feeRec) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;
    
    if (amt > feeRec.balance) {
      if (showToast) showToast(`Payment cannot exceed the remaining balance of ${feeRec.balance}.`, 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('payment_transactions').insert({
        fee_record_id: feeRec.id,
        amount: amt,
        currency: feeRec.currency || 'USD',
        notes: paymentNotes || 'Manual payment entry',
        recorded_by: user.id
      });
      if (error) throw error;
      if (showToast) showToast('Payment recorded successfully!');
      setSelectedFeeId(null);
      await fetchFinancials();
    } catch (err) {
      console.error('Error recording payment:', err);
      if (showToast) showToast('Failed to record payment.', 'error');
    }
  };

  const handleRecordRefund = async (e) => {
    e.preventDefault();
    let feeRec = null;
    for (const s of studentsWithFees) {
      const found = s.fee_records.find(r => r.id === refundFeeId);
      if (found) { feeRec = found; break; }
    }
    if (!feeRec) return;
    
    const amt = parseFloat(refundAmount);
    if (isNaN(amt) || amt <= 0) return;
    
    if (amt > feeRec.amount_received) {
      if (showToast) showToast(`Refund cannot exceed the total amount already received (${feeRec.amount_received}).`, 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('refund_records').insert({
        fee_record_id: feeRec.id,
        amount: amt,
        currency: feeRec.currency || 'USD',
        reason: refundReason || 'Manual refund entry',
        recorded_by: user.id
      });
      if (error) throw error;
      if (showToast) showToast('Refund processed successfully!');
      setRefundFeeId(null);
      await fetchFinancials();
    } catch (err) {
      console.error('Error processing refund:', err);
      if (showToast) showToast('Failed to process refund.', 'error');
    }
  };

  const handleAssignFee = async (e) => {
    e.preventDefault();
    const type = feeTypes.find(t => t.id === assignFormData.fee_type_id);
    try {
      const { error } = await supabase.from('fee_records').insert({
        student_id: assignFormData.student_id,
        fee_type_id: assignFormData.fee_type_id,
        total_amount: assignFormData.total_amount,
        currency: assignFormData.currency || type?.currency || 'USD',
        amount_received: 0,
        balance: assignFormData.total_amount,
        status: 'Pending'
      });
      if (error) throw error;
      if (showToast) showToast('Fee assigned successfully!');
      setShowAssignFeeModal(false);
      setAssignFormData({ student_id: '', fee_type_id: '', total_amount: '', currency: 'USD' });
      await fetchFinancials();
    } catch (err) {
      console.error('Error assigning fee:', err);
      if (showToast) showToast('Failed to assign fee.', 'error');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={40} className="animate-spin" color="var(--admin-primary)" /></div>;
  }
  
  const processedStudents = studentsWithFees.map(student => {
    let totalOwed = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let hasOverdue = false;
    let studentStatus = 'Paid'; 

    student.fee_records.forEach(rec => {
      totalOwed += Number(rec.total_amount || 0);
      totalPaid += Number(rec.amount_received || 0);
      totalBalance += Number(rec.balance || 0);
      
      if (rec.status === 'Pending' || rec.status === 'Partial') {
        studentStatus = 'Pending';
      }
      
      if ((rec.status === 'Pending' || rec.status === 'Partial') && rec.due_date && new Date(rec.due_date) < new Date()) {
        hasOverdue = true;
      }
      
      // Attach manually fetched transactions to the record for the accordion
      rec.payment_transactions = globalPayments.filter(tx => tx.fee_record_id === rec.id);
      rec.refund_records = globalRefunds.filter(rf => rf.fee_record_id === rec.id);
    });
    
    if (totalBalance > 0 && totalPaid > 0) studentStatus = 'Partial';
    if (hasOverdue) studentStatus = 'Overdue';

    return {
      ...student,
      totalOwed,
      totalPaid,
      totalBalance,
      studentStatus,
      hasOverdue
    };
  });

  const filteredStudents = processedStudents.filter(student => {
    const sName = (student.name || student.leads?.name || '').toLowerCase();
    const matchesSearch = sName.includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'Overdue') {
      matchesStatus = student.hasOverdue;
    } else if (filterStatus !== 'All') {
      matchesStatus = student.studentStatus === filterStatus;
    }
    
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = globalPayments.filter(tx => {
    const sName = (tx.fee_records?.students?.name || tx.fee_records?.students?.leads?.name || '').toLowerCase();
    return sName.includes(searchTerm.toLowerCase());
  });

  const filteredRefunds = globalRefunds.filter(rf => {
    const sName = (rf.fee_records?.students?.name || rf.fee_records?.students?.leads?.name || '').toLowerCase();
    return sName.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '0', maxWidth: '100%', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--admin-text-primary)' }}>
            Financial Ledger & Payments
          </h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--admin-success)" /> 
            {isSuperAdmin ? 'Global Financial Oversight.' : 'Branch Financial Dashboard (RLS Locked).'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowAssignFeeModal(true)} className="admin-btn admin-btn-primary">
            <Plus size={16} /> Assign Fee
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--admin-border-light)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('accounts')}
          style={{ 
            padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
            color: activeTab === 'accounts' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
            borderBottom: activeTab === 'accounts' ? '2px solid var(--admin-primary)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
          <User size={18} /> Student Accounts
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          style={{ 
            padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
            color: activeTab === 'payments' ? 'var(--admin-success)' : 'var(--admin-text-secondary)',
            borderBottom: activeTab === 'payments' ? '2px solid var(--admin-success)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
          <ArrowDownRight size={18} /> Payments Received <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '6px' }}>{globalPayments.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('refunds')}
          style={{ 
            padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
            color: activeTab === 'refunds' ? 'var(--admin-danger)' : 'var(--admin-text-secondary)',
            borderBottom: activeTab === 'refunds' ? '2px solid var(--admin-danger)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
          <ArrowUpRight size={18} /> Refunds Issued <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '6px' }}>{globalRefunds.length}</span>
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Universal Search & Filter Bar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--admin-border-light)', display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--admin-bg-body)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by student name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: '42px', width: '100%', background: 'white' }}
            />
          </div>
          
          {activeTab === 'accounts' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="var(--admin-text-muted)" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="admin-input"
                style={{ width: 'auto', background: 'white' }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: STUDENT ACCOUNTS */}
        {activeTab === 'accounts' && (
          filteredStudents.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <AlertCircle size={40} color="var(--admin-text-muted)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '1.2rem', color: 'var(--admin-text-primary)', margin: '0 0 8px 0' }}>No Financial Records Found</h2>
              <p style={{ color: 'var(--admin-text-secondary)', margin: 0 }}>Try adjusting your search filters or assign a new fee.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredStudents.map(student => {
                const isStudentExpanded = expandedStudentIds.has(student.id);
                return (
                  <div key={student.id} style={{ borderBottom: '1px solid var(--admin-border-light)' }}>
                    {/* Student Summary Header */}
                    <div 
                      onClick={() => toggleStudent(student.id)}
                      style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', cursor: 'pointer', background: isStudentExpanded ? 'var(--admin-bg-body)' : 'white', transition: 'background-color 0.2s' }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                        <div className="user-avatar" style={{ width: '40px', height: '40px', background: student.hasOverdue ? 'var(--admin-danger-bg)' : 'var(--admin-primary-light)', color: student.hasOverdue ? 'var(--admin-danger)' : 'var(--admin-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {(student.name || student.leads?.name || 'U').substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h3 style={{ margin: '0', fontSize: '1rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>
                              {student.name || student.leads?.name || 'Unknown Student'}
                            </h3>
                            {student.hasOverdue && (
                              <span className="admin-badge admin-badge-danger" style={{ fontSize: '0.65rem' }}>OVERDUE</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                            <Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> {student.branches?.name || 'Unassigned'} • {student.fee_records.length} Record(s)
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Owed</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>${student.totalOwed.toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--admin-success)' }}>${student.totalPaid.toLocaleString()}</div>
                        </div>
                        <div style={{ paddingLeft: '24px', borderLeft: '1px solid var(--admin-border-light)', textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: student.totalBalance > 0 ? 'var(--admin-danger)' : 'var(--admin-text-primary)' }}>
                            ${student.totalBalance.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ color: 'var(--admin-text-muted)', marginLeft: '8px' }}>
                          {isStudentExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Fee Records Details */}
                    {isStudentExpanded && (
                      <div style={{ padding: '24px', background: 'var(--admin-bg-body)', borderTop: '1px solid var(--admin-border-light)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {student.fee_records.map(rec => {
                            const hasTransactions = (rec.payment_transactions && rec.payment_transactions.length > 0) || (rec.refund_records && rec.refund_records.length > 0);
                            const isTxExpanded = expandedTxnIds.has(rec.id);

                            return (
                              <div key={rec.id} style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid var(--admin-border-light)', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                  
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                      <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>{rec.fee_types?.name || 'Standard Fee'}</h5>
                                      <div className={`admin-badge ${rec.status === 'Paid' ? 'admin-badge-success' : rec.status === 'Partial' ? 'admin-badge-primary' : 'admin-badge-warning'}`} style={{ border: 'none', background: rec.status === 'Paid' ? '#ecfdf5' : rec.status === 'Partial' ? '#eff6ff' : '#fffbeb' }}>
                                        {rec.status === 'Paid' && <CheckCircle2 size={12} />}
                                        {rec.status}
                                      </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                                      Created: {new Date(rec.created_at).toLocaleDateString()}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Amount</div>
                                      <div style={{ fontWeight: '700', color: 'var(--admin-text-primary)' }}>{rec.currency} {rec.total_amount}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Received</div>
                                      <div style={{ fontWeight: '700', color: 'var(--admin-success)' }}>{rec.currency} {rec.amount_received}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', background: 'var(--admin-bg-body)', padding: '8px 12px', borderRadius: '6px' }}>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Balance</div>
                                      <div style={{ fontWeight: '800', color: rec.balance > 0 ? 'var(--admin-danger)' : 'var(--admin-text-primary)' }}>{rec.currency} {rec.balance}</div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    {rec.balance > 0 && (
                                      <button onClick={() => {setSelectedFeeId(rec.id); setPaymentAmount(''); setPaymentNotes('');}} className="admin-btn admin-btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--admin-success)', borderColor: 'var(--admin-success)' }}>
                                        Receive Payment
                                      </button>
                                    )}
                                    {rec.amount_received > 0 && (
                                      <button onClick={() => {setRefundFeeId(rec.id); setRefundAmount(''); setRefundReason('');}} className="admin-btn admin-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--admin-danger)', borderColor: 'var(--admin-danger-bg)', background: 'var(--admin-danger-bg)' }}>
                                        Issue Refund
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Transaction History Accordion */}
                                {hasTransactions && (
                                  <div style={{ marginTop: '20px', borderTop: '1px dashed var(--admin-border-light)', paddingTop: '16px' }}>
                                    <button onClick={() => toggleTxns(rec.id)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--admin-text-secondary)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <RefreshCw size={14} /> {isTxExpanded ? 'Hide' : 'View'} Transactions ({((rec.payment_transactions?.length || 0) + (rec.refund_records?.length || 0))})
                                    </button>

                                    {isTxExpanded && (
                                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {rec.payment_transactions?.map(tx => (
                                          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid var(--admin-success)' }}>
                                            <div>
                                              <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Payment Received
                                              </div>
                                              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>{new Date(tx.payment_date || tx.created_at).toLocaleDateString()} • {tx.notes || 'No notes'}</div>
                                            </div>
                                            <div style={{ fontWeight: '800', color: 'var(--admin-success)' }}>+ {tx.currency} {tx.amount}</div>
                                          </div>
                                        ))}

                                        {rec.refund_records?.map(ref => (
                                          <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid var(--admin-danger)' }}>
                                            <div>
                                              <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Refund Issued
                                              </div>
                                              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>{new Date(ref.refund_date || ref.created_at).toLocaleDateString()} • {ref.reason}</div>
                                            </div>
                                            <div style={{ fontWeight: '800', color: 'var(--admin-danger)' }}>- {ref.currency} {ref.amount}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TAB 2: PAYMENTS RECEIVED */}
        {activeTab === 'payments' && (
          filteredPayments.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              No payments received yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--admin-border-light)', background: '#f8fafc' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Processed By</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Fee Type</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Notes</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--admin-border-light)' }}>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--admin-text-primary)', fontWeight: '500' }}>
                      {tx.staff_users?.name || 'System / Admin'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--admin-primary)', fontSize: '0.9rem' }}>{tx.fee_records?.students?.name || tx.fee_records?.students?.leads?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{tx.fee_records?.students?.branches?.name}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
                      {tx.fee_records?.fee_types?.name || 'Standard Fee'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                      {tx.notes || '-'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '1.05rem', fontWeight: '800', color: 'var(--admin-success)', textAlign: 'right' }}>
                      + {tx.currency} {tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* TAB 3: REFUNDS ISSUED */}
        {activeTab === 'refunds' && (
          filteredRefunds.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              No refunds issued.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--admin-border-light)', background: '#f8fafc' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Processed By</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Fee Type</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Reason</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.map(rf => (
                  <tr key={rf.id} style={{ borderBottom: '1px solid var(--admin-border-light)' }}>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                      {new Date(rf.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--admin-text-primary)', fontWeight: '500' }}>
                      {rf.staff_users?.name || 'System / Admin'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--admin-primary)', fontSize: '0.9rem' }}>{rf.fee_records?.students?.name || rf.fee_records?.students?.leads?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{rf.fee_records?.students?.branches?.name}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
                      {rf.fee_records?.fee_types?.name || 'Standard Fee'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                      {rf.reason || '-'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '1.05rem', fontWeight: '800', color: 'var(--admin-danger)', textAlign: 'right' }}>
                      - {rf.currency} {rf.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Assign Fee Modal */}
      {showAssignFeeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-bg-body)', margin: 0 }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>Assign Fee to Student</h3>
              <button onClick={() => setShowAssignFeeModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--admin-text-muted)" /></button>
            </div>
            <form onSubmit={handleAssignFee} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <select required className="admin-input" value={assignFormData.student_id} onChange={e => setAssignFormData({...assignFormData, student_id: e.target.value})}>
                <option value="" disabled>Select Student...</option>
                {allStudents.map(s => <option key={s.id} value={s.id}>{s.name || s.leads?.name}</option>)}
              </select>
              <select required className="admin-input" value={assignFormData.fee_type_id} onChange={e => {
                const ft = feeTypes.find(t => t.id === e.target.value);
                setAssignFormData({...assignFormData, fee_type_id: e.target.value, total_amount: ft ? ft.default_amount : assignFormData.total_amount});
              }}>
                <option value="" disabled>Select Fee Type...</option>
                {feeTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name}</option>)}
              </select>
              <input type="number" className="admin-input" required placeholder="Total Amount" value={assignFormData.total_amount} onChange={e => setAssignFormData({...assignFormData, total_amount: e.target.value})} />
              <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '12px' }}>Assign Fee</button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedFeeId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-bg-body)', margin: 0 }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>Record Payment</h3>
              <button onClick={() => setSelectedFeeId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--admin-text-muted)" /></button>
            </div>
            <form onSubmit={handleRecordPayment} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="number" className="admin-input" required placeholder="Amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              <input type="text" className="admin-input" placeholder="Notes (Optional)" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} />
              <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '12px', background: 'var(--admin-success)', borderColor: 'var(--admin-success)' }}>Confirm Payment</button>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundFeeId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-danger-bg)', borderBottomColor: 'var(--admin-danger)', margin: 0 }}>
              <h3 className="admin-card-title" style={{ margin: 0, color: 'var(--admin-danger)' }}>Record Refund</h3>
              <button onClick={() => setRefundFeeId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--admin-danger)" /></button>
            </div>
            <form onSubmit={handleRecordRefund} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="number" className="admin-input" required placeholder="Refund Amount" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} />
              <input type="text" className="admin-input" required placeholder="Reason for refund" value={refundReason} onChange={e => setRefundReason(e.target.value)} />
              <button type="submit" className="admin-btn" style={{ padding: '12px', background: 'var(--admin-danger)', color: 'white', border: 'none' }}>Confirm Refund</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
