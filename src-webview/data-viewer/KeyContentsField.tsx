// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { Pivot, PivotItem, Link } from '@fluentui/react';
import { stringToBinary, stringToJson, previewText, ContentType } from '../Utils/StringUtils';
import { StrText, StrBinary, StrJson, StrShowAll, StrNotJson } from '../Strings';
import './KeyContentsField.css';
import '../styles.css';

const linkItemKeys = {
    text: 'text',
    binary: 'binary',
    json: 'json',
};

interface Props {
    value?: string;
}

interface State {
    displayText?: string;
    textShowAll: boolean;
    binaryValue?: string;
    displayBinary?: string;
    binaryShowAll: boolean;
    jsonValue?: string;
    displayJson?: string;
    jsonShowAll: boolean;
}

export class KeyContentsField extends React.Component<Props, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            textShowAll: false,
            binaryShowAll: false,
            jsonShowAll: false,
        };
    }

    componentDidMount(): void {
        const { value } = this.props;

        if (value !== undefined) {
            const displayText = previewText(value, ContentType.Text);
            this.setState({
                displayText,
                textShowAll: displayText !== value,
            });
        }
    }

    onLinkClick = (item?: PivotItem): void => {
        if (item?.props.itemKey! === linkItemKeys['binary']) {
            const { binaryValue } = this.state;

            if (binaryValue === undefined) {
                const { value } = this.props;
                const binaryValue = stringToBinary(value);
                const displayBinary = previewText(binaryValue, ContentType.Binary);
                this.setState({
                    binaryValue,
                    displayBinary,
                    binaryShowAll: displayBinary !== binaryValue,
                });
            } 
        } else if (item?.props.itemKey! === linkItemKeys['json']) {
            const { jsonValue } = this.state;

            if (jsonValue === undefined) {
                const { value } = this.props;
                const jsonValue = stringToJson(value);
                const displayJson = previewText(jsonValue, ContentType.Json);
                this.setState({
                    jsonValue,
                    displayJson,
                    jsonShowAll: displayJson !== jsonValue,
                });
            }
        }
    };

    showAllText = (): void => {
        const { value } = this.props;
        this.setState({
            displayText: value,
            textShowAll: false,
        });
    }

    showAllBinary = (): void => {
        const { binaryValue } = this.state;
        this.setState({
            displayBinary: binaryValue,
            binaryShowAll: false,
        });
    }

    showAllJson = (): void => {
        const { jsonValue } = this.state;
        this.setState({
            displayJson: jsonValue,
            jsonShowAll: false,
        });
    }

    render(): JSX.Element | null {
        const { displayText, textShowAll, displayBinary, binaryShowAll, displayJson, jsonValue, jsonShowAll } = this.state;

        return (
            <div className="content-container">
                <Pivot className="content-tabs" onLinkClick={this.onLinkClick}>
                    <PivotItem className="content-tab-link" itemKey={linkItemKeys['text']} headerText={StrText}>
                        <div className="content-field">
                            <div><code>{displayText}</code></div>
                            {textShowAll && (
                                <div>
                                    <br />
                                    <Link className="content-field-link" onClick={this.showAllText}>
                                        {StrShowAll}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </PivotItem>
                    <PivotItem className="content-tab-link" itemKey={linkItemKeys['binary']} headerText={StrBinary}>
                        <div className="content-field">
                            <div><code>{displayBinary}</code></div>
                            {binaryShowAll && (
                                <div>
                                    <br />
                                    <Link className="content-field-link" onClick={this.showAllBinary}>
                                        {StrShowAll}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </PivotItem>
                        <PivotItem className="content-tab-link" itemKey={linkItemKeys['json']} headerText={StrJson}>
                            <div className="content-field">
                                {jsonValue !== undefined && jsonValue !== '' && (<div><code>{displayJson}</code></div>)}
                                {jsonValue !== undefined && jsonValue === '' && (<div><span className="content-field-message">{StrNotJson}</span></div>)}
                                {jsonShowAll && (
                                    <div>
                                        <br />
                                        <Link className="content-field-link" onClick={this.showAllJson}>
                                            {StrShowAll}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </PivotItem>
                </Pivot>
            </div>
        );
    }
}
