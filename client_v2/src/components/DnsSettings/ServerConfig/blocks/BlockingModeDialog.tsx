import { createSignal, createEffect, createMemo, type Accessor } from 'solid-js';

import { dnsConfigState, setDnsConfig } from 'panel/stores/dnsConfig';
import intl from 'panel/common/intl';
import { ConfigDialog } from 'panel/common/ui/ConfigDialog';
import { Input } from 'panel/common/controls/Input';
import { Radio } from 'panel/common/controls/Radio';
import { UINT32_RANGE } from 'panel/helpers/constants';
import type { DNSConfigBlockingMode } from 'panel/api/model';
import { getBlockingModeOptions } from '../../helpers';
import { validateBetween } from 'panel/helpers/validators';
import { useField } from 'panel/hooks/useField';
import { FaqTooltip } from 'panel/common/ui/FaqTooltip';
import theme from 'panel/lib/theme';

type Props = {
    open: Accessor<boolean>;
    onClose: () => void;
    processing: boolean;
};

export const BlockingModeDialog = (props: Props) => {
    const blockingModeOptions = createMemo(() => getBlockingModeOptions());

    const [blockingMode, setBlockingMode] = createSignal(dnsConfigState.blocking_mode);
    createEffect(() => {
        if (props.open()) {
            setBlockingMode(dnsConfigState.blocking_mode);
        }
    });

    const ttl = useField<number>(
        () => props.open(),
        () => dnsConfigState.blocked_response_ttl,
        {
            validate: (v) => {
                if (Number.isNaN(v)) {
                    return intl.getMessage('form_error_required');
                }
                return validateBetween(v, UINT32_RANGE.MIN, UINT32_RANGE.MAX) || '';
            },
        },
    );

    const handleSubmit = () => {
        if (ttl.validate()) return;

        setDnsConfig({
            blocking_mode: blockingMode(),
            blocked_response_ttl: ttl.value(),
        });
        props.onClose();
    };

    return (
        <ConfigDialog
            open={props.open()}
            title={intl.getMessage('dns_blocking_mode_title')}
            description={intl.getMessage('dns_blocking_mode_desc')}
            onClose={props.onClose}
            onSubmit={handleSubmit}
            processing={props.processing}
        >
            <Radio
                name="blocking_mode"
                options={blockingModeOptions()}
                value={blockingMode()}
                handleChange={(v: DNSConfigBlockingMode) => setBlockingMode(v)}
                inModal
            />
            <div class={theme.form.input}>
                <Input
                    type="number"
                    id="blocked_response_ttl"
                    label={
                        <>
                            {intl.getMessage('dns_blocking_mode_ttl_label')}
                            <FaqTooltip
                                text={intl.getMessage('server_config_blocking_mode_ttl_faq')}
                                menuSize="large"
                            />
                        </>
                    }
                    placeholder={intl.getMessage('dns_blocking_mode_ttl_placeholder')}
                    value={ttl.value()}
                    onChange={(e) =>
                        ttl.setValue(e.target.value === '' ? NaN : Number(e.target.value))
                    }
                    onBlur={() => ttl.validate()}
                    min={UINT32_RANGE.MIN}
                    max={UINT32_RANGE.MAX}
                    errorMessage={ttl.error()}
                    size="large"
                />
            </div>
        </ConfigDialog>
    );
};
