<?php

namespace App\Http\Controllers\Api;

use App\Application\DigitalMenu\GetDigitalCatalogAction;
use App\Http\Controllers\Controller;

class DigitalMenuController extends Controller
{
    public function __construct(private readonly GetDigitalCatalogAction $getDigitalCatalogAction)
    {
    }

    /**
     * Retorna todos os dados para o cardápio digital.
     * Endpoint PÚBLICO (sem autenticação).
     * 
     * GET /api/digital-menu
     */
    public function index()
    {
        return response()->json($this->getDigitalCatalogAction->execute());
    }
}
