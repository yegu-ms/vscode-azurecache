// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { BaseWebview } from './BaseWebview';
import { AzureCacheItem } from '../tree/azure/AzureCacheItem';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { WebviewView } from '../../src-shared/WebviewView';
import { getConnectionString } from '../utils/ResourceUtils';

/**
 * Webview for the cache properties view.
 */
export class CachePropsWebview extends BaseWebview {
    protected viewType = 'cacheProps';

    constructor(private readonly parent: AzureCacheItem) {
        super();
    }

    /**
     * Sends all the necessary data for the Cache Properties view.

     * @param parsedRedisResource The Redis resource
     */
    protected async initView(): Promise<void> {
        this.postMessage(WebviewCommand.View, WebviewView.CacheProperties);
    }

    public async initData(parsedRedisResource: ParsedRedisResource): Promise<void> {
        this.postMessage(WebviewCommand.RedisInfo, await this.parent.loadInfo(parsedRedisResource));
        this.postMessage(WebviewCommand.ParsedRedisResource, parsedRedisResource);
        this.postMessage(WebviewCommand.AccessKey, await parsedRedisResource.accessKey);
        this.postMessage(WebviewCommand.ConnectionString, await getConnectionString(parsedRedisResource));
    }

    /**
     * Refreshes the current webview with the given Redis resource information, if the webview is active.
     * @param parsedRedisResource The Redis resource
     */
     public async refresh(parsedRedisResource: ParsedRedisResource): Promise<void> {
        if (this.webviewPanel === undefined) {
            return;
        }

        // Send resource, access key data to webview
        this.initData(parsedRedisResource);
    }

    /**
     * Handle incoming messages.
     */
     protected onDidReceiveMessage(message: WebviewMessage): void {
        if (message.command === WebviewCommand.CopyText && message.value) {
            vscode.env.clipboard.writeText(message.value as string);
        }
    }
}
