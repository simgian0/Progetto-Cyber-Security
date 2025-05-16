CREATE TABLE drawing_files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner VARCHAR(100) NOT NULL,

    -- Colonne dedicate per i contenuti del disegno
    points TEXT, -- JSON o stringa custom (es. "[(x,y,color),...]")
    lines TEXT,  -- JSON o "[(x1,y1)-(x2,y2),color],..."
    texts TEXT   -- contenuti testuali nel disegno (posizione, contenuto, stile)
);

-- Tabella per log???
--CREATE TABLE security_events (
--    id SERIAL PRIMARY KEY,
--    drawing_id INTEGER REFERENCES drawing_files(id) ON DELETE CASCADE,
--    event_type VARCHAR(50), -- es: 'access', 'modify', 'delete'
--    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--    ip_address INET,
--    user_agent TEXT,
--    notes TEXT
--);

-- Popolamento tabella
INSERT INTO drawing_files (name, owner, points, lines, texts) VALUES
('schema_rete', 'alice',
 '[{"x":10.5,"y":20.3,"color":"red"}]',
 '[{"start_x":10.5,"start_y":20.3,"end_x":15.0,"end_y":25.0,"color":"blue"}]',
 '[{"x":12.0,"y":18.0,"content":"Firewall","font_size":12,"color":"black"}]'),

('topologia_ufficio', 'bob',
 '[{"x":5.0,"y":5.0,"color":"green"},{"x":8.0,"y":8.0,"color":"red"}]',
 '[{"start_x":5.0,"start_y":5.0,"end_x":8.0,"end_y":8.0,"color":"orange"}]',
 '[{"x":6.0,"y":6.0,"content":"Router","font_size":10,"color":"blue"}]'),

('schema_wifi', 'carol',
 '[{"x":1.0,"y":1.0,"color":"purple"}]',
 '[{"start_x":1.0,"start_y":1.0,"end_x":3.0,"end_y":3.0,"color":"black"}]',
 '[{"x":2.0,"y":2.0,"content":"Access Point","font_size":14,"color":"gray"}]'),

('net_diagram', 'dave',
 '[{"x":7.1,"y":2.3,"color":"red"}]',
 '[{"start_x":7.1,"start_y":2.3,"end_x":9.1,"end_y":4.3,"color":"blue"}]',
 '[{"x":8.0,"y":3.0,"content":"Switch","font_size":11,"color":"green"}]'),

('lan_layout', 'erin',
 '[{"x":2.0,"y":9.0,"color":"blue"}]',
 '[{"start_x":2.0,"start_y":9.0,"end_x":4.0,"end_y":9.0,"color":"yellow"}]',
 '[{"x":3.0,"y":9.0,"content":"LAN","font_size":10,"color":"black"}]'),

('home_lab', 'frank',
 '[{"x":4.2,"y":1.1,"color":"cyan"}]',
 '[{"start_x":4.2,"start_y":1.1,"end_x":6.2,"end_y":2.1,"color":"red"}]',
 '[{"x":5.0,"y":1.5,"content":"Pi Server","font_size":13,"color":"magenta"}]'),

('dmz_diagram', 'grace',
 '[{"x":6.6,"y":5.5,"color":"orange"}]',
 '[{"start_x":6.6,"start_y":5.5,"end_x":8.6,"end_y":7.5,"color":"green"}]',
 '[{"x":7.5,"y":6.5,"content":"DMZ","font_size":12,"color":"brown"}]'),

('vpn_setup', 'henry',
 '[{"x":1.1,"y":1.1,"color":"gray"}]',
 '[{"start_x":1.1,"start_y":1.1,"end_x":3.1,"end_y":3.1,"color":"purple"}]',
 '[{"x":2.0,"y":2.0,"content":"VPN","font_size":11,"color":"navy"}]'),

('tor_network', 'ivan',
 '[{"x":3.3,"y":3.3,"color":"red"}]',
 '[{"start_x":3.3,"start_y":3.3,"end_x":5.3,"end_y":5.3,"color":"black"}]',
 '[{"x":4.0,"y":4.0,"content":"TOR","font_size":12,"color":"gray"}]'),

('honeypot_layout', 'jane',
 '[{"x":9.1,"y":2.2,"color":"yellow"}]',
 '[{"start_x":9.1,"start_y":2.2,"end_x":10.1,"end_y":3.2,"color":"blue"}]',
 '[{"x":9.6,"y":2.7,"content":"Honeypot","font_size":10,"color":"red"}]'),

('dns_map', 'kate',
 '[{"x":2.1,"y":4.1,"color":"green"}]',
 '[{"start_x":2.1,"start_y":4.1,"end_x":4.1,"end_y":6.1,"color":"cyan"}]',
 '[{"x":3.0,"y":5.0,"content":"DNS","font_size":9,"color":"purple"}]'),

('ntp_nodes', 'leo',
 '[{"x":8.8,"y":8.8,"color":"blue"}]',
 '[{"start_x":8.8,"start_y":8.8,"end_x":9.8,"end_y":9.8,"color":"black"}]',
 '[{"x":9.0,"y":9.0,"content":"NTP","font_size":11,"color":"orange"}]'),

('siem_flow', 'mia',
 '[{"x":3.9,"y":2.9,"color":"gray"}]',
 '[{"start_x":3.9,"start_y":2.9,"end_x":6.9,"end_y":5.9,"color":"red"}]',
 '[{"x":5.0,"y":4.0,"content":"SIEM","font_size":12,"color":"green"}]'),

('audit_trail', 'nina',
 '[{"x":1.5,"y":1.5,"color":"brown"}]',
 '[{"start_x":1.5,"start_y":1.5,"end_x":2.5,"end_y":2.5,"color":"blue"}]',
 '[{"x":2.0,"y":2.0,"content":"Audit","font_size":10,"color":"gray"}]'),

('firewall_rules', 'otto',
 '[{"x":6.0,"y":3.0,"color":"red"}]',
 '[{"start_x":6.0,"start_y":3.0,"end_x":7.0,"end_y":4.0,"color":"orange"}]',
 '[{"x":6.5,"y":3.5,"content":"Rule","font_size":11,"color":"black"}]'),

('proxy_paths', 'paul',
 '[{"x":7.0,"y":1.0,"color":"green"}]',
 '[{"start_x":7.0,"start_y":1.0,"end_x":8.0,"end_y":2.0,"color":"purple"}]',
 '[{"x":7.5,"y":1.5,"content":"Proxy","font_size":10,"color":"blue"}]'),

('splunk_feed', 'quinn',
 '[{"x":4.0,"y":7.0,"color":"black"}]',
 '[{"start_x":4.0,"start_y":7.0,"end_x":6.0,"end_y":9.0,"color":"green"}]',
 '[{"x":5.0,"y":8.0,"content":"Log","font_size":9,"color":"red"}]'),

('alert_routes', 'rachel',
 '[{"x":2.2,"y":3.3,"color":"blue"}]',
 '[{"start_x":2.2,"start_y":3.3,"end_x":3.2,"end_y":4.3,"color":"black"}]',
 '[{"x":2.7,"y":3.8,"content":"Alert","font_size":11,"color":"magenta"}]'),

('ids_map', 'sam',
 '[{"x":5.5,"y":5.5,"color":"red"}]',
 '[{"start_x":5.5,"start_y":5.5,"end_x":7.5,"end_y":7.5,"color":"gray"}]',
 '[{"x":6.5,"y":6.5,"content":"Snort","font_size":10,"color":"blue"}]'),

('monitoring_zones', 'tina',
 '[{"x":3.3,"y":6.6,"color":"purple"}]',
 '[{"start_x":3.3,"start_y":6.6,"end_x":5.3,"end_y":8.6,"color":"cyan"}]',
 '[{"x":4.3,"y":7.6,"content":"Zone","font_size":12,"color":"green"}]'),

 ('udp_layout', 'ursula',
 '[{"x":1.2,"y":2.2,"color":"green"}]',
 '[{"start_x":1.2,"start_y":2.2,"end_x":3.2,"end_y":4.2,"color":"yellow"}]',
 '[{"x":2.0,"y":3.0,"content":"UDP","font_size":10,"color":"black"}]'),

('vlan_structure', 'victor',
 '[{"x":4.4,"y":4.4,"color":"blue"}]',
 '[{"start_x":4.4,"start_y":4.4,"end_x":6.4,"end_y":6.4,"color":"orange"}]',
 '[{"x":5.0,"y":5.0,"content":"VLAN 10","font_size":11,"color":"red"}]'),

('wan_topology', 'wade',
 '[{"x":2.2,"y":5.5,"color":"purple"}]',
 '[{"start_x":2.2,"start_y":5.5,"end_x":4.2,"end_y":7.5,"color":"green"}]',
 '[{"x":3.0,"y":6.5,"content":"WAN","font_size":12,"color":"blue"}]'),

('xss_lab', 'xena',
 '[{"x":7.7,"y":2.2,"color":"red"}]',
 '[{"start_x":7.7,"start_y":2.2,"end_x":9.7,"end_y":4.2,"color":"black"}]',
 '[{"x":8.0,"y":3.0,"content":"<script>","font_size":10,"color":"gray"}]'),

('yaml_config', 'yuri',
 '[{"x":3.1,"y":3.9,"color":"brown"}]',
 '[{"start_x":3.1,"start_y":3.9,"end_x":5.1,"end_y":5.9,"color":"blue"}]',
 '[{"x":4.0,"y":4.9,"content":"Config","font_size":9,"color":"green"}]'),

('zero_trust_zone', 'zoe',
 '[{"x":6.6,"y":6.6,"color":"gray"}]',
 '[{"start_x":6.6,"start_y":6.6,"end_x":8.6,"end_y":8.6,"color":"cyan"}]',
 '[{"x":7.5,"y":7.5,"content":"Zero Trust","font_size":12,"color":"black"}]');