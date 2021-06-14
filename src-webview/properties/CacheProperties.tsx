// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import { Pivot, PivotItem, DetailsList, SelectionMode, IColumn } from '@fluentui/react';
import { ParsedRedisResource } from '../../src-shared/ParsedRedisResource';
import { KeyValue } from '../../src-shared/KeyValue';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { WebviewMessage } from '../../src-shared/WebviewMessage';
import { CollapsibleList } from './CollapsibleList';
import { CopyableTextField } from './CopyableTextField';
import * as Strings from '../Strings';
import './CacheProperties.css';
import '../styles.css';

interface NamedValue {
    name: string;
    value: string;
}

interface State {
    redisResource?: ParsedRedisResource;
    accessKey?: string;
    connectionString?: string;
    redisInfo: NamedValue[];
}

const columns: IColumn[] = [
    {
        key: 'name',
        name: 'Name',
        fieldName: 'name',
        minWidth: 160,
        maxWidth: 240,
        isResizable: true,
    },
    {
        key: 'value',
        name: 'Value',
        fieldName: 'value',
        minWidth: 300,
        isResizable: true,
    },
];

export class CacheProperties extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            redisResource: undefined,
            accessKey: undefined,
            connectionString: undefined,
            redisInfo: [],
        };
    }

    componentDidMount(): void {
        window.addEventListener('message', (event) => {
            const message: WebviewMessage = event.data;

            if (message.command === WebviewCommand.ParsedRedisResource) {
                const parsedRedisResource = message.value as ParsedRedisResource;
                this.setState({ redisResource: parsedRedisResource });
            } else if (message.command === WebviewCommand.AccessKey) {
                const accessKey = message.value as string | undefined;
                this.setState({ accessKey });
            } else if (message.command === WebviewCommand.ConnectionString) {
                const connectionString = message.value as string | undefined;
                this.setState({ connectionString });
            } else if (message.command === WebviewCommand.RedisInfo) {
                const kvs = message.value as KeyValue[] | undefined;
                const nvs: NamedValue[] = [];
                if (kvs !== undefined) {
                    Strings.StrRedisInfo.map((info) => {
                        const index = kvs.findIndex((kv) => kv.key === info.key);
                        if (index >= 0) {
                            nvs.push({
                                name: info.name,
                                value: kvs[index].value,
                            } as NamedValue);
                        }
                    });
                    this.setState({ redisInfo: nvs });
                } else {
                    this.setState({ redisInfo: [] });
                }
            }
        });
    }

    render(): JSX.Element | null {
        if (this.state.redisResource === undefined) {
            return null;
        }

        const { redisResource, accessKey, connectionString, redisInfo } = this.state;
        const nonSslPort = redisResource.enableNonSslPort ? redisResource.port : Strings.StrDisabled;

        return (
            <div className="properties-container">
                <h2>
                    {Strings.StrProduct}: {redisResource.name}
                </h2>
                <h3>
                    {Strings.StrLocation}: {redisResource.location} | {Strings.StrSku}: {redisResource.sku}
                </h3>
                <Pivot>
                    <PivotItem headerText={Strings.StrStatus}>
                        <DetailsList items={redisInfo} columns={columns} selectionMode={SelectionMode.none} />
                    </PivotItem>
                    <PivotItem headerText={Strings.StrSettings}>
                        <CopyableTextField id="hostName" label={Strings.StrHostname} value={redisResource.hostName} />
                        <CopyableTextField id="nonSslPort" label={Strings.StrNonSslPort} value={nonSslPort} />
                        <CopyableTextField id="sslPort" label={Strings.StrSslPort} value={redisResource.sslPort} />
                        <CopyableTextField
                            id="resourceId"
                            label={Strings.StrResourceId}
                            value={redisResource.resourceId}
                        />
                        <CopyableTextField
                            id="primaryAccessKey"
                            label={Strings.StrPrimaryAccessKey}
                            value={accessKey}
                        />
                        <CopyableTextField
                            id="primaryConnectionString"
                            label={Strings.StrPrimaryConnectionStr}
                            value={connectionString}
                        />
                        <CollapsibleList
                            label={Strings.StrGeoReplication}
                            groupName={Strings.StrLinkedServers}
                            values={redisResource.linkedServers}
                        />
                    </PivotItem>
                </Pivot>
            </div>
        );
    }
}
