# Zmena H1 + H2 + H3 + H4 nadpisov na Google Sans Flex

## Zmeny

### 1. `index.html`

Pridať Google Sans Flex font link do `<head>` (vedľa existujúceho Inter fontu):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap" rel="stylesheet">
```

### 2. `tailwind.config.ts`

Pridať `heading` font family:

```ts
fontFamily: {
  heading: ['"Google Sans Flex"', 'system-ui', 'sans-serif'],
  // ... existing sans, display, data
}
```

### 3. `src/index.css`

Aktualizovať base layer pre nadpisy:

```css
h1 { font-family: 'Google Sans Flex', system-ui, sans-serif; }
```

### 4. Súbory s H1 (9 súborov) — pridať `font-heading` triedu


| Súbor                | Aktuálny štýl                        |
| -------------------- | ------------------------------------ |
| `SplashScreen.tsx`   | `text-4xl font-bold`                 |
| `Preview.tsx`        | `text-3xl font-bold`                 |
| `ClientAuth.tsx`     | `text-3xl lg:text-4xl font-semibold` |
| `AdminDashboard.tsx` | `text-xl font-bold`                  |
| `AdminLogin.tsx`     | `text-3xl lg:text-4xl font-semibold` |
| `NotFound.tsx`       | `text-4xl font-bold`                 |
| `Legal.tsx`          | `text-3xl md:text-4xl font-bold`     |
| `CancelBooking.tsx`  | `text-3xl md:text-4xl font-bold`     |
| `ClientPortal.tsx`   | `text-xl font-bold`                  |


Ku každému H1 pridať `font-heading` a nastaviť variable font settings cez CSS (weight 600, optical sizing auto).