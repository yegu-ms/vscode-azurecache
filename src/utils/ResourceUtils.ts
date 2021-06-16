// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';

/**
 * Returns StackExchange.Redis connection string.
 *
 * @param parsedRedisResource The Redis resource.
 * @param accessKey The access key/password
 */
export async function getConnectionString(parsedRedisResource: ParsedRedisResource): Promise<string | undefined> {
    const accessKey = await parsedRedisResource.accessKey;
    if (accessKey === undefined) {
        return undefined;
    }

    const { hostName, sslPort } = parsedRedisResource;
    return `${hostName}:${sslPort},password=${accessKey},ssl=True,abortConnect=False`;
}

export function getShardNumber(port: number): number {
    return Math.floor((port % 100) / 2);
}
