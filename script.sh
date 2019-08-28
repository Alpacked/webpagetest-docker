#!/bin/bash

API_KEY=$1
URL=$2
USERNAME=$3
PASS=$4

CONTAINER=$(docker run -d node sh -c 'while sleep 3600; do :; done')

docker exec $CONTAINER /bin/sh -c "./d_script.sh $API_KEY $URL $USERNAME $PASS"

[ $? -eq 0 ] && docker stop $CONTAINER; echo true || docker stop $CONTAINER; echo false
