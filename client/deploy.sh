#!/bin/bash

pm2 install pm2-logrotate

pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 50
pm2 set pm2-logrotate:compress true 
pm2 set pm2-logrotate:workerInterval 60

pm2 start pm2.config.js --no-daemon