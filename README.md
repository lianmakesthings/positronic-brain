# positronic-brain
A machine that learns to predict football scores

## Usage

### Start couchdb container

`docker run -d -p 5984:5984 -v ~/Projects/positronic-brain/data:/usr/local/var/lib/couchdb --name positronic-brain-couch couchdb`
