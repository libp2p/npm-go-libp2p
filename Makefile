COMMIT?=master
TARGETS=linux darwin
WORKDIR=bin

all: $(WORKDIR)/p2pd-linux.tar.gz $(WORKDIR)/p2pd-darwin.tar.gz $(WORKDIR)/p2pd-win32.zip

$(WORKDIR)/go-libp2p-daemon:
	mkdir -p bin/go-libp2p-daemon

clone: $(WORKDIR)/go-libp2p-daemon
	git clone https://github.com/libp2p/go-libp2p-daemon.git bin/go-libp2p-daemon; cd $(WORKDIR)/go-libp2p-daemon && git checkout $(COMMIT)

darwin: clone
	cd bin/go-libp2p-daemon/p2pd && GOOS=$@ GOARCH=amd64 go build -o p2pd-$@-amd64 && GOOS=$@ GOARCH=arm64 go build -o p2pd-$@-arm64 && lipo -create -output p2pd-$@ p2pd-$@-amd64 p2pd-$@-arm64 && mv p2pd-$@ ../../

linux: clone
	cd bin/go-libp2p-daemon/p2pd && GOARCH=amd64 GOOS=$@ go build -o p2pd-$@ && mv p2pd-$@ ../../

$(WORKDIR)/p2pd-linux.tar.gz: linux
	tar -czf $@ $(WORKDIR)/p2pd-linux

$(WORKDIR)/p2pd-darwin.tar.gz: darwin
	tar -czf $@ $(WORKDIR)/p2pd-darwin

win32:
	cd $(WORKDIR)/go-libp2p-daemon/p2pd && GOOS=windows GOARCH=386 go build -o p2pd-$@.exe && mv p2pd-$@.exe ../../

$(WORKDIR)/p2pd-win32.zip: win32
	zip $@ $(WORKDIR)/p2pd-win32

clean:
	rm -rf bin/go-libp2p-daemon *.tar.gz *.zip

.PHONY: clean
