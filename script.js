// Global variables
let alarms = [];
let mediaRecorder;
let recordedChunks = [];
let currentAudioBlob = null;
let timeInterval; // Store interval reference

// Update current time display
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
}

// Start updating time
timeInterval = setInterval(updateTime, 1000);
updateTime(); // Initial call

// Check if we're online and handle offline state
function handleOnlineStatus() {
    const isOnline = navigator.onLine;
    console.log('Online status:', isOnline);

    // Update UI based on online status
    document.body.classList.toggle('offline', !isOnline);

    if (!isOnline) {
        // Ensure time keeps updating even offline
        console.log('App is offline - time updates should continue');
        // Force a time update to ensure it's working
        updateTime();
    }
}

// Listen for online/offline events
window.addEventListener('online', handleOnlineStatus);
window.addEventListener('offline', handleOnlineStatus);

// Handle visibility change (when app comes back from background)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('App became visible, updating time');
        updateTime(); // Update time immediately when app becomes visible
    }
});

// Initial check
handleOnlineStatus();

// Audio recording functions
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            currentAudioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        document.getElementById('record-btn').disabled = true;
        document.getElementById('stop-btn').disabled = false;
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        document.getElementById('record-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
    }
}

// Alarm management
function addAlarm(time, audioBlob) {
    const alarmId = Date.now();
    const alarmTime = new Date();
    const [hours, minutes] = time.split(':');
    alarmTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    let delay = alarmTime - now;
    if (delay < 0) {
        delay += 24 * 60 * 60 * 1000; // Add 24 hours if time has passed
    }

    const timeoutId = setTimeout(() => {
        playAlarm(audioBlob);
        removeAlarm(alarmId);
    }, delay);

    const alarm = {
        id: alarmId,
        time: time,
        timeoutId: timeoutId,
        audioBlob: audioBlob
    };

    alarms.push(alarm);
    displayAlarms();
}

function playAlarm(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
}

function removeAlarm(alarmId) {
    const index = alarms.findIndex(alarm => alarm.id === alarmId);
    if (index !== -1) {
        clearTimeout(alarms[index].timeoutId);
        alarms.splice(index, 1);
        displayAlarms();
    }
}

function displayAlarms() {
    const alarmList = document.getElementById('alarm-list');
    if (!alarmList) {
        console.error('Alarm list element not found');
        return;
    }

    alarmList.innerHTML = '';
    console.log('Displaying', alarms.length, 'alarms');

    alarms.forEach(alarm => {
        const alarmItem = document.createElement('div');
        alarmItem.className = 'alarm-item';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'alarm-time';
        timeSpan.textContent = alarm.time;

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'alarm-controls';

        const playBtn = document.createElement('button');
        playBtn.textContent = 'Play';
        playBtn.setAttribute('data-alarm-id', alarm.id);
        ['click', 'touchstart'].forEach(eventType => {
            playBtn.addEventListener(eventType, (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Play button pressed for alarm', alarm.id);
                playAlarm(alarm.audioBlob);
            }, { passive: false });
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.setAttribute('data-alarm-id', alarm.id);
        ['click', 'touchstart'].forEach(eventType => {
            cancelBtn.addEventListener(eventType, (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cancel button pressed for alarm', alarm.id);
                removeAlarm(alarm.id);
            }, { passive: false });
        });

        controlsDiv.appendChild(playBtn);
        controlsDiv.appendChild(cancelBtn);

        alarmItem.appendChild(timeSpan);
        alarmItem.appendChild(controlsDiv);

        alarmList.appendChild(alarmItem);
    });
}

// Event listeners - support both click and touch for mobile
function addEventListeners() {
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');
    const alarmForm = document.getElementById('alarm-form');

    if (!recordBtn || !stopBtn || !alarmForm) {
        console.error('Required elements not found');
        return;
    }

    // Add both click and touch events for mobile compatibility
    ['click', 'touchstart'].forEach(eventType => {
        recordBtn.addEventListener(eventType, (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Record button pressed');
            startRecording();
        }, { passive: false });

        stopBtn.addEventListener(eventType, (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Stop button pressed');
            stopRecording();
        }, { passive: false });
    });

    alarmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Form submitted');
        const timeInput = document.getElementById('alarm-time');
        const time = timeInput.value;
        if (time && currentAudioBlob) {
            addAlarm(time, currentAudioBlob);
            timeInput.value = '';
            currentAudioBlob = null;
            console.log('Alarm added successfully');
        } else {
            alert('Please record audio and set a time.');
        }
    });

    console.log('Event listeners added successfully');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app');
    addEventListeners();
});