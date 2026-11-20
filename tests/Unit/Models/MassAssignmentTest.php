<?php

namespace Tests\Unit\Models;

use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\User;
use Tests\TestCase;

class MassAssignmentTest extends TestCase
{
    public function test_customer_model_prevents_mass_assignment_of_is_admin()
    {
        $customer = new Customer;
        $customer->fill([
            'name' => 'John Doe',
            'is_admin' => true,
        ]);

        $this->assertEquals('John Doe', $customer->name);
        $this->assertNull($customer->is_admin);
    }

    public function test_order_item_model_prevents_mass_assignment_of_fake_discount()
    {
        $orderItem = new OrderItem;
        $orderItem->fill([
            'quantity' => 2,
            'fake_discount' => 100,
        ]);

        $this->assertEquals(2, $orderItem->quantity);
        $this->assertNull($orderItem->fake_discount);
    }

    public function test_user_model_prevents_mass_assignment_and_hides_pin_hash()
    {
        $user = new User;
        $user->fill([
            'name' => 'Supervisor',
            'pin_hash' => 'leaked-or-injected',
        ]);

        $this->assertEquals('Supervisor', $user->name);
        $this->assertNull($user->pin_hash);

        $user->pin_hash = 'hashed-pin-secret';
        $serialized = $user->toArray();

        $this->assertArrayNotHasKey('pin_hash', $serialized);
    }
}
