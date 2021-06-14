// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export enum WebviewCommand {
    FontUri = 'fontUri',
    View = 'view',
    // Cache Properties
    ParsedRedisResource = 'parsedRedisResource',
    RedisInfo = 'redisInfo',
    AccessKey = 'accessKey',
    ConnectionString = 'connectionString',
    CopyText = 'copyText',
    // Data viewer
    Title = 'title',
    CollectionSize = 'collectionSize',
    CollectionData = 'collectionData',
    CollectionElementData = 'collectionElementData',
    FilterChange = 'filterChange',
    LoadKeys = 'loadKeys',
    LoadKeyValue = 'loadKeyValue',
    Loading = 'loading',
}
