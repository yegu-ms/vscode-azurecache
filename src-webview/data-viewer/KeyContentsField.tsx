// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { Pivot, PivotItem, TextField } from '@fluentui/react';
import { StrText, StrJson } from '../Strings';
import './KeyContentsField.css';

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
            <Pivot>
                <PivotItem headerText={StrText}>
                    <TextField readOnly multiline value={props.value} resizable={false} />
                </PivotItem>
                {json && Object.keys(json).length !== 0 && (
                    <PivotItem headerText={StrJson}>
                        <TextField readOnly multiline value={JSON.stringify(json, null, 4)} resizable={false} />
                    </PivotItem>
                )}
            </Pivot>
        </div>
    );
}
