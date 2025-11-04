/**
 * Test script to debug cache cloning issue
 */

// Simulate an agent object from SDK
const mockAgent = {
    id: '1',
    name: 'Test Agent',
    description: 'Test',
    imageUrl: 'test.png',
    mcp: true,
    a2a: false,
    mcpTools: ['github', 'filesystem'],
    a2aSkills: null,  // SDK might return null
    mcpPrompts: undefined,
    mcpResources: [],
    active: true,
    x402support: false,
    supportedTrusts: null,
    owners: ['0x123'],
    operators: null,
    chainId: 11155111,
    walletAddress: '0x456',
    extras: { custom: 'data' }
};

console.log('Original agent:', mockAgent);

// Test 1: Old approach (broken)
console.log('\n=== Test 1: Old approach (spread with ternary) ===');
try {
    const cloned1 = {
        ...mockAgent,
        mcpTools: mockAgent.mcpTools ? [...mockAgent.mcpTools] : undefined,
        a2aSkills: mockAgent.a2aSkills ? [...mockAgent.a2aSkills] : undefined,
        mcpPrompts: mockAgent.mcpPrompts ? [...mockAgent.mcpPrompts] : undefined,
        mcpResources: mockAgent.mcpResources ? [...mockAgent.mcpResources] : undefined,
        supportedTrusts: mockAgent.supportedTrusts ? [...mockAgent.supportedTrusts] : undefined,
        owners: mockAgent.owners ? [...mockAgent.owners] : undefined,
        operators: mockAgent.operators ? [...mockAgent.operators] : undefined,
        extras: mockAgent.extras ? { ...mockAgent.extras } : undefined
    };
    console.log('✅ Test 1 passed');
    console.log('Cloned:', cloned1);
} catch (e) {
    console.log('❌ Test 1 FAILED:', e.message);
}

// Test 2: Helper function approach
console.log('\n=== Test 2: Helper function approach ===');
function cloneArray(arr) {
    if (!arr || !Array.isArray(arr)) return undefined;
    return [...arr];
}

function cloneObject(obj) {
    if (!obj || typeof obj !== 'object') return undefined;
    return { ...obj };
}

try {
    const cloned2 = {
        ...mockAgent,
        mcpTools: cloneArray(mockAgent.mcpTools),
        a2aSkills: cloneArray(mockAgent.a2aSkills),
        mcpPrompts: cloneArray(mockAgent.mcpPrompts),
        mcpResources: cloneArray(mockAgent.mcpResources),
        supportedTrusts: cloneArray(mockAgent.supportedTrusts),
        owners: cloneArray(mockAgent.owners),
        operators: cloneArray(mockAgent.operators),
        extras: cloneObject(mockAgent.extras)
    };
    console.log('✅ Test 2 passed');
    console.log('Cloned:', cloned2);
} catch (e) {
    console.log('❌ Test 2 FAILED:', e.message);
}

// Test 3: Check if null is truthy
console.log('\n=== Test 3: Null truthiness check ===');
console.log('null ? true : false =', null ? true : false);
console.log('[] ? true : false =', [] ? true : false);
console.log('undefined ? true : false =', undefined ? true : false);

// Test 4: What happens with spread on null
console.log('\n=== Test 4: Spread operator on different values ===');
try {
    console.log('[...null] =', [...null]);
} catch (e) {
    console.log('❌ [...null] throws:', e.message);
}

try {
    console.log('[...undefined] =', [...undefined]);
} catch (e) {
    console.log('❌ [...undefined] throws:', e.message);
}

try {
    console.log('[...[]] =', [...[]]);
    console.log('✅ [...[]] works');
} catch (e) {
    console.log('❌ [...[]] throws:', e.message);
}

// Test 5: Array.isArray checks
console.log('\n=== Test 5: Array.isArray checks ===');
console.log('Array.isArray(null) =', Array.isArray(null));
console.log('Array.isArray(undefined) =', Array.isArray(undefined));
console.log('Array.isArray([]) =', Array.isArray([]));
console.log('Array.isArray({}) =', Array.isArray({}));
