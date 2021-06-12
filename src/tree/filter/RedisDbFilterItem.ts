// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { QuickPickItem, ThemeIcon } from 'vscode';
import { AzExtTreeItem, TreeItemIconPath } from 'vscode-azureextensionui';
import { AzureCacheItem } from '../azure/AzureCacheItem';
import { SelectableItem } from '../DataFilterParentItem';
import { StrDatabaseAbbrv } from '../../Strings';

/**
 * Tree item for a database in a non-clustered cache.
 */
export class RedisDbFilterItem extends AzExtTreeItem {
    private static readonly contextValue = 'redisDbFilter';

    constructor(readonly parent: AzureCacheItem) {
        super(parent);
    }

    get contextValue(): string {
        return RedisDbFilterItem.contextValue;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('database');
    }

    get label(): string {
        const selectedDbs = this.parent.getSelectedDataFilters().map(item => item.id);
        return `*${StrDatabaseAbbrv} ${selectedDbs.join(', ')}`;
    }

    public getDbSelections(): QuickPickItem[] {
        return this.parent.getDataFilters().map(item => ({
            label: `${StrDatabaseAbbrv} ${item.id}`,
            picked: item.selected
        } as QuickPickItem));
    }

    public setDbSelections(picks: QuickPickItem[]): void {
        if (picks.length > 0) {
            this.parent.setDataFilters(picks.map(pick => ({
                id: Number(pick.label.replace(`${StrDatabaseAbbrv} `, '')),
                selected: pick.picked
            } as SelectableItem)));
        }
    }
}
