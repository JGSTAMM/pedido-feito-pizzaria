<?php

namespace App\Application\Printing;

class OrderItemClassifier
{
    private const BEVERAGE_CATEGORIES = [
        'bebida',
        'bebidas',
        'drinks',
        'drink',
        'suco',
        'sucos',
        'refrigerante',
        'refrigerantes',
        'cerveja',
        'cervejas',
        'agua',
        'água',
        'vinho',
        'vinhos',
        'chopp',
        'cervejas e chopp',
    ];

    private const BEVERAGE_KEYWORD_REGEX = '/\b(cerveja|coca|guarana|guaraná|suco|agua|água|fanta|sprite|heineken|chopp|vinho|red bull|monster|refri)\b/i';

    public static function isBeverage(bool $isPizza, ?string $category, ?string $productName = null, ?string $itemName = null): bool
    {
        if ($isPizza) {
            return false;
        }

        $cat = strtolower(trim((string) $category));
        if (in_array($cat, self::BEVERAGE_CATEGORIES, true) || str_contains($cat, 'bebid') || str_contains($cat, 'drink')) {
            return true;
        }

        $nameToCheck = trim((string) ($productName ?: $itemName));
        if ($nameToCheck !== '' && preg_match(self::BEVERAGE_KEYWORD_REGEX, $nameToCheck)) {
            return true;
        }

        return false;
    }

    public static function cleanNotes(?string $rawCustom, ?string $rawNotes, ?string $itemName = null, ?string $productName = null, bool $isPizza = false, ?string $sizeName = null): ?string
    {
        $custom = (string) $rawCustom;
        $notes = (string) $rawNotes;

        if ($isPizza && $sizeName) {
            $sizePattern = "Pizza {$sizeName}";
            $custom = str_ireplace([$sizePattern, $sizeName], '', $custom);
            $notes = str_ireplace([$sizePattern, $sizeName], '', $notes);
        }

        $trimmedCustom = trim($custom, " |,-.");
        $trimmedNotes = trim($notes, " |,-.");

        $cleanItemName = trim((string) $itemName);
        $cleanProdName = trim((string) $productName);

        // Strip phantom notes if they just repeat the item/product name
        if ($cleanItemName !== '' && strcasecmp($trimmedCustom, $cleanItemName) === 0) {
            $trimmedCustom = '';
        }
        if ($cleanProdName !== '' && strcasecmp($trimmedCustom, $cleanProdName) === 0) {
            $trimmedCustom = '';
        }
        if ($cleanItemName !== '' && strcasecmp($trimmedNotes, $cleanItemName) === 0) {
            $trimmedNotes = '';
        }
        if ($cleanProdName !== '' && strcasecmp($trimmedNotes, $cleanProdName) === 0) {
            $trimmedNotes = '';
        }

        if (strcasecmp($trimmedCustom, $trimmedNotes) === 0) {
            $trimmedCustom = '';
        }

        $parts = array_filter([$trimmedCustom, $trimmedNotes]);
        $unified = implode('|', $parts);

        return empty($unified) ? null : $unified;
    }

    public static function formatPizzaTitle(?string $sizeName, int $flavorCount, ?string $fallbackName = 'PIZZA'): string
    {
        $rawSize = trim((string) $sizeName);
        if (empty($rawSize) && ! empty($fallbackName)) {
            $rawSize = trim(explode('—', (string) $fallbackName)[0] ?? '');
        }

        $cleanSize = preg_replace('/^pizza\s+/i', '', $rawSize);
        $cleanSize = trim(strtoupper($cleanSize ?: 'GRANDE'));

        if ($flavorCount <= 1) {
            return "PIZZA {$cleanSize}";
        }

        if ($flavorCount === 2) {
            return "PIZZA {$cleanSize} - MEIA";
        }

        return "PIZZA {$cleanSize} - {$flavorCount} SABORES";
    }
}
