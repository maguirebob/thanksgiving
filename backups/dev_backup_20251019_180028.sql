--
-- PostgreSQL database dump
--

\restrict vF4JfVpATbDEzKni4VgL4jiTqDfSiLj8fWeDaZPdFdByMG00eAb8XpeBXy8KET2

-- Dumped from database version 17.6 (Postgres.app)
-- Dumped by pg_dump version 17.6 (Postgres.app)

-- Started on 2025-10-19 18:00:28 EDT

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
-- TOC entry 2 (class 3079 OID 48088)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3843 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 235 (class 1255 OID 48116)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: bobmaguire
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO bobmaguire;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 48099)
-- Name: events; Type: TABLE; Schema: public; Owner: bobmaguire
--

CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    event_type character varying(50) DEFAULT 'thanksgiving'::character varying NOT NULL,
    event_date date NOT NULL,
    location character varying(255),
    description text,
    host_family_member_id uuid,
    status character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid,
    menu_image character varying(255),
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['planned'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.events OWNER TO bobmaguire;

--
-- TOC entry 3844 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON TABLE public.events IS 'Primary table for organizing family memories around events';


--
-- TOC entry 3845 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.id; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.id IS 'Unique identifier for the event';


--
-- TOC entry 3846 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.name; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.name IS 'Display name for the event (e.g., "Thanksgiving 2025")';


--
-- TOC entry 3847 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.event_type; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.event_type IS 'Type of event (thanksgiving, christmas, etc.)';


--
-- TOC entry 3848 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.event_date; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.event_date IS 'Date when the event occurs';


--
-- TOC entry 3849 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.location; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.location IS 'Physical location where event takes place';


--
-- TOC entry 3850 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.description; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.description IS 'Additional details about the event';


--
-- TOC entry 3851 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.host_family_member_id; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.host_family_member_id IS 'ID of family member hosting the event';


--
-- TOC entry 3852 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.status; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.status IS 'Current status of the event';


--
-- TOC entry 3853 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.created_at; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.created_at IS 'Timestamp when event was created';


--
-- TOC entry 3854 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.updated_at; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.updated_at IS 'Timestamp when event was last modified';


--
-- TOC entry 3855 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.created_by; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.created_by IS 'ID of user who created the event';


--
-- TOC entry 3856 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.updated_by; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.updated_by IS 'ID of user who last updated the event';


--
-- TOC entry 3857 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN events.menu_image; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.menu_image IS 'Filename of the menu image for this event';


--
-- TOC entry 224 (class 1259 OID 48362)
-- Name: menu_items; Type: TABLE; Schema: public; Owner: bobmaguire
--

CREATE TABLE public.menu_items (
    id integer NOT NULL,
    menu_id integer,
    name character varying(255) NOT NULL,
    category character varying(100),
    description text,
    order_index integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.menu_items OWNER TO bobmaguire;

--
-- TOC entry 223 (class 1259 OID 48361)
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_id_seq OWNER TO bobmaguire;

--
-- TOC entry 3858 (class 0 OID 0)
-- Dependencies: 223
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- TOC entry 222 (class 1259 OID 48346)
-- Name: menus; Type: TABLE; Schema: public; Owner: bobmaguire
--

CREATE TABLE public.menus (
    id integer NOT NULL,
    event_id uuid,
    year integer NOT NULL,
    title character varying(255) NOT NULL,
    image_path character varying(500) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.menus OWNER TO bobmaguire;

--
-- TOC entry 221 (class 1259 OID 48345)
-- Name: menus_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public.menus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menus_id_seq OWNER TO bobmaguire;

--
-- TOC entry 3859 (class 0 OID 0)
-- Dependencies: 221
-- Name: menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public.menus_id_seq OWNED BY public.menus.id;


--
-- TOC entry 219 (class 1259 OID 48079)
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: bobmaguire
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.schema_migrations OWNER TO bobmaguire;

--
-- TOC entry 218 (class 1259 OID 48078)
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schema_migrations_id_seq OWNER TO bobmaguire;

--
-- TOC entry 3860 (class 0 OID 0)
-- Dependencies: 218
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- TOC entry 3661 (class 2604 OID 48365)
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- TOC entry 3658 (class 2604 OID 48349)
-- Name: menus id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menus ALTER COLUMN id SET DEFAULT nextval('public.menus_id_seq'::regclass);


--
-- TOC entry 3651 (class 2604 OID 48082)
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- TOC entry 3833 (class 0 OID 48099)
-- Dependencies: 220
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public.events (id, name, event_type, event_date, location, description, host_family_member_id, status, created_at, updated_at, created_by, updated_by, menu_image) FROM stdin;
1cd91e35-2e8b-44d1-bb31-8ee19947149a	Thanksgiving 2024	thanksgiving	2024-11-28	123 Main Street, Anytown, USA	Thanksgiving 2024 - featuring our traditional family menu with all the classics	\N	completed	2025-09-08 11:25:26.361665-04	2025-09-08 11:25:26.361665-04	00000000-0000-0000-0000-000000000000	\N	2024_Menu.jpeg
1c0a9b38-5a8c-45af-a44e-8eabc3accaf2	Thanksgiving 2023	thanksgiving	2023-11-23	123 Main Street, Anytown, USA	Thanksgiving 2023 - another wonderful year of family traditions	\N	completed	2025-09-08 11:25:26.365692-04	2025-09-08 11:25:26.365692-04	00000000-0000-0000-0000-000000000000	\N	2023_Menu.jpeg
b2dfe4c9-6bb9-4474-9c23-ba3272c8519c	Thanksgiving 2022	thanksgiving	2022-11-24	123 Main Street, Anytown, USA	Thanksgiving 2022 - back to normal after the pandemic years	\N	completed	2025-09-08 11:25:26.36605-04	2025-09-08 11:25:26.36605-04	00000000-0000-0000-0000-000000000000	\N	2022_Menu.jpeg
4859eb60-4f8c-4e57-b856-03ea91afb32c	Thanksgiving 2021	thanksgiving	2021-11-25	123 Main Street, Anytown, USA	Thanksgiving 2021 - smaller gathering but still full of love	\N	completed	2025-09-08 11:25:26.36643-04	2025-09-08 11:25:26.36643-04	00000000-0000-0000-0000-000000000000	\N	2021_Menu.jpeg
17c648e5-904a-4450-8aea-dc3c5ed49766	Thanksgiving 2020	thanksgiving	2020-11-26	123 Main Street, Anytown, USA	Thanksgiving 2020 - virtual celebration during the pandemic	\N	completed	2025-09-08 11:25:26.366758-04	2025-09-08 11:25:26.366758-04	00000000-0000-0000-0000-000000000000	\N	2020_Menu.jpeg
0f8c3a80-9f6b-42f1-bbac-3450c076429a	Thanksgiving 2019	thanksgiving	2019-11-28	123 Main Street, Anytown, USA	Thanksgiving 2019 - the last normal year before everything changed	\N	completed	2025-09-08 11:25:26.367118-04	2025-09-08 11:25:26.367118-04	00000000-0000-0000-0000-000000000000	\N	2019_Menu.jpeg
987eb154-8816-4819-861d-0b791060a186	Thanksgiving 2015	thanksgiving	2015-11-26	123 Main Street, Anytown, USA	Thanksgiving 2015 - memorable year with the extended family	\N	completed	2025-09-08 11:25:26.367419-04	2025-09-08 11:25:26.367419-04	00000000-0000-0000-0000-000000000000	\N	2015_Menu.jpeg
b68b7273-ad29-4f53-baf5-7c9f7bc68e45	Thanksgiving 2010	thanksgiving	2010-11-25	123 Main Street, Anytown, USA	Thanksgiving 2010 - celebrating a decade of family traditions	\N	completed	2025-09-08 11:25:26.367709-04	2025-09-08 11:25:26.367709-04	00000000-0000-0000-0000-000000000000	\N	2010_Menu.jpeg
5407371b-a1dd-4dc5-8988-d1cf3e9f308a	Thanksgiving 2005	thanksgiving	2005-11-24	123 Main Street, Anytown, USA	Thanksgiving 2005 - the kids were so young back then!	\N	completed	2025-09-08 11:25:26.367994-04	2025-09-08 11:25:26.367994-04	00000000-0000-0000-0000-000000000000	\N	2005_Menu.jpeg
c5a493d8-2439-40db-8ffe-9212d90ce2fd	Thanksgiving 2000	thanksgiving	2000-11-23	123 Main Street, Anytown, USA	Thanksgiving 2000 - Y2K survived and we celebrated in style	\N	completed	2025-09-08 11:25:26.368261-04	2025-09-08 11:25:26.368261-04	00000000-0000-0000-0000-000000000000	\N	2000_Menu.jpeg
4b676e08-2e9f-4b3d-a042-4b984efb0cf7	Thanksgiving 1999	thanksgiving	1999-11-25	123 Main Street, Anytown, USA	Thanksgiving 1999 - the last Thanksgiving of the millennium	\N	completed	2025-09-08 11:25:26.368486-04	2025-09-08 11:25:26.368486-04	00000000-0000-0000-0000-000000000000	\N	1999_Menu.jpeg
b722e802-5bf1-45db-a5f4-5ed81b65f421	Thanksgiving 1997	thanksgiving	1997-11-27	123 Main Street, Anytown, USA	Thanksgiving 1997 - early years of our family tradition	\N	completed	2025-09-08 11:25:26.368752-04	2025-09-08 11:25:26.368752-04	00000000-0000-0000-0000-000000000000	\N	1997_Menu.jpeg
db8d0122-c37d-4850-85d6-20dddddd822c	Thanksgiving 1994	thanksgiving	1994-11-24	123 Main Street, Anytown, USA	Thanksgiving 1994 - the very first year we started this tradition	\N	completed	2025-09-08 11:25:26.368951-04	2025-09-08 11:25:26.368951-04	00000000-0000-0000-0000-000000000000	\N	1994_Menu.png
419de84a-d17a-4be5-be62-783eb8615423	Thanksgiving 2025	thanksgiving	2025-11-27	123 Main Street, Anytown, USA	Thanksgiving 2025 - planning our next celebration with new recipes and old favorites	\N	planned	2025-09-08 11:25:26.369133-04	2025-09-08 11:25:26.369133-04	00000000-0000-0000-0000-000000000000	\N	\N
19eed052-986c-4897-aae7-84a81f90cb7c	Thanksgiving 2002	thanksgiving	2002-11-28	Family Home	Thanksgiving celebration in 2002	\N	completed	2025-09-17 17:41:02.499746-04	2025-09-17 17:41:02.499746-04	\N	\N	\N
7a7621ca-842b-4443-bb1e-5dd11da96fd6	Thanksgiving 2004	thanksgiving	2004-11-28	Family Home	Thanksgiving celebration in 2004	\N	completed	2025-09-17 17:41:02.507771-04	2025-09-17 17:41:02.507771-04	\N	\N	\N
a20fd32d-e51c-4ad3-bdd9-51016332a129	Thanksgiving 2006	thanksgiving	2006-11-28	Family Home	Thanksgiving celebration in 2006	\N	completed	2025-09-17 17:41:02.511845-04	2025-09-17 17:41:02.511845-04	\N	\N	\N
b1802c45-abaa-4014-b661-5ce2a02828a0	Thanksgiving 2007	thanksgiving	2007-11-28	Family Home	Thanksgiving celebration in 2007	\N	completed	2025-09-17 17:41:02.513509-04	2025-09-17 17:41:02.513509-04	\N	\N	\N
f64d41ef-8501-4e69-81e5-43afd30b768d	Thanksgiving 2008	thanksgiving	2008-11-28	Family Home	Thanksgiving celebration in 2008	\N	completed	2025-09-17 17:41:02.515226-04	2025-09-17 17:41:02.515226-04	\N	\N	\N
bab078f1-7a10-42d8-90b9-3c60ae2cee27	Thanksgiving 2009	thanksgiving	2009-11-28	Family Home	Thanksgiving celebration in 2009	\N	completed	2025-09-17 17:41:02.516968-04	2025-09-17 17:41:02.516968-04	\N	\N	\N
a3fdf948-0d4c-4f77-846d-957a6bf32664	Thanksgiving 2011	thanksgiving	2011-11-28	Family Home	Thanksgiving celebration in 2011	\N	completed	2025-09-17 17:41:02.520414-04	2025-09-17 17:41:02.520414-04	\N	\N	\N
eae442d2-d07f-4b49-8a5d-2c75e7d09b64	Thanksgiving 2012	thanksgiving	2012-11-28	Family Home	Thanksgiving celebration in 2012	\N	completed	2025-09-17 17:41:02.52208-04	2025-09-17 17:41:02.52208-04	\N	\N	\N
5235f948-6b2f-4c0d-b65b-9c2c4168326f	Thanksgiving 2013	thanksgiving	2013-11-28	Family Home	Thanksgiving celebration in 2013	\N	completed	2025-09-17 17:41:02.523519-04	2025-09-17 17:41:02.523519-04	\N	\N	\N
00562923-4075-4936-8805-beda851e86ce	Thanksgiving 2014	thanksgiving	2014-11-28	Family Home	Thanksgiving celebration in 2014	\N	completed	2025-09-17 17:41:02.52525-04	2025-09-17 17:41:02.52525-04	\N	\N	\N
71ea0606-7500-4588-a599-b6098afeb5fa	Thanksgiving 2016	thanksgiving	2016-11-28	Family Home	Thanksgiving celebration in 2016	\N	completed	2025-09-17 17:41:02.528314-04	2025-09-17 17:41:02.528314-04	\N	\N	\N
564a0789-9e4c-41c9-a3e0-8a22ceb088f3	Thanksgiving 2017	thanksgiving	2017-11-28	Family Home	Thanksgiving celebration in 2017	\N	completed	2025-09-17 17:41:02.529767-04	2025-09-17 17:41:02.529767-04	\N	\N	\N
1fc38fca-1f65-471a-95ea-e73ad197a5d7	Thanksgiving 2018	thanksgiving	2018-11-28	Family Home	Thanksgiving celebration in 2018	\N	completed	2025-09-17 17:41:02.531685-04	2025-09-17 17:41:02.531685-04	\N	\N	\N
\.


--
-- TOC entry 3837 (class 0 OID 48362)
-- Dependencies: 224
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public.menu_items (id, menu_id, name, category, description, order_index, created_at) FROM stdin;
1	1	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 1994	1	2025-09-17 17:41:02.491972
2	1	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 1994	2	2025-09-17 17:41:02.492462
3	1	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 1994	3	2025-09-17 17:41:02.492743
4	1	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 1994	4	2025-09-17 17:41:02.493089
5	1	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 1994	5	2025-09-17 17:41:02.49348
6	1	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 1994	6	2025-09-17 17:41:02.493827
7	1	Apple Pie	Dessert	Apple Pie - Thanksgiving 1994	7	2025-09-17 17:41:02.4943
8	2	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 1997	1	2025-09-17 17:41:02.495142
9	2	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 1997	2	2025-09-17 17:41:02.495462
10	2	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 1997	3	2025-09-17 17:41:02.495638
11	2	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 1997	4	2025-09-17 17:41:02.495811
12	2	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 1997	5	2025-09-17 17:41:02.495969
13	2	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 1997	6	2025-09-17 17:41:02.496094
14	2	Apple Pie	Dessert	Apple Pie - Thanksgiving 1997	7	2025-09-17 17:41:02.4963
15	3	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 1999	1	2025-09-17 17:41:02.496839
16	3	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 1999	2	2025-09-17 17:41:02.497068
17	3	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 1999	3	2025-09-17 17:41:02.497232
18	3	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 1999	4	2025-09-17 17:41:02.497396
19	3	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 1999	5	2025-09-17 17:41:02.497555
20	3	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 1999	6	2025-09-17 17:41:02.497685
21	3	Apple Pie	Dessert	Apple Pie - Thanksgiving 1999	7	2025-09-17 17:41:02.497822
22	4	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2000	1	2025-09-17 17:41:02.498427
23	4	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2000	2	2025-09-17 17:41:02.498571
24	4	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2000	3	2025-09-17 17:41:02.498699
25	4	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2000	4	2025-09-17 17:41:02.498823
26	4	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2000	5	2025-09-17 17:41:02.498944
27	4	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2000	6	2025-09-17 17:41:02.499065
28	4	Apple Pie	Dessert	Apple Pie - Thanksgiving 2000	7	2025-09-17 17:41:02.4992
29	5	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2002	1	2025-09-17 17:41:02.506345
30	5	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2002	2	2025-09-17 17:41:02.506546
31	5	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2002	3	2025-09-17 17:41:02.506721
32	5	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2002	4	2025-09-17 17:41:02.506872
33	5	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2002	5	2025-09-17 17:41:02.507032
34	5	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2002	6	2025-09-17 17:41:02.507225
35	5	Apple Pie	Dessert	Apple Pie - Thanksgiving 2002	7	2025-09-17 17:41:02.507383
36	6	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2004	1	2025-09-17 17:41:02.508378
37	6	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2004	2	2025-09-17 17:41:02.508556
38	6	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2004	3	2025-09-17 17:41:02.508764
39	6	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2004	4	2025-09-17 17:41:02.508948
40	6	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2004	5	2025-09-17 17:41:02.509134
41	6	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2004	6	2025-09-17 17:41:02.509326
42	6	Apple Pie	Dessert	Apple Pie - Thanksgiving 2004	7	2025-09-17 17:41:02.509517
43	7	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2005	1	2025-09-17 17:41:02.510286
44	7	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2005	2	2025-09-17 17:41:02.510516
45	7	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2005	3	2025-09-17 17:41:02.510725
46	7	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2005	4	2025-09-17 17:41:02.510909
47	7	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2005	5	2025-09-17 17:41:02.511097
48	7	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2005	6	2025-09-17 17:41:02.511275
49	7	Apple Pie	Dessert	Apple Pie - Thanksgiving 2005	7	2025-09-17 17:41:02.511444
50	8	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2006	1	2025-09-17 17:41:02.51225
51	8	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2006	2	2025-09-17 17:41:02.512475
52	8	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2006	3	2025-09-17 17:41:02.512642
53	8	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2006	4	2025-09-17 17:41:02.512805
54	8	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2006	5	2025-09-17 17:41:02.512959
55	8	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2006	6	2025-09-17 17:41:02.513104
56	8	Apple Pie	Dessert	Apple Pie - Thanksgiving 2006	7	2025-09-17 17:41:02.51324
57	9	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2007	1	2025-09-17 17:41:02.513836
58	9	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2007	2	2025-09-17 17:41:02.513982
59	9	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2007	3	2025-09-17 17:41:02.514256
60	9	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2007	4	2025-09-17 17:41:02.514402
61	9	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2007	5	2025-09-17 17:41:02.514583
62	9	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2007	6	2025-09-17 17:41:02.514723
63	9	Apple Pie	Dessert	Apple Pie - Thanksgiving 2007	7	2025-09-17 17:41:02.514863
64	10	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2008	1	2025-09-17 17:41:02.515566
65	10	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2008	2	2025-09-17 17:41:02.515721
66	10	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2008	3	2025-09-17 17:41:02.515862
67	10	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2008	4	2025-09-17 17:41:02.516043
68	10	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2008	5	2025-09-17 17:41:02.516199
69	10	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2008	6	2025-09-17 17:41:02.516342
70	10	Apple Pie	Dessert	Apple Pie - Thanksgiving 2008	7	2025-09-17 17:41:02.516615
71	11	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2009	1	2025-09-17 17:41:02.517366
72	11	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2009	2	2025-09-17 17:41:02.517526
73	11	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2009	3	2025-09-17 17:41:02.517723
74	11	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2009	4	2025-09-17 17:41:02.517883
75	11	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2009	5	2025-09-17 17:41:02.518055
76	11	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2009	6	2025-09-17 17:41:02.518645
77	11	Apple Pie	Dessert	Apple Pie - Thanksgiving 2009	7	2025-09-17 17:41:02.518787
78	12	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2010	1	2025-09-17 17:41:02.519265
79	12	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2010	2	2025-09-17 17:41:02.519406
80	12	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2010	3	2025-09-17 17:41:02.519537
81	12	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2010	4	2025-09-17 17:41:02.519668
82	12	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2010	5	2025-09-17 17:41:02.519811
83	12	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2010	6	2025-09-17 17:41:02.51996
84	12	Apple Pie	Dessert	Apple Pie - Thanksgiving 2010	7	2025-09-17 17:41:02.520108
85	13	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2011	1	2025-09-17 17:41:02.520913
86	13	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2011	2	2025-09-17 17:41:02.521073
87	13	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2011	3	2025-09-17 17:41:02.52121
88	13	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2011	4	2025-09-17 17:41:02.521344
89	13	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2011	5	2025-09-17 17:41:02.521467
90	13	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2011	6	2025-09-17 17:41:02.52163
91	13	Apple Pie	Dessert	Apple Pie - Thanksgiving 2011	7	2025-09-17 17:41:02.521774
92	14	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2012	1	2025-09-17 17:41:02.522404
93	14	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2012	2	2025-09-17 17:41:02.522535
94	14	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2012	3	2025-09-17 17:41:02.522665
95	14	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2012	4	2025-09-17 17:41:02.522805
96	14	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2012	5	2025-09-17 17:41:02.522931
97	14	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2012	6	2025-09-17 17:41:02.523059
98	14	Apple Pie	Dessert	Apple Pie - Thanksgiving 2012	7	2025-09-17 17:41:02.523227
99	15	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2013	1	2025-09-17 17:41:02.523866
100	15	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2013	2	2025-09-17 17:41:02.524144
101	15	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2013	3	2025-09-17 17:41:02.524358
102	15	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2013	4	2025-09-17 17:41:02.524503
103	15	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2013	5	2025-09-17 17:41:02.524666
104	15	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2013	6	2025-09-17 17:41:02.524813
105	15	Apple Pie	Dessert	Apple Pie - Thanksgiving 2013	7	2025-09-17 17:41:02.52497
106	16	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2014	1	2025-09-17 17:41:02.525572
107	16	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2014	2	2025-09-17 17:41:02.525692
108	16	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2014	3	2025-09-17 17:41:02.525813
109	16	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2014	4	2025-09-17 17:41:02.52598
110	16	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2014	5	2025-09-17 17:41:02.526215
111	16	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2014	6	2025-09-17 17:41:02.526351
112	16	Apple Pie	Dessert	Apple Pie - Thanksgiving 2014	7	2025-09-17 17:41:02.5265
113	17	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2015	1	2025-09-17 17:41:02.52705
114	17	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2015	2	2025-09-17 17:41:02.527203
115	17	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2015	3	2025-09-17 17:41:02.527329
116	17	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2015	4	2025-09-17 17:41:02.527489
117	17	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2015	5	2025-09-17 17:41:02.52762
118	17	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2015	6	2025-09-17 17:41:02.527787
119	17	Apple Pie	Dessert	Apple Pie - Thanksgiving 2015	7	2025-09-17 17:41:02.527923
120	18	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2016	1	2025-09-17 17:41:02.528619
121	18	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2016	2	2025-09-17 17:41:02.528806
122	18	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2016	3	2025-09-17 17:41:02.52899
123	18	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2016	4	2025-09-17 17:41:02.529125
124	18	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2016	5	2025-09-17 17:41:02.529267
125	18	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2016	6	2025-09-17 17:41:02.529399
126	18	Apple Pie	Dessert	Apple Pie - Thanksgiving 2016	7	2025-09-17 17:41:02.529527
127	19	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2017	1	2025-09-17 17:41:02.530351
128	19	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2017	2	2025-09-17 17:41:02.530545
129	19	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2017	3	2025-09-17 17:41:02.530707
130	19	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2017	4	2025-09-17 17:41:02.530907
131	19	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2017	5	2025-09-17 17:41:02.531048
132	19	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2017	6	2025-09-17 17:41:02.53121
133	19	Apple Pie	Dessert	Apple Pie - Thanksgiving 2017	7	2025-09-17 17:41:02.531384
134	20	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2018	1	2025-09-17 17:41:02.532179
135	20	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2018	2	2025-09-17 17:41:02.532419
136	20	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2018	3	2025-09-17 17:41:02.532615
137	20	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2018	4	2025-09-17 17:41:02.532798
138	20	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2018	5	2025-09-17 17:41:02.532981
139	20	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2018	6	2025-09-17 17:41:02.533261
140	20	Apple Pie	Dessert	Apple Pie - Thanksgiving 2018	7	2025-09-17 17:41:02.533432
141	21	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2019	1	2025-09-17 17:41:02.534027
142	21	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2019	2	2025-09-17 17:41:02.534231
143	21	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2019	3	2025-09-17 17:41:02.534386
144	21	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2019	4	2025-09-17 17:41:02.534532
145	21	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2019	5	2025-09-17 17:41:02.534693
146	21	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2019	6	2025-09-17 17:41:02.534821
147	21	Apple Pie	Dessert	Apple Pie - Thanksgiving 2019	7	2025-09-17 17:41:02.534938
148	22	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2020	1	2025-09-17 17:41:02.535351
149	22	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2020	2	2025-09-17 17:41:02.535472
150	22	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2020	3	2025-09-17 17:41:02.53562
151	22	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2020	4	2025-09-17 17:41:02.535738
152	22	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2020	5	2025-09-17 17:41:02.535876
153	22	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2020	6	2025-09-17 17:41:02.536102
154	22	Apple Pie	Dessert	Apple Pie - Thanksgiving 2020	7	2025-09-17 17:41:02.536248
155	23	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2021	1	2025-09-17 17:41:02.536632
156	23	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2021	2	2025-09-17 17:41:02.536735
157	23	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2021	3	2025-09-17 17:41:02.536847
158	23	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2021	4	2025-09-17 17:41:02.536973
159	23	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2021	5	2025-09-17 17:41:02.537198
160	23	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2021	6	2025-09-17 17:41:02.537336
161	23	Apple Pie	Dessert	Apple Pie - Thanksgiving 2021	7	2025-09-17 17:41:02.537451
162	24	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2022	1	2025-09-17 17:41:02.537802
163	24	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2022	2	2025-09-17 17:41:02.537916
164	24	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2022	3	2025-09-17 17:41:02.538026
165	24	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2022	4	2025-09-17 17:41:02.538141
166	24	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2022	5	2025-09-17 17:41:02.538255
167	24	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2022	6	2025-09-17 17:41:02.538368
168	24	Apple Pie	Dessert	Apple Pie - Thanksgiving 2022	7	2025-09-17 17:41:02.538496
169	25	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2023	1	2025-09-17 17:41:02.538866
170	25	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2023	2	2025-09-17 17:41:02.538952
171	25	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2023	3	2025-09-17 17:41:02.539053
172	25	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2023	4	2025-09-17 17:41:02.539189
173	25	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2023	5	2025-09-17 17:41:02.539341
174	25	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2023	6	2025-09-17 17:41:02.53945
175	25	Apple Pie	Dessert	Apple Pie - Thanksgiving 2023	7	2025-09-17 17:41:02.539532
176	26	Roast Turkey	Main Course	Roast Turkey - Thanksgiving 2024	1	2025-09-17 17:41:02.539846
177	26	Mashed Potatoes	Sides	Mashed Potatoes - Thanksgiving 2024	2	2025-09-17 17:41:02.539932
178	26	Cranberry Sauce	Sides	Cranberry Sauce - Thanksgiving 2024	3	2025-09-17 17:41:02.540061
179	26	Green Bean Casserole	Sides	Green Bean Casserole - Thanksgiving 2024	4	2025-09-17 17:41:02.540181
180	26	Sweet Potato Casserole	Sides	Sweet Potato Casserole - Thanksgiving 2024	5	2025-09-17 17:41:02.540299
181	26	Pumpkin Pie	Dessert	Pumpkin Pie - Thanksgiving 2024	6	2025-09-17 17:41:02.540431
182	26	Apple Pie	Dessert	Apple Pie - Thanksgiving 2024	7	2025-09-17 17:41:02.540542
\.


--
-- TOC entry 3835 (class 0 OID 48346)
-- Dependencies: 222
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public.menus (id, event_id, year, title, image_path, description, created_at, updated_at) FROM stdin;
1	db8d0122-c37d-4850-85d6-20dddddd822c	1994	Thanksgiving Menu 1994	/images/1994_Menu.png	Traditional Thanksgiving menu from 1994	2025-09-17 17:41:02.489945	2025-09-17 17:41:02.489945
2	b722e802-5bf1-45db-a5f4-5ed81b65f421	1997	Thanksgiving Menu 1997	/images/1997_Menu.jpeg	Traditional Thanksgiving menu from 1997	2025-09-17 17:41:02.494864	2025-09-17 17:41:02.494864
3	4b676e08-2e9f-4b3d-a042-4b984efb0cf7	1999	Thanksgiving Menu 1999	/images/1999_Menu.jpeg	Traditional Thanksgiving menu from 1999	2025-09-17 17:41:02.496637	2025-09-17 17:41:02.496637
4	c5a493d8-2439-40db-8ffe-9212d90ce2fd	2000	Thanksgiving Menu 2000	/images/2000_Menu.jpeg	Traditional Thanksgiving menu from 2000	2025-09-17 17:41:02.498166	2025-09-17 17:41:02.498166
5	19eed052-986c-4897-aae7-84a81f90cb7c	2002	Thanksgiving Menu 2002	/images/2002_Menu.jpeg	Traditional Thanksgiving menu from 2002	2025-09-17 17:41:02.506046	2025-09-17 17:41:02.506046
6	7a7621ca-842b-4443-bb1e-5dd11da96fd6	2004	Thanksgiving Menu 2004	/images/2004_Menu.jpeg	Traditional Thanksgiving menu from 2004	2025-09-17 17:41:02.508002	2025-09-17 17:41:02.508002
7	5407371b-a1dd-4dc5-8988-d1cf3e9f308a	2005	Thanksgiving Menu 2005	/images/2005_Menu.jpeg	Traditional Thanksgiving menu from 2005	2025-09-17 17:41:02.509926	2025-09-17 17:41:02.509926
8	a20fd32d-e51c-4ad3-bdd9-51016332a129	2006	Thanksgiving Menu 2006	/images/2006_Menu.jpeg	Traditional Thanksgiving menu from 2006	2025-09-17 17:41:02.51207	2025-09-17 17:41:02.51207
9	b1802c45-abaa-4014-b661-5ce2a02828a0	2007	Thanksgiving Menu 2007	/images/2007_Menu.jpeg	Traditional Thanksgiving menu from 2007	2025-09-17 17:41:02.513674	2025-09-17 17:41:02.513674
10	f64d41ef-8501-4e69-81e5-43afd30b768d	2008	Thanksgiving Menu 2008	/images/2008_Menu.jpeg	Traditional Thanksgiving menu from 2008	2025-09-17 17:41:02.515401	2025-09-17 17:41:02.515401
11	bab078f1-7a10-42d8-90b9-3c60ae2cee27	2009	Thanksgiving Menu 2009	/images/2009_Menu.jpeg	Traditional Thanksgiving menu from 2009	2025-09-17 17:41:02.517186	2025-09-17 17:41:02.517186
12	b68b7273-ad29-4f53-baf5-7c9f7bc68e45	2010	Thanksgiving Menu 2010	/images/2010_Menu.jpeg	Traditional Thanksgiving menu from 2010	2025-09-17 17:41:02.519093	2025-09-17 17:41:02.519093
13	a3fdf948-0d4c-4f77-846d-957a6bf32664	2011	Thanksgiving Menu 2011	/images/2011_Menu.jpeg	Traditional Thanksgiving menu from 2011	2025-09-17 17:41:02.52065	2025-09-17 17:41:02.52065
14	eae442d2-d07f-4b49-8a5d-2c75e7d09b64	2012	Thanksgiving Menu 2012	/images/2012_Menu.jpeg	Traditional Thanksgiving menu from 2012	2025-09-17 17:41:02.522257	2025-09-17 17:41:02.522257
15	5235f948-6b2f-4c0d-b65b-9c2c4168326f	2013	Thanksgiving Menu 2013	/images/2013_Menu.jpeg	Traditional Thanksgiving menu from 2013	2025-09-17 17:41:02.523674	2025-09-17 17:41:02.523674
16	00562923-4075-4936-8805-beda851e86ce	2014	Thanksgiving Menu 2014	/images/2014_Menu.jpeg	Traditional Thanksgiving menu from 2014	2025-09-17 17:41:02.52542	2025-09-17 17:41:02.52542
17	987eb154-8816-4819-861d-0b791060a186	2015	Thanksgiving Menu 2015	/images/2015_Menu.jpeg	Traditional Thanksgiving menu from 2015	2025-09-17 17:41:02.526825	2025-09-17 17:41:02.526825
18	71ea0606-7500-4588-a599-b6098afeb5fa	2016	Thanksgiving Menu 2016	/images/2016_Menu.jpeg	Traditional Thanksgiving menu from 2016	2025-09-17 17:41:02.528476	2025-09-17 17:41:02.528476
19	564a0789-9e4c-41c9-a3e0-8a22ceb088f3	2017	Thanksgiving Menu 2017	/images/2017_Menu.jpeg	Traditional Thanksgiving menu from 2017	2025-09-17 17:41:02.529994	2025-09-17 17:41:02.529994
20	1fc38fca-1f65-471a-95ea-e73ad197a5d7	2018	Thanksgiving Menu 2018	/images/2018_Menu.jpeg	Traditional Thanksgiving menu from 2018	2025-09-17 17:41:02.531947	2025-09-17 17:41:02.531947
21	0f8c3a80-9f6b-42f1-bbac-3450c076429a	2019	Thanksgiving Menu 2019	/images/2019_Menu.jpeg	Traditional Thanksgiving menu from 2019	2025-09-17 17:41:02.533796	2025-09-17 17:41:02.533796
22	17c648e5-904a-4450-8aea-dc3c5ed49766	2020	Thanksgiving Menu 2020	/images/2020_Menu.jpeg	Traditional Thanksgiving menu from 2020	2025-09-17 17:41:02.535197	2025-09-17 17:41:02.535197
23	4859eb60-4f8c-4e57-b856-03ea91afb32c	2021	Thanksgiving Menu 2021	/images/2021_Menu.jpeg	Traditional Thanksgiving menu from 2021	2025-09-17 17:41:02.536504	2025-09-17 17:41:02.536504
24	b2dfe4c9-6bb9-4474-9c23-ba3272c8519c	2022	Thanksgiving Menu 2022	/images/2022_Menu.jpeg	Traditional Thanksgiving menu from 2022	2025-09-17 17:41:02.537683	2025-09-17 17:41:02.537683
25	1c0a9b38-5a8c-45af-a44e-8eabc3accaf2	2023	Thanksgiving Menu 2023	/images/2023_Menu.jpeg	Traditional Thanksgiving menu from 2023	2025-09-17 17:41:02.538756	2025-09-17 17:41:02.538756
26	1cd91e35-2e8b-44d1-bb31-8ee19947149a	2024	Thanksgiving Menu 2024	/images/2024_Menu.jpeg	Traditional Thanksgiving menu from 2024	2025-09-17 17:41:02.539739	2025-09-17 17:41:02.539739
\.


--
-- TOC entry 3832 (class 0 OID 48079)
-- Dependencies: 219
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public.schema_migrations (id, filename, executed_at) FROM stdin;
1	001_create_events_table.sql	2025-09-08 11:19:48.060999-04
2	002_add_menu_image_to_events.sql	2025-09-08 11:25:11.22006-04
\.


--
-- TOC entry 3861 (class 0 OID 0)
-- Dependencies: 223
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 182, true);


--
-- TOC entry 3862 (class 0 OID 0)
-- Dependencies: 221
-- Name: menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public.menus_id_seq', 26, true);


--
-- TOC entry 3863 (class 0 OID 0)
-- Dependencies: 218
-- Name: schema_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public.schema_migrations_id_seq', 2, true);


--
-- TOC entry 3670 (class 2606 OID 48111)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 3682 (class 2606 OID 48371)
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3679 (class 2606 OID 48355)
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- TOC entry 3666 (class 2606 OID 48087)
-- Name: schema_migrations schema_migrations_filename_key; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_filename_key UNIQUE (filename);


--
-- TOC entry 3668 (class 2606 OID 48085)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3671 (class 1259 OID 48115)
-- Name: idx_events_created_at; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_events_created_at ON public.events USING btree (created_at);


--
-- TOC entry 3672 (class 1259 OID 48377)
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_events_date ON public.events USING btree (event_date);


--
-- TOC entry 3673 (class 1259 OID 48113)
-- Name: idx_events_event_date; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_events_event_date ON public.events USING btree (event_date);


--
-- TOC entry 3674 (class 1259 OID 48112)
-- Name: idx_events_event_type; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_events_event_type ON public.events USING btree (event_type);


--
-- TOC entry 3675 (class 1259 OID 48114)
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- TOC entry 3680 (class 1259 OID 48380)
-- Name: idx_menu_items_menu_id; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_menu_items_menu_id ON public.menu_items USING btree (menu_id);


--
-- TOC entry 3676 (class 1259 OID 48379)
-- Name: idx_menus_event_id; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_menus_event_id ON public.menus USING btree (event_id);


--
-- TOC entry 3677 (class 1259 OID 48378)
-- Name: idx_menus_year; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_menus_year ON public.menus USING btree (year);


--
-- TOC entry 3685 (class 2620 OID 48117)
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: bobmaguire
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3684 (class 2606 OID 48372)
-- Name: menu_items menu_items_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE CASCADE;


--
-- TOC entry 3683 (class 2606 OID 48356)
-- Name: menus menus_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


-- Completed on 2025-10-19 18:00:29 EDT

--
-- PostgreSQL database dump complete
--

\unrestrict vF4JfVpATbDEzKni4VgL4jiTqDfSiLj8fWeDaZPdFdByMG00eAb8XpeBXy8KET2

