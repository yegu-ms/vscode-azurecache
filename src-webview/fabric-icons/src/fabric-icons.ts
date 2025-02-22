// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IIconOptions, IIconSubset, registerIcons } from '@fluentui/style-utilities';

export function initializeIcons(baseUrl = '.', options?: IIconOptions): void {
    const subset: IIconSubset = {
        style: {
            MozOsxFontSmoothing: 'grayscale',
            WebkitFontSmoothing: 'antialiased',
            fontStyle: 'normal',
            fontWeight: 'normal',
            speak: 'none',
        },
        fontFace: {
            fontFamily: `"FabricMDL2Icons"`,
            src: `url('${baseUrl}/fabric-icons.woff') format('woff')`,
        },
        icons: {
            ChevronDownMed: '\uE972',
            ChevronRightMed: '\uE974',
            ChromeClose: '\uE8BB',
            Copy: '\uE8C8',
            Hide: '\uED1A',
            RedEye: '\uE7B3',
            Tag: '\uE8EC',
        },
    };

    registerIcons(subset, options);
}
