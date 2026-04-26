<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Customer;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\MassAssignmentException;

class MassAssignmentTest extends TestCase
{
    public function test_customer_model_prevents_mass_assignment_of_is_admin()
    {
        $customer = new Customer();
        $customer->fill([
            'name' => 'John Doe',
            'is_admin' => true,
        ]);

        $this->assertEquals('John Doe', $customer->name);
        $this->assertNull($customer->is_admin);
    }

    public function test_order_item_model_prevents_mass_assignment_of_fake_discount()
    {
        $orderItem = new OrderItem();
        $orderItem->fill([
            'quantity' => 2,
            'fake_discount' => 100,
        ]);

        $this->assertEquals(2, $orderItem->quantity);
        $this->assertNull($orderItem->fake_discount);
    }
}
