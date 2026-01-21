cd ..
cd native
wasm-pack build --target web
cp -a ./pkg/. ../src/wasm/
rm -rf ./pkg
