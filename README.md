# Kept - Meta Muse Spark

> **App de ahorro e ingresos diarios con IA conversacional accionable**  
> Mobile-first (iPhone SE 2) · Offline-first · PWA instalable

![Kept Preview](public/screenshots/dashboard.png)

---

## ✨ Características Principales

### 💰 Finanzas Completas
- **Transacciones**: Ingresos, gastos, ahorros, transferencias con categorías jerárquicas
- **Cuentas**: Efectivo, banco, ahorros, inversiones con balances en tiempo real
- **Presupuestos**: Por categoría con alertas configurables (80%/100%)
- **Metas de ahorro**: Con hitos, progreso visual y aportes automáticos
- **Métodos de ahorro**: 50/30/20, sistema de sobres, redondeo, personalizados

### 🧠 Meta Muse Spark (IA)
- **Chat conversacional** con herramientas financieras reales
- **Acciones ejecutables**: "Gasté $150 en súper" → registra transacción real
- **Sparks diarios proactivos**:
  - 🔍 Patrones detectados (suscripciones, picos, tendencias)
  - ⚠️ Alertas de presupuesto y metas en riesgo
  - ⚡ Micro-retos accionables ("Cocina el viernes, ahorra $200")
  - 📚 Micro-lecciones contextuales
  - 🏆 Celebración de rachas y logros
- **Reporte semanal** automático

### 📱 Mobile-First (iPhone SE 2 - 375×667)
- Bottom Navigation fija (5 tabs)
- Bottom Sheets en lugar de modales
- Safe Area Insets para notch/home indicator
- Touch targets ≥44px
- Pull-to-refresh nativo

### 🔄 Offline-First
- **IndexedDB** (Dexie.js) para almacenamiento local
- **Sync Queue** (outbox pattern) para escrituras offline
- **Background Sync API** para sincronización automática
- **Service Worker** con estrategias de cache inteligentes
- **PWA instalable** con manifest + install prompt

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| **UI** | Shadcn/UI (Radix UI) + Lucide Icons |
| **State** | TanStack Query + React Hook Form + Zod |
| **Auth** | NextAuth.js v5 (Credentials + Google OAuth) |
| **DB** | PostgreSQL (Neon) + Prisma ORM |
| **Offline** | Dexie.js (IndexedDB) + Workbox |
| **IA** | Vercel AI SDK + OpenAI GPT-4o |
| **Animaciones** | Framer Motion |
| **Deploy** | Vercel + Neon |

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 20+
- Cuenta en [Neon](https://neon.tech) (PostgreSQL serverless)
- Cuenta en [OpenAI](https://platform.openai.com) (opcional, para IA)
- Cuenta en [Google Cloud Console](https://console.cloud.google.com) (para OAuth)

### Instalación

```bash
# Clonar repo
git clone https://github.com/imandro/kept.git
cd kept-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# Generar cliente Prisma y push a BD
npx prisma generate
npx prisma db push

# Seed con datos demo
node prisma/seed.js

# Desarrollo
npm run dev
```

### Variables de Entorno (.env)

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# AI (OpenAI)
OPENAI_API_KEY="sk-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Kept"
```

### Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita **Google OAuth 2.0 API**
4. Crea credenciales **OAuth 2.0 Client ID**
   - Tipo: Aplicación web
   - Orígenes autorizados: `http://localhost:3000`
   - URIs de redirección autorizados: `http://localhost:3000/api/auth/callback/google`
5. Copia **Client ID** y **Client Secret** a tu `.env`

---

## 📁 Estructura del Proyecto

```
kept-app/
├── public/
│   ├── manifest.json          # PWA Manifest
│   ├── sw.js                  # Service Worker custom
│   ├── icons/                 # Iconos 72-512px + shortcuts
│   └── screenshots/           # Screenshots para store
├── prisma/
│   ├── schema.prisma          # 17 modelos relacionales
│   └── seed.js                # Datos demo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/spark/      # Chat, sparks, ejecución
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── dashboard/     # Resumen financiero
│   │   │   ├── transactions/  # CRUD transacciones
│   │   │   ├── goals/         # CRUD metas
│   │   │   └── sync/          # Sync offline
│   │   ├── dashboard/         # Páginas mobile
│   │   │   ├── ai-spark/      # Meta Muse Spark UI
│   │   │   ├── transactions/  # Lista + formularios
│   │   │   └── goals/         # Metas + hitos
│   │   └── login/
│   ├── components/
│   │   ├── ai-spark/          # SparkChat, SparkCard, SparkCarousel
│   │   ├── forms/             # TransactionForm, GoalForm
│   │   ├── mobile-layout.tsx  # Bottom nav + sheets
│   │   └── ui/                # Shadcn/UI + animated components
│   ├── hooks/
│   │   ├── useSpark.ts        # Hook principal IA
│   │   └── useTransactions.ts # Hooks transacciones offline
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── spark-engine.ts    # Orquestador principal
│   │   │   ├── tools/
│   │   │   │   ├── finance-tools.ts  # CRUD real BD
│   │   │   │   ├── spark-tools.ts    # Generar sparks
│   │   │   │   └── action-tools.ts   # Parsear intención → acción
│   │   │   └── types.ts
│   │   ├── db/index.ts        # Dexie.js IndexedDB
│   │   ├── sync/index.ts      # Sync engine + background sync
│   │   ├── auth.ts            # NextAuth config
│   │   └── prisma.ts          # Cliente Prisma singleton
│   └── hooks/
└── scripts/                   # Generar iconos/screenshots
```

---

## 🧪 Comandos Útiles

```bash
# Desarrollo
npm run dev          # Servidor dev (Turbopack)

# Base de datos
npx prisma studio    # GUI para BD
npx prisma db push   # Push schema changes
npx prisma generate  # Regenerar cliente

# Build & Deploy
npm run build        # Build producción
npm run start        # Servidor producción

# PWA
npm run build && npx serve out  # Test PWA local

# Lint/Typecheck
npm run lint
npx tsc --noEmit
```

---

## 🔐 Usuarios Demo

| Email | Password | Descripción |
|-------|----------|-------------|
| `demo@kept.app` | `password123` | Usuario con datos demo |

---

## 🌐 Deploy en Vercel

1. Conecta repo en [Vercel](https://vercel.com/new)
2. Configura Environment Variables (copia de `.env`)
3. Deploy automático en cada push a `main`

**Variables requeridas en Vercel:**
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (genera con `openssl rand -base64 32`)
- `NEXTAUTH_URL` (tu URL de Vercel)
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## 📱 PWA Installation

1. Abre en Chrome/Safari móvil
2. Menú → **"Instalar Kept"** o **"Agregar a pantalla de inicio"**
3. Funciona offline completo tras primera carga

---

## 🤝 Contribuir

1. Fork del repo
2. Crea branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m "feat: descripción"`
4. Push: `git push origin feature/nueva-funcionalidad`
4. Pull Request

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org) · [Prisma](https://prisma.io) · [NextAuth](https://next-auth.js.org)
- [Shadcn/UI](https://ui.shadcn.com) · [Dexie.js](https://dexie.org) · [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Neon](https://neon.tech) · [Lucide Icons](https://lucide.dev) · [Framer Motion](https://framer.com/motion)

---

**Hecho con ❤️ para que ahorres mejor cada día**

[⭐ Dale una estrella si te gustó](https://github.com/imandro/kept/stargazers)