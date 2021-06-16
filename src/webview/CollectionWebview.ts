// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BaseWebview } from './BaseWebview';
import { KeyCollectionItem } from '../tree/KeyCollectionItem';
import { CollectionElement } from '../../src-shared/CollectionElement';
import { CollectionWebviewData } from '../../src-shared/CollectionWebviewData';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { WebviewView } from '../../src-shared/WebviewView';

/**
 * Webview for viewing collection type keys (lists, hashes, sets, zsets).
 */
export class CollectionWebview extends BaseWebview {
    constructor(private readonly parent: KeyCollectionItem, protected readonly viewType: string) {
        super();
    }

    protected async initView(): Promise<void> {
        this.postMessage(WebviewCommand.View, WebviewView.KeyCollection);
        this.postMessage(WebviewCommand.Title, this.parent.label);
    }

    protected async initData(): Promise<void> {
        this.postMessage(WebviewCommand.CollectionSize, await this.parent.getSize());
        this.loadAndSendNextChildren(true);
    }

    /**
     * Processes incoming messages from webview.
     * @param message Webview message
     */
    protected async onDidReceiveMessage(message: WebviewMessage): Promise<void> {
        if (message.command === WebviewCommand.LoadKeyValue) {
            const elementValue = await this.parent.loadKeyValue(message.value as CollectionElement);
            this.postMessage(WebviewCommand.CollectionElementData, elementValue);
        } else if (message.command === WebviewCommand.LoadKeys) {
            // Load more elements, continuing from previous scan
            await this.loadAndSendNextChildren(false);
        } else if (message.command === WebviewCommand.FilterChange) {
            await this.loadAndSendNextChildren(true);
        }
    }

    /**
     * Refreshes the webview by re-sending collection elements to the webview.
     */
    public async refresh(): Promise<void> {
        if (this.webviewPanel === undefined) {
            return;
        }

        this.initData();
    }

    /**
     * Sends the next batch of collection elements to the webview.
     * @param clearCache Whether to load from the beginning
     */
    private async loadAndSendNextChildren(clearCache: boolean): Promise<void> {
        if (this.webviewPanel !== undefined) {
            const elements = await this.parent.loadMoreKeys(clearCache);
            const hasMore = this.parent.hasMoreKeys();
            const collectionData = {
                data: elements,
                clearCache,
                hasMore,
            } as CollectionWebviewData;
            this.postMessage(WebviewCommand.CollectionData, collectionData);
        }
    }
}
