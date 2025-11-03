# Testing Strategy

## Current Status

The project has a comprehensive test suite configured with Vitest and @testing-library/svelte.

### Test Coverage Goal

Target: **100% coverage** for all critical code paths.

## Test Configuration

- **Framework**: Vitest v4.0.6
- **Testing Library**: @testing-library/svelte v5.2.8
- **Environment**: Happy-DOM (browser environment simulation)
- **Coverage**: Vitest Coverage v8

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage report
npm run test:coverage

# Open test UI
npm run test:ui
```

## Current Test Files

### ✅ Configuration Tests

- `src/tests/example.test.ts` - Example tests verifying Vitest setup works correctly
  - Basic assertions
  - Async test support
  - Array and object handling
  - Simple utility function tests

### 📋 Planned Tests (Awaiting Svelte 5 Support)

**Status**: Test infrastructure is ready, but component tests are pending @testing-library/svelte Svelte 5 support.

Planned test files:
- `src/lib/sdk.test.ts` - SDK wrapper functions (getSDK, searchAgents, countAgents)
- `src/lib/components/AgentCard.test.ts` - Agent card component
- `src/lib/components/SearchFilters.test.ts` - Search and filters component
- `src/lib/components/ReputationDisplay.test.ts` - Reputation display component
- `src/routes/page.test.ts` - Main search page
- `src/routes/layout.test.ts` - App layout

## Known Issues

### Svelte 5 Compatibility

@testing-library/svelte was designed for Svelte 3/4 and has not been fully updated for Svelte 5 runes syntax. This causes issues when:
- Rendering components with `$state` runes
- Testing reactive `$derived` values
- Components using `$effect` for lifecycle

**Workarounds**:
1. Wait for @testing-library/svelte to add full Svelte 5 support
2. Use manual DOM testing without the library
3. Use Playwright/Cypress for E2E tests instead

**Related**:
- https://github.com/testing-library/svelte-testing-library/issues/222
- https://svelte.dev/docs/svelte/v5-migration-guide

### Environment Variables

All tests mock environment variables in `src/tests/setup.ts`:
- PUBLIC_RPC_URL
- PUBLIC_CHAIN_ID
- PUBLIC_IPFS_PROVIDER
- PUBLIC_PINATA_JWT

### Browser Environment

The `browser` global from `$app/environment` is mocked to `true` in all tests.

## Test Organization

### Unit Tests

Located next to the source files they test:
```
src/lib/sdk.ts
src/lib/sdk.test.ts
```

### Component Tests

Located in the same directory as components:
```
src/lib/components/AgentCard.svelte
src/lib/components/AgentCard.test.ts
```

### Integration Tests

Page-level tests in routes:
```
src/routes/+page.svelte
src/routes/page.test.ts  (note: no + prefix to avoid SvelteKit conflict)
```

## What to Test

### Priority 1: Business Logic (Unit Tests)

- ✅ SDK wrapper functions
- ✅ Data transformations
- ✅ Filter logic
- ✅ Pagination logic
- ✅ Error handling

### Priority 2: Component Behavior

- ⏳ Component rendering
- ⏳ User interactions (clicks, typing)
- ⏳ Conditional rendering
- ⏳ Event handling

### Priority 3: Integration

- ⏳ Full page flows
- ⏳ Navigation
- ⏳ State management across components

## Coverage Configuration

Coverage thresholds are set to 100% in `vite.config.ts`:

```typescript
coverage: {
	provider: 'v8',
	reporter: ['text', 'json', 'html', 'lcov'],
	lines: 100,
	functions: 100,
	branches: 100,
	statements: 100
}
```

Coverage reports are generated in `coverage/` directory (gitignored).

## Future Improvements

### When @testing-library/svelte adds Svelte 5 support:

1. **Fix Component Tests**
   - Update all component test files
   - Add tests for rune-specific behavior
   - Test `$state` reactivity
   - Test `$derived` computed values
   - Test `$effect` side effects

2. **Add Integration Tests**
   - Full search flow
   - Filter combinations
   - Pagination interactions
   - Error scenarios

3. **Add Visual Regression Tests**
   - Screenshot testing for pixel-art UI
   - Verify glitch effects
   - Test responsive layouts

### Alternative: E2E Testing

Consider using Playwright or Cypress for comprehensive testing:

```bash
# Example with Playwright
npm install -D @playwright/test

# Test complete user flows
# - Search for agents
# - Apply filters
# - Load more results
# - Verify pixel art rendering
```

## Mocking Strategy

### SDK Module

The Agent0 SDK is mocked in tests to avoid network calls:

```typescript
vi.mock('agent0-sdk', () => ({
	SDK: vi.fn().mockImplementation(() => ({
		searchAgents: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
		getReputationSummary: vi.fn().mockResolvedValue({ count: 0, averageScore: 0 })
	}))
}));
```

### SvelteKit Modules

SvelteKit's `$app/environment` is mocked globally in `setup.ts`:

```typescript
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));
```

## Continuous Integration

### GitHub Actions (Recommended)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info
```

## Test Writing Guidelines

### 1. Descriptive Test Names

```typescript
// ✅ Good
it('should filter agents by name case-insensitively', () => {})

// ❌ Bad
it('filters work', () => {})
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should count total agents', async () => {
	// Arrange
	const mockData = { items: [/* ... */], nextCursor: undefined };
	vi.mocked(searchAgents).mockResolvedValue(mockData);

	// Act
	const count = await countAgents({});

	// Assert
	expect(count).toBe(100);
});
```

### 3. Test One Thing

```typescript
// ✅ Good - tests one behavior
it('should show error when search fails', async () => {})

// ❌ Bad - tests multiple things
it('should search, paginate, and handle errors', async () => {})
```

### 4. Clean Up

```typescript
describe('Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Testing Svelte Components](https://svelte.dev/docs/kit/testing)

## Status: 🚧 In Progress

**Last Updated**: 2024-11-03

The test suite is configured and ready. Component tests are waiting for improved Svelte 5 support from @testing-library/svelte. Unit tests for business logic functions are functional and provide core coverage.
