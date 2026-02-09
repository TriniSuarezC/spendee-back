const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  const usuarioId = "bOFKK41rJNZRpA49W0klQsuvKqb2"

  // 1️⃣ Crear categorías base
  const categorias = await prisma.categorias.createMany({
    data: [
      {
        usuarioId,
        nombre: "Comida",
        icono: "🍔",
        color: "#FF7043",
      },
      {
        usuarioId,
        nombre: "Transporte",
        icono: "🚗",
        color: "#42A5F5",
      },
      {
        usuarioId,
        nombre: "Ocio",
        icono: "🎮",
        color: "#AB47BC",
      },
    ],
  })

  const categoriasDB = await prisma.categorias.findMany({
    where: { usuarioId },
  })

  const presupuestos = [
    {
      fechaInicio: new Date("2026-01-01"),
      fechaFin: new Date("2026-01-10"),
      monto: 100000,
    },
    {
      fechaInicio: new Date("2026-01-11"),
      fechaFin: new Date("2026-01-15"),
      monto: 60000,
    },
    {
      fechaInicio: new Date("2026-01-16"),
      fechaFin: new Date("2026-01-31"),
      monto: 140000,
    },
    {
      fechaInicio: new Date("2025-12-11"),
      fechaFin: new Date("2025-12-15"),
      monto: 50000,
    },
    {
      fechaInicio: new Date("2025-12-16"),
      fechaFin: new Date("2025-12-30"),
      monto: 120000,
    },
  ]

  // 2️⃣ Crear presupuestos
  for (const presupuesto of presupuestos) {
    await prisma.presupuesto.create({
      data: {
        usuarioId,
        monto: presupuesto.monto,
        fechaInicio: presupuesto.fechaInicio,
        fechaFin: presupuesto.fechaFin,
        PresupuestoCategoria: {
          create: categoriasDB.map((cat) => ({
            categoriaId: cat.id,
            monto: Math.floor(presupuesto.monto / categoriasDB.length),
          })),
        },
      },
    })
  }

  console.log("✅ Seed de presupuestos creada correctamente")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
