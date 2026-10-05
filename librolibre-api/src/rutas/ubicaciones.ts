import { Router } from "express";
import {
  estadosMexico,
  obtenerCiudadesPorEstado,
} from "../intermedios/Ubicaciones.js";

const router = Router();

router.get("/estados", (_peticion, respuesta) => {
  respuesta.json({
    estados: estadosMexico,
  });
});

router.get(
  "/estados/:nombreEstado/ciudades",
  (peticion, respuesta) => {
    const nombreEstado = decodeURIComponent(
      peticion.params.nombreEstado,
    );

    const ciudades =
      obtenerCiudadesPorEstado(nombreEstado);

    respuesta.json({
      ciudades,
    });
  },
);

export default router;