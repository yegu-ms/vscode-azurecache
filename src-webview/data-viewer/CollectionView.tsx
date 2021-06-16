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
    Selection,
    SelectionZone,
    SelectionMode,
    ActionButton,
    Label,
    Modal,
    IconButton,
    IButtonStyles,
    IIconProps,
    IObjectWithKey,
} from '@fluentui/react';
import { CollectionWebviewData } from '../../src-shared/CollectionWebviewData';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import {
    StrTotal,
    StrDb,
    StrShard,
    StrKeyTypes,
    StrContents,
    StrLoadMoreKeys,
    StrLoadMoreValues,
    StrLoading,
} from '../Strings';
import { CollectionViewItem, CollectionViewItemValue } from './CollectionViewItem';
import { CollectionElement } from '../../src-shared/CollectionElement';
import { KeyContentsField } from './KeyContentsField';
import './CollectionView.css';
import '../styles.css';

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
    iconName: 'ChromeClose',
    styles: { root: { color: 'var(--vscode-peekViewTitleLabel-foreground)' } },
};

const columns: IColumn[] = [
    {
        key: 'value1',
        name: 'Value 1',
        fieldName: 'value1',
        minWidth: 0,
    },
    {
        key: 'value2',
        name: 'Value 2',
        fieldName: 'value2',
        minWidth: 300,
    },
];

interface State {
    title: string;
    key?: string;
    viewItems: CollectionViewItem[];
    viewItemGroups: IGroup[];
    viewItemValues: CollectionViewItemValue[];
    size: number;
    hasMore: boolean;
    selection: Selection;
    currentKey: string;
    currentValue?: string;
    isLoading: boolean;
    isModalOpen: boolean;
}

export class CollectionView extends React.Component<{}, State> {
    selection = new Selection();

    constructor(props: {}) {
        super(props);
        this.state = {
            title: '',
            viewItems: [],
            size: 0,
            viewItemGroups: [],
            viewItemValues: [],
            hasMore: false,
            selection: new Selection(),
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
                const title = message.value as string;
                this.setState({ title });
            } else if (message.command === WebviewCommand.CollectionSize) {
                const size = message.value as number;
                this.setState({ size });
            } else if (message.command === WebviewCommand.CollectionData) {
                const { data, hasMore, clearCache } = message.value as CollectionWebviewData;
                const { viewItems, viewItemGroups, viewItemValues, selection } = this.state;
                // Clear previous view items if clearCache is true
                const newViewItems: CollectionViewItem[] = !clearCache ? [...viewItems] : [];
                const newViewItemGroups: IGroup[] = !clearCache ? [...viewItemGroups] : [];
                const newViewItemValues: CollectionViewItemValue[] = !clearCache ? [...viewItemValues] : [];

                data.map((element) =>
                    newViewItems.push({
                        element,
                        selected: false,
                        loading: false,
                    })
                );

                let startIndex = newViewItemValues.length;
                for (const item of newViewItems) {
                    const count = item.element.value !== undefined ? item.element.value.length : 0;
                    const extra = item.element.hasMore ? 1 : 0;
                    newViewItemGroups.push({
                        key: item.element.key,
                        name: `${item.element.key} (${StrKeyTypes[item.element.type]}`
                            + (item.element.db !== undefined ? ` | ${StrDb}: ${item.element.db}` : '')
                            + (item.element.shard !== undefined ? ` | ${StrShard}: ${item.element.shard}` : '')
                            + ')',
                        count: count + extra,
                        startIndex,
                        isCollapsed: true,
                    });

                    if (count > 0) {
                        item.element.value?.map((value, index) =>
                            newViewItemValues.push({
                                key: `${value.key}-${index}`,
                                value1: value.id !== undefined ? value.id : value.value,
                                value2: value.id !== undefined ? value.value : undefined,
                                loadAction: false,
                            })
                        );
                    }

                    if (extra > 0) {
                        newViewItemValues.push({
                            key: item.element.key,
                            value1: StrLoadMoreValues,
                            loadAction: true,
                        });
                    }
                    startIndex += count + extra;
                }

                selection.setItems(newViewItemValues);
                this.setState({
                    viewItems: newViewItems,
                    viewItemGroups: newViewItemGroups,
                    viewItemValues: newViewItemValues,
                    hasMore,
                    isLoading: false,
                });
            } else if (message.command === WebviewCommand.CollectionElementData) {
                const data = message.value as CollectionElement;
                const { viewItems, viewItemGroups, viewItemValues, selection } = this.state;
                const index = viewItems.findIndex((el) => el.element.key === data.key);
                if (index >= 0) {
                    viewItems[index] = { ...viewItems[index], element: data };

                    const newViewItemGroups: IGroup[] = [];
                    const newViewItemValues: CollectionViewItemValue[] = [];
                    let startIndex = 0;
                    for (let i = 0; i < index; i++) {
                        newViewItemGroups.push(viewItemGroups[i]);

                        for (let j = startIndex; j < startIndex + viewItemGroups[i].count; j++) {
                            newViewItemValues.push(viewItemValues[j]);
                        }

                        startIndex += viewItemGroups[i].count;
                    }

                    const count = data.value !== undefined ? data.value.length : 0;
                    const extra = data.hasMore ? 1 : 0;
                    const offset = count + extra - viewItemGroups[index].count;
                    newViewItemGroups.push({
                        ...viewItemGroups[index],
                        count: count + extra,
                    });

                    if (count > 0) {
                        data.value?.map((value, index) =>
                            newViewItemValues.push({
                                key: `${value.key}-${index}`,
                                value1: value.id !== undefined ? value.id : value.value,
                                value2: value.id !== undefined ? value.value : undefined,
                                loadAction: false,
                            })
                        );
                    }

                    if (extra > 0) {
                        newViewItemValues.push({
                            key: data.key,
                            value1: StrLoadMoreValues,
                            loadAction: true,
                        });
                    }

                    startIndex += viewItemGroups[index].count;

                    for (let i = index + 1; i < viewItems.length; i++) {
                        newViewItemGroups.push({
                            ...viewItemGroups[i],
                            startIndex: viewItemGroups[i].startIndex + offset,
                        });

                        for (let j = startIndex; j < startIndex + viewItemGroups[i].count; j++) {
                            newViewItemValues.push(viewItemValues[j]);
                        }

                        startIndex += viewItemGroups[i].count;
                    }

                    selection.setItems(newViewItemValues);
                    this.setState({ viewItems, viewItemGroups: newViewItemGroups, viewItemValues: newViewItemValues });
                }
            } else if (message.command === WebviewCommand.Loading) {
                const status = message.value as boolean;
                this.setState({ isLoading: status });
            }
        });
    }

    onRenderHeader = (
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

    onRenderCell = (nestingDepth?: number, item?: CollectionViewItemValue, index?: number): JSX.Element => {
        const { selection } = this.state;

        return (
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
    };

    onItemInvoked = (obj?: IObjectWithKey, itemIndex?: number, _event?: Event): void => {
        if (obj === undefined) {
            return;
        }

        const { viewItems } = this.state;
        const item = obj! as CollectionViewItemValue;
        if (!item.loadAction) {
            this.setState({
                currentKey: item.value2 === undefined ? item.key : `${item.key} (${item.value1})`,
                currentValue: item.value2 === undefined ? item.value1 : item.value2,
                isModalOpen: true,
            });
        } else {
            const index = viewItems.findIndex((el) => el.element.key === item.key);
            if (index >= 0 && itemIndex !== undefined) {
                const { viewItemValues } = this.state;
                const newViewItemValues = [...viewItemValues];
                newViewItemValues[itemIndex] = {
                    ...viewItemValues[itemIndex],
                    value1: StrLoading,
                };
                this.setState({ viewItemValues: newViewItemValues });
                vscode.postMessage({
                    command: WebviewCommand.LoadKeyValue,
                    value: viewItems[index].element,
                });
            }
        }
    };

    /**
     * Tells extension to send over more viewItems.
     */
    loadKeys = (): void => {
        this.setState({ isLoading: true });
        vscode.postMessage({
            command: WebviewCommand.LoadKeys,
        });
    };

    hideModal = (): void => {
        this.setState({ isModalOpen: false });
    };

    render(): JSX.Element | null {
        const {
            viewItemGroups,
            viewItemValues,
            hasMore,
            isLoading,
            title,
            size,
            isModalOpen,
            selection,
            currentKey,
            currentValue,
        } = this.state;

        return (
            <div className="dataviewer-container">
                <h2>
                    {title} {size !== 0 && ` (${StrTotal.replace('$$$', size.toString())})`}
                </h2>

                <div className="list-container">
                    <div className="list-view">
                        <SelectionZone
                            selection={selection}
                            selectionMode={SelectionMode.none}
                            onItemInvoked={this.onItemInvoked}
                        >
                            <GroupedList
                                groups={viewItemGroups}
                                groupProps={{ onRenderHeader: this.onRenderHeader }}
                                items={viewItemValues}
                                onRenderCell={this.onRenderCell}
                                selection={selection}
                                selectionMode={SelectionMode.none}
                                compact={true}
                            />
                        </SelectionZone>
                    </div>
                    {!isLoading && hasMore && <ActionButton text={StrLoadMoreKeys} onClick={this.loadKeys} />}
                    {isLoading && <Label>{StrLoading}</Label>}
                    <Modal
                        containerClassName="content-modal-container"
                        isOpen={isModalOpen}
                        onDismiss={this.hideModal}
                        isBlocking={false}
                    >
                        <div className="content-modal-header">
                            <span>{StrContents.replace('$$$', currentKey.split('-')[0])}</span>
                            <IconButton styles={iconButtonStyles} iconProps={cancelIcon} onClick={this.hideModal} />
                        </div>
                        <div className="content-modal-body">
                            <KeyContentsField value={currentValue} />
                        </div>
                    </Modal>
                </div>
            </div>
        );
    }
}
