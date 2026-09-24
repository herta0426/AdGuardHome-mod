import React, { useState } from 'react';
import { Trans } from 'react-i18next';
import i18next from 'i18next';

import Tabs from '../Tabs';

const getTabs = () => ({
    Router: {
        // eslint-disable-next-line react/display-name
        getTitle: () => (
            <p>
                <Trans>install_devices_router_desc</Trans>
            </p>
        ),
        title: 'Router',
        list: ['install_devices_router_list_1', 'install_devices_router_list_2', 'install_devices_router_list_3'],
    },
    Windows: {
        title: 'Windows',
        list: [
            'install_devices_windows_list_1',
            'install_devices_windows_list_2',
            'install_devices_windows_list_3',
            'install_devices_windows_list_4',
            'install_devices_windows_list_5',
            'install_devices_windows_list_6',
        ],
    },
    macOS: {
        title: 'macOS',
        list: [
            'install_devices_macos_list_1',
            'install_devices_macos_list_2',
            'install_devices_macos_list_3',
            'install_devices_macos_list_4',
        ],
    },
    Android: {
        title: 'Android',
        list: [
            'install_devices_android_list_1',
            'install_devices_android_list_2',
            'install_devices_android_list_3',
            'install_devices_android_list_4',
            'install_devices_android_list_5',
        ],
    },
    iOS: {
        title: 'iOS',
        list: [
            'install_devices_ios_list_1',
            'install_devices_ios_list_2',
            'install_devices_ios_list_3',
            'install_devices_ios_list_4',
        ],
    },
});

interface renderContentProps {
    title: string;
    list: unknown[];
    getTitle?: (...args: unknown[]) => unknown;
}

const renderContent = ({ title, list, getTitle }: renderContentProps) => (
    <div title={i18next.t(title)}>
        <div className="tab__title">{i18next.t(title)}</div>

        <div className="tab__text">
            {getTitle?.()}
            {list && (
                <ol>
                    {list.map((item: any) => (
                        <li key={item}>
                            <Trans>{item}</Trans>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    </div>
);

export const Guide = () => {
    const [activeTabLabel, setActiveTabLabel] = useState('Router');

    const tabs = getTabs();

    const activeTab = renderContent(tabs[activeTabLabel]);

    return (
        <div>
            <Tabs tabs={tabs} activeTabLabel={activeTabLabel} setActiveTabLabel={setActiveTabLabel}>
                {activeTab}
            </Tabs>
        </div>
    );
};
