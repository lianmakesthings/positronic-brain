# positronic-brain
A machine that learns to predict football scores

## Usage

### Setup
Start couchdb container

`docker run -d -p 5984:5984 -v $(pwd):/usr/local/var/lib/couchdb --name positronic-brain-couch couchdb`

Install npm packages

`npm install`

### Run
`node src/main.js`
