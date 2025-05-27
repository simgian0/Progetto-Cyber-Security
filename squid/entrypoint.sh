#!/bin/bash
# Add your iptables rules here
iptables -A INPUT -p tcp --dport 3128 -j ACCEPT
# Start Squid
exec squid -N -f /etc/squid/squid.conf -n squid