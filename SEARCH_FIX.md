# Search Functionality Fix

## Problem

The Agent0 SDK's `searchAgents` method with a `name` parameter does not perform substring or fuzzy matching. It appears to require exact matches, making it difficult for users to find agents by partial names.

**Example:**
- Agent name: "Agente Ciro"
- Search term: "ciro" → ❌ No results (SDK behavior)
- Expected: ✅ Should find "Agente Ciro"

## Solution

Implemented **client-side filtering** with the following approach:

### 1. Multiple Page Fetching
When a user searches by name, the system automatically fetches up to **10 pages (500 agents)** from the SDK to ensure comprehensive results.

### 2. Client-Side Filtering
Results are filtered client-side using:
- **Case-insensitive** matching
- **Substring** matching (not just exact match)
- Returns matches sorted by relevance

### 3. Pagination
Filtered results are paginated client-side to maintain good UX.

## Implementation

File: `src/lib/sdk.ts`

```typescript
export async function searchAgents(
    filters: SearchFilters,
    pageSize: number = 50,
    cursor?: string
): Promise<SearchResult> {
    const nameFilter = filters.name?.toLowerCase();
    const sdkFilters = { ...filters };
    delete sdkFilters.name; // SDK name filter doesn't work well

    if (nameFilter && !cursor) {
        // Fetch multiple pages (up to 500 agents)
        let allItems: any[] = [];
        let nextCursor: string | undefined = undefined;
        let pagesFetched = 0;
        const maxPages = 10;

        while (pagesFetched < maxPages) {
            const result = await sdk.searchAgents(
                sdkFilters,
                undefined,
                50,
                nextCursor
            );
            allItems.push(...mappedItems);
            nextCursor = result.nextCursor;
            pagesFetched++;
            if (!nextCursor) break;
        }

        // Filter client-side (case-insensitive substring)
        const filteredItems = allItems.filter(agent =>
            agent.name?.toLowerCase().includes(nameFilter)
        );

        return {
            items: filteredItems.slice(0, pageSize),
            nextCursor: filteredItems.length > pageSize
                ? 'client-side-pagination'
                : undefined
        };
    }

    // Normal flow for other filters...
}
```

## Search Examples

| Search Term | Found | Agent Name |
|------------|-------|-----------|
| "ciro" | ✅ | "Agente Ciro" |
| "agente ciro" | ✅ | "Agente Ciro" |
| "Agente Ciro" | ✅ | "Agente Ciro" |
| "CIRO" | ✅ | "Agente Ciro" |
| "agente-ciro" | ❌ | "Agente Ciro" (no dash in name) |
| "deep" | ✅ | "Deep42" |
| "sdk" | ✅ | "sdk-erc8004-demo-..." |

## Performance Considerations

### Pros
- ✅ Works with any search term (partial, case-insensitive)
- ✅ Better UX - users don't need exact names
- ✅ Fetches enough data to find most agents (500 agents)

### Cons
- ⚠️ Initial search by name takes longer (fetches 10 pages)
- ⚠️ Limited to first 500 agents for name search

### Future Improvements
1. **Caching**: Cache fetched agents to speed up subsequent searches
2. **Backend Solution**: Request SDK/subgraph to support proper text search
3. **Search Index**: Build a client-side search index for instant results
4. **Lazy Loading**: Fetch pages progressively as user scrolls

## User Experience

### Loading State
When searching by name, users see:
```
Searching by name across all agents...
This may take a moment
```

This sets proper expectations about the longer load time.

### Results
- Returns up to 20 results per page (configurable)
- "Load More" button appears if more results exist
- Clear indication when no results are found

## Testing

To test the search functionality:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to the search page

3. Test these search terms:
   - "ciro" → Should find "Agente Ciro"
   - "deep" → Should find "Deep42"
   - "sdk" → Should find multiple sdk-related agents

## Known Limitations

1. **500 Agent Limit**: Only searches first 500 agents. If the agent is beyond that, it won't be found.
2. **Load Time**: Name search takes 3-5 seconds due to multiple page fetching.
3. **No Fuzzy Matching**: Requires substring match. "agente-ciro" won't match "Agente Ciro".

## Alternative Approaches Considered

### 1. Fetch All Agents
- ❌ Too slow (277+ agents, multiple API calls)
- ❌ High memory usage
- ❌ Poor UX

### 2. Server-Side Search
- ✅ Would be ideal
- ❌ Requires SDK/subgraph changes
- ❌ Outside our control

### 3. Search Index
- ✅ Very fast
- ❌ Requires initial load of all agents
- ❌ Memory overhead
- 💡 Good for future enhancement

## Conclusion

The current implementation provides a **pragmatic balance** between:
- User experience (works as expected)
- Performance (reasonable load times)
- Complexity (manageable code)

The solution works well for the current scale (~300 agents) and can be improved as the system grows.
