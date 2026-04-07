# App de Gestión de Eventos - Centro Cultural

Aplicación web completa para gestionar usuarios, actividades y procesos de inscripción en un centro cultural.

## Stack Tecnológico

- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Base de Datos**: MongoDB (Mongoose)
- **Autenticación**: JWT
- **Exportación**: ExcelJS

## Estructura del repositorio

Este repositorio contiene **solo el frontend** (React + Vite). El API está en [malka-backend](https://github.com/Ezequiel-H/malka-backend).

Tras clonar, en la raíz del repo tenés `src/`, `package.json`, etc. Los comandos de instalación y `npm run dev` se ejecutan **desde esa raíz**.

### Workspace local con ambos repos (opcional)

Muchos desarrolladores mantienen una carpeta contenedora sin Git con dos clonaciones hermanas:

```
malka/                    # carpeta local (sin .git)
├── frontend/             # este repo (git@github.com:Ezequiel-H/malka.git)
├── backend/              # API (git@github.com:Ezequiel-H/malka-backend.git)
└── ...
```

Si trabajás así, los comandos del frontend son desde `frontend/`; los del backend desde `backend/`.

## Instalación

### Prerrequisitos

- Node.js (v16 o superior)
- MongoDB (local o remoto)
- npm o yarn

### Backend (repositorio aparte)

Cloná [malka-backend](https://github.com/Ezequiel-H/malka-backend) y seguí su README. Resumen:

1. Desde la carpeta del backend (por ejemplo `backend/` junto a este proyecto):
```bash
cd backend
npm install
```

2. Configurar variables de entorno (`cp .env.example .env` si existe, o creá `.env`).

Valores típicos (el puerto por defecto del servidor es **5001**):
```
PORT=5001
MONGODB_URI=...
JWT_SECRET=tu_secret_key_super_segura_aqui
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

3. Crear usuario administrador inicial:
```bash
node scripts/createAdmin.js admin@centro.com admin123 Admin Sistema
```

4. Iniciar servidor: `npm run dev` (o `npm start`). El API queda en `http://localhost:5001/api`.

### Frontend (este repositorio)

1. En la **raíz de este clon** (o dentro de `frontend/` si usás el workspace de dos carpetas):
```bash
npm install
```

2. Opcional: archivo `.env` con:
```
VITE_API_URL=http://localhost:5001/api
```

En desarrollo, Vite hace proxy de `/api` al backend; si no definís `VITE_API_URL`, el cliente usa por defecto `http://localhost:5001/api` (ver `src/contexts/AuthContext.jsx`).

3. Iniciar desarrollo:
```bash
npm run dev
```

La app queda en `http://localhost:5173`

## Funcionalidades

- Registro y onboarding de participantes
- Aprobación de cuentas por administradores
- Gestión completa de actividades (crear, editar, eliminar)
- Sistema de inscripciones con aprobación opcional
- Filtros y búsqueda de actividades
- Exportación a Excel de listados de inscriptos
- Sistema de tags y segmentación de usuarios
- Panel de administración y panel de participante

## Roles

- **Admin**: Gestión completa de usuarios y actividades
- **Participante**: Visualización e inscripción en actividades

## Flujo de Usuario

### Participante

1. **Registro**: Crear cuenta con email y contraseña
2. **Onboarding**: Completar perfil con intereses, tags, etc.
3. **Aprobación**: Esperar aprobación del administrador
4. **Explorar**: Ver cartelera de actividades con filtros
5. **Inscribirse**: Inscribirse en actividades (directa o con aprobación)
6. **Gestionar**: Ver y cancelar sus inscripciones

### Administrador

1. **Login**: Iniciar sesión con credenciales de admin
2. **Aprobar Usuarios**: Revisar y aprobar/rechazar solicitudes
3. **Gestionar Actividades**: Crear, editar y eliminar actividades
4. **Exportar**: Descargar listados de inscriptos en Excel
5. **Gestionar Usuarios**: Ver y editar información de usuarios

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Obtener usuario actual

### Usuarios
- `POST /api/users/onboarding` - Completar onboarding
- `GET /api/users/pending` - Listar usuarios pendientes (Admin)
- `GET /api/users` - Listar todos los usuarios (Admin)
- `PUT /api/users/:id/approve` - Aprobar usuario (Admin)
- `PUT /api/users/:id/reject` - Rechazar usuario (Admin)
- `PUT /api/users/:id` - Actualizar usuario (Admin); cuerpo puede incluir `tags` (públicos) y `tagsPrivados` (solo admin)
- `PATCH /api/users/me` - Participante: actualizar solo `tags` (intereses públicos)

### Tags (catálogos)
- `GET /api/tags` — Catálogo público (intereses / temas de actividad). El registro usa `GET /api/tags?activa=true` sin JWT (`fetch` desde el formulario de registro); conviene permitir lectura pública o fallará la carga en signup.
- `POST|PUT|DELETE /api/tags` — CRUD (Admin)
- `GET|POST|PUT|DELETE /api/tags-privados` — Catálogo **privado** (solo Admin). Misma forma de respuesta que `/tags` (`{ tags: [...] }`).

### Modelo de datos (tags)
- **Usuario:** `tags` (públicos, autogestionados), `tagsPrivados` (solo admin; **no** deben enviarse al cliente participante en `GET /auth/me`).
- **Actividad:** `tags` (públicos; el frontend también envía `categorias` igual a `tags` por compatibilidad), `tagsPrivados` (audiencia; también `tagsVisibilidad` igual a `tagsPrivados` por compatibilidad). Las respuestas al participante no deben incluir `tagsPrivados` / `tagsVisibilidad`.

### Actividades
- `GET /api/activities` - Listar actividades
- `GET /api/activities/:id` - Obtener actividad
- `POST /api/activities` - Crear actividad (Admin)
- `PUT /api/activities/:id` - Actualizar actividad (Admin)
- `DELETE /api/activities/:id` - Eliminar actividad (Admin)
- `GET /api/activities/:id/export` - Exportar inscripciones (Admin)

### Inscripciones
- `POST /api/inscriptions` - Crear inscripción
- `GET /api/inscriptions/my` - Mis inscripciones
- `PUT /api/inscriptions/:id/cancel` - Cancelar inscripción
- `GET /api/inscriptions/activity/:activityId` - Inscripciones de actividad (Admin)
- `PUT /api/inscriptions/:id/approve` - Aprobar inscripción (Admin)
- `PUT /api/inscriptions/:id/reject` - Rechazar inscripción (Admin)

## Estructura de Base de Datos

### Users
- Información personal y de contacto
- `tags` (públicos / intereses) y `tagsPrivados` (segmentación interna, colección aparte)
- Estado (pending/approved/rejected)
- Rol (participant/admin)

### Activities
- Información básica (título, descripción, fotos)
- Fechas y horarios
- Precio y cupo
- Tipo (única/recurrente)
- Estado (borrador/publicada/eliminada)
- Visibilidad; `tags` públicos y `tagsPrivados` para actividades privadas (matching en servidor)

### Inscriptions
- Relación usuario-actividad
- Estado (pendiente/aceptada/cancelada/en_espera)
- Fechas de inscripción, aprobación y cancelación
- Notas adicionales

