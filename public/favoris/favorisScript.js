const favoriteTemplate = document.getElementById('favorite-template');
const alarmTemplate = document.getElementById('alarm-template');
const favoriteElement = document.getElementById('favorites');
const alarmElement = document.getElementById('alarm');
const connectionInAlarmClock = document.getElementById('alarm');
let favorisTab = [];
let favorisInAlarmClock;
const mainMenuSlideInn = document.querySelector('.menuDetails');
const menuButton = document.querySelector('.menu');
let isSLideInn = false;
const bannerTextButton = document.querySelector('.banner-text');

main()

async function main() {
    handleFavoris();
    menuButton.addEventListener('click', displayMenuFavoris);
    bannerTextButton.addEventListener('click',() => {
        window.location.href = '/body.html';
    });
}

async function handleFavoris() {
    try {
        favoriteElement.innerHTML = '';
        alarmElement.innerHTML = '';
        //récupérer les favoris dans le localStorage
        favorisTab = getFavoris();

    } catch (error) {
        console.error(error);
        favoriteElement.innerHTML = '<p>Aucun trajet favoris enregistré</p>';
    } finally {
        //récupérer le trajet mis dans l'alarme depuis le serveur (place dans la variable favorisInAlarmClock)
        await getTrainFromAlarmClock()
        console.log("train dans l'alarm: " +favorisInAlarmClock.name);
        //récupérer les informations de chaque favoris et les afficher
        getInfoFromFavoris(favorisTab, favorisInAlarmClock);
        //afficher les infos du favoris dans l'alarme
    }
}

//récupère les favoris dans le localStorage
function getFavoris() {
    //récupérer les favoris dans le localStorage
    let favoris = JSON.parse(localStorage.getItem('favoris'));
    console.log(favoris)
    if (favoris.length === 0) {
        console.log('Aucun trajet favoris enregistré')
        throw new Error('Aucun trajet favoris enregistré')
    } else {
        return favoris;
    }
}

//récupérer le trajet mis dans l'alarme depuis le serveur
async function getTrainFromAlarmClock() {
    return fetch("/getTrain/")
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur serveur');
            }
            return response.json();
        }).then(json => {
            favorisInAlarmClock = json;
    }).catch(e => console.error(e));
}

//récupère les informations de chaque favoris
function getInfoFromFavoris(favoris, favorisInAlarmClock) {
    if(favoris != null){
        for (let i = 0; i < favoris.length; i++) {
            const favori = favoris[i]
            const name = favori.name
            const departureTime = favori.departureTime
            const arrivalTime = favori.arrivalTime
            const stationDepartur = favori.stationDeparture
            const stationArrival = favori.stationArrival
            const duration = favori.duration
            displayFavoris(name, departureTime, arrivalTime, stationDepartur, stationArrival, duration)
        }
    }
    //afficher les infos du favoris dans l'alarme
    if (favorisInAlarmClock) {
        displayFavorisInAlarmClock(favorisInAlarmClock.name, favorisInAlarmClock.departureTime, favorisInAlarmClock.arrivalTime, favorisInAlarmClock.stationDeparture, favorisInAlarmClock.stationArrival, favorisInAlarmClock.duration);
    }
}


//affiche les infos de chaque favoris
function displayFavoris(name, departureTime, arrivalTime, stationDepartur, stationArrival, duration) {
    const clone = document.importNode(favoriteTemplate.content, true);
    clone.querySelector('.trainName').innerText = 'Nom du train: '+name;
    clone.querySelector('.departurePlaceHour').innerText = 'Départ: '+departureTime+', '+stationDepartur;
    clone.querySelector('.arrivalPlaceHour').innerText = 'Arrivée: '+arrivalTime+', '+stationArrival;
    clone.querySelector('.duration').innerText = 'Durée: '+duration +' minutes';
    const deleteFavorisButton = clone.querySelector('.remove-favorite-button');
    const sentToAlarmClockButton = clone.querySelector('.add-to-alarm-button');
    //supprime un favoris
    deleteFavorisButton.addEventListener('click', () => {
        console.log('delete favoris')
        deleteFavoris(name);
    });
    //envoie les informations d'un favoris à l'alarme
    sentToAlarmClockButton.addEventListener('click', () => {
        console.log('send to alarm clock')
        sendToAlarmClock(name, departureTime, arrivalTime, stationDepartur, stationArrival, duration);
        handleFavoris();
    });
    favoriteElement.appendChild(clone);
}
//affiche les infos du favoris dans l'alarme
function displayFavorisInAlarmClock(name, departureTime, arrivalTime, stationDepartur, stationArrival, duration) {
    if(name === 'Train par défaut'){
        alarmElement.innerHTML = '<p>Aucun trajet dans le réveil</p>';
        return;
    }
    const clone = document.importNode(alarmTemplate.content, true);
    clone.querySelector('.trainName').innerText = 'Nom du train: '+name;
    clone.querySelector('.departurePlaceHour').innerText = 'Départ: '+departureTime+', '+stationDepartur;
    clone.querySelector('.arrivalPlaceHour').innerText = 'Arrivée: '+arrivalTime+', '+stationArrival;
    clone.querySelector('.duration').innerText = 'Durée: '+duration +' minutes';
    connectionInAlarmClock.appendChild(clone);
}

//supprime un favoris
function deleteFavoris(name) {
    let favoris = JSON.parse(localStorage.getItem('favoris'));
    let index = favoris.findIndex(favoris => favoris.name === name);
    if (index !== -1) {
         favoris.splice(index, 1);
    }
    localStorage.setItem('favoris', JSON.stringify(favoris));
    handleFavoris();
}

//envoie les informations d'un favoris à l'alarme
async function sendToAlarmClock(name, departureTime, arrivalTime, stationDepartur, stationArrival, duration) {
    try {
        const train = {
            name: name,
            departureTime: departureTime,
            arrivalTime: arrivalTime,
            stationDeparture: stationDepartur,
            stationArrival: stationArrival,
            duration: duration
        }
        await fetch("/saveTrain/",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(train),
        }).then(response => {
            if(!response.ok){
                throw new Error('Erreur serveur');
            }
            return response.json();
        }).then(json=> console.log(json))
    } catch (e) {
        console.error(e);
    }
}

// affiche le menu des favoris

function displayMenuFavoris() {
    console.log('click');
    if(isSLideInn){
        mainMenuSlideInn.classList.remove('display');
        isSLideInn = false;
        return;
    }
    mainMenuSlideInn.classList.add('display');
    isSLideInn = true;
}