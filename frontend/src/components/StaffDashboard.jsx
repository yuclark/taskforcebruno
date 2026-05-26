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
  const [loadingPets, setLoadingPets] = useState([]);
  
  // MOBILE STATE TRIGGER
  const [isMobileOpen, setIsMobileOpen] = useState(false);


  const [inventoryItems, setInventoryItems] = useState([]);
  const [transactionLedger, setTransactionLedger] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);


  const fetchAllRegisteredPets = async () => {
    setLoadingPets(true);
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/');
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
      const res = await fetch('https://taskforcebruno.onrender.com/api/inventory/');
      const ledgerRes = await fetch('https://taskforcebruno.onrender.com/api/inventory/transactions/');
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
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans antialiased relative">


      {/* MOBILE DARK BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}


      {/* Navigation Drawer — NOW MOBILE RESPONSIVE */}
      <aside className={`
        w-72 bg-[#5C0612] text-white p-6 flex flex-col justify-between border-r-4 border-[#D4AF37] 
        fixed md:sticky top-0 h-screen overflow-y-auto z-40 shadow-xl transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">Task Force Bruno</h2>
                <span className="text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase block mt-0.5">MDC Staff Portal</span>
              </div>
            </div>
            
            
            {/* MOBILE CLOSE BUTTON */}
            <button 
              onClick={() => setIsMobileOpen(false)} 
              className="md:hidden p-1 text-stone-300 hover:text-white rounded-lg hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <nav className="space-y-1.5">
            {['Community Newsfeed', 'Pending Applications', 'Pet Listings', 'Add New Pet', 'Medical Logs', 'Inventory Control', 'Sighting Reports', 'Broadcast Bulletin'].map((menu) => (
              <button 
                key={menu} 
                onClick={() => { setActiveMenu(menu); setIsMobileOpen(false); }} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${activeMenu === menu ? 'bg-white text-[#5C0612] shadow-md font-semibold' : 'text-stone-200 hover:bg-white/5'}`}
              >
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


      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 px-6 md:px-8 pt-6 md:pt-8 bg-slate-50">
          <div className="flex items-center gap-3 w-full md:w-auto">
            
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 shadow-sm transition-all focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
            </button>


            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{activeMenu}</h1>
              <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 hidden sm:block">Manage and execute state mutations on active institutional records.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] md:text-xs font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm self-end md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600">Clearance: STAFF</span>
          </div>
        </div>


        <div className={`flex-1 ${activeMenu === 'Community Newsfeed' ? 'overflow-hidden px-4 md:px-8 pb-4 pt-6' : 'overflow-y-auto p-4 md:p-8'}`}>
          {activeMenu === 'Community Newsfeed' && <NewsfeedView session={session} />}
          {activeMenu === 'Pending Applications' && <PendingApplications />}
          {activeMenu === 'Pet Listings' && <PetListings pets={pets} loadingPets={loadingPets} onRefresh={fetchAllRegisteredPets} />}
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