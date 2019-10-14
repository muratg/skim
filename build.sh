echo "Building SkimJS, using '$SKIM'. If you only see '', you need SKIM env var."

ls -al ./bin
rm -rf ./boot/*.js

echo "Working..."
$SKIM -c ./boot/skim.ss
mv ./boot/skim.js ./bin
chmod +x ./bin/skim.js
sed -i '1s/^/#!\/usr\/bin\/env node\n/' ./bin/skim.js

ls -al ./bin
echo "Done."
