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
    IObjectWithKey,
} from '@fluentui/react';
import { CollectionWebviewData } from '../../src-shared/CollectionWebviewData';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { StrTotal, StrContents, StrLoadMore, StrLoading } from '../Strings';
import { CollectionViewItem, CollectionViewItemValue } from './CollectionViewItem';
import { CollectionElement } from '../../src-shared/CollectionElement';
import { CollectionType } from './CollectionType';
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
    iconName: 'ChevronDownMed',
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
    type?: CollectionType;
    key?: string;
    viewItems: CollectionViewItem[];
    viewItemGroups: IGroup[];
    viewItemValues: CollectionViewItemValue[];
    size: number;
    hasMore: boolean;
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
            } else if (message.command === WebviewCommand.CollectionSize) {
                const size = message.value as number;
                this.setState({ size });
            } else if (message.command === WebviewCommand.CollectionData) {
                const { data, hasMore, clearCache } = message.value as CollectionWebviewData;
                const { viewItemValues } = this.state;

                const newViewItems = data.map((element) => ({
                    element,
                    selected: false,
                    loading: false,
                }));

                const newViewItemGroups: IGroup[] = [];
                const newViewItemValues: CollectionViewItemValue[] = [];
                let startIndex = clearCache ? 0 : viewItemValues.length;
                newViewItems.forEach((item) => {
                    const count = item.element.value !== undefined ? item.element.value.length : 0;
                    const extra = item.element.hasMore ? 1 : 0;
                    newViewItemGroups.push({
                        key: item.element.key,
                        name: item.element.key + (item.element.type ? ` (${item.element.type})` : ''),
                        count: count + extra,
                        startIndex,
                        isCollapsed: true,
                    });

                    if (count > 0) {
                        item.element.value?.map((value) =>
                            newViewItemValues.push({
                                key: value.key,
                                value1: value.id !== undefined ? value.id : value.value,
                                value2: value.id !== undefined ? value.value : undefined,
                                loadAction: false,
                            })
                        );
                    }

                    if (extra > 0) {
                        newViewItemValues.push({
                            key: item.element.key,
                            value1: StrLoadMore,
                            loadAction: true,
                        });
                    }
                    startIndex += count + extra;
                });

                this.setState((prevState) => ({
                    // Clear previous viewItems if clearCache is true
                    viewItems: clearCache ? newViewItems : [...prevState.viewItems, ...newViewItems],
                    viewItemGroups: clearCache
                        ? newViewItemGroups
                        : [...prevState.viewItemGroups, ...newViewItemGroups],
                    viewItemValues: clearCache
                        ? newViewItemValues
                        : [...prevState.viewItemValues, ...newViewItemValues],
                    hasMore,
                    isLoading: false,
                }));
            } else if (message.command === WebviewCommand.CollectionElementData) {
                const data = message.value as CollectionElement;
                const { viewItems, viewItemGroups, viewItemValues } = this.state;
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
                        data.value?.map((value) =>
                            newViewItemValues.push({
                                key: value.key,
                                value1: value.id !== undefined ? value.id : value.value,
                                value2: value.id !== undefined ? value.value : undefined,
                                loadAction: false,
                            })
                        );
                    }

                    if (extra > 0) {
                        newViewItemValues.push({
                            key: data.key,
                            value1: StrLoadMore,
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

    onRenderCell = (nestingDepth?: number, item?: CollectionViewItemValue, index?: number): JSX.Element => (
        <DetailsRow
            columns={columns}
            groupNestingDepth={nestingDepth}
            item={item}
            itemIndex={index !== undefined ? index : 0}
            selection={this.selection}
            selectionMode={SelectionMode.none}
            compact={true}
        />
    );

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
                viewItemValues[itemIndex] = {
                    ...viewItemValues[itemIndex],
                    value1: StrLoading,
                };
                this.setState({ viewItemValues });
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
            currentKey,
            currentValue,
        } = this.state;
        const total = StrTotal.replace('$$$', String(size));

        this.selection.setItems(viewItemValues);

        return (
            <div className="dataviewer-container">
                <h2>
                    {title} {size !== 0 && ` (${total})`}
                </h2>

                <div className="list-container">
                    <div className="list-view">
                        <SelectionZone
                            selection={this.selection}
                            selectionMode={SelectionMode.none}
                            onItemInvoked={this.onItemInvoked}
                        >
                            <GroupedList
                                groups={viewItemGroups}
                                groupProps={{ onRenderHeader: this.onRenderHeader }}
                                items={viewItemValues}
                                onRenderCell={this.onRenderCell}
                                selection={this.selection}
                                selectionMode={SelectionMode.none}
                                compact={true}
                            />
                        </SelectionZone>
                    </div>
                    {!isLoading && hasMore && <ActionButton text={StrLoadMore} onClick={this.loadKeys} />}
                    {isLoading && <Label>{StrLoading}</Label>}
                    <Modal
                        containerClassName="content-modal-container"
                        isOpen={isModalOpen}
                        onDismiss={this.hideModal}
                        isBlocking={false}
                    >
                        <div className="content-modal-header">
                            <span>{StrContents.replace('$$$', currentKey)}</span>
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
