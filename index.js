
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();
const conversationHistory: Array<{
  role: "user" | "assistant";
  content: string;
}> = [];

// Definición de herramientas para el simulador de portafolio
const tools: Anthropic.Tool[] = [
  {
    name: "create_portfolio",
    description:
      "Crea un nuevo portafolio de inversión con un nombre y presupuesto inicial",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Nombre del portafolio",
        },
        initial_balance: {
          type: "number",
          description: "Balance inicial en dólares",
        },
      },
      required: ["name", "initial_balance"],
    },
  },
  {
    name: "add_investment",
    description: "Añade una inversión al portafolio",
    input_schema: {
      type: "object" as const,
      properties: {
        ticker: {
          type: "string",
          description: "Símbolo del activo (ej: AAPL, BTC, GOLD)",
        },
        quantity: {
          type: "number",
          description: "Cantidad de unidades a comprar",
        },
        purchase_price: {
          type: "number",
          description: "Precio de compra por unidad",
        },
      },
      required: ["ticker", "quantity", "purchase_price"],
    },
  },
  {
    name: "update_price",
    description: "Actualiza el precio actual de un activo en el portafolio",
    input_schema: {
      type: "object" as const,
      properties: {
        ticker: {
          type: "string",
          description: "Símbolo del activo",
        },
        current_price: {
          type: "number",
          description: "Precio actual del activo",
        },
      },
      required: ["ticker", "current_price"],
    },
  },
  {
    name: "get_portfolio_summary",
    description: "Obtiene un resumen del portafolio actual con valores",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_performance_analysis",
    description: "Analiza el rendimiento del portafolio con estadísticas",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "generate_ascii_chart",
    description: "Genera un gráfico ASCII del portafolio",
    input_schema: {
      type: "object" as const,
      properties: {
        chart_type: {
          type: "string",
          enum: ["pie", "bar", "line"],
          description: "Tipo de gráfico a generar",
        },
      },
      required: ["chart_type"],
    },
  },
];

// Estado del simulador
interface Investment {
  ticker: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
}

interface Portfolio {
  name: string;
  initial_balance: number;
  current_balance: number;
  investments: Investment[];
  created_at: Date;
}

let portfolio: Portfolio | null = null;

// Funciones del simulador
function createPortfolio(name: string, initialBalance: number): string {
  portfolio = {
    name,
    initial_balance: initialBalance,
    current_balance: initialBalance,
    investments: [],
    created_at: new Date(),
  };
  return `Portafolio "${name}" creado exitosamente con balance inicial de $${initialBalance.toFixed(2)}`;
}

function addInvestment(
  ticker: string,
  quantity: number,
  purchasePrice: number
): string {
  if (!portfolio) {
    return "Error: No hay portafolio creado";
  }

  const investmentCost = quantity * purchasePrice;
  if (investmentCost > portfolio.current_balance) {
    return `Error: Fondos insuficientes. Necesitas $${investmentCost.toFixed(2)}, tienes $${portfolio.current_balance.toFixed(2)}`;
  }

  const existingInvestment = portfolio.investments.find(
    (inv) => inv.ticker === ticker
  );
  if (existingInvestment) {
    existingInvestment.quantity += quantity;
    existingInvestment.purchase_price =
      (existingInvestment.purchase_price * (existingInvestment.quantity - quantity) +
        purchasePrice * quantity) /
      existingInvestment.quantity;
  } else {
    portfolio.investments.push({
      ticker,
      quantity,
      purchase_price: purchasePrice,
      current_price: purchasePrice,
    });
  }

  portfolio.current_balance -= investmentCost;
  return `Inversión agregada: ${quantity} unidades de ${ticker} a $${purchasePrice.toFixed(2)} por unidad. Balance restante: $${portfolio.current_balance.toFixed(2)}`;
}

function updatePrice(ticker: string, currentPrice: number): string {
  if (!portfolio) {
    return "Error: No hay portafolio creado";
  }

  const investment = portfolio.investments.find((inv) => inv.ticker === ticker);
  if (!investment) {
    return `Error: ${ticker} no encontrado en el portafolio`;
  }

  const oldPrice = investment.current_price;
  investment.current_price = currentPrice;
  const change = ((currentPrice - oldPrice) / oldPrice) * 100;

  return `Precio de ${ticker}