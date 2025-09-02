-- create table Events
CREATE TABLE IF NOT EXISTS Events (
  event_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_location VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  event_description TEXT NOT NULL,
  menu_title VARCHAR(255) NOT NULL,
  menu_image_filename VARCHAR(255) NOT NULL
);

-- Insert sample data into Events table
INSERT INTO Events (event_name, event_type, event_location, event_date, event_description, menu_title, menu_image_filename) VALUES
('Thanksgiving Dinner 1994', 'Thanksgiving', 'Canajoharie, NY', '1994-11-24',  'First Thanksgiving Dinner that we have menu for at my parents house in Canajoharie, NY', 'Maguire Family Dinner 1994', '1994_Menu.png'),
('Thanksgiving Dinner 1997', 'Thanksgiving', 'Canajoharie, NY','1997-11-27',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 1997', '1997_Menu.jpeg'),
('Thanksgiving Dinner 1999', 'Thanksgiving', 'Canajoharie, NY','1999-11-25',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 1999', '1999_Menu.jpeg'),
('Thanksgiving Dinner 2000', 'Thanksgiving', 'Canajoharie, NY','2000-11-23',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2000', '2000_Menu.jpeg'),
('Thanksgiving Dinner 2004', 'Thanksgiving', 'Canajoharie, NY','2004-11-25',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2004', '2004_Menu.jpeg'),
('Thanksgiving Dinner 2005', 'Thanksgiving', 'Canajoharie, NY','2005-11-24',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2005', '2005_Menu.jpeg');




