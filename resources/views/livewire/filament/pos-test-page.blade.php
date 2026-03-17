<div>
    @if(!$activeRegister)
        <h1>Caixa Fechado</h1>
    @else
        <h1>Caixa Aberto</h1>
    @endif

    <div>
        @foreach($cart as $item)
            <span>{{ $item['name'] }}</span>
        @endforeach
    </div>
</div>
