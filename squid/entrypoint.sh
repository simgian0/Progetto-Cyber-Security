#!/bin/bash
set -e

# Add your iptables rules here
# iptables -A INPUT -p tcp --dport 3128 -j ACCEPT

# Avvia Squid in background
squid -N -f /etc/squid/squid.conf -n squid

# Mantieni il container vivo finché i processi sono attivi
wait
