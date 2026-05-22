# Recipe: Loja Online

> **Use Case:** Pequena loja virtual que gerencia produtos, pedidos e clientes.
> **Substitui:** Shopify básico, planilha de estoque, planilha de pedidos
> **Perfil de Usuário:** Lojista, artesão, pequeno fabricante, brechó online

## Visão Geral

Este recipe transforma o workspace em um sistema completo de e-commerce leve. Com Collections para produtos, pedidos e clientes, Views para vitrine pública e dashboard de vendas, e Toolsets para checkout via Stripe/Mercado Pago e cálculo de frete via Correios — você opera sua loja inteira dentro do Fractal, com a flexibilidade que nenhuma plataforma de e-commerce oferece.

---

## 1. Estrutura de Collections

### 1.1 `products` — Catálogo

```typescript
z.object({
  name: z.string().describe("Nome do produto"),
  description: z.string().describe("Descrição detalhada"),
  price: z.number().min(0).describe("Preço de venda (R$)"),
  compareAtPrice: z.number().min(0).optional().describe("Preço anterior (para mostrar desconto)"),
  cost: z.number().min(0).optional().describe("Custo de aquisição/produção"),
  sku: z.string().describe("Código SKU único"),
  category: z.string().describe("Categoria"),
  tags: z.array(z.string()).default([]).describe("Tags para busca"),
  variants: z.array(z.object({
    name: z.string().describe("Nome da variante (ex: Tamanho P)"),
    sku: z.string(),
    price: z.number().min(0).optional(),
    stock: z.number().min(0).default(0),
  })).default([]),
  stock: z.number().min(0).default(0).describe("Estoque (se sem variantes)"),
  images: z.array(z.string()).default([]).describe("URLs das imagens"),
  active: z.boolean().default(true).describe("Visível na loja"),
  weight: z.number().min(0).optional().describe("Peso em gramas (para frete)"),
  dimensions: z.object({
    length: z.number(), width: z.number(), height: z.number(),
  }).optional().describe("Dimensões em cm (para frete)"),
})
```

### 1.2 `orders` — Pedidos

```typescript
z.object({
  number: z.string().describe("Número do pedido (ex: #2026-001)"),
  customerId: z.string().optional().describe("Cliente (se cadastrado)"),
  customerInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    document: z.string().optional(),
  }).describe("Dados do cliente no momento da compra"),
  items: z.array(z.object({
    productId: z.string(),
    variantSku: z.string().optional(),
    name: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })),
  subtotal: z.number().min(0),
  shippingCost: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  total: z.number().min(0),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "returned"]).default("pending"),
  paymentMethod: z.enum(["credit_card", "pix", "boleto"]).optional(),
  paymentId: z.string().optional().describe("ID da transação no gateway"),
  shippingAddress: z.object({
    street: z.string(), number: z.string(), complement: z.string().optional(),
    neighborhood: z.string(), city: z.string(), state: z.string(), zipCode: z.string(),
  }),
  trackingCode: z.string().optional().describe("Código de rastreio"),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
})
```

### 1.3 `customers` — Clientes

```typescript
z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  document: z.string().optional(),
  addresses: z.array(z.object({
    label: z.string().describe("Casa, Trabalho, etc"),
    street: z.string(), number: z.string(), complement: z.string().optional(),
    neighborhood: z.string(), city: z.string(), state: z.string(), zipCode: z.string(),
    isDefault: z.boolean().default(false),
  })).default([]),
  totalOrders: z.number().default(0),
  totalSpent: z.number().default(0),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
})
```

---

## 2. Hooks — Automação E-commerce

### Hook: Atualizar Estoque ao Vender

```typescript
.onCreated(async ({ value, workspace }) => {
  // Deduz estoque de cada item do pedido
  for (const item of value.items) {
    const product = await workspace.core.collections.get("products").findUnique({
      where: { id: item.productId },
    });

    if (!product) continue;

    if (item.variantSku) {
      // Atualiza estoque da variante
      const updatedVariants = product.variants.map(v =>
        v.sku === item.variantSku
          ? { ...v, stock: v.stock - item.quantity }
          : v
      );
      await workspace.core.collections.get("products").update({
        where: { id: item.productId },
        data: { variants: updatedVariants },
      });
    } else {
      // Atualiza estoque do produto
      await workspace.core.collections.get("products").update({
        where: { id: item.productId },
        data: { stock: Math.max(0, product.stock - item.quantity) },
      });
    }

    // Alerta se estoque baixo
    if ((product.stock || 0) - item.quantity <= 5) {
      await workspace.memories.create({
        category: "context",
        title: `Estoque baixo: ${product.name}`,
        content: `Produto ${product.name} (SKU: ${product.sku}) está com apenas ${product.stock - item.quantity} unidades.`,
        tags: ["estoque", "alerta"],
      });
    }
  }

  // Atualiza métricas do cliente
  if (value.customerId) {
    const customer = await workspace.core.collections.get("customers").findUnique({
      where: { id: value.customerId },
    });
    if (customer) {
      await workspace.core.collections.get("customers").update({
        where: { id: value.customerId },
        data: {
          totalOrders: customer.totalOrders + 1,
          totalSpent: customer.totalSpent + value.total,
        },
      });
    }
  }

  return value;
})
```

### Hook: Auto-numeração de Pedido

```typescript
.onCreated(async ({ value, workspace }) => {
  const count = await workspace.core.collections.get("orders").count();
  return {
    ...value,
    number: `#${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
  };
})
```

### Hook: Margem de Lucro (em `products`)

```typescript
.onList(async ({ value }) => {
  return value.map(product => ({
    ...product,
    margin: product.cost
      ? ((product.price - product.cost) / product.price * 100).toFixed(1)
      : null,
    marginValue: product.cost ? product.price - product.cost : null,
  }));
})
```

---

## 3. Views

### 3.1 `loja-dashboard.view.ts` — Dashboard do Lojista

```
Hero: "Loja Online"
├── Grid (4 cols): Metric (Vendas Hoje, Pedidos Pendentes, Produtos Ativos, Ticket Médio)
├── Section "Pedidos Recentes": Table com status colorido (StatusBadge)
├── Section "Estoque Baixo": Table com produtos com stock <= 5 + Alert
└── Section "Vendas por Categoria": Chart (pie)
```

### 3.2 `vitrine.view.ts` — Vitrine Pública

```
Hero: "Nossa Loja"
├── Grid (filtros): busca por nome, filtro por categoria, ordenação (preço, novidades)
├── Grid (3 cols): Card para cada produto com imagem, nome, preço, botão "Comprar"
└── Navegação entre páginas
```

### 3.3 `pedido-detalhe.view.ts` — Detalhe do Pedido

```
Hero: "Pedido {{number}}"
├── Grid (info): Status, Data, Pagamento, Rastreio
├── Section "Itens": Table com produto, qtd, preço unit, subtotal
├── Section "Cliente": Card com dados de contato e endereço
└── Section "Ações": Button "Marcar como Enviado", Button "Cancelar"
```

---

## 4. Toolsets

### 4.1 Stripe / Mercado Pago

Toolset para processar pagamentos:
- `create_checkout_session` — criar sessão de checkout
- `get_payment` — verificar status do pagamento
- `create_refund` — estornar pagamento

### 4.2 Correios

Toolset para logística:
- `calculate_shipping` — calcular frete por CEP, peso e dimensões
- `generate_label` — gerar etiqueta de envio
- `track_package` — consultar rastreio

### 4.3 WhatsApp / Email

Toolset para notificações:
- `send_order_confirmation` — enviar confirmação de pedido
- `send_tracking_update` — notificar atualização de rastreio

---

## 5. Webhook de Pagamento

O gateway de pagamento (Stripe/Mercado Pago) envia webhook para o endpoint Fractal:

```typescript
// No controller ou hook do evento:
if (event.type === "payment_intent.succeeded") {
  const orderId = event.data.object.metadata.orderId;
  await workspace.core.collections.get("orders").update({
    where: { id: orderId },
    data: { status: "paid", paymentId: event.data.object.id },
  });
  // Hook onUpdated de orders vai deduzir estoque e atualizar cliente
}
```

---

## 6. Fluxos de Trabalho

**Cenário: Compra realizada**
1. Cliente navega na `vitrine` → adiciona ao carrinho
2. Form de checkout coleta dados → cria `orders` (status: pending)
3. Hook gera número → toolset Stripe cria checkout
4. Cliente paga → webhook atualiza status → hook deduz estoque
5. Toolset Correios gera etiqueta → toolset WhatsApp notifica cliente

**Cenário: Gestão de Estoque**
1. Lojista abre `loja-dashboard` → vê seção "Estoque Baixo"
2. Filtra produtos com `stock <= 5`
3. Atualiza `products.stock` ao repor mercadoria
4. View recalcula disponibilidade automaticamente (`onList`)

**Cenário: Pós-venda**
1. Pedido entregue → atualiza `orders.status = "delivered"`
2. Hook pergunta se cliente quer avaliar (toolset email)
3. Dados alimentam `customers.tags` para segmentação futura

---

## 7. Evolução

- **Marketplace?** → Adiciona `sellers` collection + `products.sellerId`
- **Cupons?** → Adiciona `coupons` collection + validação em `orders`
- **Abandoned cart?** → Adiciona `carts` collection + job de lembrete
- **Fidelidade?** → Adiciona `loyalty_points` collection + cálculo automático
- **Nota fiscal?** → Toolset de NF-e + `invoices.nfeKey`
