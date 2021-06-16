// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { StrDbInfo } from '../Strings';

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

export function formatDbInfo(info?: string): string {
    if (info === undefined) {
        return '';
    }

    let newInfo = info;
    StrDbInfo.forEach((el) => {
        newInfo = newInfo.replace(el.key, el.name);
    });

    return newInfo.replace(/,/g, ' | ');
}
