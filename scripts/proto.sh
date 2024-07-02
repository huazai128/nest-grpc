#!/bin/bash

PROTO_DIR="./server/protos" 

rm -rf "$PROTO_DIR"

git clone https://github.com/huazai128/protos.git

find "$PROTO_DIR" ! -name "*.proto" ! -name "*.ts" -mindepth 1 -delete




