import React, { Component, Fragment } from 'react';
import { withTranslation } from 'react-i18next';

import StatsConfig from './StatsConfig';

import LogsConfig from './LogsConfig';

import Loading from '../ui/Loading';

import PageTitle from '../ui/PageTitle';

import './Settings.css';
import { SettingsData } from '../../initialState';

interface SettingsProps {
    initSettings: (...args: unknown[]) => unknown;
    settings: SettingsData;
    toggleSetting: (...args: unknown[]) => unknown;
    getStatsConfig: (...args: unknown[]) => unknown;
    setStatsConfig: (...args: unknown[]) => unknown;
    resetStats: (...args: unknown[]) => unknown;
    setFiltersConfig: (...args: unknown[]) => unknown;
    getFilteringStatus: (...args: unknown[]) => unknown;
    t: (...args: unknown[]) => string;
    getLogsConfig?: (...args: unknown[]) => unknown;
    setLogsConfig?: (...args: unknown[]) => unknown;
    clearLogs?: (...args: unknown[]) => unknown;
    stats?: {
        processingGetConfig?: boolean;
        interval?: number;
        customInterval?: number;
        enabled?: boolean;
        ignored?: unknown[];
        ignored_enabled?: boolean;
        processingSetConfig?: boolean;
        processingReset?: boolean;
    };
    queryLogs?: {
        enabled?: boolean;
        interval?: number;
        customInterval?: number;
        anonymize_client_ip?: boolean;
        processingSetConfig?: boolean;
        processingClear?: boolean;
        processingGetConfig?: boolean;
        ignored?: unknown[];
        ignored_enabled?: boolean;
    };
    filtering?: {
        interval?: number;
        enabled?: boolean;
        processingSetConfig?: boolean;
    };
}

class Settings extends Component<SettingsProps> {
    componentDidMount() {
        this.props.initSettings();

        this.props.getStatsConfig();

        this.props.getLogsConfig();
    }

    render() {
        const {
            settings,
            setStatsConfig,
            resetStats,
            stats,
            queryLogs,
            setLogsConfig,
            clearLogs,
            t,
        } = this.props;

        const isDataReady = !settings.processing && !stats.processingGetConfig && !queryLogs.processingGetConfig;

        return (
            <Fragment>
                <PageTitle title={t('general_settings')} />

                {!isDataReady && <Loading />}

                {isDataReady && (
                    <div className="content">
                        <div className="row">
                            <div className="col-md-12">
                                <LogsConfig
                                    enabled={queryLogs.enabled}
                                    ignored={queryLogs.ignored}
                                    ignoredEnabled={queryLogs.ignored_enabled}
                                    interval={queryLogs.interval}
                                    customInterval={queryLogs.customInterval}
                                    anonymize_client_ip={queryLogs.anonymize_client_ip}
                                    processing={queryLogs.processingSetConfig}
                                    processingClear={queryLogs.processingClear}
                                    setLogsConfig={setLogsConfig}
                                    clearLogs={clearLogs}
                                />
                            </div>

                            <div className="col-md-12">
                                <StatsConfig
                                    interval={stats.interval}
                                    customInterval={stats.customInterval}
                                    ignored={stats.ignored}
                                    ignoredEnabled={stats.ignored_enabled}
                                    enabled={stats.enabled}
                                    processing={stats.processingSetConfig}
                                    processingReset={stats.processingReset}
                                    setStatsConfig={setStatsConfig}
                                    resetStats={resetStats}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Fragment>
        );
    }
}

export default withTranslation()(Settings);
