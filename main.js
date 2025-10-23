const immediateMessageCenter = document.querySelector(".Immediate-Notifications"); // Immediate messages div.
const commandInput = document.getElementById("command");

function textToNumbers(text) {
    let numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty one", "twenty two", "twenty three", "twenty four", "twenty five", "twenty six", "twenty seven", "twenty eight", "twenty nine", "thirty", "thirty one", "thirty two"];
    let knownNumbers = [];
    for(let i = 0; i < numbers.length; i++) {
        if(text.includes(numbers[i])) {
            knownNumbers.push(i);
        }
    }
    knownNumbers.sort((a, b) => b - a);
    return knownNumbers[0];
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
let speechState = "wakeword";

let libraryOfKnowledge = [];
let newKnowledge = {
    name: null,
    def: null
}
let newKnowledgeQuestion = 0;

let newScenarioQuestionnum = 0;
let newScenarioData = {
    month: null,
    day: null,
    hour: null,
    scenarioName: null
}
let scenarioList = [];

recognition.continuous = true; // Does it continuously listen?
recognition.lang = "en-US"; // Language
recognition.interimResults = false; // not sure
recognition.maxAlternatives = 1; // not sure

let timeSensing = {
    lastHour: null,
    currentHour: null,
    worldNow: null
}

function resetInput() {
    speechState = "wakeword";
    newScenarioData = {
        month: null,
        day: null,
        hour: null,
        scenarioName: null
    }
    newScenarioQuestionnum = 0;
    newKnowledgeQuestion = 0;
}

function beginTextToSpeech() {
    let button = document.getElementById("startVoice");
    button.remove();
    speakMessage("Voice Enabled");
}

function beginSpeechRecognition() {
    recognition.start();
}

recognition.onresult = (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
    console.log("Heard: " + transcript);
    console.log(e.results);

    if(speechState == "wakeword") {
        if(transcript.includes("star stream") || transcript.includes("starstream")) {
            speakMessage("The Star Stream awaits your request.");
            speechState = "request";
        }
    } else if(speechState == "request") {
        processAndAnswer(transcript);
    } else if(speechState == "setNewScenario") {
        handleScenarioCreation(transcript);
    } else if(speechState == "addtolibrary") {
        libraryAddHandler(transcript);
    }
};

function sendCommand() {
    if(speechState == "wakeword") {
        processAndAnswer(commandInput.value);
    } else if(speechState == "addtolibrary") {
        libraryAddHandler(commandInput.value);
    } else if(speechState == "openalibraryitem") {
        for(let i = 0; i < libraryOfKnowledge.length; i++) {
            if(commandInput.value.includes(libraryOfKnowledge[i].name.toLowerCase())) {
                newIndirectMessage(libraryOfKnowledge[i].name + ": " + libraryOfKnowledge[i].def);
                speechState = "wakeword";
                break;
            }
        }
        newIndirectMessage("The Library of Knowledge has been closed.");
    } else if(speechState == "setNewScenario") {
        handleScenarioCreation(commandInput.value);
    }
    commandInput.value = "";
}

function handleScenarioCreation(input) {
    let questions = ["For what month?", "For what day of the month?", "For what hour?", "What is this scenario called?"];

    switch(newScenarioQuestionnum) {
        case 0:
            newScenarioData.month = parseInt(input);
            if(!newScenarioData.month) {
                newScenarioData.month = textToNumbers(input);
            }
            if(newScenarioData.month >= 0 && newScenarioData.month <= 12) {
                newScenarioQuestionnum += 1;
            }
            break;
        case 1:
            let dayNum = parseInt(input);
            if(!dayNum) { // This means that it returned null, it's probably a word number
                dayNum = textToNumbers(input);
            }
            if(dayNum >= 1 && dayNum <= 31) {
                newScenarioData.day = dayNum;
                newScenarioQuestionnum += 1;
            } else {
                speakMessage("You must set an appropriate day. A number.");
            }
            break;
        case 2:
            let hourNum = parseInt(input);
            if(!hourNum) {
                hourNum = textToNumbers(input);
            }
            if(hourNum >= 0 && hourNum <= 23) {
                newScenarioData.hour = hourNum;
                newScenarioQuestionnum += 1;
            } else {
                speakMessage("The hour must be between 0 and 23.");
            }
            break;
        case 3:
            let scenarioName = input;
            newScenarioData.scenarioName = scenarioName;
            newIndirectMessage("You will receive a system message when the scenario, " + scenarioName + ", begins.");
            scenarioList.push(newScenarioData);
            console.log(scenarioList);
            resetInput();
            break;
    }
    newIndirectMessage(questions[newScenarioQuestionnum]);
    console.log(newScenarioData);
}

function libraryAddHandler(input) {
    let questions = ["What is the name of the thing you wish to add?", "Define it."];
    if(newKnowledgeQuestion == 0) {
        newKnowledge.name = input;
    } else if(newKnowledgeQuestion == 1) {
        newKnowledge.def = input;
        libraryOfKnowledge.push(newKnowledge);
        speechState = "wakeword";
        newIndirectMessage("New item, " + newKnowledge.name + " has been added to the Library of Knowledge");
        return;
    }
    newKnowledgeQuestion += 1;
    newIndirectMessage(questions[newKnowledgeQuestion]);
}

function processAndAnswer(command) {
    if(command.includes("give me") && command.includes("scenario information")) {
        newIndirectMessage("The time is currently " + getDirectTime("time") + ". It is a " + getDirectTime("day"));
    } else if(command.includes("give me") && command.includes("date")) {
        // Later, we will use this command to tell us the date of upcoming scenarios
        newIndirectMessage("Today is " + getDirectTime("month") + " " + getDirectTime("numberday") + ". It is a " + getDirectTime("day"))
    } else if(command.includes("set") && command.includes("upcoming scenario")) {
        speechState = "setNewScenario";
        newScenarioQuestionnum = 0;
        newScenarioData = {
            month: null,
            day: null,
            hour: null,
            scenarioName: null
        };
        newIndirectMessage("For what month?");
        return;
    } else if(command.includes("open") && command.includes("library of knowledge")) {
        if(libraryOfKnowledge.length > 0) {
            let items = "You can open ";
            for(let i = 0; i < libraryOfKnowledge.length; i++) {
                items = items + (i + 1) + ": " + libraryOfKnowledge[i].name + ", ";
            }
            newIndirectMessage("You have opened the Library of Knowledge." + items);
            speechState = "openalibraryitem";
        } else {
            newIndirectMessage("The Library of Knowledge is empty.");
        }
    } else if(command.includes("add to") && command.includes("library of knowledge")) {
        speechState = "addtolibrary";
        newKnowledgeQuestion = 0;
        newKnowledge = {
            name: null,
            def: null
        }
        newIndirectMessage("What is the name of the thing you wish to add?");
        return;
    }
    speechState = "wakeword";
}

function speakMessage(msg) {
    if(!("speechSynthesis" in window)) {
        console.log("Voice not applicable");
    } else {
        console.log("Voice allowed");
    }
    let spoken = new SpeechSynthesisUtterance(msg);
    spoken.rate = 1;
    spoken.pitch = 1.1;
    spoken.volume = 1;
    window.speechSynthesis.speak(spoken);
}

function senseTime() {
    timeSensing.worldNow = new Date();
    timeSensing.currentHour = timeSensing.worldNow.getHours();

    if(timeSensing.currentHour !== timeSensing.lastHour) {
        // Send a message to tell what time it is
        timeSensing.lastHour = timeSensing.currentHour;
        newIndirectMessage("The time is " + timeSensing.currentHour);
    }
}

function getDirectTime(req) {
    timeSensing.worldNow = new Date();
    timeSensing.currentHour = timeSensing.worldNow.getHours();
    let minutes = timeSensing.worldNow.getMinutes();
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if(minutes < 10) {
        minutes = "0" + minutes;
    }

    if(req == "time") return(`${timeSensing.currentHour}:${minutes}`);
    if(req == "day") return days[timeSensing.worldNow.getDay()];
    if(req == "month") return months[timeSensing.worldNow.getMonth()];
    if(req == "numberday") return timeSensing.worldNow.getDate();
}

function newIndirectMessage(msg) {
    let message = document.createElement("div");
    message.innerHTML = msg;
    immediateMessageCenter.prepend(message);
    speakMessage(msg);
}

newIndirectMessage("bibitybobityboo");
setInterval(senseTime, 300000); // Check time every 5 minutes.
