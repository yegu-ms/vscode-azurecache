// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import {
    AzExtTreeItem,
    AzureParentTreeItem,
    GenericTreeItem,
    IActionContext,
    TreeItemIconPath,
} from 'vscode-azureextensionui';
import { AzureSubscriptionTreeItem } from './AzureSubscriptionTreeItem';
import { DataFilterParentItem, SelectableItem } from '../DataFilterParentItem';
import { KeyFilterParentItem } from '../KeyFilterParentItem';
import { KeyFilterItem } from '../filter/KeyFilterItem';
import { RedisDbFilterItem } from '../filter/RedisDbFilterItem';
import { CachePropsWebview } from '../../webview/CachePropsWebview';
import { KeyValue } from '../../../src-shared/KeyValue';
import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { RedisClient } from '../../clients/RedisClient';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { ExtVars } from '../../ExtensionVariables';
import { ErrorEmptyCache } from '../../Strings';
import * as ResourceUtils from '../../utils/ResourceUtils';
import path = require('path');

export interface FilterableDb {
	db: number;
	selected: boolean;
}

export interface ClusterNode {
    id: number;
    port?: number;
}

interface KeyFilter {
    index: number;
    pattern: string;
    item: KeyFilterItem;
}

/**
 * Tree item for an Azure cache.
 */
export class AzureCacheItem extends AzureParentTreeItem implements DataFilterParentItem, KeyFilterParentItem {
    public static contextValue = 'redisCache';
    private static commandId = 'azureCache.viewCacheProps';

    private dbs: FilterableDb[] = [];
    private dbFilterItem: RedisDbFilterItem;
    private filters: KeyFilter[] = [];
    private webview: CachePropsWebview;
    // When the filter expression changes for a clustered cache, use emitter to notify the child tree items.
    private onFilterChangeEmitter = new vscode.EventEmitter<void>();

    constructor(
        parent: AzureSubscriptionTreeItem,
        readonly resClient: RedisResourceClient,
        public parsedRedisResource: ParsedRedisResource
    ) {
        super(parent);
        this.dbFilterItem = new RedisDbFilterItem(this);
        this.filters = [{
            index: 0,
            pattern: '*',
            item: new KeyFilterItem(this, 0, '*')
        }];
        this.webview = new CachePropsWebview(this);
    }

    get commandId(): string {
        return AzureCacheItem.commandId;
    }

    get commandArgs(): unknown[] {
        return [this];
    }

    get contextValue(): string {
        return AzureCacheItem.contextValue;
    }

    get iconPath(): TreeItemIconPath {
        return path.join(ExtVars.context.asAbsolutePath('resources'), 'azure-cache.svg');
    }

    get id(): string {
        return this.parsedRedisResource.resourceId;
    }

    get label(): string {
        return this.parsedRedisResource.name;
    }

    public async loadMoreChildrenImpl(clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        if (clearCache) {
            await this.loadDbs(true, this.parsedRedisResource);
            this.filters.forEach(async filter => {
                await filter.item.refreshDataSet();
            });
        }

        // Map DB numbers to TreeItems
        const treeItems: AzExtTreeItem[] = [];
        treeItems.push(this.dbFilterItem);
        this.filters.forEach(filter => treeItems.push(filter.item));

        return treeItems;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async refreshImpl(): Promise<void> {
        // Get updated ParsedRedisResource
        const { name, resourceGroup } = this.parsedRedisResource;
        this.parsedRedisResource = await this.resClient.getRedisResourceByName(resourceGroup, name);
        // Refresh webview (if open) with the new ParsedRedisResource
        await this.webview.refresh(this.parsedRedisResource);
    }

    public getDataFilters(): SelectableItem[] {
        return this.dbs.map(item => ({
            id: item.db,
            selected: item.selected
        }));
    }

    public getSelectedDataFilters(): SelectableItem[] {
        return this.dbs.filter(item => item.selected).map(item => ({
            id: item.db,
            selected: item.selected
        }));
    }
    
    public addKeyFilter(filterExpr: string): number {
        const i = this.filters.findIndex(filter => filter.pattern === filterExpr);
        if (i < 0) {
            const count = this.filters.length;
            this.filters.push({
                index: count,
                pattern: filterExpr,
                item: new KeyFilterItem(this, count, filterExpr)
            } as KeyFilter);
            this.refresh();
            return count;
        }
        
        return i;
    }

    public getKeyFilter(index: number): string {
        const i = this.filters.findIndex(filter => filter.index === index);
        return i >= 0 ? this.filters[i].pattern : '*';
    }

    public updateKeyFilter(index: number, filterExpr: string): void {
        const i = this.filters.findIndex(filter => filter.index === index);
        if (this.filters[i].pattern !== filterExpr) {
            this.filters[i].pattern = filterExpr;
            this.filters[i].item.refresh();
        }
    }

    public deleteKeyFilter(index: number): void {
        const i = this.filters.findIndex(filter => filter.index === index);
        if (i >= 0) {
            this.filters.splice(i, 1);
            this.refresh();
        }
    }

    private async loadDbs(clearDbs: boolean, parsedRedisResource: ParsedRedisResource) {
        if (clearDbs) {
            this.dbs = [];
        }

        const client = await RedisClient.connectToRedisResource(parsedRedisResource, true);

        // Parse active databases from INFO KEYSPACE command
        const dbRegex = /db([0-9]+)/gm;
        const infoKeyspace = await client.info('keyspace');
        const matches = infoKeyspace.match(dbRegex);

        if (!matches) {
            return [
                new GenericTreeItem(this, {
                    label: ErrorEmptyCache,
                    contextValue: 'emptyCache',
                }),
            ];
        }

        // Extract DB number (e.g. 'db20' to 20)
        matches.forEach((match) => {
            const db = parseInt(match.split('db')[1]);
            if (db !== undefined) {
                this.dbs.push({
                    db,
                    selected: true
                } as FilterableDb);
            }
        })
    }

    public getSelectedDbs(): number[] {
        return this.dbs.filter(item => item.selected).map(item => item.db);
    }

    public setDataFilters(selected: SelectableItem[]) {
        let changed = false;

        this.dbs.forEach(item => {
            if (selected.findIndex(s => s.id === item.db) >= 0) {
                changed = changed ? true : item.selected !== true;
                item.selected = true;
            } else {
                changed = changed ? true : item.selected !== false;
                item.selected = false;
            }
        })

        if (changed) {
            this.refresh();
        }
    }

    public async showCacheProperties(): Promise<void> {
        this.webview.reveal(this.parsedRedisResource.name, this.parsedRedisResource);
    }

    public async getConnectionString(): Promise<string | undefined> {
        return ResourceUtils.getConnectionString(this.parsedRedisResource);
    }

    public async loadInfo(parsedRedisResource: ParsedRedisResource): Promise<KeyValue[] | undefined> {
        const client = await RedisClient.connectToRedisResource(parsedRedisResource, true);

        // Parse active databases from INFO KEYSPACE command
        const info = await client.info('default');
        if (info === undefined) {
            return undefined;
        }

        const parsedInfo: KeyValue[] = [];
        const lines = info.split('\n');
        for (let line of lines) {
            line = line.replace(/\s/ig, '');
            if (line.startsWith('#') || !line) continue;

            const kv = line.split(':');
            parsedInfo.push({
                key: kv[0],
                value: kv[1]
            } as KeyValue);
        }

        return parsedInfo;
    }

    public disposeWebview(): void {
        this.webview.dispose();
    }
}
