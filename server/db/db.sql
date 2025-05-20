CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    team VARCHAR(50) NOT NULL
);

CREATE TABLE drawing_files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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

-- Inserimento utenti
-- ruoli: manager (read/write/delete), impiegato (read/write), consulente (read)
-- teams: Team 1, Team 2, Team 3, Team 4
INSERT INTO users (name, role, team) VALUES
('Alice', 'manager', 'Team 1'),
('Bob', 'impiegato', 'Team 2'),
('Carol', 'consulente', 'Team 1'),
('David', 'impiegato', 'Team 3'),
('Eva', 'manager', 'Team 4'),
('Frank', 'consulente', 'Team 2'),
('Grace', 'impiegato', 'Team 4'),
('Hannah', 'manager', 'Team 3'),
('Ian', 'consulente', 'Team 3'),
('Julia', 'impiegato', 'Team 1'),
('Kevin', 'manager', 'Team 2'),
('Laura', 'consulente', 'Team 4'),
('Mike', 'impiegato', 'Team 1'),
('Nina', 'manager', 'Team 3'),
('Oscar', 'consulente', 'Team 2'),
('Paul', 'impiegato', 'Team 4'),
('Quinn', 'manager', 'Team 1'),
('Rachel', 'consulente', 'Team 3'),
('Sam', 'impiegato', 'Team 2'),
('Tina', 'manager', 'Team 4');

-- Inserimento disegni
INSERT INTO drawing_files (name, owner_id, points, lines, texts) VALUES
('Network Diagram', 1, 
'[{"x":10,"y":20,"color":"red"}]', 
'[{"start_x":10,"start_y":20,"end_x":15,"end_y":25,"color":"blue"}]', 
'[{"x":12,"y":18,"content":"Firewall","font_size":12,"color":"black"}]'),

('Security Layout', 2, 
'[{"x":5,"y":5,"color":"green"}]', 
'[{"start_x":5,"start_y":5,"end_x":8,"end_y":8,"color":"orange"}]', 
'[{"x":6,"y":6,"content":"IDS Sensor","font_size":10,"color":"blue"}]'),

('Design Sketch', 4, 
'[{"x":1,"y":1,"color":"purple"}]', 
'[{"start_x":1,"start_y":1,"end_x":3,"end_y":3,"color":"black"}]', 
'[{"x":2,"y":2,"content":"Logo","font_size":14,"color":"gray"}]'),

('Office Plan', 5, 
'[{"x":12,"y":15,"color":"blue"}]', 
'[{"start_x":12,"start_y":15,"end_x":17,"end_y":20,"color":"green"}]', 
'[{"x":14,"y":16,"content":"Desk","font_size":11,"color":"brown"}]'),

('Server Room', 7, 
'[{"x":20,"y":22,"color":"black"}]', 
'[{"start_x":20,"start_y":22,"end_x":25,"end_y":27,"color":"grey"}]', 
'[{"x":21,"y":23,"content":"Server Rack","font_size":12,"color":"silver"}]'),

('Conference Room', 8, 
'[{"x":30,"y":32,"color":"cyan"}]', 
'[{"start_x":30,"start_y":32,"end_x":35,"end_y":37,"color":"purple"}]', 
'[{"x":31,"y":33,"content":"Projector","font_size":13,"color":"white"}]'),

('Reception Area', 10, 
'[{"x":40,"y":42,"color":"orange"}]', 
'[{"start_x":40,"start_y":42,"end_x":45,"end_y":47,"color":"yellow"}]', 
'[{"x":41,"y":43,"content":"Reception Desk","font_size":10,"color":"beige"}]'),

('Lobby', 11, 
'[{"x":50,"y":52,"color":"magenta"}]', 
'[{"start_x":50,"start_y":52,"end_x":55,"end_y":57,"color":"pink"}]', 
'[{"x":51,"y":53,"content":"Lobby Area","font_size":14,"color":"red"}]'),

('Test Lab', 13, 
'[{"x":60,"y":62,"color":"blue"}]', 
'[{"start_x":60,"start_y":62,"end_x":65,"end_y":67,"color":"green"}]', 
'[{"x":61,"y":63,"content":"Workstation","font_size":12,"color":"orange"}]'),

('Warehouse Layout', 16, 
'[{"x":70,"y":72,"color":"grey"}]', 
'[{"start_x":70,"start_y":72,"end_x":75,"end_y":77,"color":"black"}]', 
'[{"x":71,"y":73,"content":"Storage","font_size":13,"color":"brown"}]');