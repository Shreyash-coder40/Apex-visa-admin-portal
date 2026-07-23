import React, { useState } from 'react';
import { DollarSign, Plus, CheckCircle2, AlertCircle, Clock, ShieldCheck, ArrowDownRight, ArrowUpRight, Building2, RefreshCw, FileText } from 'lucide-react';

export default function FinancialLedger({ currentRole, currentBranch }) {
  const isSuperAdmin = currentRole === 'super_admin';

  // Seeded fee records across branches demonstrating auto-balance calculation
  const [feeRecords, setFeeRecords] = useState([
    {
      id: 'F001',
      studentName: 'Alex Rivera',
      branch: 'TOR-01',
      feeType: 'University Admission Processing Fee',
      vertical: 'admission',
      totalAmount: 25000,
      currency: 'CAD',
      amountReceived: 15000,
      balance: 10000, // Computed: 25000 - 15000
      status: 'Partial',
      dueDate: '2026-08-30',
      transactions: [
        { id: 't1', date: '2026-07-10', amount: 10000, currency: 'CAD', type: 'Payment', notes: 'First installment via Wire Transfer' },
        { id: 't2', date: '2026-07-18', amount: 5000, currency: 'CAD', type: 'Payment', notes: 'Second installment card payment' }
      ]
    },
    {
      id: 'F002',
      studentName: 'Priya Sharma',
      branch: 'TOR-01',
      feeType: 'Visa Filing & Legal Audit Fee',
      vertical: 'visa',
      totalAmount: 45000,
      currency: 'CAD',
      amountReceived: 45000,
      balance: 0, // Computed: 45000 - 45000
      status: 'Paid',
      dueDate: '2026-08-15',
      transactions: [
        { id: 't3', date: '2026-07-05', amount: 45000, currency: 'CAD', type: 'Payment', notes: 'Full upfront payment settled' }
      ]
    },
    {
      id: 'F003',
      studentName: 'James Wilson',
      branch: 'SYD-01',
      feeType: 'Initial Consultation Fee',
      vertical: 'general',
      totalAmount: 500,
      currency: 'AUD',
      amountReceived: 0,
      balance: 500, // Computed: 500 - 0
      status: 'Pending',
      dueDate: '2026-08-01',
      transactions: []
    },
    {
      id: 'F004',
      studentName: 'Aarav Mehta',
      branch: 'VAN-01',
      feeType: 'University Admission Processing Fee',
      vertical: 'admission',
      totalAmount: 3000,
      currency: 'USD',
      amountReceived: 1500,
      balance: 1500,
      status: 'Partial',
      dueDate: '2026-09-10',
      transactions: [
        { id: 't4', date: '2026-07-15', amount: 1500, currency: 'USD', type: 'Payment', notes: 'Deposit received' }
      ]
    }
  ]);

  // State for recording a new payment modal
  const [selectedFeeId, setSelectedFeeId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [currencyError, setCurrencyError] = useState('');

  const filteredRecords = feeRecords.filter(rec => 
    isSuperAdmin || rec.branch === currentBranch.code
  );

  const handleOpenPaymentModal = (feeId) => {
    setSelectedFeeId(feeId);
    setPaymentAmount('');
    setPaymentNotes('');
    setCurrencyError('');
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    const feeRec = feeRecords.find(r => r.id === selectedFeeId);
    if (!feeRec) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;

    // Simulate PostgreSQL Trigger fn_update_fee_record_totals()
    const newReceived = feeRec.amountReceived + amt;
    const newBalance = Math.max(0, feeRec.totalAmount - newReceived);
    const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

    const newTx = {
      id: `t_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      currency: feeRec.currency,
      type: 'Payment',
      notes: paymentNotes || 'Staff manual installment entry'
    };

    setFeeRecords(feeRecords.map(r => 
      r.id === selectedFeeId 
        ? { 
            ...r, 
            amountReceived: newReceived, 
            balance: newBalance, 
            status: newStatus,
            transactions: [newTx, ...r.transactions]
          } 
        : r
    ));

    setSelectedFeeId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner & Audit Notice */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '14px', 
        padding: '20px 24px', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            Financial Ledger & Installments Management
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            Real-time fee tracking across consultancy services, university admission, and visa processing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={15} color="#059669" />
            <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: '700' }}>
              Triggers Active: Balance = Total - Received
            </span>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={15} color="#0066ff" />
            <span style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: '700' }}>
              Issue #3 Fix: Currency Lock Active
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '16px 20px' }}>Student & Branch</th>
              <th style={{ padding: '16px 20px' }}>Fee Type & Vertical</th>
              <th style={{ padding: '16px 20px' }}>Total Due</th>
              <th style={{ padding: '16px 20px' }}>Amount Received (`Trigger`)</th>
              <th style={{ padding: '16px 20px' }}>Current Balance</th>
              <th style={{ padding: '16px 20px' }}>Status</th>
              <th style={{ padding: '16px 20px', textAlign: 'right' }}>Record Installment</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((fee, index) => (
              <tr key={fee.id} style={{ borderBottom: index < filteredRecords.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
                
                {/* Student & Branch */}
                <td style={{ padding: '18px 20px' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.92rem' }}>{fee.studentName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <Building2 size={12} /> {fee.branch} • Due: {fee.dueDate}
                  </div>
                </td>

                {/* Fee Type */}
                <td style={{ padding: '18px 20px' }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.88rem' }}>{fee.feeType}</div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: fee.vertical === 'admission' ? '#eff6ff' : fee.vertical === 'visa' ? '#faf5ff' : '#f1f5f9',
                    color: fee.vertical === 'admission' ? '#0066ff' : fee.vertical === 'visa' ? '#9333ea' : '#475569',
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginTop: '4px'
                  }}>
                    {fee.vertical} vertical
                  </span>
                </td>

                {/* Total Due */}
                <td style={{ padding: '18px 20px', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                  ${fee.totalAmount.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{fee.currency}</span>
                </td>

                {/* Amount Received */}
                <td style={{ padding: '18px 20px', fontWeight: '700', color: '#059669', fontSize: '0.95rem' }}>
                  ${fee.amountReceived.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{fee.currency}</span>
                </td>

                {/* Balance */}
                <td style={{ padding: '18px 20px' }}>
                  <span style={{ 
                    fontWeight: '800', 
                    fontSize: '0.95rem', 
                    color: fee.balance > 0 ? '#ea580c' : '#059669'
                  }}>
                    ${fee.balance.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{fee.currency}</span>
                  </span>
                </td>

                {/* Status */}
                <td style={{ padding: '18px 20px' }}>
                  <span style={{ 
                    background: fee.status === 'Paid' ? '#ecfdf5' : fee.status === 'Partial' ? '#fff7ed' : '#fef2f2', 
                    color: fee.status === 'Paid' ? '#059669' : fee.status === 'Partial' ? '#ea580c' : '#dc2626',
                    border: fee.status === 'Paid' ? '1px solid #a7f3d0' : fee.status === 'Partial' ? '1px solid #fed7aa' : '1px solid #fecaca',
                    padding: '4px 12px', 
                    borderRadius: '999px', 
                    fontSize: '0.78rem', 
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {fee.status === 'Paid' && <CheckCircle2 size={13} />}
                    {fee.status === 'Partial' && <Clock size={13} />}
                    {fee.status === 'Pending' && <AlertCircle size={13} />}
                    {fee.status}
                  </span>
                </td>

                {/* Action */}
                <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                  {fee.balance > 0 ? (
                    <button
                      onClick={() => handleOpenPaymentModal(fee.id)}
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#0066ff'}
                      onMouseOut={e => e.currentTarget.style.background = '#0f172a'}
                    >
                      <Plus size={14} /> Record Payment
                    </button>
                  ) : (
                    <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: '700' }}>
                      Fully Settled
                    </span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {selectedFeeId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0'
          }}>
            {(() => {
              const feeRec = feeRecords.find(r => r.id === selectedFeeId);
              return (
                <form onSubmit={handleRecordPayment}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                      Record Payment Installment
                    </h3>
                    <button type="button" onClick={() => setSelectedFeeId(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Student Fee Record</div>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>{feeRec.studentName} — {feeRec.feeType}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                      <span style={{ color: '#475569' }}>Total Due: ${feeRec.totalAmount} {feeRec.currency}</span>
                      <span style={{ color: '#ea580c' }}>Remaining Balance: ${feeRec.balance} {feeRec.currency}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Installment Amount ({feeRec.currency} Only - Head Team Currency Lock)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#64748b' }}>$</span>
                      <input 
                        type="number" 
                        required 
                        max={feeRec.balance}
                        placeholder={`Max ${feeRec.balance}`}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px 12px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: '700', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '22px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Payment Notes & Transaction Reference
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Wire transfer Ref #WT-998271"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedFeeId(null)}
                      style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}
                    >
                      <CheckCircle2 size={16} /> Record & Auto-Calculate Balance
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
