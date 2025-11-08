/**
 * Автокомплит для полей города погрузки и выгрузки
 */

class CityAutocomplete {
    constructor(inputId, suggestionsId, options = {}) {
        this.input = document.getElementById(inputId);
        this.suggestionsContainer = document.getElementById(suggestionsId);
        this.selectedIndex = -1;
        this.suggestions = [];
        this.debounceTimer = null;
        this.debounceDelay = options.debounceDelay || 300;
        
        // API endpoints (заглушки - замените на реальные URL)
        this.apiUrl = options.apiUrl || '/api/cities/search';
        this.submitUrl = options.submitUrl || '/api/calculator/submit';
        
        this.init();
    }
    
    init() {
        if (!this.input || !this.suggestionsContainer) {
            console.error('Autocomplete: элементы не найдены');
            return;
        }
        
        // Обработчики событий
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.input.addEventListener('focus', (e) => this.handleFocus(e));
        
        // Закрытие при клике вне элемента
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }
    
    handleInput(e) {
        const query = e.target.value.trim();
        
        // Очистка предыдущего таймера
        clearTimeout(this.debounceTimer);
        
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }
        
        // Debounce для уменьшения количества запросов
        this.debounceTimer = setTimeout(() => {
            this.fetchSuggestions(query);
        }, this.debounceDelay);
    }
    
    handleKeydown(e) {
        if (!this.suggestionsContainer.classList.contains('active')) {
            return;
        }
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectPrevious();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectSuggestion(this.suggestions[this.selectedIndex]);
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }
    
    handleFocus(e) {
        const query = e.target.value.trim();
        if (query.length >= 2 && this.suggestions.length > 0) {
            this.showSuggestions();
        }
    }
    
    async fetchSuggestions(query) {
        try {
            this.showLoading();
            
            // ЗАГЛУШКА: Временные данные для демонстрации
            // Замените этот блок на реальный API запрос
            const mockData = await this.getMockCities(query);
            
            /* Пример реального API запроса:
            const response = await fetch(`${this.apiUrl}?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при получении данных');
            }
            
            const data = await response.json();
            this.suggestions = data.cities || [];
            */
            
            this.suggestions = mockData;
            this.displaySuggestions();
            
        } catch (error) {
            console.error('Ошибка автокомплита:', error);
            this.showError();
        } finally {
            this.hideLoading();
        }
    }
    
    // ЗАГЛУШКА: Временные данные
    async getMockCities(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const cities = [
                    { id: 1, name: 'Москва', region: 'Московская область' },
                    { id: 2, name: 'Санкт-Петербург', region: 'Ленинградская область' },
                    { id: 3, name: 'Новосибирск', region: 'Новосибирская область' },
                    { id: 4, name: 'Екатеринбург', region: 'Свердловская область' },
                    { id: 5, name: 'Казань', region: 'Республика Татарстан' },
                    { id: 6, name: 'Нижний Новгород', region: 'Нижегородская область' },
                    { id: 7, name: 'Челябинск', region: 'Челябинская область' },
                    { id: 8, name: 'Самара', region: 'Самарская область' },
                    { id: 9, name: 'Омск', region: 'Омская область' },
                    { id: 10, name: 'Ростов-на-Дону', region: 'Ростовская область' },
                ];
                
                const filtered = cities.filter(city => 
                    city.name.toLowerCase().includes(query.toLowerCase()) ||
                    city.region.toLowerCase().includes(query.toLowerCase())
                );
                
                resolve(filtered);
            }, 500); // Имитация задержки сети
        });
    }
    
    displaySuggestions() {
        this.selectedIndex = -1;
        
        if (this.suggestions.length === 0) {
            this.suggestionsContainer.innerHTML = '<div class="autocomplete-no-results">Ничего не найдено</div>';
            this.showSuggestions();
            return;
        }
        
        const html = this.suggestions.map((city, index) => `
            <div class="autocomplete-suggestion" data-index="${index}">
                <div class="autocomplete-suggestion-city">${this.highlightMatch(city.name)}</div>
                <div class="autocomplete-suggestion-region">${city.region}</div>
            </div>
        `).join('');
        
        this.suggestionsContainer.innerHTML = html;
        
        // Добавляем обработчики кликов
        this.suggestionsContainer.querySelectorAll('.autocomplete-suggestion').forEach((elem, index) => {
            elem.addEventListener('click', () => {
                this.selectSuggestion(this.suggestions[index]);
            });
        });
        
        this.showSuggestions();
    }
    
    highlightMatch(text) {
        const query = this.input.value.trim();
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
    
    selectNext() {
        const suggestionElements = this.suggestionsContainer.querySelectorAll('.autocomplete-suggestion');
        if (suggestionElements.length === 0) return;
        
        if (this.selectedIndex < suggestionElements.length - 1) {
            this.selectedIndex++;
            this.updateSelection(suggestionElements);
        }
    }
    
    selectPrevious() {
        const suggestionElements = this.suggestionsContainer.querySelectorAll('.autocomplete-suggestion');
        if (suggestionElements.length === 0) return;
        
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.updateSelection(suggestionElements);
        }
    }
    
    updateSelection(elements) {
        elements.forEach((elem, index) => {
            if (index === this.selectedIndex) {
                elem.classList.add('selected');
                elem.scrollIntoView({ block: 'nearest' });
            } else {
                elem.classList.remove('selected');
            }
        });
    }
    
    selectSuggestion(city) {
        this.input.value = city.name;
        this.input.dataset.cityId = city.id;
        this.input.dataset.cityName = city.name;
        this.input.dataset.region = city.region;
        this.hideSuggestions();
        
        // Генерируем событие изменения
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    showSuggestions() {
        this.suggestionsContainer.classList.add('active');
    }
    
    hideSuggestions() {
        this.suggestionsContainer.classList.remove('active');
        this.selectedIndex = -1;
    }
    
    showLoading() {
        this.input.classList.add('loading');
        this.suggestionsContainer.innerHTML = '<div class="autocomplete-loading">Загрузка...</div>';
        this.showSuggestions();
    }
    
    hideLoading() {
        this.input.classList.remove('loading');
    }
    
    showError() {
        this.suggestionsContainer.innerHTML = '<div class="autocomplete-no-results">Ошибка загрузки данных</div>';
        this.showSuggestions();
    }
}

// Класс для управления формой калькулятора
class CalculatorForm {
    constructor() {
        this.form = document.getElementById('main_form-pre');
        this.submitButton = document.getElementById('show_hidden_form');
        this.submitUrl = '/api/calculator/submit'; // ЗАГЛУШКА - замените на реальный URL
        
        this.init();
    }
    
    init() {
        if (!this.form || !this.submitButton) {
            console.error('CalculatorForm: элементы формы не найдены');
            return;
        }
        
        this.submitButton.addEventListener('click', (e) => this.handleSubmit(e));
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = this.collectFormData();
        
        // Валидация
        if (!this.validateForm(formData)) {
            return;
        }
        
        try {
            await this.submitForm(formData);
        } catch (error) {
            console.error('Ошибка отправки формы:', error);
            alert('Произошла ошибка при отправке формы. Попробуйте позже.');
        }
    }
    
    collectFormData() {
        const fromInput = document.getElementById('form_value-from');
        const toInput = document.getElementById('form_value-to');
        const weightInput = document.getElementById('form_value-weight');
        const massaInput = document.getElementById('form_value-massa');
        
        return {
            city_from_id: fromInput.dataset.cityId || null,
            city_from: fromInput.value,
            city_from_region: fromInput.dataset.region || null,
            city_to_id: toInput.dataset.cityId || null,
            city_to: toInput.value,
            city_to_region: toInput.dataset.region || null,
            volume: weightInput.value,
            weight: massaInput.value,
            timestamp: new Date().toISOString()
        };
    }
    
    validateForm(data) {
        const errors = [];
        
        if (!data.city_from || data.city_from.trim() === '') {
            errors.push('Укажите город отправления');
        }
        
        if (!data.city_to || data.city_to.trim() === '') {
            errors.push('Укажите город назначения');
        }
        
        if (!data.volume && !data.weight) {
            errors.push('Укажите объём или массу груза');
        }
        
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return false;
        }
        
        return true;
    }
    
    async submitForm(data) {
        console.log('Отправка данных:', data);
        
        // ЗАГЛУШКА: Имитация отправки на сервер
        // Замените этот блок на реальный API запрос
        
        /* Пример реального API запроса:
        const response = await fetch(this.submitUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при отправке данных');
        }
        
        const result = await response.json();
        console.log('Результат:', result);
        
        // Показываем результат пользователю
        this.displayResult(result);
        */
        
        // Временная заглушка
        setTimeout(() => {
            alert('Форма отправлена!\n\nДанные:\n' + JSON.stringify(data, null, 2));
            // Здесь можно показать скрытую форму или результаты расчёта
            // document.getElementById('main_form').style.display = 'block';
        }, 500);
    }
    
    displayResult(result) {
        // Здесь можно отобразить результат расчёта
        console.log('Результат расчёта:', result);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация автокомплита для поля "Откуда"
    const autocompleteFrom = new CityAutocomplete('form_value-from', 'suggestions-from', {
        apiUrl: '/api/cities/search', // Замените на реальный URL
        debounceDelay: 300
    });
    
    // Инициализация автокомплита для поля "Куда"
    const autocompleteTo = new CityAutocomplete('form_value-to', 'suggestions-to', {
        apiUrl: '/api/cities/search', // Замените на реальный URL
        debounceDelay: 300
    });
    
    // Инициализация формы калькулятора
    const calculatorForm = new CalculatorForm();
    
    console.log('Автокомплит и форма калькулятора инициализированы');
});
