const truncateToDate = require("./truncateToDate")

async function budgetProjectionCalculator(budget) {
  const today = truncateToDate(new Date())
  const start = truncateToDate(new Date(budget.fechaInicio))
  const end = truncateToDate(new Date(budget.fechaFin))

  const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24) + 1)
  const daysPassed = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1

  const actualExpense = budget.PresupuestoCategoria.reduce(
    (sum, cat) => sum + cat.gastado,
    0,
  )

  const dailyAverageExpense =
    daysPassed > 0 ? actualExpense / daysPassed : actualExpense

  const projectedTotalExpense = dailyAverageExpense * totalDays

  const expenseOverBudget =
    budget.monto > 0 ? (projectedTotalExpense / budget.monto) * 100 : 0

  return {
    actualExpense,
    daysPassed,
    totalDays,
    dailyAverageExpense,
    projectedTotalExpense,
    expenseOverBudget,
  }
}

module.exports = budgetProjectionCalculator
