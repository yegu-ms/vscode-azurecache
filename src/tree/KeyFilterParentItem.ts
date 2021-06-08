// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Common interface for a tree item that contains a child key filter item.
 */
export interface KeyFilterParentItem {
    addKeyFilter(filterExpr: string): number;
    getKeyFilter(index: number): string;
    updateKeyFilter(index: number, filterExpr: string): void;
    deleteKeyFilter(index: number): void;
}
