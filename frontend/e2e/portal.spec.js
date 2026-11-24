import { test, expect } from '@playwright/test';

const API_GLOB = '**/api/**';

function attachMockApi(page, overrides = {}) {
  return page.route(API_GLOB, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (overrides[path]) {
      return overrides[path](route, method);
    }

    if (path.endsWith('/api/health/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', service: 'task-force-bruno-api' }),
      });
    }

    if (path.endsWith('/api/pets/PET-001/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pet_id: 'PET-001',
          name: 'Bruno',
          species: 'Dog',
          breed: 'Aspin',
          gender: 'Male',
          pet_type: 'Campus Pet',
          vaccination_status: 'Fully Vaccinated',
          spayed_neutered: true,
          is_quarantined: false,
          status: 'Active / Campus Resident',
          found_near: 'NGE Building (Nicolas G. Escario)',
          feeding_area: 'Main Gate Feeding Station',
          behavior_notes: 'Gentle campus dog.',
          description: 'Tan coat with floppy ears.',
        }),
      });
    }

    if (path.endsWith('/api/pets/PET-Q1/')) {
      const futureIso = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pet_id: 'PET-Q1',
          name: 'Muning',
          species: 'Cat',
          breed: 'Puspin',
          gender: 'Female',
          pet_type: 'Campus Pet',
          vaccination_status: 'Core Only (No Anti-Rabies)',
          spayed_neutered: false,
          is_quarantined: true,
          status: 'Quarantine / Rabies Observation',
          quarantine_expiry_date: futureIso,
          current_conditions: 'Under 14-day Rabies Observation',
          found_near: 'SAL Building (Don Simplicio A. Lizares)',
        }),
      });
    }

    if (path.endsWith('/api/pets/PET-CLEAR/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pet_id: 'PET-CLEAR',
          name: 'Tiger',
          species: 'Cat',
          breed: 'Puspin',
          gender: 'Male',
          pet_type: 'Campus Pet',
          vaccination_status: 'Fully Vaccinated',
          spayed_neutered: true,
          is_quarantined: false,
          status: 'Active / Campus Resident',
          current_conditions: 'Quarantine Observation Cleared (RA 9482)',
          found_near: 'RTL Building (Don Rodolfo T. Lizares)',
        }),
      });
    }

    if (path.endsWith('/api/pets/PET-404/')) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Animal record for "PET-404" was not found.' }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

test.describe('Task Force Bruno — Pre-Defense E2E Verification', () => {
  test('Login screen renders cleanly on desktop and rejects non-@cit.edu emails', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await attachMockApi(page);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Task Force Bruno' })).toBeVisible();

    await page.getByLabel('Institutional Email').fill('outsider@gmail.com');
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('alert')).toContainText('@cit.edu');
    expect(pageErrors).toEqual([]);
  });

  test('Unauthenticated Scan Tag modal looks up Public Pet Passport (PET-001)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await attachMockApi(page);

    await page.goto('/login');
    await page.getByRole('button', { name: /Scan Tag/i }).click();

    const scannerDialog = page.getByRole('dialog', { name: /Scan Collar QR Tag/i });
    await expect(scannerDialog).toBeVisible();

    await scannerDialog.getByPlaceholder(/Tag ID/i).fill('PET-001');
    await scannerDialog.getByRole('button', { name: /Lookup/i }).click();

    const passportDialog = page.getByRole('dialog', { name: /Official Campus Animal Passport/i });
    await expect(passportDialog).toBeVisible();
    await expect(passportDialog).toContainText('Bruno');
    await expect(passportDialog).toContainText('Fully Vaccinated - Rabies Valid');
    await expect(passportDialog).toContainText('TNR Sterilized');
    await expect(passportDialog).toContainText('(032) 261-7741');
    await expect(passportDialog).not.toContainText('14-Day Health Observation (RA 9482)');
    expect(pageErrors).toEqual([]);
  });

  test('RA 9482 Quarantine banner appears for active quarantine and stays hidden when cleared', async ({ page }) => {
    await attachMockApi(page);

    // 1. Active quarantine pet
    await page.goto('/passport/PET-Q1');
    const activeDialog = page.getByRole('dialog', { name: /Official Campus Animal Passport/i });
    await expect(activeDialog).toContainText('Muning');
    await expect(activeDialog).toContainText('14-Day Health Observation (RA 9482)');
    await expect(activeDialog).toContainText(/remaining/i);

    // 2. Expired / cleared quarantine pet (regression test for sticky 'Observation' keyword)
    await page.goto('/passport/PET-CLEAR');
    const clearedDialog = page.getByRole('dialog', { name: /Official Campus Animal Passport/i });
    await expect(clearedDialog).toContainText('Tiger');
    await expect(clearedDialog).not.toContainText('14-Day Health Observation (RA 9482)');
  });

  test('Missing QR tag shows clean 404 recovery UI without crashing', async ({ page }) => {
    await attachMockApi(page);

    await page.goto('/passport/PET-404');
    const dialog = page.getByRole('dialog', { name: /Official Campus Animal Passport/i });
    await expect(dialog).toContainText('Tag Not Found');
    await expect(dialog.getByRole('button', { name: /Retry/i })).toBeVisible();
  });

  test('Direct navigation to /mdc/dashboard while logged out is blocked with toast', async ({ page }) => {
    await attachMockApi(page);

    await page.goto('/mdc/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('status')).toContainText('Access Denied: MDC Personnel Only');
  });

  test('Mobile viewport (375x812) renders login & public passport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await attachMockApi(page);

    await page.goto('/passport/PET-001');
    await expect(page.getByRole('dialog', { name: /Official Campus Animal Passport/i })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('Authenticated student login redirects to Student Dashboard', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const mockSession = {
      access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdHUtMSJ9.sig',
      refresh_token: 'mock-refresh',
      email: 'juan.cruz@cit.edu',
      role: 'user',
      is_staff: false,
      first_name: 'Juan',
      last_name: 'Cruz',
      full_name: 'Juan Cruz',
      custom_id: '22-1234-567',
      student_id: '22-1234-567',
    };

    await attachMockApi(page, {
      '/api/login/': (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ session: mockSession }),
        }),
      '/api/session/': (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: mockSession }),
        }),
    });

    await page.goto('/login');
    await page.getByLabel('Institutional Email').fill('juan.cruz@cit.edu');
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/student\/dashboard$/);
    await expect(page.getByText(/Juan Cruz/i).first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
