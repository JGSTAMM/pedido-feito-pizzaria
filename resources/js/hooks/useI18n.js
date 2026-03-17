import { usePage } from '@inertiajs/react';
import enUS from '@/i18n/en-US.json';
import ptBR from '@/i18n/pt-BR.json';

const dictionaries = {
    'pt-BR': ptBR,
    'pt_BR': ptBR,
    'en-US': enUS,
    en_US: enUS,
    en: enUS,
};

function normalizeLocale(locale) {
    if (!locale) {
        return 'pt-BR';
    }

    if (locale === 'pt_BR') {
        return 'pt-BR';
    }

    if (locale === 'en_US') {
        return 'en-US';
    }

    if (locale.startsWith('pt')) {
        return 'pt-BR';
    }

    if (locale.startsWith('en')) {
        return 'en-US';
    }

    return locale;
}

function getByPath(object, path) {
    return path.split('.').reduce((acc, part) => {
        if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
            return acc[part];
        }

        return undefined;
    }, object);
}

export default function useI18n() {
    const { props } = usePage();

    const locale = normalizeLocale(props.locale || 'pt-BR');
    const fallbackLocale = normalizeLocale(props.fallbackLocale || 'en-US');

    const dictionary = dictionaries[locale] || dictionaries['pt-BR'];
    const fallbackDictionary = dictionaries[fallbackLocale] || dictionaries['en-US'];

    const t = (key, replacements = {}) => {
        let value = getByPath(dictionary, key);

        if (typeof value === 'undefined') {
            value = getByPath(fallbackDictionary, key);
        }

        if (typeof value !== 'string') {
            return key;
        }

        return Object.entries(replacements).reduce((result, [replacementKey, replacementValue]) => {
            return result.replaceAll(`:${replacementKey}`, String(replacementValue));
        }, value);
    };

    const formatCurrency = (amount) => {
        const currency = t('common.currency');
        const localeForIntl = locale === 'pt-BR' ? 'pt-BR' : 'en-US';

        return new Intl.NumberFormat(localeForIntl, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount || 0));
    };

    return {
        locale,
        t,
        formatCurrency,
    };
}
