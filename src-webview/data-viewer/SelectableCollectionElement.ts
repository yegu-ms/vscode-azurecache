// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CollectionElement } from "../../src-shared/CollectionElement";

export interface SelectableCollectionElement {
    element: CollectionElement;
    selected: boolean;
    loading: boolean;
}
