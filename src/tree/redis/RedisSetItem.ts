// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { TreeItemIconPath } from 'vscode-azureextensionui';
import { RedisClient } from '../../clients/RedisClient';
import { CollectionElement } from '../../../src-shared/CollectionElement';
import { CollectionWebview } from '../../webview/CollectionWebview';
import { KeyCollectionItem } from '../KeyCollectionItem';

/**
 * Tree item for a set.
 */
export class RedisSetItem extends KeyCollectionItem {
    private static readonly commandId = 'azureCache.viewSet';
    private static readonly contextValue = 'redisSetItem';
    private static readonly description = '(set)';
    private static readonly incrementCount = 10;

    protected webview: CollectionWebview = new CollectionWebview(this, 'set');
    private scanCursor?: string = '0';

    get contextValue(): string {
        return RedisSetItem.contextValue;
    }

    get commandId(): string {
        return RedisSetItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this];
    }

    get description(): string {
        return RedisSetItem.description;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('key');
    }

    get label(): string {
        return this.key;
    }

    public async getSize(): Promise<number> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);
        return client.scard(this.key, this.db);
    }

    /**
     * Loads additional set elements as children by running the SSCAN command and keeping track of the current cursor.
     */
    public async loadMoreKeys(clearCache: boolean): Promise<CollectionElement[]> {
        if (clearCache) {
            this.scanCursor = '0';
        }

        if (typeof this.scanCursor === 'undefined') {
            return [];
        }

        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource);

        // Sometimes SCAN returns no results, so continue SCANNING until we receive results or we reach the end
        let curCursor = this.scanCursor;
        const scannedElems: string[] = [];

        do {
            const result = await client.sscan(this.key, curCursor, 'MATCH', '*', this.db);
            curCursor = result[0];
            scannedElems.push(...result[1]);
        } while (curCursor !== '0' && scannedElems.length < RedisSetItem.incrementCount);

        this.scanCursor = curCursor === '0' ? undefined : curCursor;

        const collectionElements = scannedElems.map((element) => {
            return {
                key: element,
            } as CollectionElement;
        });
        return collectionElements;
    }

    public hasMoreKeys(): boolean {
        return typeof this.scanCursor === 'string';
    }
}
