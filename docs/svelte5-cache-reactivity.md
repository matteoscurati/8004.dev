# Svelte 5 Cache Reactivity Solution

## Problem Statement

When implementing LRUCache for search results, we discovered that Svelte 5's reactivity system was not detecting changes when cached objects were returned. Even with `structuredClone()`, the UI wouldn't update after search operations.

## Root Cause

Svelte 5 introduced a new reactivity system based on **runes** (`$state`, `$derived`, `$effect`) that differs fundamentally from Svelte 4:

### Key Differences from Svelte 4

1. **Proxy-based Reactivity**: Svelte 5 uses JavaScript Proxy objects for deep reactivity
2. **Reference Equality**: Reactivity is triggered by **object reference changes**, not deep equality
3. **Explicit State Declaration**: State must be explicitly declared with `$state()` rune

### Why Cache Broke Reactivity

When returning cached results, the cache returns **the same object reference**:

```typescript
// ❌ BROKEN: Same reference = No reactivity
const cached = searchCache.get(cacheKey);
if (cached !== null) {
    return cached; // Same object reference!
}
```

Even with shallow cloning:
```typescript
// ❌ STILL BROKEN: Nested arrays/objects still share references
return {
    items: [...cached.items], // New array, but items are same references
    nextCursor: cached.nextCursor
};
```

Even with `structuredClone()`:
```typescript
// ❌ UNEXPECTED: Still didn't work (proxy issues?)
return structuredClone(cached);
```

## Solution: Deep Reference Cloning

To make cache work with Svelte 5, we must ensure **every level of the object tree** gets a new reference:

### Implementation

```typescript
// ✅ WORKS: Deep clone all levels
if (cached !== null) {
    return {
        items: cached.items.map(item => ({
            ...item,
            // Clone nested arrays
            mcpTools: item.mcpTools ? [...item.mcpTools] : undefined,
            a2aSkills: item.a2aSkills ? [...item.a2aSkills] : undefined,
            mcpPrompts: item.mcpPrompts ? [...item.mcpPrompts] : undefined,
            mcpResources: item.mcpResources ? [...item.mcpResources] : undefined,
            supportedTrusts: item.supportedTrusts ? [...item.supportedTrusts] : undefined,
            owners: item.owners ? [...item.owners] : undefined,
            operators: item.operators ? [...item.operators] : undefined,
            // Clone nested objects
            extras: item.extras ? { ...item.extras } : undefined
        })),
        nextCursor: cached.nextCursor,
        totalMatches: cached.totalMatches
    };
}
```

### Why This Works

1. **New array reference**: `cached.items.map()` creates a new array
2. **New item references**: `{ ...item }` creates new objects for each item
3. **New nested references**: Spread operators for all nested arrays/objects
4. **Svelte detects change**: When `agents = result.items` runs, Svelte sees new references

## Svelte 5 Best Practices for Caching

### 1. Use `$state.snapshot()` for External APIs

When passing reactive state to external libraries (like `structuredClone`, `JSON.stringify`):

```typescript
let counter = $state({ count: 0 });

// ❌ Don't do this
JSON.stringify(counter); // Proxy issues

// ✅ Use snapshot
JSON.stringify($state.snapshot(counter));
```

**Note**: We didn't use `$state.snapshot()` in our solution because:
- We're not storing `$state` proxies in the cache
- We're storing plain objects and cloning on retrieval
- The cache is outside the component (module-level)

### 2. Use `$derived` for Computed Values

For expensive calculations that need caching:

```typescript
let items = $state([]);
let filteredItems = $derived(
    items.filter(item => item.active)
);
```

Benefits:
- Lazy evaluation (only recomputes when accessed)
- Automatic dependency tracking
- Built-in memoization

### 3. Export Functions, Not State

When sharing state across modules:

```typescript
// ❌ Don't export state directly
export let count = $state(0);

// ✅ Export functions that access/modify state
let count = $state(0);
export const getCount = () => count;
export const increment = () => count++;
```

**Why**: Importing modules only get the current value, not the reactive binding.

### 4. Use `.svelte.js` or `.svelte.ts` for Runes

Runes can be used in JavaScript/TypeScript modules, but the file must have `.svelte.js` or `.svelte.ts` extension:

```typescript
// shared-state.svelte.ts
export const state = $state({ count: 0 });
```

## Performance Considerations

### When to Use Cache vs $derived

**Use LRUCache when**:
- Data comes from async operations (API calls)
- Need TTL (time-to-live) expiration
- Want LRU eviction for memory management
- Sharing across multiple components

**Use $derived when**:
- Synchronous computations
- Derived from existing reactive state
- Need automatic dependency tracking
- Single component scope

### Cache Configuration

```typescript
// Current configuration
const searchCache = new LRUCache<SearchResult>(
    50,    // Max 50 cached searches
    5      // 5 minute TTL
);
```

Adjust based on:
- **maxSize**: More = better hit rate, more memory
- **ttl**: Longer = better hit rate, stale data risk

## Resources

### Official Svelte 5 Documentation
- [$state rune](https://svelte.dev/docs/svelte/$state)
- [$state.snapshot()](https://svelte.dev/docs/svelte/$state#$state.snapshot)
- [$derived rune](https://svelte.dev/docs/svelte/$derived)
- [Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)

### Community Resources
- [Svelte 5 Patterns: Shared State](https://fubits.dev/notes/svelte-5-patterns-simple-shared-state-getcontext-tweened-stores-with-runes/)
- [Different Ways To Share State In Svelte 5](https://joyofcode.xyz/how-to-share-state-in-svelte-5)
- [Svelte 5 $state Class vs Object Reactivity](https://chasingcode.dev/blog/svelte-5-state-rune-class-vs-object-reactivity/)

### GitHub Issues
- [Svelte 5 same referenced object reactivity #16419](https://github.com/sveltejs/svelte/issues/16419)
- [Reactive properties not in structuredClone #14129](https://github.com/sveltejs/svelte/issues/14129)
- [Feature Request: Global Request Cache Pattern #16434](https://github.com/sveltejs/svelte/issues/16434)

## Testing Cache Reactivity

To verify cache works correctly:

1. **First search**: Should fetch from API and cache result
2. **Same search**: Should return cached result with new references
3. **UI updates**: Search results should display correctly both times
4. **Different search**: Should fetch from API (cache miss)

### Debug Steps

If reactivity breaks:

1. Check browser console for proxy warnings
2. Verify all nested arrays/objects are cloned
3. Confirm cache returns new references each time
4. Test with `console.log` to see reference equality:

```typescript
const result1 = await searchAgents(filters);
const result2 = await searchAgents(filters);
console.log(result1 === result2); // Should be false (different references)
console.log(result1.items === result2.items); // Should be false
console.log(result1.items[0] === result2.items[0]); // Should be false
```

## Conclusion

Svelte 5's proxy-based reactivity requires careful handling when implementing caches. The key principle is:

> **Always return new object references at every nesting level when retrieving cached data.**

This ensures Svelte's reactivity system detects changes and updates the UI correctly.
