<?php
namespace App\Controllers;

use App\Core\Database;
use App\Services\SearchService;
use App\Services\DynamicProductDataService;
use App\Services\AuthService;

class ApiController extends BaseController
{
    /**
     * GET /api/availability
     */
    public function availabilityAction(): void
    {
        $validated = $this->validate($this->getInput(), [
            'city_id' => 'required|integer|min:1',
            'product_ids' => 'required|string|max:10000'
        ]);
        
        $productIds = array_map('intval', explode(',', $validated['product_ids']));
        $cityId = $validated['city_id'];
        
        $dynamicService = new DynamicProductDataService();
        $userId = AuthService::check() ? AuthService::user()['id'] : null;
        
        $data = $dynamicService->getProductsDynamicData($productIds, $cityId, $userId);
        
        $this->success($data);
    }
    
    /**
     * GET /api/search
     */
    public function searchAction(): void
    {
        $params = $this->validate($this->getInput(), [
            'q' => 'string|max:500',
            'page' => 'integer|min:1|max:1000',
            'limit' => 'integer|min:1|max:100',
            'city_id' => 'integer|min:1',
            'sort' => 'string|in:relevance,name,price_asc,price_desc'
        ]);
        
        $result = SearchService::search($params);
        $this->success($result);
    }
    
    /**
     * GET /api/autocomplete
     */
    public function autocompleteAction(): void
    {
        $validated = $this->validate($this->getInput(), [
            'q' => 'required|string|min:2|max:100'
        ]);
        
        $suggestions = SearchService::autocomplete($validated['q']);
        $this->success(['suggestions' => $suggestions]);
    }
}