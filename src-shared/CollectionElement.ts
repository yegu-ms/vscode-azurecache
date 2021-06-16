// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { KeyType } from './KeyType';

export interface CollectionElementValue {
    key: string;
    id?: string;
    value: string;
}

export interface CollectionElement {
    id?: string;
    key: string;
    type: KeyType;
    value: CollectionElementValue[];
    db?: number;
    shard?: number;
    size?: number;
    cursor?: string;
    hasMore: boolean;
}
