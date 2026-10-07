import { Router } from "express";
import {
  estadosMexico,
  obtenerCiudadesPorEstado,
  obtenerMunicipiosPorCiudad,
  obtenerUbicacionPorCodigoPostal,
} from "../intermedios/Ubicaciones.js";

const router = Router();

/*
  GET /api/ubicaciones/estados

  Devuelve todos los estados con sus ciudades y municipios.
*/
router.get("/estados", (_peticion, respuesta) => {
  return respuesta.json({
    estados: estadosMexico,
  });
});

/*
  GET /api/ubicaciones/estados/:nombreEstado/ciudades

  Ejemplo:
  GET /api/ubicaciones/estados/Jalisco/ciudades
*/
router.get(
  "/estados/:nombreEstado/ciudades",
  (peticion, respuesta) => {
    const nombreEstado = decodeURIComponent(
      peticion.params.nombreEstado,
    );

    const ciudades = obtenerCiudadesPorEstado(nombreEstado);

    if (ciudades.length === 0) {
      return respuesta.status(404).json({
        mensaje: "No se encontraron ciudades para ese estado.",
      });
    }

    return respuesta.json({
      estado: nombreEstado,
      ciudades,
    });
  },
);

/*
  GET /api/ubicaciones/estados/:nombreEstado/ciudades/:nombreCiudad/municipios

  Ejemplo:
  GET /api/ubicaciones/estados/Jalisco/ciudades/Guadalajara/municipios
*/
router.get(
  "/estados/:nombreEstado/ciudades/:nombreCiudad/municipios",
  (peticion, respuesta) => {
    const nombreEstado = decodeURIComponent(
      peticion.params.nombreEstado,
    );

    const nombreCiudad = decodeURIComponent(
      peticion.params.nombreCiudad,
    );

    const municipios = obtenerMunicipiosPorCiudad(
      nombreEstado,
      nombreCiudad,
    );

    if (municipios.length === 0) {
      return respuesta.status(404).json({
        mensaje:
          "No se encontraron municipios para esa ciudad y estado.",
      });
    }

    return respuesta.json({
      estado: nombreEstado,
      ciudad: nombreCiudad,
      municipios,
    });
  },
);

/*
  GET /api/ubicaciones/codigo-postal/:codigoPostal

  Ejemplos:
  GET /api/ubicaciones/codigo-postal/48500
  GET /api/ubicaciones/codigo-postal/44100
*/
router.get(
  "/codigo-postal/:codigoPostal",
  (peticion, respuesta) => {
    const codigoPostal = peticion.params.codigoPostal;

    const ubicacion = obtenerUbicacionPorCodigoPostal(
      codigoPostal,
    );

    if (!ubicacion) {
      return respuesta.status(404).json({
        mensaje:
          "No se encontró una ubicación para ese código postal.",
      });
    }

    return respuesta.json({
      codigoPostal: codigoPostal
        .replace(/\D/g, "")
        .slice(0, 5),
      ...ubicacion,
    });
  },
);

export default router;