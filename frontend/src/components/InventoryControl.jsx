import React, { useState } from 'react';

export default function InventoryControl({ 
  inventoryItems = [], 
  transactionLedger = [], 
  loadingInventory = false, 
  onRefresh 
}) {
  const [inventorySubTab, setInventorySubTab] = useState('stock-list');
  const [selectedActionItemId, setSelectedActionItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Operational transaction input state
  const [actionForm, setActionForm] = useState({ 
    transaction_type: 'IN', quantity_changed: '', reason: 'Bulk Purchase / Donation', supplier_donor: '', expiration_date: '' 
  });

  const [newInventoryForm, setNewInventoryForm] = useState({ 
    item_name: '', category: 'Food', food_type: 'Cat Food', quantity: '', unit: 'kg', min_threshold: '10', supplier_donor: '', expiration_date: '' 
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // --- SUMMARY METRICS ---
  const totalItemsCount = inventoryItems.length;
  const lowStockItems = inventoryItems.filter(item => (item.quantity || 0) <= (item.min_threshold || 10));
  const totalFoodItems = inventoryItems.filter(item => item.category === 'Food');
  const totalMedicalItems = inventoryItems.filter(item => item.category === 'Medical');

  // Filtered inventory list
  const filteredItems = inventoryItems.filter(item => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSearch = !searchQuery || item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) || item.supplier_donor?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- CRUD: CREATE WITH FIXED TYPE CASTING ---
  const handleInventoryCreate = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    let finalizedName = newInventoryForm.item_name.trim();
    if (newInventoryForm.category === 'Food') {
      finalizedName = `${newInventoryForm.food_type} - ${finalizedName}`;
    }

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
        setFormMessage({ type: 'success', text: `Supply item "${sanitizedPayload.item_name}" registered in logistics hub!` });
        setNewInventoryForm({ item_name: '', category: 'Food', food_type: 'Cat Food', quantity: '', unit: 'kg', min_threshold: '10', supplier_donor: '', expiration_date: '' });
        onRefresh();
        setInventorySubTab('stock-list');
      } else {
        const errData = await res.json();
        setFormMessage({ type: 'error', text: errData.error || 'Failed to catalog item.' });
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Network connection failure with inventory database.' });
    }
  };

  // --- CRUD: UPDATE THROUGH TRANSACTIONS ---
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    const qtyDelta = parseInt(actionForm.quantity_changed, 10);
    if (isNaN(qtyDelta) || qtyDelta <= 0) {
      alert('Please specify a valid positive quantity.');
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
        setActionForm({ transaction_type: 'IN', quantity_changed: '', reason: 'Bulk Purchase / Donation', supplier_donor: '', expiration_date: '' });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeInventoryItemPurge = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item from active inventory records?')) return;
    try {
      const res = await fetch(`https://taskforcebruno.onrender.com/api/inventory/${itemId}/`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-xs text-slate-700 animate-fade-in pb-12">
      
      {/* Top Banner with Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Total Catalog Items</span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-xs font-bold">SKU</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">{totalItemsCount} Items</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active tracked provisions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Low Stock Warnings</span>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold ${
              lowStockItems.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {lowStockItems.length}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">{lowStockItems.length} Items</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Under threshold replenishment</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Food & Rations</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-mono text-xs font-bold">RCN</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">{totalFoodItems.length} Brands</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Campus feeding inventory</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Medical & Clinical</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-mono text-xs font-bold">MED</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">{totalMedicalItems.length} Supplies</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Vaccines, cages, & first aid</p>
        </div>
      </div>

      {/* Main Subtab Switcher Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 text-left">
        <div className="flex bg-slate-100 p-1 rounded-2xl font-mono text-[10px] font-bold uppercase select-none overflow-x-auto">
          <button 
            onClick={() => setInventorySubTab('stock-list')} 
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              inventorySubTab === 'stock-list' ? 'bg-white text-[#5C0612] shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Active Supply Catalog ({inventoryItems.length})
          </button>
          <button 
            onClick={() => setInventorySubTab('add-item')} 
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              inventorySubTab === 'add-item' ? 'bg-white text-[#5C0612] shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            + Catalog New Item
          </button>
          <button 
            onClick={() => setInventorySubTab('history')} 
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              inventorySubTab === 'history' ? 'bg-white text-[#5C0612] shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Audit Ledger ({transactionLedger.length})
          </button>
        </div>

        {inventorySubTab === 'stock-list' && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Food">Food / Rations</option>
              <option value="Medical">Medical Supplies</option>
              <option value="Supplies">Physical Assets</option>
            </select>
            <button
              onClick={onRefresh}
              className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* VIEW PANEL 1: Stock Master Grid Table */}
      {inventorySubTab === 'stock-list' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left">
          {loadingInventory ? (
            <div className="p-16 text-center text-slate-400 font-mono text-xs">
              Synchronizing warehouse inventory records...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 text-center text-slate-400 italic">
              No matching inventory items found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="p-4 w-1/3">Item Catalog Description</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Stock Level</th>
                    <th className="p-4">Supplier / Donor Mapping</th>
                    <th className="p-4">Expiration Tracking</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.map((item) => {
                    const isLow = (item.quantity || 0) <= (item.min_threshold || 10);
                    return (
                      <React.Fragment key={item.item_id}>
                        <tr className="hover:bg-slate-50/50 font-medium text-xs transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-sm">{item.item_name}</div>
                            <span className="text-[10px] font-mono text-slate-400">SKU #{item.item_id}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono border ${
                              item.category === 'Food' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              item.category === 'Medical' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                {item.quantity}
                              </span>
                              <span className="text-[11px] text-slate-400 font-light font-sans">{item.unit}</span>
                              {isLow && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                                  LOW STOCK (&le;{item.min_threshold})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 text-xs">
                            {item.supplier_donor || 'Campus General Fund'}
                          </td>
                          <td className="p-4 font-mono text-slate-500 text-[11px]">
                            {item.expiration_date || 'Non-perishable'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-center items-center">
                              <button 
                                onClick={() => setSelectedActionItemId(selectedActionItemId === item.item_id ? null : item.item_id)} 
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold rounded-xl text-[11px] text-slate-700 shadow-sm whitespace-nowrap transition-colors"
                              >
                                {selectedActionItemId === item.item_id ? 'Close' : 'Adjust Stock'}
                              </button>
                              <button 
                                onClick={() => executeInventoryItemPurge(item.item_id)} 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove Item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Inline Stock Adjustment Drawer */}
                        {selectedActionItemId === item.item_id && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={6} className="p-5 border-y border-slate-200">
                              <form onSubmit={handleTransactionSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="font-bold text-slate-900 text-xs">
                                    Log Stock Inflow / Outflow for {item.item_name}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">Current Balance: {item.quantity} {item.unit}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Direction</label>
                                    <select 
                                      value={actionForm.transaction_type} 
                                      onChange={(e) => setActionForm({ ...actionForm, transaction_type: e.target.value })} 
                                      className="w-full p-2 border rounded-xl bg-slate-50 text-xs font-semibold"
                                    >
                                      <option value="IN">Stock In (+ Inflow)</option>
                                      <option value="OUT">Stock Out (- Deduction)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Quantity Delta ({item.unit})</label>
                                    <input 
                                      type="number" 
                                      required 
                                      placeholder="Amount" 
                                      value={actionForm.quantity_changed} 
                                      onChange={(e) => setActionForm({ ...actionForm, quantity_changed: e.target.value })} 
                                      className="w-full p-2 border rounded-xl focus:bg-white focus:outline-none text-xs font-mono" 
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Audit Reason</label>
                                    <input 
                                      type="text" 
                                      required 
                                      placeholder="e.g. Feeding station refill" 
                                      value={actionForm.reason} 
                                      onChange={(e) => setActionForm({ ...actionForm, reason: e.target.value })} 
                                      className="w-full p-2 border rounded-xl focus:bg-white focus:outline-none text-xs" 
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Source / Donor</label>
                                    <input 
                                      type="text" 
                                      placeholder="Optional source" 
                                      value={actionForm.supplier_donor} 
                                      onChange={(e) => setActionForm({ ...actionForm, supplier_donor: e.target.value })} 
                                      className="w-full p-2 border rounded-xl focus:bg-white focus:outline-none text-xs" 
                                    />
                                  </div>
                                  <div className="flex flex-col justify-end">
                                    <button 
                                      type="submit" 
                                      className="w-full py-2 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold rounded-xl text-xs uppercase tracking-wide border-b-2 border-[#D4AF37] transition-all"
                                    >
                                      Record Entry
                                    </button>
                                  </div>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW PANEL 2: Catalog New Asset Creation Form */}
      {inventorySubTab === 'add-item' && (
        <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-fade-in text-left">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Catalog New Provision or Logistics Asset</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Define category attributes, critical restocking thresholds, and initial unit stocks.</p>
          </div>

          {formMessage.text && (
            <div className={`p-4 border text-xs font-medium rounded-2xl mb-5 ${
              formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleInventoryCreate} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Item Catalog Name *</label>
              <input 
                type="text" 
                required 
                placeholder={newInventoryForm.category === 'Food' ? 'e.g. Dry Adult Kibble 20kg Bag, Salmon Wet Pouch' : 'e.g. Anti-Rabies Vaccine Vials, Metal Recovery Cage'} 
                value={newInventoryForm.item_name} 
                onChange={(e) => setNewInventoryForm({ ...newInventoryForm, item_name: e.target.value })} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-slate-900 text-xs" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className={newInventoryForm.category === 'Food' ? "sm:col-span-1" : "sm:col-span-2"}>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Category *</label>
                <select 
                  value={newInventoryForm.category} 
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, category: e.target.value })} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-xs"
                >
                  <option value="Food">Food / Rations</option>
                  <option value="Medical">Medical Supplies</option>
                  <option value="Supplies">Physical Assets / Gear</option>
                </select>
              </div>

              {newInventoryForm.category === 'Food' && (
                <div className="sm:col-span-1">
                  <label className="block font-bold text-[#5C0612] uppercase text-[10px] mb-1">Ration Type</label>
                  <select 
                    value={newInventoryForm.food_type} 
                    onChange={(e) => setNewInventoryForm({ ...newInventoryForm, food_type: e.target.value })} 
                    className="w-full p-2.5 bg-amber-50/40 border border-amber-200 text-slate-900 font-bold rounded-xl focus:outline-none text-xs"
                  >
                    <option value="Cat Food">Cat Food</option>
                    <option value="Dog Food">Dog Food</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Initial Quantity *</label>
                <input 
                  type="number" 
                  required 
                  placeholder="0" 
                  value={newInventoryForm.quantity} 
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, quantity: e.target.value })} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none text-xs" 
                />
              </div>
              
              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Unit of Measure</label>
                <select 
                  value={newInventoryForm.unit} 
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, unit: e.target.value })} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-xs"
                >
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
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Minimum Alert Threshold</label>
                <input 
                  type="number" 
                  required 
                  placeholder="10" 
                  value={newInventoryForm.min_threshold} 
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, min_threshold: e.target.value })} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none text-xs" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Expiration Date (Optional)</label>
                <input 
                  type="date" 
                  value={newInventoryForm.expiration_date} 
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, expiration_date: e.target.value })} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none text-xs" 
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Supplier or Donor Organization</label>
              <input 
                type="text" 
                placeholder="e.g. CIT-U Alumni Association, Wildcat Pet Care Fund" 
                value={newInventoryForm.supplier_donor} 
                onChange={(e) => setNewInventoryForm({ ...newInventoryForm, supplier_donor: e.target.value })} 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-slate-900 text-xs" 
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-[#5C0612] text-white border-b-4 border-[#D4AF37] rounded-xl font-bold tracking-wider hover:bg-[#42040B] transition-all uppercase shadow-md text-xs"
            >
              Add Item to Inventory Catalog
            </button>
          </form>
        </div>
      )}

      {/* VIEW PANEL 3: Audit Trail Ledger List */}
      {inventorySubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left animate-fade-in">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Inventory Transaction Audit Trail</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Immutable record of all stock adjustments, replenishments, and withdrawals.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 w-1/3">Target Provision Item</th>
                  <th className="p-4 text-center">Movement</th>
                  <th className="p-4">Delta</th>
                  <th className="p-4">Audit Justification & Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-600">
                {transactionLedger.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-400 text-[10px] whitespace-nowrap">{new Date(tx.logged_at).toLocaleString()}</td>
                    <td className="p-4 font-sans font-bold text-slate-900 text-xs whitespace-normal break-words">{tx.inventory?.item_name || 'Archived Asset'}</td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded ${
                        tx.transaction_type === 'IN' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {tx.transaction_type === 'IN' ? '+ INFLOW' : '- DEDUCTION'}
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
        </div>
      )}
    </div>
  );
}