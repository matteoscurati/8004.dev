# Network Support

## Current Status

The application currently supports **Sepolia Testnet only**.

### Network Details

- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: Configured in `.env` file
- **Explorer**: https://sepolia.etherscan.io

## UI Indicators

### 1. Network Badge (Home Page)
At the top of the main page, users see:
```
🌐 Currently on Sepolia Testnet
```

This badge:
- Has a cyan/blue tint background
- Uses the primary color for "Sepolia Testnet" text
- Is always visible to remind users of the current network

### 2. Network Filter (Filters Section)
In the collapsed filters section, there's a "Network" filter showing:
- **Value**: "Sepolia Testnet" (read-only, disabled)
- **Note**: "More networks coming soon"
- **Layout**: Full width on desktop, spans both columns

## Future Multi-Network Support

To add support for additional networks in the future:

### 1. Update Environment Configuration

Add network-specific configuration in `.env`:

```env
# Current (Sepolia)
PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PUBLIC_CHAIN_ID=11155111

# Future: Add more networks
# Mainnet
PUBLIC_RPC_URL_MAINNET=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
PUBLIC_CHAIN_ID_MAINNET=1

# Polygon
PUBLIC_RPC_URL_POLYGON=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
PUBLIC_CHAIN_ID_POLYGON=137
```

### 2. Update SDK Initialization

Modify `src/lib/sdk.ts` to support multiple networks:

```typescript
import { writable } from 'svelte/store';

export const selectedNetwork = writable<number>(11155111); // Default: Sepolia

export function getSDK(chainId?: number): SDK {
    const targetChainId = chainId || get(selectedNetwork);

    // Get network-specific config
    const config = getNetworkConfig(targetChainId);

    return new SDK(config);
}

function getNetworkConfig(chainId: number) {
    switch (chainId) {
        case 11155111: // Sepolia
            return {
                chainId: 11155111,
                rpcUrl: PUBLIC_RPC_URL_SEPOLIA,
                ipfs: PUBLIC_IPFS_PROVIDER,
                // ...
            };
        case 1: // Mainnet
            return {
                chainId: 1,
                rpcUrl: PUBLIC_RPC_URL_MAINNET,
                ipfs: PUBLIC_IPFS_PROVIDER,
                // ...
            };
        // Add more networks...
    }
}
```

### 3. Update Network Filter UI

Modify `src/lib/components/SearchFilters.svelte`:

```svelte
<div class="filter-group">
    <label for="network">Network:</label>
    <select id="network" class="pixel-input" bind:value={selectedNetworkId}>
        <option value="11155111">Sepolia Testnet</option>
        <option value="1">Ethereum Mainnet</option>
        <option value="137">Polygon</option>
        <option value="8453">Base</option>
    </select>
</div>

<script>
    import { selectedNetwork } from '$lib/sdk';

    let selectedNetworkId = $state(11155111);

    // Update store when network changes
    $effect(() => {
        selectedNetwork.set(selectedNetworkId);
        // Re-run search with new network
        handleSearch(currentFilters);
    });
</script>
```

### 4. Update Network Badge

Make the badge dynamic in `src/routes/+page.svelte`:

```svelte
<script>
    import { selectedNetwork } from '$lib/sdk';

    const networkNames = {
        11155111: 'Sepolia Testnet',
        1: 'Ethereum Mainnet',
        137: 'Polygon',
        8453: 'Base'
    };

    $: networkName = networkNames[$selectedNetwork] || 'Unknown Network';
</script>

<div class="network-info pixel-card">
    <span class="network-badge">
        <span class="network-icon">🌐</span>
        <span class="network-text">Currently on <strong>{networkName}</strong></span>
    </span>
</div>
```

### 5. Contract Addresses

Ensure the SDK has correct contract addresses for each network. The SDK uses registry overrides:

```typescript
const config = {
    chainId: targetChainId,
    rpcUrl: rpcUrl,
    registryOverrides: {
        [chainId]: {
            'IDENTITY': '0x...',
            'REPUTATION': '0x...',
            // etc.
        }
    }
};
```

## Network Requirements

For each new network, you need:

1. **RPC Provider**: Alchemy, Infura, or public RPC
2. **Contract Deployments**: Agent0 contracts deployed on that network
3. **Subgraph**: Indexed data available for that network
4. **IPFS Access**: Same IPFS gateway works across networks
5. **Testing**: Verify agents can be registered and discovered

## Supported Networks (Agent0 Ecosystem)

Check with the Agent0 team for officially supported networks:
- Documentation: https://sdk.ag0.xyz
- GitHub: https://github.com/agent0lab/agent0-ts

As of v0.2.1, the SDK primarily targets testnets (Sepolia).

## Testing Multi-Network

When adding network support:

1. **Switch Networks**: Test network switching in UI
2. **Agent Discovery**: Verify agents from different networks display correctly
3. **Search/Filter**: Ensure search works on each network
4. **Performance**: Check RPC response times
5. **Edge Cases**: Test with networks that have 0 agents

## Visual Design Considerations

- Use different color tints for different networks (blue for testnet, green for mainnet)
- Show chain ID in tooltip for clarity
- Indicate mainnet vs testnet clearly
- Warn users about network-specific features

## Current Implementation Files

- `src/lib/components/SearchFilters.svelte` - Network filter (disabled)
- `src/routes/+page.svelte` - Network badge
- `src/lib/sdk.ts` - SDK initialization with fixed Sepolia config
- `.env` - Network configuration
