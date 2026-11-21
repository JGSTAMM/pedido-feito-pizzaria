@php
    $isPublicMenu = request()->is('/') || request()->is('menu*');
    $intendedUrl = (string) session('url.intended', '');
    $isWaiterApp = request()->is('waiter*')
        || (request()->is('login') && (request()->query('app') === 'waiter' || str_contains($intendedUrl, '/waiter')));
    $manifestHref = $isWaiterApp
        ? '/manifest-waiter.webmanifest?v=1'
        : ($isPublicMenu ? '/manifest.webmanifest?v=2' : '/manifest-staff.webmanifest?v=1');
    $themeColor = $isWaiterApp ? '#8B5CF6' : '#0D0D12';
    $appleTitle = $isWaiterApp ? 'Garçom' : ($isPublicMenu ? 'Lucchese Pizza' : 'Pedido Feito');
    $baseUrl = rtrim(config('app.url', 'https://sresralucchesepizzaria.pedidofeito.tech'), '/');
    $canonicalUrl = $baseUrl . (request()->getPathInfo() === '/' ? '/' : request()->getPathInfo());
    $seoTitle = 'Sr. e Sra. Lucchese Pizzaria | Cardápio Digital Torres';
    $seoDescription = 'Peça pizzas artesanais na Sr. e Sra. Lucchese Pizzaria em Torres-RS. Cardápio digital com PIX online, entrega rápida e retirada.';
    $ogCover = $baseUrl . '/images/og-cover.jpg';
    $ogSquare = $baseUrl . '/images/og-square.jpg';
@endphp
<!DOCTYPE html>
<html class="dark" lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />

    <title inertia>{{ $seoTitle }}</title>
    <meta name="description" content="{{ $seoDescription }}" />
    <meta name="author" content="Pixirica Tecnologias" />
    <meta name="creator" content="Pixirica Tecnologias" />
    <meta name="publisher" content="Pixirica Tecnologias" />
    <meta name="robots" content="{{ $isPublicMenu ? 'index, follow' : 'noindex, nofollow' }}" />

    @if ($isPublicMenu)
        <link rel="canonical" href="{{ $canonicalUrl }}" />
        <link rel="alternate" hreflang="pt-BR" href="{{ $canonicalUrl }}" />
        <link rel="alternate" hreflang="x-default" href="{{ $canonicalUrl }}" />

        {{-- Geo-SEO Local --}}
        <meta name="geo.region" content="BR-RS" />
        <meta name="geo.placename" content="Torres, Rio Grande do Sul, Brasil" />
        <meta name="geo.position" content="-29.3389;-49.7267" />
        <meta name="ICBM" content="-29.3389, -49.7267" />

        {{-- OpenGraph (WhatsApp / Instagram / Facebook / LinkedIn) --}}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Sr. & Sra. Lucchese Pizzaria" />
        <meta property="og:title" content="{{ $seoTitle }}" />
        <meta property="og:description" content="{{ $seoDescription }}" />
        <meta property="og:url" content="{{ $canonicalUrl }}" />
        <meta property="og:image" content="{{ $ogCover }}" />
        <meta property="og:image:secure_url" content="{{ $ogCover }}" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image" content="{{ $ogSquare }}" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="600" />

        {{-- Twitter Card --}}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="{{ $seoTitle }}" />
        <meta name="twitter:description" content="{{ $seoDescription }}" />
        <meta name="twitter:image" content="{{ $ogCover }}" />
    @endif

    {{-- Favicons & PWA Manifest --}}
    <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
    <link rel="icon" href="/icon.png?v=2" type="image/png" />
    <link rel="shortcut icon" href="/favicon.ico?v=2" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
    <link rel="manifest" href="{{ $manifestHref }}" />
    <meta name="theme-color" content="{{ $themeColor }}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="{{ $appleTitle }}" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    {{-- Google Fonts: Work Sans --}}
    <link href="https://fonts.googleapis.com" rel="preconnect" />
    <link crossorigin href="https://fonts.gstatic.com" rel="preconnect" />
    <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

    {{-- Material Symbols Outlined Icons --}}
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

    @if ($isPublicMenu)
        <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'Organization',
                    '@id' => $baseUrl . '/#organization',
                    'name' => 'Sr. & Sra. Lucchese Pizzaria',
                    'url' => $baseUrl . '/',
                    'logo' => $baseUrl . '/icon.png',
                    'contactPoint' => [
                        '@type' => 'ContactPoint',
                        'telephone' => '+55-51-99700-4459',
                        'contactType' => 'customer service',
                        'areaServed' => 'BR',
                        'availableLanguage' => ['Portuguese', 'English', 'Spanish'],
                    ],
                    'address' => [
                        '@type' => 'PostalAddress',
                        'streetAddress' => 'Rua Edmundo Ferreira Porto, 2004, Itapeva',
                        'addressLocality' => 'Torres',
                        'addressRegion' => 'RS',
                        'addressCountry' => 'BR',
                    ],
                    'creator' => ['@type' => 'Organization', 'name' => 'Pixirica Tecnologias'],
                    'publisher' => ['@type' => 'Organization', 'name' => 'Pixirica Tecnologias'],
                ],
                [
                    '@type' => 'WebSite',
                    '@id' => $baseUrl . '/#website',
                    'url' => $baseUrl . '/',
                    'name' => 'Sr. & Sra. Lucchese Pizzaria — Cardápio Digital',
                    'publisher' => ['@type' => 'Organization', 'name' => 'Pixirica Tecnologias'],
                    'creator' => ['@type' => 'Organization', 'name' => 'Pixirica Tecnologias'],
                ],
                [
                    '@type' => 'Restaurant',
                    '@id' => $baseUrl . '/#restaurant',
                    'name' => 'Sr. & Sra. Lucchese Pizzaria',
                    'url' => $baseUrl . '/',
                    'image' => $ogCover,
                    'servesCuisine' => 'Pizza',
                    'priceRange' => '$$',
                    'telephone' => '+55-51-99700-4459',
                    'address' => [
                        '@type' => 'PostalAddress',
                        'streetAddress' => 'Rua Edmundo Ferreira Porto, 2004, Itapeva',
                        'addressLocality' => 'Torres',
                        'addressRegion' => 'RS',
                        'addressCountry' => 'BR',
                    ],
                    'geo' => [
                        '@type' => 'GeoCoordinates',
                        'latitude' => -29.3389,
                        'longitude' => -49.7267,
                    ],
                    'areaServed' => 'Torres, RS e região',
                    'hasMenu' => $baseUrl . '/',
                ],
                [
                    '@type' => 'FAQPage',
                    '@id' => $baseUrl . '/#faq',
                    'mainEntity' => [
                        [
                            '@type' => 'Question',
                            'name' => 'Como montar uma pizza com múltiplos sabores no cardápio digital?',
                            'acceptedAnswer' => [
                                '@type' => 'Answer',
                                'text' => 'Selecione a opção de montar pizza, escolha o tamanho Grande (até 3 sabores) ou Broto (1 sabor), personalize os ingredientes por fração e adicione borda recheada opcional.',
                            ],
                        ],
                        [
                            '@type' => 'Question',
                            'name' => 'Quais formas de pagamento estão disponíveis no pedido online?',
                            'acceptedAnswer' => [
                                '@type' => 'Answer',
                                'text' => 'Aceitamos PIX dinâmico online com confirmação automática, cartão de crédito e opções presenciais na entrega ou retirada conforme configuração da loja.',
                            ],
                        ],
                        [
                            '@type' => 'Question',
                            'name' => 'Como acompanhar o status do pedido após finalizar?',
                            'acceptedAnswer' => [
                                '@type' => 'Answer',
                                'text' => 'Após confirmar o pedido, você acompanha em tempo real as etapas de recebimento, preparo na cozinha e entrega diretamente pela página de pedidos.',
                            ],
                        ],
                    ],
                ],
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>
    @endif

    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
</head>
<body style="background:#191022;">
    @inertia
    @if ($isPublicMenu)
        <noscript>
            <section aria-label="Informações da Pizzaria">
                <h2>Sr. &amp; Sra. Lucchese Pizzaria — Cardápio Digital em Torres-RS</h2>
                <p>Peça pizzas artesanais, bebidas e porções online com pagamento via PIX, cartão ou na entrega. Atendimento em Torres - RS (Itapeva e bairros da região).</p>
                <ul>
                    <li>Montador de pizzas com até 3 sabores e personalização por metade.</li>
                    <li>Delivery por bairro, retirada no balcão e consumo na mesa.</li>
                    <li>Acompanhamento de preparo em tempo real.</li>
                </ul>
                <table>
                    <thead>
                        <tr><th>Tamanho</th><th>Fatias</th><th>Sabores</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Broto</td><td>6 fatias</td><td>1 sabor</td></tr>
                        <tr><td>Grande</td><td>12 fatias</td><td>Até 3 sabores</td></tr>
                    </tbody>
                </table>
                <p>Desenvolvido por Pixirica Tecnologias.</p>
            </section>
        </noscript>
    @endif
</body>
</html>
