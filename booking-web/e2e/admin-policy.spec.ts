import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('admin mengubah tier dan melihat simulasi', async ({ page, request }) => {
  await loginAs(page, request, 'admin');
  await page.goto('./admin/kebijakan-peminjaman');
  await expect(page.getByRole('heading', { name: 'Kebijakan Peminjaman' })).toBeVisible();
  await page.locator('#min_booking_days').fill('1');
  await page.getByLabel('Minimal hari tier 1').fill('7');
  await page.getByLabel('Offset tier 1').fill('6');

  await page.getByLabel('Tanggal pengajuan').fill('2026-12-01');
  await page.getByLabel('Tanggal peminjaman (H)').fill('2026-12-08');

  await expect(page.getByText(/minimal H-7/)).toBeVisible();
  await expect(page.getByText(/2 Desember 2026/)).toBeVisible();
});
