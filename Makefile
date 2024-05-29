COMMIT?=v0.8.0
TARGETS=linux darwin win32
WORKDIR=bin

all: clean clone darwin linux win32 versions

clean:
	rm -rf *.tar.gz *.zip bin/p2pd-* bin/go-libp2p-daemon

$(WORKDIR)/go-libp2p-daemon:
	mkdir -p bin/go-libp2p-daemon

clone: $(WORKDIR)/go-libp2p-daemon
	git clone https://github.com/libp2p/go-libp2p-daemon.git bin/go-libp2p-daemon; cd $(WORKDIR)/go-libp2p-daemon && git checkout $(COMMIT)

darwin:
	cd $(WORKDIR)/go-libp2p-daemon/p2pd && \
	GOOS=$@ GOARCH=amd64 go build -o p2pd-$@-amd64 && \
	GOOS=$@ GOARCH=arm64 go build -o p2pd-$@-arm64 && \
	lipo -create -output p2pd-$@ p2pd-$@-amd64 p2pd-$@-arm64 && \
	mv p2pd-* ../../ && \
	cd ../../../ && \
	node scripts/archive.js p2pd-$(COMMIT)-$@.tar.gz $(WORKDIR)/p2pd-$@

linux: clone
	cd $(WORKDIR)/go-libp2p-daemon/p2pd && \
	GOARCH=amd64 GOOS=$@ go build -o p2pd-$@-amd64 && \
	GOARCH=arm64 GOOS=$@ go build -o p2pd-$@-arm64 && \
	GOARCH=386 GOOS=$@ go build -o p2pd-$@-386 && \
	mv p2pd-* ../../ && \
	cd ../../../ && \
	node scripts/archive.js p2pd-$(COMMIT)-$@-amd64.tar.gz $(WORKDIR)/p2pd-linux-amd64 && \
	node scripts/archive.js p2pd-$(COMMIT)-$@-arm64.tar.gz $(WORKDIR)/p2pd-linux-arm64 && \
	node scripts/archive.js p2pd-$(COMMIT)-$@-386.tar.gz $(WORKDIR)/p2pd-linux-386

win32:
	cd $(WORKDIR)/go-libp2p-daemon/p2pd && \
	GOOS=windows GOARCH=amd64 go build -o p2pd-$@-amd64.exe && \
	GOOS=windows GOARCH=arm64 go build -o p2pd-$@-arm64.exe && \
	GOOS=windows GOARCH=386 go build -o p2pd-$@-386.exe && \
	mv p2pd-$@-*.exe ../../ && \
	cd ../../../ && \
	zip p2pd-$(COMMIT)-$@-amd64.zip $(WORKDIR)/p2pd-win32-amd64.exe && \
	zip p2pd-$(COMMIT)-$@-arm64.zip $(WORKDIR)/p2pd-win32-arm64.exe && \
	zip p2pd-$(COMMIT)-$@-386.zip $(WORKDIR)/p2pd-win32-386.exe

versions:
	node ./scripts/update-versions.js

.PHONY: clean
