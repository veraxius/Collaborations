# Business Analytics Platform

Una plataforma de análisis de negocio construida con Next.js, React, TypeScript y shadcn/ui que permite analizar el estado de tu negocio con inteligencia artificial.

## 🚀 Características

### Flujo de Usuario

1. **Login / Register** - Autenticación de usuarios
2. **Añadir Empresa** - Popup para agregar empresas a analizar
3. **Dashboard** - Vista principal con:
   - **Business Score** - Indicador general del estado del negocio (0-10)
   - **Métricas Principales** - Tarjetas con métricas clave:
     - Tráfico estimado
     - Crecimiento mensual
     - Ranking SEO
     - Performance del sitio
   - **Problemas Detectados** - Sección que muestra problemas críticos con nivel de gravedad e impacto
   - **Oportunidades** - Recomendaciones de IA para crecer
   - **Competidores** - Resumen de competidores agregados
   - **Alertas Recientes** - Cambios importantes detectados

4. **Navegación Lateral** con:
   - Dashboard
   - Company Analysis
   - Problems
   - AI Recommendations
   - Competitors
   - Opportunities
   - Reports
   - Settings

## 🛠️ Tecnologías

- **Next.js 16** - Framework de React
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

## 🎨 Componentes UI Utilizados

- Card
- Badge
- Tabs
- Table
- Alert
- Progress
- Dialog
- Input
- Label
- Button

## 📁 Estructura del Proyecto

```
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── problems/
│   │   ├── ai-recommendations/
│   │   ├── competitors/
│   │   ├── opportunities/
│   │   ├── company-analysis/
│   │   ├── reports/
│   │   └── settings/
│   └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── add-company-dialog.tsx
│   │   ├── business-score.tsx
│   │   ├── metric-cards.tsx
│   │   ├── problems-section.tsx
│   │   ├── opportunities-section.tsx
│   │   ├── competitors-section.tsx
│   │   └── alerts-section.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── tabs.tsx
│       ├── table.tsx
│       ├── alert.tsx
│       ├── progress.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── label.tsx
└── lib/
    └── utils.ts
```

## 🚦 Uso

1. Inicia el servidor de desarrollo: `npm run dev`
2. Abre [http://localhost:3000](http://localhost:3000)
3. Navega a `/login` o `/register` para autenticarte
4. Una vez autenticado, serás redirigido al dashboard
5. Usa el botón "Añadir Empresa" para agregar empresas a analizar
6. Explora las diferentes secciones desde el menú lateral

## 📝 Notas

- La autenticación actual es simulada. En producción, deberías implementar un sistema de autenticación real.
- Los datos mostrados son de ejemplo. Conecta con APIs reales para obtener datos dinámicos.
- El proyecto está listo para ser extendido con funcionalidades adicionales.

## 📄 Licencia

Este proyecto es privado.
