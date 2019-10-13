echo "Building SkimJS, using '$SKIM'. If you only see '', you need SKIM env var."
ls -al ./bin
rm -rf ./boot/skim-boot-*.js
$SKIM -c ./boot/skim-boot-parser.skim
$SKIM -c ./boot/skim-boot-emitter.skim
$SKIM -c ./boot/skim-boot-environ.skim
$SKIM -c ./boot/skim-boot-compiler.skim
$SKIM -c ./boot/skim-boot-cli.skim
cp ./boot/skim.js ./bin
mv ./boot/skim-boot-*.js ./bin
ls -al ./bin
echo "Done."
