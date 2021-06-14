// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { Pivot, PivotItem, TextField, getTheme, ITheme, List, mergeStyleSets } from '@fluentui/react';
import { StrText, StrJson } from '../Strings';
import './KeyContentsField.css';
import '../styles.css';

const theme: ITheme = getTheme();
const { fonts } = theme;

interface Props {
    value?: string;
}

export function KeyContentsField(props: Props): React.ReactElement {
    let json = {
        a: 1,
        b: 'xyz',
    };
    try {
        json = JSON.parse(props.value!);
        // eslint-disable-next-line no-empty
    } catch {}

    return (
        <div className="content-container">
            <Pivot className="content-tabs">
                <PivotItem className="content-tab-link" headerText={StrText}>
                    <div className="content-field">
                        <pre>{props.value}</pre>
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
