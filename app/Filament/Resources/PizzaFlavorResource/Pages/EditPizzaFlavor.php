<?php

namespace App\Filament\Resources\PizzaFlavorResource\Pages;

use App\Filament\Resources\PizzaFlavorResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditPizzaFlavor extends EditRecord
{
    protected static string $resource = PizzaFlavorResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
