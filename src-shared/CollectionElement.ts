// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RedisKeyType } from './RedisKeyType';

export interface CollectionElementValue {
    key: string;
    id?: string;
    value: string;
}

export interface CollectionElement {
    id?: string;
    key: string;
    type: RedisKeyType;
    value: CollectionElementValue[];
    db?: number;
    shard?: number;
    size?: number;
    cursor?: string;
    hasMore: boolean;
}
