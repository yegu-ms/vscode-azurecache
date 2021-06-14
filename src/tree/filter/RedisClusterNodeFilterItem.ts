// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { QuickPickItem, ThemeIcon } from 'vscode';
import { AzExtTreeItem, TreeItemIconPath } from 'vscode-azureextensionui';
import { AzureCacheItem } from '../azure/AzureCacheItem';
import { SelectableItem } from '../DataFilterParentItem';
import { StrShard } from '../../Strings';

/**
 * Tree item for a database in a non-clustered cache.
 */
export class RedisClusterNodeFilterItem extends AzExtTreeItem {
    private static readonly contextValue = 'redisClusterNodeFilter';

    constructor(readonly parent: AzureCacheItem) {
        super(parent);
    }

    get contextValue(): string {
        return RedisClusterNodeFilterItem.contextValue;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('versions');
    }

    get label(): string {
        const selectedDbs = this.parent.getSelectedDataFilters().map((item) => item.id);
        return `*${StrShard} ${selectedDbs.join(', ')}`;
    }

    public getClusterNodeSelections(): QuickPickItem[] {
        return this.parent.getDataFilters().map(
            (item) =>
                ({
                    label: `${StrShard} ${item.id}`,
                    picked: item.selected,
                } as QuickPickItem)
        );
    }

    public setClusterNodeSelections(picks: QuickPickItem[]): void {
        if (picks.length > 0) {
            this.parent.setDataFilters(
                picks.map(
                    (pick) =>
                        ({
                            id: pick.label.replace(`${StrShard} `, ''),
                            selected: pick.picked,
                        } as SelectableItem)
                )
            );
        }
    }
}
