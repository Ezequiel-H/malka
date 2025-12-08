# Guía de Inicio Rápido

## Pasos para poner en marcha la aplicación

### 1. Configurar MongoDB

Asegúrate de tener MongoDB corriendo localmente o configura una URI remota.

### 2. Configurar Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus valores
```

### 3. Crear Usuario Administrador

```bash
cd backend
node scripts/createAdmin.js admin@centro.com admin123 Admin Sistema
```

O usar el script npm:
```bash
npm run create-admin -- admin@centro.com admin123 Admin Sistema
```

### 4. Iniciar Backend

```bash
cd backend
npm run dev
```

El servidor estará en `http://localhost:5000`

### 5. Configurar Frontend

```bash
cd frontend
npm install
```

Opcional: crear `.env` con:
```
VITE_API_URL=http://localhost:5000/api
```

### 6. Iniciar Frontend

```bash
cd frontend
npm run dev
```

La aplicación estará en `http://localhost:5173`

## Primeros Pasos

1. **Iniciar sesión como Admin**: Usa las credenciales creadas en el paso 3
2. **Registrar un participante**: Desde la página de registro
3. **Aprobar el participante**: Desde el panel de admin → Usuarios Pendientes
4. **Crear una actividad**: Desde el panel de admin → Actividades → Nueva Actividad
5. **Inscribirse**: Como participante, navegar a Actividades e inscribirse

## Notas Importantes

- Los usuarios participantes deben completar el onboarding antes de poder acceder
- Los usuarios participantes deben ser aprobados por un admin antes de poder inscribirse
- Las actividades pueden ser de inscripción directa o requerir aprobación
- Los administradores pueden exportar listados de inscriptos a Excel

## Solución de Problemas

### Error de conexión a MongoDB
- Verifica que MongoDB esté corriendo
- Revisa la URI en el archivo `.env`

### Error de CORS
- Asegúrate de que `FRONTEND_URL` en `.env` del backend coincida con la URL del frontend

### Token expirado
- El token JWT expira en 7 días por defecto
- Puedes ajustar `JWT_EXPIRE` en el `.env` del backend

