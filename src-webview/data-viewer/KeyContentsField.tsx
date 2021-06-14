// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { Pivot, PivotItem } from '@fluentui/react';
import { stringToBinary } from '../../src/utils/StringUtils';
import { StrText, StrBinary, StrJson } from '../Strings';
import './KeyContentsField.css';
import '../styles.css';

interface Props {
    value?: string;
}

export function KeyContentsField(props: Props): React.ReactElement {
    let json = {};
    try {
        if (props.value !== undefined) {
            json = JSON.parse(props.value);
        }
        // eslint-disable-next-line no-empty
    } catch (e) {}

    return (
        <div className="content-container">
            <Pivot className="content-tabs">
                <PivotItem className="content-tab-link" headerText={StrText}>
                    <div className="content-field">
                        <pre>{props.value}</pre>
                    </div>
                </PivotItem>
                <PivotItem className="content-tab-link" headerText={StrBinary}>
                    <div className="content-field">
                        <pre>{stringToBinary(props.value)}</pre>
                    </div>
                </PivotItem>
                {json && Object.keys(json).length !== 0 && (
                    <PivotItem className="content-tab-link" headerText={StrJson}>
                        <div className="content-field">
                            <pre>{JSON.stringify(json, null, 4)}</pre>
                        </div>
                    </PivotItem>
                )}
            </Pivot>
        </div>
    );
}
