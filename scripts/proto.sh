#!/bin/bash

PROTO_DIR="./server/protos" 

rm -rf "$PROTO_DIR"

cd ./server

git clone https://github.com/huazai128/protos-file.git

mv ./protos-file/protos ./

rm -rf ./protos-file