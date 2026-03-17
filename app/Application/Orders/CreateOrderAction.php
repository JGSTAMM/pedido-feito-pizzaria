<?php

namespace App\Application\Orders;

use App\Models\CashRegister;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Table;
use App\Models\User;
use App\Services\PizzaPriceService;
use App\Services\PrintService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class CreateOrderAction
{
    public function __construct(private readonly PizzaPriceService $priceService)
    {
    }

    public function execute(array $validated, User $user): Order
    {
        if (!CashRegister::where('status', 'open')->exists()) {
            throw new OrderActionException('order.create.cash_register_closed', 403);
        }

        DB::beginTransaction();

        try {
            $order = Order::create([
                'table_id' => $validated['table_id'],
                'user_id' => $user->id,
                'status' => 'preparing',
                'type' => 'salon',
                'total_amount' => 0,
            ]);

            Table::where('id', $validated['table_id'])->update(['status' => 'occupied']);

            $totalAmount = 0;

            foreach ($validated['items'] as $item) {
                $notes = $item['notes'] ?? null;

                if ($item['type'] === 'pizza') {
                    $sizeId = $item['size_id'];
                    $flavorIds = $item['flavor_ids'];

                    $price = $this->priceService->calculateItemPrice($sizeId, $flavorIds);

                    $orderItem = OrderItem::create([
                        'order_id' => $order->id,
                        'pizza_size_id' => $sizeId,
                        'quantity' => 1,
                        'unit_price' => $price,
                        'subtotal' => $price,
                        'type' => 'pizza',
                        'notes' => $notes,
                    ]);

                    $fraction = '1/' . count($flavorIds);
                    $attachData = [];

                    foreach ($flavorIds as $flavorId) {
                        $attachData[$flavorId] = [
                            'id' => Str::uuid()->toString(),
                            'fraction' => $fraction,
                        ];
                    }

                    $orderItem->flavors()->attach($attachData);
                    $totalAmount += $price;
                    continue;
                }

                $product = Product::findOrFail($item['product_id']);
                $quantity = (int) $item['quantity'];
                $price = (float) $product->price * $quantity;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $product->price,
                    'subtotal' => $price,
                    'type' => 'product',
                    'notes' => $notes,
                ]);

                $totalAmount += $price;
            }

            $order->update(['total_amount' => $totalAmount]);
            DB::commit();

            if (config('printing.auto_print_kitchen')) {
                app(PrintService::class)->printKitchenTicket($order);
            }

            return $order;
        } catch (Throwable $exception) {
            DB::rollBack();

            if ($exception instanceof OrderActionException) {
                throw $exception;
            }

            throw new OrderActionException('order.create.error', 500, [], $exception);
        }
    }
}
