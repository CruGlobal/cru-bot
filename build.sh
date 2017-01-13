#!/bin/bash

`/usr/local/bin/aws ecr get-login` &&
docker build -t 056154071827.dkr.ecr.us-east-1.amazonaws.com/cru-bot:$GIT_COMMIT-$BUILD_NUMBER .