#!/bin/bash

git submodule update --init --recursive

`/usr/local/bin/aws ecr get-login` &&
docker build -t 056154071827.dkr.ecr.us-east-1.amazonaws.com/cru-bot:$ENVIRONMENT-$BUILD_NUMBER .
