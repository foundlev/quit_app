document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadData();
    setupForms();
    displayCurrentDay();
    setupSettingsToggle();
    setupDifficultySlider();
});

/**
 * Функция инициализации темы (светлая/темная) при загрузке страницы.
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

/**
 * Функция установки темы.
 * @param {string} theme - Название темы ('light' или 'dark').
 */
function setTheme(theme) {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    document.querySelectorAll('.container').forEach(container => {
        container.classList.remove('light', 'dark');
        container.classList.add(theme);
    });
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('light', 'dark');
        card.classList.add(theme);
    });
    document.querySelectorAll('.submit-button').forEach(button => {
        button.classList.remove('light', 'dark');
        button.classList.add(theme);
    });
}

/**
 * Функция загрузки данных из файла response.json и отображения их на странице.
 */
function loadData() {
    fetch('../server/response.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            displayGeneralText(data.general_text);
            displayRecoveryPercentage(data.recovery_percentage);
            displayParameters(data.parameters);
            displayQuestions(data.questions);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            displayError();
        });
}

/**
 * Функция отображения общей информации.
 * @param {string} text - Текст общей информации.
 */
function displayGeneralText(text) {
    const generalTextDiv = document.querySelector('.general-text-content');
    generalTextDiv.textContent = text;
}

/**
 * Функция отображения процента восстановления с помощью прогресс-бара.
 * @param {number} percentage - Процент восстановления.
 */
function displayRecoveryPercentage(percentage) {
    const progressBar = document.getElementById('recovery-progress');
    const recoveryText = document.getElementById('recovery-percentage-text');

    progressBar.style.width = `${percentage}%`;
    recoveryText.textContent = `${percentage}%`;
}

/**
 * Функция отображения параметров.
 * @param {object} parameters - Объект с параметрами и их состояниями.
 */
function displayParameters(parameters) {
    const parametersUl = document.querySelector('.parameters-list');
    parametersUl.innerHTML = ''; // Очистка существующего содержимого

    for (const [key, value] of Object.entries(parameters)) {
        const li = document.createElement('li');
        li.textContent = `${key}: ${getArrow(value)}`;
        li.classList.add(value.toLowerCase());
        parametersUl.appendChild(li);
    }
}

/**
 * Функция преобразования состояния параметра в стрелку.
 * @param {string} value - Состояние параметра ('up', 'down', 'stable').
 * @returns {string} - Стрелка для отображения.
 */
function getArrow(value) {
    switch(value.toLowerCase()) {
        case 'up':
            return '↑';
        case 'down':
            return '↓';
        case 'stable':
            return '→';
        default:
            return '';
    }
}

/**
 * Функция отображения вопросов на сегодня.
 * @param {Array<string>} questions - Массив вопросов.
 */
function displayQuestions(questions) {
    const questionsOl = document.querySelector('.questions-list');
    questionsOl.innerHTML = ''; // Очистка существующего содержимого

    questions.forEach(question => {
        const li = document.createElement('li');
        li.textContent = question;
        questionsOl.appendChild(li);
    });
}

/**
 * Функция отображения ошибки при загрузке данных.
 */
function displayError() {
    const container = document.querySelector('.container');
    container.innerHTML = '<p style="color: red; text-align: center;">Ошибка загрузки данных. Пожалуйста, попробуйте позже.</p>';
}

/**
 * Функция установки обработчиков событий для форм.
 */
function setupForms() {
    const reportForm = document.getElementById('submit-form');
    const settingsForm = document.getElementById('settings-form');

    reportForm.addEventListener('submit', handleReportSubmit);
    settingsForm.addEventListener('submit', handleSettingsSubmit);
}

/**
 * Обработчик отправки формы отчета.
 * @param {Event} event - Событие отправки формы.
 */
function handleReportSubmit(event) {
    event.preventDefault();
    const notes = document.getElementById('notes').value.trim();
    const difficulty = document.getElementById('difficulty').value;

    if (!notes || !difficulty) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    // Получение текущей даты и времени
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU');
    const timeStr = now.toLocaleTimeString('ru-RU');

    const report = {
        date: dateStr,
        time: timeStr,
        difficulty: difficulty,
        notes: notes
    };

    // Сохранение отчета в localStorage
    let reports = JSON.parse(localStorage.getItem('reports')) || [];
    reports.push(report);
    localStorage.setItem('reports', JSON.stringify(reports));

    // Очистка формы после отправки
    document.getElementById('submit-form').reset();
    updateDifficultyValue(3); // Сброс значения слайдера на 3
    alert('Отчет успешно отправлен!');
}

/**
 * Обработчик отправки формы настроек.
 * @param {Event} event - Событие отправки формы.
 */
function handleSettingsSubmit(event) {
    event.preventDefault();
    const lastRelapse = document.getElementById('last-relapse').value;

    if (!lastRelapse) {
        alert('Пожалуйста, выберите дату и время срыва.');
        return;
    }

    // Сохранение даты срыва в localStorage
    localStorage.setItem('lastRelapse', lastRelapse);
    alert('Настройки успешно сохранены!');
    displayCurrentDay();
    toggleSettingsVisibility(); // Скрыть настройки после сохранения
}

/**
 * Функция отображения текущего дня воздержания.
 */
function displayCurrentDay() {
    const currentDayDiv = document.querySelector('.current-day-text');
    const lastRelapse = localStorage.getItem('lastRelapse');

    if (!lastRelapse) {
        currentDayDiv.textContent = 'Настройте последнюю дату и время срыва в разделе "Настройки".';
        return;
    }

    const relapseDate = new Date(lastRelapse);
    const now = new Date();
    const diffTime = now - relapseDate;

    if (diffTime < 0) {
        currentDayDiv.textContent = 'Дата срыва установлена в будущем. Пожалуйста, проверьте настройки.';
        return;
    }

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Добавляем 1 для текущего дня
    console.log(diffTime);
    currentDayDiv.textContent = `День #${diffDays}`;
}

/**
 * Функция получения суффикса для дней.
 * @param {number} days - Количество дней.
 * @returns {string} - Суффикс для дней.
 */
function getDaySuffix(days) {
    if (days % 10 === 1 && days % 100 !== 11) {
        return '';
    } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
        return 'дня';
    } else {
        return 'дней';
    }
}

/**
 * Функция получения суффикса для часов.
 * @param {number} hours - Количество часов.
 * @returns {string} - Суффикс для часов.
 */
function getHourSuffix(hours) {
    if (hours === 1 || hours === 21) {
        return 'час';
    } else if ([2, 3, 4, 22, 23].includes(hours)) {
        return 'часа';
    } else {
        return 'часов';
    }
}

/**
 * Функция установки обработчика для переключения темы.
 */

/**
 * Функция установки обработчика для переключения видимости настроек.
 */
function setupSettingsToggle() {
    const toggleSettingsButton = document.getElementById('toggle-settings');

    toggleSettingsButton.addEventListener('click', () => {
        toggleSettingsVisibility();
    });
}

/**
 * Функция переключения видимости блока настроек.
 */
function toggleSettingsVisibility() {
    const settingsCard = document.querySelector('.settings-card');
    settingsCard.classList.toggle('hidden');
}

/**
 * Функция установки обработчика для слайдера трудности.
 */
function setupDifficultySlider() {
    const difficultySlider = document.getElementById('difficulty');
    const difficultyValue = document.getElementById('difficulty-value');

    // Установка начального значения
    difficultyValue.textContent = difficultySlider.value;

    difficultySlider.addEventListener('input', () => {
        difficultyValue.textContent = difficultySlider.value;
    });
}

/**
 * Функция обновления значения слайдера трудности.
 * @param {number} value - Новое значение слайдера.
 */
function updateDifficultyValue(value) {
    const difficultySlider = document.getElementById('difficulty');
    const difficultyValue = document.getElementById('difficulty-value');

    difficultySlider.value = value;
    difficultyValue.textContent = value;
}
