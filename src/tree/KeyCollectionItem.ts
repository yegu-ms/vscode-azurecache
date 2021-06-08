// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AzExtTreeItem } from 'vscode-azureextensionui';
import { CollectionElement, CollectionElementValue } from '../../src-shared/CollectionElement';
import { CollectionWebview } from '../webview/CollectionWebview';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { AzureCacheItem } from './azure/AzureCacheItem';
import { AzureCacheClusterItem } from './azure/AzureCacheClusterItem';

/**
 * Base class for tree items that represent a collection-type key, like lists, sets, and hashes.
 */
export abstract class KeyCollectionItem extends AzExtTreeItem {
    /**
     * The Redis resource that the key is in.
     */
    readonly parsedRedisResource: ParsedRedisResource;
    /**
     * The DB number the key is in. For clustered caches this is undefined.
     */
    readonly db: number;
    /**
     * The associated webview.
     */
    protected abstract readonly webview: CollectionWebview;

    constructor(readonly parent: AzureCacheItem | AzureCacheClusterItem, readonly title: string) {
        super(parent);
        this.parsedRedisResource = parent.parsedRedisResource;
        //this.db = parent.db;
        this.db = 0;
    }

    public showWebview(): Promise<void> {
        return this.webview.reveal(this.title);
    }

    public refreshImpl(): Promise<void> {
        return this.webview.refresh();
    }

    public abstract getSize(): Promise<number>;
    public abstract hasNextChildren(): boolean;
    public abstract loadNextChildren(clearCache: boolean): Promise<CollectionElement[]>;
    public abstract loadKeyValue(element: CollectionElement): Promise<CollectionElement>;
}
