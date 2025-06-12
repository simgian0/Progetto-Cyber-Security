#!/bin/sh
set -e

# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1

# Flush existing rules
iptables -F
iptables -t nat -F

# NAT for outgoing traffic from all interfaces
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -t nat -A POSTROUTING -o eth1 -j MASQUERADE
iptables -t nat -A POSTROUTING -o eth2 -j MASQUERADE

iptables -A FORWARD -i eth0 -o eth1 -j LOG --log-prefix "FW eth0->eth1: "
iptables -A FORWARD -i eth0 -o eth1 -j ACCEPT

iptables -A FORWARD -i eth1 -o eth0 -j LOG --log-prefix "FW eth1->eth0: "
iptables -A FORWARD -i eth1 -o eth0 -j ACCEPT

iptables -A FORWARD -i eth0 -o eth2 -j LOG --log-prefix "FW eth0->eth2: "
iptables -A FORWARD -i eth0 -o eth2 -j ACCEPT

iptables -A FORWARD -i eth2 -o eth0 -j LOG --log-prefix "FW eth2->eth0: "
iptables -A FORWARD -i eth2 -o eth0 -j ACCEPT

iptables -A FORWARD -i eth1 -o eth2 -j LOG --log-prefix "FW eth1->eth2: "
iptables -A FORWARD -i eth1 -o eth2 -j ACCEPT

iptables -A FORWARD -i eth2 -o eth1 -j LOG --log-prefix "FW eth2->eth1: "
iptables -A FORWARD -i eth2 -o eth1 -j ACCEPT

# Start syslogd to capture kernel logs
syslogd -O /var/log/messages

# Wait for /var/log/messages to exist before tailing
while [ ! -f /var/log/messages ]; do sleep 1; done

# Keep container running and show logs
tail -f /var/log/messages