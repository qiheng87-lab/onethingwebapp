let currentDate = new Date();
let calendarDate = new Date();
let devotionalData = [];
let calendarOpen = false;
// DOM Elements
const dateDisplay = document.getElementById('dateDisplay');
const calendarToggle = document.getElementById('calendarToggle');
const calendarContainer = document.getElementById('calendarContainer');
const monthYear = document.getElementById('monthYear');
const calendarDays = document.getElementById('calendarDays');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtn2 = document.getElementById('prevBtn2');
const nextBtn2 = document.getElementById('nextBtn2');
// ============================================
// DATE FORMATTING
// ============================================
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function updateDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateDisplay.textContent = currentDate.toLocaleDateString('en-US', options);
}

// Service Worker Registration
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('service-worker.js');
      console.log('Service Worker registered');
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
}

// ============================================
// LOAD DEVOTIONALS
// ============================================
async function loadDevotionals() {
  try {
    const response = await fetch('/onethingwebapp/devotionals.json');
    if (!response.ok) throw new Error('Failed to load devotionals');
    const data = await response.json();
    devotionalData = data.devotionals;
    
    // Sort devotionals by date to ensure correct order
    devotionalData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Find first available devotional
    if (devotionalData.length > 0) {
      const firstDate = new Date(devotionalData[1].date);
      currentDate = firstDate;
    }
    displayDevotion();
    renderCalendar();
    updateNavigationButtons();
  } catch (error) {
    showError('Unable to load devotional. Please check your connection.');
    console.error('Error loading devotionals:', error);
  }
}
// ============================================
// DISPLAY DEVOTION
// ============================================
function displayDevotion() {
  const dateStr = formatDate(currentDate);
  const devotion = devotionalData.find(d => d.date === dateStr);
  // Clear all content first
  document.getElementById('title').textContent = '';
  document.getElementById('passageRef').textContent = '';
  document.getElementById('passageText').textContent = '';
  document.getElementById('article').innerHTML = '';
  document.getElementById('questionsContainer').innerHTML = '';
  if (!devotion) {
    document.getElementById('title').textContent = 'No Devotional';
    document.getElementById('article').innerHTML = `
      <p style="text-align: center; color: #999; font-size: 1.1rem; margin-top: 2rem;">
        There is no devotional entry for this date.
        <br><br>
        Use the calendar or arrow buttons to navigate to a different date.
      </p>
    `;
    
    showError('No devotional available for this date.');
    updateDateDisplay();
    closeCalendar();
    updateNavigationButtons();
    return;
  }
  hideError();
  // Display devotional content
  document.getElementById('title').textContent = devotion.title;
  document.getElementById('passageRef').textContent = devotion.passage;
  document.getElementById('passageText').textContent = devotion.passageText;
  document.getElementById('article').innerHTML = devotion.article;
  // Render questions
  const questionsContainer = document.getElementById('questionsContainer');
  questionsContainer.innerHTML = '';
  devotion.questions.forEach((question) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.innerHTML = `
      <label>${question.text}</label>
      <textarea 
        placeholder="Type your reflection here..." 
        data-question-id="${question.id}"
        class="question-input"
      ></textarea>
    `;
    questionsContainer.appendChild(questionDiv);
    // Load saved answer if exists
    const saved = localStorage.getItem(`devotion_${dateStr}_q${question.id}`);
    if (saved) {
      questionDiv.querySelector('textarea').value = saved;
    }
  });
  // Save answers on input
  document.querySelectorAll('.question-input').forEach(textarea => {
    textarea.addEventListener('input', () => {
      const questionId = textarea.getAttribute('data-question-id');
      localStorage.setItem(`devotion_${dateStr}_q${questionId}`, textarea.value);
    });
  });
  updateDateDisplay();
  closeCalendar();
  updateNavigationButtons();
}
// ============================================
// NAVIGATION FUNCTIONS
// ============================================
function getNextAvailableDate(direction = 1) {
  let checkDate = new Date(currentDate);
  let attempts = 0;
  const maxAttempts = 365;
  while (attempts < maxAttempts) {
    checkDate.setDate(checkDate.getDate() + direction);
    const dateStr = formatDate(checkDate);
    
    if (devotionalData.some(d => d.date === dateStr)) {
      return checkDate;
    }
    attempts++;
  }
  return null;
}
function previousDay() {
  const prevDate = getNextAvailableDate(-1);
  
  if (prevDate) {
    currentDate = prevDate;
    displayDevotion();
    renderCalendar();
  } else {
    showError('No previous devotional available.');
  }
}
function nextDay() {
  const nextDate = getNextAvailableDate(1);
  
  if (nextDate) {
    currentDate = nextDate;
    displayDevotion();
    renderCalendar();
  } else {
    showError('No next devotional available.');
  }
}
function updateNavigationButtons() {
  const prevDate = getNextAvailableDate(-1);
  const nextDate = getNextAvailableDate(1);
  // Disable previous button if no earlier devotional
  prevBtn.disabled = !prevDate;
  prevBtn2.disabled = !prevDate;
  
  // Disable next button if no later devotional
  nextBtn.disabled = !nextDate;
  nextBtn2.disabled = !nextDate;
  // Update button styling
  if (prevBtn.disabled) {
    prevBtn.style.opacity = '0.5';
    prevBtn.style.cursor = 'not-allowed';
    prevBtn2.style.opacity = '0.5';
    prevBtn2.style.cursor = 'not-allowed';
  } else {
    prevBtn.style.opacity = '1';
    prevBtn.style.cursor = 'pointer';
    prevBtn2.style.opacity = '1';
    prevBtn2.style.cursor = 'pointer';
  }
  if (nextBtn.disabled) {
    nextBtn.style.opacity = '0.5';
    nextBtn.style.cursor = 'not-allowed';
    nextBtn2.style.opacity = '0.5';
    nextBtn2.style.cursor = 'not-allowed';
  } else {
    nextBtn.style.opacity = '1';
    nextBtn.style.cursor = 'pointer';
    nextBtn2.style.opacity = '1';
    nextBtn2.style.cursor = 'pointer';
  }
}
// ============================================
// CALENDAR FUNCTIONS
// ============================================
function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  monthYear.textContent = `${monthNames[month]} ${year}`;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  calendarDays.innerHTML = '';
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarDays.appendChild(emptyDay);
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const dayStr = formatDate(dayDate);
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    const hasDevotional = devotionalData.some(d => d.date === dayStr);
    const today = new Date();
    const isToday = formatDate(today) === dayStr;
    const isSelected = formatDate(currentDate) === dayStr;
    // Add classes
    if (isToday) {
      dayElement.classList.add('today');
    } else if (isSelected) {
      dayElement.classList.add('selected');
    } else if (hasDevotional) {
      dayElement.classList.add('has-devotion');
    } else {
      dayElement.classList.add('no-devotion');
    }
    // Add click handler only if devotional exists
    if (hasDevotional) {
      dayElement.classList.add('clickable');
      dayElement.addEventListener('click', () => {
        currentDate = new Date(year, month, day);
        displayDevotion();
        renderCalendar();
      });
    }
    calendarDays.appendChild(dayElement);
  }
}
function toggleCalendar() {
  calendarOpen = !calendarOpen;
  if (calendarOpen) {
    calendarContainer.classList.add('open');
    calendarToggle.classList.add('active');
    calendarDate = new Date(currentDate);
    renderCalendar();
  } else {
    closeCalendar();
  }
}
function closeCalendar() {
  calendarOpen = false;
  calendarContainer.classList.remove('open');
  calendarToggle.classList.remove('active');
}
function previousMonth() {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
}
function goToNextMonth() {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
}
// ============================================
// ERROR HANDLING
// ============================================
function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}
function hideError() {
  document.getElementById('errorMessage').style.display = 'none';
}
// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadDevotionals();
  registerServiceWorker();
  
  // Calendar toggle
  calendarToggle.addEventListener('click', toggleCalendar);
  // Close calendar when clicking outside
  document.addEventListener('click', (e) => {
    if (!calendarContainer.contains(e.target) && 
        !calendarToggle.contains(e.target) && 
        calendarOpen) {
      closeCalendar();
    }
  });
  // Month navigation
  prevMonth.addEventListener('click', previousMonth);
  nextMonth.addEventListener('click', goToNextMonth);
  // Date navigation
  prevBtn.addEventListener('click', previousDay);
  nextBtn.addEventListener('click', nextDay);
  prevBtn2.addEventListener('click', previousDay);
  nextBtn2.addEventListener('click', nextDay);
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') previousDay();
    if (e.key === 'ArrowRight') nextDay();
  });
});
