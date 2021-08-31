// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export const StrProduct = 'Azure Cache for Redis';
export const StrStatus = 'Status';
export const StrSettings = 'Settings';
export const StrDisabled = 'Disabled';

export const StrHostname = 'Host name';
export const StrNonSslPort = 'Non-SSL port';
export const StrSslPort = 'SSL port';
export const StrResourceId = 'Resource ID';
export const StrAccessKeys = 'Access keys';
export const StrPrimary = 'Primary';
export const StrPrimaryAccessKey = 'Primary access key';
export const StrPrimaryConnectionStr = 'Primary connection string (StackExchange.Redis)';

export const StrGeoReplication = 'Geo-replication';
export const StrLinkedServers = 'Linked servers';
export const StrSku = 'SKU';
export const StrLocation = 'Location';
export const StrRedisVersion = 'Redis version';
export const StrProvisioningState = 'Status';
export const StrShardCount = 'Shard count';

export const StrCopy = 'Copy';
export const StrCopied = 'Copied';
export const StrCopyToClipboard = 'Copy to clipboard';

export const StrTotal = '$$$ total';
export const StrDb = 'Db';
export const StrShard = 'Shard';
export const StrContents = "Contents of '$$$'";
export const StrLoadMoreKeys = '(Load more keys...)';
export const StrLoadMoreValues = '(Load more values...)';
export const StrLoading = '(Loading...)';
export const StrText = 'Text';
export const StrBinary = 'Binary';
export const StrJson = 'JSON';
export const StrShowAll = '(Show all)';
export const StrNotJson = 'Not a JSON object';

export const StrKeyTypes = {
    hash: 'Hash',
    list: 'List',
    set: 'Set',
    string: 'String',
    zset: 'Sorted Set',
    unknown: 'Unknown',
};

export const StrRedisInfo = [
    { key: 'redis_version', name: 'Redis version' },
    { key: 'os', name: 'OS' },
    { key: 'maxmemory_human', name: 'Maximum memory size' },
    { key: 'used_memory_human', name: 'Used memory size' },
    { key: 'used_memory_peak_human', name: 'Peak used memory size' },
    { key: 'maxclients', name: 'Maximum client connections' },
    { key: 'connected_clients', name: 'Active client connections' },
    { key: 'db0', name: 'DB 0' },
    { key: 'db1', name: 'DB 1' },
    { key: 'db2', name: 'DB 2' },
    { key: 'db3', name: 'DB 3' },
    { key: 'db4', name: 'DB 4' },
    { key: 'db5', name: 'DB 5' },
    { key: 'db6', name: 'DB 6' },
    { key: 'db7', name: 'DB 7' },
    { key: 'db8', name: 'DB 8' },
    { key: 'db9', name: 'DB 9' },
    { key: 'keyspace_hits', name: 'Keyspace hits' },
    { key: 'keyspace_misses', name: 'Keyspace misses' },
    { key: 'expired_keys', name: 'Expired keys' },
    { key: 'evicted_keys', name: 'Evicted keys' },
    { key: 'pubsub_channels', name: 'Pub/Sub channels' },
];

export const StrDbInfo = [
    { key: 'keys', name: 'Keys' },
    { key: 'expires', name: 'Expiring' },
    { key: 'avg_ttl', name: 'Average TTL' },
];
