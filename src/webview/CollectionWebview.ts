// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BaseWebview } from './BaseWebview';
import { KeyCollectionItem } from '../tree/KeyCollectionItem';
import { CollectionElement } from '../../src-shared/CollectionElement';
import { CollectionWebviewData } from '../../src-shared/CollectionWebviewData';
import { RedisHashItem } from '../tree/redis/RedisHashItem';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { WebviewView } from '../../src-shared/WebviewView';

/**
 * Webview for viewing collection type keys (lists, hashes, sets, zsets).
 */
export class CollectionWebview extends BaseWebview {
    protected viewType = this.type;

    constructor(private readonly parent: KeyCollectionItem, private readonly type: string) {
        super();
    }

    /**
     * Sends all the necessary data for the Cache Properties view.
     * @param parsedRedisResource The Redis resource
     */
    protected async sendData(): Promise<void> {
        this.postMessage(WebviewCommand.View, WebviewView.CollectionKey);
        this.postMessage(WebviewCommand.Title, this.parent.title);
        this.postMessage(WebviewCommand.CollectionSize, await this.parent.getSize());
        await this.loadAndSendNextChildren(true);
    }

    /**
     * Processes incoming messages from webview.
     * @param message Webview message
     */
    protected async onDidReceiveMessage(message: WebviewMessage): Promise<void> {
        if (message.command === WebviewCommand.GetValue) {
            const elementValue = await this.parent.loadKeyValue(message.value as CollectionElement);
            this.postMessage(WebviewCommand.CollectionElementData, elementValue);
        } else if (message.command === WebviewCommand.LoadMore) {
            // Load more elements, continuing from previous scan
            await this.loadAndSendNextChildren(false);
        } else if (message.command === WebviewCommand.FilterChange) {
            // Hash filter changed
            if (this.parent instanceof RedisHashItem) {
                this.parent.updateKeyFilter(0, message.value as string);
                await this.loadAndSendNextChildren(true);
            }
        }
    }

    /**
     * Sends the next batch of collection elements to the webview.
     * @param clearCache Whether to load from the beginning
     */
    private async loadAndSendNextChildren(clearCache: boolean): Promise<void> {
        const elements = await this.parent.loadNextChildren(clearCache);
        const hasMore = this.parent.hasNextChildren();
        const collectionData = {
            data: elements,
            clearCache,
            hasMore,
        } as CollectionWebviewData;
        this.postMessage(WebviewCommand.CollectionData, collectionData);
    }

    /**
     * Refreshes the webview by re-sending collection elements to the webview.
     */
    public async refresh(): Promise<void> {
        if (this.webviewPanel) {
            const elements = await this.parent.loadNextChildren(true);
            const hasMore = this.parent.hasNextChildren();
            const collectionData = {
                data: elements,
                clearCache: true,
                hasMore,
            } as CollectionWebviewData;
            this.postMessage(WebviewCommand.CollectionData, collectionData);
        }
    }

    /**
     * Called when webview is disposed.
     */
    protected onDidDispose(): void {
        if (this.parent instanceof RedisHashItem) {
            this.parent.reset();
        }
    }
}
