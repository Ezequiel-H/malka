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
  http.get(`${API}/users/pending`, () => HttpResponse.json({ users: [] })),
  http.get(`${API}/tags`, () => HttpResponse.json({ tags: [], count: 0 }))
];
