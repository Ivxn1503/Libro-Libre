
import "dotenv/config";

import cors from "cors";
import express from "express";

import rutasAdmin from "./rutas/admin.js";
import rutasAutenticacion from "./rutas/autenticacion.js";
import rutasCategorias from "./rutas/categorias.js";
import rutasLibros from "./rutas/libros.js";
import rutasPerfil from "./rutas/perfil.js";
import rutasUbicaciones from "./rutas/ubicaciones.js";
import rutasSolicitudes from "./rutas/solicitudes.js";

const app = express();

const puerto = Number(process.env.PORT) || 3000;

// Configuración general
app.use(cors());
app.use(express.json());

app.use("/api/solicitudes", rutasSolicitudes);

app.use(express.urlencoded({ extended: true }));

// Ruta principal
app.get("/", (_peticion, respuesta) => {
  return respuesta.json({
    mensaje: "API de LibroLibre funcionando correctamente",
    estado: "ok",
  });
});

// Estado del servidor
app.get("/api/salud", (_peticion, respuesta) => {
  return respuesta.json({
    mensaje: "Servidor activo",
    estado: "ok",
    fecha: new Date().toISOString(),
  });
});

// Autenticación
app.use("/api/auth", rutasAutenticacion);

// Perfil
app.use("/api/perfil", rutasPerfil);

// Categorías
app.use("/api/categorias", rutasCategorias);

// Ubicaciones
app.use("/api/ubicaciones", rutasUbicaciones);

// Libros
app.use("/api/libros", rutasLibros);

// Administración
app.use("/api/admin", rutasAdmin);

// Iniciar servidor
app.listen(puerto, () => {
  console.log(
    `Servidor de LibroLibre ejecutándose en http://localhost:${puerto}`,
  );
});
