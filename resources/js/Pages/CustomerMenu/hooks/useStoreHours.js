import { useMemo } from 'react';
import useI18n from '@/hooks/useI18n';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function useStoreHours(openingHours) {
    const { t } = useI18n();

    const todayHours = useMemo(() => {
        if (!openingHours) return null;
        const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayKey = dayMap[new Date().getDay()];
        const today = openingHours[todayKey];
        if (!today || today.closed || !today.open || !today.close) return null;
        return `${today.open} – ${today.close}`;
    }, [openingHours]);

    const dynamicHoursSummary = useMemo(() => {
        if (!openingHours) return null;

        const shortDays = {
            monday: t('digital_menu.days.mon'),
            tuesday: t('digital_menu.days.tue'),
            wednesday: t('digital_menu.days.wed'),
            thursday: t('digital_menu.days.thu'),
            friday: t('digital_menu.days.fri'),
            saturday: t('digital_menu.days.sat'),
            sunday: t('digital_menu.days.sun')
        };

        const todayKey = DAY_KEYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
        const today = openingHours[todayKey];

        if (!today || today.closed) return t('digital_menu.home.closed_today');

        let start = DAY_KEYS.indexOf(todayKey);
        let end = start;

        while (start > 0 &&
            !openingHours[DAY_KEYS[start - 1]].closed &&
            openingHours[DAY_KEYS[start - 1]].open === today.open &&
            openingHours[DAY_KEYS[start - 1]].close === today.close) {
            start--;
        }

        while (end < 6 &&
            !openingHours[DAY_KEYS[end + 1]].closed &&
            openingHours[DAY_KEYS[end + 1]].open === today.open &&
            openingHours[DAY_KEYS[end + 1]].close === today.close) {
            end++;
        }

        const rangeSeparator = t('common.to_range');
        const range = start === end
            ? shortDays[DAY_KEYS[start]]
            : `${shortDays[DAY_KEYS[start]]}${rangeSeparator}${shortDays[DAY_KEYS[end]]}`;
        return `${range} ${today.open} – ${today.close}`;
    }, [openingHours, t]);

    return { todayHours, dynamicHoursSummary };
}
