// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { StrDbInfo } from '../Strings';

/**
 * Returns binary representation of a string.
 *
 * @param input Input string.
 */
export function stringToBinary(input: string | undefined): string | undefined {
    if (input === undefined) {
        return undefined;
    }

    const chars = input.split('');
    return chars.map((char) => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

export function stringToJson(input: string | undefined): string | undefined {
    if (input === undefined) {
        return undefined;
    }

    let json = {};
    try {
        json = JSON.parse(input);
        // eslint-disable-next-line no-empty
    } catch (e) {}

    if (json && Object.keys(json).length > 0) {
        return JSON.stringify(json, null, 4);
    }

    return '';
};

const charLimit = 3;

export enum ContentType {
    Text, Binary, Json
}

export function previewText(text: string | undefined, type: ContentType): string | undefined {
    if (text === undefined) {
        return undefined;
    }

    if (type === ContentType.Binary) {
        return text.length <= charLimit * 9 ? text : `${text.substr(0, charLimit * 9)}...`;
    } else if (type === ContentType.Json) {
        if (text.replace(/\n/g, '').length <= charLimit) {
            return text;
        }

        const index = text.indexOf('\n', charLimit);
        if (index >= 0) {
            return `${text.substring(0, index)}...`;
        } else {
            return `${text.substr(0, charLimit)}...`;
        }
    }

    return text.length <= charLimit ? text : `${text.substr(0, charLimit)}...`;
};

export function formatDbInfo(info: string | undefined): string {
    if (info === undefined) {
        return '';
    }

    let newInfo = info;
    StrDbInfo.forEach((el) => {
        newInfo = newInfo.replace(el.key, el.name);
    });

    return newInfo.replace(/,/g, ' | ');
}
