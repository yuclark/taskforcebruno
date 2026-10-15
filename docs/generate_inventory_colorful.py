import zlib
import base64
import requests
import os

def render_kroki(puml_code, out_png, out_puml):
    with open(out_puml, "w", encoding="utf-8") as f:
        f.write(puml_code)
    
    compressed = zlib.compress(puml_code.encode("utf-8"), 9)
    encoded = base64.urlsafe_b64encode(compressed).decode("ascii")
    png_url = f"https://kroki.io/plantuml/png/{encoded}"
    svg_url = f"https://kroki.io/plantuml/svg/{encoded}"
    
    resp = requests.get(png_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    if resp.status_code == 200:
        with open(out_png, "wb") as f:
            f.write(resp.content)
        print(f"Successfully rendered {out_png} ({len(resp.content)} bytes)")
        return svg_url
    else:
        print(f"Failed to render {out_png}: {resp.status_code} - {resp.text}")
        return None

# ==========================================
# 1. COLORFUL CLASS DIAGRAM (MODULE 2.2)
# ==========================================
class_puml = """@startuml
skinparam backgroundColor #F8FAFC
skinparam shadowing false
skinparam roundcorner 12
skinparam handwritten false
skinparam defaultFontName "Segoe UI"

skinparam class {
    BackgroundColor white
    ArrowColor #2563EB
    BorderColor #64748B
    BorderThickness 1.5
    FontSize 12
}

skinparam package {
    BackgroundColor #F1F5F9
    BorderColor #64748B
    BorderThickness 1.5
    FontColor #0F172A
    FontStyle bold
}

package "Frontend Presentation Layer (React 19 / Vite)" #EFF6FF {
    class InventoryControlComponent <<React Component>> #DBEAFE {
        - inventoryItems: InventoryItem[]
        - transactionLedger: InventoryTransaction[]
        - inventorySubTab: string
        - selectedActionItemId: number
        - categoryFilter: string
        - deductionModal: DeductionModalState
        - purgeModal: PurgeModalState
        --
        + handleInventoryCreate(e: FormEvent): Promise<void>
        + handleTransactionSubmit(e: FormEvent, item: InventoryItem): void
        + executeTransactionApi(itemId: number, type: string, qty: number, reason: string): Promise<void>
        + handlePurgeItem(itemId: number): Promise<void>
        + renderActiveStockTable(): JSX.Element
        + renderTransactionLedger(): JSX.Element
    }

    class CollarTagGeneratorComponent <<React Utility>> #DBEAFE {
        - selectedPets: Pet[]
        - qrSize: number
        - tagLayout: string
        --
        + generateCollarMatrix(petList: Pet[]): void
        + exportToPrintablePDF(): void
        + renderTagCanvasPreview(): JSX.Element
    }
}

package "Backend REST API Layer (Django REST Framework)" #ECFDF5 {
    class InventoryAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsAuthenticatedOrReadOnly]
        --
        + get(request: Request): Response
        + post(request: Request): Response
    }

    class InventoryDetailAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsMDCStaffOrAdmin]
        --
        + put(request: Request, item_id: int): Response
        + delete(request: Request, item_id: int): Response
    }

    class InventoryTransactionAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsMDCStaffOrAdmin]
        --
        + get(request: Request): Response
        + post(request: Request): Response
    }

    class InventoryTransactionHandler <<Python Module / Service>> #FEF08A {
        + validate_transaction_payload(data: dict): dict
        + calculate_stock_balance(current_qty: int, delta: int, tx_type: str): int
        + execute_stock_movement(item_id: int, tx_type: str, qty_delta: int, reason: str, donor: str): dict
        + check_low_stock_threshold(item_id: int, new_qty: int): boolean
    }
}

package "Persistence Layer (Supabase PostgreSQL / Tables)" #FAF5FF {
    class InventoryItem <<Database Table / Schema>> #F3E8FF {
        + item_id: Serial [PK]
        + item_name: Varchar(150)
        + category: Varchar(50)
        + food_type: Varchar(50)
        + quantity: Integer
        + unit: Varchar(20)
        + min_threshold: Integer
        + supplier_donor: Varchar(150)
        + expiration_date: Date
        + created_at: TimestampTz
        + updated_at: TimestampTz
    }

    class InventoryTransaction <<Database Table / Schema>> #EDE9FE {
        + id: Serial [PK]
        + item_id: Integer [FK -> inventory.item_id]
        + transaction_type: Varchar(10)
        + quantity_changed: Integer
        + reason: Varchar(255)
        + supplier_donor: Varchar(150)
        + logged_by: Uuid [FK -> auth_user.id]
        + logged_at: TimestampTz
    }

    class PetCollarRecord <<Database Table / Schema>> #FCE7F3 {
        + id: Uuid [PK]
        + name: Varchar(100)
        + qr_code_id: Varchar(50) [UQ]
        + species: Varchar(50)
        + collar_tag_printed: Boolean
        + last_profile_scanned: TimestampTz
    }
}

InventoryControlComponent ..[#2563EB]> InventoryAPIView : "<color:#1D4ED8><b>HTTP GET /api/inventory/</b></color>"
InventoryControlComponent ..[#2563EB]> InventoryDetailAPIView : "<color:#1D4ED8><b>HTTP PUT/DELETE /api/inventory/{id}/</b></color>"
InventoryControlComponent ..[#2563EB]> InventoryTransactionAPIView : "<color:#1D4ED8><b>HTTP POST /api/inventory/transactions/</b></color>"
CollarTagGeneratorComponent ..[#2563EB]> PetCollarRecord : "Compiles printable QR matrices"

InventoryAPIView --[#059669]> InventoryItem : "Queries stock / Inserts new SKU"
InventoryDetailAPIView --[#059669]> InventoryItem : "Mutates attributes / Deletes SKU"
InventoryTransactionAPIView --[#D97706]> InventoryTransactionHandler : "Delegates stock mutation & ledger audit"

InventoryTransactionHandler --[#7C3AED]> InventoryItem : "Updates quantity balance"
InventoryTransactionHandler --[#7C3AED]> InventoryTransaction : "Appends immutable audit record"

InventoryItem "1" *--[#6366F1] "0..*" InventoryTransaction : "tracks transactions (item_id)"
@enduml"""

# ==========================================
# 2. COLORFUL SEQUENCE DIAGRAM (MODULE 2.2)
# ==========================================
sequence_puml = """@startuml
autonumber
skinparam backgroundColor #F8FAFC
skinparam shadowing false
skinparam roundcorner 10
skinparam sequenceMessageAlign center
skinparam defaultFontName "Segoe UI"

skinparam sequence {
    ArrowColor #2563EB
    ArrowThickness 1.5
    LifeLineBorderColor #3B82F6
    LifeLineBackgroundColor #EFF6FF
    ParticipantBorderThickness 1.5
    ActorBorderThickness 1.5
    GroupBorderColor #64748B
    GroupBackgroundColor #F1F5F9
    GroupHeaderFontColor #0F172A
    DividerBackgroundColor #E2E8F0
    DividerFontColor #0F172A
    DividerBorderColor #94A3B8
}

actor "MDC Logistics Officer" as Staff #BFDBFE
actor "Campus Community / Donor" as Donor #FED7AA

participant "Vite/React Frontend\\n(InventoryControl & Modals)" as Frontend #DBEAFE
participant "Django REST API\\n(Inventory Endpoints)" as API #D1FAE5
participant "Inventory Transaction\\nHandler" as Handler #FEF08A
participant "Supabase PostgreSQL\\n(inventory & transactions)" as DB #EDE9FE

== <color:#1E40AF><b>Phase 1: Inbound Stock Receipt & Donation Intake (Stock In)</b></color> ==
Donor -> Staff: Deliver 20 cans of cat food & feeding supplies
Staff -> Frontend: Open Staff Portal -> "Inventory Control" -> Click "Log Transaction"
activate Frontend #DBEAFE

Frontend --> Staff: Display modal (Select Item, Type: IN, Quantity, Donor Remarks)
Staff -> Frontend: Enter Quantity: 20, Supplier/Donor: "Alumni Batch 2024", Reason: "Donation"
Staff -> Frontend: Click "Confirm Stock Inflow"
Frontend -> API: <color:#1D4ED8><b>POST /api/inventory/transactions/</b></color>\\n{ item_id: 14, transaction_type: "IN", quantity_changed: 20, donor: "Alumni Batch 2024" }
activate API #D1FAE5

API -> Handler: <color:#B45309><b>execute_stock_movement(payload)</b></color>
activate Handler #FEF08A

Handler -> DB: SELECT quantity FROM inventory WHERE item_id = 14
activate DB #EDE9FE
DB --> Handler: Return current stock: 35 cans
deactivate DB

Handler -> Handler: Calculate new balance: 35 + 20 = 55 cans

group <color:#7C3AED><b>Supabase Atomic Update & Ledger Append</b></color>
    Handler -> DB: UPDATE inventory SET quantity = 55 WHERE item_id = 14
    activate DB #EDE9FE
    Handler -> DB: <color:#7C3AED><b>INSERT INTO inventory_transactions</b></color>\\n(item_id=14, type='IN', delta=20, donor='Alumni Batch 2024', logged_at=NOW())
    DB --> Handler: 201 Created (Transaction Ledger Record)
    deactivate DB
end

Handler --> API: StockMovementResult(item_id=14, new_quantity=55, status="Success")
deactivate Handler

API --> Frontend: <color:#16A34A><b>201 Created JSON (Updated stock & transaction entry)</b></color>
deactivate API

Frontend --> Staff: Display "Inflow recorded: +20 cans added!" toast & update active stock
deactivate Frontend

== <color:#C2410C><b>Phase 2: Outbound Dispensation & Low-Stock Deficit Alert (Stock Out)</b></color> ==
Staff -> Frontend: Select "Anti-Rabies Vaccine Vials" (Current: 8 vials, Min Threshold: 10)
activate Frontend #DBEAFE
Staff -> Frontend: Choose Type: OUT, Quantity: 4, Reason: "Campus Mass Vaccination"
Frontend --> Staff: Trigger Deduction Confirmation Modal (Review delta & remaining balance)
Staff -> Frontend: Click "Confirm Deduction"

Frontend -> API: <color:#1D4ED8><b>POST /api/inventory/transactions/</b></color>\\n{ item_id: 22, transaction_type: "OUT", quantity_changed: 4, reason: "Mass Vaccination" }
activate API #D1FAE5

API -> Handler: <color:#B45309><b>execute_stock_movement(item_id=22, OUT, 4)</b></color>
activate Handler #FEF08A

Handler -> DB: SELECT quantity, min_threshold FROM inventory WHERE item_id = 22
activate DB #EDE9FE
DB --> Handler: Return stock: 8, min_threshold: 10
deactivate DB

Handler -> Handler: Verify balance: 8 - 4 = 4 vials (> 0, valid dispensation)

group <color:#7C3AED><b>Supabase Atomic Update & Ledger Append</b></color>
    Handler -> DB: UPDATE inventory SET quantity = 4 WHERE item_id = 22
    activate DB #EDE9FE
    Handler -> DB: <color:#7C3AED><b>INSERT INTO inventory_transactions</b></color>\\n(item_id=22, type='OUT', delta=4, reason='Mass Vaccination', logged_at=NOW())
    DB --> Handler: 201 Created (Transaction Ledger Record)
    deactivate DB
end

Handler -> Handler: check_low_stock_threshold(4 <= 10) -> TRUE (Deficit Triggered)
Handler --> API: StockMovementResult(item_id=22, new_quantity=4, low_stock_warning=True)
deactivate Handler

API --> Frontend: <color:#16A34A><b>201 Created JSON with low_stock_warning: true</b></color>
deactivate API

Frontend --> Staff: Highlight item row in <color:#DC2626><b>RED BADGE: 'Low Stock Alert (4/10 vials remaining)'</b></color>
deactivate Frontend
@enduml"""

# ==========================================
# 3. COLORFUL ERD DATA DESIGN (MODULE 2.2)
# ==========================================
erd_puml = """@startuml
skinparam backgroundColor #F8FAFC
skinparam shadowing false
skinparam roundcorner 10
skinparam defaultFontName "Segoe UI"

skinparam entity {
    BorderColor #64748B
    BorderThickness 1.5
    FontSize 12
    FontStyle bold
    HeaderBackgroundColor #E2E8F0
}

entity "inventory" as inventory #F3E8FF {
    * item_id : serial <<PK>>
    --
    * item_name : varchar(150)
    * <color:#7C3AED>category : varchar(50)</color>
    food_type : varchar(50)
    * <color:#2563EB>quantity : integer</color>
    * unit : varchar(20)
    * <color:#DC2626>min_threshold : integer</color>
    supplier_donor : varchar(150)
    expiration_date : date
    created_at : timestamptz
    updated_at : timestamptz
}

entity "inventory_transactions" as transactions #FEF3C7 {
    * id : serial <<PK>>
    --
    * <color:#7C3AED>item_id : integer <<FK -> inventory.item_id>></color>
    * <color:#D97706>transaction_type : varchar(10)</color>
    * quantity_changed : integer
    * reason : varchar(255)
    supplier_donor : varchar(150)
    logged_by : uuid <<FK -> auth_user.id>>
    * <color:#2563EB>logged_at : timestamptz</color>
}

entity "auth_user" as users #DBEAFE {
    * id : uuid <<PK>>
    --
    * username : varchar(150) <<UQ>>
    * email : varchar(254)
    first_name : varchar(150)
    last_name : varchar(150)
    <color:#2563EB>is_staff : boolean</color>
    is_active : boolean
}

entity "pet_pet" as pets #D1FAE5 {
    * id : uuid <<PK>>
    --
    * name : varchar(100)
    * species : varchar(50)
    * <color:#059669>qr_code_id : varchar(50) <<UQ>></color>
    adoption_status : varchar(30)
    photo_url : varchar(500)
    created_at : timestamptz
}

entity "pet_medical_record" as medical #FCE7F3 {
    * id : uuid <<PK>>
    --
    * pet_id : uuid <<FK -> pet_pet.id>>
    inventory_item_id : integer <<FK -> inventory.item_id>>
    * record_type : varchar(50)
    description : text
    administered_date : date
    administered_by : uuid <<FK -> auth_user.id>>
    created_at : timestamptz
}

inventory ||--[#7C3AED]o{ transactions : "item_id\\n(audit ledger trail)"
users ||--[#2563EB]o{ transactions : "logged_by\\n(audit identity)"
inventory ||--[#DB2777]o{ medical : "inventory_item_id\\n(vaccine/med disbursement)"
pets ||--[#059669]o{ medical : "pet_id\\n(patient medical history)"
users ||--[#2563EB]o{ medical : "administered_by\\n(attending staff)"
@enduml"""

svg_class = render_kroki(class_puml, "docs/inventory_class_diagram_colorful.png", "docs/inventory_class_diagram_colorful.puml")
svg_seq = render_kroki(sequence_puml, "docs/inventory_sequence_diagram_colorful.png", "docs/inventory_sequence_diagram_colorful.puml")
svg_erd = render_kroki(erd_puml, "docs/inventory_erd_diagram_colorful.png", "docs/inventory_erd_diagram_colorful.puml")

print("All Module 2.2 diagrams rendered!")
print("SVG Class:", svg_class)
print("SVG Seq:", svg_seq)
print("SVG ERD:", svg_erd)
