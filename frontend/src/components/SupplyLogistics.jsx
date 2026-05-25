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
      console.error('Analytics feed integration error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveLogistics();
  }, []);

  // --- ANALYTICS ENGINE CALCULATIONS ---
  const lowStockAlertsCount = inventory.filter(item => item.quantity <= item.min_threshold).length;
  
  const expiringSoonCount = inventory.filter(item => {
    if (!item.expiration_date) return false;
    const expDate = new Date(item.expiration_date);
    const today = new Date();
    const gapTime = expDate.getTime() - today.getTime();
    const gapDays = gapTime / (1000 * 60 * 60 * 24);
    return gapDays >= 0 && gapDays <= 90;
  }).length;

  // General cumulative unit metric breakdown
  const unitBreakdown = inventory.reduce((acc, item) => {
    const normalUnit = item.unit ? item.unit.toLowerCase().trim() : 'units';
    acc[normalUnit] = (acc[normalUnit] || 0) + item.quantity;
    return acc;
  }, {});

  // SPECIFIC METRIC PARSING: Calculate exact totals for Cat Food vs Dog Food
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

  // Compute category weights and split the generic Food class into Cat and Dog buckets
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
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xl mx-auto">
        <div className="w-8 h-8 border-2 border-t-transparent border-[#5C0612] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">Compiling Real-Time Database Analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in my-2">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Ecosystem Supply Logistics Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time dynamic monitoring reporting node for transparent resource management.</p>
        </div>
      </div>

      {/* KPI INDICATOR MATRIX CARD BLOCKS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Unique Items Tracked</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{inventory.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold shadow-inner">SKU</div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Critical Deficits</span>
            <p className={`text-2xl font-black mt-1 font-mono ${lowStockAlertsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{lowStockAlertsCount}</p>
          </div>
          <div className={`p-3 rounded-xl font-mono text-xs font-bold ${lowStockAlertsCount > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>MIN</div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Near Expiration</span>
            <p className={`text-2xl font-black mt-1 font-mono ${expiringSoonCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{expiringSoonCount}</p>
          </div>
          <div className={`p-3 rounded-xl font-mono text-xs font-bold ${expiringSoonCount > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>EXP</div>
        </div>
      </div>

      {/* DEDICATED SPECIFIC FOOD RATIONS ACCUMULATION PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Cat Food Balances */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
          <span className="text-[10px] font-bold uppercase text-[#5C0612] tracking-wider font-mono block">Cat Food Total Reserves</span>
          <div className="flex gap-4 pt-1">
            {Object.keys(foodBreakdown.cat).length === 0 ? (
              <p className="text-slate-400 italic text-[11px]">No active cat food stock logged.</p>
            ) : (
              Object.entries(foodBreakdown.cat).map(([unit, qty]) => (
                <div key={unit} className="bg-white border rounded-xl px-3 py-1.5 shadow-sm font-mono text-slate-900 font-bold">
                  {qty} <span className="text-[10px] text-slate-400 font-sans font-normal">{unit}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dog Food Balances */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
          <span className="text-[10px] font-bold uppercase text-[#5C0612] tracking-wider font-mono block">Dog Food Total Reserves</span>
          <div className="flex gap-4 pt-1">
            {Object.keys(foodBreakdown.dog).length === 0 ? (
              <p className="text-slate-400 italic text-[11px]">No active dog food stock logged.</p>
            ) : (
              Object.entries(foodBreakdown.dog).map(([unit, qty]) => (
                <div key={unit} className="bg-white border rounded-xl px-3 py-1.5 shadow-sm font-mono text-slate-900 font-bold">
                  {qty} <span className="text-[10px] text-slate-400 font-sans font-normal">{unit}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CORE CHARTS STREAM PANEL ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* LEFT CHART: ALL ITEMS INDIVIDUAL STOCK LEVELS BAR METERS */}
        <div className="md:col-span-2 border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50 shadow-inner flex flex-col justify-between min-h-[350px]">
          <div className="mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-slate-400">Visualization Stream A</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Live Stock Levels vs Warning Threshold Limits</h3>
          </div>

          {inventory.length === 0 ? (
            <div className="text-center font-mono text-slate-400 text-xs my-auto py-12">CONNECTING INFRASTRUCTURE LEDGER MATRICES...</div>
          ) : (
            <div className="flex items-end justify-around w-full gap-4 h-48 border-b border-slate-200 pb-2 relative px-2">
              {inventory.map((item) => {
                const maxScale = Math.max(...inventory.map(i => i.quantity), 120);
                const currentHeightPercent = Math.min(100, Math.max(6, (item.quantity / maxScale) * 100));
                const isDeficitState = item.quantity <= item.min_threshold;
                
                return (
                  <div key={item.item_id} className="flex-1 flex flex-col items-center group relative max-w-[54px] h-full justify-end">
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-slate-950 text-white font-mono text-[9px] p-2 rounded-lg shadow-xl border border-white/10 text-center transition-all duration-200 z-30 pointer-events-none min-w-[75px]">
                      <p className="font-bold border-b border-white/10 pb-0.5 mb-0.5">{item.quantity} {item.unit}</p>
                      <span className="text-slate-400 text-[8px] block font-sans">Min: {item.min_threshold}</span>
                    </div>

                    <div 
                      style={{ height: `${currentHeightPercent}%` }} 
                      className={`w-full rounded-t-xl transition-all duration-500 relative ${
                        isDeficitState 
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_4px_12px_rgba(225,29,72,0.15)] border-t border-rose-300' 
                          : 'bg-gradient-to-t from-[#5C0612] to-[#b42237] shadow-[0_4px_12px_rgba(92,6,18,0.1)]'
                      }`}
                    >
                      {isDeficitState && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[8px] animate-bounce shadow">!</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-around w-full gap-4 pt-3 text-[9px] font-bold text-slate-500 text-center select-none font-mono">
            {inventory.map(item => (
              <span key={item.item_id} className="truncate flex-1 max-w-[54px] leading-tight block uppercase">
                {item.item_name.replace('Cat Food - ', '').replace('Dog Food - ', '').split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT CHART: SPLIT CATEGORY PROGRESS ALLOCATION BALANCE DECK */}
        <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-slate-400">Visualization Stream B</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Category Load Distribution</h3>
            <p className="text-[11px] text-slate-400 mt-1">Relative total inventory allocations broken down by type.</p>
          </div>

          <div className="space-y-4 my-auto pt-4">
            {[
              { name: 'Cat Food Rations', key: 'Cat Food', color: 'bg-[#5C0612]' },
              { name: 'Dog Food Rations', key: 'Dog Food', color: 'bg-amber-600' },
              { name: 'Medical / Clinics', key: 'Medical', color: 'bg-blue-600' },
              { name: 'Physical Assets', key: 'Supplies', color: 'bg-slate-700' }
            ].map((cat) => {
              const totalQty = categoryWeights[cat.key] || 0;
              const fillingPercent = Math.min(100, (totalQty / maxCategoryValue) * 100);

              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="font-sans font-semibold text-slate-700">{cat.name}</span>
                    <span className="font-bold text-slate-900">{totalQty} units</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                    <div 
                      style={{ width: `${fillingPercent}%` }} 
                      className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border p-2.5 rounded-xl text-[10px] font-mono text-slate-500 leading-tight">
            * Values scale dynamically based on the highest category weight.
          </div>
        </div>

      </div>

    </div>
  );
}