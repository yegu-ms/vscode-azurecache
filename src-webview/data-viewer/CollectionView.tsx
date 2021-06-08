// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { vscode } from '../vscode';
import {
    GroupedList,
    IGroup,
    IGroupDividerProps,
    IGroupHeaderProps,
    IColumn,
    IRenderFunction,
    IStyle,
    DetailsRow,
    Selection,
    SelectionMode,
    PrimaryButton,
    getFocusStyle,
    getTheme,
    ITheme,
    mergeStyleSets
} from '@fluentui/react';
import * as React from 'react';
import { CollectionWebviewData } from '../../src-shared/CollectionWebviewData';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { StrLoadMore } from '../Strings';
import { SelectableCollectionElement } from './SelectableCollectionElement';
import { CollectionElementValue } from '../../src-shared/CollectionElement';
import { CollectionType } from './CollectionType';
import { HashFilterField } from './HashFilterField';
import { KeyContentsField } from './KeyContentsField';
import './CollectionView.css';

const theme: ITheme = getTheme();
const { semanticColors, fonts } = theme;

const classNames = mergeStyleSets({
    itemSelected: {
        background: 'var(--vscode-list-activeSelectionBackground)',
        color: 'var(--vscode-list-activeSelectionForeground)',
        selectors: {
            '&:hover': { background: 'var(--vscode-list-activeSelectionBackground) !important' },
        },
    },
    itemCell: [
        getFocusStyle(theme, { inset: -1 }),
        {
            backgroundColor: 'var(--vscode-list-background)',
            color: 'var(--vscode-list-foreground)',
            minHeight: 30,
            padding: 5,
            boxSizing: 'border-box',
            display: 'flex',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: fonts.medium.fontSize,
            selectors: {
                '&:hover': {
                    background: 'var(--vscode-list-inactiveSelectionBackground)',
                    color: 'var(--vscode-list-foreground)'
                },
                '&:selection': { background: 'var(--vscode-list-activeSelectionForeground)' },
            },
            cursor: 'pointer',
        },
    ],
    itemContent: {
        marginLeft: 5,
        overflow: 'hidden',
        flexGrow: 1,
    },
    itemName: [
        fonts.medium,
        {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: fonts.medium.fontSize,
        },
    ],
    itemIndex: {
        fontSize: fonts.small.fontSize,
        color: 'var(--vscode-editorHint-foreground)',
    },
    itemIndexSelected: {
        color: 'var(--vscode-list-activeSelectionForeground)',
    },
});

interface State {
    title: string;
    currentValue?: string;
    type?: CollectionType;
    key?: string;
    data: SelectableCollectionElement[];
    groups: IGroup[];
    items: CollectionElementValue[];
    size: number;
    hasMore: boolean;
    isLoading: boolean;
}

const columns: IColumn[] = [
    {
        key: 'id',
        name: 'Id',
        fieldName: 'id',
        minWidth: 0
    },
    {
        key: 'value',
        name: 'Value',
        fieldName: 'value',
        minWidth: 300
    }
];

export class CollectionView extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            title: '',
            data: [],
            size: 0,
            groups: [],
            items: [],
            hasMore: false,
            isLoading: false,
        };
    }

    componentDidMount(): void {
        // Listen for messages from extension
        window.addEventListener('message', (event) => {
            const message: WebviewMessage = event.data;
            if (message.command === WebviewCommand.CollectionData) {
                const { data, hasMore, clearCache } = message.value as CollectionWebviewData;
                const selectableData = data.map((element) => ({
                    element,
                    selected: false,
                    loading: false
                } as SelectableCollectionElement));

                const groups: IGroup[] = [];
                const items: CollectionElementValue[] = [];
                let startIndex = 0;
                selectableData.forEach((dataItem) => {
                    const count = typeof dataItem.element.value != 'undefined' ? dataItem.element.value.length : 0;
                    groups.push({
                        key: dataItem.element.key,
                        name: dataItem.element.key + (typeof dataItem.element.type !== 'undefined' ? ` (${dataItem.element.type})` : ''),
                        count,
                        startIndex,
                        isCollapsed: true
                    });
                    if (count > 0) {
                        dataItem.element.value?.map((value) => items.push(value));
                    }
                    startIndex += count;
                });

                this.setState((prevState) => ({
                    // Clear previous data if clearCache is true
                    data: clearCache ? selectableData : [...prevState.data, ...selectableData],
                    groups,
                    items,
                    hasMore,
                    isLoading: false
                }));
            } else if (message.command === WebviewCommand.Title) {
                const title = message.value as CollectionType;
                this.setState({ title });
            } else if (message.command === WebviewCommand.KeyName) {
                const key = message.value as string;
                this.setState({ key });
            } else if (message.command === WebviewCommand.CollectionSize) {
                const size = message.value as number;
                this.setState({ size });
            }
        });
    }

        /*
    onRenderCell = (item: SelectableCollectionElement | undefined, index: number | undefined): JSX.Element | null => {
        if (!item || typeof index === 'undefined') {
            return null;
        }

        const itemCellClass = classNames.itemCell + (item.selected ? ' ' + classNames.itemSelected : '');
        const itemIndexClass = classNames.itemIndex + (item.selected ? ' ' + classNames.itemIndexSelected : '');
        const onClick = (): void => this.props.onItemClick?.(item, index);

        let header = null;

        if (this.props?.type === 'zset' || this.props?.type === 'hash') {
            header = (
                <div>
                    <div className={itemIndexClass}>{item.id}</div>
                </div>
            );
        } else if (this.props?.type === 'set' || this.props?.type === 'list') {
            header = <div className={itemIndexClass}>{index}</div>;
        }

        return (
            <div className={itemCellClass} data-is-focusable={true} data-is-scrollable={true} onClick={onClick}>
                <div className={classNames.itemContent}>
                    {header}
                    <div className={classNames.itemName}>{item.value}</div>
                </div>
            </div>
        );
    };
    */

    handleListScroll = (event: React.UIEvent<HTMLDivElement>): void => {
        const { isLoading } = this.state;
        const target = event.target as HTMLDivElement;

        if (!isLoading && target.scrollHeight - target.scrollTop - target.clientHeight < 1) {
            this.loadMore();
        }
    };

    /**
     * Handles selection when collection item is clicked.
     * @param element The element that was clicked
     * @param index The index in the collection
     */
    onItemClick = (element: SelectableCollectionElement, index: number): void => {
        // Need to update entire data because FluentUI's Basic List only re-renders based on changes in underlying 'data'
        const newData = this.state.data.map((val, idx) => {
            // De-select previously selected item
            if (val.selected) {
                val.selected = false;
                return val;
            }
            // Select new item (if the clicked item was already selected, then it would have been de-selected above)
            if (index === idx) {
                val.selected = true;
                return val;
            }
            // Otherwise return same item
            return val;
        });

        this.setState({
            currentValue: element.selected ? element.element.key : undefined,
            data: newData,
        });
    };

    /**
     * Tells extension to send over more data.
     */
    loadMore = (): void => {
        this.setState({
            isLoading: true,
        });
        vscode.postMessage({
            command: WebviewCommand.LoadMore,
        });
    };

    /**
     * Handles filter textfield changes.
     * This is called from HashFilterField with a debounce so it is not triggered after every keystroke.
     *
     * @param event The event
     * @param newValue The new filter value
     */
    onFilterChanged = (
        event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
        newValue?: string | undefined
    ): void => {
        if (this.state.type !== 'hash') {
            return;
        }

        this.setState({
            isLoading: true,
        });

        // Treat empty string as 'match all'
        if (!newValue) {
            newValue = '*';
        }
        vscode.postMessage({
            command: WebviewCommand.FilterChange,
            value: newValue,
        });
    };

    render(): JSX.Element | null {
        const { currentValue, groups, items, hasMore, isLoading, title, size } = this.state;

        const onRenderHeader = (
            headerProps?: IGroupDividerProps,
            defaultRender?: IRenderFunction<IGroupHeaderProps>
        ) => {
            if (!defaultRender) {
                return null;
            }
        
            // Make entire header togglable
            const onToggleSelectGroup = (): void => {
                if (headerProps?.onToggleCollapse && headerProps?.group) {
                    headerProps.onToggleCollapse(headerProps.group);
                }
            };
        
            // Hide header count
            const headerCountStyle: IStyle = { display: 'none' };
        
            return (
                <span>
                    {defaultRender({
                        ...headerProps,
                        styles: { headerCount: headerCountStyle },
                        onToggleSelectGroup: onToggleSelectGroup,
                    })}
                </span>
            );
        };
        
        const selection = new Selection();

        const onRenderCell = (nestingDepth?: number, item?: CollectionElementValue, itemIndex?: number): JSX.Element | null => {
            return item && typeof itemIndex === 'number' && itemIndex > -1 ? (
                <DetailsRow
                    className={classNames.itemCell}
                    columns={columns}
                    groupNestingDepth={nestingDepth}
                    item={item}
                    itemIndex={itemIndex}
                    selection={selection}
                    selectionMode={SelectionMode.none}
                    compact={true}
                />
            ) : null;
        };
    
        return (
            <div className="dataviewer-container">
                <h2>
                    {title}
                </h2>
                <h4 style={{ marginTop: 0, marginBottom: 5 }}>Size: {size}</h4>
                {this.state.type === 'hash' && (
                    <HashFilterField onChange={this.onFilterChanged} isLoading={isLoading} />
                )}

                <div className="list-container">
                    <div
                        className="list-view"
                        onScroll={this.handleListScroll}
                    >
                        <GroupedList
                            groups={groups}
                            groupProps={{onRenderHeader}}
                            items={items}
                            onRenderCell={onRenderCell}
                            selectionMode={SelectionMode.none}
                            compact={true}
                        />
                    </div>
                    <PrimaryButton
                        disabled={!hasMore}
                        text={StrLoadMore}
                        style={{ marginLeft: 'auto', marginRight: 0, marginTop: 5, textAlign: 'right' }}
                        onClick={this.loadMore}
                    />
                </div>
                <KeyContentsField value={currentValue} />
            </div>
        );
    }
}
