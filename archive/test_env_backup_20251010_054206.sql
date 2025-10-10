--
-- PostgreSQL database dump
--

\restrict ETsjeQEl4s1PKmDPta0MA4Xjdmoz9ddafhKSPn4oMMs0QjEKaWpkfL6qg6ANhVX

-- Dumped from database version 17.6 (Debian 17.6-2.pgdg13+1)
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
    s3_url character varying(500)
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
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
1	38	1	2025 Thoughts	I am really looking forward to introducing the Maguire Thanksgiving Website to this years Thanksgiving.  The ability to store and share memories from out day together makes me really happy.	\N	\N	{Summary}	published	2025-10-08 17:01:26.078	2025-10-08 17:01:26.079	2025-10-08 17:01:51.072	{}
3	15	1	Old Journal Pages from 2013	I wrote these pages in 2013 the week after Thanksgiving:	\N	/api/blog-images/11dd42a9-fee6-4657-b69b-39b21b837990.jpeg/preview	{Summary}	published	2025-10-08 18:13:25.182	2025-10-08 18:13:25.19	2025-10-08 18:13:25.19	{/api/blog-images/4afd6129-0767-44d6-9928-2fd0635f4ff9.jpeg/preview}
\.


--
-- Data for Name: Photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Photos" (photo_id, event_id, filename, original_filename, description, caption, taken_date, file_size, mime_type, file_data, created_at, updated_at, s3_url) FROM stdin;
5	6	ab0702cc-f282-4641-a691-a1c6404afd8e.jpeg	IMG_6016.jpeg	\N	\N	2025-10-06 14:19:46.198	2087255	image/jpeg	\N	2025-10-06 14:19:46.198	2025-10-06 14:19:46.198	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/ab0702cc-f282-4641-a691-a1c6404afd8e.jpeg
8	6	fc9f7b8d-4843-4dfc-a565-d09d4a573aa4.jpeg	IMG_6024.jpeg	\N	\N	2025-10-06 20:14:32.999	2138148	image/jpeg	\N	2025-10-06 20:14:32.999	2025-10-06 20:14:32.999	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/fc9f7b8d-4843-4dfc-a565-d09d4a573aa4.jpeg
22	9	817d7641-cf29-4714-b5f0-fa984f44cf7c.jpeg	IMG_6022.jpeg	\N	2007 Photos	2025-10-07 10:28:22.401	1830539	image/jpeg	\N	2025-10-07 10:28:22.401	2025-10-07 10:28:22.401	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/817d7641-cf29-4714-b5f0-fa984f44cf7c.jpeg
23	9	0581ee25-2fc7-4c91-9fd4-c34c9fe75118.jpeg	IMG_6023.jpeg	\N	2007 Photos	2025-10-07 10:28:38.395	3098441	image/jpeg	\N	2025-10-07 10:28:38.395	2025-10-07 10:28:38.395	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/0581ee25-2fc7-4c91-9fd4-c34c9fe75118.jpeg
9	5	8c3f9fcb-d04b-4155-a3f8-68a4fc756e11.jpg	img20251006_09133400.jpg	I think this might have been Grandma's last Thanksgiving.  I think her last year she didn't make to dinner.  She was failing, but still wanted to help.  Do you see anything strange about this picture?	Grandma's Last Thanksgiving	2025-10-06 20:17:00	138249	image/jpeg	\N	2025-10-06 20:17:46.171	2025-10-06 20:19:27.806	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/8c3f9fcb-d04b-4155-a3f8-68a4fc756e11.jpg
10	40	3dd58ef1-062d-470a-91c5-a48c2e39cf33.jpeg	IMG_6025.jpeg	\N	2005 Photos	2025-10-07 09:14:46.72	2028684	image/jpeg	\N	2025-10-07 09:14:46.72	2025-10-07 09:14:46.72	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/3dd58ef1-062d-470a-91c5-a48c2e39cf33.jpeg
11	8	b445cc4e-51e3-4c5e-be33-74d52ec8cd92.jpeg	IMG_6026.jpeg	\N	2006 Photos	2025-10-07 09:20:15.993	1973349	image/jpeg	\N	2025-10-07 09:20:15.993	2025-10-07 09:20:15.993	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/b445cc4e-51e3-4c5e-be33-74d52ec8cd92.jpeg
12	8	5c15696d-c2d7-4b10-960e-812261c11f74.jpeg	IMG_6027.jpeg	\N	2006 Photos	2025-10-07 09:25:31.246	2956213	image/jpeg	\N	2025-10-07 09:25:31.246	2025-10-07 09:25:31.246	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/5c15696d-c2d7-4b10-960e-812261c11f74.jpeg
13	10	43338c92-b87b-4e1f-ac14-670b7a96eb6c.jpeg	IMG_6028.jpeg	\N	2008 Photos	2025-10-07 09:27:21.506	1830690	image/jpeg	\N	2025-10-07 09:27:21.506	2025-10-07 09:27:21.506	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/43338c92-b87b-4e1f-ac14-670b7a96eb6c.jpeg
14	11	809e68ab-2e3e-4a48-a1bd-10b88377efb8.jpeg	IMG_6030.jpeg	\N	2009 Photos	2025-10-07 09:28:39.153	1956505	image/jpeg	\N	2025-10-07 09:28:39.153	2025-10-07 09:28:39.153	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/809e68ab-2e3e-4a48-a1bd-10b88377efb8.jpeg
15	11	7218868f-e826-4d17-b349-9d6e29e26aa0.jpeg	IMG_6031.jpeg	\N	2009 Photos	2025-10-07 09:29:21.853	2162815	image/jpeg	\N	2025-10-07 09:29:21.853	2025-10-07 09:29:21.853	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/7218868f-e826-4d17-b349-9d6e29e26aa0.jpeg
16	11	8a697de4-08ac-4795-aedd-084a524f7496.jpeg	IMG_6032.jpeg	\N	2009 Photos	2025-10-07 09:29:50.682	2236412	image/jpeg	\N	2025-10-07 09:29:50.682	2025-10-07 09:29:50.682	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/8a697de4-08ac-4795-aedd-084a524f7496.jpeg
17	12	74b700a3-11a2-4369-85c9-16c8baa7f4f0.jpeg	IMG_6033.jpeg	\N	2010 Photos	2025-10-07 09:30:37.036	2127807	image/jpeg	\N	2025-10-07 09:30:37.036	2025-10-07 09:30:37.036	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/74b700a3-11a2-4369-85c9-16c8baa7f4f0.jpeg
18	12	7beaf4f8-1b43-4667-8fc1-067cd6456ad3.jpeg	IMG_6034.jpeg	\N	2010 Photos	2025-10-07 09:31:02.713	2143456	image/jpeg	\N	2025-10-07 09:31:02.713	2025-10-07 09:31:02.713	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/7beaf4f8-1b43-4667-8fc1-067cd6456ad3.jpeg
19	12	eaa4f7e0-69d4-4f77-b43b-38c0f742071d.jpeg	IMG_6035.jpeg	\N	2010 Photos	2025-10-07 09:31:34.345	2378106	image/jpeg	\N	2025-10-07 09:31:34.345	2025-10-07 09:31:34.345	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/eaa4f7e0-69d4-4f77-b43b-38c0f742071d.jpeg
20	12	08e03933-5348-457f-86ef-f5ab5d3079d4.jpeg	IMG_6036.jpeg	\N	2010 Photos	2025-10-07 09:32:11.882	2477725	image/jpeg	\N	2025-10-07 09:32:11.882	2025-10-07 09:32:11.882	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/08e03933-5348-457f-86ef-f5ab5d3079d4.jpeg
24	8	a0ebce61-6f82-4865-af42-855a36b8e8e6.jpeg	IMG_6037.jpeg	\N	2006 Photos	2025-10-07 10:30:52.414	2159846	image/jpeg	\N	2025-10-07 10:30:52.414	2025-10-07 10:30:52.414	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/a0ebce61-6f82-4865-af42-855a36b8e8e6.jpeg
25	10	2aadd968-a4bc-4f57-8137-f49ab734f189.jpeg	IMG_6029.jpeg	\N	2008 Photos	2025-10-07 10:33:19.924	1950473	image/jpeg	\N	2025-10-07 10:33:19.924	2025-10-07 10:33:19.924	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/2aadd968-a4bc-4f57-8137-f49ab734f189.jpeg
26	9	c0b81864-2439-4007-acdc-7af958a496a9.jpeg	IMG_6037.jpeg	\N	2007 Photos	2025-10-07 11:04:24.196	2159846	image/jpeg	\N	2025-10-07 11:04:24.196	2025-10-07 11:04:24.196	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/c0b81864-2439-4007-acdc-7af958a496a9.jpeg
27	13	665bade7-efd1-4f5f-b904-e69416f3ab85.jpeg	IMG_6038.jpeg	\N	2011 Photos	2025-10-07 11:06:10.025	2100853	image/jpeg	\N	2025-10-07 11:06:10.025	2025-10-07 11:06:10.025	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/665bade7-efd1-4f5f-b904-e69416f3ab85.jpeg
28	13	28ccb3e9-85dd-4fdc-9f83-0ac98de4d64b.jpeg	IMG_6039.jpeg	\N	2011 Photos	2025-10-07 11:07:07.254	2223953	image/jpeg	\N	2025-10-07 11:07:07.254	2025-10-07 11:07:07.254	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/28ccb3e9-85dd-4fdc-9f83-0ac98de4d64b.jpeg
29	16	e5d7ef0b-2f87-440e-a9ab-b1f25ff40ce3.jpeg	IMG_6046.jpeg	\N	2014 Photos	2025-10-07 11:11:45.679	3218437	image/jpeg	\N	2025-10-07 11:11:45.679	2025-10-07 11:11:45.679	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/e5d7ef0b-2f87-440e-a9ab-b1f25ff40ce3.jpeg
30	14	1fd90a73-182c-4b1c-93d6-bb52e246ca9b.jpeg	IMG_6040.jpeg	\N	2012 Photos	2025-10-07 11:14:14.256	1905326	image/jpeg	\N	2025-10-07 11:14:14.256	2025-10-07 11:14:14.256	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/1fd90a73-182c-4b1c-93d6-bb52e246ca9b.jpeg
32	14	de15e77b-edbe-452f-93b6-b5a146235ad8.jpeg	IMG_6042.jpeg	\N	2012 Photos	2025-10-07 11:14:58.778	1985278	image/jpeg	\N	2025-10-07 11:14:58.778	2025-10-07 11:14:58.778	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/de15e77b-edbe-452f-93b6-b5a146235ad8.jpeg
33	15	f17cc992-6606-4ca6-ba0e-858cadcd0208.jpeg	IMG_6043.jpeg	\N	2013 Photos	2025-10-07 11:17:29.273	3248052	image/jpeg	\N	2025-10-07 11:17:29.273	2025-10-07 11:17:29.273	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/f17cc992-6606-4ca6-ba0e-858cadcd0208.jpeg
34	15	0c88b083-74e3-4167-a4dd-b0af19a755a1.jpeg	IMG_6044.jpeg	\N	2013 Photos	2025-10-07 11:18:42.692	1952635	image/jpeg	\N	2025-10-07 11:18:42.692	2025-10-07 11:18:42.692	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/0c88b083-74e3-4167-a4dd-b0af19a755a1.jpeg
35	15	cbfe1a47-5575-4dba-8f39-2c6301ec834f.jpeg	IMG_6045.jpeg	\N	2013 Photos	2025-10-07 11:19:49.6	2976458	image/jpeg	\N	2025-10-07 11:19:49.6	2025-10-07 11:19:49.6	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/photos/cbfe1a47-5575-4dba-8f39-2c6301ec834f.jpeg
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
1	admin	admin@thanksgiving.com	$2a$12$L.eVtfAR3oBSvinZlVboyO95ci9jsqN6Rfm1kVpShUVr9.Y0brk9O	admin	\N	\N	2025-09-29 22:57:25.093	2025-09-29 23:15:24.773
2	user	user@gmail.com	$2a$10$sRIg1.Shk1ermBlbjDl2Ee8XBNccDxHo9mXmwZOYeZJJdsr7UEEDS	user	Bruce	Wayne	2025-09-30 16:49:08.962	2025-09-30 16:49:08.962
3	testuser	chowderhead85@gmail.com	$2a$10$DV7Y4BdlpdUBnpXf6kGnsubyiSMex7Ls8648VIY7PESwJ.0oHsqhq	user	Bruce	Wayne	2025-10-07 12:08:06.713	2025-10-07 12:08:06.713
4	favoritechild	maeve.maguire@yahoo.com	$2a$10$PA8s.sFND1UAzBPYnEi7BeMKC55mDmhCwoxLIM0OC/FxI1cI2l5Qu	user	Maeve	Maguire	2025-10-07 13:14:07.834	2025-10-07 13:14:07.834
5	FionaMaguire	fi.maguire03@gmail.com	$2a$10$SHVdXzfIG5hfbdzz8/E5cOqRaGVrghZxaZa6OZzEy7NSB27ucbCry	user	Fiona	Maguire	2025-10-07 13:21:27.394	2025-10-07 13:21:27.394
6	Josie	jm2878@cornell.edu	$2a$10$9hY7743l3NzfJaTHUYSZ0eUGoUKhmfcke1mgK8EtFr8m0ckMBANEK	user	Josie	Maguire	2025-10-07 13:22:02.088	2025-10-07 13:22:02.088
7	phil@lamberts.com	phil@lamberts.com	$2a$10$WfG.hze/TWlnYqC3qUfkSegfUcobt/DrNES0mp8e.Xt2VYhyLZAPi	user	Philip	Lambert	2025-10-07 13:28:58.975	2025-10-07 13:28:58.975
8	tmaguire92@yahoo.com	tmaguire92@yahoo.com	$2a$10$XHUSyFYiqLq7HIeqQivt9.6tcD9SFIAU.BvX3M8I05pI5DAVb3IJq	user	Tricia	Maguire	2025-10-08 13:50:31.175	2025-10-08 13:50:31.175
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9da40ab3-ec75-4701-be89-c4334a948d42	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	\N	0001_init	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 0001_init\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "UserRole" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"UserRole\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1177), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="0001_init"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="0001_init"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2025-10-03 13:02:08.362115+00	2025-10-03 13:02:02.521929+00	0
60776147-0820-4e62-a097-b1e2ac2639cd	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	2025-10-03 13:02:08.394511+00	0001_init		\N	2025-10-03 13:02:08.394511+00	0
4e2dfff4-9298-4c4e-9218-c2759da6c5c3	87b0ae1779fe7fa09a60894ce9ccd9f7042ea3775294786dea0959324866b546	2025-10-03 13:02:12.424267+00	20251002214904_add_event_timestamps	\N	\N	2025-10-03 13:02:12.346602+00	1
ba2e5804-685c-4820-96ef-250519df22a9	b60f9c6c75f85e646720c242a31f483e4cbe7c4c5603da23c5cc8068628e037f	2025-10-05 19:43:25.466851+00	20251005145930_add_s3_url_fields	\N	\N	2025-10-05 19:43:25.459998+00	1
ade19142-31de-43f6-bfc1-d02ec2d75fa3	9bcfb14530129c20d85b3f1d73cc74cc5b0a123f59edf371404a92a19b1d3d7d	2025-10-08 16:43:49.766325+00	20251008124037_add_blog_images_field	\N	\N	2025-10-08 16:43:49.755797+00	1
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (event_id, event_name, event_type, event_location, event_date, event_description, menu_title, menu_image_filename, created_at, updated_at, menu_image_s3_url) FROM stdin;
13	Thanksgiving 2011	Thanksgiving	Family Home	2011-11-24	A special Thanksgiving gathering in 2011	Thanksgiving Menu 2011	2011_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.72	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2011_Menu.jpeg
14	Thanksgiving 2012	Thanksgiving	Family Home	2012-11-22	A special Thanksgiving gathering in 2012	Thanksgiving Menu 2012	2012_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.721	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2012_Menu.jpeg
15	Thanksgiving 2013	Thanksgiving	Family Home	2013-11-28	A special Thanksgiving gathering in 2013	Thanksgiving Menu 2013	2013_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.723	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2013_Menu.jpeg
16	Thanksgiving 2014	Thanksgiving	Family Home	2014-11-27	A special Thanksgiving gathering in 2014	Thanksgiving Menu 2014	2014_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.724	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2014_Menu.jpeg
17	Thanksgiving 2015	Thanksgiving	Family Home	2015-11-26	A special Thanksgiving gathering in 2015	Thanksgiving Menu 2015	2015_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.726	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2015_Menu.jpeg
18	Thanksgiving 2016	Thanksgiving	Family Home	2016-11-24	A special Thanksgiving gathering in 2016	Thanksgiving Menu 2016	2016_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.728	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2016_Menu.jpeg
19	Thanksgiving 2017	Thanksgiving	Family Home	2017-11-23	A special Thanksgiving gathering in 2017	Thanksgiving Menu 2017	2017_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.729	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2017_Menu.jpeg
20	Thanksgiving 2018	Thanksgiving	Family Home	2018-11-22	A special Thanksgiving gathering in 2018	Thanksgiving Menu 2018	2018_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.731	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2018_Menu.jpeg
23	Thanksgiving 2021	Thanksgiving	Family Home	2021-11-25	A special Thanksgiving gathering in 2021	Thanksgiving Menu 2021	2021_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.736	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2021_Menu.jpeg
24	Thanksgiving 2022	Thanksgiving	Family Home	2022-11-24	A special Thanksgiving gathering in 2022	Thanksgiving Menu 2022	2022_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.737	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2022_Menu.jpeg
25	Thanksgiving 2023	Thanksgiving	Family Home	2023-11-23	A special Thanksgiving gathering in 2023	Thanksgiving Menu 2023	2023_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.739	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2023_Menu.jpeg
26	Thanksgiving 2024	Thanksgiving	Family Home	2024-11-28	A special Thanksgiving gathering in 2024	Thanksgiving Menu 2024	2024_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.741	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2024_Menu.jpeg
2	Thanksgiving 1997	Thanksgiving	Family Home	1997-11-27	A special Thanksgiving gathering in 1997	Thanksgiving Menu 1997	1997_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.699	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/1997_Menu.jpeg
3	Thanksgiving 1999	Thanksgiving	Family Home	1999-11-25	A special Thanksgiving gathering in 1999	Thanksgiving Menu 1999	1999_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.701	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/1999_Menu.jpeg
4	Thanksgiving 2000	Thanksgiving	Family Home	2000-11-23	A special Thanksgiving gathering in 2000	Thanksgiving Menu 2000	2000_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.703	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2000_Menu.jpeg
5	Thanksgiving 2002	Thanksgiving	Family Home	2002-11-28	A special Thanksgiving gathering in 2002	Thanksgiving Menu 2002	2002_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.705	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2002_Menu.jpeg
6	Thanksgiving 2004	Thanksgiving	Family Home	2004-11-25	A special Thanksgiving gathering in 2004	Thanksgiving Menu 2004	2004_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.706	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2004_Menu.jpeg
8	Thanksgiving 2006	Thanksgiving	Family Home	2006-11-23	A special Thanksgiving gathering in 2006	Thanksgiving Menu 2006	2006_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.708	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2006_Menu.jpeg
9	Thanksgiving 2007	Thanksgiving	Family Home	2007-11-22	A special Thanksgiving gathering in 2007	Thanksgiving Menu 2007	2007_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.71	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2007_Menu.jpeg
10	Thanksgiving 2008	Thanksgiving	Family Home	2008-11-27	A special Thanksgiving gathering in 2008	Thanksgiving Menu 2008	2008_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.715	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2008_Menu.jpeg
11	Thanksgiving 2009	Thanksgiving	Family Home	2009-11-26	A special Thanksgiving gathering in 2009	Thanksgiving Menu 2009	2009_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.717	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2009_Menu.jpeg
12	Thanksgiving 2010	Thanksgiving	Family Home	2010-11-25	A special Thanksgiving gathering in 2010	Thanksgiving Menu 2010	2010_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.719	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2010_Menu.jpeg
22	Thanksgiving 2020	Thanksgiving	Family Home	2020-11-26	A special Thanksgiving gathering in 2020	Thanksgiving Menu 2020	2020_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.733	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/2020_Menu.jpeg
1	Thanksgiving 1994	Thanksgiving	Family Home	1994-11-24	A special Thanksgiving gathering in 1994	Thanksgiving Menu 1994	1994_Menu.png	2025-10-03 13:02:12.378	2025-10-05 21:24:06.692	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/1994_Menu.png
38	Thanksgiving 2025	Thanksgiving	Family Home - Middletown, NJ	2025-11-27	\N	Thanksgiving 2025	9ed7b0b8-281a-4985-90ff-b59463ea7f12.jpeg	2025-10-05 21:26:18.739	2025-10-05 21:26:18.739	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/9ed7b0b8-281a-4985-90ff-b59463ea7f12.jpeg
39	Thanksgiving 2019	Thanksgiving	Family Home - Middletown, NJ	2019-11-28	\N	Thanksgiving 2019	731aaa23-1bc8-4453-a2d4-d130ac7024fe.jpeg	2025-10-06 11:27:47.098	2025-10-06 11:27:47.098	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/731aaa23-1bc8-4453-a2d4-d130ac7024fe.jpeg
40	Thanksgiving 2005	Thanksgiving	Family Home - Middletown, NJ	2005-11-24	\N	Thanksgiving 2005	cb8c1af3-aacc-463b-a1c5-46895613131d.jpg	2025-10-07 09:11:45.184	2025-10-07 09:11:45.184	https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/cb8c1af3-aacc-463b-a1c5-46895613131d.jpg
\.


--
-- Name: BlogPosts_blog_post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BlogPosts_blog_post_id_seq"', 3, true);


--
-- Name: Photos_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Photos_photo_id_seq"', 35, true);


--
-- Name: Recipes_recipe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Recipes_recipe_id_seq"', 1, false);


--
-- Name: Users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_user_id_seq"', 8, true);


--
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_event_id_seq', 40, true);


--
-- Name: BlogPosts BlogPosts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts"
    ADD CONSTRAINT "BlogPosts_pkey" PRIMARY KEY (blog_post_id);


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
-- PostgreSQL database dump complete
--

\unrestrict ETsjeQEl4s1PKmDPta0MA4Xjdmoz9ddafhKSPn4oMMs0QjEKaWpkfL6qg6ANhVX

