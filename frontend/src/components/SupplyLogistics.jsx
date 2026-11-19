import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  AlertTriangle,
  Clock,
  LayoutGrid,
  RefreshCw,
  Cat,
  Dog,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart
} from 'lucide-react';

function formatUnitTotals(unitMap, fallback = '0 units') {
  const entries = Object.entries(unitMap || {}).filter(([, qty]) => qty > 0);
  if (entries.length === 0) return fallback;
  return entries.map(([unit, qty]) => `${qty} ${unit}`).join(' & ');
}

export default function SupplyLogistics() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveLogistics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/inventory/');
      if (res.ok) {
        const data = await res.json();
        setInventory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const res = await fetch('https://taskforcebruno.onrender.com/api/inventory/');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setInventory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Inventory fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- ANALYTICS CALCULATIONS ---
  const lowStockAlertsCount = inventory.filter(item => (item.quantity ?? 0) <= (item.min_threshold ?? 10)).length;

  const expiringSoonCount = inventory.filter(item => {
    if (!item.expiration_date) return false;
    const expDate = new Date(item.expiration_date);
    if (Number.isNaN(expDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gapDays = (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return gapDays >= 0 && gapDays <= 90;
  }).length;

  // Food breakdown: Cat vs Dog (tracks ALL metric units cleanly without mixing dimensions)
  const foodBreakdown = inventory.reduce((acc, item) => {
    const nameLower = (item.item_name || '').toLowerCase();
    const unitNormal = item.unit ? item.unit.toLowerCase().trim() : 'pcs';
    const qty = Number(item.quantity) || 0;

    if (item.category === 'Food' && (nameLower.includes('cat') || nameLower.includes('kitten'))) {
      acc.cat[unitNormal] = (acc.cat[unitNormal] || 0) + qty;
    } else if (item.category === 'Food' && (nameLower.includes('dog') || nameLower.includes('puppy'))) {
      acc.dog[unitNormal] = (acc.dog[unitNormal] || 0) + qty;
    }
    return acc;
  }, { cat: {}, dog: {} });

  // Unit-aware category metrics
  const categoryMetrics = {
    'Cat Food': {
      skus: inventory.filter(i => i.category === 'Food' && ((i.item_name || '').toLowerCase().includes('cat') || (i.item_name || '').toLowerCase().includes('kitten'))).length,
      summary: formatUnitTotals(foodBreakdown.cat, '0 kg')
    },
    'Dog Food': {
      skus: inventory.filter(i => i.category === 'Food' && ((i.item_name || '').toLowerCase().includes('dog') || (i.item_name || '').toLowerCase().includes('puppy'))).length,
      summary: formatUnitTotals(foodBreakdown.dog, '0 kg')
    },
    'Medical': {
      skus: inventory.filter(i => i.category === 'Medical').length,
      vials: inventory.filter(i => i.category === 'Medical' && (i.unit?.toLowerCase() === 'vials' || i.unit?.toLowerCase() === 'doses')).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
      items: inventory.filter(i => i.category === 'Medical' && i.unit?.toLowerCase() !== 'vials' && i.unit?.toLowerCase() !== 'doses').reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    },
    'Supplies': {
      skus: inventory.filter(i => i.category === 'Supplies').length,
      items: inventory.filter(i => i.category === 'Supplies').reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    }
  };

  const activeCategoryCount = Object.values(categoryMetrics).filter(c => c.skus > 0).length;
  const totalCatalogSkus = Math.max(1, inventory.length);
  const maxChartScale = Math.max(...inventory.map(i => Number(i.quantity) || 0), 100);

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm mx-auto flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-[#5C0612] rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-slate-500 font-medium">Loading campus supply inventory...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm space-y-6 animate-fade-in mx-auto my-2 text-slate-700">

      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-[#5C0612]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C0612]">
              Campus Logistics &amp; Supplies
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Supply Logistics Hub
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time inventory levels, low-stock alerts, and supply balances for CIT-U campus companion care.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLiveLogistics}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 bg-white shadow-sm rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* KPI INDICATOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Total Supply Items</span>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{inventory.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Low Stock Alerts</span>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${lowStockAlertsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {lowStockAlertsCount}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            lowStockAlertsCount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Expiring Within 90 Days</span>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${expiringSoonCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {expiringSoonCount}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            expiringSoonCount > 0 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Active Categories</span>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{activeCategoryCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#5C0612]/10 text-[#5C0612] border border-[#5C0612]/15 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FOOD RESERVES ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Cat Food Balances */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5C0612]/10 text-[#5C0612] flex items-center justify-center">
                <Cat className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">
                Cat Food Reserves
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Rations in Stock</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {Object.keys(foodBreakdown.cat).length === 0 ? (
              <p className="text-slate-400 italic text-xs">No active cat food stock logged.</p>
            ) : (
              Object.entries(foodBreakdown.cat).map(([unit, qty]) => (
                <div key={unit} className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm text-slate-900 font-bold text-sm tabular-nums">
                  {qty} <span className="text-xs text-slate-500 font-normal">{unit}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dog Food Balances */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Dog className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">
                Dog Food Reserves
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Rations in Stock</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {Object.keys(foodBreakdown.dog).length === 0 ? (
              <p className="text-slate-400 italic text-xs">No active dog food stock logged.</p>
            ) : (
              Object.entries(foodBreakdown.dog).map(([unit, qty]) => (
                <div key={unit} className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm text-slate-900 font-bold text-sm tabular-nums">
                  {qty} <span className="text-xs text-slate-500 font-normal">{unit}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CORE ANALYTICS STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">

        {/* LEFT PANEL: READABLE HORIZONTAL STOCK METERS (Col 7) */}
        <div className="lg:col-span-7 border border-slate-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5C0612]/10 text-[#5C0612] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stock Levels vs. Alert Thresholds</h3>
                <p className="text-[11px] text-slate-400">Live inventory quantities compared against minimum restock limits.</p>
              </div>
            </div>
          </div>

          {inventory.length === 0 ? (
            <div className="text-center text-slate-400 text-xs my-auto py-12">
              No inventory entries logged yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {inventory.map((item) => {
                const qty = Number(item.quantity) || 0;
                const threshold = Number(item.min_threshold ?? 10);
                const widthPct = Math.min(100, Math.max(4, (qty / maxChartScale) * 100));
                const isDeficit = qty <= threshold;

                return (
                  <div key={item.item_id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-800 truncate" title={item.item_name}>
                        {item.item_name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 tabular-nums">
                        <span className={`font-bold ${isDeficit ? 'text-rose-600' : 'text-slate-900'}`}>
                          {qty} {item.unit || 'units'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Min: {threshold})
                        </span>
                        {isDeficit && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" title="Low stock alert" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDeficit
                            ? 'bg-rose-500'
                            : 'bg-[#5C0612]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: CATEGORY DISTRIBUTION (Col 5) */}
        <div className="lg:col-span-5 border border-slate-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Supply Category Distribution</h3>
              <p className="text-[11px] text-slate-400">Active catalog share and unit totals by category.</p>
            </div>
          </div>

          <div className="space-y-4 my-auto py-4">
            {[
              {
                name: 'Cat Food Rations',
                key: 'Cat Food',
                color: 'bg-[#5C0612]',
                summary: categoryMetrics['Cat Food'].summary,
                skus: categoryMetrics['Cat Food'].skus
              },
              {
                name: 'Dog Food Rations',
                key: 'Dog Food',
                color: 'bg-amber-600',
                summary: categoryMetrics['Dog Food'].summary,
                skus: categoryMetrics['Dog Food'].skus
              },
              {
                name: 'Medical & Clinical',
                key: 'Medical',
                color: 'bg-blue-600',
                summary: categoryMetrics.Medical.vials > 0 ? `${categoryMetrics.Medical.vials} vials` : `${categoryMetrics.Medical.items} supplies`,
                skus: categoryMetrics.Medical.skus
              },
              {
                name: 'General Supplies',
                key: 'Supplies',
                color: 'bg-slate-700',
                summary: `${categoryMetrics.Supplies.items} assets`,
                skus: categoryMetrics.Supplies.skus
              }
            ].map((cat) => {
              const skuPercent = Math.min(100, (cat.skus / totalCatalogSkus) * 100);

              return (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{cat.name} ({cat.skus})</span>
                    <span className="font-bold text-slate-900 tabular-nums">{cat.summary}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${skuPercent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl text-[11px] text-slate-500">
            Threshold alerts update automatically based on live campus clinic inventory.
          </div>
        </div>

      </div>

      {/* DETAILED INVENTORY ROSTER TABLE */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Complete Supply Catalog</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive ledger of current medical supplies, food stock, and equipment.</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg">
            {inventory.length} Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
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
                  const isLow = (item.quantity ?? 0) <= (item.min_threshold ?? 10);
                  return (
                    <tr key={item.item_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">
                        {item.item_name}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          item.category === 'Food'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : item.category === 'Medical'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 tabular-nums">
                        {item.quantity} <span className="font-normal text-slate-500 text-[11px]">{item.unit || 'units'}</span>
                      </td>
                      <td className="p-3.5 text-slate-500 tabular-nums">
                        {item.min_threshold} {item.unit || 'units'}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isLow
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isLow ? (
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>{isLow ? 'Low Stock' : 'Sufficient'}</span>
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-[11px] text-slate-500 tabular-nums">
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
