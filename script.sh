#!/bin/bash

API_KEY=$1
URL=$2
USERNAME=$3
PASS=$4

CONTAINER=$(docker run -d node sh -c 'while sleep 3600; do :; done')

docker exec $CONTAINER /bin/sh -c "ls -la /home/node/app/"

[ $? -eq 0 ] && docker stop $CONTAINER; exit 0 || docker stop $CONTAINER; exit 1
