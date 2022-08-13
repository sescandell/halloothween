# Configure your RPI as an AP

From: https://thepi.io/how-to-use-your-raspberry-pi-as-a-wireless-access-point/

```bash
sudo apt-get install hostapd dnsmasq

sudo systemctl stop hostapd
sudo systemctl stop dnsmasq

sudo vim /etc/dhcpcd.conf

# Now that you’re in the file, add the following lines at the end:
interface wlan0
  static ip_address=192.168.1.10/24
  nohook wpa_supplicant
denyinterfaces eth0
denyinterfaces wlan0

# We’re going to use dnsmasq as our DHCP server.
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
sudo vim /etc/dnsmasq.conf

interface=wlan0
  dhcp-range=192.168.1.11,192.168.1.30,255.255.255.0,24h


 sudo vim /etc/hostapd/hostapd.conf

 # This should create a brand new file. Type in this:

interface=wlan0
#bridge=br0
hw_mode=g
channel=10
country_code=FR
ieee80211n=1
wmm_enabled=0
# macaddr_acl=0
auth_algs=1
# ignore_broadcast_ssid=0
wpa=2
wpa_key_mgmt=WPA-PSK
# wpa_pairwise=TKIP
rsn_pairwise=CCMP
ssid=NETWORK
wpa_passphrase=PASSWORD

# We still have to show the system the location of the configuration file:

sudo vim /etc/default/hostapd

# In this file, track down the line that says #DAEMON_CONF=”” – delete that # and put the path to our config file in the quotes, so that it looks like this:

DAEMON_CONF="/etc/hostapd/hostapd.conf"

# debug if issues on running hostapd
DAEMON_OPTS=""


sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl start hostapd
```
