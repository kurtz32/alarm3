// Global variables
let alarms = [];
let mediaRecorder;
let recordedChunks = [];
let currentAudioBlob = null;

// Update current time display
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
}

// Start updating time
setInterval(updateTime, 1000);
updateTime(); // Initial call

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
    alarmList.innerHTML = '';

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
        playBtn.onclick = () => playAlarm(alarm.audioBlob);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => removeAlarm(alarm.id);

        controlsDiv.appendChild(playBtn);
        controlsDiv.appendChild(cancelBtn);

        alarmItem.appendChild(timeSpan);
        alarmItem.appendChild(controlsDiv);

        alarmList.appendChild(alarmItem);
    });
}

// Event listeners
document.getElementById('record-btn').addEventListener('click', startRecording);
document.getElementById('stop-btn').addEventListener('click', stopRecording);

document.getElementById('alarm-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const timeInput = document.getElementById('alarm-time');
    const time = timeInput.value;
    if (time && currentAudioBlob) {
        addAlarm(time, currentAudioBlob);
        timeInput.value = '';
        currentAudioBlob = null;
    } else {
        alert('Please record audio and set a time.');
    }
});