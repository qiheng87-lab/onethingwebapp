let devotionalData = [];
let currentDate = new Date();

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  loadDevotionals();
  updateDateDisplay();
});

// Service Worker Registration
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
      console.log('Service Worker registered');
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
}

// Load devotional data from JSON
async function loadDevotionals() {
  try {
    const response = await fetch('./devotionals.json');
    if (!response.ok) throw new Error('Failed to load devotionals');
    
    const data = await response.json();
    devotionalData = data.devotionals;
    
    displayDevotion();
  } catch (error) {
    showError('Unable to load devotional. Please check your connection.');
    console.error('Error loading devotionals:', error);
  }
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Update date display
function updateDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = currentDate.toLocaleDateString('en-US', options);
  document.getElementById('dateDisplay').textContent = dateStr;
}

// Display devotion for current date
function displayDevotion() {
  const dateStr = formatDate(currentDate);
  const devotion = devotionalData.find(d => d.date === dateStr);

  if (!devotion) {
    showError('No devotional available for this date.');
    return;
  }

  hideError();
  hideLoading();

  // Populate content
  document.getElementById('title').textContent = devotion.title;
  document.getElementById('passageRef').textContent = devotion.passage;
  document.getElementById('passageText').textContent = devotion.passageText;
  document.getElementById('article').innerHTML = devotion.article;

  // Build questions
  const questionsContainer = document.getElementById('questionsContainer');
  questionsContainer.innerHTML = '';

  devotion.questions.forEach((question, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';

    const label = document.createElement('label');
    label.htmlFor = `question-${index}`;
    label.textContent = question.text;

    let input;
    if (question.type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'question-textarea';
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'question-input';
    }

    input.id = `question-${index}`;
    input.placeholder = 'Your response...';

    questionDiv.appendChild(label);
    questionDiv.appendChild(input);
    questionsContainer.appendChild(questionDiv);
  });

  // Load saved responses
  loadSavedResponses();

  // Show content
  document.getElementById('devotionalContent').style.display = 'block';
  document.getElementById('loading').style.display = 'none';
}

// Save responses to localStorage
function saveResponses() {
  const dateStr = formatDate(currentDate);
  const responses = {};

  document.querySelectorAll('.question-textarea, .question-input').forEach(input => {
    responses[input.id] = input.value;
  });

  const key = `devotion-responses-${dateStr}`;
  localStorage.setItem(key, JSON.stringify(responses));

  showStatus('Responses saved successfully!', 'success');
}

// Load saved responses from localStorage
function loadSavedResponses() {
  const dateStr = formatDate(currentDate);
  const key = `devotion-responses-${dateStr}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    const responses = JSON.parse(saved);
    Object.entries(responses).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) {
        input.value = value;
      }
    });
  }
}

// Clear responses
function clearResponses() {
  if (confirm('Are you sure you want to clear all answers?')) {
    document.querySelectorAll('.question-textarea, .question-input').forEach(input => {
      input.value = '';
    });
    showStatus('Answers cleared.', 'success');
  }
}

// Navigate to previous day
function previousDay() {
  currentDate.setDate(currentDate.getDate() - 1);
  updateDateDisplay();
  displayDevotion();
}

// Navigate to next day
function nextDay() {
  currentDate.setDate(currentDate.getDate() + 1);
  updateDateDisplay();
  displayDevotion();
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.style.display = 'block';

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

// Show error message
function showError(message) {
  const errorEl = document.getElementById('error');
  document.getElementById('errorMessage').textContent = message;
  errorEl.style.display = 'block';
}

// Hide error message
function hideError() {
  document.getElementById('error').style.display = 'none';
}

// Hide loading
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}
