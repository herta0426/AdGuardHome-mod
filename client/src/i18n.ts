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

// Resources
const resources = {
    en: {
        translation: en,
    },
    'en-us': {
        translation: en,
    },
    'zh-cn': {
        translation: zhCN,
    },
    'zh-tw': {
        translation: zhTW,
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
            ns: ['translation'],
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
