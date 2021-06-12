// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { AzureCacheItem, ClusterNode } from '../azure/AzureCacheItem';
import { KeyCollectionItem } from '../KeyCollectionItem';
import { CollectionElement, CollectionElementValue } from '../../../src-shared/CollectionElement';
import { CollectionWebview } from '../../webview/CollectionWebview';
import { RedisClient } from '../../clients/RedisClient';
import { StrAllKeys, StrKeyFilter } from '../../Strings';

/**
 * Tree item for a key filter, which is used in two situations:
 *
 * 1. As a child element of AzureCacheItem if it's a clustered cache.
 * 2. As a child element of RedisDbFilterItem if it's a non-clustered cache.
 */
export class KeyFilterItem extends KeyCollectionItem {
    private static readonly contextValue = 'keyFilterItem';
    private static readonly commandId = 'azureCache.viewFilteredKeys';

    protected webview: CollectionWebview;

    private filter: string;
    private dbs: number[] = [];
    private nodes: ClusterNode[] = [];
    private currentSelection = 0;
    private scanCursor = '0';

    constructor(readonly parent: AzureCacheItem, readonly index: number, readonly pattern: string) {
        super(parent);
        this.filter = pattern;
        this.webview = new CollectionWebview(this, 'filteredKeys');
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
        return this.filter === '*' ? StrAllKeys : StrKeyFilter.replace('$$$', this.filter);
    }

    public getFilter(): string {
        return this.filter;
    }

    public setFilter(filter: string): void {
        if (this.filter !== filter) {
            this.filter = filter;
            this.parent.updateKeyFilter(this.index, filter);
            this.webview.setTitle(this.label);
            this.webview.refresh();
        }
    }

    public async refreshDataSet(): Promise<void> {
        if (!this.parent.parsedRedisResource.cluster) {
            this.dbs = (this.parent as AzureCacheItem).getSelectedDbs();
        }
        this.currentSelection = 0;
        this.scanCursor = '0';
    }

    public async getSize(): Promise<number> {
        if (this.filter === '*') {
            const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);
            const counts: number[] = await Promise.all(this.dbs.map(async (db) => client.dbsize(db)));
            return counts.length ? counts.reduce((total, current) => total + current) : 0;
        }

        return 0;
    }

    /**
     * Loads additional set elements as children by running the SSCAN command and keeping track of the current cursor.
     */
    public async loadMoreKeys(clearCache: boolean): Promise<CollectionElement[]> {
        if (clearCache) {
            await this.refreshDataSet();
        }
        
        if (!this.hasMoreKeys()) {
            return [];
        }
        
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        // Sometimes SCAN returns no results, so continue SCANNING until we receive results or we reach the end
        let curCursor = this.scanCursor;
        let scannedKeys: string[] = [];

        do {
            [curCursor, scannedKeys] = await client.scan(curCursor, 'MATCH', this.filter, this.dbs[this.currentSelection]);
        } while (curCursor !== '0' && scannedKeys.length === 0);

        if (curCursor === '0') {
            this.currentSelection += 1;
            this.scanCursor = '0';
        } else {
            this.scanCursor = curCursor;
        }

        const collectionElements = await Promise.all(scannedKeys.map(async (key) => {
            const type = await this.getKeyType(client, this.dbs[this.currentSelection], key);
            const value = await this.getKeyValue(client, this.dbs[this.currentSelection], key, type);
            return {
                key,
                type,
                value
            } as CollectionElement;
        }));

        return collectionElements;
    }

    public hasMoreKeys(): boolean {
        if ((!this.parsedRedisResource.cluster && this.currentSelection >= this.dbs.length) ||
            (this.parsedRedisResource.cluster && this.currentSelection >= this.nodes.length)) {
            return false;
        }

        return true;
    }

    public async loadKeyValue(element: CollectionElement): Promise<CollectionElement> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        let type = element.type;
        if (type === undefined) {
            type = await this.getKeyType(client, this.dbs[this.currentSelection], element.key);
        }

        const value = await this.getKeyValue(client, this.dbs[this.currentSelection], element.key, type);

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
