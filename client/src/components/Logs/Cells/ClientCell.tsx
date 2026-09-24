import React, { useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { nanoid } from 'nanoid';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { Link } from 'react-router-dom';

import { checkFiltered } from '../../../helpers/helpers';
import { BLOCK_ACTIONS } from '../../../helpers/constants';

import { toggleBlocking } from '../../../actions';

import IconTooltip from './IconTooltip';

import { renderFormattedClientCell } from '../../../helpers/renderFormattedClientCell';
import { getStats } from '../../../actions/stats';
import { RootState } from '../../../initialState';

interface ClientCellProps {
    client: string;
    client_id?: string;
    client_info?: {
        name: string;
        whois: {
            country?: string;
            city?: string;
            orgname?: string;
        };
        disallowed: boolean;
        disallowed_rule: string;
    };
    domain: string;
    reason: string;
}

const ClientCell = ({ client, client_id, client_info, domain, reason }: ClientCellProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const autoClients = useSelector((state: RootState) => state.dashboard.autoClients, shallowEqual);

    const isDetailed = useSelector((state: RootState) => state.queryLogs.isDetailed);

    const [isOptionsOpened, setOptionsOpened] = useState(false);

    const autoClient = autoClients.find((autoClient: any) => autoClient.name === client);

    const source = autoClient?.source;
    const whoisAvailable = client_info && Object.keys(client_info.whois).length > 0;
    const clientName = client_info?.name || client_id;
    const clientInfo = client_info && {
        ...client_info,
        whois_info: client_info?.whois,
        name: clientName,
    };

    const id = nanoid();

    const data = {
        address: client,
        name: clientName,
        country: client_info?.whois?.country,
        city: client_info?.whois?.city,
        network: client_info?.whois?.orgname,
        source_label: source,
    };

    const processedData = Object.entries(data);

    const isFiltered = checkFiltered(reason);

    const nameClass = classNames('w-90 o-hidden d-flex flex-column', {
        'mt-2': isDetailed && !client_info?.name && !whoisAvailable,
        'white-space--nowrap': isDetailed,
    });

    const hintClass = classNames('icons mr-4 icon--24 logs__question icon--lightgray', {
        'my-3': isDetailed,
    });

    const renderBlockingButton = (isFiltered: any, domain: any) => {
        const buttonType = isFiltered ? BLOCK_ACTIONS.UNBLOCK : BLOCK_ACTIONS.BLOCK;

        const onClick = async () => {
            await dispatch(toggleBlocking(buttonType, domain));
            await dispatch(getStats());
            setOptionsOpened(false);
        };

        const BUTTON_OPTIONS = [
            {
                name: buttonType,
                onClick,
                className: isFiltered ? 'bg--green' : 'bg--danger',
            },
        ];

        const getOptions = (options: any) => {
            if (options.length === 0) {
                return null;
            }

            return (
                <>
                    {options.map(({ name, onClick, disabled, className }: any) => (
                        <button
                            key={name}
                            className={classNames('button-action--arrow-option px-4 py-1', className)}
                            onClick={onClick}
                            disabled={disabled}>
                            {t(name)}
                        </button>
                    ))}
                </>
            );
        };

        const content = getOptions(BUTTON_OPTIONS);

        const containerClass = classNames('button-action__container', {
            'button-action__container--detailed': isDetailed,
        });

        return (
            <div className={containerClass}>
                <button type="button" className="btn btn-icon btn-sm px-0" onClick={() => setOptionsOpened(true)}>
                    <svg className="icon24 icon--lightgray button-action__icon">
                        <use xlinkHref="#bullets" />
                    </svg>
                </button>
                {isOptionsOpened && (
                    <IconTooltip
                        className="icon24"
                        tooltipClass="button-action--arrow-option-container"
                        xlinkHref="bullets"
                        triggerClass="btn btn-icon btn-sm px-0 button-action__hidden-trigger"
                        content={content}
                        placement="bottom-end"
                        trigger="click"
                        onVisibilityChange={setOptionsOpened}
                        defaultTooltipShown={true}
                        delayHide={0}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="o-hidden h-100 logs__cell logs__cell--client" role="gridcell">
            <IconTooltip
                className={hintClass}
                columnClass="grid grid--limited"
                tooltipClass="px-5 pb-5 pt-4"
                xlinkHref="question"
                contentItemClass="text-truncate key-colon o-hidden"
                title="client_details"
                content={processedData}
                placement="bottom"
            />

            <div className={nameClass}>
                <div data-tip={true} data-for={id}>
                    {renderFormattedClientCell(client, clientInfo, isDetailed, true)}
                </div>
                {isDetailed && clientName && !whoisAvailable && (
                    <Link
                        className="detailed-info d-none d-sm-block logs__text logs__text--link logs__text--client"
                        to={`logs?search="${encodeURIComponent(clientName)}"`}
                        title={clientName}>
                        {clientName}
                    </Link>
                )}
            </div>
            {renderBlockingButton(isFiltered, domain)}
        </div>
    );
};

export default ClientCell;
