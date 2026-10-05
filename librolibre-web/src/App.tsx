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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<IniPagina />}
        />

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
          element={
            <RecuperarContrasenaPagina />
          }
        />

        <Route
          path="/restablecer-contrasena/:token"
          element={
            <RestablecerContrasenaPagina />
          }
        />

        <Route
          path="/publicar-libro"
          element={
            <RutaProtegida>
              <PublicarLibroPag />
            </RutaProtegida>
          }
        />

        <Route
          path="/libros/:id/editar"
          element={
            <RutaProtegida>
              <EditarLibroPag />
            </RutaProtegida>
          }
        />

        <Route
          path="/libros/:id"
          element={<DetalleLibroPag />}
        />

        <Route
          path="/app"
          element={
            <RutaProtegida>
              <PerfilPagina />
            </RutaProtegida>
          }
        />

        <Route
          path="*"
          element={<NoEncontradoPagina />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;