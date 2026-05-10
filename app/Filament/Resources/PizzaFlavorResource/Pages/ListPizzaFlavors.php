<?php

namespace App\Filament\Resources\PizzaFlavorResource\Pages;

use App\Filament\Resources\PizzaFlavorResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListPizzaFlavors extends ListRecords
{
    protected static string $resource = PizzaFlavorResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
