import { test, expect } from '@playwright/test';
import {
  installApiMock,
  participantApproved,
  participantPending,
  adminUser
} from './helpers/apiMock.js';

test.describe('Rutas públicas', () => {
  test('redirige la raíz al login sin sesión', async ({ page }) => {
    await installApiMock(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Iniciar Sesión' })).toBeVisible();
  });

  test('muestra el formulario de registro y enlace a login', async ({ page }) => {
    await installApiMock(page);
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Registro' })).toBeVisible();
    await page.getByRole('link', { name: 'Inicia sesión aquí' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Login', () => {
  test('muestra error con credenciales inválidas', async ({ page }) => {
    await installApiMock(page, { rejectLogin: true });
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('x@test.local');
    await page.locator('input[type="password"]').fill('wrongpass');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page.getByText('Credenciales inválidas')).toBeVisible();
  });

  test('participante aprobado llega a la cartelera', async ({ page }) => {
    await installApiMock(page, { loginUser: participantApproved });
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(participantApproved.email);
    await page.locator('input[type="password"]').fill('any-password');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/activities$/);
    await expect(page.getByRole('heading', { name: 'Cartelera de Actividades' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Centro Cultural' })).toBeVisible();
  });

  test('participante pendiente ve el mensaje de validación en el dashboard', async ({ page }) => {
    await installApiMock(page, { loginUser: participantPending });
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(participantPending.email);
    await page.locator('input[type="password"]').fill('any-password');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Tu usuario está siendo validado' })).toBeVisible();
  });

  test('admin llega al panel y ve el título', async ({ page }) => {
    await installApiMock(page, { loginUser: adminUser });
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(adminUser.email);
    await page.locator('input[type="password"]').fill('any-password');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Panel de Administración' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Usuarios' })).toBeVisible();
  });
});

test.describe('Sesión restaurada', () => {
  test('navegación inicial con token abreviado hacia actividades (aprobado)', async ({ page }) => {
    await installApiMock(page, { meUser: participantApproved });
    await page.addInitScript(() => {
      localStorage.setItem('token', 'e2e-test-token');
    });
    await page.goto('/');
    await expect(page).toHaveURL(/\/activities$/);
  });
});

test.describe('Registro', () => {
  test('envía el formulario y llega al dashboard pendiente', async ({ page }) => {
    await installApiMock(page);
    await page.goto('/register');
    await page.locator('input[name="nombre"]').fill('Nuevo');
    await page.locator('input[name="apellido"]').fill('Usuario');
    await page.locator('input[name="dni"]').fill('12345678');
    await page.locator('input[name="email"]').fill('nuevo@e2e.test');
    await page.locator('input[name="telefono"]').fill('+5411999999999');
    await page.locator('input[name="password"]').fill('secret12');
    await page.getByRole('button', { name: 'Registrarse' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Tu usuario está siendo validado' })).toBeVisible();
  });
});

test.describe('Navegación autenticada (participante)', () => {
  test('accede a Mis intereses desde el nav', async ({ page }) => {
    await installApiMock(page, { loginUser: participantApproved });
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(participantApproved.email);
    await page.locator('input[type="password"]').fill('any-password');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/activities$/);
    await page.getByRole('button', { name: 'Mis intereses' }).click();
    await expect(page).toHaveURL(/\/my-interests$/);
    await expect(page.getByRole('heading', { name: /Mis intereses/i })).toBeVisible();
  });
});
