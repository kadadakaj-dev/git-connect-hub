# @bookinggg/types

Shared TypeScript types and interfaces for the Booking Pro LE monorepo.

## Purpose

This package provides common type definitions used across the API and web applications, ensuring type safety and consistency throughout the codebase.

## Installation

This package is internal to the monorepo and is referenced via workspace protocol:

```json
{
  "dependencies": {
    "@bookinggg/types": "workspace:*"
  }
}
```

## Usage

### In API (NestJS)

```typescript
import { User, Role, AuthResponse, ApiError } from '@bookinggg/types';

// Use in service methods
async getUser(id: string): Promise<User> {
  // ...
}

// Use in DTOs or response types
class LoginResponseDto implements AuthResponse {
  user: User;
  isAuthenticated: boolean;
}
```

### In Web (Next.js)

```typescript
import type { User, Role, ApiError } from '@bookinggg/types';

// Use in React components
interface UserProfileProps {
  user: User;
}

// Use in API client
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message);
  }
  return response.json();
}
```

## Available Types

### User

Represents a user in the system with authentication and profile information.

```typescript
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
```

### Role

Enum defining user roles.

```typescript
enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}
```

### AuthResponse

Standard authentication response structure.

```typescript
interface AuthResponse {
  user: User;
  isAuthenticated: boolean;
}
```

### ApiError

Standard error response structure from the API.

```typescript
interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
```

## Development

### Build

Compile TypeScript and generate declaration files:

```bash
pnpm --filter @bookinggg/types build
```

### Watch Mode

Automatically rebuild on file changes:

```bash
pnpm --filter @bookinggg/types dev
```

### Adding New Types

1. Add your type/interface to `src/index.ts`
2. Export it from the same file
3. Rebuild the package: `pnpm --filter @bookinggg/types build`
4. Types will be available in consuming packages after their next build

### Best Practices

- **Keep types simple**: Only define shared types here, not business logic
- **Avoid dependencies**: This package should have minimal external dependencies
- **Document complex types**: Add JSDoc comments for non-obvious types
- **Version carefully**: Changes here affect multiple packages

## Package Structure

```
packages/types/
├── src/
│   └── index.ts          # All type definitions
├── dist/                 # Generated JS and .d.ts files (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

### package.json

- **name**: `@bookinggg/types`
- **main**: Points to compiled CommonJS output
- **types**: Points to TypeScript declaration files

### tsconfig.json

- **target**: ES2020
- **module**: CommonJS (compatible with NestJS)
- **declaration**: true (generates .d.ts files)

## Notes

- This package is compiled to **CommonJS** for compatibility with the NestJS API
- The web package (using ES modules) can still import from this package
- Changes to types require rebuilding this package before consuming packages see updates
- In development, use watch mode to auto-rebuild: `pnpm --filter @bookinggg/types dev`
