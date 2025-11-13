# Sabor Urbano - Sistema de Gestión Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-4.18.2-blue.svg)
![Pug](https://img.shields.io/badge/Pug-3.0.2-orange.svg)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.1.3-purple.svg)

Sistema de gestión integral para el restaurante "Sabor Urbano", desarrollado con Node.js, Express y Programación Orientada a Objetos (ES6 modules). Incluye una API REST completa para operaciones CRUD, interfaces web responsivas con Pug para gestión visual, y filtros avanzados para tareas. Resuelve la unificación de pedidos (presenciales y delivery) y el control de inventario, con relaciones explícitas entre modelos: Cliente-Pedido, Tarea-Pedido y Tarea-Empleado.

## Tabla de Contenios

* [Características](#características)
* [Arquitectura](#arquitectura)
* [Instalación](#instalación)
* [Uso](#uso)
* [API Endpoints](#api-endpoints)
* [Interfaces Web](#interfaces-web)
* [Testing](#testing)
* [Estructura del Proyecto](#estructura-del-proyecto)
* [Tecnologías](#tecnologías)
* [Ejemplos](#ejemplos)
* [Contribución](#contribución)
* [Licencia](#licencia)
* [Responsabilidades del Equipo](#responsabilidades-del-equipo)
* [Bibliografía](#bibliografía)

---

## Características

### Funcionalidades Principales

* **Gestión de Tareas:** Control de actividades por áreas (gestión de pedidos, control de inventario). Soporta estados (pendiente, en proceso, finalizada), prioridades (alta, media, baja), asignación a empleados y asociación opcional con pedidos mediante referencias Mongoose.
* **Gestión de Empleados:** Registro, edición y eliminación con roles (administrador, cocinero, repartidor, mozo, encargado\_stock) y áreas (cocina, reparto, salón, inventario, administración).
* **Gestión de Pedidos:** Unifica pedidos presenciales y delivery (plataformas: Rappi, PedidosYa, propia, local). Cálculo automático de total y número de orden incremental.
* **Gestión de Productos:** CRUD para los productos ofrecidos, incluyendo nombre, precio y disponibilidad (stock).
* **Control de Inventario:** Manejo de insumos por categorías (alimentos, bebidas, limpieza, utensilios, otros), con alertas de stock bajo/sin stock y cálculo automático de estado.
* **Filtros de Tareas:** Combina estado, prioridad, fechas (creación), empleado asignado y pedido asociado.
* **Relaciones entre Modelos (Mongoose):**
    * `Tarea` -> `Pedido`: Tareas pueden asociarse a un `Pedido` vía `pedidoAsociado` (ObjectId ref).
    * `Tarea` -> `Empleado`: Tareas pueden asignarse a un `Empleado` vía `empleadoAsignado` (ObjectId ref).

### Características Técnicas

* API REST con CRUD completo y filtros, usando ES6 modules.
* Modelos Mongoose (Schemas) para entidades (`Empleado`, `Pedido`, `Insumo`, `Producto`, `Tarea`) con validaciones y referencias (`ref`).
* Middleware personalizado para validaciones básicas y sanitización (`validation.js`).
* Vistas Pug con formularios y tablas responsivas (Bootstrap) para CRUD completo, interactuando con la API mediante `fetch`.
* Base de datos NoSQL en MongoDB Atlas, gestionada con Mongoose.

---

## Arquitectura

```
📁 sabor-urbano-crud/
├── 🎮 controllers/            # Lógica de negocio
│   ├── clientesController.js
│   ├── empleadosController.js
│   ├── insumosController.js
│   ├── pedidosController.js
│   └── tareasController.js
├── 🏗️ models/                # Clases POO con relaciones
│   ├── Cliente.js
│   ├── Empleado.js
│   ├── Insumo.js
│   ├── Pedido.js
│   └── Tarea.js
├── 🛣️ routes/                # Rutas API y vistas
│   ├── clientes.js
│   ├── empleados.js
│   ├── insumos.js
│   ├── pedidos.js
│   └── tareas.js
├── 🎨 views/                 # Vistas Pug
│   ├── layout.pug
│   ├── error.pug
│   ├── filters.pug
│   ├── empleados/
│   │   ├── index.pug
│   │   ├── nuevo.pug
│   │   └── editar.pug
│   ├── insumos/
│   │   ├── index.pug
│   │   ├── nuevo.pug
│   │   └── editar.pug
│   ├── pedidos/
│   │   ├── index.pug
│   │   ├── nuevo.pug
│   │   └── editar.pug
│   └── tareas/
│       ├── index.pug
│       ├── nueva.pug
│       └── editar.pug
├── 🛡️ middleware/            # Validaciones personalizadas
│   └── validation.js
├── 📊 data/                 # Base de datos JSON
│   ├── areas.json
│   ├── clientes.json
│   ├── empleados.json
│   ├── insumos.json
│   ├── pedidos.json
│   ├── roles.json
│   └── tareas.json
├── 🔄 scripts/               # Utilidades
│   └── normalizar_datos_v1.js
├── ⚙️ package.json          # Dependencias
└── 🚀 app.js               # Servidor Express
```

---

## Instalación

### Prerrequisitos

* **Node.js:** v18 o superior.
* **npm:** v8 o superior (generalmente viene con Node.js).
* **MongoDB Atlas:** Una cuenta y una base de datos creada. Necesitarás la **URI de conexión**.
* **Git:** Para clonar el repositorio.
* **Editor de código:** VS Code recomendado.
* **(Opcional) Cliente API:** Thunder Client (extensión VS Code) o Postman para probar los endpoints API.

### Instalación Paso a Paso

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/sabor-urbano-crud.git](https://github.com/tu-usuario/sabor-urbano-crud.git)
    cd sabor-urbano-crud
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
    Esto instalará Express, Mongoose, Pug, dotenv, etc., listados en `package.json`.

3.  **Configurar Variables de Entorno:**
    * Crea un archivo llamado `.env` en la raíz del proyecto.
    * Añade tu URI de conexión de MongoDB Atlas:
        ```env
        MONGODB_URI=mongodb+srv://tu_usuario:tu_contraseña@tu_cluster.mongodb.net/tu_base_de_datos?retryWrites=true&w=majority
        PORT=3000 # Puedes cambiar el puerto si lo deseas
        ```
    * **Importante:** Asegúrate de que este archivo `.env` esté listado en tu `.gitignore` para no subir tus credenciales.

4.  **Verificar scripts en `package.json`:**
    ```json
    {
      "scripts": {
        "start": "node app.js",
        "dev": "nodemon app.js",
        "test": "echo \"Testing with Thunder Client\""
      }
    }
    ```

5.  **Iniciar el servidor:**
    * **Modo Desarrollo (con auto-recarga):**
        ```bash
        npm run dev
        ```
    * **Modo Producción:**
        ```bash
        npm start
        ```

6.  **Verificar:**
    * La consola debería mostrar "🚀 Servidor corriendo en http://localhost:3000" y "✅ Conexión exitosa a MongoDB Atlas".
    * Abre en tu navegador: `http://localhost:3000` (debería redirigir a `/tareas`).

---

## Uso

### Interfaces Web

Las interfaces web proporcionan una forma visual para gestionar las entidades principales:

| URL                      | Descripción                                     |
| :----------------------- | :---------------------------------------------- |
| `http://localhost:3000`  | Redirige a la gestión de tareas (`/tareas`)     |
| `/tareas`                | Listar, crear y editar Tareas                   |
| `/tareas/nueva`          | Formulario para crear una nueva Tarea           |
| `/tareas/editar/:id`     | Formulario para editar una Tarea existente      |
| `/empleados`             | Listar, crear y editar Empleados                |
| `/empleados/nuevo`       | Formulario para crear un nuevo Empleado         |
| `/empleados/editar/:id`  | Formulario para editar un Empleado existente    |
| `/pedidos`               | Listar, crear y editar Pedidos                  |
| `/pedidos/nuevo`         | Formulario para crear un nuevo Pedido           |
| `/pedidos/editar/:id`    | Formulario para editar un Pedido existente      |
| `/insumos`               | Listar, crear y editar Insumos (Inventario)     |
| `/insumos/nuevo`         | Formulario para crear un nuevo Insumo           |
| `/insumos/editar/:id`    | Formulario para editar un Insumo existente      |
| `/productos`             | Listar, crear y editar Productos                |
| `/productos/nuevo`       | Formulario para crear un nuevo Producto         |
| `/productos/editar/:id`  | Formulario para editar un Producto existente    |
| `/filtros`               | Formulario para aplicar filtros a la lista de Tareas |
| `/tareas/filtrar?query`  | Muestra la lista de Tareas con filtros aplicados |

### API

* **Base URL:** `http://localhost:3000/api`
* **Formato:** JSON
* **Autenticación:** (Actualmente no implementada)

---

## API Endpoints

### Empleados (`/api/empleados`)

| Método   | Endpoint     | Descripción                |
| :------- | :----------- | :------------------------- |
| `GET`    | `/`          | Obtener todos los empleados |
| `GET`    | `/:id`       | Obtener empleado por ID    |
| `POST`   | `/`          | Crear un nuevo empleado    |
| `PUT`    | `/:id`       | Actualizar un empleado     |
| `DELETE` | `/:id`       | Eliminar un empleado       |

### Tareas (`/api/tareas`)

| Método   | Endpoint         | Descripción                                     |
| :------- | :--------------- | :---------------------------------------------- |
| `GET`    | `/`              | Obtener tareas (soporta filtros por query params)|
| `GET`    | `/:id`           | Obtener tarea por ID                            |
| `GET`    | `/area/:area`    | Obtener tareas filtradas por área               |
| `POST`   | `/`              | Crear una nueva tarea                           |
| `PUT`    | `/:id`           | Actualizar una tarea                            |
| `PATCH`  | `/:id/iniciar`   | Marcar tarea como "en\_proceso"                 |
| `PATCH`  | `/:id/finalizar` | Marcar tarea como "finalizada"                  |
| `DELETE` | `/:id`           | Eliminar una tarea                              |

### Pedidos (`/api/pedidos`)

| Método   | Endpoint     | Descripción              |
| :------- | :----------- | :----------------------- |
| `GET`    | `/`          | Obtener todos los pedidos |
| `GET`    | `/:id`       | Obtener pedido por ID    |
| `POST`   | `/`          | Crear un nuevo pedido    |
| `PUT`    | `/:id`       | Actualizar un pedido     |
| `DELETE` | `/:id`       | Eliminar un pedido       |

### Insumos (`/api/insumos`)

| Método   | Endpoint         | Descripción                        |
| :------- | :--------------- | :--------------------------------- |
| `GET`    | `/`              | Obtener todos los insumos          |
| `GET`    | `/bajo-stock`    | Obtener insumos con bajo stock     |
| `GET`    | `/alertas`       | Obtener alertas simplificadas      |
| `GET`    | `/:id`           | Obtener insumo por ID              |
| `POST`   | `/`              | Crear un nuevo insumo              |
| `PUT`    | `/:id`           | Actualizar un insumo               |
| `PATCH`  | `/:id/stock`     | Actualizar solo el stock           |
| `DELETE` | `/:id`           | Eliminar un insumo                 |

### Productos (`/api/productos`)

| Método   | Endpoint     | Descripción               |
| :------- | :----------- | :------------------------ |
| `GET`    | `/`          | Obtener todos los productos |
| `GET`    | `/:id`       | Obtener producto por ID   |
| `POST`   | `/`          | Crear un nuevo producto   |
| `PUT`    | `/:id`       | Actualizar un producto    |
| `DELETE` | `/:id`       | Eliminar un producto      |

---

## Interfaces Web

* **Tareas:** Tabla principal con datos clave (título, estado, prioridad, empleado, pedido). Formularios de creación/edición usan `<select>` populados con empleados y pedidos existentes. La eliminación y actualización se realizan mediante `fetch` a la API.
* **Empleados:** Gestión CRUD tradicional con envíos de formulario directos y redirecciones. Validación de email en el backend.
* **Pedidos:** Formulario dinámico que ajusta campos según tipo (presencial/delivery). Selección de ítems con checkboxes y cálculo de total en frontend. Creación/Actualización mediante `fetch` a las rutas `POST /pedidos/nuevo` y `POST /pedidos/editar/:id`. Eliminación usa `fetch` a la API (`DELETE /api/pedidos/:id`).
* **Insumos:** Formularios y eliminación usan `fetch` para interactuar con la API (`/api/insumos`).
* **Productos:** Formularios y eliminación usan `fetch` para interactuar con la API (`/api/productos`).
* **Filtros:** Formulario que envía parámetros `GET` a `/tareas/filtrar` para recargar la tabla de tareas con los resultados filtrados.

---

## Testing

Se recomienda usar un cliente API como Thunder Client (extensión de VS Code) o Postman para probar los endpoints.

**Ejemplos de Pruebas:**

1.  **Crear Pedido:**
    * `POST http://localhost:3000/api/pedidos`
    * Body (JSON):
        ```json
        {
          "tipo": "delivery",
          "plataforma": "propia",
          "nombreCliente": "Ana Gómez",
          "telefonoCliente": "351-123456",
          "direccionCliente": "Calle Falsa 123",
          "items": {
            "60d5ecf3e7a1b42a9c1b1e9f": { "cantidad": 2 }, // Reemplazar con ObjectId válido de un Producto
            "60d5ecf3e7a1b42a9c1b1ea0": { "cantidad": 1 }  // Reemplazar con ObjectId válido de un Producto
          }
        }
        ```

2.  **Crear Tarea Asociada:**
    * `POST http://localhost:3000/api/tareas`
    * Body (JSON):
        ```json
        {
          "titulo": "Preparar pedido #N", // Ajustar N
          "area": "gestion_pedidos",
          "prioridad": "media",
          "empleadoAsignado": "60d5edcbe7a1b42a9c1b1eb1", // Reemplazar con ObjectId válido de un Empleado
          "pedidoAsociado": "60d5ee1fe7a1b42a9c1b1ec2"   // Reemplazar con ObjectId válido de un Pedido creado
        }
        ```

3.  **Filtrar Tareas Pendientes:**
    * `GET http://localhost:3000/api/tareas?estado=pendiente`

4.  **Actualizar Stock de Insumo:**
    * `PATCH http://localhost:3000/api/insumos/<insumo_object_id>/stock`
    * Body (JSON):
        ```json
        { "nuevoStock": 50 }
        ```

---

## Estructura del Proyecto

### Modelos (POO)
- Clases: `Cliente`, `Empleado`, `Insumo`, `Pedido`, `Tarea`.
- Relaciones:
  - **Cliente-Pedido**: `pedidos.json` usa `clienteId` (valida con `Cliente.getById`).
  - **Tarea-Pedido**: `tareas.json` usa `pedidoAsociado` (valida con `Pedido.getById`).
  - **Tarea-Empleado**: `tareas.json` usa `empleadoAsignado` (valida con `Empleado.getById`).
- Métodos: CRUD (`getAll`, `create`, `update`, `delete`), filtros (`Tarea.filtrar`).

### Controladores
- Manejan lógica (ej: parseo de ítems en `pedidosController.js`).

### Rutas
- API: `/api/:recurso/:id`.
- Vistas: `/:recurso/nueva`, `/:recurso/editar/:id`.

### Middleware
- Validaciones: campos requeridos, email, números, fechas (en `validation.js`).

### Data (JSON)
- **clientes.json**: `{ id, nombre, apellido, email, telefono }`.
- **empleados.json**: `{ id, nombre, apellido, email, telefono, rol, area, fechaIngreso }`.
- **pedidos.json**: `{ id, numeroOrden, clienteId, items, total, tipo, plataforma, estado, fechaCreacion, tiempoEstimado, observaciones }`.
- **insumos.json**: `{ id, nombre, categoria, stock, stockMinimo, unidadMedida, proveedor, ultimaActualizacion, estado }`.
- **tareas.json**: `{ id, titulo, descripcion, area, estado, prioridad, empleadoAsignado, pedidoAsociado, observaciones, fechaCreacion, fechaInicio, fechaFinalizacion }`.
- **roles.json**, **areas.json**: Validación de formularios.

---

## Tecnologías

* **Backend:** Node.js (v18+), Express.js
* **Base de Datos:** MongoDB Atlas
* **ODM:** Mongoose
* **Motor de Plantillas:** Pug
* **Frontend Framework:** Bootstrap 5
* **Iconos:** Font Awesome 6
* **Variables de Entorno:** dotenv
* **Desarrollo:** Nodemon

---

## Ejemplos (cURL)

* **Crear Empleado:**
    ```bash
    curl -X POST http://localhost:3000/api/empleados -H "Content-Type: application/json" -d '{"nombre":"Juan","apellido":"Doe","email":"juan@example.com","telefono":"11-1234-5678","rol":"cocinero","area":"cocina"}'
    ```
* **Obtener Tareas Pendientes:**
    ```bash
    curl http://localhost:3000/api/tareas?estado=pendiente
    ```
* **Actualizar Stock:**
    ```bash
    curl -X PATCH http://localhost:3000/api/insumos/<ObjectIdDelInsumo>/stock -H "Content-Type: application/json" -d '{"nuevoStock": 100}'
    ```

---

## Contribución

1.  Haz un Fork del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3.  Realiza tus cambios y haz commit (`git commit -m 'Añade nueva funcionalidad X'`).
4.  Empuja la rama (`git push origin feature/nueva-funcionalidad`).
5.  Abre un Pull Request.

---

## Licencia

[MIT](LICENSE)

---

## Responsabilidades del Equipo (Ejemplo - Ajustar según corresponda)

* **Juan Dualibe (Project Manager):** Coordinación, asignación de tareas, seguimiento, pruebas iniciales.
* **Nicolás Weibel (Backend Lead / Arquitecto):** Diseño de arquitectura, estructura de carpetas, rutas API, middlewares de validación.
* **Germán Rodríguez (Database & Models):** Diseño de Schemas Mongoose (`models/`), lógica de relaciones (`ref`, `populate`), configuración de conexión (`db.js`).
* **Rocío Gómez (API & Controller Developer):** Implementación de lógica en controladores (`controllers/`), conexión con modelos, manejo de respuestas API.
* **Juan Manuel Gasbarro (Frontend & Views / Tester):** Desarrollo de vistas Pug (`views/`), integración con Bootstrap, scripting frontend (`fetch`), pruebas funcionales y de API.

---

## Bibliografía

* Documentación Oficial Node.js: [https://nodejs.org/docs](https://nodejs.org/docs)
* Express.js Guide: [https://expressjs.com/](https://expressjs.com/)
* Mongoose ODM: [https://mongoosejs.com/docs/guide.html](https://mongoosejs.com/docs/guide.html)
* Pug Template Engine: [https://pugjs.org/](https://pugjs.org/)
* Bootstrap Documentation: [https://getbootstrap.com/docs/5.1/](https://getbootstrap.com/docs/5.1/)
* MDN Web Docs (Fetch API, Async/Await): [https://developer.mozilla.org/](https://developer.mozilla.org/)
* MongoDB Compass Documentation: [https://www.mongodb.com/docs/compass/](https://www.mongodb.com/docs/compass/)
* MongoDB Atlas Documentation: [https://www.mongodb.com/docs/atlas/](https://www.mongodb.com/docs/atlas/)