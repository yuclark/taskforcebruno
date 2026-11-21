import time
from datetime import date, timedelta
from unittest.mock import MagicMock, patch

import jwt
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from wsapi.authentication import clear_token_cache, resolve_is_staff
from wsapi.clinical import (
    compute_active_quarantine,
    compute_spayed_neutered,
    compute_vaccination_status,
    generate_next_pet_id,
    normalize_pet_classification,
    validate_species_vaccine_compatibility,
)
from wsapi.validators import validate_http_url, validate_image_upload

TEST_JWT_SECRET = "test-super-secret-jwt-signing-key-with-at-least-32-chars"


def make_jwt(sub="user-1", email="student@cit.edu", role="user", exp_offset=3600, secret=TEST_JWT_SECRET):
    payload = {
        "sub": sub,
        "email": email,
        "role": "authenticated",
        "user_metadata": {"role": role, "first_name": "Juan", "last_name": "Cruz", "custom_id": "22-1234-567"},
        "exp": int(time.time()) + exp_offset,
    }
    return jwt.encode(payload, secret, algorithm="HS256")


class FakeQuery:
    def __init__(self, data=None):
        self._data = data if data is not None else []
        self.filters = []
        self.operation = None
        self.payload = None

    def select(self, *args, **kwargs):
        self.operation = "select"
        return self

    def insert(self, payload):
        self.operation = "insert"
        self.payload = payload
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def upsert(self, payload):
        self.operation = "upsert"
        self.payload = payload
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, col, val):
        self.filters.append(("eq", col, val))
        return self

    def neq(self, col, val):
        self.filters.append(("neq", col, val))
        return self

    def ilike(self, col, val):
        self.filters.append(("ilike", col, val))
        return self

    def order(self, *args, **kwargs):
        return self

    def execute(self):
        res = MagicMock()
        if self.operation in ("insert", "upsert") and self.payload is not None:
            row = dict(self.payload) if isinstance(self.payload, dict) else self.payload
            if isinstance(row, dict):
                row.setdefault("application_id", 101)
                row.setdefault("sighting_id", 202)
                row.setdefault("record_id", 303)
                row.setdefault("transaction_id", 404)
                row.setdefault("announcement_id", 505)
                row.setdefault("item_id", 606)
                row.setdefault("comment_id", 707)
            res.data = [row]
            return res
        if self.operation == "update" and self.payload is not None:
            if not self._data:
                res.data = []
                return res
            updated = dict(self._data[0])
            updated.update(self.payload)
            res.data = [updated]
            return res
        if self.operation == "delete":
            res.data = list(self._data)
            return res

        rows = list(self._data)
        for op, col, val in self.filters:
            if op == "eq":
                rows = [r for r in rows if str(r.get(col, "")).lower() == str(val).lower()]
            elif op == "neq":
                rows = [r for r in rows if str(r.get(col, "")).lower() != str(val).lower()]
            elif op == "ilike":
                pattern = str(val).strip("%").lower()
                rows = [r for r in rows if str(r.get(col, "")).lower() == pattern]
        res.data = rows
        return res


class FakeDB:
    def __init__(self, tables=None):
        self.tables = tables or {}
        self.calls = []

    def table(self, name):
        q = FakeQuery(self.tables.get(name, []))
        self.calls.append((name, q))
        return q


class ValidatorTests(TestCase):
    def test_valid_png_upload(self):
        png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
        f = SimpleUploadedFile("cat.png", png_bytes, content_type="image/png")
        data, ext, mime = validate_image_upload(f)
        self.assertEqual(ext, "png")
        self.assertEqual(mime, "image/png")
        self.assertEqual(data, png_bytes)

    def test_rejects_spoofed_html_disguised_as_png(self):
        fake = SimpleUploadedFile("xss.png", b"<html><script>alert(1)</script></html>", content_type="image/png")
        with self.assertRaises(ValueError):
            validate_image_upload(fake)

    def test_rejects_svg_and_oversized_upload(self):
        svg = SimpleUploadedFile("icon.svg", b"<svg onload=alert(1)></svg>", content_type="image/svg+xml")
        with self.assertRaises(ValueError):
            validate_image_upload(svg)

        big = SimpleUploadedFile("huge.jpg", b"\xff\xd8\xff\xe0" + b"0" * (5 * 1024 * 1024 + 10), content_type="image/jpeg")
        with self.assertRaises(ValueError):
            validate_image_upload(big)

    def test_url_validator_blocks_javascript_scheme(self):
        with self.assertRaises(ValueError):
            validate_http_url("javascript:alert(1)")
        with self.assertRaises(ValueError):
            validate_http_url("data:text/html,<script>alert(1)</script>")
        self.assertEqual(validate_http_url("https://example.com/cat.jpg"), "https://example.com/cat.jpg")


class ClinicalLogicTests(TestCase):
    def test_quarantine_active_and_expired(self):
        today = date.today()
        active_log = [{"record_type": "Bite Incident", "log_date": (today - timedelta(days=2)).isoformat()}]
        is_q, until, _ = compute_active_quarantine({}, active_log)
        self.assertTrue(is_q)
        self.assertEqual(until, (today + timedelta(days=12)).isoformat())

        expired_log = [{"record_type": "Bite Incident", "log_date": (today - timedelta(days=20)).isoformat()}]
        is_q_exp, until_exp, _ = compute_active_quarantine({"status": "Quarantine / Rabies Observation"}, expired_log)
        self.assertFalse(is_q_exp)
        self.assertIsNone(until_exp)

    def test_vaccination_status_rabies_first_and_excludes_deworming(self):
        future = (date.today() + timedelta(days=180)).isoformat()
        past = (date.today() - timedelta(days=30)).isoformat()

        self.assertEqual(compute_vaccination_status([]), "Not Vaccinated")
        self.assertEqual(
            compute_vaccination_status([{"vaccine_name": "Broad-Spectrum Dewormer", "next_due_date": future}]),
            "Not Vaccinated",
        )
        self.assertEqual(
            compute_vaccination_status([{"vaccine_name": "FVRCP 3-in-1", "next_due_date": future}]),
            "Core Only (No Anti-Rabies)",
        )
        self.assertEqual(
            compute_vaccination_status([{"vaccine_name": "Anti-Rabies Inactivated", "next_due_date": future}]),
            "Fully Vaccinated",
        )
        self.assertEqual(
            compute_vaccination_status([{"vaccine_name": "Anti-Rabies Inactivated", "next_due_date": past}]),
            "Booster Overdue",
        )

    def test_species_vaccine_guard(self):
        self.assertIsNotNone(validate_species_vaccine_compatibility("Cat", "DHPP 5-in-1 Canine"))
        self.assertIsNotNone(validate_species_vaccine_compatibility("Dog", "FVRCP 3-in-1 Feline"))
        self.assertIsNone(validate_species_vaccine_compatibility("Cat", "Anti-Rabies Inactivated"))
        self.assertIsNone(validate_species_vaccine_compatibility("Dog", "DHPP 5-in-1 Canine"))

    def test_spay_neuter_and_pet_id_generation(self):
        self.assertFalse(compute_spayed_neutered([{"record_type": "Check-up", "notes": "Healthy"}]))
        self.assertTrue(compute_spayed_neutered([{"record_type": "Spay / Neuter", "notes": "TNR"}]))

        next_id, seq = generate_next_pet_id("Stray", ["STRAY-001", "STRAY-009", "PET-020"])
        self.assertEqual(next_id, "STRAY-010")
        self.assertEqual(seq, 10)
        self.assertEqual(normalize_pet_classification("Stray"), ("Stray", "Available"))
        self.assertEqual(normalize_pet_classification("Campus Pet"), ("Campus Pet", "Campus Pet"))

    def test_substring_staff_in_email_does_not_escalate_student(self):
        self.assertFalse(resolve_is_staff("user", "stafford.mdc@cit.edu"))
        self.assertFalse(resolve_is_staff("student", "mdc.student@cit.edu"))
        self.assertTrue(resolve_is_staff("staff", "nurse@cit.edu"))


@override_settings(SUPABASE_JWT_SECRET=TEST_JWT_SECRET)
class SecurityAndAPITests(TestCase):
    def setUp(self):
        clear_token_cache()
        self.client = APIClient()
        self.student_token = make_jwt(sub="stu-1", email="juan.cruz@cit.edu", role="user")
        self.staff_token = make_jwt(sub="stf-1", email="mdc.nurse@cit.edu", role="staff")

    def tearDown(self):
        clear_token_cache()

    def _auth(self, token):
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_health_check_is_public(self):
        res = self.client.get("/api/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "ok")

    def test_forged_jwt_signature_rejected(self):
        forged = make_jwt(sub="hacker", email="admin@cit.edu", role="admin", secret="wrong-secret-key-not-valid-123456")
        res = self.client.post("/api/medical/log/", {"pet_id": "PET-001", "notes": "hack"}, format="json", **self._auth(forged))
        self.assertEqual(res.status_code, 401)

    def test_expired_jwt_rejected(self):
        expired = make_jwt(sub="stf-1", email="mdc.nurse@cit.edu", role="staff", exp_offset=-60)
        res = self.client.get("/api/session/", **self._auth(expired))
        self.assertEqual(res.status_code, 401)

    def test_rbac_blocks_unauthenticated_and_student_on_admin_endpoints(self):
        fake_db = FakeDB(tables={"profiles": [{"id": "stu-1", "email": "juan.cruz@cit.edu", "role": "user"}]})
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db):
            # Unauthenticated -> 401
            self.assertEqual(self.client.post("/api/medical/log/", {"pet_id": "PET-001"}, format="json").status_code, 401)
            self.assertEqual(self.client.post("/api/pets/", {"name": "Ghost"}, format="json").status_code, 401)
            self.assertEqual(self.client.delete("/api/pets/PET-001/").status_code, 401)
            self.assertEqual(self.client.post("/api/inventory/", {"item_name": "Food"}, format="json").status_code, 401)
            self.assertEqual(self.client.post("/api/announcements/", {"title": "Hi", "content": "Test"}, format="json").status_code, 401)
            self.assertEqual(self.client.get("/api/pets/applications/").status_code, 401)

            # Authenticated student -> 403 on all staff endpoints
            res_med = self.client.post("/api/medical/log/", {"pet_id": "PET-001", "notes": "test"}, format="json", **self._auth(self.student_token))
            self.assertEqual(res_med.status_code, 403)
            self.assertEqual(res_med.data["detail"], "You do not have permission to perform this action.")

            self.assertEqual(
                self.client.post("/api/pets/", {"name": "Ghost"}, format="json", **self._auth(self.student_token)).status_code,
                403,
            )
            self.assertEqual(
                self.client.delete("/api/pets/PET-001/", **self._auth(self.student_token)).status_code,
                403,
            )
            self.assertEqual(
                self.client.post("/api/inventory/", {"item_name": "Food", "quantity": 5, "unit": "kg"}, format="json", **self._auth(self.student_token)).status_code,
                403,
            )
            self.assertEqual(
                self.client.put("/api/sightings/1/", {"status": "Resolved"}, format="json", **self._auth(self.student_token)).status_code,
                403,
            )
            self.assertEqual(
                self.client.delete("/api/newsfeed/action/?feed_id=announcement_1", **self._auth(self.student_token)).status_code,
                403,
            )

    def test_student_cannot_view_other_students_adoption_applications(self):
        fake_db = FakeDB(tables={
            "profiles": [{"id": "stu-1", "email": "juan.cruz@cit.edu", "role": "user"}],
            "adoption_applications": [
                {"application_id": 1, "email": "juan.cruz@cit.edu", "pet_id": "ADOPT-001", "application_status": "Pending"},
                {"application_id": 2, "email": "other.student@cit.edu", "pet_id": "ADOPT-002", "application_status": "Pending"},
            ],
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db):
            # Even when requesting ?email=other.student@cit.edu, student only gets their own rows
            res = self.client.get("/api/pets/applications/?email=other.student@cit.edu", **self._auth(self.student_token))
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.data), 1)
            self.assertEqual(res.data[0]["email"], "juan.cruz@cit.edu")

    def test_student_cannot_approve_application_or_cancel_others(self):
        fake_db = FakeDB(tables={
            "profiles": [{"id": "stu-1", "email": "juan.cruz@cit.edu", "role": "user"}],
            "adoption_applications": [
                {"application_id": 1, "email": "juan.cruz@cit.edu", "pet_id": "ADOPT-001", "application_status": "Pending"},
                {"application_id": 2, "email": "other.student@cit.edu", "pet_id": "ADOPT-002", "application_status": "Pending"},
            ],
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db):
            # Student trying to approve own application -> 403
            res_approve = self.client.put(
                "/api/pets/applications/1/",
                {"application_status": "Approved"},
                format="json",
                **self._auth(self.student_token),
            )
            self.assertEqual(res_approve.status_code, 403)

            # Student trying to cancel another student's application -> 403
            res_other = self.client.put(
                "/api/pets/applications/2/",
                {"application_status": "Cancelled"},
                format="json",
                **self._auth(self.student_token),
            )
            self.assertEqual(res_other.status_code, 403)

            # Student cancelling their own pending application -> 200
            res_own = self.client.put(
                "/api/pets/applications/1/",
                {"application_status": "Cancelled"},
                format="json",
                **self._auth(self.student_token),
            )
            self.assertEqual(res_own.status_code, 200)

    def test_inventory_unit_enum_and_negative_stock_boundary(self):
        fake_db = FakeDB(tables={
            "profiles": [{"id": "stf-1", "email": "mdc.nurse@cit.edu", "role": "staff"}],
            "inventory": [{"item_id": 10, "item_name": "Rabisin Vaccine Vials", "quantity": 4, "unit": "vials"}],
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db):
            # Invalid unit rejected
            res_unit = self.client.post(
                "/api/inventory/",
                {"item_name": "Dog Food", "category": "Food", "quantity": 10, "unit": "box of sacks"},
                format="json",
                **self._auth(self.staff_token),
            )
            self.assertEqual(res_unit.status_code, 400)
            self.assertIn("unit", res_unit.data)

            # Disbursement exceeding balance rejected without mutation
            res_over = self.client.post(
                "/api/inventory/transactions/",
                {"item_id": 10, "transaction_type": "OUT", "quantity_changed": 5, "reason": "Clinic use"},
                format="json",
                **self._auth(self.staff_token),
            )
            self.assertEqual(res_over.status_code, 400)
            self.assertIn("exceeds available balance (4 on-hand)", res_over.data["error"])

    def test_public_pet_passport_returns_real_404_when_missing(self):
        fake_db = FakeDB(tables={"pets": []})
        with patch("wsapi.views.get_db_client", return_value=fake_db):
            res = self.client.get("/api/pets/PET-001/")
            self.assertEqual(res.status_code, 404)

    def test_registration_rejects_non_cit_email_and_weak_password(self):
        res_domain = self.client.post(
            "/api/register/",
            {"id": "22-1234-567", "first_name": "Juan", "last_name": "Cruz", "email": "juan@gmail.com", "password": "Password1"},
            format="json",
        )
        self.assertEqual(res_domain.status_code, 400)

        res_pw = self.client.post(
            "/api/register/",
            {"id": "22-1234-567", "first_name": "Juan", "last_name": "Cruz", "email": "juan@cit.edu", "password": "short"},
            format="json",
        )
        self.assertEqual(res_pw.status_code, 400)

    def test_ai_search_handles_synonyms_and_negation(self):
        fake_db = FakeDB(tables={
            "profiles": [{"id": "stu-1", "email": "juan.cruz@cit.edu", "role": "user"}],
            "pets": [
                {"pet_id": "PET-001", "name": "Bruno", "species": "Dog", "breed": "Aspin", "description": "brown coat floppy ears", "found_near": "CIT-U Canteen"},
                {"pet_id": "PET-002", "name": "Mimi", "species": "Cat", "breed": "Puspin", "description": "calico white paws", "found_near": "CIT-U Canteen"},
            ],
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db):
            res = self.client.post(
                "/api/pets/ai-search/",
                {"description": "calico kitten near canteen not a dog"},
                format="json",
                **self._auth(self.student_token),
            )
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.data), 1)
            self.assertEqual(res.data[0]["pet_id"], "PET-002")

    def test_session_endpoint_returns_authoritative_role_and_logout_succeeds(self):
        fake_db = FakeDB(tables={
            "profiles": [
                {"id": "stu-1", "email": "juan.cruz@cit.edu", "role": "user", "first_name": "Juan", "last_name": "Cruz"},
                {"id": "stf-1", "email": "mdc.nurse@cit.edu", "role": "staff", "first_name": "Maria", "last_name": "Santos"},
            ]
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db):
            res_stu = self.client.get("/api/session/", **self._auth(self.student_token))
            self.assertEqual(res_stu.status_code, 200)
            self.assertFalse(res_stu.data["user"]["is_staff"])

            res_stf = self.client.get("/api/session/", **self._auth(self.staff_token))
            self.assertEqual(res_stf.status_code, 200)
            self.assertTrue(res_stf.data["user"]["is_staff"])

            res_out = self.client.post("/api/logout/", **self._auth(self.staff_token))
            self.assertEqual(res_out.status_code, 200)

    def test_medical_bite_incident_and_tnr_update_pet_status(self):
        fake_db = FakeDB(tables={
            "profiles": [{"id": "stf-1", "email": "mdc.nurse@cit.edu", "role": "staff"}],
            "pets": [{"pet_id": "PET-001", "name": "Bruno", "species": "Dog"}],
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db):
            res_bite = self.client.post(
                "/api/medical/PET-001/",
                {"record_type": "Bite Incident", "notes": "Minor scratch near canteen", "log_date": "2026-10-01"},
                format="json",
                **self._auth(self.staff_token),
            )
            self.assertEqual(res_bite.status_code, 201)
            self.assertEqual(res_bite.data["next_followup_date"], "2026-10-15")
            pet_updates = [q.payload for name, q in fake_db.calls if name == "pets" and q.operation == "update"]
            self.assertTrue(any(u.get("status") == "Quarantine / Rabies Observation" for u in pet_updates))

            res_tnr = self.client.post(
                "/api/medical/PET-001/",
                {"record_type": "Spay / Neuter", "notes": "Neuter completed", "log_date": "2026-10-20"},
                format="json",
                **self._auth(self.staff_token),
            )
            self.assertEqual(res_tnr.status_code, 201)
            pet_updates = [q.payload for name, q in fake_db.calls if name == "pets" and q.operation == "update"]
            self.assertTrue(any(u.get("spayed_neutered") is True for u in pet_updates))

    def test_vaccination_endpoint_enforces_species_compatibility(self):
        fake_db = FakeDB(tables={
            "profiles": [{"id": "stf-1", "email": "mdc.nurse@cit.edu", "role": "staff"}],
            "pets": [{"pet_id": "PET-002", "name": "Mimi", "species": "Cat"}],
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db), patch("wsapi.clinical.get_db_client", return_value=fake_db):
            res_bad = self.client.post(
                "/api/vaccinations/PET-002/",
                {"vaccine_name": "DHPP 5-in-1 Canine", "administered_date": "2026-10-01"},
                format="json",
                **self._auth(self.staff_token),
            )
            self.assertEqual(res_bad.status_code, 400)

            res_ok = self.client.post(
                "/api/vaccinations/PET-002/",
                {"vaccine_name": "Anti-Rabies Inactivated", "administered_date": "2026-10-01", "next_due_date": "2027-10-01"},
                format="json",
                **self._auth(self.staff_token),
            )
            self.assertEqual(res_ok.status_code, 201)

    def test_newsfeed_comment_ownership_and_staff_moderation(self):
        fake_db = FakeDB(tables={
            "profiles": [
                {"id": "stu-1", "email": "juan.cruz@cit.edu", "role": "user"},
                {"id": "stf-1", "email": "mdc.nurse@cit.edu", "role": "staff"},
            ],
            "feed_comments": [
                {"comment_id": 55, "feed_id": "announcement_1", "user_email": "other.student@cit.edu", "comment_text": "Original"},
            ],
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db):
            # Student cannot spoof user_email when creating comment
            res_add = self.client.post(
                "/api/newsfeed/comment/",
                {"feed_id": "announcement_1", "user_email": "spoofed@cit.edu", "comment_text": "Hello"},
                format="json",
                **self._auth(self.student_token),
            )
            self.assertEqual(res_add.status_code, 201)
            self.assertEqual(res_add.data["user_email"], "juan.cruz@cit.edu")

            # Student cannot edit or delete another user's comment
            res_edit = self.client.put(
                "/api/newsfeed/comment/action/",
                {"comment_id": 55, "comment_text": "Tampered"},
                format="json",
                **self._auth(self.student_token),
            )
            self.assertEqual(res_edit.status_code, 403)

            res_del = self.client.delete(
                "/api/newsfeed/comment/action/?comment_id=55",
                **self._auth(self.student_token),
            )
            self.assertEqual(res_del.status_code, 403)

            # Staff can moderate and delete another user's comment
            res_mod = self.client.delete(
                "/api/newsfeed/comment/action/?comment_id=55",
                **self._auth(self.staff_token),
            )
            self.assertEqual(res_mod.status_code, 200)

    def test_sightings_bind_jwt_identity_scope_pii_and_block_spoofed_images(self):
        fake_db = FakeDB(tables={
            "profiles": [{"id": "stu-1", "email": "juan.cruz@cit.edu", "role": "user"}],
            "animal_sightings": [
                {"sighting_id": 1, "reporter_email": "juan.cruz@cit.edu", "animal_type": "Cat", "status": "Pending"},
                {"sighting_id": 2, "reporter_email": "private.user@cit.edu", "animal_type": "Dog", "status": "Pending"},
            ],
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db):
            # Student GET sightings only returns their own reports
            res_list = self.client.get("/api/sightings/", **self._auth(self.student_token))
            self.assertEqual(res_list.status_code, 200)
            self.assertEqual(len(res_list.data), 1)
            self.assertEqual(res_list.data[0]["reporter_email"], "juan.cruz@cit.edu")

            # Student POST sighting ignores spoofed reporter_email
            res_post = self.client.post(
                "/api/sightings/",
                {
                    "reporter_email": "victim@cit.edu",
                    "animal_type": "Cat",
                    "campus_zone": "CIT-U Main Building & Quadrangle",
                    "location_details": "Near entrance",
                    "distinct_features": "Orange tabby with collar",
                    "is_emergency": "true",
                },
                format="multipart",
                **self._auth(self.student_token),
            )
            self.assertEqual(res_post.status_code, 201)
            self.assertEqual(res_post.data["reporter_email"], "juan.cruz@cit.edu")
            self.assertTrue(res_post.data["distinct_features"].startswith("[URGENT EMERGENCY]"))

            # Disguised HTML upload rejected by magic-byte check
            fake_img = SimpleUploadedFile("evil.jpg", b"<html><script>alert(1)</script></html>", content_type="image/jpeg")
            res_bad_img = self.client.post(
                "/api/sightings/",
                {
                    "animal_type": "Dog",
                    "location_details": "Gate 1",
                    "distinct_features": "Limping brown dog",
                    "image": fake_img,
                },
                format="multipart",
                **self._auth(self.student_token),
            )
            self.assertEqual(res_bad_img.status_code, 400)

    def test_pet_update_blocks_mass_assignment_and_unsafe_urls(self):
        fake_db = FakeDB(tables={
            "profiles": [{"id": "stf-1", "email": "mdc.nurse@cit.edu", "role": "staff"}],
            "pets": [{"pet_id": "PET-001", "name": "Bruno", "species": "Dog", "pet_type": "Campus Pet", "adoption_status": "Campus Pet"}],
        })
        with patch("wsapi.authentication.get_db_client", return_value=fake_db), patch("wsapi.views.get_db_client", return_value=fake_db):
            # Rejects javascript: primary_image URL
            res_xss = self.client.put(
                "/api/pets/PET-001/",
                {"primary_image": "javascript:alert(1)"},
                format="json",
                **self._auth(self.staff_token),
            )
            self.assertEqual(res_xss.status_code, 400)

            # Read-only derived fields (vaccination_status, spayed_neutered) cannot be mass-assigned directly
            res_ro = self.client.put(
                "/api/pets/PET-001/",
                {"vaccination_status": "Fully Vaccinated", "spayed_neutered": True},
                format="json",
                **self._auth(self.staff_token),
            )
            self.assertEqual(res_ro.status_code, 400)
