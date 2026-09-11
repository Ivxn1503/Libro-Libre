import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

function NoEncontradoPagina() {
  return (
    <main className="not-found-page">
      <BookOpen size={55} />

      <h1>Página no encontrada</h1>

      <p>La página que buscas no existe o fue movida.</p>

      <Link className="button button-primary" to="/">
        Volver al inicio
      </Link>
    </main>
  );
}

export default NoEncontradoPagina;