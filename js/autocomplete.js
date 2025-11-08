// Автокомплит для формы калькулятора
(function() {
    'use strict';

    // ============================================
    // КОНФИГУРАЦИЯ API
    // ============================================
    const CONFIG = {
        // API endpoint для получения городов
        // TODO: Заменить на реальный адрес вашего API
        API_URL: '/api/cities', // Например: 'https://your-domain.ru/api/cities'
        
        // Метод запроса
        API_METHOD: 'GET',
        
        // Использовать ли API (true) или локальные данные (false)
        USE_API: false,
        
        // Минимальное количество символов для поиска
        MIN_SEARCH_LENGTH: 1,
        
        // Максимальное количество результатов
        MAX_RESULTS: 10,
        
        // Задержка перед отправкой запроса (debounce, мс)
        SEARCH_DELAY: 300,
        
        // Таймаут запроса к API (мс)
        REQUEST_TIMEOUT: 5000,
        
        // Параметр запроса для поискового текста
        SEARCH_PARAM: 'query'
    };

    // Локальные данные городов (используются если USE_API = false)
    const LOCAL_CITIES = [
        'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
        'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
        'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград',
        'Краснодар', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск',
        'Барнаул', 'Ульяновск', 'Иркутск', 'Хабаровск', 'Ярославль',
        'Владивосток', 'Махачкала', 'Томск', 'Оренбург', 'Кемерово',
        'Новокузнецк', 'Рязань', 'Астрахань', 'Набережные Челны', 'Пенза',
        'Липецк', 'Киров', 'Чебоксары', 'Калининград', 'Тула',
        'Курск', 'Ставрополь', 'Сочи', 'Улан-Удэ', 'Тверь',
        'Магнитогорск', 'Иваново', 'Брянск', 'Белгород', 'Сургут',
        'Владимир', 'Архангельск', 'Чита', 'Калуга', 'Смоленск',
        'Волжский', 'Курган', 'Череповец', 'Орёл', 'Вологда',
        'Владикавказ', 'Мурманск', 'Саранск', 'Якутск', 'Тамбов',
        'Грозный', 'Стерлитамак', 'Кострома', 'Петрозаводск', 'Нижневартовск'
    ];

    // Кеш для данных с сервера
    let citiesCache = null;
    let cacheTimestamp = null;
    const CACHE_LIFETIME = 3600000; // 1 час в миллисекундах

    // ============================================
    // API ФУНКЦИИ
    // ============================================
    
    /**
     * Получение городов с сервера
     * @param {string} searchText - Текст для поиска
     * @returns {Promise<Array>} - Массив городов
     */
    async function fetchCitiesFromAPI(searchText) {
        // Проверка кеша
        if (citiesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_LIFETIME)) {
            return filterCitiesFromArray(citiesCache, searchText);
        }

        try {
            // Формирование URL с параметрами
            const url = new URL(CONFIG.API_URL, window.location.origin);
            if (searchText) {
                url.searchParams.append(CONFIG.SEARCH_PARAM, searchText);
            }

            // Создание контроллера для таймаута
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

            // Выполнение запроса
            const response = await fetch(url.toString(), {
                method: CONFIG.API_METHOD,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Ожидаемые форматы ответа:
            // 1. Прямой массив: ["Москва", "Санкт-Петербург", ...]
            // 2. Объект с массивом: { cities: ["Москва", ...] }
            // 3. Массив объектов: [{ name: "Москва", id: 1 }, ...]
            
            let cities = [];
            
            if (Array.isArray(data)) {
                // Формат 1 или 3
                cities = data.map(item => {
                    if (typeof item === 'string') {
                        return item;
                    } else if (item.name) {
                        return item.name;
                    } else if (item.city) {
                        return item.city;
                    }
                    return String(item);
                });
            } else if (data.cities && Array.isArray(data.cities)) {
                // Формат 2
                cities = data.cities.map(item => {
                    if (typeof item === 'string') {
                        return item;
                    } else if (item.name) {
                        return item.name;
                    } else if (item.city) {
                        return item.city;
                    }
                    return String(item);
                });
            } else if (data.data && Array.isArray(data.data)) {
                // Альтернативный формат с data
                cities = data.data.map(item => {
                    if (typeof item === 'string') {
                        return item;
                    } else if (item.name) {
                        return item.name;
                    } else if (item.city) {
                        return item.city;
                    }
                    return String(item);
                });
            }

            // Сохранение в кеш
            citiesCache = cities;
            cacheTimestamp = Date.now();

            return cities.slice(0, CONFIG.MAX_RESULTS);

        } catch (error) {
            console.warn('Ошибка при получении городов с API:', error);
            console.log('Используются локальные данные');
            
            // Fallback на локальные данные
            return filterCitiesFromArray(LOCAL_CITIES, searchText);
        }
    }

    /**
     * Фильтрация городов из массива
     * @param {Array} citiesArray - Массив городов
     * @param {string} searchText - Текст для поиска
     * @returns {Array} - Отфильтрованный массив
     */
    function filterCitiesFromArray(citiesArray, searchText) {
        if (!searchText) {
            return citiesArray.slice(0, CONFIG.MAX_RESULTS);
        }
        
        const lowerSearch = searchText.toLowerCase();
        return citiesArray
            .filter(city => city.toLowerCase().includes(lowerSearch))
            .slice(0, CONFIG.MAX_RESULTS);
    }

    /**
     * Получение городов (универсальная функция)
     * @param {string} searchText - Текст для поиска
     * @returns {Promise<Array>} - Массив городов
     */
    async function getCities(searchText) {
        if (CONFIG.USE_API) {
            return await fetchCitiesFromAPI(searchText);
        } else {
            // Использование локальных данных
            return Promise.resolve(filterCitiesFromArray(LOCAL_CITIES, searchText));
        }
    }

    // ============================================
    // UI ФУНКЦИИ
    // ============================================
    
    /**
     * Debounce функция для оптимизации запросов
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    function createAutocompleteList(inputElement) {
        const list = document.createElement('div');
        list.className = 'autocomplete-list';
        list.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            max-height: 200px;
            overflow-y: auto;
            width: 100%;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: none;
        `;
        
        inputElement.parentElement.style.position = 'relative';
        inputElement.parentElement.appendChild(list);
        
        return list;
    }

    // Фильтрация городов по введенному тексту
    function filterCities(searchText) {
        if (!searchText) return [];
        
        const lowerSearch = searchText.toLowerCase();
        return cities.filter(city => 
            city.toLowerCase().includes(lowerSearch)
        ).slice(0, 10); // Показываем максимум 10 результатов
    }

    // Показать предложения
    function showSuggestions(inputElement, list, suggestions) {
        if (suggestions.length === 0) {
            list.style.display = 'none';
            return;
        }

        list.innerHTML = '';
        suggestions.forEach(city => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = city;
            item.style.cssText = `
                padding: 10px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
            `;
            
            // Подсветка при наведении
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0f0f0';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'white';
            });
            
            // Выбор города
            item.addEventListener('click', function() {
                inputElement.value = city;
                list.style.display = 'none';
                inputElement.focus();
            });
            
            list.appendChild(item);
        });
        
        list.style.display = 'block';
    }

    // Инициализация автокомплита для поля
    function initAutocomplete(inputElement) {
        const list = createAutocompleteList(inputElement);
        
        // Обработка ввода текста
        inputElement.addEventListener('input', function() {
            const suggestions = filterCities(this.value);
            showSuggestions(inputElement, list, suggestions);
        });
        
        // Показать все города при фокусе на пустом поле
        inputElement.addEventListener('focus', function() {
            if (!this.value) {
                showSuggestions(inputElement, list, cities.slice(0, 10));
            }
        });
        
        // Скрыть список при клике вне поля
        document.addEventListener('click', function(e) {
            if (e.target !== inputElement && !list.contains(e.target)) {
                list.style.display = 'none';
            }
        });
        
        // Навигация клавишами
        inputElement.addEventListener('keydown', function(e) {
            const items = list.querySelectorAll('.autocomplete-item');
            let currentFocus = -1;
            
            // Найти текущий выбранный элемент
            items.forEach((item, index) => {
                if (item.classList.contains('autocomplete-active')) {
                    currentFocus = index;
                }
            });
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus++;
                addActive(items, currentFocus);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                addActive(items, currentFocus);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1 && items[currentFocus]) {
                    items[currentFocus].click();
                }
            }
        });
        
        function addActive(items, index) {
            if (!items || items.length === 0) return false;
            
            // Удалить активный класс у всех
            items.forEach(item => {
                item.classList.remove('autocomplete-active');
                item.style.backgroundColor = 'white';
            });
            
            // Корректировка индекса
            if (index >= items.length) index = 0;
            if (index < 0) index = items.length - 1;
            
            // Добавить активный класс
            items[index].classList.add('autocomplete-active');
            items[index].style.backgroundColor = '#e0e0e0';
        }
    }

    // Инициализация при загрузке страницы
    document.addEventListener('DOMContentLoaded', function() {
        const fromInput = document.getElementById('form_value-from');
        const toInput = document.getElementById('form_value-to');
        
        if (fromInput) {
            // Убираем datalist, если используем кастомный автокомплит
            const datalistFrom = document.getElementById('cities-from');
            if (datalistFrom) datalistFrom.remove();
            fromInput.removeAttribute('list');
            
            initAutocomplete(fromInput);
        }
        
        if (toInput) {
            const datalistTo = document.getElementById('cities-to');
            if (datalistTo) datalistTo.remove();
            toInput.removeAttribute('list');
            
            initAutocomplete(toInput);
        }
    });
})();
