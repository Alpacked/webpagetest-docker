#!/bin/bash

CONTAINER=$(docker run -d node sh -c 'while sleep 3600; do :; done')

docker exec $CONTAINER /bin/sh -c "./d_script.sh A.bfeead532859cce2692c8020852e8b79 https://stackoverflow.com/"

[ $? -eq 0 ] && docker stop $CONTAINER; echo true || docker stop $CONTAINER; echo false
