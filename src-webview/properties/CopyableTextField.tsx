// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { vscode } from '../vscode';
import * as React from 'react';
import { IStackTokens, ITooltipHostStyles, Stack, TextField, TooltipDelay, TooltipHost } from '@fluentui/react/lib/';
import { WebviewCommand } from '../../src-shared/WebviewCommand';
import { StrCopied, StrCopyToClipboard } from '../Strings';
import { CopyButton } from './CopyButton';
import '../styles.css';

const tooltipProps = { gapSpace: 0 };
const tooltipStyles: Partial<ITooltipHostStyles> = { root: { display: 'inline-block' } };
const stackTokens: IStackTokens = {
    childrenGap: 5,
};

interface Props {
    id: string;
    label?: string;
    value?: string | number;
    password?: boolean;
}

interface State {
    showClicked: boolean;
}

export class CopyableTextField extends React.Component<Props, State> {
    state = {
        showClicked: false,
    };

    onClick = (): void => {
        if (this.props.value) {
            vscode.postMessage({
                command: WebviewCommand.CopyText,
                value: this.props.value.toString(),
            });
            this.setState({
                showClicked: true,
            });
        }
    };

    onMouseLeave = (): void => {
        this.setState({ showClicked: false });
    };

    render(): JSX.Element | null {
        const { value } = this.props;

        if (value === undefined) {
            return null;
        }

        const displayValue = typeof value === 'number' ? String(value) : value;
        const tooltipText = this.state.showClicked ? StrCopied : StrCopyToClipboard;

        return (
            <Stack horizontal tokens={stackTokens}>
                <Stack.Item grow align="end">
                    {this.props.password === undefined || !this.props.password ? (
                        <TextField label={this.props.label} readOnly value={displayValue} />
                    ) : (
                        <TextField
                            label={this.props.label}
                            readOnly
                            value={displayValue}
                            type="password"
                            canRevealPassword
                        />
                    )}
                </Stack.Item>
                <Stack.Item align="end">
                    <TooltipHost
                        content={tooltipText}
                        id={this.props.id}
                        calloutProps={tooltipProps}
                        delay={TooltipDelay.zero}
                        styles={tooltipStyles}
                    >
                        <CopyButton onClick={this.onClick} onMouseLeave={this.onMouseLeave} />
                    </TooltipHost>
                </Stack.Item>
            </Stack>
        );
    }
}
