/** Matches axios base URL from AuthContext (default http://localhost:5001/api). */
export const API_BASE = 'http://localhost:5001/api';

const json = (data, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(data)
});

const pathname = (route) => new URL(route.request().url()).pathname;

/**
 * Intercepts API calls so E2E tests run without a real backend.
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {object} [options.loginUser] — Successful login payload (token is added automatically). Omit if using rejectLogin.
 * @param {boolean} [options.rejectLogin] — When true, POST /auth/login returns 401.
 * @param {object | null} [options.meUser] — User for GET /auth/me when Bearer token is sent. Defaults to loginUser when that is set.
 */
export async function installApiMock(page, options = {}) {
  const { loginUser, rejectLogin = false, meUser: meUserOpt } = options;
  const meUser = meUserOpt !== undefined ? meUserOpt : loginUser || null;

  await page.route(`${API_BASE}/**`, async (route) => {
    const req = route.request();
    const method = req.method();
    const path = pathname(route);

    if (method === 'POST' && path === '/api/auth/login') {
      if (rejectLogin) {
        await route.fulfill(json({ message: 'Credenciales inválidas' }, 401));
        return;
      }
      if (!loginUser) {
        await route.fulfill(json({ message: 'Credenciales inválidas' }, 401));
        return;
      }
      await route.fulfill(
        json({
          token: 'e2e-test-token',
          user: loginUser
        })
      );
      return;
    }

    if (method === 'GET' && path === '/api/auth/me') {
      const auth = req.headers()['authorization'] || '';
      if (!auth.includes('Bearer') || !meUser) {
        await route.fulfill(json({ message: 'No autorizado' }, 401));
        return;
      }
      await route.fulfill(json({ user: meUser }));
      return;
    }

    if (method === 'GET' && path.startsWith('/api/activities')) {
      await route.fulfill(json({ activities: [], count: 0 }));
      return;
    }

    if (method === 'GET' && path.startsWith('/api/users/pending')) {
      await route.fulfill(json({ users: [] }));
      return;
    }

    if (method === 'GET' && path.startsWith('/api/inscriptions')) {
      await route.fulfill(json({ inscriptions: [], count: 0 }));
      return;
    }

    if (method === 'GET' && path.startsWith('/api/tags')) {
      await route.fulfill(json({ tags: [] }));
      return;
    }

    if (method === 'POST' && path === '/api/auth/register') {
      await route.fulfill(
        json(
          {
            token: 'e2e-register-token',
            user: {
              id: 'e2e-id',
              email: 'new@e2e.test',
              nombre: 'Nuevo',
              apellido: 'Usuario',
              role: 'participant',
              estado: 'pending',
              tags: []
            }
          },
          201
        )
      );
      return;
    }

    if (method === 'POST' && path === '/api/users/onboarding') {
      await route.fulfill(
        json({
          user: {
            _id: 'e2e-id',
            email: 'new@e2e.test',
            nombre: 'Nuevo',
            apellido: 'Usuario',
            role: 'participant',
            estado: 'pending',
            tags: []
          }
        })
      );
      return;
    }

    if (method === 'PATCH' && path === '/api/users/me') {
      await route.fulfill(json({ user: meUser || { estado: 'pending' } }));
      return;
    }

    await route.fulfill(json({}));
  });
}

export const participantApproved = {
  _id: 'u1',
  email: 'part@test.local',
  nombre: 'Ana',
  apellido: 'Pérez',
  role: 'participant',
  estado: 'approved',
  tags: []
};

export const participantPending = {
  ...participantApproved,
  estado: 'pending',
  email: 'pend@test.local'
};

export const adminUser = {
  _id: 'a1',
  email: 'admin@test.local',
  nombre: 'Admin',
  apellido: 'Uno',
  role: 'admin',
  estado: 'approved',
  tags: []
};
