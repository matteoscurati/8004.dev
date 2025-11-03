# Reputation Feature - Temporarily Disabled

## Issue

The reputation feature has been temporarily disabled due to a **bug in the SDK**.

### Error Details
```
⚠ Failed to get reputation summary: Method getClients not found on contract
```

### Root Cause - SDK BUG CONFIRMED ⚠️

After analyzing the SDK code and contract ABI, I've confirmed this is a **bug in agent0-sdk v0.2.1**:

1. **Missing Method in ABI**: The method `getClients()` does NOT exist in the ReputationRegistry contract ABI
2. **SDK Implementation Bug**: The SDK's `getReputationSummary()` method tries to call `getClients()` which doesn't exist
3. **Code Location**: `node_modules/agent0-sdk/dist/core/feedback-manager.js` line ~518

#### What the SDK Does:
```javascript
// Step 1: Try to get list of clients (FAILS - method doesn't exist)
const clients = await this.web3Client.callContract(
    this.reputationRegistry,
    'getClients',  // ❌ NOT IN CONTRACT ABI
    BigInt(tokenId)
);

// Step 2: Use clients to get summary (never reached)
const [count, averageScore] = await this.web3Client.callContract(
    this.reputationRegistry,
    'getSummary',  // ✅ EXISTS in ABI
    BigInt(tokenId),
    clients,       // undefined because getClients failed
    tag1Bytes,
    tag2Bytes
);
```

#### What Actually Exists in Contract:
- ✅ `getSummary(agentId, clients[], tag1, tag2)` - Requires clients array as parameter
- ❌ `getClients(agentId)` - Does NOT exist in ABI
- Other methods: `giveFeedback`, `revokeFeedback`, `appendResponse`, `getLastIndex`, etc.

### What Was Disabled

The `ReputationDisplay` component in `AgentCard.svelte` (line 64) has been commented out:

```svelte
<!-- Reputation temporarily disabled - SDK contract method not available on Sepolia -->
<!-- <ReputationDisplay agentId={agent.id} /> -->
```

### Impact

- ✅ Agent cards display correctly
- ✅ Search and filtering work normally
- ❌ Agent reputation scores are not shown
- ❌ Feedback/review counts are not displayed

### Expected Behavior (When Fixed)

The reputation display would show:
- **Average Score**: 0.0 to 5.0 rating
- **Star Display**: Visual representation (★★★☆☆)
- **Total Feedback**: Number of reviews received
- **Positive/Negative Counts**: Vote breakdown

## Solutions

### Option 1: Wait for SDK Fix (Recommended)

Report this bug to the Agent0 team:
- GitHub Issues: https://github.com/agent0lab/agent0-ts/issues
- Include this error and the code analysis above

### Option 2: Use Subgraph for Reputation (Alternative)

The SDK also supports querying feedback via subgraph, which may provide reputation data:

```typescript
const feedbackResults = await sdk.searchFeedback(
  agentId,
  undefined,  // tags
  undefined,  // capabilities
  undefined,  // skills
  undefined,  // minScore
  undefined   // maxScore
);

// Calculate reputation from feedback manually
const totalFeedback = feedbackResults.items.length;
const averageScore = feedbackResults.items.reduce((sum, f) => sum + f.score, 0) / totalFeedback;
```

### Option 3: Patch SDK Locally (Advanced)

You could patch the SDK to use an alternative method to get clients (e.g., from subgraph).

## How to Re-Enable (When Fixed)

Once the SDK is fixed in a future version:

### 1. Check Contract Status
```bash
# Verify the contract has getClients method
# Check with the Agent0 team about contract deployment status
```

### 2. Update SDK (if needed)
```bash
npm update agent0-sdk
```

### 3. Fix Interface Mismatch

Update `src/lib/sdk.ts` to match SDK response:

```typescript
export interface ReputationSummary {
    count: number;          // Total feedback count
    averageScore: number;   // Average rating (0-5)
    // Add these if SDK provides them:
    // totalFeedback?: number;
    // positiveCount?: number;
    // negativeCount?: number;
}
```

### 4. Update ReputationDisplay Component

Modify `src/lib/components/ReputationDisplay.svelte` to use available fields:

```svelte
<!-- Use count instead of totalFeedback -->
<span class="stat-value">{reputation.count}</span>

<!-- Remove or calculate positive/negative if not provided -->
```

### 5. Uncomment in AgentCard

In `src/lib/components/AgentCard.svelte`:

```svelte
<script lang="ts">
    import ReputationDisplay from './ReputationDisplay.svelte';
    // ...
</script>

<!-- In template: -->
<ReputationDisplay agentId={agent.id} />
```

## Alternative Solution

If the contract won't be updated, consider:

1. **Remove Reputation Feature**: Completely remove unused components
2. **Mock Data**: Display placeholder/demo reputation data
3. **Different Data Source**: Use subgraph or alternative API for reputation

## Files Affected

- ✅ `src/lib/components/AgentCard.svelte` - Commented out component
- ⚠️ `src/lib/components/ReputationDisplay.svelte` - Unused but kept for future
- ⚠️ `src/lib/sdk.ts` - Interface may need updates when re-enabling

## Testing After Re-Enable

1. Check browser console for errors
2. Verify reputation displays for multiple agents
3. Test with agents that have:
   - No feedback
   - Low ratings
   - High ratings
   - Many reviews

## Contact

For updates on contract deployment status, contact the Agent0 team:
- GitHub: https://github.com/agent0lab/agent0-ts
- SDK Docs: https://sdk.ag0.xyz
