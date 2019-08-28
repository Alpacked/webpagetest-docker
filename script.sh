#!/bin/bash

IMAGE=$1
API_KEY=$2
URL=$3
USERNAME=$4
PASS=$5

CONTAINER=$(docker run -d $IMAGE sh -c 'while sleep 3600; do :; done')

docker exec $CONTAINER /bin/sh -c "./d_script.sh $API_KEY $URL $USERNAME $PASS"

if [ $? -eq 0 ]; then 
	docker stop $CONTAINER; 
	echo "exit 0;"; 
	exit 0; 
else 
	docker stop $CONTAINER; 
	echo "exit 1;"; 
	exit 1; 
fi
