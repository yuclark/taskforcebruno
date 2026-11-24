import logging
import re
from datetime import date, datetime, timedelta, timezone

from .supabase_client import get_db_client
from .validators import normalize_date_str, parse_datetime_safe

logger = logging.getLogger(__name__)

MANILA_TZ = timezone(timedelta(hours=8))


def manila_now() -> datetime:
    """Return current timezone-aware datetime in Philippine Time (UTC+8)."""
    return datetime.now(MANILA_TZ)


def manila_today() -> date:
    """Return current calendar date in Philippine Time (UTC+8)."""
    return manila_now().date()

NON_VACCINE_KEYWORDS = (
    "deworm", "anthelmintic", "pyrantel", "praziquantel",
    "flea", "tick", "heartworm", "vitamin", "supplement", "probiotic",
)

SPAY_NEUTER_KEYWORDS = (
    "spay", "neuter", "steriliz", "castrat", "ovariohysterectomy", "tnr",
)

EMPTY_CONDITION_VALUES = frozenset({
    "", "none", "none.", "n/a", "na", "healthy", "normal", "no", "nil", "-",
    "no conditions", "none / healthy", "no medical conditions",
})

CANINE_ONLY_VACCINE_TERMS = (
    "canine", "dhpp", "da2pp", "parvo", "distemper",
    "kennel cough", "bordetella", "leptospirosis", "5-in-1", "8-in-1",
)

FELINE_ONLY_VACCINE_TERMS = (
    "feline", "fvrcp", "tricat", "felv", "fiv",
    "panleukopenia", "rhinotracheitis", "calicivirus", "3-in-1", "4-in-1",
)


def compute_active_quarantine(pet, med_logs):
    """
    Determine whether a pet is under an active RA 9482 14-day rabies observation
    quarantine (expiry date >= today). Expired historical incident records do not
    keep animals permanently quarantined.
    """
    today = manila_today()
    sorted_logs = sorted(
        med_logs or [],
        key=lambda m: str(m.get("log_date") or m.get("created_at") or ""),
        reverse=True,
    )

    latest_expiry_date = None
    latest_expiry_iso = None
    has_incident_log = False

    for m in sorted_logs:
        rtype = str(m.get("record_type") or "")
        if "Bite" in rtype or "Scratch" in rtype or m.get("is_quarantine"):
            has_incident_log = True
            followup_raw = m.get("quarantine_expiry_date") or m.get("next_followup_date")
            parsed_followup = parse_datetime_safe(followup_raw)
            if not parsed_followup:
                log_dt = parse_datetime_safe(m.get("log_date"))
                if log_dt:
                    parsed_followup = log_dt + timedelta(days=14)
            if parsed_followup:
                f_date = parsed_followup.date()
                if f_date >= today:
                    latest_expiry_date = f_date.strftime("%Y-%m-%d")
                    latest_expiry_iso = (
                        str(m.get("quarantine_expiry_date"))
                        if m.get("quarantine_expiry_date")
                        else f"{latest_expiry_date}T09:30:00Z"
                    )
                    break

    if latest_expiry_date:
        return True, latest_expiry_date, latest_expiry_iso

    conditions = str(pet.get("current_conditions") or "")
    conditions_lower = conditions.lower()
    if "cleared" in conditions_lower or "completed" in conditions_lower:
        return False, None, None

    until_match = re.search(r"until\s+(\d{4}-\d{2}-\d{2})", conditions, re.IGNORECASE)
    if until_match:
        cond_dt = parse_datetime_safe(until_match.group(1))
        if cond_dt and cond_dt.date() >= today:
            d_str = cond_dt.strftime("%Y-%m-%d")
            return True, d_str, f"{d_str}T09:30:00Z"
        return False, None, None

    if not has_incident_log and (
        pet.get("status") == "Quarantine / Rabies Observation"
        or "Observation" in conditions
    ):
        return True, None, None

    return False, None, None


def is_deworming_or_non_vaccine(vaccine_name) -> bool:
    name_l = str(vaccine_name or "").strip().lower()
    if not name_l:
        return True
    return any(kw in name_l for kw in NON_VACCINE_KEYWORDS)


def _is_vaccine_log_active(vac_log, today: date) -> bool:
    due_raw = vac_log.get("next_due_date") or vac_log.get("expiration_date")
    due_dt = parse_datetime_safe(due_raw)
    if due_dt:
        return due_dt.date() >= today
    admin_dt = parse_datetime_safe(vac_log.get("administered_date"))
    if admin_dt:
        return (admin_dt.date() + timedelta(days=365)) >= today
    return False


def compute_vaccination_status(vac_logs) -> str:
    """
    Compute vaccination status using rabies-first clinical priority:
    - 'Fully Vaccinated': at least one non-expired Anti-Rabies vaccine log.
    - 'Core Only (No Anti-Rabies)': at least one non-expired core vaccine (excluding dewormers).
    - 'Booster Overdue': prior vaccine logs exist, all expired.
    - 'Not Vaccinated': no qualifying vaccine logs recorded.
    """
    today = manila_today()
    real_vacs = [
        v for v in (vac_logs or [])
        if not is_deworming_or_non_vaccine(v.get("vaccine_name"))
    ]
    if not real_vacs:
        return "Not Vaccinated"

    rabies_logs = [v for v in real_vacs if "rabies" in str(v.get("vaccine_name") or "").lower()]
    core_logs = [v for v in real_vacs if "rabies" not in str(v.get("vaccine_name") or "").lower()]

    if any(_is_vaccine_log_active(v, today) for v in rabies_logs):
        return "Fully Vaccinated"
    if any(_is_vaccine_log_active(v, today) for v in core_logs):
        return "Core Only (No Anti-Rabies)"
    return "Booster Overdue"


def compute_spayed_neutered(med_logs) -> bool:
    for m in (med_logs or []):
        rtype = str(m.get("record_type") or "").lower()
        notes = str(m.get("notes") or "").lower()
        if any(kw in rtype for kw in SPAY_NEUTER_KEYWORDS):
            return True
        if "[spay / neuter" in notes or "[tnr sterilization" in notes:
            return True
        if any(kw in notes for kw in ("ovariohysterectomy", "castration", "spayed", "neutered")):
            return True
    return False


def is_meaningful_condition(cond_str) -> bool:
    cleaned = str(cond_str or "").strip().lower()
    return cleaned not in EMPTY_CONDITION_VALUES


def normalize_pet_classification(raw_pet_type, raw_adoption_status=None):
    pt = str(raw_pet_type or "").strip().lower()
    ast = str(raw_adoption_status or "").strip()
    ast_l = ast.lower()

    if "stray" in pt or (not pt and ast_l == "stray"):
        canonical_type = "Stray"
        if ast_l == "adopted":
            canonical_status = "Adopted"
        elif ast_l == "pending":
            canonical_status = "Pending"
        else:
            canonical_status = "Available"
    elif "adopt" in pt or "rescue" in pt or (not pt and ast_l in ("available", "pending", "adopted")):
        canonical_type = "Pet for Adoption"
        if ast_l == "adopted":
            canonical_status = "Adopted"
        elif ast_l == "pending":
            canonical_status = "Pending"
        else:
            canonical_status = "Available"
    else:
        canonical_type = "Campus Pet"
        canonical_status = "Adopted" if ast_l == "adopted" else "Campus Pet"

    return canonical_type, canonical_status


def generate_next_pet_id(canonical_pet_type, existing_pet_ids=None):
    pt_l = str(canonical_pet_type or "").strip().lower()
    if "stray" in pt_l:
        prefix = "STRAY"
    elif "adopt" in pt_l:
        prefix = "ADOPT"
    else:
        prefix = "PET"

    if existing_pet_ids is None:
        try:
            rows = get_db_client().table("pets").select("pet_id").execute().data or []
            existing_pet_ids = [r.get("pet_id") for r in rows if r.get("pet_id")]
        except Exception as exc:
            logger.warning("Could not query existing pet IDs: %s", exc)
            existing_pet_ids = []

    pattern = re.compile(rf"^{prefix}-(\d+)$", re.IGNORECASE)
    max_num = 0
    for pid in existing_pet_ids:
        match = pattern.match(str(pid).strip())
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num

    next_num = max_num + 1
    return f"{prefix}-{next_num:03d}", next_num


def safe_sync_pet_vaccination_status(pet_id: str, computed_status: str) -> None:
    candidates = [computed_status]
    if computed_status == "Core Only (No Anti-Rabies)":
        candidates.extend(["Partially Vaccinated", "Not Vaccinated"])
    elif computed_status == "Booster Overdue":
        candidates.extend(["Not Vaccinated"])

    db = get_db_client()
    for cand in candidates:
        try:
            db.table("pets").update({"vaccination_status": cand}).eq("pet_id", pet_id).execute()
            return
        except Exception as err:
            if "23514" not in str(err) and "check constraint" not in str(err).lower():
                logger.warning("Failed to sync vaccination_status for %s: %s", pet_id, err)
                return


def create_condition_medical_log(
    pet_id: str,
    condition_text: str,
    log_date_str=None,
    weight_str=None,
    tag: str = "INTAKE MEDICAL CONDITION",
) -> None:
    if not is_meaningful_condition(condition_text):
        return
    try:
        log_dt = normalize_date_str(log_date_str) or manila_today().strftime("%Y-%m-%d")
        payload = {
            "pet_id": pet_id,
            "record_type": "Check-up",
            "log_date": log_dt,
            "notes": f"[{tag}] {str(condition_text).strip()}",
            "medication_prescribed": "Initial Assessment / Pending Clinician Review",
            "weight_at_log": str(weight_str).strip() if weight_str else "N/A",
            "veterinarian": "MDC Intake Triage",
        }
        get_db_client().table("medical_records").insert(payload).execute()
    except Exception as err:
        logger.warning("Failed to auto-log medical condition for %s: %s", pet_id, err)


def validate_species_vaccine_compatibility(pet_species: str, vaccine_name: str) -> str | None:
    species_l = (pet_species or "").strip().lower()
    vac_l = (vaccine_name or "").strip().lower()
    if species_l == "cat" and any(term in vac_l for term in CANINE_ONLY_VACCINE_TERMS):
        return f'"{vaccine_name}" is a canine vaccine and cannot be logged for a Cat patient.'
    if species_l == "dog" and any(term in vac_l for term in FELINE_ONLY_VACCINE_TERMS):
        return f'"{vaccine_name}" is a feline vaccine and cannot be logged for a Dog patient.'
    return None
