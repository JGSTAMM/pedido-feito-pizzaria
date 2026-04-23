import { usePage } from '@inertiajs/react';
import enUS from '@/i18n/en-US.json';
import ptBR from '@/i18n/pt-BR.json';
import esES from '@/i18n/es-ES.json';

const dictionaries = {
    'pt-BR': ptBR,
    'pt_BR': ptBR,
    'en-US': enUS,
    en_US: enUS,
    en: enUS,
    'es-ES': esES,
    'es_ES': esES,
    es: esES,
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

export function useI18n() {
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
            return undefined;
        }

        return Object.entries(replacements).reduce((result, [replacementKey, replacementValue]) => {
            return result.replaceAll(`:${replacementKey}`, String(replacementValue));
        }, value);
    };

    const formatCurrency = (amount) => {
        const currency = 'BRL';
        const localeForIntl = 'pt-BR';

        return new Intl.NumberFormat(localeForIntl, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount || 0));
    };

    const translateDynamic = (value) => {
        if (!value) return '';
        const normalized = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        const key = `digital_menu.dynamic.${normalized}`;
        const translated = t(key);

        if (translated && translated !== key) return translated;

        // Fallback: Translate individual ingredients if it's a list (contains commas or " e " or " and ")
        if (value.includes(',') || /\s+e\s+/i.test(value) || /\s+and\s+/i.test(value)) {
            const parts = value.split(/,\s*|\s+e\s+|\s+and\s+/i).map(p => p.trim()).filter(Boolean);
            if (parts.length > 1) {
                return parts.map(part => {
                    const pNorm = part.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                    const pKey = `digital_menu.dynamic.${pNorm}`;
                    const pTrans = t(pKey);
                    return (pTrans && pTrans !== pKey) ? pTrans : part;
                }).join(', ');
            }
        }

        return value;
    };

    return {
        locale,
        t,
        formatCurrency,
        translateDynamic,
    };
}

export default useI18n;
