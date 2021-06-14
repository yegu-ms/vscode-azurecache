// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { AzExtTreeItem, AzureParentTreeItem, IActionContext, TreeItemIconPath } from 'vscode-azureextensionui';
import { AzureSubscriptionTreeItem } from './AzureSubscriptionTreeItem';
import { DataFilterParentItem, SelectableItem } from '../DataFilterParentItem';
import { KeyFilterParentItem } from '../KeyFilterParentItem';
import { KeyFilterItem } from '../filter/KeyFilterItem';
import { RedisDbFilterItem } from '../filter/RedisDbFilterItem';
import { RedisClusterNodeFilterItem } from '../filter/RedisClusterNodeFilterItem';
import { CachePropsWebview } from '../../webview/CachePropsWebview';
import { KeyValue } from '../../../src-shared/KeyValue';
import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { RedisClient } from '../../clients/RedisClient';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { ExtVars } from '../../ExtensionVariables';
import * as ResourceUtils from '../../utils/ResourceUtils';
import path = require('path');

export interface ClusterNode {
    id: string;
    port: number;
}

interface FilterableDb {
    id: number;
    selected: boolean;
}

interface FilterableClusterNode {
    id: string;
    port: number;
    shard: number;
    selected: boolean;
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
    public isClustered = false;

    private dbs?: FilterableDb[];
    private dbFilterItem?: RedisDbFilterItem;
    private nodes?: FilterableClusterNode[];
    private nodeFilterItem?: RedisClusterNodeFilterItem;
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

        if (!parsedRedisResource.cluster) {
            this.dbs = [];
            this.dbFilterItem = new RedisDbFilterItem(this);
        } else {
            this.nodes = [];
            this.nodeFilterItem = new RedisClusterNodeFilterItem(this);
            this.isClustered = true;
        }

        this.filters = [
            {
                index: 0,
                pattern: '*',
                item: new KeyFilterItem(this, 0, '*'),
            },
        ];
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
            if (!this.isClustered) {
                await this.loadDbs(true, this.parsedRedisResource);
            } else {
                await this.loadClusterNodes(true, this.parsedRedisResource);
            }

            this.filters.forEach(async (filter) => {
                await filter.item.refreshDataSet();
            });
        }

        // Map DB numbers to TreeItems
        const treeItems: AzExtTreeItem[] = [];
        if (!this.isClustered && this.dbFilterItem !== undefined) {
            treeItems.push(this.dbFilterItem);
        } else if (this.isClustered && this.nodeFilterItem !== undefined) {
            treeItems.push(this.nodeFilterItem);
        }

        this.filters.forEach((filter) => treeItems.push(filter.item));

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

    public setDataFilters(selected: SelectableItem[]): void {
        let changed = false;

        if (!this.isClustered) {
            this.dbs?.forEach((item) => {
                if (selected.findIndex((s) => s.id === String(item.id)) >= 0) {
                    changed = changed ? true : item.selected !== true;
                    item.selected = true;
                } else {
                    changed = changed ? true : item.selected !== false;
                    item.selected = false;
                }
            });
        } else {
            this.nodes?.forEach((item) => {
                if (selected.findIndex((s) => s.id === item.id) >= 0) {
                    changed = changed ? true : item.selected !== true;
                    item.selected = true;
                } else {
                    changed = changed ? true : item.selected !== false;
                    item.selected = false;
                }
            });
        }

        if (changed) {
            this.refresh();
        }
    }

    public getDataFilters(): SelectableItem[] {
        if (!this.isClustered) {
            return this.dbs !== undefined
                ? this.dbs.map((el) => ({
                      id: String(el.id),
                      selected: el.selected,
                  }))
                : [];
        } else {
            return this.nodes !== undefined
                ? this.nodes.map((el) => ({
                      id: el.id,
                      selected: el.selected,
                  }))
                : [];
        }
    }

    public getSelectedDataFilters(): SelectableItem[] {
        if (!this.isClustered) {
            return this.dbs !== undefined
                ? this.dbs
                      .filter((el) => el.selected)
                      .map((el) => ({
                          id: String(el.id),
                          selected: el.selected,
                      }))
                : [];
        } else {
            return this.nodes !== undefined
                ? this.nodes
                      .filter((el) => el.selected)
                      .map((el) => ({
                          id: el.id,
                          selected: el.selected,
                      }))
                : [];
        }
    }

    public getSelectedDbs(): number[] {
        return this.dbs !== undefined ? this.dbs.filter((el) => el.selected).map((el) => el.id) : [];
    }

    public getSelectedNodes(): ClusterNode[] {
        return this.nodes !== undefined
            ? this.nodes.filter((el) => el.selected).map((el) => ({ id: el.id, port: el.port }))
            : [];
    }

    public addKeyFilter(filterExpr: string): number {
        const i = this.filters.findIndex((filter) => filter.pattern === filterExpr);
        if (i < 0) {
            const count = this.filters.length;
            this.filters.push({
                index: count,
                pattern: filterExpr,
                item: new KeyFilterItem(this, count, filterExpr),
            } as KeyFilter);
            this.refresh();
            return count;
        }

        return i;
    }

    public getKeyFilter(index: number): string {
        const i = this.filters.findIndex((filter) => filter.index === index);
        return i >= 0 ? this.filters[i].pattern : '*';
    }

    public updateKeyFilter(index: number, filterExpr: string): void {
        const i = this.filters.findIndex((filter) => filter.index === index);
        if (this.filters[i].pattern !== filterExpr) {
            this.filters[i].pattern = filterExpr;
            this.filters[i].item.refresh();
        }
    }

    public deleteKeyFilter(index: number): void {
        const i = this.filters.findIndex((filter) => filter.index === index);
        if (i >= 0) {
            this.filters.splice(i, 1);
            this.refresh();
        }
    }

    private async loadDbs(clearDbs: boolean, parsedRedisResource: ParsedRedisResource): Promise<void> {
        if (clearDbs) {
            this.dbs = [];
        }

        const client = await RedisClient.connectToRedisResource(parsedRedisResource, true);

        // Parse active databases from INFO KEYSPACE command
        const dbRegex = /db([0-9]+)/gm;
        const infoKeyspace = await client.info('keyspace');
        const matches = infoKeyspace.match(dbRegex);
        if (matches) {
            // Extract DB number (e.g. 'db20' to 20)
            matches.forEach((match) => {
                const id = parseInt(match.split('db')[1]);
                if (id !== undefined) {
                    this.dbs?.push({
                        id,
                        selected: true,
                    } as FilterableDb);
                }
            });
        }
    }

    private async loadClusterNodes(clearDbs: boolean, parsedRedisResource: ParsedRedisResource): Promise<void> {
        if (clearDbs) {
            this.nodes = [];
        }

        const client = await RedisClient.connectToRedisResource(parsedRedisResource, true);
        const nodeIds = client.clusterNodeIds;
        for (const nodeId of nodeIds) {
            const port = (await client.getClusterNodeOptions(nodeId)).port;
            if (port !== undefined) {
                this.nodes?.push({
                    id: nodeId,
                    port,
                    shard: Math.floor((port % 100) / 2),
                    selected: true,
                } as FilterableClusterNode);
            }
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
            line = line.replace(/\s/gi, '');
            if (line.startsWith('#') || !line) {
                continue;
            }

            const kv = line.split(':');
            parsedInfo.push({
                key: kv[0],
                value: kv[1],
            } as KeyValue);
        }

        return parsedInfo;
    }

    public disposeWebview(): void {
        this.webview.dispose();
    }
}
