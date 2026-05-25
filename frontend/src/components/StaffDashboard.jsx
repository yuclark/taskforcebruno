import React, { useState, useEffect } from 'react';
import PendingApplications from './PendingApplications';
import PetListings from './PetListings';
import AddNewPet from './AddNewPet';
import MedicalLogs from './MedicalLogs';
import InventoryControl from './InventoryControl';
import SightingTriage from './SightingTriage';
import PostAnnouncement from './PostAnnouncement';
import NewsfeedView from './NewsfeedView';

export default function StaffDashboard({ session, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('Pet Listings');
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);

  const [inventoryItems, setInventoryItems] = useState([]);
  const [transactionLedger, setTransactionLedger] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const fetchAllRegisteredPets = async () => {
    setLoadingPets(true);
    try {
      const res = await fetch('http://localhost:8000/api/pets/');
      if (res.ok) setPets(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPets(false);
    }
  };

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const res = await fetch('http://localhost:8000/api/inventory/');
      const ledgerRes = await fetch('http://localhost:8000/api/inventory/transactions/');
      if (res.ok) setInventoryItems(await res.json());
      if (ledgerRes.ok) setTransactionLedger(await ledgerRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchAllRegisteredPets();
    fetchInventory();
  }, []);

  useEffect(() => {
    if (activeMenu === 'Pet Listings') fetchAllRegisteredPets();
    if (activeMenu === 'Inventory Control') fetchInventory();
  }, [activeMenu]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans antialiased">

      {/* Navigation Drawer */}
      <aside className="w-72 bg-[#5C0612] text-white p-6 flex flex-col justify-between border-r-4 border-[#D4AF37] shrink-0 sticky top-0 h-screen overflow-y-auto z-10 shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
            <div className="bg-white/10 p-2 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Task Force Bruno</h2>
              <span className="text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase block mt-0.5">MDC Staff Portal</span>
            </div>
          </div>
          <nav className="space-y-1.5">
            {['Community Newsfeed', 'Pending Applications', 'Pet Listings', 'Add New Pet', 'Medical Logs', 'Inventory Control', 'Sighting Reports', 'Broadcast Bulletin'].map((menu) => (
              <button key={menu} onClick={() => setActiveMenu(menu)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${activeMenu === menu ? 'bg-white text-[#5C0612] shadow-md font-semibold' : 'text-stone-200 hover:bg-white/5'}`}>
                <span>{menu}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#5C0612] font-bold flex items-center justify-center text-xs shrink-0">AS</div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white leading-none truncate">Admin Staff</p>
              <span className="text-[9px] text-stone-300 font-mono mt-1 block truncate">{session?.email || 'Loading context...'}</span>
            </div>
          </div>
          <button onClick={onLogout} className="w-full py-2 bg-white/5 hover:bg-rose-950/40 text-stone-300 hover:text-rose-200 rounded-xl text-[11px] font-medium border border-white/10 transition-all">DISCONNECT NODE</button>
        </div>
      </aside>

      {/* ── CHANGED: h-screen + overflow-hidden so NewsfeedView controls its own scroll */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Header — shrink-0 so it never compresses */}
        <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 px-8 pt-8 bg-slate-50">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{activeMenu}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage and execute state mutations on active institutional records.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600">Clearance Secured: STAFF</span>
          </div>
        </div>

        {/* ── CHANGED: flex-1 + overflow-hidden for newsfeed; overflow-y-auto for other pages */}
        <div className={`flex-1 ${activeMenu === 'Community Newsfeed' ? 'overflow-hidden px-8 pb-4 pt-6' : 'overflow-y-auto p-8'}`}>
          {activeMenu === 'Community Newsfeed' && <NewsfeedView session={session} />}
          {activeMenu === 'Pending Applications' && <PendingApplications />}
          {activeMenu === 'Pet Listings' && (
            <PetListings pets={pets} loadingPets={loadingPets} onRefresh={fetchAllRegisteredPets} />
          )}
          {activeMenu === 'Add New Pet' && <AddNewPet onRefresh={fetchAllRegisteredPets} />}
          {activeMenu === 'Medical Logs' && <MedicalLogs pets={pets} />}
          {activeMenu === 'Inventory Control' && (
            <InventoryControl
              inventoryItems={inventoryItems}
              transactionLedger={transactionLedger}
              loadingInventory={loadingInventory}
              onRefresh={fetchInventory}
            />
          )}
          {activeMenu === 'Sighting Reports' && <SightingTriage session={session} />}
          {activeMenu === 'Broadcast Bulletin' && <PostAnnouncement session={session} />}
        </div>

      </main>

    </div>
  );
}