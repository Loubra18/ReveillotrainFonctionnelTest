let departureStation = document.getElementById('departureStation');
let arrivalStation = document.getElementById('arrivalStation');
const searchButton = document.getElementById('searchButton');
let dropdownDeparture = document.getElementById('dropdownDeparture');
let dropdownArrival = document.getElementById('dropdownArrival');
let searchInputDeparture ;
let searchInputArrival ;
const resultContainer = document.querySelector('.result-container');
const trainTemplate = document.getElementById('train-template');
let loadingLogo = document.getElementById('loading');
const mainMenuSlideInn = document.querySelector('.menuDetails');
const menuButton = document.querySelector('.menu');
let isSLideInn = false;
const bannerTextButton = document.querySelector('.banner-text');
const loadingContainer = document.getElementById('loading-container');

main();

async function main() {
    // Configuration de flatpickr pour sélectionner la date et l'heure
    const dateTimePicker = flatpickr("#datetimePicker", {
        enableTime: true,
        dateFormat: "d-m-Y H:i",
        time_24hr: true,
        altInput: true,
        altFormat: "d-m-Y H:i",
        defaultDate: new Date(),
    });
    //affichage des stations correspondantes à la recherche
    departureStation.addEventListener('focus',  function () {
        dropdownDeparture.classList.add('show');
    });
    departureStation.addEventListener('blur', function() {
        dropdownDeparture.classList.remove('show');
    });

    arrivalStation.addEventListener('focus', function() {
        dropdownArrival.classList.add('show');
    });
    arrivalStation.addEventListener('blur', function() {
        dropdownArrival.classList.remove('show');
    });
    menuButton.addEventListener('click', displayMenu);

    bannerTextButton.addEventListener('click',() => {
        window.location.href = '/body.html';
    });


    //affichage des stations correspondantes à la recherche
    departureStation.addEventListener('input', getValueDepartureStation);
    //affichage des stations correspondantes à la recherche
    arrivalStation.addEventListener('input', getValueArrivalStation);
    //lancement de la recherche des trains disponibles pour le trajet
    searchButton.addEventListener('click', getTrainAvailable(dateTimePicker));
}


function showLoading() {
    loadingContainer.style.display = 'block';
}

function hideLoading() {
    loadingContainer.style.display = 'none';

}
//affiche les trains dispo pour ce trajet
function getTrainAvailable(dateTimePicker) {
    return async function () {
        try {
            showLoading();
            resultContainer.innerHTML = '';
            loadingLogo.style.display = 'block';
            const dateObject = dateTimePicker.selectedDates[0];
            const formattedDate = dateObject ? (dateObject.toLocaleDateString().slice(0, 6).replace(/\//g, '') + dateObject.getFullYear().toString().slice(-2)) : '';
            const formattedTime = dateObject ? dateObject.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', '') : '';
            console.log("dans la fonction getTrainAvailable (Départ, Arrivée,jours, heure)"+searchInputDeparture, searchInputArrival,formattedDate, formattedTime);
            //const response = await fetch(`https://api.irail.be/connections/?from=${searchInputDeparture}&to=${searchInputArrival}&date=${formattedDate}&time=${formattedTime}&timesel=departure&format=json&lang=en&typeOfTransport=automatic&alerts=false&results=6`);
            const response = await fetch(`https://api.irail.be/v1/connections/?from=${searchInputDeparture}&to=${searchInputArrival}&date=${formattedDate}&time=${formattedTime}&timesel=departure&format=json&lang=en&typeOfTransport=automatic&alerts=false&results=6`);
            const data = await response.json();
            loadingLogo.style.display = 'none';
            console.log(data);
            // Afficher les informations sur les connexions disponibles
            displayInformationConnection(data);

        } catch (err) {
            if(err === 'TypeError: Failed to fetch'){
                loadingLogo.style.display = 'none';
                alert('Erreur de connexion au serveur, veuillez réessayer plus tard');
                window.location.reload();
            }
            if(err === 'SyntaxError: Unexpected end of JSON input'){
                loadingLogo.style.display = 'none';
                alert('Aucuns trains ne correspondent à votre recherche :', err);
                window.location.reload();
            }
            else {
                loadingLogo.style.display = 'none';
                alert('Erreur :', err);
                window.location.reload();
            }
        } finally {
            hideLoading();
        }
    };
}

async function getValueDepartureStation() {
    //récupérer le nom de la gare de départ
    searchInputDeparture = departureStation.value.toUpperCase();
    //si la taille de la recherche est supérieure à 2
    if(searchInputDeparture.length > 0) {
        //on recherche les gares correspondantes
        searchStationData(departureStation.value, dropdownDeparture);
    }

}

async function getValueArrivalStation() {
    searchInputArrival = arrivalStation.value.toUpperCase();

    if(searchInputArrival.length > 0) {
        searchStationData(arrivalStation.value, dropdownArrival);
    }

}

//récupérer les 6 premiers noms des stations correspondantes à la recherche
async function searchStationData(search, dropdown) {
    try {
        const response = await fetch(`/searchStation/${search}`);
        const data = await response.json();
        //on place les noms des stations dans le dropdown
        displayStationNameInDropdown(data, dropdown);

        console.log(data);
    } catch (error) {
        console.error('Erreur :', error);
    }
}

function displayStationNameInDropdown(data, dropdown) {
    console.log('dans displayStationNameInDropdown');
    //on vide le dropdown
    dropdown.innerHTML = '';
    //on place les noms des stations dans le dropdown
    data.forEach(station => {
        console.log("station " + station);
        const option = document.createElement('a');
        option.textContent = station;
        option.href = '#';

        // Ajout de l'événement click pour chaque station
        option.addEventListener('mousedown', function (event) {
            console.log("dans l'eventListener, click sur une gare.");
            // Mise à jour de la valeur de l'input
            if (dropdown === dropdownDeparture) {
                departureStation.value = station;
                getValueDepartureStation();
            } else if (dropdown === dropdownArrival) {
                arrivalStation.value = station;
                getValueArrivalStation();
            }
            dropdown.classList.remove('show');
            event.preventDefault();
        });

        // Ajout de l'option au dropdown
        dropdown.appendChild(option);
    });

    // Ajout d'un événement click sur le dropdown lui-même pour la délégation
    dropdown.addEventListener('click', function (event) {
        if (event.target.tagName === 'A') {
            // Si l'élément cliqué est une balise 'a' (lien), déclencher l'événement
            event.target.click();
        }
    });
}

function displayInformationConnection(data){
    try {
        // Parcourir le tableau de connexions
        data.connection.forEach((conn, index) => {
            const trainName = conn.departure.vehicle; // Nom du train (par exemple, 'BE.NMBS.IC3233')
            const departureTime = parseTimeUnixToTimeHuman(conn.departure.time); // Heure de départ de la gare de départ et conversion en heure humaine
            const departureStation = conn.departure.station; // Nom de la gare de départ
            const platformDepartureStation = conn.departure.platform; // Numero de la voie de départ
            const arrivalTime = parseTimeUnixToTimeHuman(conn.arrival.time); // Heure d'arrivée à la gare de destination
            const arrivalStation = conn.arrival.station; // Nom de la gare de destination
            const platformArrivalStation = conn.arrival.platform; // Numero de la voie d'arrivée
            const arrivalDelay = convertSecondsToMinutes(conn.arrival.delay); // Délai éventuel à l'arrivée
            const departureDelay = convertSecondsToMinutes(conn.departure.delay); // Délai éventuel au départ
            const duration = convertSecondsToMinutes(conn.duration); // Durée du trajet
            const canceled = conn.arrival.canceled;// Annulation du train
            console.log("Value of canceled : "+canceled);
            //creation des carte pour chaque train depuis un template
            addTrain(canceled, trainName, departureTime, arrivalTime, departureStation, platformDepartureStation, arrivalStation, platformArrivalStation, arrivalDelay, departureDelay, duration);
        });
    }catch (error) {
        alert('Aucuns trains ne correspondent à votre recherche :', error);
    }
}

function parseTimeUnixToTimeHuman(time) {
    return new Date(time * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    console.log("TimeUnix in Time Human"+time);
}

function convertSecondsToMinutes(delayInSeconds) {
    return delayInSeconds / 60;
}

//fonction qui ajoutera les infos dans l'html

function addTrain(canceled, name, departureTime, arrivalTime, stationDeparture, platformDeparture, stationArrival, platformArrival, arrivalDelay, departureDelay, duration ) {
    console.log("dans addTrain");
    const clone = document.importNode(trainTemplate.content, true);
    clone.querySelector('.train-name').innerText = name;
    clone.querySelector('.timeDeparture').innerText = departureTime;
    clone.querySelector('.timeArrival').innerText = arrivalTime;
    clone.querySelector('.departure-gare').innerText = stationDeparture;
    clone.querySelector('.platform-departure').innerText = 'Voie '+ platformDeparture;
    clone.querySelector('.arrival-gare').innerText = stationArrival;
    clone.querySelector('.platform-arrival').innerText = 'Voie '+platformArrival;
    clone.querySelector('.delay').innerText = '+'+arrivalDelay;
    clone.querySelector('.departure-delay').innerText = '+'+departureDelay;
    if(arrivalDelay === 0){
        clone.querySelector('.delay').style.display = 'none';
    }
    if(departureDelay === 0){
        clone.querySelector('.departure-delay').style.display = 'none';
    }
    if(canceled === '1'){
        clone.querySelector('.train-status').innerText = 'Annulé';
    }
    const favoris = clone.querySelector('.favorite-btn');

    favoris.addEventListener('click', function() {
        try{
            addToFavoris({name, departureTime, arrivalTime, stationDeparture, stationArrival, duration});
            showNotification('Train ajouté aux favoris', 'success');
        } catch (error) {
            console.error('Erreur :', error);
            showNotification('Train déjà dans les favoris', 'error');
        }
    });


    resultContainer.appendChild(clone);
}

//affichage pop-up ajout favoris

function showNotification(text, type) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');

    notificationText.textContent = text;
    if(type === 'error') {
        notification.classList.add('error');
    }else{
        notification.classList.add('show');
    }

    // Hide the notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

//ajout dans le local storage des train favoris quand on clique sur le bouton favoris
function addToFavoris(train) {
    //crée un tableau si il n'existe pas et ajoute le train
    let favoris = JSON.parse(localStorage.getItem('favoris')) || [];

    if(isFavorite(train.name)){
        console.log('Train déjà dans les favoris');
        throw new Error('Train déjà dans les favoris');
    }
    favoris.push(train);
    localStorage.setItem('favoris', JSON.stringify(favoris));
    console.log('Train ajouté aux favoris');
}

// Vérifier si un trajet est déjà en favoris (renvoie true si c'est le cas, sinon false)
function isFavorite(trainName) {
    console.log('dans isFavorite');
    // Récupérer les favoris du local storage
    let tabFavoris = JSON.parse(localStorage.getItem('favoris')) || [];

    // Vérifier si le trajet est déjà en favoris
    return tabFavoris.some(favoris => favoris.name === trainName);
}

//afficher le menu de navigation
function displayMenu() {
    if(isSLideInn){
        mainMenuSlideInn.classList.remove('display');
        isSLideInn = false;
        return;
    }
    mainMenuSlideInn.classList.add('display');
    isSLideInn = true;
}

