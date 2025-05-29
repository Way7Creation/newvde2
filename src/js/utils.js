import { productService } from './services/ProductService.js';

export function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : 'toast-success'} show`;
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

export async function fetchProducts() {
    showLoadingIndicator();
    
    try {
        const params = {
            q: window.appliedFilters.search || '',
            page: window.currentPage || 1,
            limit: window.itemsPerPage || 20,
            sort: window.sortColumn || 'name',
            city_id: document.getElementById('citySelect')?.value || '1'
        };
        
        // Добавляем фильтры как отдельные параметры
        Object.entries(window.appliedFilters).forEach(([key, value]) => {
            if (key !== 'search' && value) {
                params[key] = value;
            }
        });
        
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`/api/search?${queryString}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            window.productsData = result.data.products;
            window.totalProducts = result.data.total;
            window.renderProductsTable();
            updatePaginationInfo();
            
            if (window.productsData.length > 0) {
                const ids = window.productsData.map(p => p.product_id);
                window.loadAvailability(ids);
            }
        } else {
            throw new Error(result.error || 'Ошибка загрузки');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Ошибка загрузки товаров', true);
        window.productsData = [];
        window.totalProducts = 0;
        window.renderProductsTable();
    } finally {
        hideLoadingIndicator();
    }
}

function getSortParam() {
    const column = window.sortColumn || 'name';
    const direction = window.sortDirection || 'asc';
    
    // Преобразуем в формат API
    if (column === 'base_price') {
        return direction === 'asc' ? 'price_asc' : 'price_desc';
    }
    
    return column === 'name' ? 'name' : 'relevance';
}

function updatePaginationInfo() {
    const totalPages = Math.ceil(window.totalProducts / window.itemsPerPage);
    
    // Обновляем все элементы пагинации
    document.querySelectorAll('#currentPage, #currentPageBottom').forEach(el => {
        el.textContent = window.currentPage;
    });
    
    document.querySelectorAll('#totalPages, #totalPagesBottom').forEach(el => {
        el.textContent = totalPages;
    });
    
    document.querySelectorAll('#totalProductsText, #totalProductsTextBottom').forEach(el => {
        el.textContent = `Найдено товаров: ${window.totalProducts}`;
    });
}

export function showLoadingIndicator() {
    const existing = document.querySelector('.loading-indicator');
    if (existing) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="spinner-border spinner-border-sm"></div>
        <span>Загрузка...</span>
    `;
    document.body.appendChild(indicator);
}

export function hideLoadingIndicator() {
    const indicator = document.querySelector('.loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}