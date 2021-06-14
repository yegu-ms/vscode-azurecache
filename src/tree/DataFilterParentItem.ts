// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export interface SelectableItem {
    id: string;
    label?: string;
    selected: boolean;
}

/**
 * Common interface for a tree item that contains a child data filter item.
 */
export interface DataFilterParentItem {
    setDataFilters(items: SelectableItem[]): void;
    getDataFilters(): SelectableItem[];
    getSelectedDataFilters(): SelectableItem[];
}
