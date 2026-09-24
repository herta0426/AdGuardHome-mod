import { connect } from 'react-redux';

import { toggleProtection } from '../actions';
import { getStats, getStatsConfig } from '../actions/stats';

import Dashboard from '../components/Dashboard';
import { RootState } from '../initialState';

const mapStateToProps = (state: RootState) => {
    const { dashboard, stats } = state;
    const props = { dashboard, stats };
    return props;
};

type DispatchProps = {
    toggleProtection: (...args: unknown[]) => unknown;
    getStats: (...args: unknown[]) => unknown;
    getStatsConfig: (...args: unknown[]) => unknown;
};

const mapDispatchToProps: DispatchProps = {
    toggleProtection,
    getStats,
    getStatsConfig,
};

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
