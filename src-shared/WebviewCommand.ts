// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export enum WebviewCommand {
    FontUri = 'fontUri',
    View = 'view',
    // Cache Properties
    ParsedRedisResource = 'parsedRedisResource',
    AccessKey = 'accessKey',
    ConnectionString = 'connectionString',
    CopyText = 'copyText',
    // Data viewer
    Title = 'title',
    KeyName = 'keyName',
    CollectionSize = 'collectionSize',
    CollectionData = 'collectionData',
    CollectionElementData = 'collectionElementData',
    FilterChange = 'filterChange',
    GetValue = 'loadKeyValue',
    LoadMore = 'loadMore',
}
