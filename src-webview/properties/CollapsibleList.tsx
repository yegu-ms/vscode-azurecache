// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import {
    GroupedList,
    Label,
    SelectionMode,
    IRenderFunction,
    IGroupDividerProps,
    IGroupHeaderProps,
    IGroupRenderProps,
} from '@fluentui/react/lib/';
import { CopyableTextField } from './CopyableTextField';
import '../styles.css';

interface Props {
    label: string;
    groupName: string;
    values?: string[];
}

const onRenderCell = (nestingDepth?: number, item?: string, itemIndex?: number): JSX.Element => {
    return (
        <div style={{ marginLeft: '48px', marginTop: '8px' }}>
            <CopyableTextField id="hostName" value={item} />
        </div>
    );
};

const onRenderHeader: IRenderFunction<IGroupHeaderProps> = (
    headerProps?: IGroupDividerProps,
    defaultRender?: IRenderFunction<IGroupHeaderProps>
) => {
    if (defaultRender === undefined) {
        return null;
    }

    // Make entire header togglable
    const onToggleSelectGroup = (): void => {
        if (headerProps?.onToggleCollapse !== undefined && headerProps?.group !== undefined) {
            headerProps.onToggleCollapse(headerProps.group);
        }
    };

    return (
        <span>
            {defaultRender({
                ...headerProps,
                onToggleSelectGroup: onToggleSelectGroup,
            })}
        </span>
    );
};

export function CollapsibleList(props: Props): React.ReactElement | null {
    if (props?.values === undefined || props?.values.length === 0) {
        return null;
    }

    const group = [
        {
            count: props?.values?.length,
            key: props.label,
            name: props.groupName,
            startIndex: 0,
            isCollapsed: true,
        },
    ];
    const groupProps: IGroupRenderProps = {
        onRenderHeader,
    };

    return (
        <div>
            <Label>{props.label}</Label>
            <GroupedList
                items={props.values}
                onRenderCell={onRenderCell}
                groups={group}
                groupProps={groupProps}
                selectionMode={SelectionMode.none}
                compact={true}
            />
        </div>
    );
}
