import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import Backend from 'i18next-http-backend';
import {i18nextPlugin} from 'translation-check'

i18n
    .use(Backend)
    .use(initReactI18next)
    .use(i18nextPlugin)
    .init({
        fallbackLng: 'fi',
        debug: false,
        backend: {
            loadPath: '/locales/{{lng}}.json'
        }
    });

export default i18n;
