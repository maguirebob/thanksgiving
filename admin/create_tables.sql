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
('Thanksgiving Dinner 2005', 'Thanksgiving', 'Canajoharie, NY','2005-11-24',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2005', '2005_Menu.jpeg'),
('Thanksgiving Dinner 2002', 'Thanksgiving', 'Canajoharie, NY','2002-11-28',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2002', '2002_Menu.jpeg'),
('Thanksgiving Dinner 2006', 'Thanksgiving', 'Canajoharie, NY','2006-11-23',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2006', '2006_Menu.jpeg'),
('Thanksgiving Dinner 2007', 'Thanksgiving', 'Canajoharie, NY','2007-11-22',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2007', '2007_Menu.jpeg'),
('Thanksgiving Dinner 2008', 'Thanksgiving', 'Canajoharie, NY','2008-11-27',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2008', '2008_Menu.jpeg'),
('Thanksgiving Dinner 2009', 'Thanksgiving', 'Canajoharie, NY','2009-11-26',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2009', '2009_Menu.jpeg'),
('Thanksgiving Dinner 2010', 'Thanksgiving', 'Canajoharie, NY','2010-11-25',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2010', '2010_Menu.jpeg'),
('Thanksgiving Dinner 2011', 'Thanksgiving', 'Canajoharie, NY','2011-11-24',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2011', '2011_Menu.jpeg'),
('Thanksgiving Dinner 2012', 'Thanksgiving', 'Canajoharie, NY','2012-11-22',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2012', '2012_Menu.jpeg'),
('Thanksgiving Dinner 2013', 'Thanksgiving', 'Canajoharie, NY','2013-11-28',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2013', '2013_Menu.jpeg'),
('Thanksgiving Dinner 2014', 'Thanksgiving', 'Canajoharie, NY','2014-11-27',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2014', '2014_Menu.jpeg'),
('Thanksgiving Dinner 2015', 'Thanksgiving', 'Canajoharie, NY','2015-11-26',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2015', '2015_Menu.jpeg'),
('Thanksgiving Dinner 2016', 'Thanksgiving', 'Canajoharie, NY','2016-11-24',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2016', '2016_Menu.jpeg'),
('Thanksgiving Dinner 2017', 'Thanksgiving', 'Canajoharie, NY','2017-11-23',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2017', '2017_Menu.jpeg'),
('Thanksgiving Dinner 2018', 'Thanksgiving', 'Canajoharie, NY','2018-11-22',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2018', '2018_Menu.jpeg'),
('Thanksgiving Dinner 2019', 'Thanksgiving', 'Canajoharie, NY','2019-11-28',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2019', '2019_Menu.jpeg'),
('Thanksgiving Dinner 2020', 'Thanksgiving', 'Canajoharie, NY','2020-11-26',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2020', '2020_Menu.jpeg'),
('Thanksgiving Dinner 2021', 'Thanksgiving', 'Canajoharie, NY','2021-11-25',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2021', '2021_Menu.jpeg'),
('Thanksgiving Dinner 2022', 'Thanksgiving', 'Canajoharie, NY','2022-11-24',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2022', '2022_Menu.jpeg'),
('Thanksgiving Dinner 2023', 'Thanksgiving', 'Canajoharie, NY','2023-11-23',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2023', '2023_Menu.jpeg'),
('Thanksgiving Dinner 2024', 'Thanksgiving', 'Canajoharie, NY','2024-11-28',  'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2024', '2024_Menu.jpeg');




