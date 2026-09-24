import {
    BLOCKING_MODES,
    DAY,
    DEFAULT_LOGS_FILTER,
    STANDARD_DNS_PORT,
    STANDARD_WEB_PORT,
    TIME_UNITS,
} from './helpers/constants';
import { DEFAULT_BLOCKING_IPV4, DEFAULT_BLOCKING_IPV6 } from './reducers/dnsConfig';
import { Filter } from './helpers/helpers';

export type InstallInterface = {
    flags: string;
    hardware_address: string;
    ip_addresses: string[];
    mtu: number;
    name: string;
};

export type InstallData = {
    step: number;
    processingDefault: boolean;
    processingSubmit: boolean;
    processingCheck: boolean;
    web: {
        ip: string;
        port: number;
        status: string;
        can_autofix: boolean;
    };
    dns: {
        ip: string;
        port: number;
        status: string;
        can_autofix: boolean;
    };
    staticIp: {
        static: string;
        ip: string;
        error: string;
    };
    interfaces: InstallInterface[];
    dnsVersion: string;
};

export type Client = {
    filtering_enabled: boolean;
    ids: string[];
    ignore_querylog: boolean;
    ignore_statistics: boolean;
    name: string;
    tags: string[];
    upstreams: string[];
    upstreams_cache_enabled: boolean;
    upstreams_cache_size: number;
    use_global_settings: boolean;
};

export type AutoClient = {
    ip: string;
    name: string;
    source: string;
    whois_info: any;
};

export type DashboardData = {
    processing: boolean;
    isCoreRunning: boolean;
    processingVersion: boolean;
    processingClients: boolean;
    processingUpdate: boolean;
    processingProfile: boolean;
    protectionEnabled: boolean;
    protectionDisabledDuration: any;
    protectionCountdownActive: boolean;
    processingProtection: boolean;
    httpPort: number;
    dnsPort: number;
    dnsAddresses: string[];
    dnsVersion: string;
    dnsStartTime: number | null;
    clients: Client[];
    autoClients: AutoClient[];
    supportedTags: string[];
    name: string;
    theme: string | null;
    checkUpdateFlag: boolean;
    announcementUrl: string;
    newVersion: string;
    canAutoUpdate: boolean;
    language: string;
    isUpdateAvailable: boolean;
};

export type SettingsData = {
    processing: boolean;
    processingTestUpstream: boolean;
    settingsList?: {
        parental: {
            enabled: boolean;
            order: number;
            subtitle: string;
            title: string;
        };
        safebrowsing: {
            enabled: boolean;
            order: number;
            subtitle: string;
            title: string;
        };
    };
};

export type RewritesData = {
    processing: boolean;
    processingAdd: boolean;
    processingDelete: boolean;
    processingUpdate: boolean;
    isModalOpen: boolean;
    modalType: string;
    currentRewrite?: {
        answer: string;
        domain: string;
        enabled: boolean;
    };
    list: {
        answer: string;
        domain: string;
        enabled: boolean;
    }[];
    settings: {
        enabled: boolean;
    };
};

export type NormalizedTopClients = {
    auto: Record<string, number>;
    configured: Record<string, number>;
};

export type StatsData = {
    processingGetConfig: boolean;
    processingSetConfig: boolean;
    processingStats: boolean;
    processingReset: boolean;
    interval: number;
    customInterval?: number;
    ignored_enabled: boolean;
    dnsQueries: number[];
    blockedFiltering: number[];
    replacedParental: number[];
    replacedSafebrowsing: number[];
    topBlockedDomains: { name: string; count: number }[];
    topClients: {
        name: string;
        count: number;
        info: any;
    }[];
    normalizedTopClients?: NormalizedTopClients;
    topQueriedDomains: { name: string; count: number }[];
    numBlockedFiltering: number;
    numDnsQueries: number;
    numReplacedParental: number;
    numReplacedSafebrowsing: number;
    avgProcessingTime: number;
    timeUnits: string;
    enabled: boolean;
    topUpstreamsAvgTime: { name: string; count: number }[];
    topUpstreamsResponses: { name: string; count: number }[];
};

export type DnsConfigData = {
    processingGetConfig: boolean;
    processingSetConfig: boolean;
    blocking_mode: string;
    ratelimit: number;
    blocking_ipv4: string;
    blocking_ipv6: string;
    blocked_response_ttl: number;
    upstream_timeout: number;
    edns_cs_enabled: boolean;
    disable_ipv6: boolean;
    dnssec_enabled: boolean;
    upstream_dns_file: string;
    upstream_dns: string;
    fallback_dns: string;
    bootstrap_dns: string;
    local_ptr_upstreams: string;
    ratelimit_whitelist: string;
    upstream_mode: string;
    resolve_clients: boolean;
    use_private_ptr_resolvers: boolean;
    default_local_ptr_upstreams: any[];
    ratelimit_subnet_len_ipv4?: number;
    ratelimit_subnet_len_ipv6?: number;
    edns_cs_use_custom?: boolean;
    edns_cs_custom_ip?: string;
    cache_enabled?: boolean;
    cache_size?: number;
    cache_ttl_max?: number;
    cache_ttl_min?: number;
    cache_optimistic?: boolean;
};

export type FilteringData = {
    isModalOpen: boolean;
    processingFilters: boolean;
    processingRules: boolean;
    processingAddFilter: boolean;
    processingRefreshFilters: boolean;
    processingConfigFilter: boolean;
    processingRemoveFilter: boolean;
    processingSetConfig: boolean;
    processingCheck: boolean;
    isFilterAdded: boolean;
    filters: Filter[];
    whitelistFilters: any[];
    userRules: string;
    interval: number;
    enabled: boolean;
    modalType: string;
    modalFilterUrl: string;
    check: any;
};

export type QueryLogsData = {
    processingGetLogs: boolean;
    processingClear: boolean;
    processingGetConfig: boolean;
    processingSetConfig: boolean;
    processingAdditionalLogs: boolean;
    interval: any;
    logs: any[];
    enabled: boolean;
    oldest: string;
    filter: any;
    isFiltered: boolean;
    anonymize_client_ip: boolean;
    isDetailed: boolean;
    isEntireLog: boolean;
    customInterval: any;
    ignored_enabled: boolean;
};

export type RootState = {
    dashboard?: DashboardData;
    dnsConfig?: DnsConfigData;
    filtering?: FilteringData;
    queryLogs?: QueryLogsData;
    rewrites?: RewritesData;
    settings?: SettingsData;
    stats?: StatsData;
    install?: InstallData;
    toasts: { notices: any[] };
    loadingBar: any;
};

export type InstallState = {
    install: InstallData;
    toasts: { notices: any[] };
};

export type LoginState = {
    login: {
        processingLogin: false;
        email: string;
        password: string;
    };
    toasts: { notices: any[] };
};

export const initialState: RootState = {
    dashboard: {
        processing: true,
        isCoreRunning: true,
        processingVersion: true,
        processingClients: true,
        processingUpdate: false,
        processingProfile: true,
        protectionEnabled: false,
        protectionDisabledDuration: null,
        protectionCountdownActive: false,
        processingProtection: false,
        httpPort: STANDARD_WEB_PORT,
        dnsPort: STANDARD_DNS_PORT,
        dnsAddresses: [],
        dnsVersion: '',
        dnsStartTime: null,
        clients: [],
        autoClients: [],
        supportedTags: [],
        name: '',
        theme: undefined,
        checkUpdateFlag: false,
        announcementUrl: '',
        newVersion: '',
        canAutoUpdate: false,
        language: '', // ???
        isUpdateAvailable: false,
    },
    dnsConfig: {
        processingGetConfig: false,
        processingSetConfig: false,
        blocking_mode: BLOCKING_MODES.default,
        ratelimit: 20,
        blocking_ipv4: DEFAULT_BLOCKING_IPV4,
        blocking_ipv6: DEFAULT_BLOCKING_IPV6,
        blocked_response_ttl: 10,
        upstream_timeout: 10,
        edns_cs_enabled: false,
        disable_ipv6: false,
        dnssec_enabled: false,
        upstream_dns_file: '',
        upstream_dns: '',
        fallback_dns: '',
        bootstrap_dns: '',
        local_ptr_upstreams: '',
        ratelimit_whitelist: '',
        upstream_mode: '',
        resolve_clients: false,
        use_private_ptr_resolvers: false,
        default_local_ptr_upstreams: [],
    },
    filtering: {
        isModalOpen: false,
        processingFilters: false,
        processingRules: false,
        processingAddFilter: false,
        processingRefreshFilters: false,
        processingConfigFilter: false,
        processingRemoveFilter: false,
        processingSetConfig: false,
        processingCheck: false,
        isFilterAdded: false,
        filters: [],
        whitelistFilters: [],
        userRules: '',
        interval: 24,
        enabled: true,
        modalType: '',
        modalFilterUrl: '',
        check: {},
    },
    queryLogs: {
        processingGetLogs: true,
        processingClear: false,
        processingGetConfig: false,
        processingSetConfig: false,
        processingAdditionalLogs: false,
        interval: DAY,
        logs: [],
        enabled: true,
        oldest: '',
        filter: DEFAULT_LOGS_FILTER,
        isFiltered: false,
        anonymize_client_ip: false,
        isDetailed: true,
        isEntireLog: false,
        customInterval: null,
        ignored_enabled: true,
    },
    rewrites: {
        processing: true,
        processingAdd: false,
        processingDelete: false,
        processingUpdate: false,
        isModalOpen: false,
        modalType: '',
        list: [],
        settings: { enabled: false },
    },
    settings: {
        processing: true,
        processingTestUpstream: false,
    },
    stats: {
        processingGetConfig: false,
        processingSetConfig: false,
        processingStats: true,
        processingReset: false,
        interval: DAY,
        customInterval: null,
        ignored_enabled: true,
        dnsQueries: [],
        blockedFiltering: [],
        replacedParental: [],
        replacedSafebrowsing: [],
        topBlockedDomains: [],
        topClients: [],
        topQueriedDomains: [],
        numBlockedFiltering: 0,
        numDnsQueries: 0,
        numReplacedParental: 0,
        numReplacedSafebrowsing: 0,
        avgProcessingTime: 0,
        timeUnits: TIME_UNITS.HOURS,
        enabled: true,
        topUpstreamsAvgTime: [],
        topUpstreamsResponses: [],
    },
    toasts: { notices: [] },
    loadingBar: {},
};
