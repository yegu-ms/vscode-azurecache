// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import {
    AzExtTreeDataProvider,
    AzExtTreeItem,
    AzureUserInput,
    createAzExtOutputChannel,
    IActionContext,
    registerCommand,
    registerUIExtensionVariables,
} from 'vscode-azureextensionui';
import { AzureAccount } from './AzureAccount.api';
import { RedisClient } from './clients/RedisClient';
import { ExtVars } from './ExtensionVariables';
import { textInput } from './Input';
import { quickPick } from './QuickPick';
import { KeyContentProvider } from './KeyContentProvider';
import { ParsedRedisResource } from '../src-shared/ParsedRedisResource';
import { AzureAccountTreeItem } from './tree/azure/AzureAccountTreeItem';
import { AzureCacheItem } from './tree/azure/AzureCacheItem';
import { RedisDbFilterItem } from './tree/filter/RedisDbFilterItem';
import { KeyFilterParentItem } from './tree/KeyFilterParentItem';
import { KeyFilterItem } from './tree/filter/KeyFilterItem';
import * as Strings from './Strings';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    ExtVars.context = context;
    ExtVars.ignoreBundle = false;
    ExtVars.ui = new AzureUserInput(context.globalState);
    ExtVars.outputChannel = createAzExtOutputChannel('Azure Cache', ExtVars.prefix);
    context.subscriptions.push(ExtVars.outputChannel);
    registerUIExtensionVariables(ExtVars);

    ExtVars.keyContentProvider = new KeyContentProvider();
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(ExtVars.prefix, ExtVars.keyContentProvider)
    );

    const azureAccountTreeItem = new AzureAccountTreeItem();
    context.subscriptions.push(azureAccountTreeItem);

    ExtVars.treeDataProvider = new AzExtTreeDataProvider(azureAccountTreeItem, `${ExtVars.prefix}.loadMore`);
    ExtVars.treeView = vscode.window.createTreeView(ExtVars.prefix, { treeDataProvider: ExtVars.treeDataProvider });
    context.subscriptions.push(ExtVars.treeView);

    const accountExtension: vscode.Extension<AzureAccount> | undefined = vscode.extensions.getExtension<AzureAccount>(
        'ms-vscode.azure-account'
    );

    if (accountExtension) {
        const azureAccount = accountExtension.exports;
        context.subscriptions.push(
            azureAccount.onStatusChanged((status) => {
                if (status === 'LoggedOut') {
                    RedisClient.disposeClients();
                }
            })
        );
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.addKeyFilter', async (treeItem: KeyFilterParentItem) => {
            const input = await textInput(
                '*',
                Strings.StrPromptKeyFilter,
                /**
                 * TODO: Here and elsewhere: make this more localization-friendly as some localities might put things
                 *       in a different order (e.g. filter expression text going before the 'Current:' string).
                 */
                '*'
            );
            if (input !== undefined) {
                treeItem.addKeyFilter(input);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.selectDatabases', async (treeItem: RedisDbFilterItem) => {
            const picks = await quickPick(
                treeItem.getDbSelections(),
                Strings.StrSelectDbs
            );
            if (picks !== undefined) {
                treeItem.setDbSelections(picks);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.setKeyFilter', async (treeItem: KeyFilterItem) => {
            const currentFilter = treeItem.getFilter();
            const input = await textInput(
                currentFilter,
                Strings.StrPromptKeyFilter,
                /**
                 * TODO: Here and elsewhere: make this more localization-friendly as some localities might put things
                 *       in a different order (e.g. filter expression text going before the 'Current:' string).
                 */
                `${Strings.StrCurrent}: ${currentFilter}`
            );
            if (input !== undefined) {
                treeItem.setFilter(input);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.viewFilteredKeys', async (treeItem: KeyFilterItem) => {
            treeItem.showWebview();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.viewCacheProps', async (azureCacheItem: AzureCacheItem) => {
            azureCacheItem.showCacheProperties();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'azureCache.showStringItem',
            async (parsedRedisResource: ParsedRedisResource, db: number | undefined, key: string) => {
                await ExtVars.keyContentProvider.showKey(parsedRedisResource, db, 'string', key);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('azureCache.showUnsupportedItem', () => {
            vscode.window.showInformationMessage(Strings.ErrorUnsupportedKeyType);
        })
    );

    registerCommand(
        'azureCache.copyConnectionString',
        async (actionContext: IActionContext, treeItem?: AzureCacheItem) => {
            if (treeItem === undefined) {
                treeItem = (await ExtVars.treeDataProvider.showTreeItemPicker(
                    AzureCacheItem.contextValue,
                    actionContext
                )) as AzureCacheItem;
            }

            const connectionString = await treeItem.getConnectionString();
            if (connectionString !== undefined) {
                vscode.env.clipboard.writeText(connectionString);
            } else {
                vscode.window.showErrorMessage(Strings.ErrorConnectionString);
            }
        }
    );

    registerCommand('azureCache.loadMore', (actionContext: IActionContext, treeItem: AzExtTreeItem) =>
        ExtVars.treeDataProvider.loadMore(treeItem, actionContext)
    );

    registerCommand('azureCache.refresh', (_actionContext: IActionContext, treeItem?: AzExtTreeItem) =>
        ExtVars.treeDataProvider.refresh(treeItem)
    );

    registerCommand('azureCache.openInPortal', async (actionContext: IActionContext, treeItem?: AzureCacheItem) => {
        if (treeItem === undefined) {
            treeItem = (await ExtVars.treeDataProvider.showTreeItemPicker(
                AzureCacheItem.contextValue,
                actionContext
            )) as AzureCacheItem;
        }

        await treeItem.openInPortal();
    });

    registerCommand('azureCache.selectSubscriptions', () => {
        vscode.commands.executeCommand('azure-account.selectSubscriptions');
    });
}

// This method is called when extension is deactivated
export function deactivate(): Promise<void> {
    // Disconnect active Redis connections
    return RedisClient.disposeClients();
}
