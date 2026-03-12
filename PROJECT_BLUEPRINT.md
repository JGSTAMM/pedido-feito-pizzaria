# PROJECT: Lucchese Pizza System 2.0 
 ## 1. Tech Stack 
 - **Framework:** Laravel 11 (PHP 8.2+) 
 - **Admin Panel:** FilamentPHP v3 
 - **Web Frontend:** Laravel Livewire 
 - **Database:** MySQL 
 
 ## 2. Core Business Rules (CRITICAL) 
 ### A. Pizza Pricing Logic 
 1.  **Large Pizza (Grande - 35cm):** 
     - Up to 3 flavors. 
     - **Price Rule:** Equals the **HIGHEST** value among selected flavors. 
     - Example: 1/2 Flavor A ($40) + 1/2 Flavor B ($80) = Final Price $80. 
 2.  **Small Pizza (Broto - 17.5cm):** 
     - Only 1 flavor. 
     - **Price Rule:** (Flavor Price / 2) + Fixed Fee ($5.00). 
 
 ### B. Order Structure 
 - **Order Item:** Can be a Product (drink) or a Pizza. 
 - **Pizza Item:** Must support multiple flavors (Pivot table `order_item_flavors`). 
 
 ## 3. Database Schema (Planned) 
 - `pizza_sizes`: id, name, slices, max_flavors, is_special_broto_rule 
 - `pizza_flavors`: id, name, base_price (price for a whole pizza) 
 - `products`: id, name, price, category 
 - `orders`: id, table_id, status, type (delivery/salon), total_amount 
 - `order_items`: id, order_id, pizza_size_id, product_id, subtotal 
 - `order_item_flavors`: id, order_item_id, pizza_flavor_id, fraction (e.g., "1/2") 
