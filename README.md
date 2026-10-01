# JUNTOS - Plataforma de Acompanamiento Humano No Clinico (RD)

Aplicacion **Next.js (App Router) + TypeScript + Supabase** para:

- **B2C:** solicitud y pago de acompanamiento por horas con geolocalizacion de centros de salud (flujo en 9 pasos).
- **B2B / CRM:** gestion de instituciones, pilotos de 30 dias, KPIs de calidad y facturacion fiscal DGII (NCF B01/B02, ITBIS 18%).

> Marca: logo oficial JUNTOS + paleta **Azul institucional** (`#0E3A5D` / `#1E40AF`) y **Verde salud** (`#10B981` / `#059669`).

---

## 1. Requisitos previos

- **Node.js 18.17+** (recomendado 20 LTS). Verifica con `node -v`.
- **npm** (o pnpm/yarn).
- Una cuenta en **Supabase** (https://supabase.com) - plan free sirve.
- (Opcional) **Supabase CLI** para aplicar migraciones por linea de comandos.

---

## 2. Instalacion paso a paso

```bash
# 1) Entrar a la carpeta del proyecto
cd juntos-platform

# 2) Instalar dependencias
npm install

# 3) Crear el archivo de variables de entorno
cp .env.example .env.local
```

### 2.1 Crear el proyecto en Supabase

1. Entra a https://supabase.com y crea un nuevo proyecto.
2. Ve a **Project Settings > API** y copia:
   - `Project URL`  -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public`  -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` -> `SUPABASE_SERVICE_ROLE_KEY` (SECRETO, nunca al cliente)
3. Pega esos valores en `.env.local`.

### 2.2 Aplicar el esquema de base de datos

**Opcion A - SQL Editor (mas simple):**

1. En el panel de Supabase, abre **SQL Editor**.
2. Ejecuta en orden el contenido de:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_seed.sql` (opcional, datos demo del CRM)

**Opcion B - Supabase CLI:**

```bash
npx supabase login
npx supabase link --project-ref TU-REF
npx supabase db push
```

---

## 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

```bash
npm run typecheck   # chequeo de tipos TypeScript
npm run build       # build de produccion
npm run start       # servir el build
```

---

## 4. Primer uso

1. Ve a `/register` y crea una cuenta. Se crea un perfil con rol **CUSTOMER**.
2. Para probar los modulos de administracion (CRM, pagos, facturas, auditoria),
   cambia tu rol a `ADMIN` en Supabase:
   ```sql
   update public.profiles set role = 'ADMIN' where id = 'TU-UUID-DE-AUTH';
   ```
   (El UUID aparece en **Authentication > Users**.)
3. Inicia sesion en `/login`.

### Recorrido funcional

| Flujo | Ruta | Que hace |
|-------|------|----------|
| Solicitud B2C (9 pasos) | `/services/new` | Crea `service_request` + pago `PENDING` |
| Checkout | `/services/checkout/[id]` | Autoriza y marca `PAID` (demo) -> genera factura |
| CRM B2B | `/admin/institutions` | Funnel comercial, filtros, ficha |
| Piloto 30 dias | `/admin/pilots/[id]` | KPIs + registro de metricas semanales |
| Pagos | `/admin/payments` | Maquina de estados de pago |
| Facturas NCF | `/admin/invoices` | Emision B01/B02, impresion/PDF con logo |
| Auditoria | `/admin/audit` | Log inmutable (solo ADMIN/AUDITOR) |

---

## 5. Arquitectura

```
src/
  app/
    (auth)/login, (auth)/register   # autenticacion
    services/new                    # wizard B2C 9 pasos
    services/checkout/[id]          # checkout + pago
    services/actions.ts             # server action: crear solicitud
    admin/institutions              # CRM B2B (lista + detalle)
    admin/pilots/[id]               # dashboard KPI de piloto
    admin/payments                  # maquina de estados de pago
    admin/invoices                  # NCF DGII + impresion
    admin/audit                     # consola de auditoria
    admin/payment-actions.ts        # transiciones de pago + factura
    admin/pilots/pilot-actions.ts   # alta de metricas
  components/
    brand/Logo.tsx                  # logo oficial
    navbar.tsx                      # navegacion azul
    service-wizard.tsx              # wizard 9 pasos (RHF + Zod)
    ui/                             # primitivos (button, card, badge...)
  lib/
    supabase/{client,server,admin,middleware}.ts
    audit.ts                        # escritura inmutable (service_role)
    pricing.ts                      # tarifa RD$900/h, ITBIS 18%
    validations.ts                  # schemas Zod + catalogo de centros
  types/db.ts                       # tipos de dominio
supabase/migrations/               # 0001 schema, 0002 RLS, 0003 seed
public/images/logo-juntos.png      # logo oficial
```

### Seguridad (RLS)

- RLS activo en **todas** las tablas.
- `audit_logs`: `SELECT` solo `ADMIN`/`AUDITOR`; `UPDATE`/`DELETE` denegados a todos;
  `INSERT` unicamente via `service_role` desde Server Actions (`src/lib/audit.ts`).
- El cliente nunca ve la `service_role` key (solo se usa en el servidor).

---

## 6. Notas y supuestos

- **[SUPUESTO-VALIDAR]** Tarifa base RD$900/h (= ~US$15). Configurable en `.env.local`
  (`NEXT_PUBLIC_HOURLY_RATE_DOP`).
- **[SUPUESTO-VALIDAR]** Tarifa de referencia de servicio en pilotos B2B: RD$2,200.
- **[POR CONFIRMAR]** Secuencias NCF: aqui se generan de forma incremental
  (`B01xxxxxxxxxx`). En produccion deben alinearse con los rangos autorizados por la **DGII**.
- **[POR CONFIRMAR]** Pasarela de pago en `CONFIG_REQUIRED`. Integrar **AZUL / CARDNET / PAYPAL**
  reemplazando la simulacion en `payment-actions.ts` por el webhook/SDK real.
- La plataforma mantiene **separacion estricta** entre logistica de acompanamiento
  e informacion clinica confidencial (no se capturan datos clinicos).
- ITBIS 18% se calcula **sobre el subtotal** (el subtotal es la tarifa mostrada).
  Si tu modelo trata la tarifa como monto con ITBIS incluido, ajusta `invoiceBreakdown` en `lib/pricing.ts`.

---

## 7. Despliegue (opcional)

- **Vercel:** importa el repo, define las 3 variables de entorno Supabase y despliega.
- Asegurate de NO exponer `SUPABASE_SERVICE_ROLE_KEY` como variable publica (sin prefijo `NEXT_PUBLIC_`).
