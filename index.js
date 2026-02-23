const serverless = require("serverless-http")
const express = require("express")
const validateToken = require("./middleware/validateToken")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
const app = express()

app.use(express.json())

const apiRouter = require("./routes/api.js")
app.use("/api", apiRouter)

const oauthRouter = require("./oauth/routes.js")
app.use("/oauth", oauthRouter)

const cron = require("./routes/cron.js")
app.use("/cron", cron)

const piggyRouter = require("./piggy/routes.js")
app.use("/piggy", piggyRouter)

const expenseRouter = require("./routes/expenses/expense.js")
app.use("/expense", expenseRouter)

const categoryRouter = require("./routes/category/category.js")
app.use("/categories", categoryRouter)

const incomesRouter = require("./routes/incomes/incomes.js")
app.use("/income", incomesRouter)

const balanceRouter = require("./routes/balance/balance.js")
app.use("/balance", balanceRouter)

const budgetRouter = require("./routes/budget/budget.js")
app.use("/budget", budgetRouter)

app.get("/", (req, res) => {
  res.status(200).send("Spendee API is running")
})

app.get("/test-jwt", validateToken, (req, res) => {
  res.json({
    message: "JWT válido!",
    usuario: req.usuario,
  })
})

app.get("/racha", validateToken, async (req, res) => {
  const userIdFromToken = req.user?.sub || req.user?.user_id || req.user?.uid
  try {
    let racha = await prisma.racha.findUnique({
      where: { usuarioId: userIdFromToken },
    })
    if (!racha) {
      console.log("No se encontró racha, creando una nueva con valor 0")
      racha = await prisma.racha.create({
        data: {
          usuarioId: userIdFromToken,
          rachaActual: 0,
          ultimaFecha: (() => {
            const ayer = new Date()
            ayer.setDate(ayer.getDate() - 1)
            return ayer
          })(),
          isInactive: true,
        },
      })
    }
    res.status(200).json(racha)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.get("/", (req, res) => {
  res.status(200).send("Spendee API is running")
})

const PORT = process.env.PORT || 3000
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`)
  })
}

module.exports = serverless(app)
// module.exports = app
