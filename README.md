# Photobooth

## Requirements

### Node

Version 14

### OpenZWave

Install OpenZWave locally : 

```bash
apt install make g++ git coreutils \
    && git clone https://github.com/OpenZWave/open-zwave.git \
    && cd open-zwave \
    && make \
    && make install
```

### GPhoto2

```bash
apt install libgphoto2-dev
```

### ImageMagick

```bash
apt install imagemagick
```

## Video over HTTP

On Chrome: chrome://flags/#unsafely-treat-insecure-origin-as-secure and put the IP
