import { connect } from 'react-redux';
import { getRewritesList, addRewrite, deleteRewrite, toggleRewritesModal } from '../actions/rewrites';
import { getDnsConfig, setDnsConfig } from '../actions/dnsConfig';

import Dns from '../components/Settings/Dns';

const mapStateToProps = (state: any) => {
    const { dashboard, settings, rewrites, dnsConfig } = state;
    const props = {
        dashboard,
        settings,
        rewrites,
        dnsConfig,
    };
    return props;
};

const mapDispatchToProps = {
    getRewritesList,
    addRewrite,
    deleteRewrite,
    toggleRewritesModal,
    getDnsConfig,
    setDnsConfig,
};

export default connect(mapStateToProps, mapDispatchToProps)(Dns);
