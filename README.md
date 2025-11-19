# Sabor Urbano - Sistema de Gestión Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-4.18.2-blue.svg)
![Pug](https://img.shields.io/badge/Pug-3.0.2-orange.svg)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.1.3-purple.svg)

Sistema de gestión integral para el restaurante "Sabor Urbano", desarrollado con Node.js, Express y Programación Orientada a Objetos (ES6 modules). Esta versión (v2.0) introduce una arquitectura robusta de seguridad y autenticación, separando lógicamente el acceso al sistema de la gestión operativa. Incluye una API REST protegida, interfaces web responsivas con manejo de sesiones y control de acceso basado en roles.

## Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Uso y Autenticación](#uso-y-autenticación)
- [API Endpoints](#api-endpoints)
- [Interfaces Web](#interfaces-web)
- [Testing](#testing)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Ejemplos](#ejemplos)
- [Contribución](#contribución)
- [Licencia](#licencia)
- [Responsabilidades del Equipo](#responsabilidades-del-equipo)
- [Bibliografía](#bibliografía)

## Características

### Seguridad y Autenticación (Nuevo)

- **Sistema de Login y Registro**: Implementación de Passport.js con estrategia Local.
- **Manejo de Sesiones**: Uso de express-session para mantener la persistencia del usuario en el navegador, protegiendo todas las vistas administrativas mediante middleware (`isLoggedIn`, `isLoggedOut`).
- **Hashing de Contraseñas**: Encriptación segura de contraseñas utilizando bcryptjs antes de guardarlas en la base de datos.
- **API Tokenizada (JWT)**: Capacidad para autenticar clientes externos (Apps móviles, Postman) mediante JSON Web Tokens, permitiendo comunicación stateless.
- **Separación de Responsabilidades (Arquitectura)**: Se refactorizó el modelo de datos para desacoplar la entidad de acceso (Usuario) de la entidad operativa (Empleado).
- **Mejoras de UI**: Visualizadores de contraseña (mostrar/ocultar) en formularios y barra de navegación dinámica que muestra opciones y botón de "Cerrar Sesión" solo a usuarios autenticados.

### Funcionalidades Principales

- **Gestión de Tareas**: Control de actividades por áreas (gestión de pedidos, control de inventario). Soporta estados (pendiente, en proceso, finalizada), prioridades (alta, media, baja), asignación a empleados y asociación opcional con pedidos mediante referencias Mongoose.
- **Gestión de Empleados**: Registro, edición y eliminación con roles (administrador, cocinero, repartidor, mozo, encargado_stock) y áreas (cocina, reparto, salón, inventario, administración).
- **Gestión de Pedidos**: Unifica pedidos presenciales y delivery (plataformas: Rappi, PedidosYa, propia, local). Cálculo automático de total y número de orden incremental.
- **Gestión de Productos**: CRUD para los productos ofrecidos, incluyendo nombre, precio y disponibilidad (stock).
- **Control de Inventario**: Manejo de insumos por categorías (alimentos, bebidas, limpieza, utensilios, otros), con alertas de stock bajo/sin stock y cálculo automático de estado.
- **Filtros de Tareas**: Combina estado, prioridad, fechas (creación), empleado asignado y pedido asociado.
- **Relaciones entre Modelos (Mongoose)**:
  - Tarea → Pedido: Tareas pueden asociarse a un Pedido vía `pedidoAsociado` (ObjectId ref).
  - Tarea → Empleado: Tareas pueden asignarse a un Empleado vía `empleadoAsignado` (ObjectId ref).

### Características Técnicas

- API REST con CRUD completo y filtros, usando ES6 modules.
- Modelos Mongoose (Schemas) para entidades (Usuario, Empleado, Pedido, Insumo, Producto, Tarea) con validaciones y referencias (ref).
- Middleware personalizado para validaciones básicas y sanitización (`validation.js`).
- Vistas Pug con formularios y tablas responsivas (Bootstrap) para CRUD completo, interactuando con la API mediante fetch.
- Base de datos NoSQL en MongoDB Atlas, gestionada con Mongoose.

## Arquitectura

La estructura del proyecto ha evolucionado para incluir los nuevos módulos de seguridad:

```
📁 sabor-urbano-crud/
├── 🔑 config/
│   └── passport.js             # Configuración de estrategias (Local, JWT, Sesiones)
├── 🎮 controllers/            # Lógica de negocio
│   ├── authController.js       # NUEVO: Lógica de login/registro/JWT
│   ├── clientesController.js   # (Existente)
│   ├── empleadosController.js
│   ├── insumosController.js
│   ├── pedidosController.js
│   └── tareasController.js
├── 🏗️ models/                # Clases POO con relaciones
│   ├── Usuario.js              # NUEVO: Modelo de acceso (Username/Password)
│   ├── Cliente.js
│   ├── Empleado.js
│   ├── Insumo.js
│   ├── Pedido.js
│   └── Tarea.js
├── 🛣️ routes/                # Rutas API y vistas
│   ├── auth.js                 # NUEVO: Rutas /auth/login y /auth/register
│   ├── clientes.js
│   ├── empleados.js            # Rutas API protegidas por Sesión
│   ├── insumos.js              # Rutas API protegidas por Sesión
│   ├── pedidos.js              # Rutas API protegidas por Sesión
│   └── tareas.js               # Rutas API protegidas por Sesión
├── 🎨 views/                 # Vistas Pug
│   ├── auth/                   # NUEVO: Vistas de Login y Registro
│   │   ├── login.pug
│   │   └── register.pug
│   ├── layout.pug              # Contiene lógica condicional (sesión)
│   ├── error.pug
│   ├── filters.pug
│   ├── empleados/
│   │   ├── index.pug
│   │   ├── nuevo.pug
│   │   └── editar.pug
│   ├── insumos/
│   ├── pedidos/
│   └── tareas/
├── 🛡️ middleware/            # Validaciones y Seguridad
│   ├── auth.js                 # NUEVO: Guardián para API (JWT strategy)
│   ├── authVistas.js           # NUEVO: Guardianes para Vistas (Session strategy)
│   └── validation.js
├── 📊 data/                 # Base de datos JSON
├── 🔄 scripts/               # Utilidades
├── ⚙️ package.json          # Dependencias
└── 🚀 app.js               # Servidor Express (con config de Session y Passport)
```

## Instalación

### Prerrequisitos

- **Node.js**: v18 o superior.
- **npm**: v8 o superior.
- **MongoDB Atlas**: URI de conexión y acceso permitido.
- **Dependencias de Seguridad (NUEVO)**: passport, express-session, bcryptjs, jsonwebtoken.

### Instalación Paso a Paso

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/sabor-urbano-crud.git
   cd sabor-urbano-crud
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno (Actualizado):**
   - Crea un archivo llamado `.env` en la raíz del proyecto.
   - Añade tu URI de conexión de MongoDB Atlas y la nueva clave secreta para la autenticación:
   ```env
   MONGODB_URI=mongodb+srv://tu_usuario:tu_contraseña@tu_cluster.mongodb.net/tu_base_de_datos?retryWrites=true&w=majority
   PORT=3000
   # Clave secreta para firmar sesiones y tokens JWT
   JWT_SECRET=tu_clave_secreta_super_dificil_de_adivinar
   ```

4. **Iniciar el servidor:**
   - Modo Desarrollo (con auto-recarga):
   ```bash
   npm run dev
   ```

5. **Primer Uso (NUEVO):**
   - Abre en tu navegador: `http://localhost:3000`. Serás redirigido a `/login`.
   - Navega a `/register` para crear tu primer usuario y poder acceder al sistema.

## Uso y Autenticación

| URL | Protección | Flujo |
|-----|-----------|-------|
| `/register` | Pública (`isLoggedOut`) | Crea un nuevo Usuario. |
| `/login` | Pública (`isLoggedOut`) | Inicia la sesión de usuario (crea la cookie de sesión). |
| `/logout` | Privada | Destruye la sesión. |
| `/tareas`, `/empleados`, etc. | Privada (`isLoggedIn`) | Acceso denegado si no hay sesión activa. |

## API Endpoints

**Nota**: Todas las rutas API (`/api/*`) están protegidas por el middleware de Sesión (`isLoggedIn`).

### Autenticación (NUEVO)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | (API) Crea un Usuario y devuelve éxito (usado para Thunder Client/Futuros Frontends). |
| POST | `/auth/login` | (API) Autentica credenciales y devuelve un Token JWT para uso en API. |

### Recursos Protegidos

(El resto de los Endpoints de Empleados, Tareas, Pedidos, Insumos, y Productos mantienen su funcionalidad CRUD, pero ahora requieren autenticación para funcionar).

## Interfaces Web

Las vistas web están construidas con Pug y Bootstrap 5, proporcionando una interfaz responsiva para todas las operaciones CRUD del sistema.

## Testing

Para probar la API y la seguridad, se recomienda usar **Thunder Client**.

### Flujo de Prueba de Seguridad:

1. **Obtener Token**: POST `/auth/login` con credenciales de Usuario.
2. **Acceso a API**: Enviar el Token obtenido en el header `Authorization: Bearer <token>` a cualquier endpoint `/api/*`.

## Estructura del Proyecto

### Modelos (POO)

- **Clases**: Usuario (NUEVO), Empleado, Insumo, Pedido, Tarea.
- **Relaciones entre Modelos (Mongoose)**:
  - Tarea → Pedido: Tareas pueden asociarse a un Pedido vía `pedidoAsociado` (ObjectId ref).
  - Tarea → Empleado: Tareas pueden asignarse a un Empleado vía `empleadoAsignado` (ObjectId ref).
- **Separación**: Usuario maneja credenciales (username, password), Empleado maneja datos laborales.

### Middleware

- `authVistas.js` y `auth.js` protegen las rutas web y API, respectivamente.
- `validation.js`: Validaciones de campos.

## Tecnologías (Actualizado)

- **Backend**: Node.js, Express.js
- **Base de Datos**: MongoDB Atlas, Mongoose ODM
- **Seguridad (NUEVO)**:
  - Passport.js: Estrategias Local y JWT.
  - Bcryptjs: Hashing de contraseñas.
  - Express-Session: Manejo de sesiones de usuario.
- **Frontend**: Pug, Bootstrap 5
- **Herramientas**: Dotenv, Nodemon

## Ejemplos (cURL)

### Crear Empleado (Ya logueado):
```bash
curl -X POST http://localhost:3000/api/empleados \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=[TU_COOKIE_SESION]" \
  -d '{"nombre":"Juan","apellido":"Doe","email":"juan@example.com","telefono":"11-1234-5678","rol":"cocinero","area":"cocina"}'
```

## Contribución

1. Haz un Fork del repositorio.
2. Crea una nueva rama.
3. Realiza tus cambios y haz commit.
4. Empuja la rama y abre un Pull Request.

## Licencia

MIT

## Responsabilidades del Equipo (Actualizado)

- **Juan Dualibe** (Project Manager & Fullstack): Coordinación, implementación del sistema de autenticación (Passport/Session), refactorización de rutas y despliegue en Render.
- **Nicolás Weibel** (Backend Lead / Arquitecto): Diseño de la arquitectura MVC, separación de modelos (Usuario vs Empleado) y estructura de seguridad.
- **Germán Rodríguez** (Database & Models): Gestión de MongoDB Atlas, diseño de Schemas Mongoose, relaciones y conexión a base de datos.
- **Rocío Gómez** (API & Controller Developer): Desarrollo de controladores, lógica de negocio en endpoints y manejo de respuestas API.
- **Juan Manuel Gasbarro** (Frontend & Views): Actualización de vistas Pug (Login, Register, Layout), scripts de interfaz y pruebas funcionales.

## Bibliografía

- [Documentación Oficial Node.js](https://nodejs.org/)
- [Express.js Guide](https://expressjs.com/)
- [Mongoose ODM](https://mongoosejs.com/)
- [Pug Template Engine](https://pugjs.org/)
- [Bootstrap Documentation](https://getbootstrap.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Passport.js Documentation](https://www.passportjs.org/)
- [Express-Session NPM](https://www.npmjs.com/package/express-session)