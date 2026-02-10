import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const USER_ID = "your-user-id-here" // Reemplaza con el ID del usuario al que quieres asignar los datos

async function main() {
  console.log("🌱 Seedeando datos históricos...")

  // 1️⃣ Obtener categorías
  const categorias = await prisma.categorias.findMany({
    where: { usuarioId: "0" }, // o USER_ID si las clonas por usuario
  })

  const categoriaByName = (name: string) =>
    categorias.find((c) => c.nombre === name)?.id

  // Helpers de fechas
  const monthsAgo = (n: number) => {
    const d = new Date()
    d.setMonth(d.getMonth() - n)
    return d
  }

  // 2️⃣ INGRESOS HISTÓRICOS
  await prisma.ingreso.createMany({
    data: [
      {
        usuarioId: USER_ID,
        ingreso: 350000,
        montoAnterior: 0,
        fecha: monthsAgo(3),
      },
      {
        usuarioId: USER_ID,
        ingreso: 380000,
        montoAnterior: 350000,
        fecha: monthsAgo(2),
      },
      {
        usuarioId: USER_ID,
        ingreso: 420000,
        montoAnterior: 380000,
        fecha: monthsAgo(1),
      },
    ],
  })

  // 3️⃣ GASTOS HISTÓRICOS
  await prisma.gasto.createMany({
    data: [
      {
        usuarioId: USER_ID,
        gasto: 45000,
        montoAnterior: 0,
        categoriaId: categoriaByName("Comida")!,
        fecha: monthsAgo(3),
      },
      {
        usuarioId: USER_ID,
        gasto: 18000,
        montoAnterior: 0,
        categoriaId: categoriaByName("Transporte")!,
        fecha: monthsAgo(3),
      },
      {
        usuarioId: USER_ID,
        gasto: 32000,
        montoAnterior: 0,
        categoriaId: categoriaByName("Entretenimiento")!,
        fecha: monthsAgo(2),
      },
      {
        usuarioId: USER_ID,
        gasto: 60000,
        montoAnterior: 0,
        categoriaId: categoriaByName("Hogar")!,
        fecha: monthsAgo(2),
      },
      {
        usuarioId: USER_ID,
        gasto: 25000,
        montoAnterior: 0,
        categoriaId: categoriaByName("Salud")!,
        fecha: monthsAgo(1),
      },
    ],
  })

  // 4️⃣ PRESUPUESTOS HISTÓRICOS (sin pisar fechas)
  await prisma.presupuesto.create({
    data: {
      usuarioId: USER_ID,
      monto: 150000,
      fechaInicio: new Date("2025-10-01"),
      fechaFin: new Date("2025-10-31"),
      PresupuestoCategoria: {
        create: [
          {
            categoriaId: categoriaByName("Comida")!,
            monto: 70000,
          },
          {
            categoriaId: categoriaByName("Transporte")!,
            monto: 30000,
          },
          {
            categoriaId: categoriaByName("Entretenimiento")!,
            monto: 50000,
          },
        ],
      },
    },
  })

  await prisma.presupuesto.create({
    data: {
      usuarioId: USER_ID,
      monto: 180000,
      fechaInicio: new Date("2025-11-01"),
      fechaFin: new Date("2025-11-30"),
      PresupuestoCategoria: {
        create: [
          {
            categoriaId: categoriaByName("Comida")!,
            monto: 80000,
          },
          {
            categoriaId: categoriaByName("Hogar")!,
            monto: 60000,
          },
          {
            categoriaId: categoriaByName("Otros")!,
            monto: 40000,
          },
        ],
      },
    },
  })
  await prisma.presupuesto.create({
    data: {
      usuarioId: USER_ID,
      monto: 180000,
      fechaInicio: new Date("2025-12-01"),
      fechaFin: new Date("2025-12-30"),
      PresupuestoCategoria: {
        create: [
          {
            categoriaId: categoriaByName("Comida")!,
            monto: 80000,
          },
          {
            categoriaId: categoriaByName("Hogar")!,
            monto: 60000,
          },
          {
            categoriaId: categoriaByName("Otros")!,
            monto: 40000,
          },
        ],
      },
    },
  })
  await prisma.presupuesto.create({
    data: {
      usuarioId: USER_ID,
      monto: 180000,
      fechaInicio: new Date("2026-01-01"),
      fechaFin: new Date("2026-01-30"),
      PresupuestoCategoria: {
        create: [
          {
            categoriaId: categoriaByName("Comida")!,
            monto: 80000,
          },
          {
            categoriaId: categoriaByName("Hogar")!,
            monto: 60000,
          },
          {
            categoriaId: categoriaByName("Otros")!,
            monto: 40000,
          },
        ],
      },
    },
  })
  await prisma.presupuesto.create({
    data: {
      usuarioId: USER_ID,
      monto: 180000,
      fechaInicio: new Date("2026-02-01"),
      fechaFin: new Date("2026-02-28"),
      PresupuestoCategoria: {
        create: [
          {
            categoriaId: categoriaByName("Comida")!,
            monto: 80000,
          },
          {
            categoriaId: categoriaByName("Hogar")!,
            monto: 60000,
          },
          {
            categoriaId: categoriaByName("Otros")!,
            monto: 40000,
          },
        ],
      },
    },
  })

  console.log("✅ Seed completada")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
