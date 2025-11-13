# Migración a MongoDB Atlas

**Equipo:** Tree Group  
**Objetivo:** Migrar la persistencia de datos del proyecto de archivos JSON a MongoDB Atlas.

## Primeros pasos

1. Se creó archivo `.gitignore` para excluir `.env` y `node_modules`.
2. Se agregó `db.js` junto a `app.js` para manejar la conexión a MongoDB Atlas.
3. Se configuró MongoDB Atlas:
   - Clúster gratuito
   - Usuario con permisos de lectura/escritura
   - Acceso habilitado desde cualquier IP
4. Se documenta que el archivo `.env` **no se sube al repositorio** y se entregará al docente por privado.

## Paso 1: Migrar a MongoDB (general)

- Persistencia de datos reemplazada de archivos JSON a **MongoDB Atlas**.
- Se crearon los **modelos Mongoose** en `models/`.
- Controladores (`controllers/`) actualizados para trabajar con Mongoose.
- Rutas (`routes/`) adaptadas a los nuevos controladores y aplicando **ValidationMiddleware**.
- Middlewares existentes (validación, logs, headers, manejo de errores) se mantienen funcionando.
- Vistas Pug consumen los datos desde los controladores actualizados.

## Paso 2: Actualizar vistas Pug (pendiente)

- Próximo paso: adaptar las vistas Pug para que consuman datos directamente desde MongoDB a través de los nuevos controladores.
- Se revisará que los formularios POST/PUT envíen datos correctos y que las tablas/listados reflejen la información real de la base de datos.
- Se aplicará validación y sanitización usando `ValidationMiddleware` en las rutas correspondientes.

## Estructura final del proyecto (MongoDB)