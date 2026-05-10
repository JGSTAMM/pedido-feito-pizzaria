<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Models\Product;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationLabel = 'Produtos';

    protected static ?string $modelLabel = 'Produto';

    protected static ?string $pluralModelLabel = 'Produtos';

    // ------------------------------------------------------------------
    //  FORM
    // ------------------------------------------------------------------

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Informações do Produto')->schema([
                Forms\Components\TextInput::make('name')
                    ->label('Nome')
                    ->required()
                    ->maxLength(255),

                Forms\Components\TextInput::make('price')
                    ->label('Preço (R$)')
                    ->numeric()
                    ->prefix('R$')
                    ->required(),

                Forms\Components\Select::make('category')
                    ->label('Categoria')
                    ->options([
                        'bebidas'   => 'Bebidas',
                        'lanches'   => 'Lanches',
                        'sobremesas' => 'Sobremesas',
                        'outros'    => 'Outros',
                    ])
                    ->searchable(),

                Forms\Components\FileUpload::make('image')
                    ->label('Imagem')
                    ->image()
                    ->directory('products')
                    ->disk('public'),

                Forms\Components\Toggle::make('show_on_digital_menu')
                    ->label('Exibir no Cardápio Digital')
                    ->default(true)
                    ->columnSpanFull(),
            ])->columns(2),

            // ----------------------------------------------------------
            //  CHANNEL VISIBILITY (Phase 1)
            // ----------------------------------------------------------
            Forms\Components\Section::make('Disponibilidade por Canal')
                ->description('Controle se o produto aparece no Delivery e/ou no Salão (PDV) independentemente.')
                ->schema([
                    Forms\Components\Grid::make(2)->schema([
                        Forms\Components\Toggle::make('is_active_delivery')
                            ->label('Ativo no Delivery')
                            ->helperText('Desative para esconder do app de delivery.')
                            ->default(true),

                        Forms\Components\Toggle::make('is_active_pos')
                            ->label('Ativo no Salão / PDV')
                            ->helperText('Desative para itens indisponíveis no balcão.')
                            ->default(true),
                    ]),
                ]),

            // ----------------------------------------------------------
            //  PRODUCT VARIATIONS (Phase 1)
            // ----------------------------------------------------------
            Forms\Components\Section::make('Variações do Produto')
                ->description('Adicione variações (ex: Coca-Cola Zero, Coca-Cola Original) para evitar cadastrar produtos duplicados.')
                ->collapsed()
                ->schema([
                    Forms\Components\Repeater::make('variations')
                        ->label('Variações')
                        ->schema([
                            Forms\Components\TextInput::make('name')
                                ->label('Nome da variação')
                                ->placeholder('Ex: Coca-Cola Zero 350ml')
                                ->required()
                                ->maxLength(100),

                            Forms\Components\Toggle::make('is_active')
                                ->label('Disponível')
                                ->default(true),
                        ])
                        ->columns(2)
                        ->defaultItems(0)
                        ->addActionLabel('+ Adicionar variação')
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
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('category')
                    ->label('Categoria')
                    ->badge(),

                Tables\Columns\TextColumn::make('price')
                    ->label('Preço')
                    ->money('BRL')
                    ->sortable(),

                Tables\Columns\IconColumn::make('is_active_delivery')
                    ->label('Delivery')
                    ->boolean(),

                Tables\Columns\IconColumn::make('is_active_pos')
                    ->label('Salão / PDV')
                    ->boolean(),

                Tables\Columns\IconColumn::make('show_on_digital_menu')
                    ->label('Cardápio Digital')
                    ->boolean(),
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
            'index'  => Pages\ListProducts::route('/'),
            'create' => Pages\CreateProduct::route('/create'),
            'edit'   => Pages\EditProduct::route('/{record}/edit'),
        ];
    }
}
