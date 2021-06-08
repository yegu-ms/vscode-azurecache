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
import { CachePropsWebview } from '../../webview/CachePropsWebview';
import { RedisClient } from '../../clients/RedisClient';
import { RedisResourceClient } from '../../clients/RedisResourceClient';
import { ExtVars } from '../../ExtensionVariables';
import { ParsedRedisResource } from '../../../src-shared/ParsedRedisResource';
import { ErrorEmptyCache } from '../../Strings';
import * as ResourceUtils from '../../utils/ResourceUtils';
import { KeyFilterItem } from '../filter/KeyFilterItem';
import { KeyFilterParentItem } from '../KeyFilterParentItem';
import { RedisDbFilterItem } from '../filter/RedisDbFilterItem';
import { AzureSubscriptionTreeItem } from './AzureSubscriptionTreeItem';
import path = require('path');
import { DataFilterParentItem } from '../DataFilterParentItem';

/**
 * Tree item for an Azure cache.
 */
export class AzureCacheItem extends AzureParentTreeItem implements DataFilterParentItem, KeyFilterParentItem {
    public static contextValue = 'redisCache';
    private static commandId = 'azureCache.viewCacheProps';

    private filters = ['*'];
    private activeDbs: number[] = [];
    private webview: CachePropsWebview;
    // When the filter expression changes for a clustered cache, use emitter to notify the child tree items.
    private onFilterChangeEmitter = new vscode.EventEmitter<void>();

    constructor(
        parent: AzureSubscriptionTreeItem,
        readonly resClient: RedisResourceClient,
        public parsedRedisResource: ParsedRedisResource
    ) {
        super(parent);
        this.webview = new CachePropsWebview();
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

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const client = await RedisClient.connectToRedisResource(this.parsedRedisResource, true);

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
        this.activeDbs = matches.map((match) => parseInt(match.split('db')[1]));
        // Map DB numbers to TreeItems
        const treeItems: AzExtTreeItem[] = [];
        this.activeDbs.map((db) => treeItems.push(new RedisDbFilterItem(this)));
        this.filters.map((_, index) => treeItems.push(new KeyFilterItem(this, index)));

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

    public getDataFilterList(): number[] {
        return this.activeDbs;
    }

    public addKeyFilter(filterExpr: string): number {
        const found = this.filters.indexOf(filterExpr);
        return found < 0 ? this.filters.push(filterExpr)-1 : found;
    }

    public getKeyFilter(index: number): string {
        return index < this.filters.length ? this.filters[index] : "*";
    }

    public updateKeyFilter(index: number, filterExpr: string): void {
        if (index < this.filters.length && this.filters[index] !== filterExpr) {
            this.filters[index] = filterExpr;
            this.onFilterChangeEmitter.fire();
        }
    }

    public deleteKeyFilter(index: number): void {
        if (index < this.filters.length) {
            this.filters.splice(index, 1);
        }
    }

    public showCacheProperties(): void {
        this.webview.reveal(this.parsedRedisResource.name, this.parsedRedisResource);
    }

    public async getConnectionString(): Promise<string | undefined> {
        return ResourceUtils.getConnectionString(this.parsedRedisResource);
    }

    public disposeWebview(): void {
        this.webview.dispose();
    }
}
