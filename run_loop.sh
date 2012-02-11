#!/bin/bash

while true
do
    hg pull -u read_only
    ./haldoc.js
done
