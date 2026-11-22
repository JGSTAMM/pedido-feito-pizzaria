<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Models\Product;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationLabel = 'Produtos';

    protected static ?string $modelLabel = 'Produto';

    protected static ?string $pluralModelLabel = 'Produtos';

    // ------------------------------------------------------------------
    //  FORM
    // ------------------------------------------------------------------

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Informações do Produto')->columnSpanFull()->schema([
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
            Section::make('Disponibilidade por Canal')
                ->columnSpanFull()
                ->description('Controle se o produto aparece no Delivery e/ou no Salão (PDV) independentemente.')
                ->schema([
                    Grid::make(2)->columnSpanFull()->schema([
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
            Section::make('Variações do Produto')
                ->columnSpanFull()
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
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
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
