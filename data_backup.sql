--
-- PostgreSQL database dump
--

\restrict MMkFwj4XjRWaFyOSGdz2fU9tSXEMToNW9X2PwiP0IbOhd3LzXDtU5Q5yAI606Z1

-- Dumped from database version 17.6 (Postgres.app)
-- Dumped by pg_dump version 17.6 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Events; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

INSERT INTO public."Events" VALUES (1, 2020, 'Thanksgiving 2020', 'Test Thanksgiving 2020', '2020-11-26', 'Test Location', 'Test Host', '"[{\"item\":\"Turkey\",\"category\":\"Main Course\"},{\"item\":\"Mashed Potatoes\",\"category\":\"Side Dish\"}]"', '2025-09-07 16:23:54.433-04', '2025-09-07 16:23:54.433-04');
INSERT INTO public."Events" VALUES (2, 2021, 'Thanksgiving 2021', 'Thanksgiving 2021', '2021-11-25', 'Test Location 2', 'Test Host 2', '"[{\"item\":\"Ham\",\"category\":\"Main Course\"},{\"item\":\"Green Beans\",\"category\":\"Side Dish\"}]"', '2025-09-07 16:23:54.433-04', '2025-09-07 16:23:54.433-04');


--
-- Data for Name: Photos; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

INSERT INTO public."Photos" VALUES (1, 1, 'test-photo-1.jpg', 'test-photo-1.jpg', 'Test photo 1', 'Test caption 1', '2025-09-07 16:23:54.551-04', 1024000, 'image/jpeg', NULL, '2025-09-07 16:23:54.551-04', '2025-09-07 16:23:54.551-04');


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

INSERT INTO public."Users" VALUES (1, 'testadmin', 'admin@test.com', '$2a$10$GJ3Gamw23HguBUQ525WhQOcKEkHTyfXvdBeJ7qN.DiNiJEpy4HEZ.', 'admin', 'Test', 'Admin', '2025-09-07 16:23:54.495-04', '2025-09-07 16:23:54.495-04');
INSERT INTO public."Users" VALUES (2, 'testuser', 'user@test.com', '$2a$10$Zbc4wdosYDuoscqLpzruteBPmjO6WKqn.LrP57uD8E9KU2QQ902ne', 'user', 'Test', 'User', '2025-09-07 16:23:54.548-04', '2025-09-07 16:23:54.548-04');


--
-- Data for Name: Sessions; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--



--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (1, 'Thanksgiving Dinner 1994', 'Thanksgiving', 'Canajoharie, NY', '1994-11-24', 'First Thanksgiving Dinner that we have menu for at my parents house in Canajoharie, NY', 'Maguire Family Dinner 1994', '1994_Menu.png');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (2, 'Thanksgiving Dinner 1997', 'Thanksgiving', 'Canajoharie, NY', '1997-11-27', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 1997', '1997_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (3, 'Thanksgiving Dinner 1999', 'Thanksgiving', 'Canajoharie, NY', '1999-11-25', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 1999', '1999_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (4, 'Thanksgiving Dinner 2000', 'Thanksgiving', 'Canajoharie, NY', '2000-11-23', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2000', '2000_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (5, 'Thanksgiving Dinner 2004', 'Thanksgiving', 'Canajoharie, NY', '2004-11-25', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2004', '2004_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (6, 'Thanksgiving Dinner 2005', 'Thanksgiving', 'Canajoharie, NY', '2005-11-24', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2005', '2005_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (7, 'Thanksgiving Dinner 2002', 'Thanksgiving', 'Canajoharie, NY', '2002-11-28', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2002', '2002_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (8, 'Thanksgiving Dinner 2006', 'Thanksgiving', 'Canajoharie, NY', '2006-11-23', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2006', '2006_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (9, 'Thanksgiving Dinner 2007', 'Thanksgiving', 'Canajoharie, NY', '2007-11-22', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2007', '2007_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (10, 'Thanksgiving Dinner 2008', 'Thanksgiving', 'Canajoharie, NY', '2008-11-27', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2008', '2008_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (11, 'Thanksgiving Dinner 2009', 'Thanksgiving', 'Canajoharie, NY', '2009-11-26', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2009', '2009_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (12, 'Thanksgiving Dinner 2010', 'Thanksgiving', 'Canajoharie, NY', '2010-11-25', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2010', '2010_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (13, 'Thanksgiving Dinner 2011', 'Thanksgiving', 'Canajoharie, NY', '2011-11-24', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2011', '2011_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (14, 'Thanksgiving Dinner 2012', 'Thanksgiving', 'Canajoharie, NY', '2012-11-22', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2012', '2012_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (15, 'Thanksgiving Dinner 2013', 'Thanksgiving', 'Canajoharie, NY', '2013-11-28', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2013', '2013_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (16, 'Thanksgiving Dinner 2014', 'Thanksgiving', 'Canajoharie, NY', '2014-11-27', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2014', '2014_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (17, 'Thanksgiving Dinner 2015', 'Thanksgiving', 'Canajoharie, NY', '2015-11-26', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2015', '2015_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (18, 'Thanksgiving Dinner 2016', 'Thanksgiving', 'Canajoharie, NY', '2016-11-24', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2016', '2016_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (19, 'Thanksgiving Dinner 2017', 'Thanksgiving', 'Canajoharie, NY', '2017-11-23', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2017', '2017_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (20, 'Thanksgiving Dinner 2018', 'Thanksgiving', 'Canajoharie, NY', '2018-11-22', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2018', '2018_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (21, 'Thanksgiving Dinner 2019', 'Thanksgiving', 'Canajoharie, NY', '2019-11-28', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2019', '2019_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (22, 'Thanksgiving Dinner 2020', 'Thanksgiving', 'Canajoharie, NY', '2020-11-26', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2020', '2020_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (23, 'Thanksgiving Dinner 2021', 'Thanksgiving', 'Canajoharie, NY', '2021-11-25', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2021', '2021_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (24, 'Thanksgiving Dinner 2022', 'Thanksgiving', 'Canajoharie, NY', '2022-11-24', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2022', '2022_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (25, 'Thanksgiving Dinner 2023', 'Thanksgiving', 'Canajoharie, NY', '2023-11-23', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2023', '2023_Menu.jpeg');
INSERT INTO public.events OVERRIDING SYSTEM VALUE VALUES (26, 'Thanksgiving Dinner 2024', 'Thanksgiving', 'Canajoharie, NY', '2024-11-28', 'This dinner was in my parents house in Canajoharie, NY', 'Thanksgiving 2024', '2024_Menu.jpeg');


--
-- Data for Name: tutorials; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

INSERT INTO public.tutorials VALUES (1, 'Node Tut #3', 'Tut#3 description', false, '2025-09-01 18:25:30.415-04', '2025-09-01 18:25:30.415-04');
INSERT INTO public.tutorials VALUES (2, 'Node JS Tut #2', 'Tut#2 description', true, '2025-09-01 18:27:19.748-04', '2025-09-01 18:39:51.103-04');


--
-- Name: Events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."Events_event_id_seq"', 2, true);


--
-- Name: Photos_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."Photos_photo_id_seq"', 1, false);


--
-- Name: Users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."Users_user_id_seq"', 2, true);


--
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public.events_event_id_seq', 52, true);


--
-- Name: tutorials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public.tutorials_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

\unrestrict MMkFwj4XjRWaFyOSGdz2fU9tSXEMToNW9X2PwiP0IbOhd3LzXDtU5Q5yAI606Z1

