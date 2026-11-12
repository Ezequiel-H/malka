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
      page.getByRole('heading', { name: 'Una casa para compartir nuestra espiritualidad judía', level: 1 })
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
    const respuesta = page.getByText('Algunas son gratuitas', { exact: false });
    await expect(respuesta).toHaveCount(0);
    await page.getByRole('button', { name: '¿Las actividades tienen costo?' }).click();
    /* La respuesta se escribe dos veces: pegada a la pregunta para el teléfono
       y en la columna de al lado para pantallas grandes. En escritorio la
       visible es la segunda. */
    await expect(respuesta.last()).toBeVisible();
  });

  test('la vitrina se lee en inglés y en hebreo, con el hebreo espejado', async ({ page }) => {
    await installApiMock(page);
    await page.goto('/en');
    await expect(
      page.getByRole('heading', { name: 'A house to share our Jewish spirituality', level: 1 })
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // En la portada la barra está escondida: el selector visible es el de la portada.
    /* Cambiar de idioma no vuelve a montar la página: el cambio se funde. */
    await page.evaluate(() => {
      document.querySelector('main').dataset.marca = 'misma';
    });
    await page.locator('main').getByRole('link', { name: 'עב' }).click();
    await expect(page).toHaveURL(/\/he$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.locator('main')).toHaveAttribute('data-marca', 'misma');
    await expect(page.locator('[dir="rtl"]').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('בית לחלוק בו את הרוחניות היהודית שלנו.');
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
  test('con sesión, la vitrina no se muestra y te lleva a la app', async ({ page }) => {
    await installApiMock(page, { meUser: participantApproved });
    await page.addInitScript(() => {
      localStorage.setItem('token', 'e2e-test-token');
    });

    /* La vitrina es para quien todavía no tiene cuenta: con sesión, la raíz
       (en cualquier idioma) va directo a anotarse a las actividades. */
    await page.goto('/');
    await expect(page).toHaveURL(/\/activities$/);
    await page.goto('/he');
    await expect(page).toHaveURL(/\/activities$/);

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
          { _id: 'b1', nombre: 'Ana', apellido: 'Groisman', telefono: '+5491133334444', fecha: '2026-09-25', edad: 34, esHoy: true, diasFaltan: 0, semana: 'esta' }
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

    /* Y el botón abre WhatsApp con el saludo ya escrito. Sólo en la fila de hoy. */
    const saludar = page.getByRole('link', { name: 'Saludar' });
    await expect(saludar).toHaveCount(1);
    await expect(saludar).toHaveAttribute(
      'href',
      `https://wa.me/5491133334444?text=${encodeURIComponent('¡Feliz cumpleaños, Ana!')}`
    );
  });

  test('avisa cuando no hay ninguno', async ({ page }) => {
    await installApiMock(page, { meUser: adminUser });
    await entrarComoAdmin(page);
    await expect(page.getByText('Nadie cumple años en estas dos semanas.')).toBeVisible();
  });
});
