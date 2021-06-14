// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AzExtTreeItem } from 'vscode-azureextensionui';
import { CollectionElement } from '../../src-shared/CollectionElement';
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
     * The associated webview.
     */
    protected abstract readonly webview: CollectionWebview;

    constructor(readonly parent: AzureCacheItem | AzureCacheClusterItem) {
        super(parent);
        this.parsedRedisResource = parent.parsedRedisResource;
    }

    public showWebview(): Promise<void> {
        return this.webview.reveal(this.label, null);
    }

    public refreshImpl(): Promise<void> {
        return this.webview.refresh();
    }

    public abstract refreshDataSet(): Promise<void>;
    public abstract getSize(): Promise<number>;
    public abstract loadMoreKeys(clearCache: boolean): Promise<CollectionElement[]>;
    public abstract hasMoreKeys(): boolean;
    public abstract loadKeyValue(element: CollectionElement): Promise<CollectionElement>;
}
