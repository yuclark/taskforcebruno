import React, { useState } from 'react';

export default function InventoryControl({ 
  inventoryItems, 
  transactionLedger, 
  loadingInventory, 
  onRefresh 
}) {
  const [inventorySubTab, setInventorySubTab] = useState('stock-list');
  const [selectedActionItemId, setSelectedActionItemId] = useState(null);
  
  // Operational transaction input state
  const [actionForm, setActionForm] = useState({ 
    transaction_type: 'IN', quantity_changed: '', reason: 'Bulk Purchase', supplier_donor: '', expiration_date: '' 
  });

  // DATA CONSISTENCY UPDATE: Appended food_type parameter block with clean default alignment
  const [newInventoryForm, setNewInventoryForm] = useState({ 
    item_name: '', category: 'Food', food_type: 'Cat Food', quantity: '', unit: 'kg', min_threshold: '10', supplier_donor: '', expiration_date: '' 
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // --- CRUD: CREATE WITH FIXED TYPE CASTING ---
  const handleInventoryCreate = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    // Construct unified standardized string names matching your analytics filters
    let finalizedName = newInventoryForm.item_name.trim();
    if (newInventoryForm.category === 'Food') {
      finalizedName = `${newInventoryForm.food_type} - ${finalizedName}`;
    }

    // Clean payload properties explicitly to prevent PostgreSQL database type matching rejections
    const sanitizedPayload = {
      item_name: finalizedName,
      category: newInventoryForm.category,
      quantity: parseInt(newInventoryForm.quantity, 10) || 0,
      unit: newInventoryForm.unit,
      min_threshold: parseInt(newInventoryForm.min_threshold, 10) || 10,
      supplier_donor: newInventoryForm.supplier_donor.trim() || null,
      expiration_date: newInventoryForm.expiration_date || null
    };

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/inventory/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedPayload)
      });
      if (res.ok) {
        setFormMessage({ type: 'success', text: `Asset "${sanitizedPayload.item_name}" synchronized successfully!` });
        setNewInventoryForm({ item_name: '', category: 'Food', food_type: 'Cat Food', quantity: '', unit: 'kg', min_threshold: '10', supplier_donor: '', expiration_date: '' });
        onRefresh();
        setInventorySubTab('stock-list');
      } else {
        const errData = await res.json();
        setFormMessage({ type: 'error', text: errData.error || 'Schema synchronization rejected.' });
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Backend interface link down.' });
    }
  };

  // --- CRUD: UPDATE THROUGH TRANSACTIONS ---
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    const qtyDelta = parseInt(actionForm.quantity_changed, 10);
    if (isNaN(qtyDelta) || qtyDelta <= 0) {
      alert('Specify a valid physical transformation integer.');
      return;
    }

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/inventory/transactions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          item_id: selectedActionItemId, 
          ...actionForm,
          quantity_changed: qtyDelta 
        })
      });
      if (res.ok) {
        setSelectedActionItemId(null);
        setActionForm({ transaction_type: 'IN', quantity_changed: '', reason: 'Bulk Purchase', supplier_donor: '', expiration_date: '' });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeInventoryItemPurge = async (itemId) => {
    if (!window.confirm('Scrub this product configuration completely out of active systems?')) return;
    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/inventory/${itemId}/`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-xs text-slate-700 px-1 sm:px-4">
      
      {/* Sub-tab Switch Controls Panel — Added horizontal auto swipe layout wrapper for mobile tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar select-none whitespace-nowrap">
        <button onClick={() => setInventorySubTab('stock-list')} className={`px-3 py-2 font-medium text-xs rounded-t-xl border-t border-x transition-all ${inventorySubTab === 'stock-list' ? 'bg-white border-slate-200 text-[#5C0612] font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          Active Supply Stock Master
        </button>
        <button onClick={() => setInventorySubTab('add-item')} className={`px-3 py-2 font-medium text-xs rounded-t-xl border-t border-x transition-all ${inventorySubTab === 'add-item' ? 'bg-white border-slate-200 text-[#5C0612] font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          + Catalog New Asset Item
        </button>
        <button onClick={() => setInventorySubTab('history')} className={`px-3 py-2 font-medium text-xs rounded-t-xl border-t border-x transition-all ${inventorySubTab === 'history' ? 'bg-white border-slate-200 text-[#5C0612] font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          Transaction Ledger History
        </button>
      </div>

      {/* VIEW PANEL 1: Stock Master Grid Table Layout — IMPLEMENTED HORIZONTAL SWIPING CONTAINER */}
      {inventorySubTab === 'stock-list' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          {loadingInventory ? (
            <div className="p-12 text-center text-slate-400 font-mono">RECONCILING STOCK REPOSITORIES...</div>
          ) : (
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="p-4 w-1/4">Item Catalog Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Stock Levels</th>
                  <th className="p-4">Supplier / Donor Mapping</th>
                  <th className="p-4">Expiration Tracking</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {inventoryItems.map((item) => (
                  <React.Fragment key={item.item_id}>
                    <tr className="hover:bg-slate-50/40 font-medium text-xs">
                      <td className="p-4 font-bold text-slate-900 whitespace-normal break-words max-w-[200px]">{item.item_name}</td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">{item.category}</td>
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {item.quantity} <span className="text-[10px] text-slate-400 font-light font-sans">{item.unit}</span>
                      </td>
                      <td className="p-4 font-sans italic text-slate-600 whitespace-normal max-w-[150px] break-words">{item.supplier_donor || 'N/A'}</td>
                      <td className="p-4 font-mono text-slate-500">{item.expiration_date || 'N/A'}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center items-center">
                          <button onClick={() => setSelectedActionItemId(selectedActionItemId === item.item_id ? null : item.item_id)} className="px-3 py-1 bg-white hover:bg-slate-50 border font-semibold rounded-lg text-[11px] shadow-sm whitespace-nowrap">
                            {selectedActionItemId === item.item_id ? 'Close' : 'Adjust Stock'}
                          </button>
                          <button onClick={() => executeInventoryItemPurge(item.item_id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">✕</button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Inline Transaction logging Action Overlay Form Drawer */}
                    {selectedActionItemId === item.item_id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="p-4 bg-slate-50/80 border-b">
                          <form onSubmit={handleTransactionSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl bg-white p-4 rounded-xl border shadow-inner">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Direction Type</label>
                              <select value={actionForm.transaction_type} onChange={(e) => setActionForm({ ...actionForm, transaction_type: e.target.value })} className="w-full p-1.5 border rounded-lg bg-slate-50 text-xs"><option value="IN">Stock In (Add)</option><option value="OUT">Stock Out (Deduct)</option></select>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Amount Delta</label>
                              <input type="number" required placeholder="Quantity" value={actionForm.quantity_changed} onChange={(e) => setActionForm({ ...actionForm, quantity_changed: e.target.value })} className="w-full p-1.5 border rounded-lg focus:outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Audit Log Reason</label>
                              <input type="text" required placeholder="e.g. Bulk Donation, Feeding" value={actionForm.reason} onChange={(e) => setActionForm({ ...actionForm, reason: e.target.value })} className="w-full p-1.5 border rounded-lg focus:outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Supplier / Donor</label>
                              <input type="text" placeholder="Optional source mapping" value={actionForm.supplier_donor} onChange={(e) => setActionForm({ ...actionForm, supplier_donor: e.target.value })} className="w-full p-1.5 border rounded-lg focus:outline-none text-xs" />
                            </div>
                            <div className="flex flex-col justify-between">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Exp Date</label>
                              <div className="flex gap-2">
                                <input type="date" value={actionForm.expiration_date} onChange={(e) => setActionForm({ ...actionForm, expiration_date: e.target.value })} className="w-full p-1 border rounded-lg text-[10px]" />
                                <button type="submit" className="px-4 py-1.5 bg-[#5C0612] text-white border-b-2 border-[#D4AF37] font-bold rounded-lg text-xs hover:bg-[#42040B] transition-all">Post</button>
                              </div>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* VIEW PANEL 2: Catalog New Asset Creation Form — MODIFIED: Expands card width to full container limits */}
      {inventorySubTab === 'add-item' && (
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in">
          {formMessage.text && (
            <div className={`p-3 border text-xs font-light rounded-xl mb-4 ${formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>
              {formMessage.text}
            </div>
          )}
          <form onSubmit={handleInventoryCreate} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Item Catalog Name *</label>
              <input type="text" required placeholder={newInventoryForm.category === 'Food' ? 'Ex: Premium Bulk Kibble, Salmon Pate Cans' : 'Ex: Anti-Rabies Vials, Metal Recovery Cage'} value={newInventoryForm.item_name} onChange={(e) => setNewInventoryForm({ ...newInventoryForm, item_name: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none font-medium text-slate-900 text-xs" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className={newInventoryForm.category === 'Food' ? "sm:col-span-1" : "sm:col-span-2"}>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Category</label>
                <select value={newInventoryForm.category} onChange={(e) => setNewInventoryForm({ ...newInventoryForm, category: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none font-medium text-xs">
                  <option value="Food">Food / Rations</option>
                  <option value="Medical">Medical / Clinics</option>
                  <option value="Supplies">Physical Assets</option>
                </select>
              </div>

              {newInventoryForm.category === 'Food' && (
                <div className="sm:col-span-1">
                  <label className="block font-bold text-[#5C0612] uppercase text-[10px] mb-1">Ration Species</label>
                  <select value={newInventoryForm.food_type} onChange={(e) => setNewInventoryForm({ ...newInventoryForm, food_type: e.target.value })} className="w-full p-2.5 bg-amber-50/20 border-2 border-[#D4AF37]/40 text-slate-900 font-bold rounded-xl focus:outline-none text-xs">
                    <option value="Cat Food">Cat Food</option>
                    <option value="Dog Food">Dog Food</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Starting Qty</label>
                <input type="number" required placeholder="0" value={newInventoryForm.quantity} onChange={(e) => setNewInventoryForm({ ...newInventoryForm, quantity: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono focus:outline-none text-xs" />
              </div>
              
              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Unit Type</label>
                <select value={newInventoryForm.unit} onChange={(e) => setNewInventoryForm({ ...newInventoryForm, unit: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none font-medium text-xs">
                  <option value="kg">kg (Kilograms)</option>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="cans">cans (Canned Wet)</option>
                  <option value="vials">vials (Injectables)</option>
                  <option value="bags">bags (Sacks)</option>
                  <option value="boxes">boxes (Cases)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Critical low Threshold Limit</label>
                <input type="number" required placeholder="10" value={newInventoryForm.min_threshold} onChange={(e) => setNewInventoryForm({ ...newInventoryForm, min_threshold: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono focus:outline-none text-xs" />
              </div>
              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Expiration Timeline Tracker</label>
                <input type="date" value={newInventoryForm.expiration_date} onChange={(e) => setNewInventoryForm({ ...newInventoryForm, expiration_date: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono focus:outline-none text-xs" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Supplier / Initial Donor Source</label>
              <input type="text" placeholder="Ex: Cebu Institute of Technology University Alumni Network" value={newInventoryForm.supplier_donor} onChange={(e) => setNewInventoryForm({ ...newInventoryForm, supplier_donor: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none font-medium text-slate-900 text-xs" />
            </div>

            <button type="submit" className="w-full py-3 bg-[#5C0612] text-white border-b-4 border-[#D4AF37] rounded-xl font-bold tracking-widest hover:bg-[#42040B] transition-all uppercase shadow-md text-xs">
              SYNCHRONIZE NEW LOGISTICS ASSET
            </button>
          </form>
        </div>
      )}

      {/* VIEW PANEL 3: Audit Trail Ledger List — IMPLEMENTED HORIZONTAL SWIPING CONTAINER */}
      {inventorySubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto animate-fade-in">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
                <th className="p-4">Timestamp Event</th>
                <th className="p-4 w-1/3">Target Product Component</th>
                <th className="p-4 text-center">Vector</th>
                <th className="p-4">Delta</th>
                <th className="p-4">Justification Cause Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-600">
              {transactionLedger.map((tx) => (
                <tr key={tx.transaction_id} className="hover:bg-slate-50/50">
                  <td className="p-4 text-slate-400 text-[10px] whitespace-nowrap">{new Date(tx.logged_at).toLocaleString()}</td>
                  <td className="p-4 font-sans font-bold text-slate-900 text-xs whitespace-normal break-words">{tx.inventory?.item_name || 'Scrubbed Asset'}</td>
                  <td className="p-4 text-center whitespace-nowrap">
                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${tx.transaction_type === 'IN' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                      {tx.transaction_type === 'IN' ? 'INFLOW' : 'OUTFLOW'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                    {tx.transaction_type === 'IN' ? '+' : '-'}{tx.quantity_changed} <span className="text-[9px] text-slate-400 font-light font-sans">{tx.inventory?.unit}</span>
                  </td>
                  <td className="p-4 font-sans text-slate-700 leading-tight whitespace-normal min-w-[200px] break-words">
                    {tx.reason}
                    {tx.supplier_donor && <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Source: {tx.supplier_donor}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}