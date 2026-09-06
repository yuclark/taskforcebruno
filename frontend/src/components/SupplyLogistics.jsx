import React, { useState, useEffect } from 'react';

export default function SupplyLogistics() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveLogistics = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/inventory/');
      if (res.ok) {
        setInventory(await res.json());
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveLogistics();
  }, []);

  // --- ANALYTICS CALCULATIONS ---
  const lowStockAlertsCount = inventory.filter(item => item.quantity <= item.min_threshold).length;
  
  const expiringSoonCount = inventory.filter(item => {
    if (!item.expiration_date) return false;
    const expDate = new Date(item.expiration_date);
    const today = new Date();
    const gapTime = expDate.getTime() - today.getTime();
    const gapDays = gapTime / (1000 * 60 * 60 * 24);
    return gapDays >= 0 && gapDays <= 90;
  }).length;

  // Food breakdown: Cat vs Dog
  const foodBreakdown = inventory.reduce((acc, item) => {
    const nameLower = item.item_name.toLowerCase();
    const unitNormal = item.unit ? item.unit.toLowerCase().trim() : 'pcs';
    
    if (nameLower.includes('cat food') || nameLower.includes('kitten')) {
      acc.cat[unitNormal] = (acc.cat[unitNormal] || 0) + item.quantity;
    } else if (nameLower.includes('dog food') || nameLower.includes('puppy')) {
      acc.dog[unitNormal] = (acc.dog[unitNormal] || 0) + item.quantity;
    }
    return acc;
  }, { cat: {}, dog: {} });

  // Category weights
  const categoryWeights = inventory.reduce((acc, item) => {
    let targetCategory = item.category;
    if (targetCategory === 'Food') {
      const nameLower = item.item_name.toLowerCase();
      if (nameLower.includes('cat')) {
        targetCategory = 'Cat Food';
      } else if (nameLower.includes('dog')) {
        targetCategory = 'Dog Food';
      }
    }
    acc[targetCategory] = (acc[targetCategory] || 0) + item.quantity;
    return acc;
  }, { 'Cat Food': 0, 'Dog Food': 0, Medical: 0, Supplies: 0 });

  const maxCategoryValue = Math.max(1, categoryWeights['Cat Food'], categoryWeights['Dog Food'], categoryWeights.Medical, categoryWeights.Supplies);

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm mx-auto flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-[#5C0612] rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Loading inventory telemetry...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm space-y-6 animate-fade-in mx-auto my-2 text-slate-700">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#5C0612]">
              Campus Logistics & Warehouse
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
            Supply Logistics Hub
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time inventory levels, automated deficit alerts, and supply distribution tracking for campus companion welfare.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLiveLogistics}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 bg-white shadow-sm rounded-xl transition-all"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* KPI INDICATOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Total SKUs</span>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{inventory.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold">
            SKU
          </div>
        </div>

        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Low Stock Alerts</span>
            <p className={`text-2xl font-black mt-0.5 font-mono ${lowStockAlertsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {lowStockAlertsCount}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl font-mono text-xs font-bold ${lowStockAlertsCount > 0 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            DEFICIT
          </div>
        </div>

        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Near Expiration (&lt;90d)</span>
            <p className={`text-2xl font-black mt-0.5 font-mono ${expiringSoonCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {expiringSoonCount}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl font-mono text-xs font-bold ${expiringSoonCount > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
            EXP
          </div>
        </div>

        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Active Categories</span>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">4</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#5C0612] text-[#D4AF37] font-mono text-xs font-bold">
            HUB
          </div>
        </div>
      </div>

      {/* FOOD RESERVES ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Cat Food Balances */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#5C0612] tracking-wider font-mono">
              Cat Food Reserves
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Rations In Stock</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.keys(foodBreakdown.cat).length === 0 ? (
              <p className="text-slate-400 italic text-xs">No active cat food stock logged.</p>
            ) : (
              Object.entries(foodBreakdown.cat).map(([unit, qty]) => (
                <div key={unit} className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm font-mono text-slate-900 font-bold text-sm">
                  {qty} <span className="text-xs text-slate-500 font-sans font-normal">{unit}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dog Food Balances */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#5C0612] tracking-wider font-mono">
              Dog Food Reserves
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Rations In Stock</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.keys(foodBreakdown.dog).length === 0 ? (
              <p className="text-slate-400 italic text-xs">No active dog food stock logged.</p>
            ) : (
              Object.entries(foodBreakdown.dog).map(([unit, qty]) => (
                <div key={unit} className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm font-mono text-slate-900 font-bold text-sm">
                  {qty} <span className="text-xs text-slate-500 font-sans font-normal">{unit}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CORE CHARTS STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
        
        {/* LEFT CHART: ALL ITEMS STOCK LEVEL METER (Col 7) */}
        <div className="lg:col-span-7 border border-slate-200/80 rounded-2xl p-5 bg-slate-50/60 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div className="mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-slate-400">Telemetry Stream</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Current Stock Levels vs Threshold Limits</h3>
          </div>

          {inventory.length === 0 ? (
            <div className="text-center font-mono text-slate-400 text-xs my-auto py-12">
              No inventory entries logged in system registers.
            </div>
          ) : (
            <div className="flex items-end justify-around w-full gap-3 h-48 border-b border-slate-200 pb-2 relative px-2">
              {inventory.map((item) => {
                const maxScale = Math.max(...inventory.map(i => i.quantity), 120);
                const currentHeightPercent = Math.min(100, Math.max(8, (item.quantity / maxScale) * 100));
                const isDeficitState = item.quantity <= item.min_threshold;
                
                return (
                  <div key={item.item_id} className="flex-1 flex flex-col items-center group relative max-w-[58px] h-full justify-end">
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-slate-950 text-white font-mono text-[10px] p-2 rounded-xl shadow-xl border border-white/10 text-center transition-all duration-200 z-30 pointer-events-none min-w-[80px]">
                      <p className="font-bold border-b border-white/10 pb-0.5 mb-0.5">{item.quantity} {item.unit}</p>
                      <span className="text-slate-400 text-[9px] block font-sans">Min: {item.min_threshold}</span>
                    </div>

                    <div 
                      style={{ height: `${currentHeightPercent}%` }} 
                      className={`w-full rounded-t-xl transition-all duration-500 relative ${
                        isDeficitState 
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-sm border-t border-rose-300' 
                          : 'bg-gradient-to-t from-[#5C0612] to-[#8E0B1C] shadow-sm'
                      }`}
                    >
                      {isDeficitState && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[9px] shadow">!</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-around w-full gap-3 pt-3 text-[10px] font-semibold text-slate-500 text-center select-none font-mono">
            {inventory.map(item => (
              <span key={item.item_id} className="truncate flex-1 max-w-[58px] leading-tight block">
                {item.item_name.replace('Cat Food - ', '').replace('Dog Food - ', '').split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT CHART: CATEGORY DISTRIBUTION (Col 5) */}
        <div className="lg:col-span-5 border border-slate-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-slate-400">Category Breakdown</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Supply Category Distribution</h3>
            <p className="text-xs text-slate-500 mt-1">Relative total inventory allocations broken down by type.</p>
          </div>

          <div className="space-y-4 my-auto pt-4">
            {[
              { name: 'Cat Food Rations', key: 'Cat Food', color: 'bg-[#5C0612]' },
              { name: 'Dog Food Rations', key: 'Dog Food', color: 'bg-amber-600' },
              { name: 'Medical & Clinic', key: 'Medical', color: 'bg-blue-600' },
              { name: 'General Supplies', key: 'Supplies', color: 'bg-slate-700' }
            ].map((cat) => {
              const totalQty = categoryWeights[cat.key] || 0;
              const fillingPercent = Math.min(100, (totalQty / maxCategoryValue) * 100);

              return (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-sans font-medium text-slate-700">{cat.name}</span>
                    <span className="font-bold text-slate-900">{totalQty} units</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                    <div 
                      style={{ width: `${fillingPercent}%` }} 
                      className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-[11px] text-slate-500">
            * Threshold status updates dynamically based on current campus clinic stock.
          </div>
        </div>

      </div>

      {/* DETAILED INVENTORY ROSTER TABLE (Fills desktop width) */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm pt-2">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Complete Supply Catalog</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive ledger of current medical supplies, food stock, and equipment.</p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-white border px-2.5 py-1 rounded-lg">
            {inventory.length} Items Indexed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100/70 border-b border-slate-200 font-mono text-[10px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Item Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Stock Quantity</th>
                <th className="p-3.5">Min Threshold</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5">Expiration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400 font-normal">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const isLow = item.quantity <= item.min_threshold;
                  return (
                    <tr key={item.item_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-5 font-bold text-slate-900">
                        {item.item_name}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {item.quantity} <span className="font-sans font-normal text-slate-500 text-[11px]">{item.unit || 'units'}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {item.min_threshold} {item.unit || 'units'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          isLow
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isLow ? 'Low Stock' : 'Sufficient'}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 font-mono text-[11px] text-slate-500">
                        {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'Non-perishable'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}