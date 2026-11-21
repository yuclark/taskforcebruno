import React, { useState, useRef, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Utensils,
  Stethoscope,
  RefreshCw,
  Trash2,
  MinusCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import { apiPost, apiPut, apiDelete } from '../lib/api';

const CATEGORY_UNITS = {
  Food: [
    { value: 'kg', label: 'kg (Kilograms)' },
    { value: 'cans', label: 'cans (Canned Wet Food)' },
    { value: 'bags', label: 'bags (Sacks / Pouches)' },
    { value: 'packs', label: 'packs (Portion Packs)' },
    { value: 'g', label: 'g (Grams)' },
  ],
  Medical: [
    { value: 'vials', label: 'vials (Injectables / Vaccines)' },
    { value: 'pcs', label: 'pcs (Pieces / Tablets)' },
    { value: 'bottles', label: 'bottles (Liquid Solutions)' },
    { value: 'boxes', label: 'boxes (Cases / Kits)' },
    { value: 'packs', label: 'packs (Sterile Packs)' },
  ],
  Supplies: [
    { value: 'pcs', label: 'pcs (Pieces / Collars)' },
    { value: 'units', label: 'units (Equipment Sets)' },
    { value: 'boxes', label: 'boxes (Cases)' },
  ],
};

export default function InventoryControl({
  inventoryItems = [],
  transactionLedger = [],
  loadingInventory = false,
  onRefresh,
}) {
  const [inventorySubTab, setInventorySubTab] = useState('stock-list');
  const [selectedActionItemId, setSelectedActionItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [actionForm, setActionForm] = useState({
    transaction_type: 'IN',
    quantity_changed: '',
    reason: 'Bulk Purchase / Donation',
    supplier_donor: '',
    expiration_date: '',
  });
  const [submittingTx, setSubmittingTx] = useState(false);
  const [thresholdDraft, setThresholdDraft] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);

  const [newInventoryForm, setNewInventoryForm] = useState({
    item_name: '',
    category: 'Food',
    food_type: 'Cat Food',
    quantity: '',
    unit: 'kg',
    min_threshold: '10',
    supplier_donor: '',
    expiration_date: '',
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const [deductionModal, setDeductionModal] = useState({
    isOpen: false,
    item: null,
    qtyDelta: 0,
    reason: '',
    supplier_donor: '',
    submitting: false,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemName: '',
    submitting: false,
  });

  const [inventoryToast, setInventoryToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [insufficientStockModal, setInsufficientStockModal] = useState({
    isOpen: false,
    item: null,
    requestedQty: 0,
    currentStock: 0,
  });

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const anyOpen = deductionModal.isOpen || deleteModal.isOpen || insufficientStockModal.isOpen;
    if (!anyOpen) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (insufficientStockModal.isOpen) {
        setInsufficientStockModal({ isOpen: false, item: null, requestedQty: 0, currentStock: 0 });
      } else if (deductionModal.isOpen && !deductionModal.submitting) {
        setDeductionModal({ isOpen: false, item: null, qtyDelta: 0, reason: '', supplier_donor: '', submitting: false });
      } else if (deleteModal.isOpen && !deleteModal.submitting) {
        setDeleteModal({ isOpen: false, itemId: null, itemName: '', submitting: false });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deductionModal, deleteModal, insufficientStockModal]);

  const showToast = (type, msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setInventoryToast({ type, text: msg });
    toastTimerRef.current = setTimeout(() => setInventoryToast(null), 5000);
  };

  const triggerErrorToast = (msg) => showToast('error', msg);
  const triggerSuccessToast = (msg) => showToast('success', msg);

  const totalItemsCount = inventoryItems.length;
  const lowStockItems = inventoryItems.filter((item) => (item.quantity ?? 0) <= (item.min_threshold ?? 10));
  const totalFoodItems = inventoryItems.filter((item) => item.category === 'Food');
  const totalMedicalItems = inventoryItems.filter((item) => item.category === 'Medical');

  const filteredItems = inventoryItems.filter((item) => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.item_name?.toLowerCase().includes(q) ||
      item.supplier_donor?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (e) => {
    const nextCat = e.target.value;
    const defaultUnit = CATEGORY_UNITS[nextCat]?.[0]?.value || 'pcs';
    setNewInventoryForm((prev) => ({
      ...prev,
      category: nextCat,
      unit: defaultUnit,
    }));
  };

  const handleInventoryCreate = async (e) => {
    e.preventDefault();
    if (submittingCreate) return;
    setFormMessage({ type: '', text: '' });

    let finalizedName = newInventoryForm.item_name.trim();
    if (newInventoryForm.category === 'Food') {
      const prefix = `${newInventoryForm.food_type} - `;
      if (!finalizedName.toLowerCase().startsWith(newInventoryForm.food_type.toLowerCase())) {
        finalizedName = `${prefix}${finalizedName}`;
      }
    }

    const parsedQty = parseInt(newInventoryForm.quantity, 10);
    const parsedMin = parseInt(newInventoryForm.min_threshold, 10);

    const sanitizedPayload = {
      item_name: finalizedName,
      category: newInventoryForm.category,
      quantity: Number.isNaN(parsedQty) ? 0 : Math.max(0, parsedQty),
      unit: newInventoryForm.unit,
      min_threshold: Number.isNaN(parsedMin) ? 10 : Math.max(0, parsedMin),
      supplier_donor: newInventoryForm.supplier_donor.trim() || null,
      expiration_date: newInventoryForm.expiration_date || null,
    };

    setSubmittingCreate(true);
    try {
      const res = await apiPost('/inventory/', sanitizedPayload);
      if (res.ok) {
        triggerSuccessToast(`Added "${sanitizedPayload.item_name}" to inventory.`);
        setNewInventoryForm({
          item_name: '',
          category: 'Food',
          food_type: 'Cat Food',
          quantity: '',
          unit: 'kg',
          min_threshold: '10',
          supplier_donor: '',
          expiration_date: '',
        });
        if (onRefresh) onRefresh();
        setInventorySubTab('stock-list');
      } else {
        setFormMessage({
          type: 'error',
          text: res.data?.unit?.[0] || res.data?.quantity?.[0] || res.error || 'Failed to add inventory item.',
        });
      }
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleTransactionSubmit = (e, targetItem) => {
    e.preventDefault();
    if (submittingTx) return;
    const qtyDelta = parseInt(actionForm.quantity_changed, 10);
    if (Number.isNaN(qtyDelta) || qtyDelta <= 0) {
      triggerErrorToast('Please enter a positive whole number.');
      return;
    }

    if (actionForm.transaction_type === 'OUT') {
      const currentStock = targetItem.quantity ?? 0;
      if (qtyDelta > currentStock) {
        const errorMsg = `Disbursement quantity exceeds available balance (${currentStock} on-hand)`;
        triggerErrorToast(errorMsg);
        setInsufficientStockModal({
          isOpen: true,
          item: targetItem,
          requestedQty: qtyDelta,
          currentStock,
        });
        return;
      }

      setDeductionModal({
        isOpen: true,
        item: targetItem,
        qtyDelta,
        reason: actionForm.reason.trim() || 'Dispensation / Patrol feeding refill',
        supplier_donor: actionForm.supplier_donor.trim(),
        submitting: false,
      });
      return;
    }

    executeTransactionApi(targetItem.item_id, 'IN', qtyDelta, actionForm.reason, actionForm.supplier_donor);
  };

  const executeTransactionApi = async (itemId, type, qtyDelta, reason, supplier) => {
    setSubmittingTx(true);
    try {
      const res = await apiPost('/inventory/transactions/', {
        item_id: itemId,
        transaction_type: type,
        quantity_changed: qtyDelta,
        reason,
        supplier_donor: supplier || null,
      });
      if (res.ok) {
        setSelectedActionItemId(null);
        setActionForm({
          transaction_type: 'IN',
          quantity_changed: '',
          reason: 'Bulk Purchase / Donation',
          supplier_donor: '',
          expiration_date: '',
        });
        setDeductionModal({ isOpen: false, item: null, qtyDelta: 0, reason: '', supplier_donor: '', submitting: false });
        triggerSuccessToast(
          type === 'IN' ? `Logged +${qtyDelta} stock inflow.` : `Logged -${qtyDelta} stock disbursement.`
        );
        if (onRefresh) onRefresh();
      } else {
        setDeductionModal((prev) => ({ ...prev, submitting: false }));
        triggerErrorToast(res.error || 'Could not record stock movement.');
      }
    } finally {
      setSubmittingTx(false);
    }
  };

  const handleConfirmDeduction = async () => {
    if (!deductionModal.item || deductionModal.submitting) return;
    const currentStock = deductionModal.item.quantity ?? 0;
    if (deductionModal.qtyDelta > currentStock) {
      const errorMsg = `Disbursement quantity exceeds available balance (${currentStock} on-hand)`;
      triggerErrorToast(errorMsg);
      setInsufficientStockModal({
        isOpen: true,
        item: deductionModal.item,
        requestedQty: deductionModal.qtyDelta,
        currentStock,
      });
      setDeductionModal({ isOpen: false, item: null, qtyDelta: 0, reason: '', supplier_donor: '', submitting: false });
      return;
    }

    setDeductionModal((prev) => ({ ...prev, submitting: true }));
    await executeTransactionApi(
      deductionModal.item.item_id,
      'OUT',
      deductionModal.qtyDelta,
      deductionModal.reason,
      deductionModal.supplier_donor
    );
  };

  const handleThresholdUpdate = async (e, targetItem) => {
    e.preventDefault();
    const parsedThreshold = parseInt(thresholdDraft, 10);
    if (Number.isNaN(parsedThreshold) || parsedThreshold < 0) {
      triggerErrorToast('Please enter a valid non-negative threshold.');
      return;
    }

    setSavingThreshold(true);
    try {
      const res = await apiPut(`/inventory/${encodeURIComponent(targetItem.item_id)}/`, {
        min_threshold: parsedThreshold,
      });
      if (res.ok) {
        triggerSuccessToast(`Alert threshold for "${targetItem.item_name}" set to ≤${parsedThreshold} ${targetItem.unit}.`);
        if (onRefresh) onRefresh();
      } else {
        triggerErrorToast(res.data?.min_threshold?.[0] || res.error || 'Failed to update threshold.');
      }
    } finally {
      setSavingThreshold(false);
    }
  };

  const openDeleteModal = (item) => {
    setDeleteModal({
      isOpen: true,
      itemId: item.item_id,
      itemName: item.item_name,
      submitting: false,
    });
  };

  const executeDeleteItem = async () => {
    if (!deleteModal.itemId || deleteModal.submitting) return;
    setDeleteModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await apiDelete(`/inventory/${encodeURIComponent(deleteModal.itemId)}/`);
      if (res.ok) {
        const removedName = deleteModal.itemName;
        setDeleteModal({ isOpen: false, itemId: null, itemName: '', submitting: false });
        if (selectedActionItemId === deleteModal.itemId) setSelectedActionItemId(null);
        triggerSuccessToast(`Removed "${removedName}" from inventory.`);
        if (onRefresh) onRefresh();
      } else {
        setDeleteModal((prev) => ({ ...prev, submitting: false }));
        triggerErrorToast(res.error || 'Failed to remove inventory item.');
      }
    } catch {
      setDeleteModal((prev) => ({ ...prev, submitting: false }));
      triggerErrorToast('Unable to remove inventory item.');
    }
  };

  const openStockDrawer = (item, defaultType) => {
    if (selectedActionItemId === item.item_id && defaultType === actionForm.transaction_type) {
      setSelectedActionItemId(null);
      return;
    }
    setSelectedActionItemId(item.item_id);
    setThresholdDraft(String(item.min_threshold ?? 10));
    setActionForm({
      transaction_type: defaultType,
      quantity_changed: '',
      reason: defaultType === 'OUT' ? 'Dispensation / Patrol feeding refill' : 'Bulk Purchase / Donation',
      supplier_donor: '',
      expiration_date: '',
    });
  };

  const renderAdjustmentDrawer = (item) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner space-y-4">
      <form onSubmit={(e) => handleTransactionSubmit(e, item)} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="font-bold text-slate-900 text-xs">
            Log Stock Movement — {item.item_name}
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Balance: {item.quantity} {item.unit} &bull; Alert: &le;{item.min_threshold ?? 10} {item.unit}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Direction</label>
            <select
              value={actionForm.transaction_type}
              onChange={(e) => setActionForm({ ...actionForm, transaction_type: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-base sm:text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="IN">Stock In (+ Inflow)</option>
              <option value="OUT">Log Disbursement (OUTFLOW)</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
              Quantity ({item.unit})
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="Amount"
              value={actionForm.quantity_changed}
              onChange={(e) => setActionForm({ ...actionForm, quantity_changed: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-base sm:text-xs font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Reason</label>
            <input
              type="text"
              required
              placeholder="e.g. Feeding station refill"
              value={actionForm.reason}
              onChange={(e) => setActionForm({ ...actionForm, reason: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-base sm:text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Source / Recipient</label>
            <input
              type="text"
              placeholder="Optional notes"
              value={actionForm.supplier_donor}
              onChange={(e) => setActionForm({ ...actionForm, supplier_donor: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-base sm:text-xs text-slate-800"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="submit"
              disabled={submittingTx}
              className={`w-full py-2.5 sm:py-2 text-white font-bold rounded-xl text-xs uppercase tracking-wide border-b-2 shadow-sm transition-all disabled:opacity-50 ${
                actionForm.transaction_type === 'OUT'
                  ? 'bg-rose-700 hover:bg-rose-800 border-rose-900'
                  : 'bg-[#5C0612] hover:bg-[#42040B] border-[#D4AF37]'
              }`}
            >
              {actionForm.transaction_type === 'OUT' ? 'Log Disbursement (OUTFLOW)' : 'Record Inflow'}
            </button>
          </div>
        </div>
      </form>

      <form
        onSubmit={(e) => handleThresholdUpdate(e, item)}
        className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Low-Stock Alert Threshold
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Flags a low-stock warning whenever balance is at or below this quantity.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 focus-within:bg-white focus-within:border-slate-400 overflow-hidden">
            <input
              type="number"
              min="0"
              required
              aria-label={`Minimum alert threshold for ${item.item_name}`}
              value={thresholdDraft}
              onChange={(e) => setThresholdDraft(e.target.value)}
              className="w-20 p-2 bg-transparent focus:outline-none text-base sm:text-xs font-mono font-bold text-slate-900"
            />
            <span className="px-2.5 py-2 bg-slate-100 border-l border-slate-200 text-[10px] font-mono text-slate-500 select-none">
              {item.unit}
            </span>
          </div>
          <button
            type="submit"
            disabled={savingThreshold}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[11px] uppercase tracking-wide shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {savingThreshold ? 'Saving...' : 'Update Threshold'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 sm:space-y-6 text-xs text-slate-700 animate-fade-in pb-8 text-left font-sans">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Items</span>
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {totalItemsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Tracked supplies</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Low Stock</span>
            <span
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${
                lowStockItems.length > 0
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {lowStockItems.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">At or below alert limit</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Food &amp; Rations</span>
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {totalFoodItems.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Feeding stock</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Medical Supplies</span>
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {totalMedicalItems.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Vaccines &amp; first aid</p>
        </div>
      </div>

      {/* Subtab & Filter Header */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 text-left">
        <div className="flex bg-slate-100 p-1 rounded-xl font-mono text-[10px] font-bold uppercase select-none overflow-x-auto">
          <button
            type="button"
            onClick={() => setInventorySubTab('stock-list')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              inventorySubTab === 'stock-list'
                ? 'bg-white text-[#5C0612] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Active Catalog ({inventoryItems.length})
          </button>
          <button
            type="button"
            onClick={() => setInventorySubTab('add-item')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              inventorySubTab === 'add-item'
                ? 'bg-white text-[#5C0612] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            + Add Item
          </button>
          <button
            type="button"
            onClick={() => setInventorySubTab('history')}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              inventorySubTab === 'history'
                ? 'bg-white text-[#5C0612] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Stock History ({transactionLedger.length})
          </button>
        </div>

        {inventorySubTab === 'stock-list' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-base sm:text-xs text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Food">Food / Rations</option>
                <option value="Medical">Medical Supplies</option>
                <option value="Supplies">Equipment &amp; Gear</option>
              </select>
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
                title="Refresh inventory"
                aria-label="Refresh inventory"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PANEL 1: Stock List (Mobile Cards + Desktop Table) */}
      {inventorySubTab === 'stock-list' && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden text-left">
          {loadingInventory ? (
            <div className="p-14 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-[#5C0612] rounded-full animate-spin" />
              <span>Loading inventory records...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-14 text-center text-slate-400">No matching inventory items found.</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow = (item.quantity ?? 0) <= (item.min_threshold ?? 10);
                  const isOpen = selectedActionItemId === item.item_id;
                  return (
                    <div key={item.item_id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm">{item.item_name}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-400">SKU #{item.item_id}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                                item.category === 'Food'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : item.category === 'Medical'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {item.category}
                            </span>
                            {isLow && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                                LOW STOCK (&le;{item.min_threshold ?? 10})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-black text-slate-900 text-base">
                            {item.quantity} <span className="text-[11px] font-normal text-slate-500">{item.unit}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Min &le;{item.min_threshold ?? 10}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span>Source: {item.supplier_donor || 'Campus General Fund'}</span>
                        <span>Exp: {item.expiration_date || 'Non-perishable'}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openStockDrawer(item, 'OUT')}
                          className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-[11px] transition-colors"
                        >
                          Log Disbursement (OUTFLOW)
                        </button>
                        <button
                          type="button"
                          onClick={() => openStockDrawer(item, 'IN')}
                          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold rounded-xl text-[11px] text-slate-700 transition-colors"
                        >
                          {isOpen ? 'Close' : 'Adjust'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item)}
                          aria-label={`Remove ${item.item_name}`}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {isOpen && <div className="pt-2">{renderAdjustmentDrawer(item)}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="p-4 w-1/3">Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Stock Level</th>
                      <th className="p-4">Supplier / Donor</th>
                      <th className="p-4">Expiration</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredItems.map((item) => {
                      const isLow = (item.quantity ?? 0) <= (item.min_threshold ?? 10);
                      return (
                        <React.Fragment key={item.item_id}>
                          <tr className="hover:bg-slate-50/50 font-medium text-xs transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-900 text-sm">{item.item_name}</div>
                              <span className="text-[10px] font-mono text-slate-400">SKU #{item.item_id}</span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono border ${
                                  item.category === 'Food'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : item.category === 'Medical'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {item.category}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 text-sm">{item.quantity}</span>
                                <span className="text-[11px] text-slate-400 font-sans">{item.unit}</span>
                                {isLow && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                                    LOW STOCK (&le;{item.min_threshold ?? 10})
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                Threshold: &le;{item.min_threshold ?? 10} {item.unit}
                              </span>
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
                                  type="button"
                                  onClick={() => openStockDrawer(item, 'OUT')}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-[10px] shadow-sm whitespace-nowrap transition-colors"
                                >
                                  Log Disbursement (OUTFLOW)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openStockDrawer(item, 'IN')}
                                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold rounded-xl text-[11px] text-slate-700 shadow-sm whitespace-nowrap transition-colors"
                                >
                                  {selectedActionItemId === item.item_id ? 'Close' : 'Adjust Stock'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(item)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Remove item"
                                  aria-label={`Remove ${item.item_name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {selectedActionItemId === item.item_id && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={6} className="p-5 border-y border-slate-200">
                                {renderAdjustmentDrawer(item)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* PANEL 2: Add Item Form */}
      {inventorySubTab === 'add-item' && (
        <div className="w-full bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm animate-fade-in text-left">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Add New Inventory Item</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Define item details, category, low-stock threshold, and opening balance.
            </p>
          </div>

          {formMessage.text && (
            <div
              className={`p-3.5 border text-xs font-medium rounded-2xl mb-5 ${
                formMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleInventoryCreate} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Item Name *</label>
              <input
                type="text"
                required
                placeholder={
                  newInventoryForm.category === 'Food'
                    ? 'e.g. Dry Adult Kibble 20kg Bag, Salmon Wet Pouch'
                    : 'e.g. Anti-Rabies Vaccine Vials, Metal Recovery Cage'
                }
                value={newInventoryForm.item_name}
                onChange={(e) => setNewInventoryForm({ ...newInventoryForm, item_name: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-slate-900 text-base sm:text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className={newInventoryForm.category === 'Food' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Category *</label>
                <select
                  value={newInventoryForm.category}
                  onChange={handleCategoryChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-base sm:text-xs text-slate-800"
                >
                  <option value="Food">Food / Rations</option>
                  <option value="Medical">Medical Supplies</option>
                  <option value="Supplies">Equipment &amp; Gear</option>
                </select>
              </div>

              {newInventoryForm.category === 'Food' && (
                <div className="sm:col-span-1">
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Ration Type</label>
                  <select
                    value={newInventoryForm.food_type}
                    onChange={(e) => setNewInventoryForm({ ...newInventoryForm, food_type: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl focus:bg-white focus:outline-none text-base sm:text-xs"
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
                  min="0"
                  placeholder="0"
                  value={newInventoryForm.quantity}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, quantity: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none text-base sm:text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Unit of Measure</label>
                <select
                  value={newInventoryForm.unit}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, unit: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-base sm:text-xs text-slate-800"
                >
                  {(CATEGORY_UNITS[newInventoryForm.category] || CATEGORY_UNITS.Food).map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">
                  Minimum Alert Threshold
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="10"
                  value={newInventoryForm.min_threshold}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, min_threshold: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none text-base sm:text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={newInventoryForm.expiration_date}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, expiration_date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none text-base sm:text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">
                Supplier or Donor
              </label>
              <input
                type="text"
                placeholder="e.g. CIT-U Alumni Association, Wildcat Pet Care Fund"
                value={newInventoryForm.supplier_donor}
                onChange={(e) => setNewInventoryForm({ ...newInventoryForm, supplier_donor: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-slate-900 text-base sm:text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submittingCreate}
              className="w-full py-3 bg-[#5C0612] text-white border-b-4 border-[#D4AF37] rounded-xl font-bold tracking-wider hover:bg-[#42040B] disabled:opacity-50 transition-all uppercase shadow-md text-xs"
            >
              {submittingCreate ? 'Saving Item...' : 'Add Item to Inventory'}
            </button>
          </form>
        </div>
      )}

      {/* PANEL 3: Stock History Log (Mobile Cards + Desktop Table) */}
      {inventorySubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden text-left animate-fade-in">
          <div className="p-4 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">Stock Movement History</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Audit trail of incoming supplies, disbursements, and stock updates.
            </p>
          </div>

          {transactionLedger.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No stock movements logged yet.</div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {transactionLedger.map((tx) => (
                  <div key={tx.transaction_id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {tx.inventory?.item_name || 'Archived Item'}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg shrink-0 ${
                          tx.transaction_type === 'IN'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {tx.transaction_type === 'IN' ? '+' : '-'}
                        {tx.quantity_changed} {tx.inventory?.unit || ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{tx.reason}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                      <span>{tx.supplier_donor ? `Source: ${tx.supplier_donor}` : 'Clinic Ledger'}</span>
                      <span>
                        {tx.logged_at && !Number.isNaN(new Date(tx.logged_at).getTime())
                          ? new Date(tx.logged_at).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="p-4">Date &amp; Time</th>
                      <th className="p-4 w-1/3">Item Name</th>
                      <th className="p-4 text-center">Action</th>
                      <th className="p-4">Quantity</th>
                      <th className="p-4">Reason &amp; Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-600">
                    {transactionLedger.map((tx) => (
                      <tr key={tx.transaction_id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-400 text-[10px] whitespace-nowrap">
                          {tx.logged_at && !Number.isNaN(new Date(tx.logged_at).getTime())
                            ? new Date(tx.logged_at).toLocaleString()
                            : 'N/A'}
                        </td>
                        <td className="p-4 font-sans font-bold text-slate-900 text-xs whitespace-normal break-words">
                          {tx.inventory?.item_name || 'Archived Item'}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 text-[9px] font-bold rounded-lg ${
                              tx.transaction_type === 'IN'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {tx.transaction_type === 'IN' ? '+ Stock In' : '- Stock Out'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                          {tx.transaction_type === 'IN' ? '+' : '-'}
                          {tx.quantity_changed}{' '}
                          <span className="text-[9px] text-slate-400 font-normal font-sans">
                            {tx.inventory?.unit}
                          </span>
                        </td>
                        <td className="p-4 font-sans text-slate-700 leading-tight whitespace-normal min-w-[200px] break-words">
                          {tx.reason}
                          {tx.supplier_donor && (
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              Source: {tx.supplier_donor}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Confirmation Modal: Stock Deduction */}
      {deductionModal.isOpen && deductionModal.item && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 text-rose-600">
              <MinusCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">Confirm Stock Deduction</h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Deduct{' '}
              <strong className="text-rose-700 font-mono text-sm">
                -{deductionModal.qtyDelta} {deductionModal.item.unit}
              </strong>{' '}
              from <strong className="text-slate-900">{deductionModal.item.item_name}</strong>?
            </p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[11px] text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Current Stock:</span>
                <span className="font-bold text-slate-800">
                  {deductionModal.item.quantity} {deductionModal.item.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Balance After:</span>
                <span className="font-bold text-rose-700 font-mono">
                  {deductionModal.item.quantity - deductionModal.qtyDelta} {deductionModal.item.unit}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-1 mt-1">
                <span className="text-slate-400 font-mono">Reason:</span>
                <span className="text-slate-700 truncate max-w-[200px]">{deductionModal.reason}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={deductionModal.submitting}
                onClick={() =>
                  setDeductionModal({
                    isOpen: false,
                    item: null,
                    qtyDelta: 0,
                    reason: '',
                    supplier_donor: '',
                    submitting: false,
                  })
                }
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deductionModal.submitting}
                onClick={handleConfirmDeduction}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-md transition-all disabled:opacity-50"
              >
                {deductionModal.submitting ? 'Deducting...' : 'Confirm Deduction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Item */}
      {deleteModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">Remove Inventory Item</h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Remove <strong className="text-slate-900">&ldquo;{deleteModal.itemName}&rdquo;</strong> from active
              inventory records?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteModal.submitting}
                onClick={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '', submitting: false })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModal.submitting}
                onClick={executeDeleteItem}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-md transition-all disabled:opacity-50"
              >
                {deleteModal.submitting ? 'Removing...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      {inventoryToast && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-[120] animate-fade-in">
          <div
            className={`text-white px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
              inventoryToast.type === 'success'
                ? 'bg-emerald-900 border-emerald-500/50'
                : 'bg-rose-900 border-rose-500/50'
            }`}
          >
            {inventoryToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
            )}
            <span>{inventoryToast.text}</span>
          </div>
        </div>
      )}

      {/* Insufficient Stock Modal */}
      {insufficientStockModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto border border-rose-300 text-rose-700">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">Insufficient Available Stock</h3>

            <p className="text-xs text-rose-700 font-bold bg-rose-50 p-3 rounded-2xl border border-rose-200 leading-relaxed">
              Disbursement quantity exceeds available balance ({insufficientStockModal.currentStock} on-hand)
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Item:</span>
                <span className="font-bold text-slate-900">
                  {insufficientStockModal.item?.item_name || 'Stock Item'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">On-Hand Balance:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {insufficientStockModal.currentStock} {insufficientStockModal.item?.unit || 'units'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Requested:</span>
                <span className="font-bold text-rose-700 font-mono">
                  {insufficientStockModal.requestedQty} {insufficientStockModal.item?.unit || 'units'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                Stock balances cannot go below zero. Current balance remains{' '}
                {insufficientStockModal.currentStock} {insufficientStockModal.item?.unit || 'units'}.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setInsufficientStockModal({ isOpen: false, item: null, requestedQty: 0, currentStock: 0 })
              }
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
