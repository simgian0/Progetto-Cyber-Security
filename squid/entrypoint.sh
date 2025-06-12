#!/bin/bash
# niente regole firewall qui dentro
exec squid -N -f /etc/squid/squid.conf -n squid
