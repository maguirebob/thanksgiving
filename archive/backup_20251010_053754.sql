--
-- PostgreSQL database dump
--

\restrict Ir65Mf84Li2Deu1MNQ6Rb7UF8L2RrqQwReWzm4abgbSMNUFmH7UZWMtoeM5WCHh

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: bobmaguire
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO bobmaguire;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: bobmaguire
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ContentType; Type: TYPE; Schema: public; Owner: bobmaguire
--

CREATE TYPE public."ContentType" AS ENUM (
    'menu',
    'photo',
    'page_photo',
    'blog',
    'text',
    'heading'
);


ALTER TYPE public."ContentType" OWNER TO bobmaguire;

--
-- Name: PhotoType; Type: TYPE; Schema: public; Owner: bobmaguire
--

CREATE TYPE public."PhotoType" AS ENUM (
    'individual',
    'page'
);


ALTER TYPE public."PhotoType" OWNER TO bobmaguire;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'user',
    'admin'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: BlogPosts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BlogPosts" (
    blog_post_id integer NOT NULL,
    event_id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    excerpt text,
    featured_image character varying(255),
    tags text[],
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    images text[]
);


ALTER TABLE public."BlogPosts" OWNER TO postgres;

--
-- Name: BlogPosts_blog_post_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BlogPosts_blog_post_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BlogPosts_blog_post_id_seq" OWNER TO postgres;

--
-- Name: BlogPosts_blog_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BlogPosts_blog_post_id_seq" OWNED BY public."BlogPosts".blog_post_id;


--
-- Name: JournalContentItems; Type: TABLE; Schema: public; Owner: bobmaguire
--

CREATE TABLE public."JournalContentItems" (
    content_item_id integer NOT NULL,
    journal_page_id integer NOT NULL,
    content_type public."ContentType" NOT NULL,
    content_id integer,
    custom_text text,
    heading_level integer DEFAULT 1,
    display_order integer NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JournalContentItems" OWNER TO bobmaguire;

--
-- Name: JournalContentItems_content_item_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public."JournalContentItems_content_item_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."JournalContentItems_content_item_id_seq" OWNER TO bobmaguire;

--
-- Name: JournalContentItems_content_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public."JournalContentItems_content_item_id_seq" OWNED BY public."JournalContentItems".content_item_id;


--
-- Name: JournalPages; Type: TABLE; Schema: public; Owner: bobmaguire
--

CREATE TABLE public."JournalPages" (
    journal_page_id integer NOT NULL,
    event_id integer NOT NULL,
    year integer NOT NULL,
    page_number integer DEFAULT 1 NOT NULL,
    title character varying(255),
    description text,
    layout_config jsonb,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JournalPages" OWNER TO bobmaguire;

--
-- Name: JournalPages_journal_page_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public."JournalPages_journal_page_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."JournalPages_journal_page_id_seq" OWNER TO bobmaguire;

--
-- Name: JournalPages_journal_page_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public."JournalPages_journal_page_id_seq" OWNED BY public."JournalPages".journal_page_id;


--
-- Name: Photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Photos" (
    photo_id integer NOT NULL,
    event_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    original_filename character varying(255),
    description text,
    caption text,
    taken_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    file_size integer,
    mime_type character varying(100),
    file_data text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    s3_url character varying(500),
    photo_type public."PhotoType" DEFAULT 'individual'::public."PhotoType" NOT NULL
);


ALTER TABLE public."Photos" OWNER TO postgres;

--
-- Name: Photos_photo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Photos_photo_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Photos_photo_id_seq" OWNER TO postgres;

--
-- Name: Photos_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Photos_photo_id_seq" OWNED BY public."Photos".photo_id;


--
-- Name: Recipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Recipes" (
    recipe_id integer NOT NULL,
    event_id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    description text,
    ingredients text NOT NULL,
    instructions text NOT NULL,
    prep_time integer,
    cook_time integer,
    servings integer,
    difficulty_level character varying(20),
    category character varying(50),
    image_filename character varying(255),
    is_featured boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    image_s3_url character varying(500)
);


ALTER TABLE public."Recipes" OWNER TO postgres;

--
-- Name: Recipes_recipe_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Recipes_recipe_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Recipes_recipe_id_seq" OWNER TO postgres;

--
-- Name: Recipes_recipe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Recipes_recipe_id_seq" OWNED BY public."Recipes".recipe_id;


--
-- Name: Sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sessions" (
    session_id character varying(128) NOT NULL,
    user_id integer,
    expires timestamp(3) without time zone NOT NULL,
    data text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Sessions" OWNER TO postgres;

--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    user_id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public."UserRole" DEFAULT 'user'::public."UserRole" NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: Users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Users_user_id_seq" OWNER TO postgres;

--
-- Name: Users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_user_id_seq" OWNED BY public."Users".user_id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    event_id integer NOT NULL,
    event_name character varying(255) NOT NULL,
    event_type character varying(255) NOT NULL,
    event_location character varying(255),
    event_date date NOT NULL,
    event_description text,
    menu_title character varying(255) NOT NULL,
    menu_image_filename character varying(255) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    menu_image_s3_url character varying(500)
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_event_id_seq OWNER TO postgres;

--
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- Name: BlogPosts blog_post_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts" ALTER COLUMN blog_post_id SET DEFAULT nextval('public."BlogPosts_blog_post_id_seq"'::regclass);


--
-- Name: JournalContentItems content_item_id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalContentItems" ALTER COLUMN content_item_id SET DEFAULT nextval('public."JournalContentItems_content_item_id_seq"'::regclass);


--
-- Name: JournalPages journal_page_id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalPages" ALTER COLUMN journal_page_id SET DEFAULT nextval('public."JournalPages_journal_page_id_seq"'::regclass);


--
-- Name: Photos photo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos" ALTER COLUMN photo_id SET DEFAULT nextval('public."Photos_photo_id_seq"'::regclass);


--
-- Name: Recipes recipe_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipes" ALTER COLUMN recipe_id SET DEFAULT nextval('public."Recipes_recipe_id_seq"'::regclass);


--
-- Name: Users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN user_id SET DEFAULT nextval('public."Users_user_id_seq"'::regclass);


--
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- Data for Name: BlogPosts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BlogPosts" (blog_post_id, event_id, user_id, title, content, excerpt, featured_image, tags, status, published_at, created_at, updated_at, images) FROM stdin;
4	15	1	Old Journal Pages from 2013	I wrote these pages in 2013 the week after Thanksgiving:	\N	/api/blog-images/f3aa9756-2a50-4a97-ab22-c63556345cdf.jpeg/preview	{}	published	2025-10-09 11:29:55.828	2025-10-09 11:29:55.829	2025-10-09 11:31:44.912	{/api/blog-images/fa5803ba-405d-4b1f-bcb5-019d1efd4a54.jpeg/preview}
5	15	1	2013 Thoughts	Looking at the photos, the menu and the journal entries jogged a few things in my memory.  Noel dressed up as Santa that year.  I can't remember why, but it was fun.  Based on the pictures, this is the year Ally's two friends came.  I know I said in the journal that it might be Papa Goose's last year, but based on the menus, I think he was with us in 2014.	\N	\N	{Summary}	published	2025-10-09 11:37:15.044	2025-10-09 11:37:15.046	2025-10-09 11:37:15.046	{}
7	16	1	2014 Planning	I often write a short entry in my planning notebook.  Here is the one from 2014:	\N	/api/blog-images/331cf149-b273-4a82-9a63-bf4fc7200547.jpg/preview	{Summary}	published	2025-10-09 12:54:02.477	2025-10-09 12:54:02.477	2025-10-09 12:54:02.477	{}
8	17	1	Maeve's 1st Journal Entry	She is very excited:	\N	/api/blog-images/490f29c5-6435-4bfb-87e7-5bb74fac7129.jpg/preview	{Summary}	published	2025-10-09 12:55:51.259	2025-10-09 12:55:51.261	2025-10-09 12:55:51.261	{}
\.


--
-- Data for Name: JournalContentItems; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public."JournalContentItems" (content_item_id, journal_page_id, content_type, content_id, custom_text, heading_level, display_order, is_visible, created_at, updated_at) FROM stdin;
50	7	heading	\N	Menu	2	1	t	2025-10-09 21:18:06.915	2025-10-09 21:18:06.915
51	7	menu	15	\N	\N	2	t	2025-10-09 21:18:06.92	2025-10-09 21:18:06.92
52	7	heading	\N	Photos	2	3	t	2025-10-09 21:18:06.922	2025-10-09 21:18:06.922
53	7	photo	40	\N	\N	4	t	2025-10-09 21:18:06.924	2025-10-09 21:18:06.924
54	7	heading	\N	Scrap Book Pages	2	5	t	2025-10-09 21:18:06.927	2025-10-09 21:18:06.927
55	7	page_photo	37	\N	\N	6	t	2025-10-09 21:18:06.93	2025-10-09 21:18:06.93
56	7	page_photo	36	\N	\N	7	t	2025-10-09 21:18:06.932	2025-10-09 21:18:06.932
57	7	page_photo	38	\N	\N	8	t	2025-10-09 21:18:06.935	2025-10-09 21:18:06.935
58	7	heading	\N	Journal Entries	2	9	t	2025-10-09 21:18:06.937	2025-10-09 21:18:06.937
59	7	blog	4	\N	\N	10	t	2025-10-09 21:18:06.939	2025-10-09 21:18:06.939
\.


--
-- Data for Name: JournalPages; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public."JournalPages" (journal_page_id, event_id, year, page_number, title, description, layout_config, is_published, created_at, updated_at) FROM stdin;
7	15	2013	1	Page 1	\N	null	f	2025-10-09 20:36:51.448	2025-10-09 21:18:06.901
\.


--
-- Data for Name: Photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Photos" (photo_id, event_id, filename, original_filename, description, caption, taken_date, file_size, mime_type, file_data, created_at, updated_at, s3_url, photo_type) FROM stdin;
37	15	c564c4a1-85db-4808-919f-f75929201339.jpeg	IMG_6044.jpeg	\N	2013 Photos	2025-10-09 11:28:13.503	1952635	image/jpeg	\N	2025-10-09 11:28:13.503	2025-10-09 13:11:05.091	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/c564c4a1-85db-4808-919f-f75929201339.jpeg	page
39	16	eaf916cc-0450-42af-8b67-6359cd9f9e42.jpeg	IMG_6046.jpeg	\N	2014 Photos	2025-10-09 12:44:01.778	3218437	image/jpeg	\N	2025-10-09 12:44:01.778	2025-10-09 12:44:01.778	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/eaf916cc-0450-42af-8b67-6359cd9f9e42.jpeg	individual
36	15	e6f1783a-f81b-4453-b190-ae7c5566d208.jpeg	IMG_6043.jpeg	\N	2013 Photos	2025-10-09 11:27:49.262	3248052	image/jpeg	\N	2025-10-09 11:27:49.262	2025-10-09 13:10:58.507	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/e6f1783a-f81b-4453-b190-ae7c5566d208.jpeg	page
38	15	a6d6b8b1-5102-4a09-be6a-5ff0f423aea7.jpeg	IMG_6045.jpeg	\N	2013 Photos	2025-10-09 11:28:39.147	2976458	image/jpeg	\N	2025-10-09 11:28:39.147	2025-10-09 13:11:07.895	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/a6d6b8b1-5102-4a09-be6a-5ff0f423aea7.jpeg	page
40	15	826b97ac-9bac-40d2-941a-49483d3ba450.jpg	img20251006_09133400.jpg	\N	\N	2025-10-09 13:12:49.383	138249	image/jpeg	\N	2025-10-09 13:12:49.383	2025-10-09 13:12:49.383	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/826b97ac-9bac-40d2-941a-49483d3ba450.jpg	individual
\.


--
-- Data for Name: Recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Recipes" (recipe_id, event_id, user_id, title, description, ingredients, instructions, prep_time, cook_time, servings, difficulty_level, category, image_filename, is_featured, created_at, updated_at, image_s3_url) FROM stdin;
\.


--
-- Data for Name: Sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sessions" (session_id, user_id, expires, data, created_at) FROM stdin;
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (user_id, username, email, password_hash, role, first_name, last_name, created_at, updated_at) FROM stdin;
1	testadmin	admin@test.com	$2a$10$GJ3Gamw23HguBUQ525WhQOcKEkHTyfXvdBeJ7qN.DiNiJEpy4HEZ.	admin	Test	Admin	2025-09-07 16:23:54.495	2025-09-07 16:23:54.495
2	testuser	user@test.com	$2a$10$Zbc4wdosYDuoscqLpzruteBPmjO6WKqn.LrP57uD8E9KU2QQ902ne	user	Test	User	2025-09-07 16:23:54.548	2025-09-07 16:23:54.548
9	admin	admin@thanksgiving.com	$2a$12$bY1XewnDCoy5388MDws0ceY7cLFX3uaHK3vV9MjAxFrlG4SOc91q.	admin	Admin	User	2025-10-08 19:05:06.832	2025-10-09 12:50:56.27
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
bc135867-d137-4e6f-8bac-c2e31627c073	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	2025-10-08 14:47:06.241053-04	0001_init	\N	\N	2025-10-08 14:47:06.233266-04	1
34468ff2-a601-4898-9f07-402c46402cf8	87b0ae1779fe7fa09a60894ce9ccd9f7042ea3775294786dea0959324866b546	2025-10-08 14:47:06.24227-04	20251002214904_add_event_timestamps	\N	\N	2025-10-08 14:47:06.241303-04	1
bac92d09-ebf5-49a4-976f-d873e54ba33e	b60f9c6c75f85e646720c242a31f483e4cbe7c4c5603da23c5cc8068628e037f	2025-10-08 14:47:06.243211-04	20251005145930_add_s3_url_fields	\N	\N	2025-10-08 14:47:06.242606-04	1
3d198980-ee3e-459e-85e3-8952b9aa29a4	9bcfb14530129c20d85b3f1d73cc74cc5b0a123f59edf371404a92a19b1d3d7d	2025-10-08 14:47:06.244222-04	20251008124037_add_blog_images_field	\N	\N	2025-10-08 14:47:06.243562-04	1
dc472201-b3ad-45bc-a56a-510608b9f783	90fb5a77f3d737f8fdc6d44c20f853824574f455d4879299b1cf2a529b7a82d5	2025-10-08 14:47:06.247726-04	20251008144637_add_journal_tables_and_photo_type	\N	\N	2025-10-08 14:47:06.24441-04	1
9da40ab3-ec75-4701-be89-c4334a948d42	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	\N	0001_init	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 0001_init\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "UserRole" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"UserRole\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1177), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="0001_init"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="0001_init"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2025-10-03 09:02:08.362115-04	2025-10-03 09:02:02.521929-04	0
60776147-0820-4e62-a097-b1e2ac2639cd	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	2025-10-03 09:02:08.394511-04	0001_init		\N	2025-10-03 09:02:08.394511-04	0
4e2dfff4-9298-4c4e-9218-c2759da6c5c3	87b0ae1779fe7fa09a60894ce9ccd9f7042ea3775294786dea0959324866b546	2025-10-03 09:02:12.424267-04	20251002214904_add_event_timestamps	\N	\N	2025-10-03 09:02:12.346602-04	1
ba2e5804-685c-4820-96ef-250519df22a9	b60f9c6c75f85e646720c242a31f483e4cbe7c4c5603da23c5cc8068628e037f	2025-10-05 15:43:25.466851-04	20251005145930_add_s3_url_fields	\N	\N	2025-10-05 15:43:25.459998-04	1
ade19142-31de-43f6-bfc1-d02ec2d75fa3	9bcfb14530129c20d85b3f1d73cc74cc5b0a123f59edf371404a92a19b1d3d7d	2025-10-08 12:43:49.766325-04	20251008124037_add_blog_images_field	\N	\N	2025-10-08 12:43:49.755797-04	1
dfa02ed0-5a8e-45cd-96cd-ec74c8ad149e	6ad1a236e61c3fe1fb0a3e6b02e3bdea76b05c4d01ea4c83e3e6afb89ca22af1	2025-10-09 15:45:54.360405-04	20251009194554_add_menu_relation_to_journal_content_items	\N	\N	2025-10-09 15:45:54.357679-04	1
9568328a-252d-4f33-af51-645c35488764	af567d73eff0ae3f8a23f7c22ca6caf1919f084e35f3af503e15b3aa73e97cae	2025-10-09 15:49:52.802124-04	20251009194952_remove_conflicting_foreign_keys	\N	\N	2025-10-09 15:49:52.800236-04	1
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (event_id, event_name, event_type, event_location, event_date, event_description, menu_title, menu_image_filename, created_at, updated_at, menu_image_s3_url) FROM stdin;
1	Thanksgiving Dinner 1994	Thanksgiving	Canajoharie, NY	1994-11-24	First Thanksgiving Dinner that we have menu for at my parents house in Canajoharie, NY	Maguire Family Dinner 1994	1994_Menu.png	2025-10-08 14:59:09.366	2025-10-09 19:58:49.661	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/1994_Menu.png
2	Thanksgiving Dinner 1997	Thanksgiving	Canajoharie, NY	1997-11-27	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 1997	1997_Menu.jpeg	2025-10-08 14:59:09.367	2025-10-09 19:58:49.992	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/1997_Menu.jpeg
3	Thanksgiving Dinner 1999	Thanksgiving	Canajoharie, NY	1999-11-25	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 1999	1999_Menu.jpeg	2025-10-08 14:59:09.367	2025-10-09 19:58:50.291	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/1999_Menu.jpeg
4	Thanksgiving Dinner 2000	Thanksgiving	Canajoharie, NY	2000-11-23	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2000	2000_Menu.jpeg	2025-10-08 14:59:09.367	2025-10-09 19:58:50.612	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2000_Menu.jpeg
5	Thanksgiving Dinner 2004	Thanksgiving	Canajoharie, NY	2004-11-25	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2004	2004_Menu.jpeg	2025-10-08 14:59:09.367	2025-10-09 19:58:50.804	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2004_Menu.jpeg
6	Thanksgiving Dinner 2005	Thanksgiving	Canajoharie, NY	2005-11-24	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2005	2005_Menu.jpeg	2025-10-08 14:59:09.367	2025-10-09 19:58:51.008	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2005_Menu.jpeg
7	Thanksgiving Dinner 2002	Thanksgiving	Canajoharie, NY	2002-11-28	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2002	2002_Menu.jpeg	2025-10-08 14:59:09.367	2025-10-09 19:58:51.333	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2002_Menu.jpeg
8	Thanksgiving Dinner 2006	Thanksgiving	Canajoharie, NY	2006-11-23	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2006	2006_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:51.542	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2006_Menu.jpeg
9	Thanksgiving Dinner 2007	Thanksgiving	Canajoharie, NY	2007-11-22	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2007	2007_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:51.769	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2007_Menu.jpeg
10	Thanksgiving Dinner 2008	Thanksgiving	Canajoharie, NY	2008-11-27	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2008	2008_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:52.423	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2008_Menu.jpeg
11	Thanksgiving Dinner 2009	Thanksgiving	Canajoharie, NY	2009-11-26	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2009	2009_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:52.735	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2009_Menu.jpeg
12	Thanksgiving Dinner 2010	Thanksgiving	Canajoharie, NY	2010-11-25	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2010	2010_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:53.226	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2010_Menu.jpeg
13	Thanksgiving Dinner 2011	Thanksgiving	Canajoharie, NY	2011-11-24	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2011	2011_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:53.704	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2011_Menu.jpeg
14	Thanksgiving Dinner 2012	Thanksgiving	Canajoharie, NY	2012-11-22	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2012	2012_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:54.044	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2012_Menu.jpeg
15	Thanksgiving Dinner 2013	Thanksgiving	Canajoharie, NY	2013-11-28	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2013	2013_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:54.529	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2013_Menu.jpeg
16	Thanksgiving Dinner 2014	Thanksgiving	Canajoharie, NY	2014-11-27	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2014	2014_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:55.108	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2014_Menu.jpeg
17	Thanksgiving Dinner 2015	Thanksgiving	Canajoharie, NY	2015-11-26	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2015	2015_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:55.594	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2015_Menu.jpeg
18	Thanksgiving Dinner 2016	Thanksgiving	Canajoharie, NY	2016-11-24	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2016	2016_Menu.jpeg	2025-10-08 14:59:09.368	2025-10-09 19:58:55.864	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2016_Menu.jpeg
19	Thanksgiving Dinner 2017	Thanksgiving	Canajoharie, NY	2017-11-23	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2017	2017_Menu.jpeg	2025-10-08 14:59:09.369	2025-10-09 19:58:56.141	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2017_Menu.jpeg
20	Thanksgiving Dinner 2018	Thanksgiving	Canajoharie, NY	2018-11-22	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2018	2018_Menu.jpeg	2025-10-08 14:59:09.369	2025-10-09 19:58:56.583	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2018_Menu.jpeg
22	Thanksgiving Dinner 2020	Thanksgiving	Canajoharie, NY	2020-11-26	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2020	2020_Menu.jpeg	2025-10-08 14:59:09.369	2025-10-09 19:58:57.118	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2020_Menu.jpeg
23	Thanksgiving Dinner 2021	Thanksgiving	Canajoharie, NY	2021-11-25	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2021	2021_Menu.jpeg	2025-10-08 14:59:09.369	2025-10-09 19:58:57.525	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2021_Menu.jpeg
24	Thanksgiving Dinner 2022	Thanksgiving	Canajoharie, NY	2022-11-24	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2022	2022_Menu.jpeg	2025-10-08 14:59:09.369	2025-10-09 19:58:58.029	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2022_Menu.jpeg
25	Thanksgiving Dinner 2023	Thanksgiving	Canajoharie, NY	2023-11-23	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2023	2023_Menu.jpeg	2025-10-08 14:59:09.369	2025-10-09 19:58:58.4	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2023_Menu.jpeg
26	Thanksgiving Dinner 2024	Thanksgiving	Canajoharie, NY	2024-11-28	This dinner was in my parents house in Canajoharie, NY	Thanksgiving 2024	2024_Menu.jpeg	2025-10-08 14:59:09.369	2025-10-09 19:58:58.763	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2024_Menu.jpeg
41	Thanksgiving 2019	Thanksgiving	Family Home - Middletown, NJ	2019-11-28	\N	Thanksgiving 2019	81bf13c1-6d2a-47b6-8e8a-3dc08467debc.jpeg	2025-10-08 19:08:52.09	2025-10-08 19:08:52.09	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/81bf13c1-6d2a-47b6-8e8a-3dc08467debc.jpeg
\.


--
-- Name: BlogPosts_blog_post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BlogPosts_blog_post_id_seq"', 8, true);


--
-- Name: JournalContentItems_content_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."JournalContentItems_content_item_id_seq"', 59, true);


--
-- Name: JournalPages_journal_page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."JournalPages_journal_page_id_seq"', 8, true);


--
-- Name: Photos_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Photos_photo_id_seq"', 40, true);


--
-- Name: Recipes_recipe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Recipes_recipe_id_seq"', 1, false);


--
-- Name: Users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_user_id_seq"', 9, true);


--
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_event_id_seq', 41, true);


--
-- Name: BlogPosts BlogPosts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts"
    ADD CONSTRAINT "BlogPosts_pkey" PRIMARY KEY (blog_post_id);


--
-- Name: JournalContentItems JournalContentItems_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalContentItems"
    ADD CONSTRAINT "JournalContentItems_pkey" PRIMARY KEY (content_item_id);


--
-- Name: JournalPages JournalPages_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalPages"
    ADD CONSTRAINT "JournalPages_pkey" PRIMARY KEY (journal_page_id);


--
-- Name: Photos Photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos"
    ADD CONSTRAINT "Photos_pkey" PRIMARY KEY (photo_id);


--
-- Name: Recipes Recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipes"
    ADD CONSTRAINT "Recipes_pkey" PRIMARY KEY (recipe_id);


--
-- Name: Sessions Sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sessions"
    ADD CONSTRAINT "Sessions_pkey" PRIMARY KEY (session_id);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (user_id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- Name: JournalPages_event_id_year_page_number_key; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE UNIQUE INDEX "JournalPages_event_id_year_page_number_key" ON public."JournalPages" USING btree (event_id, year, page_number);


--
-- Name: Users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Users_email_key" ON public."Users" USING btree (email);


--
-- Name: Users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Users_username_key" ON public."Users" USING btree (username);


--
-- Name: BlogPosts BlogPosts_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts"
    ADD CONSTRAINT "BlogPosts_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BlogPosts BlogPosts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts"
    ADD CONSTRAINT "BlogPosts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalContentItems JournalContentItems_journal_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalContentItems"
    ADD CONSTRAINT "JournalContentItems_journal_page_id_fkey" FOREIGN KEY (journal_page_id) REFERENCES public."JournalPages"(journal_page_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalPages JournalPages_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalPages"
    ADD CONSTRAINT "JournalPages_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Photos Photos_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos"
    ADD CONSTRAINT "Photos_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Recipes Recipes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipes"
    ADD CONSTRAINT "Recipes_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Recipes Recipes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipes"
    ADD CONSTRAINT "Recipes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Sessions Sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sessions"
    ADD CONSTRAINT "Sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: bobmaguire
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Ir65Mf84Li2Deu1MNQ6Rb7UF8L2RrqQwReWzm4abgbSMNUFmH7UZWMtoeM5WCHh

