/**
 * Test LRUCache.hashKey with different filter combinations
 */

// Copy the hashKey implementation (NEW VERSION)
function hashKey(obj) {
    // Recursively sort object keys for consistent hashing
    const sortObject = (o) => {
        if (Array.isArray(o)) {
            return o.map(sortObject);
        }
        if (o !== null && typeof o === 'object') {
            return Object.keys(o)
                .sort()
                .reduce((result, key) => {
                    result[key] = sortObject(o[key]);
                    return result;
                }, {});
        }
        return o;
    };

    const str = JSON.stringify(sortObject(obj));
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

// Test different filter scenarios
console.log('=== Test Cache Key Generation ===\n');

const test1 = { filters: {}, pageSize: 20 };
console.log('Test 1 - Empty filters:', test1);
console.log('Key:', hashKey(test1));
console.log();

const test2 = { filters: { name: 'test' }, pageSize: 20 };
console.log('Test 2 - Name filter:', test2);
console.log('Key:', hashKey(test2));
console.log();

const test3 = { filters: { mcp: true }, pageSize: 20 };
console.log('Test 3 - MCP filter:', test3);
console.log('Key:', hashKey(test3));
console.log();

const test4 = { filters: { name: 'test', mcp: true }, pageSize: 20 };
console.log('Test 4 - Multiple filters:', test4);
console.log('Key:', hashKey(test4));
console.log();

// Test that same filters produce same key
const test5a = { filters: { name: 'agent', mcp: true }, pageSize: 20 };
const test5b = { filters: { name: 'agent', mcp: true }, pageSize: 20 };
console.log('Test 5a:', test5a);
console.log('Key:', hashKey(test5a));
console.log('Test 5b:', test5b);
console.log('Key:', hashKey(test5b));
console.log('Keys match:', hashKey(test5a) === hashKey(test5b));
console.log();

// Test that different order produces same key
const test6a = { filters: { mcp: true, name: 'agent' }, pageSize: 20 };
const test6b = { filters: { name: 'agent', mcp: true }, pageSize: 20 };
console.log('Test 6a (mcp first):', test6a);
console.log('Key:', hashKey(test6a));
console.log('Test 6b (name first):', test6b);
console.log('Key:', hashKey(test6b));
console.log('Keys match:', hashKey(test6a) === hashKey(test6b));
console.log();

// Test with undefined vs not present
const test7a = { filters: { name: 'test', mcp: undefined }, pageSize: 20 };
const test7b = { filters: { name: 'test' }, pageSize: 20 };
console.log('Test 7a (with undefined):', test7a);
console.log('Key:', hashKey(test7a));
console.log('Test 7b (without key):', test7b);
console.log('Key:', hashKey(test7b));
console.log('Keys match:', hashKey(test7a) === hashKey(test7b));
