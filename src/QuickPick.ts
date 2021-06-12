// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';

/**
 * Helper function to get user selections.
 *
 * @param items Selection options
 * @param canPickMany Multi-select enabled
 * @param placeHolder Placeholder text
 */
export async function quickPick(
    items: vscode.QuickPickItem[],
    placeHolder: string
): Promise<vscode.QuickPickItem[] | undefined> {
    const picks = await vscode.window.showQuickPick(
        items,
        {
            canPickMany: true,
            ignoreFocusOut: true,
            placeHolder
        }
    );

    return picks;
}
