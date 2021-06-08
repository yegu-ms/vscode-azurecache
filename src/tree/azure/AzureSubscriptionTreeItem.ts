// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    createAzureClient,
    IActionContext,
    SubscriptionTreeItemBase,
    AzExtTreeItem
} from 'vscode-azureextensionui';
import { RedisManagementClient } from 'azure-arm-rediscache';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { ParsedRedisListResult } from '../../parsed/ParsedRedisListResult';
import { AzureCacheItem } from './AzureCacheItem';
import { AzureCacheClusterItem } from './AzureCacheClusterItem';

/**
 * Tree item for an Azure subscription.
 */
export class AzureSubscriptionTreeItem extends SubscriptionTreeItemBase {
    private nextLink?: string;

    public hasMoreChildrenImpl(): boolean {
        return this.nextLink !== undefined;
    }

    public async loadMoreChildrenImpl(clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        if (clearCache) {
            this.nextLink = undefined;
        }

        const rmClient = createAzureClient(this.root, RedisManagementClient);
        const resClient = new RedisResourceClient(rmClient);
        const redisCollection: ParsedRedisListResult =
            typeof this.nextLink === 'undefined'
                ? await resClient.listResources()
                : await resClient.listNextResources(this.nextLink);
        this.nextLink = redisCollection.nextLink;

        return redisCollection.map((parsedRedisResource) =>
            !parsedRedisResource.cluster
            ? new AzureCacheItem(this, resClient, parsedRedisResource)
            : new AzureCacheClusterItem(this, resClient, parsedRedisResource)
        );
    }
}
