cd ..
cd native
wasm-pack build --target web
cp -a ./pkg/. ../public/wasm/
rm -rf ./pkg
