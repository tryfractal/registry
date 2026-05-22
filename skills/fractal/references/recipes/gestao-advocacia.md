# Recipe: Gestão de Advocacia

> **Use Case:** Escritório de advocacia pequeno/médio ou advogado autônomo que gerencia casos, prazos processuais e honorários.
> **Substitui:** Clio, LegalCloud, planilhas de prazos
> **Perfil de Usuário:** Advogado, escritório boutique, departamento jurídico

## Visão Geral

Este recipe estrutura o workspace Fractal como um sistema de gestão jurídica. Com Collections para casos, clientes, prazos processuais, horas faturáveis e documentos — mais Views para timeline do caso e dashboard de produtividade — o advogado tem controle total sobre sua operação sem depender de software jurídico caro e engessado.

---

## 1. Estrutura de Collections

### 1.1 `cases` — Processos

```typescript
z.object({
  number: z.string().describe("Número do processo (CNJ)"),
  court: z.string().describe("Vara/Tribunal"),
  judge: z.string().optional().describe("Juiz responsável"),
  area: z.enum(["civil", "trabalhista", "penal", "tributario", "familia", "empresarial", "consumidor", "previdenciario"]),
  subject: z.string().describe("Assunto/objeto da ação"),
  status: z.enum(["active", "suspended", "archived", "closed"]).default("active"),
  clientId: z.string().uuid().describe("Cliente"),
  opposingParty: z.string().describe("Parte contrária"),
  opposingLawyer: z.string().optional().describe("Advogado da parte contrária"),
  filingDate: z.string().describe("Data de distribuição"),
  estimatedValue: z.number().min(0).describe("Valor estimado da causa (R$)"),
  contingencyFee: z.number().min(0).max(100).optional().describe("% de honorários de êxito"),
  notes: z.string().optional(),
})
```

### 1.2 `clients` — Clientes

```typescript
z.object({
  name: z.string().describe("Nome completo / Razão social"),
  document: z.string().describe("CPF ou CNPJ"),
  email: z.string().email(),
  phone: z.string(),
  address: z.string().optional(),
  type: z.enum(["individual", "company"]).default("individual"),
  active: z.boolean().default(true),
  notes: z.string().optional(),
})
```

### 1.3 `deadlines` — Prazos Processuais

```typescript
z.object({
  caseId: z.string().uuid().describe("Processo"),
  description: z.string().describe("Tipo de prazo (ex: contestação, réplica, recurso)"),
  dueDate: z.string().describe("Data final do prazo"),
  priority: z.enum(["urgent", "normal", "low"]).default("normal"),
  status: z.enum(["pending", "completed", "missed"]).default("pending"),
  alertDays: z.number().default(5).describe("Dias antes para alertar"),
  completedAt: z.string().optional(),
  autoCalculated: z.boolean().default(false).describe("Calculado automaticamente por toolset"),
})
```

### 1.4 `billable_hours` — Horas Faturáveis

```typescript
z.object({
  caseId: z.string().uuid(),
  clientId: z.string().uuid(),
  date: z.string().describe("Data da atividade"),
  hours: z.number().min(0.25),
  activity: z.string().describe("O que foi feito"),
  category: z.enum(["petition", "hearing", "meeting", "research", "client_contact", "review", "travel"]),
  rate: z.number().min(0).describe("Valor/hora (R$)"),
  billed: z.boolean().default(false),
})
```

### 1.5 `documents` — Petições e Documentos

```typescript
z.object({
  caseId: z.string().uuid(),
  title: z.string().describe("Nome do documento"),
  type: z.enum(["petition", "contract", "evidence", "power_of_attorney", "invoice", "report", "correspondence"]),
  filePath: z.string().describe("Caminho do arquivo"),
  filedAt: z.string().optional().describe("Data de protocolo"),
  version: z.number().default(1),
  tags: z.array(z.string()).default([]),
})
```

---

## 2. Hooks — Automação Jurídica

### Hook: Alertas de Prazo

`onList` em `deadlines` verifica prazos próximos e adiciona campo de alerta:

```typescript
.onList(async ({ value }) => {
  const today = new Date();
  return value.map(deadline => {
    const dueDate = new Date(deadline.dueDate);
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      ...deadline,
      daysLeft,
      isUrgent: daysLeft <= deadline.alertDays && deadline.status === "pending",
      isOverdue: daysLeft < 0 && deadline.status === "pending",
    };
  });
})
```

### Hook: Cálculo de Honorários

`onCreated` em `billable_hours` atualiza total do caso:

```typescript
.onCreated(async ({ value, workspace }) => {
  // Atualiza total de horas do caso (armazenado em cache ou recalculado na view)
  const caseRecord = await workspace.core.collections.get("cases").findUnique({
    where: { id: value.caseId },
  });
  // Se for caso de êxito, calcula valor estimado do honorário
  if (caseRecord?.contingencyFee) {
    const estimatedFee = (caseRecord.estimatedValue || 0) * (caseRecord.contingencyFee / 100);
    await workspace.memories.create({
      category: "context",
      title: `Honorários estimados — Caso ${caseRecord.number}`,
      content: `Valor estimado: R$ ${estimatedFee.toLocaleString()} (${caseRecord.contingencyFee}% de R$ ${(caseRecord.estimatedValue || 0).toLocaleString()})`,
      tags: ["honorarios", caseRecord.area],
    });
  }
  return value;
})
```

---

## 3. Views

### 3.1 `legal-dashboard.view.ts` — Dashboard do Advogado

```
Hero: "Gestão Jurídica"
├── Grid (4 cols): Metric (Casos ativos, Prazos esta semana, Horas mês, Honorários estimados)
├── Section "Prazos Urgentes": Table com deadlines filtradas (daysLeft <= 3), class="text-red-500"
├── Section "Casos em Andamento": Table com status, valor, horas acumuladas
└── Section "Produtividade": Chart (bar — horas por categoria de atividade no mês)
```

### 3.2 `case-timeline.view.ts` — Timeline do Processo

```
Hero: "Caso {{caseNumber}}"
├── Metric Grid: Status, Valor, Horas totais, Próximo prazo
├── Section "Linha do Tempo": Timeline com todos os eventos (criação, petições, audiências, prazos cumpridos)
├── Section "Documentos": Table com tipo, versão, data protocolo
└── Section "Horas": Table filtrada por caso
```

### 3.3 `deadline-calendar.view.ts` — Calendário de Prazos

```
Hero: "Calendário de Prazos"
├── Grid (filtros): por área, por prioridade, por status
├── Section "Esta Semana": Table com prazos dos próximos 7 dias (coloridos por urgência)
├── Section "Próximos 30 dias": Table agrupada por data
└── Alert (se houver prazos vencidos): "Atenção: {{count}} prazos vencidos!"
```

---

## 4. Toolsets

### 4.1 DJe / Diário Oficial Scraper

Toolset customizado que faz scraping do diário oficial e detecta novos andamentos:

```typescript
// toolsets/dje-scraper/tools/check-updates.tool.ts
.withDescription("Verifica andamentos no DJe para um número de processo")
.withSchema(z.object({
  caseNumber: z.string().describe("Número CNJ do processo"),
  court: z.enum(["TJSP", "TJMG", "TJRJ", "TRF3", "STJ", "STF"]),
}))
.withHandler(async ({ input }) => {
  // Scraping do site do tribunal
  // ... retorna lista de andamentos encontrados
})
```

### 4.2 Calculadora de Prazos

Toolset que aplica regras do CPC para calcular prazos processuais:

```typescript
.withDescription("Calcula prazo processual considerando feriados e dias úteis")
.withSchema(z.object({
  startDate: z.string().describe("Data do evento (intimação/publicação)"),
  days: z.number().describe("Prazo em dias (ex: 15 para contestação)"),
  court: z.enum(["TJSP", "TJMG", "TJRJ", "TRF3", "STJ", "STF"]).optional(),
}))
```

### 4.3 ZapSign / DocuSign

Integração para assinatura digital de procurações e contratos.

---

## 5. Templates

### `procurement-template` — Modelo de Procuração

Template Handlebars que gera procuração preenchida com dados do cliente e caso.

### `invoice-legal-template` — Fatura de Honorários

Template que gera fatura detalhada com horas, valores e dados do processo.

---

## 6. Fluxos de Trabalho

**Cenário: Novo processo**
1. Cliente procura advogado → cria `clients`
2. Advogado recebe petição inicial → cria `cases`
3. Toolset calcula prazos automaticamente → cria `deadlines`
4. Template gera procuração → toolset envia para assinatura
5. Dashboard atualiza com novo caso e prazos

**Cenário: Rotina diária**
1. Abre `legal-dashboard` → vê prazos urgentes do dia
2. Filtra por `overdue` → prioriza o que está atrasado
3. Registra `billable_hours` ao longo do dia
4. Fim do mês → view de horas gera relatório → template de fatura

**Cenário: Audiência**
1. Cria `documents` com petição/manifestação
2. Registra `billable_hours` (categoria: `hearing`)
3. Hook atualiza timeline do caso
4. Template gera relatório pós-audiência

---

## 7. Evolução

- **Múltiplos advogados?** → Adiciona `lawyers` collection + `assignee` nos casos e deadlines
- **Sociedade?** → Adiciona `partners` collection + view de distribuição de honorários
- **Correspondente jurídico?** → Adiciona `correspondents` collection + `cases.correspondentId`
- **Júri?** → Adiciona `jury` collection com quesitos, votação, resultado
