# **Especificación del Proyecto: App de Gestión de Eventos para un Centro Cultural**

## **Descripción general**

Desarrollar una aplicación web en **JavaScript** (stack flexible: Node.js + Express para backend, React para frontend, MongoDB o PostgreSQL para base de datos, a definir en implementación) cuyo objetivo sea **gestionar usuarios, actividades y procesos de inscripción** dentro de un centro cultural.
La aplicación tendrá dos tipos de usuarios: **Participantes** y **Administradores**, cada uno con flujos específicos.

---

# **1. Funcionalidades principales**

## **1.1. Registro y onboarding de participantes**

* El usuario podrá **crear una cuenta con email y contraseña**.
* El proceso de onboarding incluirá completar una serie de **preguntas personalizadas** (datos personales, intereses, tags, etc.).
* Una vez completado el onboarding, la cuenta queda en **estado pendiente de aprobación**.

## **1.2. Aprobación de cuentas (Admin)**

* Desde el panel de administración, un administrador podrá:

  * Ver el listado de cuentas pendientes.
  * Aceptar o rechazar solicitudes.
  * Editar la información del participante.
* Solo los usuarios **aprobados** pueden inscribirse en actividades.

---

# **2. Gestión de actividades (Admin)**

Los administradores deben poder:

* Crear, editar y eliminar actividades.
* Crear actividades de:

  * **Una sola ocasión**
  * **Recurrentes** (ej. todos los martes, frecuencia semanal, mensual, etc.)
* Configurar para cada actividad:

  * Título
  * Descripción
  * Foto
  * Categorías / etiquetas (para permitir filtrado)
  * Fecha(s) y hora(s)
  * Lugar
  * Precio
  * Cupo máximo (opcional)
  * Tipo de inscripción:

    * **Inscripción directa**
    * **Inscripción con aprobación**
  * Estado:

    * **Borrador**
    * **Publicada**
    * **Eliminada**
* Descargar un **Excel con la lista de inscriptos**, incluyendo:

  * Datos de contacto
  * Estado de su inscripción (aceptado/pendiente/cancelado)
  * Notas o campos personalizados (si se agregan)

**Campos adicionales sugeridos para actividades:**

* **ID del organizador** (admin responsable)
* **Duración** (minutos u horas)
* **Ubicación online / link de Zoom** si aplica
* **Política de cancelación** (texto opcional)
* **Actividad gratuita / paga**
* **Recordatorios automáticos** (campo para activar o desactivar)
* **Visibilidad** (pública / privada)

---

# **3. Panel del participante**

Una vez aceptado, el participante podrá:

## **3.1. Ver cartelera de actividades**

* Listado de próximas actividades.
* Filtros por:

  * Categoría
  * Fecha
  * Actividades recurrentes
  * Precio
  * Disponibilidad de cupo
  * Requiere aprobación o no

## **3.2. Inscribirse en actividades**

* Si la actividad es de inscripción directa:

  * Queda automáticamente inscripto si hay cupo.
* Si la actividad requiere aprobación:

  * Queda en estado **pendiente** hasta que el admin lo acepte.

## **3.3. Gestionar sus inscripciones**

* Ver listado de inscripciones activas.
* Cancelar participación (darse de baja).
* Ver estado de cada inscripción:

  * Confirmada
  * Pendiente
  * Cancelada
  * En lista de espera (si se implementa)

---

# **4. Sistema de tags y segmentación**

Cada participante tendrá una lista de **tags** definidos durante el onboarding y editables por el admin:

* Intereses
* Categorías artísticas
* Segmentos de público
* Nivel de participación
* Cualquier otro criterio que sirva para campañas internas

Los administradores podrán:

* Filtrar participantes por tags.
* **Crear listas personalizadas** para invitaciones.
* Definir eventos exclusivos visibles solo para ciertos grupos.

---

# **5. Exportaciones y reportes**

* Exportar a Excel:

  * Listado de inscriptos por actividad
  * Reportes generales de asistencia
  * Información de contacto
  * Campos personalizados (si se agregan)

---

# **6. Seguridad y autenticación**

* Autenticación basada en JWT o similar.
* Validación de email (opcional).
* Roles y permisos:

  * Admin
  * Participante
  * (Opcional) Organizador

---

# **7. Estructura sugerida de base de datos**

*(Para que Cursor pueda generar los modelos.)*

### **Users**

* id
* email, password hash
* nombre, apellido
* teléfono
* tags: array
* estado: pending / approved / rejected
* created_at, updated_at

### **Activities**

* id
* título
* descripción
* fotos: array
* categorías: array
* fecha(s)
* hora(s)
* lugar
* precio
* cupo (nullable)
* requiere_aprobación: boolean
* tipo: única / recurrente
* estado: borrador / publicada / eliminada
* created_at, updated_at

### **Inscriptions**

* id
* user_id
* activity_id
* estado: pendiente / aceptada / cancelada
* fecha_inscripción
* fecha_cancelación (nullable)

### **Opcional**

* Notifications
* Logs de actividad
* Historial de aprobaciones

