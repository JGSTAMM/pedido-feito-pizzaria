<?php

namespace App\Filament\Resources\PizzaFlavorResource\Pages;

use App\Filament\Resources\PizzaFlavorResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePizzaFlavor extends CreateRecord
{
    protected static string $resource = PizzaFlavorResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
