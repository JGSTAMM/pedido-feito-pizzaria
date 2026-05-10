<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PizzaFlavorResource\Pages;
use App\Models\PizzaFlavor;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PizzaFlavorResource extends Resource
{
    protected static ?string $model = PizzaFlavor::class;

    protected static ?string $navigationIcon = 'heroicon-o-fire';

    protected static ?string $navigationLabel = 'Sabores de Pizza';

    protected static ?string $modelLabel = 'Sabor';

    protected static ?string $pluralModelLabel = 'Sabores de Pizza';

    // ------------------------------------------------------------------
    //  FORM
    // ------------------------------------------------------------------

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Informações do Sabor')->schema([
                Forms\Components\TextInput::make('name')
                    ->label('Nome do Sabor')
                    ->required()
                    ->maxLength(255),

                Forms\Components\Textarea::make('description')
                    ->label('Descrição curta')
                    ->rows(2)
                    ->maxLength(500),

                Forms\Components\Select::make('flavor_category')
                    ->label('Categoria')
                    ->options([
                        'tradicional'  => 'Tradicional',
                        'especial'     => 'Especial',
                        'doce'         => 'Doce',
                        'vegetariana'  => 'Vegetariana',
                    ])
                    ->searchable(),

                Forms\Components\TextInput::make('base_price')
                    ->label('Preço Base (R$)')
                    ->numeric()
                    ->prefix('R$'),

                Forms\Components\FileUpload::make('image')
                    ->label('Imagem')
                    ->image()
                    ->directory('pizza-flavors')
                    ->disk('public'),

                Forms\Components\Toggle::make('is_active')
                    ->label('Disponível no Cardápio')
                    ->default(true),

                Forms\Components\Toggle::make('show_on_digital_menu')
                    ->label('Exibir no Cardápio Digital')
                    ->default(true),
            ])->columns(2),

            // ------------------------------------------------------------------
            //  INGREDIENT STOCK MANAGER (Phase 1)
            // ------------------------------------------------------------------
            Forms\Components\Section::make('Ingredientes')
                ->description('Gerencie os ingredientes deste sabor. Desative um ingrediente em falta sem apagá-lo da receita.')
                ->schema([
                    // Legacy plain-text field (read-only reference during Phase 1 transition)
                    Forms\Components\Textarea::make('ingredients')
                        ->label('Ingredientes (legado — texto livre)')
                        ->helperText('Campo antigo mantido durante a migração. Preencha a lista estruturada abaixo.')
                        ->rows(2)
                        ->disabled()
                        ->dehydrated(false)
                        ->hidden(fn ($record) => $record === null || empty($record->ingredients)),

                    // New structured ingredient list
                    Forms\Components\Repeater::make('ingredients_json')
                        ->label('Lista de Ingredientes')
                        ->schema([
                            Forms\Components\TextInput::make('name')
                                ->label('Ingrediente')
                                ->placeholder('Ex: Rúcula')
                                ->required()
                                ->maxLength(80),

                            Forms\Components\Toggle::make('is_in_stock')
                                ->label('Em Estoque')
                                ->helperText('Desative quando o ingrediente estiver em falta.')
                                ->default(true),
                        ])
                        ->columns(2)
                        ->defaultItems(0)
                        ->addActionLabel('+ Adicionar ingrediente')
                        ->reorderable()
                        ->collapsible(),
                ]),
        ]);
    }

    // ------------------------------------------------------------------
    //  TABLE
    // ------------------------------------------------------------------

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image')
                    ->label('Foto')
                    ->disk('public')
                    ->circular(),

                Tables\Columns\TextColumn::make('name')
                    ->label('Sabor')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('flavor_category')
                    ->label('Categoria')
                    ->badge(),

                Tables\Columns\TextColumn::make('base_price')
                    ->label('Preço Base')
                    ->money('BRL')
                    ->sortable(),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Disponível')
                    ->boolean(),

                Tables\Columns\TextColumn::make('ingredients_json')
                    ->label('Ingredientes')
                    ->formatStateUsing(function ($state) {
                        if (empty($state)) {
                            return '—';
                        }
                        $inStock = collect($state)->where('is_in_stock', true)->count();
                        $total   = count($state);
                        return "{$inStock}/{$total} disponíveis";
                    }),
            ])
            ->filters([])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    // ------------------------------------------------------------------
    //  PAGES
    // ------------------------------------------------------------------

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListPizzaFlavors::route('/'),
            'create' => Pages\CreatePizzaFlavor::route('/create'),
            'edit'   => Pages\EditPizzaFlavor::route('/{record}/edit'),
        ];
    }
}
