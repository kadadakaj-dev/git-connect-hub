# Git Connect Hub

A premium, modern booking platform with a focus on medical and high-end service interfaces, featuring a signature **"Baby Blue Glass"** design system.

## 🚀 Quick Start

### Installation
```sh
# Install dependencies
npm i

# Start development server
npm run dev
```

### URL
**Lovable Project**: [Git Connect Hub](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)

---

## 🎨 Design System: "Baby Blue Glass"

The project follows a clinical, premium visual identity defined by transparency, soft blurs, and a calming blue palette.

### Core Visual Formula:
- **Primary Color**: Baby Blue (`#BFE2FF`)
- **Atmosphere**: Liquid Glass surfaces with multi-layered blurs.
- **Typography**: Google Sans Flex for brand headings and Inter for functional data/forms.
- **Layers**: 
  - `glass-soft`: Low blur for subtle headers.
  - `glass-card`: Standard functional containers with 24px radius.
  - `glass-premium`: High-blur hero elements with floating shadows.

---

## 🛠 Tech Stack

- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase
- **UI Components**: shadcn/ui + Framer Motion
- **Testing**: Vitest (Unit/Integration) & Playwright (E2E)

---

## 📅 Features

- **Dynamic Booking Wizard**: Interactive multi-step flow with real-time slot generation.
- **Client Portal**: Self-service dashboard for managing upcoming and past appointments.
- **Admin Dashboard**: Comprehensive management of services, employees, opening hours, and blocked dates.
- **Localization**: Full support for Slovak (SK) and English (EN).
- **Responsive PWA**: Fully optimized for mobile-first interactions.

---

## 🧪 Testing

The project maintains a rigorous test suite to ensure stability.

### Run Unit/Integration Tests (Vitest)
```sh
npx vitest run
```

### Run End-to-End Tests (Playwright)
```sh
npm run test:e2e
```

---

## 🔑 Administrative Access

### Initial Setup
After creating any user in the Supabase Dashboard, assign them the `admin` role in the `user_roles` table.

### Default Admin Credentials (Development)
- **Email**: `booking@fyzioafit.sk`
- **Password**: `oUjuGUYMuzxtCiQy`

---

## 📁 Project Structure

- `src/components/`: Reusable UI components and domain-specific booking widgets.
- `src/pages/`: Main application routes (Auth, Portal, Admin, Home).
- `src/hooks/`: Business logic for time slot generation and Supabase integration.
- `src/integrations/`: Supabase client and specialized Lovable auth wrappers.
- `docs/`: Supplementary documentation and manual QA test cases.

---

## 📝 Localization

The application uses a custom `LanguageContext` located in `src/i18n/`. All translations are managed in `translations.ts` to ensure consistency across the client and admin interfaces.
