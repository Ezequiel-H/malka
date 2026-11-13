import { http, HttpResponse } from 'msw';

const API = 'http://localhost:5001/api';

export const handlers = [
  http.get(`${API}/activities`, () =>
    HttpResponse.json({ activities: [], count: 0 })
  ),
  http.get(`${API}/inscriptions/my`, () =>
    HttpResponse.json({ inscriptions: [], count: 0 })
  ),
  http.get(`${API}/inscriptions`, () =>
    HttpResponse.json({ inscriptions: [], count: 0 })
  ),
  http.get(`${API}/inscriptions/stats/accepted-last-30-days`, () =>
    HttpResponse.json({ count: 0 })
  ),
  http.get(`${API}/users/pending`, () => HttpResponse.json({ users: [] })),
  http.get(`${API}/tags`, () => HttpResponse.json({ tags: [], count: 0 })),
  // Después del login se pide el perfil completo. En las pruebas no hay: un 404
  // (no un 401, que cerraría la sesión) hace que siga con lo que devolvió el login.
  http.get(`${API}/auth/me`, () => HttpResponse.json({ message: 'Sin perfil en las pruebas' }, { status: 404 }))
];
