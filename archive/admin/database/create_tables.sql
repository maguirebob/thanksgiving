-- create table Users
CREATE TABLE IF NOT EXISTS Users (
  user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- create table Sessions
CREATE TABLE IF NOT EXISTS Sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
('Thanksgiving Dinner 1997', 'Thanksgiving', 'Canajoharie, NY','1997-11-27',  'This dinner was at my parents house in Canajoharie, NY', 'Thanksgiving 1997', '1997_Menu.jpeg'),
('Thanksgiving Dinner 1999', 'Thanksgiving', 'Canajoharie, NY','1999-11-25',  'This dinner was at my parents house in Canajoharie, NY', 'Thanksgiving 1999', '1999_Menu.jpeg'),
('Thanksgiving Dinner 2000', 'Thanksgiving', 'Canajoharie, NY','2000-11-23',  'This dinner was at my parents house in Canajoharie, NY', 'Thanksgiving 2000', '2000_Menu.jpeg'),
('Thanksgiving Dinner 2004', 'Thanksgiving', 'Middletown, NJ','2004-11-25',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2004', '2004_Menu.jpeg'),
('Thanksgiving Dinner 2005', 'Thanksgiving', 'Middletown, NJ','2005-11-24',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2005', '2005_Menu.jpeg'),
('Thanksgiving Dinner 2002', 'Thanksgiving', 'Canajoharie, NY','2002-11-28',  'This dinner was at my parents house in Canajoharie, NY', 'Thanksgiving 2002', '2002_Menu.jpeg'),
('Thanksgiving Dinner 2006', 'Thanksgiving', 'Middletown, NJ','2006-11-23',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2006', '2006_Menu.jpeg'),
('Thanksgiving Dinner 2007', 'Thanksgiving', 'Middletown, NJ','2007-11-22',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2007', '2007_Menu.jpeg'),
('Thanksgiving Dinner 2008', 'Thanksgiving', 'Middletown, NJ','2008-11-27',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2008', '2008_Menu.jpeg'),
('Thanksgiving Dinner 2009', 'Thanksgiving', 'Middletown, NJ','2009-11-26',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2009', '2009_Menu.jpeg'),
('Thanksgiving Dinner 2010', 'Thanksgiving', 'Middletown, NJ','2010-11-25',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2010', '2010_Menu.jpeg'),
('Thanksgiving Dinner 2011', 'Thanksgiving', 'Middletown, NJ','2011-11-24',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2011', '2011_Menu.jpeg'),
('Thanksgiving Dinner 2012', 'Thanksgiving', 'Middletown, NJ','2012-11-22',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2012', '2012_Menu.jpeg'),
('Thanksgiving Dinner 2013', 'Thanksgiving', 'Middletown, NJ','2013-11-28',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2013', '2013_Menu.jpeg'),
('Thanksgiving Dinner 2014', 'Thanksgiving', 'Middletown, NJ','2014-11-27',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2014', '2014_Menu.jpeg'),
('Thanksgiving Dinner 2015', 'Thanksgiving', 'Middletown, NJ','2015-11-26',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2015', '2015_Menu.jpeg'),
('Thanksgiving Dinner 2016', 'Thanksgiving', 'Middletown, NJ','2016-11-24',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2016', '2016_Menu.jpeg'),
('Thanksgiving Dinner 2017', 'Thanksgiving', 'Middletown, NJ','2017-11-23',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2017', '2017_Menu.jpeg'),
('Thanksgiving Dinner 2018', 'Thanksgiving', 'Middletown, NJ','2018-11-22',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2018', '2018_Menu.jpeg'),
('Thanksgiving Dinner 2019', 'Thanksgiving', 'Middletown, NJ','2019-11-28',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2019', '2019_Menu.jpeg'),
('Thanksgiving Dinner 2020', 'Thanksgiving', 'Middletown, NJ','2020-11-26',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2020', '2020_Menu.jpeg'),
('Thanksgiving Dinner 2021', 'Thanksgiving', 'Middletown, NJ','2021-11-25',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2021', '2021_Menu.jpeg'),
('Thanksgiving Dinner 2022', 'Thanksgiving', 'Middletown, NJ','2022-11-24',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2022', '2022_Menu.jpeg'),
('Thanksgiving Dinner 2023', 'Thanksgiving', 'Middletown, NJ','2023-11-23',  'This dinner was at Bob and Tricia''s house in Middletown, NJ', 'Thanksgiving 2023', '2023_Menu.jpeg'),
('Thanksgiving Dinner 2024', 'Thanksgiving', 'Middletown, NJ','2024-11-28',  'This dinner was marked by the death of Tricia''s Grandmother, Grandman Goodse', 'Thanksgiving 2024', '2024_Menu.jpeg');

-- Insert sample users (password is 'password123' for both)
INSERT INTO Users (username, email, password_hash, role, first_name, last_name) VALUES
('admin', 'admin@thanksgiving.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'User'),
('bob', 'bob@thanksgiving.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Bob', 'Maguire');




