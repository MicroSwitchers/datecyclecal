const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const instanceColors = getComputedStyle(document.documentElement).getPropertyValue('--instance-colors').split(', ');
let instances = [{ dates: [], color: instanceColors[0], name: 'Instance 1' }];
let currentDate = moment();
let excludedDays = [];
let adjustPreference = 'before';

document.getElementById('adjustPreference').addEventListener('change', function () {
    //  Removed this line, as the apply all button now handles this
    // recalculateAllInstances();
});

function populateYearSelect(selectElement) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 100; i++) {
        const year = currentYear - i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        selectElement.appendChild(option);
    }
}

function setToday(instanceIndex) {
    const today = moment();
    document.querySelector(`#instance-${instanceIndex} .yearSelect`).value = today.year();
    document.querySelector(`#instance-${instanceIndex} .monthInput`).value = `${monthNames[today.month()]} - (${(today.month() + 1).toString().padStart(2, '0')})`;
    document.querySelector(`#instance-${instanceIndex} .dayInput`).value = today.date().toString().padStart(2, '0');
}

function validateMonthInput(inputElement) {
    let input = inputElement.value.toLowerCase();
    let monthNumber = input.match(/^(\d{1,2})/);
    if (monthNumber) {
        let monthIndex = parseInt(monthNumber[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            inputElement.value = `${monthNames[monthIndex]} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
        }
    } else {
        let monthName = getMonthName(input.slice(0, 3));
        if (monthName) {
            inputElement.value = `${monthName} - (${getMonthNumber(monthName)})`;
        }
    }
    inputElement.nextElementSibling.focus();
}

function validateDayInput(inputElement) {
    let input = inputElement.value;
    if (input.length === 1) {
        inputElement.value = '0' + input;
    }
}

function getMonthName(input) {
    const monthNamesLower = monthNames.map(name => name.toLowerCase());
    const index = monthNamesLower.indexOf(input);
    return index !== -1 ? monthNames[index] : null;
}

function getMonthNumber(monthName) {
    const index = monthNames.indexOf(monthName);
    return (index + 1).toString().padStart(2, '0');
}

function calculateDates(instanceIndex) {
    const instance = instances[instanceIndex];
    const year = document.querySelector(`#instance-${instanceIndex} .yearSelect`).value;
    const monthInput = document.querySelector(`#instance-${instanceIndex} .monthInput`).value.match(/\((\d{2})\)/)[1];
    const month = parseInt(monthInput, 10) - 1;
    const day = document.querySelector(`#instance-${instanceIndex} .dayInput`).value;
    const startDate = moment([year, month, day]);

    if (!startDate.isValid()) {
        alert('Please enter a valid date');
        return;
    }

    const increment = parseInt(document.querySelector(`#instance-${instanceIndex} .increment`).value);
    const incrementType = document.querySelector(`#instance-${instanceIndex} .increment-type`).value;
    const numOccurrences = parseInt(document.querySelector(`#instance-${instanceIndex} .num-occurrences`).value);

    instance.dates = [startDate.format('YYYY-MM-DD')];
    let nextDate = startDate.clone();

    for (let i = 1; i < numOccurrences; i++) {
        nextDate = nextDate.clone().add(increment, incrementType);
        instance.dates.push(nextDate.format('YYYY-MM-DD'));
    }

    // Apply exclusion rules AFTER converting to Moment.js objects
    instance.dates = instance.dates
        .map(date => moment(date))      // Convert to Moment.js objects
        .map(date => adjustDateForExclusion(date)) // Adjust for exclusions
        .map(date => date.format('YYYY-MM-DD')); // Convert back to strings


    displayDates();
    currentDate = startDate.clone();
    updateCalendar();
}

function isExcluded(date) {
    if (excludedDays.includes(date.day().toString())) {
        return true;
    }
    return false;
}

function adjustDateForExclusion(date) {
    while (isExcluded(date)) {
        if (adjustPreference === 'before') {
            date.subtract(1, 'day');
        } else {
            date.add(1, 'day');
        }
    }
    return date;
}

function displayDates() {
    const dateList = document.getElementById('date-list');
    dateList.innerHTML = '';
    let allDates = {};
    instances.forEach((instance, index) => {
        instance.dates.forEach(date => {
            const dateStr = moment(date).format('YYYY-MM-DD');
            if (!allDates[dateStr]) {
                allDates[dateStr] = [];
            }
            allDates[dateStr].push({ date: moment(date), instanceIndex: index });
        });
    });
    Object.keys(allDates).sort().forEach(dateStr => {
        const dateGroup = allDates[dateStr];
        const div = document.createElement('div');
        div.className = 'date-group';
        div.innerHTML = `<strong>${moment(dateStr).format('MMMM D, YYYY')}</strong>`;
        const ul = document.createElement('ul');
        dateGroup.forEach(item => {
            const li = document.createElement('li');
            li.className = 'instance-label';
            li.style.borderColor = instances[item.instanceIndex].color;
            li.style.backgroundColor = instances[item.instanceIndex].color;
            li.textContent = instances[item.instanceIndex].name;
            ul.appendChild(li);
        });
        div.appendChild(ul);
        dateList.appendChild(div);
    });
}

function updateCalendar() {
    const calendarElement = document.getElementById('calendar');
    const currentMonthElement = document.getElementById('current-month');
    currentMonthElement.textContent = currentDate.format('MMMM YYYY');

    calendarElement.innerHTML = '';
    const firstDay = currentDate.clone().startOf('month').day();
    const daysInMonth = currentDate.daysInMonth();

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'calendar-day';
        dayLabel.textContent = day;
        dayLabel.style.fontWeight = 'bold';
        calendarElement.appendChild(dayLabel);
    });

    for (let i = 0; i < firstDay; i++) {
        calendarElement.appendChild(createCalendarDay(''));
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = createCalendarDay(i);
        const currentDateString = currentDate.clone().date(i).format('YYYY-MM-DD');

        const instanceColors = instances
            .filter(instance => instance.dates.includes(currentDateString))
            .map(instance => instance.color);

        if (instanceColors.length > 0) {
            dayElement.classList.add('highlight');
            if (instanceColors.length === 1) {
                dayElement.style.backgroundColor = instanceColors[0];
            } else {
                const colorStops = instanceColors.map((color, index) => `${color} ${(index * (100 / instanceColors.length)).toFixed(2)}% ${(index + 1) * (100 / instanceColors.length).toFixed(2)}%`).join(', ');
                const gradient = `linear-gradient(45deg, ${colorStops})`;
                dayElement.style.backgroundImage = gradient;
            }
        }

        calendarElement.appendChild(dayElement);
    }
}

function createCalendarDay(content) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = content;
    return dayElement;
}

function changeMonth(delta) {
    currentDate.add(delta, 'months');
    updateCalendar();
}

function addInstance() {
    const instanceIndex = instances.length;
    if (instanceIndex >= 20) {
        alert('Maximum of 20 instances reached');
        return;
    }

    const instanceColor = instanceColors[instanceIndex];
    instances.push({ dates: [], color: instanceColor, name: `Instance ${instanceIndex + 1}` });

    const instanceContainer = document.getElementById('instances');
    const newInstance = document.createElement('div');
    newInstance.className = 'instance';
    newInstance.id = `instance-${instanceIndex}`;
    newInstance.innerHTML = `
        <input type="text" class="instance-name" placeholder="Instance ${instanceIndex + 1}" value="Instance ${instanceIndex + 1}" oninput="updateInstanceName(${instanceIndex})">
        <button class="today-button" onclick="setToday(${instanceIndex})">Today</button>
        <div class="date-inputs">
            <select class="yearSelect">
                <option value="">Year</option>
            </select>
            <input list="months" class="monthInput" placeholder="MMM or # (Month)" onchange="validateMonthInput(this)">
            <input type="text" class="dayInput" placeholder="DD (Day)" maxlength="2" onchange="validateDayInput(this)">
        </div>
        <label for="increment">Increment:</label>
        <div style="display: flex; gap: 10px;">
            <select class="increment" required style="flex: 1;">
                ${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
            </select>
            <select class="increment-type" style="width: auto;">
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
            </select>
        </div>
        <label for="num-occurrences">Number of Occurrences:</label>
        <input type="number" class="num-occurrences" min="1" value="50" required>
        <button class="calculate-button" onclick="calculateDates(${instanceIndex})">Calculate</button>
    `;
    newInstance.style.borderColor = instanceColor;
    newInstance.querySelector('.instance-name').style.color = instanceColor;
    newInstance.querySelector('.today-button').style.backgroundColor = instanceColor;
    newInstance.querySelector('.calculate-button').style.backgroundColor = instanceColor;

    instanceContainer.appendChild(newInstance);
    populateYearSelect(newInstance.querySelector('.yearSelect'));
    setToday(instanceIndex);
}

function updateInstanceName(instanceIndex) {
    const instanceNameInput = document.querySelector(`#instance-${instanceIndex} .instance-name`);
    instances[instanceIndex].name = instanceNameInput.value;
    displayDates();
}

function initializeFirstInstance() {
    const instance = document.querySelector('#instance-0');
    const instanceColor = instanceColors[0];
    instance.style.borderColor = instanceColor;
    instance.querySelector('.instance-name').style.color = instanceColor;
    instance.querySelector('.today-button').style.backgroundColor = instanceColor;
    instance.querySelector('.calculate-button').style.backgroundColor = instanceColor;
    instance.querySelector('.num-occurrences').value = 50;
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function recalculateAllInstances() {
    instances.forEach((instance, index) => {
        calculateDates(index);
    });
}

document.querySelectorAll('.excludeDay').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        if (this.checked) {
            excludedDays.push(this.value);
        } else {
            excludedDays = excludedDays.filter(day => day !== this.value);
        }
        // This line is removed to allow for an apply all button.
        // recalculateAllInstances();
    });
});

populateYearSelect(document.querySelector('.yearSelect'));
setToday(0);
updateCalendar();
initializeFirstInstance();
addInstance();