
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

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

// Ruta para usuarios que iniciaron sesión
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

// Ruta exclusiva para administradores
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página principal */}
        <Route
          path="/"
          element={<IniPagina />}
        />

        {/* Autenticación */}
        <Route
          path="/iniciar-sesion"
          element={<IniSesionPagina />}
        />

        <Route
          path="/registro"
          element={<RegistroPagina />}
        />

        <Route
          path="/recuperar-contrasena"
          element={<RecuperarContrasenaPagina />}
        />

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
