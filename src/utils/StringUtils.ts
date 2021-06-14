// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Returns binary representation of a string.
 *
 * @param input Input string.
 */
export function stringToBinary(input?: string): string {
    if (input === undefined) {
        return '';
    }

    const chars = input.split('');

    return chars.map((char) => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}
