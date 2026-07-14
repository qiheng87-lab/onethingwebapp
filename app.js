let currentDate = new Date();
let calendarDate = new Date();
let devotionalData = [];
let calendarOpen = false;

// ============================================
// SERVICE WORKER MANAGEMENT
// ============================================

async function unregisterAllServiceWorkers() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        console.log('🗑️ Unregistering Service Worker:', registration.scope);
        await registration.unregister();
      }
      
      // Clear all caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        console.log('🗑️ Deleting cache:', cacheName);
        await caches.delete(cacheName);
      }
      
      console.log('✅ All Service Workers and caches cleared');
    } catch (error) {
      console.error('Error clearing Service Workers:', error);
    }
  }
}

// Run on page load
unregisterAllServiceWorkers();

// Also check for updates periodically
if ('serviceWorker' in navigator) {
  setInterval(() => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }, 60000); // Every minute
}

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

// ============================================
// DOM ELEMENTS
// ============================================

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
// LOAD DEVOTIONALS (WITH CACHE BUSTING)
// ============================================

async function loadDevotionals() {
  try {
    // Add timestamp to force fresh fetch
    const timestamp = new Date().getTime();
    const response = await fetch(`/onethingwebapp/devotionals.json?t=${timestamp}`, {
      // Force network request, ignore cache
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) throw new Error('Failed to load devotionals');

    const data = await response.json();
    devotionalData = data.devotionals;

    // Sort devotionals by date
    devotionalData.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('✅ Devotionals loaded:', devotionalData.length, 'entries');

    // Set current date to the second devotional entry
    if (devotionalData.length > 1) {
      currentDate = new Date(devotionalData[1].date);
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
// COMPLETION TRACKING
// ============================================
function isDevotionCompleted(dateStr) {
  return localStorage.getItem(`devotion_${dateStr}_completed`) === 'true';
}
function markDevotionAsCompleted(dateStr) {
  localStorage.setItem(`devotion_${dateStr}_completed`, 'true');
  console.log('✅ Devotional marked as completed:', dateStr);
}
function updateFinishedButtonState(dateStr) {
  const finishedBtn = document.getElementById('finishedBtn');
  const isCompleted = isDevotionCompleted(dateStr);
  
  if (isCompleted) {
    finishedBtn.classList.add('completed');
    finishedBtn.textContent = '✅ Completed';
    finishedBtn.disabled = true;
  } else {
    finishedBtn.classList.remove('completed');
    finishedBtn.textContent = '✅ Mark as Finished';
    finishedBtn.disabled = false;
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
  
  // Convert \n\n to <p> tags
  const paragraphs = devotion.article
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('');
  
  document.getElementById('article').innerHTML = paragraphs;
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
  // ⭐ UPDATE FINISHED BUTTON STATE ⭐
  updateFinishedButtonState(dateStr);
  updateDateDisplay();
  closeCalendar();
  updateNavigationButtons();
}
// ============================================
// RENDER CALENDAR WITH COMPLETION TRACKING
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
    const isCompleted = isDevotionCompleted(dayStr);
    const today = new Date();
    const isToday = formatDate(today) === dayStr;
    const isSelected = formatDate(currentDate) === dayStr;
    // Add classes
    if (hasDevotional) {
      dayElement.classList.add('has-devotion', 'clickable');
    } else {
      dayElement.classList.add('no-devotion');
    }
    // ⭐ ADD COMPLETION CLASS ⭐
    if (isCompleted && hasDevotional) {
      dayElement.classList.add('completed');
    }
    // ⭐ ORANGE FOR SELECTED (highest priority) ⭐
    if (isSelected) {
      dayElement.classList.add('selected');
    }
    // Blue for today (if not selected)
    else if (isToday && hasDevotional) {
      dayElement.classList.add('today');
    }
    // Add click handler only if devotional exists
    if (hasDevotional) {
      dayElement.addEventListener('click', () => {
        currentDate = new Date(year, month, day);
        displayDevotion();
        renderCalendar();
      });
    }
    calendarDays.appendChild(dayElement);
  }
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
  console.log('🚀 App starting...');
  
  loadDevotionals();
  
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
