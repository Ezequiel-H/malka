# App de Gestión de Eventos - Centro Cultural

Aplicación web completa para gestionar usuarios, actividades y procesos de inscripción en un centro cultural.

## Stack Tecnológico

- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Base de Datos**: MongoDB (Mongoose)
- **Autenticación**: JWT
- **Exportación**: ExcelJS

## Estructura del Proyecto

```
malka/
├── backend/          # API REST con Express
├── frontend/         # Aplicación React
├── instrucciones.md  # Especificaciones del proyecto
└── README.md         # Este archivo
```

## Instalación

### Prerrequisitos

- Node.js (v16 o superior)
- MongoDB (local o remoto)
- npm o yarn

### Backend

1. Instalar dependencias:
```bash
cd backend
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/centro-cultural
JWT_SECRET=tu_secret_key_super_segura_aqui
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

3. Crear usuario administrador inicial:
```bash
node scripts/createAdmin.js [email] [password] [nombre] [apellido]
```

Ejemplo:
```bash
node scripts/createAdmin.js admin@centro.com admin123 Admin Sistema
```

4. Iniciar servidor:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

### Frontend

1. Instalar dependencias:
```bash
cd frontend
npm install
```

2. Configurar variables de entorno (opcional):
Crear archivo `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

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
- `PUT /api/users/:id` - Actualizar usuario (Admin)

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
- Tags e intereses
- Estado (pending/approved/rejected)
- Rol (participant/admin)

### Activities
- Información básica (título, descripción, fotos)
- Fechas y horarios
- Precio y cupo
- Tipo (única/recurrente)
- Estado (borrador/publicada/eliminada)
- Visibilidad y tags requeridos

### Inscriptions
- Relación usuario-actividad
- Estado (pendiente/aceptada/cancelada/en_espera)
- Fechas de inscripción, aprobación y cancelación
- Notas adicionales

