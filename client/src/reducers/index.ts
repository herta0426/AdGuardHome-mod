import { combineReducers } from 'redux';
import { loadingBarReducer } from 'react-redux-loading-bar';

import toasts from './toasts';
import rewrites from './rewrites';
import stats from './stats';
import queryLogs from './queryLogs';
import dnsConfig from './dnsConfig';
import filtering from './filtering';
import settings from './settings';
import dashboard from './dashboard';

export default combineReducers({
    settings,
    dashboard,
    queryLogs,
    filtering,
    toasts,
    rewrites,
    stats,
    dnsConfig,
    loadingBar: loadingBarReducer,
});
