#!/bin/bash

# see  http://jupyter-notebook.readthedocs.io/en/latest/config.html
echo "[\"$PWD\"]" 

export PYTHONPATH=$PWD
jupyter notebook \
    --NotebookApp.server_extensions="['server']" \
    --NotebookApp.default_url="/index.html" \
    --NotebookApp.extra_static_paths="[\"$PWD\"]" \
    --no-browser \
    .
