import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import IniPagina from "./Paginas/IniPagina";
import IniSesionPagina from "./Paginas/IniSesionPagina";
import RegistroPagina from "./Paginas/RegistroPagina";
import PublicarLibroPag from "./Paginas/PublicarLibroPag";
import DetalleLibroPag from "./Paginas/DetalleLibroPag";
import NoEncontradoPagina from "./Paginas/NoEncontradoPagina";

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
          path="/publicar-libro"
          element={<PublicarLibroPag />}
        />

        <Route
          path="/libros/:id"
          element={<DetalleLibroPag />}
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