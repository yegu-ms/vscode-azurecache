// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { vscode } from '../vscode';
import * as React from 'react';
import {
    GroupedList,
    IGroup,
    IGroupDividerProps,
    IGroupHeaderProps,
    IColumn,
    IRenderFunction,
    IStyle,
    DetailsRow,
    SelectionZone,
    Selection,
    SelectionMode,
    ActionButton,
    Label,
    Modal,
    IconButton,
    IButtonStyles,
    IIconProps,
    getTheme,
    ITheme,
    mergeStyleSets,
    IObjectWithKey,
    FontWeights,
} from '@fluentui/react';
import { CollectionWebviewData } from '../../src-shared/CollectionWebviewData';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { StrTotal, StrContents, StrLoadMore, StrLoadingKeys } from '../Strings';
import { SelectableCollectionElement } from './SelectableCollectionElement';
import { CollectionElementValue } from '../../src-shared/CollectionElement';
import { CollectionType } from './CollectionType';
import { KeyContentsField } from './KeyContentsField';
import './CollectionView.css';

const theme: ITheme = getTheme();

const modalStyles = mergeStyleSets({
    container: {
        color: 'var(--vscode-peekViewTitleLabel-foreground)',
        backgroundColor: 'var(--vscode-peekViewTitle-background)',
        border: '2px',
        borderColor: 'var(--vscode-peekView-border)',
        width: '80%',
        display: 'flex',
        flexFlow: 'column nowrap',
        alignItems: 'stretch',
    },
    header: [
        theme.fonts.large,
        {
            flex: '1 1 auto',
            borderTop: '3px solid var(--vscode-activitybar-activeBorder)',
            display: 'flex',
            alignItems: 'center',
            fontWeight: FontWeights.semibold,
            padding: '12px 12px 14px 12px',
        },
    ],
    body: {
        flex: '4 4 auto',
        padding: '0 12px 6px 12px',
        overflowY: 'hidden',
    },
});

const iconButtonStyles: Partial<IButtonStyles> = {
    root: {
        marginLeft: 'auto',
        marginTop: '4px',
        marginRight: '2px',
    },
    rootHovered: {
        color: 'var(--vscode-peekViewTitleLabel-foreground)',
        backgroundColor: 'var(--vscode-peekViewResult-background)',
    },
};

const cancelIcon: IIconProps = {
    iconName: 'Cancel',
    styles: { root: { color: 'var(--vscode-peekViewTitleLabel-foreground)' } },
};

const columns: IColumn[] = [
    {
        key: 'id',
        name: 'Id',
        fieldName: 'id',
        minWidth: 0,
    },
    {
        key: 'value',
        name: 'Value',
        fieldName: 'value',
        minWidth: 300,
    },
];

interface State {
    title: string;
    type?: CollectionType;
    key?: string;
    data: SelectableCollectionElement[];
    groups: IGroup[];
    items: CollectionElementValue[];
    size: number;
    hasMore: boolean;
    currentKey: string;
    currentValue?: string;
    isLoading: boolean;
    isModalOpen: boolean;
}

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
            currentKey: '',
            currentValue: '',
            isLoading: false,
            isModalOpen: false,
        };
    }

    componentDidMount(): void {
        // Listen for messages from extension
        window.addEventListener('message', (event) => {
            const message: WebviewMessage = event.data;
            if (message.command === WebviewCommand.Title) {
                const title = message.value as CollectionType;
                this.setState({ title });
            } else if (message.command === WebviewCommand.Loading) {
                const status = message.value as boolean;
                this.setState({ isLoading: status });
            } else if (message.command === WebviewCommand.CollectionSize) {
                const size = message.value as number;
                this.setState({ size });
            } else if (message.command === WebviewCommand.CollectionData) {
                const { data, hasMore, clearCache } = message.value as CollectionWebviewData;
                const selectableData = data.map(
                    (element) =>
                        ({
                            element,
                            selected: false,
                            loading: false,
                        } as SelectableCollectionElement)
                );

                const groups: IGroup[] = [];
                const items: CollectionElementValue[] = [];
                let startIndex = 0;
                selectableData.forEach((dataItem) => {
                    const count = dataItem.element.value !== undefined ? dataItem.element.value.length : 0;
                    groups.push({
                        key: dataItem.element.key,
                        name: dataItem.element.key + (dataItem.element.type ? ` (${dataItem.element.type})` : ''),
                        count,
                        startIndex,
                        isCollapsed: true,
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
                    isLoading: false,
                }));
            } else if (message.command === WebviewCommand.KeyName) {
                const key = message.value as string;
                this.setState({ key });
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
        if (newValue === undefined) {
            newValue = '*';
        }
        vscode.postMessage({
            command: WebviewCommand.FilterChange,
            value: newValue,
        });
    };

    render(): JSX.Element | null {
        const { groups, items, hasMore, isLoading, title, size, isModalOpen, currentKey, currentValue } = this.state;
        const total = StrTotal.replace('$$$', String(size));

        const onRenderHeader = (
            headerProps?: IGroupDividerProps,
            defaultRender?: IRenderFunction<IGroupHeaderProps>
        ): JSX.Element | null => {
            if (defaultRender === undefined) {
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
        selection.setItems(items);

        const onRenderCell = (nestingDepth?: number, item?: CollectionElementValue, index?: number): JSX.Element => (
            <DetailsRow
                columns={columns}
                groupNestingDepth={nestingDepth}
                item={item}
                itemIndex={index !== undefined ? index : 0}
                selection={selection}
                selectionMode={SelectionMode.none}
                compact={true}
            />
        );

        const onItemInvoked = (obj?: IObjectWithKey, _index?: number, _event?: Event): void => {
            if (obj === undefined) {
                return;
            }

            const item = obj! as CollectionElementValue;
            this.setState({
                currentKey: item.key,
                currentValue: item.value!,
                isModalOpen: true,
            });
        };

        const hideModal = (): void => {
            this.setState({ isModalOpen: false });
        };

        return (
            <div className="dataviewer-container">
                <h2>
                    {title} {size !== 0 && ` (${total})`}
                </h2>

                <div className="list-container">
                    <div className="list-view" onScroll={this.handleListScroll}>
                        <SelectionZone
                            selection={selection}
                            selectionMode={SelectionMode.none}
                            onItemInvoked={onItemInvoked}
                        >
                            <GroupedList
                                groups={groups}
                                groupProps={{ onRenderHeader }}
                                items={items}
                                onRenderCell={onRenderCell}
                                selection={selection}
                                selectionMode={SelectionMode.none}
                                compact={true}
                            />
                        </SelectionZone>
                    </div>
                    {!isLoading && hasMore && (
                        <ActionButton text={StrLoadMore} onClick={this.loadMore} disabled={!hasMore} />
                    )}
                    {isLoading && <Label>{StrLoadingKeys}</Label>}
                    <Modal
                        containerClassName={modalStyles.container}
                        isOpen={isModalOpen}
                        onDismiss={hideModal}
                        isBlocking={false}
                    >
                        <div className={modalStyles.header}>
                            <span>{StrContents.replace('$$$', currentKey)}</span>
                            <IconButton styles={iconButtonStyles} iconProps={cancelIcon} onClick={hideModal} />
                        </div>
                        <div className={modalStyles.body}>
                            <KeyContentsField value={currentValue} />
                        </div>
                    </Modal>
                </div>
            </div>
        );
    }
}
