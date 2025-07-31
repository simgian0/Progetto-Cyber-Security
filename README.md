# ZeroNote

<div align="center">
  <p align="center">
    <img src="./README/LOGO.png" width="300" />
  </p>

  <p>
    Corso di Advanced CyberSecurity 2024/2025 <br/>
    <strong>Progetto: Realizzazione di un'architettura Zero Trust</strong>
  </p>

  <br/>

  <p><strong>Realizzato con:</strong></p>
  <br/>
  <p>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Made%20with-Docker-%230db7ed.svg?style=plastic&logo=docker&logoColor=white" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/Made%20with-PostgreSQL-%23316192.svg?style=plastic&logo=postgresql&logoColor=white" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Made%20with-Express.js-%23404d59.svg?style=plastic&logo=express&logoColor=%2361DAFB" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Made%20with-Node.js-339933.svg?style=plastic&logo=node.js&logoColor=white" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/Made%20with-TypeScript-%23007ACC.svg?style=plastic&logo=typescript&logoColor=white" /></a>
    <a href="https://sequelize.org/"><img src="https://img.shields.io/badge/Made%20with-Sequelize-52B0E7?style=plastic&logo=Sequelize&logoColor=white" /></a>
    <a href="https://www.npmjs.com/"><img src="https://img.shields.io/badge/Made%20with-NPM-%23CB3837.svg?style=plastic&logo=npm&logoColor=white" /></a>
    <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Made%20with-Python-3776AB?style=plastic&logo=python&logoColor=white" /></a>
    <a href="https://www.splunk.com/"><img src="https://img.shields.io/badge/Made%20with-Splunk-000000.svg?style=plastic&logo=Splunk&logoColor=white" /></a>
    <a href="http://www.squid-cache.org/"><img src="https://img.shields.io/badge/Made%20with-Squid_Proxy-002f87?style=plastic&logo=Squid&logoColor=white" /></a>
    <a href="https://www.snort.org/"><img src="https://img.shields.io/badge/Made%20with-Snort-E60A0A?style=plastic&logo=Snort&logoColor=white" /></a>
    <a href="https://fluentbit.io/"><img src="https://img.shields.io/badge/Made%20with-FluentBit-3cafe2?style=plastic" /></a>
  </p>

</div>

## Tabella dei contenuti
- [ZeroNote](#zeronote)
  - [Tabella dei contenuti](#tabella-dei-contenuti)
  - [Introduzione e specifiche progetto](#introduzione-e-specifiche-progetto)
  - [Infrastruttura del progetto](#infrastruttura-del-progetto)
  - [Policy implementate](#policy-implementate)
  - [Installazione](#installazione)
  - [Avvio](#avvio)
  - [Autori](#autori)
  
## Introduzione e specifiche progetto

## Infrastruttura del progetto

## Policy implementate
1. **GET sempre concesso**  
   *Implementazione*: Server (middleware) + Squid (ACL)
 
2. **Penalità per richieste malformate**  
   *Implementazione*: Server (requestFormatCheck → score –)
 
3. **Fascia oraria di lavoro**  
   *Implementazione*: Server + Squid  
   - In orario 08:00-20:00 nessuna penalità, altrimenti score –  
 
4. **IP non in whitelist ➜ rifiuto**  
   *Implementazione*: Server + Squid (blockList)
 
5. **Sottoreti sconosciute rifiutate; rete non ethernet penalizzata**  
   *Implementazione*: Server + Squid (scoreNetworkAnalysis → score –)
 
6. **Richieste da Wi-Fi ➜ score –**  
   *Implementazione*: Server (scoreNetworkAnalysis)
 
7. **Richieste da rete cablata ➜ score +**  
   *Implementazione*: Server (scoreNetworkAnalysis)
 
8. **Too Many Requests (DoS light) ➜ score –**  
   *Implementazione*: Server + Splunk (scoreDosAnalysis)
 
9. **N errori consecutivi ➜ score –**  
   *Implementazione*: Server + Splunk (scoreTrustAnalysis)
 
10. **Un team non può modificare risorse di altri team**  
    *Implementazione*: Server + DB (checkTeam)
 
11. **Un consulente non può modificare o cancellare risorse del proprio team**  
    *Implementazione*: Server + DB (permissionMiddleware)
 
12. **Un manager può creare risorse in team diversi dal suo**  
    *Implementazione*: Server + DB (permissionMiddleware)
 
13. **Risorse create da un manager non cancellabili da non-manager**  
    *Implementazione*: Server + DB (permissionMiddleware)
 
14. **Dipendenti/consulenti: sola lettura su risorse di team esterni**  
    *Implementazione*: Server + DB (permissionMiddleware + checkTeam)
    
## Installazione

## Avvio

## Autori

