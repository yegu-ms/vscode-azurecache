// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ThemeIcon } from 'vscode';
import { AzExtTreeItem, TreeItemIconPath, AzExtParentTreeItem } from 'vscode-azureextensionui';
import { StrDatabaseAbbrv } from '../../Strings';
import { DataFilterParentItem } from '../DataFilterParentItem';

/**
 * Tree item for a database in a non-clustered cache.
 */
export class RedisDbFilterItem extends AzExtTreeItem {
    private static readonly contextValue = 'redisDbFilter';
    private static readonly commandId = 'azureCache.setDbFilter';

    constructor(readonly parent: AzExtParentTreeItem & DataFilterParentItem) {
        super(parent);
    }

    get contextValue(): string {
        return RedisDbFilterItem.contextValue;
    }

    get iconPath(): TreeItemIconPath {
        return new ThemeIcon('filter');
    }

    get label(): string {
        return `${StrDatabaseAbbrv} ${this.parent.getDataFilterList().join(', ')}`;
    }
}
