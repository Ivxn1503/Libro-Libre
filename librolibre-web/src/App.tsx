
import { useEffect } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import { URL_API } from "./config";

// Páginas principales
import IniPagina from "./Paginas/IniPagina";
import IniSesionPagina from "./Paginas/IniSesionPagina";
import RegistroPagina from "./Paginas/RegistroPagina";
import RecuperarContrasenaPagina from "./Paginas/RecuperarContrasenaPagina.tsx";
import RestablecerContrasenaPagina from "./Paginas/RestablecerContrasenaPagina.tsx";
import PublicarLibroPag from "./Paginas/PublicarLibroPag";
import DetalleLibroPag from "./Paginas/DetalleLibroPag";
import PerfilPagina from "./Paginas/PerfilPagina.tsx";
import EditarLibroPag from "./Paginas/EditarLibroPag";
import NoEncontradoPagina from "./Paginas/NoEncontradoPagina";

// Panel de administración
import IniAdmin from "./Admin/IniAdmin";

/* 
   RUTA PROTEGIDA
   Solo permite entrar si existe una sesión.
   El backend verifica que la cuenta siga activa.
    */

function RutaProtegida({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <Navigate
        to="/iniciar-sesion"
        replace
      />
    );
  }

  return children;
}

/* 
   RUTA DE ADMINISTRADOR
   Restringe el acceso visual al panel administrativo.
   El backend verifica los permisos reales.
    */

function RutaAdministrador({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = localStorage.getItem("token");
  const usuarioGuardado = localStorage.getItem("usuario");

  if (!token || !usuarioGuardado) {
    return (
      <Navigate
        to="/iniciar-sesion"
        replace
      />
    );
  }

  try {
    const usuario = JSON.parse(usuarioGuardado);

    if (usuario?.rol !== "ADMINISTRADOR") {
      return <Navigate to="/" replace />;
    }
  } catch {
    return (
      <Navigate
        to="/iniciar-sesion"
        replace
      />
    );
  }

  return children;
}

/* 
   VIGILANCIA DE SESIÓN
    */

function VigilanciaSesion() {
  const navegar = useNavigate();

  useEffect(() => {
    let activo = true;
    let comprobando = false;

    const cerrarSesionBloqueada = (token: string) => {
      // Evita cerrar una sesión nueva por una respuesta antigua.
      if (localStorage.getItem("token") !== token) {
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      window.alert(
        "Tu cuenta ha sido bloqueada o desactivada. " +
          "Se ha cerrado tu sesión."
      );

      navegar("/", { replace: true });

      // Actualiza todos los componentes que utilizan
      // información de sesión desde localStorage.
      window.location.reload();
    };

    const verificarSesion = async () => {
      const token = localStorage.getItem("token");

      // Los visitantes pueden navegar sin autenticarse.
      if (!token || comprobando) {
        return;
      }

      comprobando = true;

      try {
        const respuesta = await fetch(
          `${URL_API}/api/perfil`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!activo) {
          return;
        }

        if (respuesta.status === 403) {
          const datos = await respuesta.json();

          if (datos.codigo === "CUENTA_NO_ACTIVA") {
            cerrarSesionBloqueada(token);
          }
        }
      } catch (error) {
        // Un problema de conexión no debe cerrar
        // automáticamente la sesión del usuario.
        console.error(
          "No fue posible verificar la sesión:",
          error
        );
      } finally {
        comprobando = false;
      }
    };

    // Primera comprobación al abrir la aplicación.
    void verificarSesion();

    // Comprobación periódica.
    const intervalo = window.setInterval(() => {
      void verificarSesion();
    }, 30000);

    // Comprobar al volver a la pestaña.
    const verificarAlVolver = () => {
      if (document.visibilityState === "visible") {
        void verificarSesion();
      }
    };

    document.addEventListener(
      "visibilitychange",
      verificarAlVolver
    );

    return () => {
      activo = false;

      window.clearInterval(intervalo);

      document.removeEventListener(
        "visibilitychange",
        verificarAlVolver
      );
    };
  }, [navegar]);

  return null;
}

/* 
   APLICACIÓN PRINCIPAL
    */

function App() {
  return (
    <BrowserRouter>
      {/* Verificación automática de sesión */}
      <VigilanciaSesion />

      <Routes>
        {/* Página principal */}
        <Route
          path="/"
          element={<IniPagina />}
        />

        {/* Inicio de sesión */}
        <Route
          path="/iniciar-sesion"
          element={<IniSesionPagina />}
        />

        {/* Registro */}
        <Route
          path="/registro"
          element={<RegistroPagina />}
        />

        {/* Recuperación de contraseña */}
        <Route
          path="/recuperar-contrasena"
          element={<RecuperarContrasenaPagina />}
        />

        {/* Restablecimiento de contraseña */}
        <Route
          path="/restablecer-contrasena/:token"
          element={<RestablecerContrasenaPagina />}
        />

        {/* Publicar libro */}
        <Route
          path="/publicar-libro"
          element={
            <RutaProtegida>
              <PublicarLibroPag />
            </RutaProtegida>
          }
        />

        {/* Editar libro */}
        <Route
          path="/libros/:id/editar"
          element={
            <RutaProtegida>
              <EditarLibroPag />
            </RutaProtegida>
          }
        />

        {/* Detalle de libro */}
        <Route
          path="/libros/:id"
          element={<DetalleLibroPag />}
        />

        {/* Perfil de usuario */}
        <Route
          path="/app"
          element={
            <RutaProtegida>
              <PerfilPagina />
            </RutaProtegida>
          }
        />

        {/* Panel de administración */}
        <Route
          path="/admin"
          element={
            <RutaAdministrador>
              <IniAdmin />
            </RutaAdministrador>
          }
        />

        {/* Página no encontrada */}
        <Route
          path="*"
          element={<NoEncontradoPagina />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
