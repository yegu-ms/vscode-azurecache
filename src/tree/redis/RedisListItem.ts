// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { CollectionElement } from '../../../src-shared/CollectionElement';
import { CollectionWebview } from '../../webview/CollectionWebview';
import { KeyCollectionItem } from '../KeyCollectionItem';

/**
 * Tree item for a list.
 */
export class RedisListItem extends KeyCollectionItem {
    private static readonly commandId = 'azureCache.viewList';
    private static readonly contextValue = 'redisListItem';
    private static readonly description = '(list)';
    private static readonly incrementCount = 10;

    protected webview: CollectionWebview = new CollectionWebview(this, 'list');
    private elementsShown = 0;
    private size = 0;

    get contextValue(): string {
        return RedisListItem.contextValue;
    }

    get commandId(): string {
        return RedisListItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this];
    }

    get description(): string {
        return RedisListItem.description;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('key');
    }

    get label(): string {
        return this.key;
    }

    public async getSize(): Promise<number> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);
        return client.llen(this.key, this.db);
    }

    /**
     * Loads additional list elements as children by keeping track of the list length and number of elements loaded so far.
     */
    public async loadMoreKeys(clearCache: boolean): Promise<CollectionElement[]> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        if (clearCache) {
            this.size = await client.llen(this.key, this.db);
            this.elementsShown = 0;
        }

        if (this.elementsShown === this.size) {
            return [];
        }

        // Construct tree items such that the numbering continues from the previously loaded items
        const min = this.elementsShown;
        const max = Math.min(this.elementsShown + RedisListItem.incrementCount, this.size) - 1;
        const values = await client.lrange(this.key, min, max, this.db);
        this.elementsShown += values.length;

        const collectionElements = values.map((value) => {
            return {
                key: value,
            } as CollectionElement;
        });

        return collectionElements;
    }

    public hasMoreKeys(): boolean {
        return this.elementsShown !== this.size;
    }
}
