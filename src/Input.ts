// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { ErrorEmptyInput } from './Strings';

/**
 * Helper function to get user text input.
 *
 * @param defaultValue Default value
 * @param prompt Input prompt text
 * @param placeholder Placeholder text
 */
export async function textInput(
    defaultValue: string | undefined,
    prompt: string,
    placeHolder: string
): Promise<string | undefined> {
    const val = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt,
        placeHolder,
        validateInput: (val: string) => {
            if (val !== undefined) {
                return null;
            }
            return ErrorEmptyInput;
        },
    });

    if (val === undefined) {
        return val;
    }

    return val ? val : defaultValue;
}
