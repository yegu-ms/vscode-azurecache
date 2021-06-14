// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CollectionElement } from "../../src-shared/CollectionElement";

export interface CollectionViewItemValue {
    key: string;
    value1: string;
    value2?: string;
    loadAction: boolean;
    loading?: boolean;
}

export interface CollectionViewItem {
    element: CollectionElement;
    selected: boolean;
    loading: boolean;
}
