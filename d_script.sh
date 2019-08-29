#!/bin/bash

API_KEY=$1
URL=$2
USERNAME=$3
PASSWORD=$4

node index.js $API_KEY $URL $USERNAME $PASSWORD

counter=0
DIR=/home/node/app/artifacts/
FILES_IN_DIR=("report-0.trace.json" "report-0.devtoolslog.json" "report.html" "screenshot.jpg" "waterfall.png" "video.mp4")
ls -la $DIR

if [ -d "$DIR" ]; then
	echo "$DIR is exists"
	for i in "${FILES_IN_DIR[@]}"
	do 
		[ -e ${DIR}$i ] && counter=$((counter+1))
	done
	if [ "$counter" -eq "${#FILES_IN_DIR[@]}" ];  then 
		echo "exit 0"; 
		exit 0; 
	else 
		echo "exit 1"; 
		exit 1; 
	fi
else
	exit 1;
fi

