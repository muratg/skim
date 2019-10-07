## Ghetto mode for now: just rebuild some test files (including the compiler)
rm -rf ./examples/boot
mkdir ./examples/boot
cp ./boot/*.skim ./examples/boot

node ./bin/skim.js ./examples/boot/skim-example.skim

node ./bin/skim.js ./examples/boot/skim-boot-parser.skim
node ./bin/skim.js ./examples/boot/skim-boot-emitter.skim
node ./bin/skim.js ./examples/boot/skim-boot-environ.skim
node ./bin/skim.js ./examples/boot/skim-boot-cli.skim

ls ./examples/boot/
cat ./examples/boot/skim-example.skim
