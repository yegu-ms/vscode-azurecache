// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export interface CollectionElementValue {
    key: string;
    id?: string;
    value?: string;
}

export interface CollectionElement {
    id?: string;
    key: string;
    type?: string;
    value?: CollectionElementValue[];
}
