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
    public readonly label;
    public readonly iconPath;
    public readonly contextValue;

    constructor(readonly parent: AzureCacheItem) {
        super(parent);

        this.label = this._label();
        this.iconPath = this._iconPath();
        this.contextValue = this._contextValue();
    }

    private _label(): string {
        const selectedDbs = this.parent.getSelectedDataFilters().map((item) => item.id);
        return `*${StrShard} ${selectedDbs.join(', ')}`;
    }

    private _iconPath(): TreeItemIconPath {
        return new ThemeIcon('versions');
    }

    private _contextValue(): string {
        return RedisClusterNodeFilterItem.contextValue;
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
