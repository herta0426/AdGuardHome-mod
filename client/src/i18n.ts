import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import langDetect from 'i18next-browser-languagedetector';
import { setHtmlLangAttr } from './helpers/helpers';

import { LANGUAGES, BASE_LOCALE } from './helpers/twosky';

// Main translations.  This mod ships only the languages listed in
// .twosky.json; add the locale JSON files and their imports back to support
// more of them.
import en from './__locales/en.json';
import zhCN from './__locales/zh-cn.json';
import zhTW from './__locales/zh-tw.json';

// Services translations
import enServices from './__locales-services/en.json';
import zhCNServices from './__locales-services/zh-cn.json';
import zhTWServices from './__locales-services/zh-tw.json';

/**
 * Helper function to convert services object into a flat `{ key: message }` format.
 *
 * Supported formats:
 * - { message: "..." }
 *
 * Example:
 * Input:  { a: { message: "one" }, b: { message: "two" } }
 * Output: { a: "one", b: "two" }
 */
const convertServicesFormat = (
    services: Record<string, { message: string }>,
): Record<string, string> => {
    return Object.fromEntries(
        Object.entries(services).map(([key, value]) => [key, value.message])
    );
};

// Resources
const resources = {
    en: {
        translation: en,
        services: convertServicesFormat(enServices),
    },
    'en-us': {
        translation: en,
        services: convertServicesFormat(enServices),
    },
    'zh-cn': {
        translation: zhCN,
        services: convertServicesFormat(zhCNServices),
    },
    'zh-tw': {
        translation: zhTW,
        services: convertServicesFormat(zhTWServices),
    },
};

const availableLanguages = Object.keys(LANGUAGES);

i18n
    .use(langDetect)
    .use(initReactI18next)
    .init(
        {
            resources,
            lowerCaseLng: true,
            fallbackLng: BASE_LOCALE,
            keySeparator: false,
            nsSeparator: false,
            returnEmptyString: false,
            ns: ['translation', 'services'],
            defaultNS: 'translation',
            interpolation: {
                escapeValue: false,
            },
            react: {
                wait: true,
                bindI18n: 'languageChanged loaded',
            },
            whitelist: availableLanguages,
        },
        () => {
            if (!availableLanguages.includes(i18n.language)) {
                i18n.changeLanguage(BASE_LOCALE);
            }
            setHtmlLangAttr(i18n.language);
        }
    );

i18n.on('languageChanged', (lng) => {
    setHtmlLangAttr(lng);
});

export default i18n;
