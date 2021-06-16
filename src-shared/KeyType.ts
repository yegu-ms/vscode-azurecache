// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * All of the supported key data types.
 * Note: Bitmaps and HyperLogLogs count as 'string'.
 */
export enum KeyType {
    Hash = 'hash',
    List = 'list',
    Set = 'set',
    SortedSet = 'zset',
    String = 'string',
    Unknown = 'unknown',
}
