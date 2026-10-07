import "dotenv/config";

import cors from "cors";
import express from "express";

import rutasAutenticacion from "./rutas/autenticacion.js";
import rutasCategorias from "./rutas/categorias.js";
import rutasLibros from "./rutas/libros.js";
import rutasPerfil from "./rutas/perfil.js";
import rutasUbicaciones from "./rutas/ubicaciones.js";

const app = express();

const puerto = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_peticion, respuesta) => {
  return respuesta.json({
    mensaje:
      "API de LibroLibre funcionando correctamente",
    estado: "ok",
  });
});

app.get("/api/salud", (_peticion, respuesta) => {
  return respuesta.json({
    mensaje: "Servidor activo",
    estado: "ok",
    fecha: new Date().toISOString(),
  });
});

app.use(
  "/api/auth",
  rutasAutenticacion,
);

app.use(
  "/api/perfil",
  rutasPerfil,
);

app.use(
  "/api/categorias",
  rutasCategorias,
);

app.use(
  "/api/ubicaciones",
  rutasUbicaciones,
);

app.use(
  "/api/libros",
  rutasLibros,
);

app.listen(puerto, () => {
  console.log(
    `Servidor de LibroLibre ejecutándose en http://localhost:${puerto}`,
  );
});