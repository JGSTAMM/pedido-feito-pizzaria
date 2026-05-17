# Flight Plan: Admin Panel Data Integrity Fix

## Context & Root Cause
Two critical data-loss bugs were identified in the Admin Panel when updating `PizzaFlavor` and `Product` records:
1. **Image Erasure**: The `update` methods in `FlavorController` and `ProductController` were unconditionally setting the `image` field to `null` if no file was uploaded, even if an image existed.
2. **JSON Data Stripping**: Laravel's strict validation was stripping nested data from `ingredients_json` and `variations` arrays because only the top-level array was validated.

## Solution Strategy
1. **Preserve Images**: Update the `update` logic to only modify the `image` field if a new file is uploaded or a `clear_image` flag is explicitly sent.
2. **Strict Nested Validation**: Add wildcard validation rules (e.g., `ingredients_json.*.name`) to ensure nested JSON data is recognized as "validated" data by Laravel and not stripped from the `$validated` array.
3. **Currency Consistency**: Implement a custom accessor/mutator in the `Product` model for the `variations` JSON field to ensure nested prices are stored as cents (integers) in the database but handled as floats in the frontend, matching the behavior of the main `price` column.

## Implementation Details

### 1. Model Layer (`app/Models/Product.php`)
- Added a `variations` `Attribute` accessor/mutator.
- **Getter**: Converts stored cents back to floats (`/ 100`).
- **Setter**: Converts incoming floats from the frontend to cents (`* 100`).

### 2. Controller Layer (`app/Http/Controllers/FlavorController.php` & `ProductController.php`)
- **Validation**: Added `ingredients_json.*.name`, `ingredients_json.*.is_available`, `variations.*.name`, and `variations.*.price` rules.
- **Image Logic**: 
    - If `hasFile('image')`: Store and update.
    - Else if `clear_image`: Delete existing and set to `null`.
    - Else: `unset($validated['image'])` to preserve existing DB value.

## Verification Checklist
- [x] Edit a Flavor name without uploading an image -> Image remains.
- [x] Edit a Flavor ingredients -> Data persists.
- [x] Edit a Product variation price (e.g., 5.50) -> Saved as 550 in DB, appears as 5.50 in UI.
- [x] Clear image functionality -> Image is successfully deleted.

## Execution
- `git add app/Http/Controllers/FlavorController.php app/Http/Controllers/ProductController.php app/Models/Product.php`
- `git commit -m "fix(admin): resolve image erasure on update and fix strict JSON validation stripping for variations and ingredients"`
- `git push`
