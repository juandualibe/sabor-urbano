# Sabor Urbano - Sistema de Gestión Backend

Sistema de gestión integral para el restaurante "Sabor Urbano", desarrollado con Node.js, Express y Programación Orientada a Objetos (ES6 modules). Incluye una API REST completa para operaciones CRUD, sistemas de autenticación/autorización (JWT y Sesión), interfaces web responsivas con Pug para gestión visual, y filtros avanzados para tareas. Resuelve la unificación de pedidos (presenciales y delivery) y el control de inventario, con relaciones explícitas entre modelos: Cliente-Pedido, Tarea-Pedido y Tarea-Empleado.

## Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Uso](#uso)
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

### Funcionalidades Principales

- **Autenticación y Autorización (NUEVO)**: Implementado sistema de Registro y Login de usuarios.
  - Las Vistas Web utilizan Passport Local Strategy para login basado en Express Session.
  - La API REST está configurada para emitir JWT (JSON Web Token) y utiliza middlewares de protección (aunque las rutas de API en el app.js actual usan la protección de sesión para simplificar el frontend).
  - Todas las rutas de gestión interna (`/tareas`, `/empleados`, etc.) están ahora protegidas y requieren un usuario autenticado.

- **Gestión de Tareas**: Control de actividades por áreas (gestión de pedidos, control de inventario). Soporta estados (pendiente, en proceso, finalizada), prioridades (alta, media, baja), asignación a empleados y asociación opcional con pedidos mediante referencias Mongoose.

- **Gestión de Empleados**: Registro, edición y eliminación con roles (administrador, cocinero, repartidor, mozo, encargado_stock) y áreas (cocina, reparto, salón, inventario, administración).

- **Gestión de Pedidos**: Unifica pedidos presenciales y delivery (plataformas: Rappi, PedidosYa, propia, local). Cálculo automático de total y número de orden incremental.

- **Gestión de Productos**: CRUD para los productos ofrecidos, incluyendo nombre, precio y disponibilidad (stock).

- **Control de Inventario**: Manejo de insumos por categorías (alimentos, bebidas, limpieza, utensilios, otros), con alertas de stock bajo/sin stock y cálculo automático de estado.

- **Filtros de Tareas**: Combina estado, prioridad, fechas (creación), empleado asignado y pedido asociado.

- **Relaciones entre Modelos (Mongoose)**:
  - **Tarea → Pedido**: Tareas pueden asociarse a un Pedido vía `pedidoAsociado` (ObjectId ref).
  - **Tarea → Empleado**: Tareas pueden asignarse a un Empleado vía `empleadoAsignado` (ObjectId ref).

### Características Técnicas

- API REST con CRUD completo y filtros, usando ES6 modules.
- Modelos Mongoose (Schemas) para entidades (Usuario, Empleado, Pedido, Insumo, Producto, Tarea) con validaciones y referencias (ref).
- Implementación de Autenticación con Passport.js, JWT (JSON Web Tokens) y bcryptjs para el hasheo de contraseñas.
- Manejo de sesiones con Express Session.
- Middleware personalizado para validaciones básicas y sanitización (`validation.js`), y middlewares de protección de acceso (`auth.js`, `authVistas.js`).
- Vistas Pug con formularios y tablas responsivas (Bootstrap) para CRUD completo, interactuando con la API mediante fetch.
- Base de datos NoSQL en MongoDB Atlas, gestionada con Mongoose.

## Arquitectura

Se ha extendido y modularizado la arquitectura MVC para incorporar la funcionalidad de autenticación y autorización mediante Passport.js, JWT y Express Session.

### Estructura del Proyecto

Se ha expandido la estructura de carpetas para incluir nuevos módulos de autenticación (auth, Usuario) y configuración de Passport:

```
📁 sabor-urbano-crud/
├── ⚙️ config/
│   ├── passport.js            # Configuración de estrategias Passport (Local, JWT)
│   └── db.js                  # Conexión a MongoDB
├── 🎮 controllers/            # Lógica de negocio
│   ├── authController.js      # Lógica de Registro, validación de credenciales y generación de JWT
│   ├── empleadosController.js
│   ├── insumosController.js
│   ├── pedidosController.js
│   ├── productosController.js
│   └── tareasController.js
├── 🏗️ models/                # Schemas Mongoose
│   ├── Empleado.js
│   ├── Insumo.js
│   ├── Pedido.js
│   ├── Producto.js
│   ├── Tarea.js
│   └── Usuario.js             # Modelo para Autenticación (con hasheo bcrypt)
├── 🛣️ routes/                # Rutas API (Protegidas)
│   ├── auth.js                # Rutas API /auth/register y /auth/login
│   ├── empleados.js           # Rutas API CRUD Empleados
│   ├── insumos.js             # Rutas API CRUD Insumos
│   ├── pedidos.js             # Rutas API CRUD Pedidos
│   ├── productos.js           # Rutas API CRUD Productos
│   └── tareas.js              # Rutas API CRUD Tareas
├── 🎨 views/                 # Vistas Pug (Protegidas)
│   ├── auth/
│   │   ├── login.pug          # Formulario de Login
│   │   └── register.pug       # Formulario de Registro
│   ├── empleados/
│   ├── insumos/
│   ├── pedidos/
│   ├── productos/
│   ├── tareas/
│   ├── error.pug
│   ├── filters.pug
│   └── layout.pug             # Plantilla base (con lógica de sesión/logout)
├── 🛡️ middleware/            # Middlewares de Express
│   ├── auth.js                # Middleware de protección JWT (protect)
│   ├── authVistas.js          # Middlewares de protección de Sesión (isLoggedIn, isLoggedOut)
│   └── validation.js          # Validaciones personalizadas
├── 📊 data/                 # Base de datos JSON (para referencia, ya migrados)
│   ├── areas.json
│   ├── clientes.json
│   ├── empleados.json
│   ├── insumos.json
│   ├── pedidos.json
│   ├── roles.json
│   └── tareas.json
├── 🔄 scripts/               # Utilidades
│   └── normalizar_datos_v1.js
├── 📦 node_modules/
├── 📋 package.json
├── 📄 .env                   # Variables de entorno
└── 🚀 app.js                # Servidor Express (Rutas y Configuración Global)
```

## Instalación

### Prerrequisitos

- **Node.js**: v18 o superior.
- **npm**: v8 o superior (generalmente viene con Node.js).
- **MongoDB Atlas**: Una cuenta y una base de datos creada. Necesitarás la URI de conexión.
- **Git**: Para clonar el repositorio.
- **Editor de código**: VS Code recomendado.
- **(Opcional) Cliente API**: Thunder Client (extensión VS Code) o Postman para probar los endpoints API.

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
   Esto instalará Express, Mongoose, Pug, dotenv, y las dependencias de autenticación como passport, passport-local, passport-jwt, jsonwebtoken, bcryptjs, express-session.

3. **Configurar Variables de Entorno:**
   - Crea un archivo llamado `.env` en la raíz del proyecto.
   - Añade tu URI de conexión de MongoDB Atlas y la nueva clave secreta para JWT/Sesión:
   ```env
   MONGODB_URI=mongodb+srv://tu_usuario:tu_contraseña@tu_cluster.mongodb.net/tu_base_de_datos?retryWrites=true&w=majority
   PORT=3000 # Puedes cambiar el puerto si lo deseas
   JWT_SECRET=tu_clave_secreta_jwt
   ```
   **Importante**: Asegúrate de que este archivo `.env` esté listado en tu `.gitignore` para no subir tus credenciales.

4. **Verificar scripts en package.json:**
   ```json
   {
     "scripts": {
       "start": "node app.js",
       "dev": "nodemon app.js",
       "test": "echo \"Testing with Thunder Client\""
     }
   }
   ```

5. **Iniciar el servidor:**
   - Modo Desarrollo (con auto-recarga):
   ```bash
   npm run dev
   ```
   - Modo Producción:
   ```bash
   npm start
   ```

6. **Verificar:**
   - La consola debería mostrar "🚀 Servidor corriendo en http://localhost:3000" y "✅ Conexión exitosa a MongoDB Atlas".
   - Abre en tu navegador: `http://localhost:3000` (debería redirigir a `/login`).

## Uso

### Interfaces Web

Las interfaces web ahora requieren autenticación para acceder a las rutas de gestión:

| URL | Descripción | Acceso |
|-----|-------------|--------|
| `http://localhost:3000` | Redirige al login o a la gestión de tareas (`/tareas`) | Controlado |
| `/login` | Formulario de inicio de sesión | Público (Solo si no está logueado) |
| `/register` | Formulario de registro de nuevo usuario | Público (Solo si no está logueado) |
| `/logout` | Cierre de sesión y borrado de cookie | Privado (Cualquier usuario logueado) |
| `/tareas` | Listar, crear y editar Tareas | Privado (isLoggedIn) |
| `/empleados` | Listar, crear y editar Empleados | Privado (isLoggedIn) |
| `/pedidos` | Listar, crear y editar Pedidos | Privado (isLoggedIn) |
| `/insumos` | Listar, crear y editar Insumos (Inventario) | Privado (isLoggedIn) |
| `/productos` | Listar, crear y editar Productos | Privado (isLoggedIn) |
| `/filtros` | Formulario para aplicar filtros a la lista de Tareas | Privado (isLoggedIn) |

### API

- **Base URL**: `http://localhost:3000/api`
- **Formato**: JSON
- **Autenticación**: Requerida (basada en Sesión/Cookie en la implementación de rutas actual, aunque el sistema está preparado para JWT).

## API Endpoints

### Autenticación (`/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/register` | Registra un nuevo usuario en la base de datos |
| POST | `/login` | Autentica un usuario (local) y devuelve un JWT |

### Empleados (`/api/empleados`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Obtener todos los empleados (Protegido) |
| POST | `/` | Crear un nuevo empleado (Protegido) |
| PUT | `/:id` | Actualizar un empleado (Protegido) |
| DELETE | `/:id` | Eliminar un empleado (Protegido) |

### Tareas (`/api/tareas`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Obtener tareas (soporta filtros) (Protegido) |
| POST | `/` | Crear una nueva tarea (Protegido) |
| PUT | `/:id` | Actualizar una tarea (Protegido) |
| DELETE | `/:id` | Eliminar una tarea (Protegido) |
| PATCH | `/:id/iniciar` | Marcar tarea como "en_proceso" (Protegido) |
| PATCH | `/:id/finalizar` | Marcar tarea como "finalizada" (Protegido) |

_(Los endpoints de Pedidos, Insumos y Productos bajo `/api/` también están protegidos por la sesión del usuario.)_

## Interfaces Web

- **MODIFICADO: Autenticación**: Se añadieron formularios de Login y Registro (`login.pug`, `register.pug`).
- **MODIFICADO: Navegación**: El `layout.pug` ahora incluye la lógica condicional para mostrar el menú de navegación completo y el botón de Cerrar Sesión solo cuando el usuario está autenticado.
- **Tareas/Empleados/Pedidos/Insumos/Productos**: Las vistas CRUD siguen el mismo diseño responsivo con Pug/Bootstrap y utilizan fetch para interactuar con los endpoints de la API, ahora asegurados por middlewares de sesión.
- **Filtros**: El formulario en `filters.pug` continúa enviando parámetros GET a `/tareas/filtrar`.

## Testing

Se recomienda usar un cliente API como Thunder Client o Postman, y el navegador para la autenticación de vistas.

### Ejemplos de Pruebas de Autenticación:

1. **Registro de Usuario (API):**
   ```
   POST http://localhost:3000/auth/register
   ```
   Body (JSON):
   ```json
   {
     "nombre": "Test",
     "apellido": "User",
     "email": "test@saborurbano.com",
     "username": "testuser",
     "password": "Password123"
   }
   ```
   **Respuesta Esperada**: 201 Created con `success: true`.

2. **Login y Obtención de JWT (API):**
   ```
   POST http://localhost:3000/auth/login
   ```
   Body (JSON):
   ```json
   {
     "username": "testuser",
     "password": "Password123"
   }
   ```
   **Respuesta Esperada**: 200 OK con un campo `token: "Bearer <JWT>"`.

3. **Acceso a Vistas Protegidas (Navegador):**
   - Navegar a `http://localhost:3000/tareas`. Debe redirigir automáticamente a `/login`.
   - Acceder a `/login`, ingresar credenciales válidas y hacer clic en Iniciar Sesión.
   - **Resultado Esperado**: Redirección a `/tareas` con la barra de navegación completa y el botón Cerrar Sesión.

## Estructura del Proyecto

### Modelos (Mongoose Schemas)

- **Clases**: Usuario, Empleado, Insumo, Pedido, Producto, Tarea.
- **MEJORA: Usuario-Autenticación**: El nuevo modelo `Usuario` gestiona las credenciales de acceso (username, email únicos y password hasheada con bcryptjs).

### Middleware

- **MEJORA**: Implementación de Passport.js para estrategias Local y JWT.
- **MEJORA**: Uso de middlewares `isLoggedIn` y `isLoggedOut` para controlar el flujo de navegación de las vistas.

## Tecnologías

- **Backend**: Node.js (v18+), Express.js
- **Base de Datos**: MongoDB Atlas
- **ODM**: Mongoose
- **Autenticación**: Passport.js (Local & JWT Strategies), jsonwebtoken, bcryptjs, express-session.
- **Motor de Plantillas**: Pug
- **Frontend Framework**: Bootstrap 5
- **Iconos**: Font Awesome 6
- **Variables de Entorno**: dotenv
- **Desarrollo**: Nodemon

## Ejemplos

_(Sección disponible para agregar ejemplos adicionales de uso)_

## Contribución

1. Haz un Fork del repositorio.
2. Crea una nueva rama para tu feature.
3. Realiza tus cambios y haz commit.
4. Empuja tu rama y abre un Pull Request.

## Licencia

MIT

## Responsabilidades del Equipo

_(Ajustar según corresponda)_

- **Juan Dualibe** (Project Manager / Infraestructura): Coordinación, actualización de `app.js` (sesiones, passport, rutas de auth), gestión de dependencias.
- **Nicolás Weibel** (Backend Lead / Arquitecto): Diseño de arquitectura, configuración de `config/passport.js`, creación de middlewares de protección (`auth.js`, `authVistas.js`).
- **Germán Rodríguez** (Database & Models): Creación del modelo `models/Usuario.js` (con bcryptjs, validaciones y métodos de comparación).
- **Rocío Gómez** (API & Controller Developer): Implementación de `controllers/authController.js` (registro y generación de JWT).
- **Juan Manuel Gasbarro** (Frontend & Views / Tester): Desarrollo de las vistas de autenticación (`login.pug`, `register.pug`), modificación de `layout.pug` para manejo de sesión, pruebas funcionales de los flujos de login/logout.

## Bibliografía

- [Documentación Oficial Node.js](https://nodejs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [Mongoose ODM](https://mongoosejs.com/docs/guide.html)
- [Passport.js – Documentación oficial](https://www.passportjs.org/)
- [JSON Web Tokens (JWT) – jwt.io](https://jwt.io/)
- [bcryptjs - npm](https://www.npmjs.com/package/bcryptjs)
- [Express-session – Manejo de sesiones](https://www.npmjs.com/package/express-session)
- [Pug Template Engine](https://pugjs.org/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/5.1/)
- [MDN Web Docs (Fetch API, Async/Await)](https://developer.mozilla.org/)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)