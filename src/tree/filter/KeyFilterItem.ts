// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { AzureCacheItem, ClusterNode } from '../azure/AzureCacheItem';
import { KeyCollectionItem } from '../KeyCollectionItem';
import { CollectionElement, CollectionElementValue } from '../../../src-shared/CollectionElement';
import { CollectionWebview } from '../../webview/CollectionWebview';
import { RedisClient } from '../../clients/RedisClient';
import { KeyType } from '../../KeyType';
import { StrAllKeys, StrKeyFilter } from '../../Strings';

/**
 * Tree item for a key filter, which is used in two situations:
 *
 * 1. As a child element of AzureCacheItem if it's a clustered cache.
 * 2. As a child element of RedisDbFilterItem if it's a non-clustered cache.
 */
export class KeyFilterItem extends KeyCollectionItem {
    private static readonly contextValue = 'keyFilter';
    private static readonly commandId = 'azureCache.viewFilteredKeys';
    private static readonly incrementCount = 1;

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
        if (!this.parent.isClustered) {
            this.dbs = this.parent.getSelectedDbs();
        } else {
            this.nodes = this.parent.getSelectedNodes();
        }

        this.currentSelection = 0;
        this.scanCursor = '0';
    }

    public async getSize(): Promise<number> {
        if (this.filter === '*') {
            const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

            let counts: number[];
            if (!this.parent.isClustered) {
                counts = await Promise.all(this.dbs.map(async (db) => client.dbsize(db)));
            } else {
                counts = await Promise.all(this.nodes.map(async (node) => client.dbsize(node.id)));
            }

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
        const dbOrNodeId = !this.parent.isClustered
            ? this.dbs[this.currentSelection]
            : this.nodes[this.currentSelection].id;

        // Sometimes SCAN returns no results, so continue SCANNING until we receive results or we reach the end
        let curCursor = this.scanCursor;
        let scannedKeys: string[] = [];

        do {
            [curCursor, scannedKeys] = await client.scan(curCursor, 'MATCH', this.filter, dbOrNodeId);
        } while (curCursor !== '0' && scannedKeys.length === 0);

        if (curCursor === '0') {
            this.currentSelection += 1;
            this.scanCursor = '0';
        } else {
            this.scanCursor = curCursor;
        }

        const collectionElements = await Promise.all(
            scannedKeys.map(async (key) => {
                const type = await this.getKeyType(client, key);
                if (type !== undefined) {
                    return this.loadValue(client, {
                        key,
                        type,
                        value: [],
                        cursor: type === KeyType.Set || type === KeyType.Hash ? '0' : undefined,
                        hasMore: false,
                    } as CollectionElement);
                } else {
                    return { key, type: 'unknown', value: [], hasMore: false } as CollectionElement;
                }
            })
        );

        return collectionElements.filter((el) => el.type !== 'unknown');
    }

    public hasMoreKeys(): boolean {
        if (
            (!this.parent.isClustered && this.currentSelection >= this.dbs.length) ||
            (this.parent.isClustered && this.currentSelection >= this.nodes.length)
        ) {
            return false;
        }

        return true;
    }

    public async loadKeyValue(element: CollectionElement): Promise<CollectionElement> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);
        return this.loadValue(client, element);
    }

    private async loadValue(client: RedisClient, element: CollectionElement): Promise<CollectionElement> {
        const dbOrNodeId = !this.parent.isClustered
            ? this.dbs[this.currentSelection]
            : this.nodes[this.currentSelection].id;

        if (element.type === KeyType.String) {
            const value = (await client.get(element.key, dbOrNodeId)) || '';
            element.value = [{ key: element.key, value }];
        } else if (element.type === KeyType.List) {
            if (element.size === undefined || element.cursor === undefined) {
                element.size = await client.llen(element.key, dbOrNodeId);
                element.cursor = '0';
            }

            let curCursor = Number(element.cursor);
            if (curCursor < element.size) {
                const min = curCursor;
                const max = Math.min(curCursor + KeyFilterItem.incrementCount, element.size) - 1;
                const values = await client.lrange(element.key, min, max, dbOrNodeId);
                curCursor += values.length;
                element.cursor = String(curCursor);
                element.hasMore = curCursor < element.size;

                values.map((value) => {
                    element.value.push({
                        key: element.key,
                        value,
                    } as CollectionElementValue);
                });
            }
        } else if (element.type === KeyType.Set && element.cursor !== undefined) {
            let curCursor = element.cursor;
            const values: string[] = [];

            do {
                const result = await client.sscan(element.key, curCursor, 'MATCH', '*', dbOrNodeId);
                curCursor = result[0];
                values.push(...result[1]);
            } while (curCursor !== '0' && values.length < KeyFilterItem.incrementCount);

            element.cursor = curCursor === '0' ? undefined : curCursor;
            element.hasMore = element.cursor !== undefined;

            values.map((value) => {
                element.value.push({
                    key: element.key,
                    value,
                } as CollectionElementValue);
            });
        } else if (element.type === KeyType.SortedSet) {
            if (element.size === undefined || element.cursor === undefined) {
                element.size = await client.zcard(element.key, dbOrNodeId);
                element.cursor = '0';
            }

            let curCursor = Number(element.cursor);
            if (curCursor < element.size) {
                const min = curCursor;
                const max = Math.min(curCursor + KeyFilterItem.incrementCount, element.size) - 1;
                const values = await client.zrange(element.key, min, max, dbOrNodeId);
                curCursor = max + 1;
                element.cursor = String(curCursor);
                element.hasMore = curCursor < element.size;

                let value = '';
                // zrange returns a single list alternating between the key value and the key score
                for (let i = 0; i < values.length; i++) {
                    if (i % 2 === 0) {
                        // Even indices contain the key value
                        value = values[i];
                    } else {
                        // Odd indices contain the key score, so construct the tree item here as the associated value is saved
                        element.value.push({
                            key: element.key,
                            id: values[i],
                            value,
                        });
                    }
                }

                element.value = element.value.sort((a, b) => ((a.id || '') > (b.id || '') ? 1 : -1));
            }
        } else if (element.type === KeyType.Hash && element.cursor !== undefined) {
            let curCursor = element.cursor;
            const values: string[] = [];

            // Keep scanning until a total of at least 10 elements have been returned
            // TODO: This can be optimized by sending data to webview after each SCAN instead of waiting until all SCANs have completed
            do {
                const result = await client.hscan(element.key, curCursor, 'MATCH', '*', dbOrNodeId);
                curCursor = result[0];
                values.push(...result[1]);
                // scannedFields contains field name and value, so divide by 2 to get number of values scanned
            } while (curCursor !== '0' && values.length / 2 < KeyFilterItem.incrementCount);

            element.cursor = curCursor === '0' ? undefined : curCursor;
            element.hasMore = element.cursor !== undefined;

            let field = '';
            // HSCAN returns a single list alternating between the hash field name and the hash field value
            for (let i = 0; i < values.length; i++) {
                if (i % 2 === 0) {
                    // Even indices contain the hash field name
                    field = values[i];
                } else {
                    // Odd indices contain the hash field value
                    element.value.push({
                        key: element.key,
                        id: field,
                        value: values[i],
                    });
                }
            }
        } else {
            element.value = [{ key: element.key, value: '' }];
        }

        return element;
    }

    private async getKeyType(client: RedisClient, key: string): Promise<string> {
        return client.type(key, this.dbs[this.currentSelection]);
    }
}
