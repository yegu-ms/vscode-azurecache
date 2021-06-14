// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { IconButton, IIconProps } from '@fluentui/react/lib/';
import { StrCopy } from '../Strings';
import '../styles.css';

const copyIcon: IIconProps = { iconName: 'Copy' };

interface Props {
    onClick: () => void;
    onMouseLeave?: () => void;
}

export function CopyButton(props: Props): React.ReactElement {
    return (
        <IconButton
            className="copy-icon"
            iconProps={copyIcon}
            style={{
                backgroundColor: '#0078d4',
                color: 'white',
            }}
            ariaLabel={StrCopy}
            onClick={props.onClick}
            onMouseLeave={props.onMouseLeave}
        />
    );
}
