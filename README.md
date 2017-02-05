# positronic-brain
This is an application to predict soccer results. More specifically, you can use the positronic brain to get a probability distribution for three classes of possible soccer results (home team wins, draw, away team wins). As a basis for this prediction, historic results along with the market values of [transfermarkt.de](http://www.transfermarkt.de) are used. This project also provides a crawler to store data locally in a CouchDb.

Positronic brain was originally conceived as a way to apply learnings from [this](https://www.coursera.org/learn/machine-learning/) 12 week machine learning course

In the current state, the following data is gathered:

- Market values at the time of the game
- Current position in the league before each game
- Matchday

## Usage

### Setup
Start a couchdb on localhost port 5984, e.g. with [docker](https://docker.com/)

`docker run -d -p 5984:5984 -v $(pwd)/data:/usr/local/var/lib/couchdb --name positronic-brain-couch couchdb`

Install npm packages

`npm install`

### Run
`node src/main.js`
