## Ghetto mode for now: just rebuild some test files (including the compiler)
rm -rf ./tests/*.js

node ./bin/skim.js -c ./tests/basic.test.ss

npx jest ./tests

