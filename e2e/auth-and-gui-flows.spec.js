import { test, expect } from '@playwright/test';
import { pickDate } from './helpers/pickDate.js';
import {
  installApiMock,
  participantApproved,
  participantPending,
  adminUser
} from './helpers/apiMock.js';

test.describe('Rutas públicas', () => {
  test('la raíz muestra la vitrina pública sin sesión', async ({ page }) => {
    await installApiMock(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: 'El punto de encuentro para tu identidad judía', level: 1 })
    ).toBeVisible();
    // La vitrina no lleva el shell de la app: tiene su propia barra.
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
  });

  test('la vitrina lleva al registro y al login', async ({ page }) => {
    await installApiMock(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Entrá a tu casa' }).first().click();
    await expect(page).toHaveURL(/\/register$/);

    await page.goto('/');
    /* La barra aparece recién cuando dejás la portada: en la portada, la casa
       no te recibe con el cartel de "iniciar sesión" en la cara. */
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.getByRole('link', { name: 'Iniciar sesión' }).first().click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('las preguntas frecuentes contestan al tocarlas', async ({ page }) => {
    await installApiMock(page);
    await page.goto('/');
    const respuesta = page.getByText('Te registrás una sola vez y es gratis.', { exact: false });
    await expect(respuesta).toHaveCount(0);
    await page.getByRole('button', { name: '¿Tengo que registrarme?' }).click();
    /* La respuesta se escribe dos veces: pegada a la pregunta para el teléfono
       y en la columna de al lado para pantallas grandes. En escritorio la
       visible es la segunda. */
    await expect(respuesta.last()).toBeVisible();
  });

  test.describe('con prefers-reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' });

    /* El dibujo de la casa y las secciones entran con animaciones de CSS. Si
       el sistema pidió menos movimiento no se ejecutan, así que todo tiene que
       estar igual de legible — no una página en blanco. */
    test('el contenido se ve sin haber scrolleado', async ({ page }) => {
      await installApiMock(page);
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Esto es Malka' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Vení a conocer Malka' })).toBeVisible();
      /* La casa se sale de su columna a propósito; lo que no puede pasar es
         que la página entera se pueda arrastrar de costado. */
      const desborda = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(desborda).toBe(false);
    });
  });

  test('muestra el formulario de registro y enlace a login', async ({ page }) => {
    await installApiMock(page);
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Registro' })).toBeVisible();
    await page.getByRole('link', { name: 'Iniciá sesión aquí' }).click();
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
    await expect(page.getByRole('heading', { name: 'Cartelera' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Malka' })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Panel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Usuarios' })).toBeVisible();
  });
});

test.describe('Sesión restaurada', () => {
  test('con token, la vitrina saluda distinto y la app deja pasar', async ({ page }) => {
    await installApiMock(page, { meUser: participantApproved });
    await page.addInitScript(() => {
      localStorage.setItem('token', 'e2e-test-token');
    });

    /* La vitrina es pública para todo el mundo: quien ya entró la ve igual,
       pero con otro botón. Antes la raíz lo rebotaba a su panel y el saludo
       para gente con sesión no se veía nunca. */
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Ver la agenda' }).first()).toBeVisible();

    /* Y la sesión guardada sigue abriendo la app sin pasar por el login. */
    await page.goto('/login');
    await expect(page).toHaveURL(/\/activities$/);
  });
});

test.describe('Registro', () => {
  test('envía el formulario y llega al dashboard pendiente', async ({ page }) => {
    await installApiMock(page);
    await page.goto('/register');
    await page.locator('input[name="nombre"]').fill('Nuevo');
    await page.locator('input[name="apellido"]').fill('Usuario');
    await pickDate(page, 'Fecha de nacimiento', '1990-05-15');
    await page.locator('input[name="dni"]').fill('12345678');
    await page.locator('input[name="email"]').fill('nuevo@e2e.test');
    await page.locator('input[name="telefono"]').fill('+5411999999999');
    await page.locator('input[name="password"]').fill('secret12');
    await page.locator('input[name="comoSeEntero"]').fill('Un amigo');
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

test.describe('Próximos cumpleaños', () => {
  const entrarComoAdmin = async (page) => {
    await page.addInitScript(() => localStorage.setItem('token', 'e2e-test-token'));
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Próximos cumpleaños' })).toBeVisible();
  };

  test('destaca a quien cumple hoy y separa las dos semanas', async ({ page }) => {
    await installApiMock(page, {
      meUser: adminUser,
      birthdays: {
        hoy: [
          { _id: 'b1', nombre: 'Ana', apellido: 'Groisman', fecha: '2026-09-25', edad: 34, esHoy: true, diasFaltan: 0, semana: 'esta' }
        ],
        estaSemana: [
          { _id: 'b2', nombre: 'Bruno', apellido: 'Feldman', fecha: '2026-09-26', edad: 38, esHoy: false, diasFaltan: 1, semana: 'esta' }
        ],
        proximaSemana: [
          { _id: 'b3', nombre: 'Diego', apellido: 'Rosenthal', fecha: '2026-10-01', edad: 47, esHoy: false, diasFaltan: 6, semana: 'proxima' }
        ],
        total: 3,
        sinFecha: 1
      }
    });

    await entrarComoAdmin(page);

    await expect(page.getByText('Cumple 34 hoy')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Esta semana', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'La semana que viene' })).toBeVisible();
    await expect(page.getByText('mañana')).toBeVisible();
    await expect(page.getByText('en 6 días')).toBeVisible();
    await expect(page.getByText(/1 persona sin fecha de nacimiento cargada/)).toBeVisible();

    /* El nombre lleva a la ficha, que es donde está el teléfono para saludar. */
    await expect(page.getByRole('link', { name: 'Ana Groisman' })).toHaveAttribute(
      'href',
      '/admin/users/b1'
    );
  });

  test('avisa cuando no hay ninguno', async ({ page }) => {
    await installApiMock(page, { meUser: adminUser });
    await entrarComoAdmin(page);
    await expect(page.getByText('Nadie cumple años en estas dos semanas.')).toBeVisible();
  });
});
