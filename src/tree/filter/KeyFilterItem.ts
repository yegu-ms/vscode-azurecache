// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { AzureCacheItem } from '../azure/AzureCacheItem';
import { AzureCacheClusterItem } from '../azure/AzureCacheClusterItem';
import { KeyCollectionItem } from '../KeyCollectionItem';
import { CollectionElement, CollectionElementValue } from '../../../src-shared/CollectionElement';
import { CollectionWebview } from '../../webview/CollectionWebview';
import { RedisClient } from '../../clients/RedisClient';
import { StrKeyFilter } from '../../Strings';

/**
 * Tree item for a key filter, which is used in two situations:
 *
 * 1. As a child element of AzureCacheItem if it's a clustered cache.
 * 2. As a child element of RedisDbFilterItem if it's a non-clustered cache.
 */
export class KeyFilterItem extends KeyCollectionItem {
    private static readonly contextValue = 'keyFilterItem';
    private static readonly commandId = 'azureCache.viewFilteredKeys';

    protected webview: CollectionWebview = new CollectionWebview(this, 'filteredKeys');

    private filterIndex: number;
    private scanCursor?: string = '0';

    constructor(readonly parent: AzureCacheItem | AzureCacheClusterItem, readonly index: number = 0) {
        super(parent, `${StrKeyFilter} ${parent.getKeyFilter(index)}`);
        this.filterIndex = index;
    }

    get commandId(): string {
        return KeyFilterItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this];
    }

    get contextValue(): string {
        return KeyFilterItem.contextValue;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('key');
    }

    get label(): string {
        return this.title;
    }

    public async getSize(): Promise<number> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);
        return client.dbsize(this.db);
    }

    public hasNextChildren(): boolean {
        return typeof this.scanCursor === 'string';
    }

    /**
     * Loads additional set elements as children by running the SSCAN command and keeping track of the current cursor.
     */
    public async loadNextChildren(clearCache: boolean): Promise<CollectionElement[]> {
        if (clearCache) {
            this.scanCursor = '0';
        }

        if (typeof this.scanCursor === 'undefined') {
            return [];
        }
        
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        // Sometimes SCAN returns no results, so continue SCANNING until we receive results or we reach the end
        let curCursor = this.scanCursor;
        let scannedKeys: string[] = [];

        do {
            [curCursor, scannedKeys] = await client.scan(curCursor, 'MATCH', this.parent.getKeyFilter(this.filterIndex), this.db);
        } while (curCursor !== '0' && scannedKeys.length === 0);

        this.scanCursor = curCursor === '0' ? undefined : curCursor;
        const collectionElements = await Promise.all(scannedKeys.map(async (key) => {
            const type = await this.getKeyType(client, this.db, key);
            const value = await this.getKeyValue(client, this.db, key, type);
            return {
                key,
                type,
                value
            } as CollectionElement;
        }));

        return collectionElements;
    }

    public async loadKeyValue(element: CollectionElement): Promise<CollectionElement> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        let type = element.type;
        if (typeof type === 'undefined') {
            type = await this.getKeyType(client, this.db, element.key);
        }

        const value = await this.getKeyValue(client, this.db, element.key, type);

        return {
            ...element,
            type,
            value
        } as CollectionElement;
    }

    private async getKeyType(client: RedisClient, db: number, key: string): Promise<string> {
        return client.type(key, db);
    }

    private async getKeyValue(client: RedisClient, db: number, key: string, type: string): Promise<CollectionElementValue[]> {
        const values: CollectionElementValue[] = [];
        if (type === 'string') {
            const value = await client.get(key, db);
            values.push({ key, value } as CollectionElementValue); 
        } else {
            values.push({ key });
        }

        return values;
    }
}
