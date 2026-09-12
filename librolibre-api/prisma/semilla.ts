import "dotenv/config";

import prisma from "../src/prisma.js";

const categorias = [
  {
    nombre: "Literatura",
    descripcion: "Obras literarias y narrativas.",
    icono: "book-open",
  },
  {
    nombre: "Novela",
    descripcion: "Novelas de distintos géneros.",
    icono: "book",
  },
  {
    nombre: "Ciencia",
    descripcion: "Libros científicos y de divulgación.",
    icono: "brain",
  },
  {
    nombre: "Tecnología",
    descripcion: "Programación, informática y tecnología.",
    icono: "code",
  },
  {
    nombre: "Negocios",
    descripcion: "Administración, negocios y emprendimiento.",
    icono: "briefcase",
  },
  {
    nombre: "Educación",
    descripcion: "Material educativo y académico.",
    icono: "graduation-cap",
  },
  {
    nombre: "Filosofía",
    descripcion: "Pensamiento, ética y filosofía.",
    icono: "lightbulb",
  },
  {
    nombre: "Psicología",
    descripcion: "Psicología y desarrollo humano.",
    icono: "heart",
  },
  {
    nombre: "Infantil",
    descripcion: "Libros para niñas y niños.",
    icono: "smile",
  },
  {
    nombre: "Juvenil",
    descripcion: "Literatura para jóvenes.",
    icono: "users",
  },
  {
    nombre: "Arte",
    descripcion: "Pintura, música, diseño y expresiones artísticas.",
    icono: "palette",
  },
  {
    nombre: "Cocina",
    descripcion: "Recetas y gastronomía.",
    icono: "utensils",
  },
  {
    nombre: "Biografías",
    descripcion: "Historias y vidas de personas destacadas.",
    icono: "user",
  },
  {
    nombre: "Otros",
    descripcion: "Libros que no pertenecen a otra categoría.",
    icono: "book-open",
  },
];

async function ejecutarSemilla() {
  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: {
        nombre: categoria.nombre,
      },
      update: {
        descripcion: categoria.descripcion,
        icono: categoria.icono,
        activa: true,
      },
      create: categoria,
    });
  }

  console.log("Categorías iniciales creadas correctamente.");
}

ejecutarSemilla()
  .catch((error) => {
    console.error("Error al crear categorías:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });