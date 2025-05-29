import { showToast } from './utils.js';
import { productService } from './services/ProductService.js';

/**
 * Модуль поиска товаров
 * Централизованная работа с поисковыми запросами
 */
export class SearchModule {
    constructor() {
        this.searchEndpoint = '/api/search';
        this.minQueryLength = 2;
        this.searchDelay = 300;
        this.searchTimeout = null;
    }

    /**
     * Выполнить поиск с заданными параметрами
     */
    async search(params = {}) {
        const searchParams = this.buildSearchParams(params);
        
        try {
            const response = await fetch(`${this.searchEndpoint}?${searchParams}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                signal: this.createAbortSignal()
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                return {
                    products: data.data.products || [],
                    total: data.data.total || 0,
                    aggregations: data.data.aggregations || {}
                };
            }
            
            throw new Error(data.error || 'Unknown error');
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search cancelled');
                return null;
            }
            
            console.error('Search error:', error);
            showToast('Ошибка поиска', true);
            return { products: [], total: 0 };
        }
    }

    /**
     * Поиск с дебаунсом для поисковой строки
     */
    searchWithDebounce(query, callback) {
        clearTimeout(this.searchTimeout);
        
        if (!query || query.length < this.minQueryLength) {
            callback({ products: [], total: 0 });
            return;
        }
        
        this.searchTimeout = setTimeout(async () => {
            const result = await this.search({ q: query });
            if (result) callback(result);
        }, this.searchDelay);
    }

    /**
     * Построение параметров поиска
     */
    buildSearchParams(params) {
        const defaults = {
            page: 1,
            limit: 20,
            sort: 'relevance',
            city_id: this.getCurrentCityId()
        };
        
        const merged = { ...defaults, ...params };
        
        // Фильтрация пустых значений
        Object.keys(merged).forEach(key => {
            if (merged[key] === null || merged[key] === undefined || merged[key] === '') {
                delete merged[key];
            }
        });
        
        return new URLSearchParams(merged);
    }

    /**
     * Создание сигнала отмены для fetch
     */
    createAbortSignal() {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        return this.abortController.signal;
    }

    /**
     * Получить текущий город
     */
    getCurrentCityId() {
        return document.getElementById('citySelect')?.value || '1';
    }

    /**
     * Отменить текущий поиск
     */
    cancelSearch() {
        if (this.abortController) {
            this.abortController.abort();
        }
        clearTimeout(this.searchTimeout);
    }
}

// Создаем экземпляр для использования
export const searchModule = new SearchModule();

// Обратная совместимость с OpenSearch функциями
export async function fetchFromOpenSearch(options) {
    console.warn('fetchFromOpenSearch deprecated, use searchModule.search()');
    
    if (Array.isArray(options.ids)) {
        // Поиск по ID через ProductService
        return productService.getProductsByIds(options.ids);
    }
    
    // Обычный поиск
    const result = await searchModule.search({
        q: options.filters?.search || '',
        page: options.page,
        limit: options.itemsPerPage,
        sort: options.sortColumn,
        ...options.filters
    });
    
    return {
        products: result?.products || [],
        totalProducts: result?.total || 0
    };
}