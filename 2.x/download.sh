#!/bin/bash
wget -r -nH --cut-dirs=2 -N --no-parent -l 1 http://downloads.dlang.org/releases/2.x/
rm index.html
