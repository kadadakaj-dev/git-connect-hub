
## Plán: CI/CD Workflow pre booking projekt

### Problém
- Navrhovaný workflow je pre iný repozitár (`git-connect-hub`)
- Používa `npm install` namiesto `bun install`
- Niekedy `actions/checkout@v2` (zastaralá verzia)

### Navrhované zmeny pre správny projekt

**Súbor:** `.github/workflows/ci-cd.yml` v repozitári `EB-EU-s-r-o/booking-buddy`

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests
        run: bun run test
      
      - name: Lint code
        run: bun run lint
      
      - name: Type check
        run: bun run build  # TypeScript check je súčasťou buildu
      
      - name: Build verification
        run: bun run build
```

### Čo potrebujem overiť
1. Má váš projekt script `test` v package.json? (Vidím vitest v závislostiach)
2. Chcete workflow pre **booking-buddy** repozitár alebo **git-connect-hub**?
