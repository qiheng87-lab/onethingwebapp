let currentDate = new Date();
let calendarDate = new Date();
let devotionalData = [];
let calendarOpen = false;
const btnConnect = document.getElementById('gdrive-connect');
const btnSync    = document.getElementById('gdrive-syncnow');
const status     = document.getElementById('sync-status');
let tokenClient = null;
let accessToken = null;
/*
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

*/


// ============================================
// HAMBURGER MENU MANAGEMENT
// ============================================
function initializeMenuBar() {
 const hamburgerBtn = document.getElementById('hamburgerBtn');
 const menuBar = document.getElementById('menuBar');
 const menuButtons = document.querySelectorAll('.menu-btn');
 const sections = document.querySelectorAll('.section');
 // Toggle menu when hamburger button is clicked
 hamburgerBtn.addEventListener('click', () => {
   menuBar.classList.toggle('open');
   hamburgerBtn.classList.toggle('active');
   console.log('🍔 Menu toggled');
 });
 // Handle menu button clicks
 menuButtons.forEach(button => {
   button.addEventListener('click', () => {
     const sectionId = button.getAttribute('data-section');
    
     // Remove active class from all buttons and sections
     menuButtons.forEach(btn => btn.classList.remove('active'));
     sections.forEach(section => section.classList.remove('active'));
    
     // Add active class to clicked button and corresponding section
     console.log('Raw sectionId value:', JSON.stringify(sectionId));
     button.classList.add('active');
     document.getElementById(sectionId).classList.add('active');
    
     // Close menu and hamburger button
     menuBar.classList.remove('open');
     hamburgerBtn.classList.remove('active');
    
     // Close calendar if open
     closeCalendar();
    
     // Scroll to top
     window.scrollTo(0, 0);
    
     console.log('📄 Switched to section:', sectionId);
   });
 });
 // Close menu when clicking outside
 document.addEventListener('click', (e) => {
   const isHamburger = e.target === hamburgerBtn || hamburgerBtn.contains(e.target);
   const isMenu = e.target === menuBar || menuBar.contains(e.target);
  
   if (!isHamburger && !isMenu && menuBar.classList.contains('open')) {
     menuBar.classList.remove('open');
     hamburgerBtn.classList.remove('active');
   }
 });
}

initializeMenuBar();

// ============================================
// LOAD STATIC CONTENT (Sermon Series, Why Spend Time, Connect with GPC)
// ============================================
function loadStaticContent() {
 // Sermon Series Content
 const sermonContent = document.getElementById('sermonContent');
 if (sermonContent) {
   sermonContent.innerHTML = `
     <h3>Advent Sermon Series: God With Us — Living the Advent Together</h3>
    <p>
     <i>"The Word became flesh and made his dwelling among us." — John 1:14</i>
    </p>
    <p>
     Advent is a time of holy anticipation—a season to reflect on Christ's first coming and long for His return, we are invited to grow deeper as His missional community — carriers of hope, makers of peace, people of joy, and agents of love. Each week, we focus on one virtue that Christ fulfills and brings to His people: Hope, Peace, Joy, and Love. These are not seasonal emotions, but Gospel realities rooted in the Incarnation. As the world longs for meaning and healing, the church is called to embody these virtues in community and mission. The Advent series draws us deeper into the Gospel and prepares us to be agents of Christ's Kingdom. Each theme highlights how the incarnation of Christ shapes our communal identity and missional witness—helping us grow together as God's people in a broken world. 
    </p>
    <p>
    Advent Reflection in Missional Community. This devotional series will span across 4 weeks leading up to Christmas and is designed to help individuals and Care Groups engage deeply with the themes of Advent — Hope, Peace, Joy, and Love — through Scripture, discussion, and prayer, while aligning with Vision 2026: Growing Together as His Missional Community. This will bring us to the final Sunday of the year, which calls us to reflective gratitude unto God for the past year and look ahead to Vision 2027: Broadening His Mission Impact.
    </p>
   `;
 }
 // Why Spend Time with God Content
 const whyContent = document.getElementById('whyContent');
 if (whyContent) {
   whyContent.innerHTML = `
    <p>
       The God of the universe is near! NOT far away! And wants to speak to you through His Word. And just as our bodies need food to keep it going, we need the spiritual food for our souls (Jesus answered, "It is written: 'Man shall not live on bread alone, but on every word that comes from the mouth of God.'" Matthew 4:4).
    </p>
    <p>
       We understand God's heart for us and for the world as we seek His face in His Word. If we don't understand a certain passage of Scripture, we can ask God to help us understand it. You can also ask your friends and mentors. It is through daily prayer, confession and the reading and application of God's Word that we will grow in our knowledge of who God is and solidify our resolve to follow Him all the days of our lives. 
    </p>
    <h3>How To Spend Time with God?</h3>
    <p>
       <br><b>Coming into God's Presence.</b> Find a fixed time each day to meet with God (if possible, in the morning before the busyness of the day begins). Enter prayerfully and quietly into an awareness of God's presence. Take 2-5 minutes to keep silence as you acknowledge God's presence. Centre your thoughts on God and let go of distractions. Sing a praise song to God, begin with worship! Ask God to help you hear Him today. <br>"Be still before the Lord and wait patiently for him" Psalm 37:7 
    </p>   
    <p>
       <b>Listening to God.</b> Prayerfully read through the Bible passage. Use the following outline (COMA) to meditate on God's word. 
       <ul>
         <li><b>Context:</b> briefly take note who this passage was originally written to, what was said before this </li>
         <li><b>Observation:</b> write down one or two things that you see in the passage. </li>
         <li><b>Meaning:</b> think through what the passage means. What does it say about God, humans, the world etc.? </li>
         <li><b>Application:</b> consider a specific area from the passage that you want to apply in your life. Share it with a friend.</li>
       </ul>
    </p>   
    <p>
       <b>Pray.</b> write out a prayer to God in response to His word. 
    </p>
    <p>
       <b>Praying for the World, Church, Self.</b> End your time with God by speaking to Him about His world around you.
    </p>
   `;
 }
// Connect with GPC Content
 const gpcContent = document.getElementById('gpcContent');
 if (gpcContent) {
   gpcContent.innerHTML = `
    <p>
       The <i>One Thing</i> devotional web app is developed and owned by Glory Presbyterian Church (English Service), and is intended for use by congregational members to help them grow deeper in God's word through reflection and studies based on the Sunday sermons. 
    </p>
    <p>
       We are a church based in Singapore. While you are free to use this devotional resource for your personal benefit and spiritual growth, we invite you to learn more about our church and connect with us through our website and social media channels, or come and visit us in person!
    </p>
    <p> 
      Click <a href="https://linktr.ee/glorypchurch" target="_blank" rel="noopener noreferrer"><i>here</i></a> to find out more about us!
    </p>
   `;
 }
}

loadStaticContent();

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


// ============================================
// LOAD DEVOTIONALS (WITH CACHE BUSTING)
// ============================================

async function loadDevotionals() {
  try {
    // Add timestamp to force fresh fetch
    const timestamp = new Date().getTime();
    // replace with '/onethingwebapp/devotionals.json' for web testing
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

    /* blocked out for testing
    // Set current date to the second devotional entry
    if (devotionalData.length > 1) {
      currentDate = new Date(devotionalData[1].date);
    }
    */
    
    displayDevotion();
    renderCalendar();
    updateNavigationButtons();
  } catch (error) {
    showError('Unable to load devotional. Please check your connection.');
    console.error('Error loading devotionals:', error);
  }
}


(function () {
    const section = document.getElementById('daily-devotional');
    if (!section) return;
    const content = section.querySelector('main.devotional-content');
    const display = section.querySelector('.font-size-value');
    const buttons = section.querySelectorAll('button[data-font-action]');
    const CONFIG = {
        min: 0.75,    // 75%
        max: 2.0,     // 200%
        step: 0.125,  // 12.5% per click
        storageKey: 'gpc-devotional-font-scale'
    };
    // Load saved scale or start at 1.0 (100% / 1rem)
    let current = parseFloat(localStorage.getItem(CONFIG.storageKey));
    if (Number.isNaN(current)) current = 1.0;
    function setScale(size) {
        // Clamp and avoid float drift
        size = Math.max(CONFIG.min, Math.min(CONFIG.max, size));
        size = parseFloat(size.toFixed(3));
        current = size;
        // Apply scale ONLY to the <main> element via CSS variable
        content.style.setProperty('--dev-content-scale', `${size}rem`);
        // Update visible percentage (e.g., "100%")
        if (display) display.textContent = `${Math.round(size * 100)}%`;
        // Save preference
        localStorage.setItem(CONFIG.storageKey, size);
        // Disable buttons at extremes
        buttons.forEach(btn => {
            const action = btn.dataset.fontAction;
            btn.disabled =
                (action === 'increase' && current >= CONFIG.max) ||
                (action === 'decrease' && current <= CONFIG.min);
        });
    }
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            switch (btn.dataset.fontAction) {
                case 'increase': setScale(current + CONFIG.step); break;
                case 'decrease': setScale(current - CONFIG.step); break;
                case 'reset':    setScale(1.0); break;
            }
        });
    });
    // Initialize on load (restores saved user preference)
    setScale(current);
})();


// ============================================
// COMPLETION TRACKING
// ============================================

/* =========================================================
   HELPERS
   ========================================================= */
function getTodayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}
// Move a YYYY-MM-DD string backward or forward N days safely
function offsetDateStr(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


function isDevotionCompleted(dateStr) {
  return localStorage.getItem(`devotion_${dateStr}_completed`) === 'true';
  
}
// Renamed to reflect the new toggle behavior
function toggleDevotionCompletion(dateStr) {
  const currentlyComplete = isDevotionCompleted(dateStr);
  if (currentlyComplete) {
    localStorage.removeItem(`devotion_${dateStr}_completed`); // unmark
    console.log('🔄 Devotional unmarked:', dateStr);
  } else {
    localStorage.setItem(`devotion_${dateStr}_completed`, 'true'); // mark
    localStorage.setItem(`devotion_${dateStr}_completedOn`, getTodayStr());
    console.log('✅ Devotional marked as completed:', dateStr);
  }
  updateFinishedButtonState(dateStr);
  console.log('➡️ toggle finished, calling renderStreakUI');
  renderStreakUI();
}
function updateFinishedButtonState(dateStr) {
  const finishedBtn = document.getElementById('finishedBtn');
  const isComplete = isDevotionCompleted(dateStr);
  if (isComplete) {
    finishedBtn.classList.add('completed');
    finishedBtn.textContent = '✅ Completed';
    // IMPORTANT: Remove or comment out the line below
    // finishedBtn.disabled = true; 
  } else {
    finishedBtn.classList.remove('completed');
    finishedBtn.textContent = 'Mark as Finished';
  }
}

/* =========================================================
   STREAK LOGIC
   ========================================================= */
/**
 * Returns true ONLY if the devotion was completed AND the click happened
 * on the devotional's own calendar day.
 */
function wasCompletedOnTime(dateStr) {
  if (!isDevotionCompleted(dateStr)) return false;
  
  // Read from the same individual key that toggleDevotionCompletion writes to
  const clickDate = localStorage.getItem(`devotion_${dateStr}_completedOn`);
  
  // Legacy / missing timestamp
  if (!clickDate) return false;
  
  return clickDate === dateStr;
}
/**
 * Calculates the current streak dynamically from the ground truth.
 * No separate "streak counter" is stored; this derives it every time.
 */
function getStreak() {
  const todayStr = getTodayStr();
  let cursorStr = todayStr;

  if (!wasCompletedOnTime(cursorStr)) {
    cursorStr = offsetDateStr(todayStr, -1);
  }
  
  let streak = 0;
  while (wasCompletedOnTime(cursorStr)) {
    streak++;
    cursorStr = offsetDateStr(cursorStr, -1);
  }
  
  return streak;
}

/* =========================================================
   UI WIRING (ties finishedBtn and streak display together)
   ========================================================= */
function renderStreakUI() {
  const streak = getStreak();
  console.log('🔎 getStreak() returned:', streak);
  const countEl = document.getElementById('streak-count'); // your 🔥 element
  console.log('🔎 Found streak-count element?', !!countEl);
  if (countEl) countEl.textContent = streak;
  }

// Run once on load so the fire icon shows immediately
renderStreakUI();


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
  renderStreakUI();
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
    
     // Base classes
    if (!hasDevotional) {
      dayElement.classList.add('no-devotion');
    } else {
      dayElement.classList.add('has-devotion', 'clickable');
    }
    // ⭐ APPLY CLASSES IN PRIORITY ORDER ⭐
    
    // 1. Completed (green)
    if (isCompleted && hasDevotional) {
      dayElement.classList.add('completed');
      dayElement.style.backgroundColor = '#34a853';  // Force green
      dayElement.style.color = 'white';
    }
    // 2. Today (blue) - only if not selected
    if (isToday && hasDevotional && !isSelected) {
      dayElement.classList.add('today');
      dayElement.style.backgroundColor = '#ff9800';  // Force orange
      dayElement.style.color = 'white';
    }
    // 3. Selected (orange) - HIGHEST PRIORITY
    if (isSelected) {
      dayElement.classList.add('selected');
    }
    // Add click handler
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
  
  // Disable next button if no later devotional
  nextBtn.disabled = !nextDate;

  // Update button styling
  if (prevBtn.disabled) {
    prevBtn.style.opacity = '0.5';
    prevBtn.style.cursor = 'not-allowed';
  } else {
    prevBtn.style.opacity = '1';
    prevBtn.style.cursor = 'pointer';
  }

  if (nextBtn.disabled) {
    nextBtn.style.opacity = '0.5';
    nextBtn.style.cursor = 'not-allowed';
  } else {
    nextBtn.style.opacity = '1';
    nextBtn.style.cursor = 'pointer';
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

    // ⭐ FINISHED BUTTON EVENT LISTENER ⭐
 const finishedBtn = document.getElementById('finishedBtn');
finishedBtn.addEventListener('click', () => {
  const dateStr = formatDate(currentDate);
  toggleDevotionCompletion(dateStr);

    console.log('🎉 button state updated');
});
  
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
 
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') previousDay();
    if (e.key === 'ArrowRight') nextDay();
  });
});
