import "dotenv/config";

import cors from "cors";
import express from "express";

import {
  requiereAutenticacion,
  type PeticionAutenticada,
} from "./intermedios/autenticacion.js";
import rutasAutenticacion from "./rutas/autenticacion.js";
import rutasCategorias from "./rutas/categorias.js";
import rutasLibros from "./rutas/libros.js";

const app = express();

const puerto = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_peticion, respuesta) => {
  return respuesta.json({
    mensaje: "API de LibroLibre funcionando correctamente",
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

app.use("/api/auth", rutasAutenticacion);
app.use("/api/categorias", rutasCategorias);
app.use("/api/libros", rutasLibros);

app.get(
  "/api/perfil",
  requiereAutenticacion,
  (peticion: PeticionAutenticada, respuesta) => {
    return respuesta.json({
      mensaje: "Acceso autorizado al perfil.",
      usuario: peticion.usuario,
    });
  },
);

app.listen(puerto, () => {
  console.log(
    `Servidor de LibroLibre ejecutándose en http://localhost:${puerto}`,
  );
});