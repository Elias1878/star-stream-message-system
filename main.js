const immediateMessageCenter = document.querySelector(".Immediate-Notifications"); // Immediate messages div.
const commandInput = document.getElementById("command");

class User {
    constructor() {
        this.position = {
            lat: null,
            long: null
        }
        this.loggedAreas = [];
        this.areaLogQuestion = 0;
        this.newAreaParams = {
            name: null,
            position: {
                lat: null,
                long: null
            },
            radius: null
        };
        this.newAreaQuestions = ["What is the name of this place?", "What is the radius, in meters?"];
        this.retry = false;

        this.name = null;
        this.timesTried = 0;
    }

    resetNewArea() {
        this.retry = false;
        this.areaLogQuestion = 0;
        this.newAreaParams = {
            name: null,
            position: {
                lat: null,
                long: null
            },
            radius: null
        };
    }

    newAreaHandler(input) {
        console.log("input");
        if(this.areaLogQuestion == 0) {
            this.newAreaParams.name = input;
        } else {
            this.newAreaParams.radius = parseInt(input);
            if(!this.newAreaParams.radius || this.newAreaParams.radius == 0) {
                this.newAreaParams.radius = textToNumbers(input);
            }
        }
        this.areaLogQuestion += 1;
        if(this.areaLogQuestion > 1) {
            if((!this.position.lat || !this.position.long) && !this.retry) {
                newIndirectMessage("Error when creating a new area: Your position wasn't found. I recommend waiting around 3 minutes before trying again.");
                resetInput();
                return;
            } else {
                this.newAreaParams.position.lat = this.position.lat;
                this.newAreaParams.position.long = this.position.long;
            }
            resetInput();
            newIndirectMessage("The new area, " + this.newAreaParams.name + ", has been logged.");
            this.createNewArea(this.newAreaParams.name, this.newAreaParams.position, this.newAreaParams.radius);
            return;
        }
        newIndirectMessage(this.newAreaQuestions[this.areaLogQuestion]);
    }
    
    getPosition(pos) {
        this.position.lat = pos.coords.latitude;
        this.position.long = pos.coords.longitude;
        this.timesTried += 1;
        
        // If it's not accurate enough:
        if(pos.coords.accuracy > 200 && this.timesTried < 3) {
            setTimeout(() => locationHandlerSystem(true), 5000); // It'll try again in 5 seconds with better accuracy.
        }
    }

    createNewArea(name, pos, radius) {
        this.loggedAreas.push({
            name: name,
            position: pos,
            radius: radius
        });
    }
}

let mainUser = new User();

function textToNumbers(text) {
    let numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty one", "twenty two", "twenty three", "twenty four", "twenty five", "twenty six", "twenty seven", "twenty eight", "twenty nine", "thirty", "thirty one", "thirty two", "thirty three", "thirty four", "thirty five", "thirty six", "thirty seven", "thirty eight", "thirty nine", "fourty"];
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
const SPEECH_PAUSE = 400;
let speechState = "wakeword";

recognition.onend = () => {
    recognition.start();
}

let libraryOfKnowledge = [{name: " bird", def: " a flying organism"}];
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
    console.log("Trimmed: " + transcript.trim());
    console.log(e.results);

    if(transcript.includes("star stream") && transcript.includes("be silent")) {
        window.speechSynthesis.cancel();
        return;
    }

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
    } else if(speechState == "openalibraryitem") {
        libraryOpenHandler(transcript);
    } else if(speechState == "createnewarea") {
        console.log("new area being created");
        mainUser.newAreaHandler(transcript);
    } else if(speechState == "deleteanarea") {
        deleteAreaHandler(transcript);
    } else if(speechState == "deletelokitem") {
        deleteItemFromLibraryHandler(transcript);
    } 
};

function libraryOpenHandler(transcript) {
    let input = transcript.trim();
    console.log(libraryOfKnowledge);
    let item = null;
    for(let i = 0; i < libraryOfKnowledge.length; i++) {
        if(input.includes(libraryOfKnowledge[i].name.trim())) {
            item = i; // Index
        }
    }
    if(item !== null) {
        newIndirectMessage(libraryOfKnowledge[item].name + ". " + libraryOfKnowledge[item].def);
    } else {
        newIndirectMessage("This item does not exist in the Library of Knowledge");
    }
    speechState = "wakeword";
}

function sendCommand() {
    if(speechState == "wakeword") {
        processAndAnswer(commandInput.value);
    } else if(speechState == "addtolibrary") {
        libraryAddHandler(commandInput.value);
    } else if(speechState == "setNewScenario") {
        handleScenarioCreation(commandInput.value);
    } else if(speechState == "addtolibrary") {
        libraryAddHandler(commandInput.value);
    } else if(speechState == "openalibraryitem") {
        libraryOpenHandler(commandInput.value);
    } else if(speechState == "createnewarea") {
        console.log("new area being created");
        mainUser.newAreaHandler(commandInput.value);
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
            if(newScenarioData.month >= 0 && newScenarioData.month < 12) {
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
            return;
    }
    newIndirectMessage(questions[newScenarioQuestionnum]);
    console.log(newScenarioData);
}

function getDistanceToPoint(lat1, lat2, lon1, lon2) {
    // Convert from degrees to radians
    let la1 = lat1 * Math.PI / 180;
    let la2 = lat2 * Math.PI / 180;

    // Calculate differences in radians
    let dla = (lat2 - lat1) * Math.PI / 180;
    let dlo = (lon2 - lon1) * Math.PI / 180;

    // Haversine formula.
    let a = Math.sin(dla / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dlo / 2) ** 2;

    // Convert a into the central angle
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Earth's radius
    let r = 6371e3;

    let distance = r * c;
    return distance;
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

function processAndAnswer(input) {
    let command = input.trim();
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
            newIndirectMessage("You have opened the Library of Knowledge. " + items);
            speechState = "openalibraryitem";
            return;
        } else {
            newIndirectMessage("The Library of Knowledge is empty.");
        }
    } else if(command.includes("add") && command.includes("to") && command.includes("library of knowledge")) {
        speechState = "addtolibrary";
        newKnowledgeQuestion = 0;
        newKnowledge = {
            name: null,
            def: null
        }
        newIndirectMessage("What is the name of the thing you wish to add?");
        return;
    } else if(command.includes("tell me") && command.includes("my") && command.includes("position")) {
        newIndirectMessage("Your current position. Latitude: " + mainUser.position.lat + ", Longitude: " + mainUser.position.long);
    } else if(command.includes("log") && command.includes("new") && command.includes("area")) {
        mainUser.resetNewArea();
        newIndirectMessage("You are logging a new area. " + mainUser.newAreaQuestions[mainUser.areaLogQuestion]);
        speechState = "createnewarea";
        return;
    } else if((command.includes("tell me") || command.includes("what is")) && (command.includes("distance") || command.includes("far")) && command.includes("from")) {
        // Possibly asking their distance from a place.
        locationHandlerSystem(true);
        setTimeout(() => { getDistanceFromAreas(command)}, 1500);
    } else if(command.includes("open") && command.includes("area list")) {
        let arealen = mainUser.loggedAreas.length;
        // Getting every single area and name
        let arealist = "";
        for(let i = 0; i < arealen; i++) {
            arealist = arealist + (i + 1) + ": " + mainUser.loggedAreas[i].name + ". ";
        }

        if(arealen > 0) {
            newIndirectMessage("You have " + arealen + " areas. Here is the list in its entirety: " + arealist);
        } else {
            newIndirectMessage("You have " + arealen + " areas.");
        }
    } else if(command.includes("delete")) {
        if(command.includes("area")) {
            speechState = "deleteanarea";
            newIndirectMessage("Which area do you want to delete? If you don't know, open the area list to find the name.");
            return;
        } else if((command.includes("item") || command.includes("something")) && command.includes("library of knowledge")) {
            speechState = "deletelokitem";
            newIndirectMessage("Which item do you want to delete? If you don't know, open the Library Of Knowledge to find the name.");
            return;
        } else if(command.includes("scenario")) {
            // We're gonna try doing something simpler for this one. So that word choice doesn't have to matter completely
            if(command.match(/\bcancel\b/)) {
                resetInput();
            } else {
                let targetscen = null;
                let targetindex = null;
                for(let i = 0; i < scenarioList.length; i++) {
                    let currentScen = scenarioList[i];
                    let currentScenName = (currentScen.scenarioName.trim()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

                    let itemRegex = new RegExp(`\\b${currentScenName}\\b`, "i");

                    if(command.match(itemRegex)) {
                        targetscen = currentScen;
                        targetindex = i;
                        break;
                    }
                }

                if(targetscen) {
                    console.log(targetscen);
                    newIndirectMessage("The item, " + targetscen.name + ", has been deleted from the Scenario List.");
                    scenarioList.splice(targetindex, 1);
                    resetInput();
                }
            }
        }
    }
    speechState = "wakeword";
}

function deleteItemFromLibraryHandler(input) {
    if(input.match(/\bcancel\b/)) {
        resetInput();
    } else {
        let targetitem = null;
        let targetindex = null;
        for(let i = 0; i < libraryOfKnowledge.length; i++) {
            let currentItem = libraryOfKnowledge[i];
            let currentItemName = (currentItem.name.trim()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            let itemRegex = new RegExp(`\\b${currentItemName}\\b`, "i");

            if(input.match(itemRegex)) {
                targetitem = currentItem;
                targetindex = i;
                break;
            }
        }

        if(targetitem) {
            libraryOfKnowledge.splice(targetindex, 1);
            newIndirectMessage("The item, " + targetitem.name + ", has been deleted from the Library of Knowledge.");
            resetInput();
        }
    }
}

function deleteAreaHandler(input) {
    if(input.includes("cancel")) {
        resetInput();
    } else {
        let targetArea = null;
        let targetindex = null;
        for(let i = 0; i < mainUser.loggedAreas.length; i++) {
            let currentArea = mainUser.loggedAreas[i];
            let currentAreaName = currentArea.name.trim();
            currentAreaName = currentAreaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            let areaRegex = new RegExp(`\\b${currentAreaName}\\b`, "i");

            if(input.match(areaRegex)) {
                targetArea = {
                    name: currentArea.name,
                    position: currentArea.position,
                    radius: currentArea.radius
                }
                targetindex = i;
                break;
            }
        }
        if(targetArea) {
            mainUser.loggedAreas.splice(targetindex, 1);
            newIndirectMessage("The area, " + targetArea.name + ", has been deleted.");
        } else {
            newIndirectMessage("Couldn't find that area.");
        }
        resetInput();
    }
}

function getDistanceFromAreas(input) {
    let targetArea = null;
    for(let i = 0; i < mainUser.loggedAreas.length; i++) {
        let currentArea = mainUser.loggedAreas[i];
        let currentAreaName = currentArea.name.trim();
        currentAreaName = currentAreaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        let areaRegex = new RegExp(`\\b${currentAreaName}\\b`, "i");

        if(input.match(areaRegex)) {
            targetArea = {
                name: currentArea.name,
                position: currentArea.position,
                radius: currentArea.radius
            }
            break;
        }
    }
    if(targetArea) {
        // Get the distance.
        let dist = Math.round(getDistanceToPoint(mainUser.position.lat, targetArea.position.lat, mainUser.position.long, targetArea.position.long));
        newIndirectMessage("You are " + dist + " meters away from " + targetArea.name);
    } else {
        newIndirectMessage("There is no area with that name.");
    }
}

function speakMessage(msg) {
    if(!("speechSynthesis" in window)) {
        console.log("Voice not applicable");
    } else {
        console.log("Voice allowed");
    }

    let splitMessage = msg.split(/(?<=[.!?])\s+/)

    console.log(splitMessage);

    let i = 0;

    function next() {
        if(i >= splitMessage.length) return; // Stop if the entire thing has been said

        let spoken = new SpeechSynthesisUtterance(splitMessage[i]);
        spoken.rate = 0.9;
        spoken.pitch = 1;
        spoken.volume = 1;
        window.speechSynthesis.speak(spoken);

        spoken.onend = () => {
            i++;
            setTimeout(next, SPEECH_PAUSE);
        };
    }

    next();
}

function senseTime() {
    timeSensing.worldNow = new Date();
    timeSensing.currentHour = timeSensing.worldNow.getHours();

    // Getting upcoming scenario information
    for(let i = 0; i < scenarioList.length; i++) {
        let scen = scenarioList[i];
        if(scen.month == timeSensing.worldNow.getMonth()) {
            if(scen.day == timeSensing.worldNow.getDate()) {
                // The scenario is happening today
                if(timeSensing.currentHour < scen.hour && scen.hour - timeSensing.currentHour < 2) {
                    newScenarioMessage("reminder", scen.scenarioName, new Date(timeSensing.worldNow.getFullYear(), scen.month, scen.day, scen.hour, 0));
                }
            }
        }
    }

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
}

function locationHandlerSystem(enablehighaccuracy = false) {
    navigator.geolocation.getCurrentPosition(mainUser.getPosition.bind(mainUser), (err) => {
        console.log("Error, couldn't see position: " + err.code);
    }, {enableHighAccuracy: enablehighaccuracy, maximumAge: 60000, timeout: 10000});
}

function newIndirectMessage(msg) {
    let message = document.createElement("div");
    message.innerHTML = msg;
    immediateMessageCenter.prepend(message);
    speakMessage(msg);
}

function newScenarioMessage(mode, title, timeodate) {
    let message = document.createElement("div");
    message.style.border = "2px solid white";
    message.id = "scenario-message";
    if(mode == "reminder") {
        // Getting the time between now and the wanted time.
        let timeDifference = timeodate.getTime() - timeSensing.worldNow.getTime();
        // Time difference is in milliseconds, so we have to convert it.
        let hours = Math.floor(timeDifference / (1000 * 60 * 60));
        let minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        // Creating the scenario box
        let scenhead = document.createElement("h2");
        scenhead.innerHTML = "Upcoming Scenario - " + title;
        let scentimer = document.createElement("div");
        scentimer.innerHTML = "Begins in " + hours + ":" + minutes;
        let scenduration = document.createElement("div");
        scenduration.innerHTML = "Duration - 1 hour";
        message.appendChild(scenhead);
        message.appendChild(scenduration);
        message.appendChild(scentimer);
        // Speak though voice synthesis
        speakMessage("Upcoming Scenario: " + title + " begins in " + hours + " hours and " + minutes + " minutes");
    }
    immediateMessageCenter.prepend(message);
}

newIndirectMessage("bibitybobityboo");
setInterval(senseTime, 60000); // Check time every minute.
setInterval(locationHandlerSystem, 30000); // Check location every three minutes. May be changed for testing sometimes.
locationHandlerSystem(true);
