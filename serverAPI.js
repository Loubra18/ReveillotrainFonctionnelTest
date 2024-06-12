const express = require('express');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const {response} = require("express");

// Définir le chemin complet des répertoires publics
const publicMainIndexPath = path.join(__dirname, 'public', 'mainIndex');
const publicFavorisPath = path.join(__dirname, 'public', 'favoris');
const publicAboutPath = path.join(__dirname, 'public', 'about');

// Utiliser express.static() avec les chemins complets
app.use(express.static(publicMainIndexPath));
app.use(express.static(publicFavorisPath));
app.use(express.static(publicAboutPath));
app.use(express.json());

const db = new sqlite3.Database('src/DataBase/gare.db');
const favoris = new sqlite3.Database('src/DataBase/favoris.db');

// Créer la table trainsFavoris
favoris.run(`
    CREATE TABLE IF NOT EXISTS trainsFavoris (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        departureTime TEXT,
        arrivalTime TEXT,
        stationDeparture TEXT,
        stationArrival TEXT,
        duration TEXT
    )
`, function(err) {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Table trainsFavoris created successfully');
        // Initialiser des valeurs par défaut
        const defaultValues = [0, 'Train par défaut', '00:00', '00:00', 'Gare par défaut', 'Gare par défaut', '00:00'];
        favoris.run(`
            INSERT OR IGNORE INTO trainsFavoris (id, name, departureTime, arrivalTime, stationDeparture, stationArrival, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, defaultValues, function(err) {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Default values inserted successfully');
            }
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','mainIndex', 'body.html'));
});

app.get('/allStation', (req, res) => {
    db.all('SELECT name FROM stations', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Erreur serveur');
        } else {
            // Renvoyer les noms des gares en tant que réponse JSON
            const stationNames = rows.map(row => row.name);
            res.json(stationNames);
        }
    });
});


//http://localhost:3000/searchStation/bruxelles
//récupérer les nom des stations correspondantes à la recherche
app.get('/searchStation/:search', (req, res) => {
    const search = req.params.search.trim();

    const query = `
        SELECT * FROM stations
        WHERE name LIKE ?
        ORDER BY name ASC
        LIMIT 6
    `;

    // Only match station names that start with the search term
    const params = [search + '%'];

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Erreur serveur');
        } else {
            // Renvoyer les noms des gares en tant que réponse JSON
            const stationNames = rows.map(row => row.name);
            res.json(stationNames);
        }
    });
});

//le serveur recoit le trains et l'enregistre dans une base de données (toujours 1 seule trajet dans la db)

app.post('/saveTrain', (req, res) => {
    const train = req.body;
    console.log(train);
    const query = `
        INSERT OR REPLACE INTO trainsFavoris (id, name, departureTime, arrivalTime, stationDeparture, stationArrival, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [0, train.name, train.departureTime, train.arrivalTime, train.stationDeparture, train.stationArrival, train.duration];

    favoris.run(query, params, function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Erreur serveur');
        } else {
            res.json({ id: this.lastID });
        }
    });
});

//récupérer le trajet mis dans l'alarme depuis le serveur en tant que JSON
app.get('/getTrain/', (req, res) => {
    favoris.get('SELECT * FROM trainsFavoris', (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Erreur serveur');
        } else {
            res.json(row);
        }
    });
});

//endpoint pour l'arduino qui récupère les informations du favoris
app.get('/getTrainForArduino/', (req, res) => {
    favoris.get('SELECT * FROM trainsFavoris', async (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Erreur serveur');
        } else {
            const response = await callTrainInfoEndpoint(row.name, row.departureTime, row.stationDeparture, row.stationArrival, row.duration, row.arrivalTime);
            res.json(response);
        }
    });
});

//exemple de requête pour récupérer les informations d'un train pour l'arduino
//const response = await fetch('https://api.irail.be/vehicle/?id=${name}%27%27&format=json&lang=en&alerts=true');

async function callTrainInfoEndpoint(name, departureTime, stationDeparture, stationArrival, duration, arrivalTime) {
    const reformatedDepartureTime = reformatTime(departureTime);
    console.log('From, To, At '+stationDeparture, stationArrival, reformatedDepartureTime);
    const data = await fetch(`https://api.irail.be/connections/?from=${stationDeparture}&to=${stationArrival}&time=${reformatedDepartureTime}&timesel=departure&format=json&lang=en&typeOfTransport=automatic&alerts=false&results=1`)
    const train = await data.json();
    let trainJSON = {
        name: name,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        stationDeparture: stationDeparture,
        stationArrival: stationArrival,
        duration: duration,
        delayDeparture: convertSecondsToMinutes(train.connection[0].departure.delay),
        delayArrival: convertSecondsToMinutes(train.connection[0].arrival.delay),
        alert: train.connection[0].alerts.lead,
    }
    console.log('json modifié pour arduino'+trainJSON);
    return trainJSON;
}

//reformate le temps pour appeller correctement l'api
function reformatTime(time) {
    console.log('time before reformat: '+time);
    return time.replace(':', '');
    console.log('time after reformat: '+time);
}

//transforme le temps en minutes
function convertSecondsToMinutes(delayInSeconds) {
    return delayInSeconds / 60;
}

// Démarrer le serveur Express
app.listen(port, () => {
    console.log(`Serveur Express démarré sur http://localhost:${port}`);
});