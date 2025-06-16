#!/bin/bash
# Add your iptables rules here
iptables -A INPUT -p tcp --dport 3128 -j ACCEPT

#iptables -P INPUT DROP                                                    # Blocca tutto in ingresso
#iptables -A INPUT -i lo -j ACCEPT                                         # Permette traffico locale nel container
#iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT    # Permette pacchetti di risposta alle connessioni già attive

# Permetti accesso a Squid sulla porta 3128 solo da IP autorizzati
#iptables -A INPUT -p tcp -s 192.168.1.10 --dport 3128 -j ACCEPT
#iptables -A INPUT -p tcp -s 192.168.1.20 --dport 3128 -j ACCEPT

# Start Squid
exec squid -N -f /etc/squid/squid.conf -n squid



#iptables -A INPUT -s 192.168.1.100 -j DROP                               # Bloccare un IP	
#iptables -A INPUT -s 10.0.0.0/24 -j DROP                                 # Bloccare un’intera subnet	
#iptables -A INPUT -p tcp --dport 80 -j                                   # DROP Bloccare una porta specifica	
#iptables -P INPUT DROP; iptables -A INPUT -p tcp --dport 3128 -j ACCEPT  # Bloccare tutto tranne la porta 3128	