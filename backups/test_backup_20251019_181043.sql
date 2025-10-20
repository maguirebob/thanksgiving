--
-- PostgreSQL database dump
--

\restrict VXj1opiuUBU1tDcp7uAaCsNMeLZrCY0Kw4hni2mmkkeJeErBLosEw94oayFeITX

-- Dumped from database version 17.6 (Debian 17.6-2.pgdg13+1)
-- Dumped by pg_dump version 17.6 (Postgres.app)

-- Started on 2025-10-19 18:10:43 EDT

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
-- TOC entry 892 (class 1247 OID 24586)
-- Name: ContentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ContentType" AS ENUM (
    'menu',
    'photo',
    'page_photo',
    'blog',
    'text',
    'heading'
);


ALTER TYPE public."ContentType" OWNER TO postgres;

--
-- TOC entry 889 (class 1247 OID 24580)
-- Name: PhotoType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PhotoType" AS ENUM (
    'individual',
    'page'
);


ALTER TYPE public."PhotoType" OWNER TO postgres;

--
-- TOC entry 868 (class 1247 OID 16399)
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
-- TOC entry 228 (class 1259 OID 16466)
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
-- TOC entry 227 (class 1259 OID 16465)
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
-- TOC entry 3584 (class 0 OID 0)
-- Dependencies: 227
-- Name: BlogPosts_blog_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BlogPosts_blog_post_id_seq" OWNED BY public."BlogPosts".blog_post_id;


--
-- TOC entry 232 (class 1259 OID 24613)
-- Name: JournalContentItems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."JournalContentItems" (
    content_item_id integer NOT NULL,
    journal_section_id integer NOT NULL,
    content_type public."ContentType" NOT NULL,
    content_id integer,
    custom_text text,
    heading_level integer DEFAULT 1,
    display_order integer NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    manual_page_break boolean DEFAULT false NOT NULL,
    page_break_position integer DEFAULT 1
);


ALTER TABLE public."JournalContentItems" OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24612)
-- Name: JournalContentItems_content_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."JournalContentItems_content_item_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."JournalContentItems_content_item_id_seq" OWNER TO postgres;

--
-- TOC entry 3585 (class 0 OID 0)
-- Dependencies: 231
-- Name: JournalContentItems_content_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."JournalContentItems_content_item_id_seq" OWNED BY public."JournalContentItems".content_item_id;


--
-- TOC entry 230 (class 1259 OID 24601)
-- Name: JournalSections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."JournalSections" (
    section_id integer NOT NULL,
    event_id integer NOT NULL,
    year integer NOT NULL,
    section_order integer DEFAULT 1 NOT NULL,
    title character varying(255),
    description text,
    layout_config jsonb,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JournalSections" OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 24600)
-- Name: JournalPages_journal_page_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."JournalPages_journal_page_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."JournalPages_journal_page_id_seq" OWNER TO postgres;

--
-- TOC entry 3586 (class 0 OID 0)
-- Dependencies: 229
-- Name: JournalPages_journal_page_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."JournalPages_journal_page_id_seq" OWNED BY public."JournalSections".section_id;


--
-- TOC entry 224 (class 1259 OID 16432)
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
-- TOC entry 223 (class 1259 OID 16431)
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
-- TOC entry 3587 (class 0 OID 0)
-- Dependencies: 223
-- Name: Photos_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Photos_photo_id_seq" OWNED BY public."Photos".photo_id;


--
-- TOC entry 226 (class 1259 OID 16455)
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
-- TOC entry 225 (class 1259 OID 16454)
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
-- TOC entry 3588 (class 0 OID 0)
-- Dependencies: 225
-- Name: Recipes_recipe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Recipes_recipe_id_seq" OWNED BY public."Recipes".recipe_id;


--
-- TOC entry 234 (class 1259 OID 24664)
-- Name: ScrapbookContent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ScrapbookContent" (
    id integer NOT NULL,
    year integer NOT NULL,
    content_type text NOT NULL,
    content_reference text NOT NULL,
    display_order integer NOT NULL,
    page_break_before boolean DEFAULT false,
    page_break_after boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScrapbookContent_content_type_check" CHECK ((content_type = ANY (ARRAY['title'::text, 'text-paragraph'::text, 'menu'::text, 'photo'::text, 'page-photo'::text, 'blog'::text])))
);


ALTER TABLE public."ScrapbookContent" OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 24663)
-- Name: ScrapbookContent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ScrapbookContent_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ScrapbookContent_id_seq" OWNER TO postgres;

--
-- TOC entry 3589 (class 0 OID 0)
-- Dependencies: 233
-- Name: ScrapbookContent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ScrapbookContent_id_seq" OWNED BY public."ScrapbookContent".id;


--
-- TOC entry 236 (class 1259 OID 24682)
-- Name: ScrapbookFiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ScrapbookFiles" (
    id integer NOT NULL,
    year integer NOT NULL,
    filename character varying(255) NOT NULL,
    local_path character varying(500),
    s3_url character varying(500),
    s3_key character varying(500),
    status character varying(20) DEFAULT 'generated'::character varying NOT NULL,
    file_size integer,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_accessed timestamp without time zone,
    access_count integer DEFAULT 0,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScrapbookFiles_status_check" CHECK (((status)::text = ANY ((ARRAY['generated'::character varying, 'error'::character varying, 'processing'::character varying])::text[])))
);


ALTER TABLE public."ScrapbookFiles" OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 24681)
-- Name: ScrapbookFiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ScrapbookFiles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ScrapbookFiles_id_seq" OWNER TO postgres;

--
-- TOC entry 3590 (class 0 OID 0)
-- Dependencies: 235
-- Name: ScrapbookFiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ScrapbookFiles_id_seq" OWNED BY public."ScrapbookFiles".id;


--
-- TOC entry 220 (class 1259 OID 16414)
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
-- TOC entry 219 (class 1259 OID 16404)
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
-- TOC entry 218 (class 1259 OID 16403)
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
-- TOC entry 3591 (class 0 OID 0)
-- Dependencies: 218
-- Name: Users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_user_id_seq" OWNED BY public."Users".user_id;


--
-- TOC entry 217 (class 1259 OID 16389)
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
-- TOC entry 222 (class 1259 OID 16423)
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
-- TOC entry 221 (class 1259 OID 16422)
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
-- TOC entry 3592 (class 0 OID 0)
-- Dependencies: 221
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- TOC entry 3346 (class 2604 OID 16469)
-- Name: BlogPosts blog_post_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts" ALTER COLUMN blog_post_id SET DEFAULT nextval('public."BlogPosts_blog_post_id_seq"'::regclass);


--
-- TOC entry 3353 (class 2604 OID 24616)
-- Name: JournalContentItems content_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JournalContentItems" ALTER COLUMN content_item_id SET DEFAULT nextval('public."JournalContentItems_content_item_id_seq"'::regclass);


--
-- TOC entry 3349 (class 2604 OID 24604)
-- Name: JournalSections section_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JournalSections" ALTER COLUMN section_id SET DEFAULT nextval('public."JournalPages_journal_page_id_seq"'::regclass);


--
-- TOC entry 3339 (class 2604 OID 16435)
-- Name: Photos photo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos" ALTER COLUMN photo_id SET DEFAULT nextval('public."Photos_photo_id_seq"'::regclass);


--
-- TOC entry 3343 (class 2604 OID 16458)
-- Name: Recipes recipe_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipes" ALTER COLUMN recipe_id SET DEFAULT nextval('public."Recipes_recipe_id_seq"'::regclass);


--
-- TOC entry 3359 (class 2604 OID 24667)
-- Name: ScrapbookContent id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScrapbookContent" ALTER COLUMN id SET DEFAULT nextval('public."ScrapbookContent_id_seq"'::regclass);


--
-- TOC entry 3363 (class 2604 OID 24685)
-- Name: ScrapbookFiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScrapbookFiles" ALTER COLUMN id SET DEFAULT nextval('public."ScrapbookFiles_id_seq"'::regclass);


--
-- TOC entry 3333 (class 2604 OID 16407)
-- Name: Users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN user_id SET DEFAULT nextval('public."Users_user_id_seq"'::regclass);


--
-- TOC entry 3337 (class 2604 OID 16426)
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- TOC entry 3570 (class 0 OID 16466)
-- Dependencies: 228
-- Data for Name: BlogPosts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BlogPosts" (blog_post_id, event_id, user_id, title, content, excerpt, featured_image, tags, status, published_at, created_at, updated_at, images) FROM stdin;
2	27	1	Testing	This is a test			{}	draft	\N	2025-09-28 16:14:00.081	2025-09-28 16:14:08.932	\N
3	30	1	test	test	test	\N	{}	draft	\N	2025-09-28 19:08:18.343	2025-09-28 19:08:18.343	\N
4	39	5	2025 thoughts	test text	\N	/api/blog-images/c22deeb6-b619-47f1-86c3-7b3085fd8d18.jpeg/preview	{Summary}	published	2025-10-08 16:49:56.884	2025-10-08 16:49:56.885	2025-10-08 16:50:20.863	{/api/blog-images/198e9e75-e263-45c3-ab0d-e95509c021f0.jpeg/preview}
8	20	5	2013 Old Journal Entries	Here:	\N	/api/blog-images/9345c7b0-e7ad-45c7-a7b2-605ff8eefbc0.jpeg/preview	{Summary}	draft	\N	2025-10-13 12:30:35.873	2025-10-13 12:30:35.873	{/api/blog-images/8e9cf5b0-497b-49c9-9eaf-ef89d3542e40.jpeg/preview}
\.


--
-- TOC entry 3574 (class 0 OID 24613)
-- Dependencies: 232
-- Data for Name: JournalContentItems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."JournalContentItems" (content_item_id, journal_section_id, content_type, content_id, custom_text, heading_level, display_order, is_visible, created_at, updated_at, manual_page_break, page_break_position) FROM stdin;
3	30	menu	39	\N	1	1	t	2025-10-16 18:44:23.173	2025-10-19 21:31:26.108	f	1
4	31	menu	20	\N	1	1	t	2025-10-19 21:32:39.374	2025-10-19 21:32:46.695	f	1
5	31	photo	38	\N	1	2	t	2025-10-19 21:32:39.407	2025-10-19 21:32:46.718	f	1
6	31	photo	37	\N	1	3	t	2025-10-19 21:32:39.438	2025-10-19 21:32:46.744	f	1
7	31	page_photo	36	\N	1	4	t	2025-10-19 21:32:39.472	2025-10-19 21:32:46.772	f	1
8	31	page_photo	35	\N	1	5	t	2025-10-19 21:32:39.499	2025-10-19 21:32:46.799	f	1
9	31	page_photo	34	\N	1	6	t	2025-10-19 21:32:39.526	2025-10-19 21:32:46.824	f	1
10	31	blog	8	\N	1	7	t	2025-10-19 21:32:39.553	2025-10-19 21:32:46.852	f	1
\.


--
-- TOC entry 3572 (class 0 OID 24601)
-- Dependencies: 230
-- Data for Name: JournalSections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."JournalSections" (section_id, event_id, year, section_order, title, description, layout_config, is_published, created_at, updated_at) FROM stdin;
30	39	2025	1	Menu	\N	\N	t	2025-10-16 17:56:16.231	2025-10-19 21:31:26.038
31	20	2013	1	Menu	\N	\N	t	2025-10-19 21:31:50.944	2025-10-19 21:32:46.627
\.


--
-- TOC entry 3566 (class 0 OID 16432)
-- Dependencies: 224
-- Data for Name: Photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Photos" (photo_id, event_id, filename, original_filename, description, caption, taken_date, file_size, mime_type, file_data, created_at, updated_at, s3_url, photo_type) FROM stdin;
38	20	5415b5b4-a5b8-4d31-96a3-cee8d277d287.jpg	img20251006_09133400.jpg	\N	\N	2025-10-13 12:27:43.567	138249	image/jpeg	\N	2025-10-13 12:27:43.567	2025-10-13 12:27:43.567	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/5415b5b4-a5b8-4d31-96a3-cee8d277d287.jpg	individual
26	30	14164b14-049a-45fb-9c6a-1ed7a18eeb11.jpg	ParentsWedding.jpg	Uploaded via fallback	ParentsWedding.jpg	2025-10-05 20:19:52.687	380795	image/jpeg	\N	2025-10-05 20:19:52.687	2025-10-05 20:19:52.687	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/14164b14-049a-45fb-9c6a-1ed7a18eeb11.jpg	individual
28	9	56729bdd-b189-4a65-bea6-8f792668d7ce.jpg	img20251006_09133400.jpg	\N	\N	2025-10-06 15:03:31.022	138249	image/jpeg	\N	2025-10-06 15:03:31.022	2025-10-06 15:03:31.022	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/56729bdd-b189-4a65-bea6-8f792668d7ce.jpg	individual
29	11	dc816c99-0f44-4694-bdd1-fdf2624b5e35.jpeg	IMG_6016.jpeg	\N	2004 Photos	2025-10-07 21:29:43.093	2087255	image/jpeg	\N	2025-10-07 21:29:43.093	2025-10-07 21:29:43.093	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/dc816c99-0f44-4694-bdd1-fdf2624b5e35.jpeg	individual
30	11	9243f396-cfde-4b3f-9aea-7eb35261ed8e.jpeg	IMG_6024.jpeg	\N	2004 Photos	2025-10-07 21:29:58.586	2138148	image/jpeg	\N	2025-10-07 21:29:58.586	2025-10-07 21:29:58.586	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/9243f396-cfde-4b3f-9aea-7eb35261ed8e.jpeg	individual
31	40	475c1cf3-49f8-4d80-80ab-66eb199d7fea.jpeg	IMG_6025.jpeg	\N	2005 Photos	2025-10-07 21:30:42.707	2028684	image/jpeg	\N	2025-10-07 21:30:42.707	2025-10-07 21:30:42.707	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/475c1cf3-49f8-4d80-80ab-66eb199d7fea.jpeg	individual
32	14	79089f5d-e81b-4cb5-a226-40518110e3d9.jpeg	IMG_6022.jpeg	\N	2007 Photos	2025-10-07 21:31:12.397	1830539	image/jpeg	\N	2025-10-07 21:31:12.397	2025-10-07 21:31:12.397	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/79089f5d-e81b-4cb5-a226-40518110e3d9.jpeg	individual
33	14	ab5cf8a0-81a0-4e39-adcb-ddb5bd2bfca7.jpeg	IMG_6023.jpeg	\N	2007 Photos	2025-10-07 21:31:28.043	3098441	image/jpeg	\N	2025-10-07 21:31:28.043	2025-10-07 21:31:28.043	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/ab5cf8a0-81a0-4e39-adcb-ddb5bd2bfca7.jpeg	individual
37	20	77625ccb-b0fb-4cde-b757-97a18fa87848.jpg	Summer73Wakins.jpg	\N	\N	2025-10-13 12:27:23.135	156437	image/jpeg	\N	2025-10-13 12:27:23.135	2025-10-13 12:27:23.135	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/77625ccb-b0fb-4cde-b757-97a18fa87848.jpg	individual
36	20	11e04ece-2456-42a7-b39f-b364442f70c1.jpeg	IMG_6046.jpeg			2025-10-13 12:27:00	3218437	image/jpeg	\N	2025-10-13 12:27:07.565	2025-10-14 12:24:24.2	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/11e04ece-2456-42a7-b39f-b364442f70c1.jpeg	page
35	20	31f8aa61-2ed1-4095-aff6-c0f73e56cd10.jpeg	IMG_6045.jpeg			2025-10-13 12:26:00	2976458	image/jpeg	\N	2025-10-13 12:26:58.121	2025-10-14 12:24:33.603	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/31f8aa61-2ed1-4095-aff6-c0f73e56cd10.jpeg	page
34	20	fba3f76f-46b5-4307-ada5-ae6db8b1a3cb.jpeg	IMG_6044.jpeg			2025-10-13 12:26:00	1952635	image/jpeg	\N	2025-10-13 12:26:45.614	2025-10-14 12:24:45.618	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/photos/fba3f76f-46b5-4307-ada5-ae6db8b1a3cb.jpeg	page
\.


--
-- TOC entry 3568 (class 0 OID 16455)
-- Dependencies: 226
-- Data for Name: Recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Recipes" (recipe_id, event_id, user_id, title, description, ingredients, instructions, prep_time, cook_time, servings, difficulty_level, category, image_filename, is_featured, created_at, updated_at, image_s3_url) FROM stdin;
\.


--
-- TOC entry 3576 (class 0 OID 24664)
-- Dependencies: 234
-- Data for Name: ScrapbookContent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ScrapbookContent" (id, year, content_type, content_reference, display_order, page_break_before, page_break_after, created_at) FROM stdin;
1	2025	title	Menu	1	t	f	2025-10-19 21:31:27.307
2	2025	menu	menu_39	2	f	f	2025-10-19 21:31:27.307
3	2013	title	Menu	1	t	f	2025-10-19 21:32:48.503
4	2013	menu	menu_20	2	f	f	2025-10-19 21:32:48.503
5	2013	photo	photo_38	3	f	f	2025-10-19 21:32:48.503
6	2013	photo	photo_37	4	f	f	2025-10-19 21:32:48.503
7	2013	page-photo	page_photo_36	5	f	f	2025-10-19 21:32:48.503
8	2013	page-photo	page_photo_35	6	f	f	2025-10-19 21:32:48.503
9	2013	page-photo	page_photo_34	7	f	f	2025-10-19 21:32:48.503
10	2013	blog	blog_8	8	f	f	2025-10-19 21:32:48.503
\.


--
-- TOC entry 3578 (class 0 OID 24682)
-- Dependencies: 236
-- Data for Name: ScrapbookFiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ScrapbookFiles" (id, year, filename, local_path, s3_url, s3_key, status, file_size, generated_at, last_accessed, access_count, error_message, created_at, updated_at) FROM stdin;
1	2025	2025.html	/app/public/scrapbooks/2025.html	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/scrapbooks/2025.html	scrapbooks/2025.html	generated	9329	2025-10-19 21:31:27.44	\N	0	\N	2025-10-19 21:31:27.441	2025-10-19 21:31:27.441
2	2013	2013.html	/app/public/scrapbooks/2013.html	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/scrapbooks/2013.html	scrapbooks/2013.html	generated	10851	2025-10-19 21:32:48.628	\N	0	\N	2025-10-19 21:32:48.629	2025-10-19 21:32:48.629
\.


--
-- TOC entry 3562 (class 0 OID 16414)
-- Dependencies: 220
-- Data for Name: Sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sessions" (session_id, user_id, expires, data, created_at) FROM stdin;
\.


--
-- TOC entry 3561 (class 0 OID 16404)
-- Dependencies: 219
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (user_id, username, email, password_hash, role, first_name, last_name, created_at, updated_at) FROM stdin;
5	test	test@gmail.com	$2a$10$B7lHN1h0oAWRpweGVQfSMOphlO5JyD2AMEmygzBvYQJ87XqELaApa	user	Test	Test	2025-09-28 18:58:45.802	2025-09-28 18:58:45.802
1	admin	admin@thanksgiving.com	$2a$12$9LuE1elpyaPqQOupBQ8sk.mslM9epZVGHJt4Yr7/jUdY2vLdFFtoa	admin	Admin	User	2025-09-24 19:29:40.687	2025-09-29 13:42:27.566
6	testuser	chowderhead85@gmail.com	$2a$10$9allYlIFfjVUElTZ2qC3aOMwFdVYUR1iMe4aWSKwYv53TmJsjy3lu	user	Bruce	Wayne	2025-10-07 11:48:35.012	2025-10-07 11:48:35.012
\.


--
-- TOC entry 3559 (class 0 OID 16389)
-- Dependencies: 217
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a175fcfa-52b2-422a-8291-a7401731252b	4e089b24ca86788d67c357db0b45ce6934920e6c14d99295e84f6f978bee9374	\N	20251014150000_rename_journal_pages_to_sections	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251014150000_rename_journal_pages_to_sections\n\nDatabase error code: 42703\n\nDatabase error:\nERROR: column "journal_section_id" referenced in foreign key constraint does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \\"journal_section_id\\" referenced in foreign key constraint does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(11908), routine: Some("transformColumnNameList") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251014150000_rename_journal_pages_to_sections"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20251014150000_rename_journal_pages_to_sections"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2025-10-14 19:03:11.418517+00	2025-10-14 18:58:26.30519+00	0
db66cf59-0181-42a9-8c2f-4de517993199	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	\N	0001_init	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 0001_init\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "UserRole" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"UserRole\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1177), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="0001_init"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="0001_init"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2025-10-03 12:16:12.609267+00	2025-10-02 22:34:18.78012+00	0
76bbd11c-7bc9-442d-a6f0-058f76e0c763	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	2025-10-03 12:16:12.643331+00	0001_init		\N	2025-10-03 12:16:12.643331+00	0
3af0d548-97ff-41a8-8fb5-5e8e49429a16	87b0ae1779fe7fa09a60894ce9ccd9f7042ea3775294786dea0959324866b546	2025-10-03 12:16:17.021571+00	20251002214904_add_event_timestamps	\N	\N	2025-10-03 12:16:16.910359+00	1
894710fa-2e98-42af-be04-bcb1eeac079d	b60f9c6c75f85e646720c242a31f483e4cbe7c4c5603da23c5cc8068628e037f	2025-10-05 19:24:47.632037+00	20251005145930_add_s3_url_fields	\N	\N	2025-10-05 19:24:47.618586+00	1
eb0b52d4-5c18-44d2-af90-0860eb2564ee	4e089b24ca86788d67c357db0b45ce6934920e6c14d99295e84f6f978bee9374	\N	20251014150000_rename_journal_pages_to_sections	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251014150000_rename_journal_pages_to_sections\n\nDatabase error code: 42703\n\nDatabase error:\nERROR: column "journal_section_id" referenced in foreign key constraint does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \\"journal_section_id\\" referenced in foreign key constraint does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(11908), routine: Some("transformColumnNameList") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251014150000_rename_journal_pages_to_sections"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20251014150000_rename_journal_pages_to_sections"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2025-10-14 19:03:33.291365+00	2025-10-14 19:03:16.902676+00	0
c073e5e9-01fe-45db-a6c0-6bc7eefe9817	9bcfb14530129c20d85b3f1d73cc74cc5b0a123f59edf371404a92a19b1d3d7d	2025-10-08 16:47:30.94452+00	20251008124037_add_blog_images_field	\N	\N	2025-10-08 16:47:30.923367+00	1
f56cfacb-4f94-44d5-9168-e4792c817f4b	7a1ad5d95b4a1f13ddd548b6e2e96097068776bdcf9faaded8144ac520cfc80c	2025-10-19 21:07:43.604758+00	20250116_add_scrapbook_content	\N	\N	2025-10-19 21:07:43.580058+00	1
e8f94224-c056-4181-bff9-980ea553f6b0	90fb5a77f3d737f8fdc6d44c20f853824574f455d4879299b1cf2a529b7a82d5	2025-10-10 09:52:36.323329+00	20251008144637_add_journal_tables_and_photo_type	\N	\N	2025-10-10 09:52:36.262788+00	1
4c064382-6688-48a0-ba8e-f941e192eb1b	98f69696c6625390cebab3a4a3e027847137678e0779c79df13be7715eeb489e	2025-10-14 19:03:45.930692+00	20251014150000_rename_journal_pages_to_sections	\N	\N	2025-10-14 19:03:45.84238+00	1
dda3b540-82ee-42a3-8cd2-9b88ba4fdc40	6ad1a236e61c3fe1fb0a3e6b02e3bdea76b05c4d01ea4c83e3e6afb89ca22af1	2025-10-10 09:52:36.342126+00	20251009194554_add_menu_relation_to_journal_content_items	\N	\N	2025-10-10 09:52:36.324552+00	1
0fa29885-f8fc-4071-be7c-dc7b1876cb2f	af567d73eff0ae3f8a23f7c22ca6caf1919f084e35f3af503e15b3aa73e97cae	2025-10-10 09:52:36.350003+00	20251009194952_remove_conflicting_foreign_keys	\N	\N	2025-10-10 09:52:36.34497+00	1
d5fda9da-ab04-407b-b33d-ae5ded823ee4	bd0d4970f3bbba569bca73a87e3d709598c8482419ed3768dcc29a1210944ac2	2025-10-16 17:48:42.162889+00	20251016160000_add_manual_page_break_columns	\N	\N	2025-10-16 17:48:42.150247+00	1
856a3f1b-0ca7-4380-afc0-ad53204757ab	670ef3bc1c10b128d7f8177800a19f4101c64f824cf029eb552de0645b0f9ae5	2025-10-19 21:07:43.621286+00	20250119_add_scrapbook_files	\N	\N	2025-10-19 21:07:43.607912+00	1
\.


--
-- TOC entry 3564 (class 0 OID 16423)
-- Dependencies: 222
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (event_id, event_name, event_type, event_location, event_date, event_description, menu_title, menu_image_filename, created_at, updated_at, menu_image_s3_url) FROM stdin;
27	Thanksgiving 2020	Thanksgiving	Family Home	2020-11-26	Annual Thanksgiving celebration for 2020	2020 Thanksgiving Menu	menu_1759281154259-528014719.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:08.399	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281154259-528014719.jpeg
20	Thanksgiving 2013	Thanksgiving	Family Home	2013-11-25	Annual Thanksgiving celebration for 2013	2013 Thanksgiving Menu	menu_1759281107626-371492580.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:09.446	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281107626-371492580.jpeg
26	Thanksgiving 2019	Thanksgiving	Family Home	2019-11-25	Annual Thanksgiving celebration for 2019	2019 Thanksgiving Menu	menu_1759281150888-783693408.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:08.538	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281150888-783693408.jpeg
25	Thanksgiving 2018	Thanksgiving	Family Home	2018-11-25	Annual Thanksgiving celebration for 2018	2018 Thanksgiving Menu	menu_1759281151206-227311655.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:08.657	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281151206-227311655.jpeg
11	Thanksgiving 2004	Thanksgiving	Family Home	2004-11-25	Annual Thanksgiving celebration for 2004	2004 Thanksgiving Menu	menu_1759281105156-385951155.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:10.379	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281105156-385951155.jpeg
16	Thanksgiving 2009	Thanksgiving	Family Home	2009-11-25	Annual Thanksgiving celebration for 2009	2009 Thanksgiving Menu	menu_1759281106211-33988370.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:09.995	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281106211-33988370.jpeg
19	Thanksgiving 2012	Thanksgiving	Family Home	2012-11-25	Annual Thanksgiving celebration for 2012	2012 Thanksgiving Menu	menu_1759281107286-704232796.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:09.574	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281107286-704232796.jpeg
13	Thanksgiving 2006	Thanksgiving	Family Home	2006-11-25	Annual Thanksgiving celebration for 2006	2006 Thanksgiving Menu	menu_1759281104865-559363848.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:10.323	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281104865-559363848.jpeg
15	Thanksgiving 2008	Thanksgiving	Family Home	2008-11-25	Annual Thanksgiving celebration for 2008	2008 Thanksgiving Menu	menu_1759281105563-418161040.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:10.156	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281105563-418161040.jpeg
9	Thanksgiving 2002	Thanksgiving	Family Home	2002-11-25	Annual Thanksgiving celebration for 2002	2002 Thanksgiving Menu	menu_1759281153802-859965489.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:10.492	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281153802-859965489.jpeg
24	Thanksgiving 2017	Thanksgiving	Family Home	2017-11-25	Annual Thanksgiving celebration for 2017	2017 Thanksgiving Menu	menu_1759281151672-771694140.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:08.765	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281151672-771694140.jpeg
4	Thanksgiving 1997	Thanksgiving	Family Home	1997-11-25	Annual Thanksgiving celebration for 1997	1997 Thanksgiving Menu	menu_1759281154105-337646740.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:10.786	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281154105-337646740.jpeg
23	Thanksgiving 2016	Thanksgiving	Family Home	2016-11-25	Annual Thanksgiving celebration for 2016	2016 Thanksgiving Menu	menu_1759281151879-223110870.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:08.882	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281151879-223110870.jpeg
14	Thanksgiving 2007	Thanksgiving	Family Home	2007-11-25	Annual Thanksgiving celebration for 2007	2007 Thanksgiving Menu	menu_1759281105053-722252961.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:10.243	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281105053-722252961.jpeg
18	Thanksgiving 2011	Thanksgiving	Family Home	2011-11-25	Annual Thanksgiving celebration for 2011	2011 Thanksgiving Menu	menu_1759281106941-591359737.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:09.701	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281106941-591359737.jpeg
7	Thanksgiving 2000	Thanksgiving	Family Home	2000-11-25	Annual Thanksgiving celebration for 2000	2000 Thanksgiving Menu	menu_1759281153468-507594233.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:10.619	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281153468-507594233.jpeg
22	Thanksgiving 2015	Thanksgiving	Family Home	2015-11-25	Annual Thanksgiving celebration for 2015	2015 Thanksgiving Menu	menu_1759281152083-6162173.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:09.039	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281152083-6162173.jpeg
6	Thanksgiving 1999	Thanksgiving	Family Home	1999-11-25	Annual Thanksgiving celebration for 1999	1999 Thanksgiving Menu	menu_1759281105287-586619591.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:10.708	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281105287-586619591.jpeg
21	Thanksgiving 2014	Thanksgiving	Family Home	2014-11-25	Annual Thanksgiving celebration for 2014	2014 Thanksgiving Menu	menu_1759281152599-593950271.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:09.22	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281152599-593950271.jpeg
17	Thanksgiving 2010	Thanksgiving	Family Home	2010-11-25	Annual Thanksgiving celebration for 2010	2010 Thanksgiving Menu	menu_1759281106490-54295934.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:09.862	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281106490-54295934.jpeg
39	Maguire Thanksgiving 2025	Thanksgiving	Family Home - Middletown, NJ	2025-11-27	\N	Maguire Thanksgiving 2025	menu_1759273592539-252623425.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:07.633	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759273592539-252623425.jpeg
31	Thanksgiving 2024	Thanksgiving	Family Home	2024-11-25	Annual Thanksgiving celebration for 2024	2024 Thanksgiving Menu	menu_1759281150353-609827617.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:07.761	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281150353-609827617.jpeg
30	Thanksgiving 2023	Thanksgiving	Family Home - Middletown, NJ	2023-11-25	Annual Thanksgiving celebration for 2023	2023 Thanksgiving Menu	menu_1759281149133-818205218.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:07.907	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281149133-818205218.jpeg
29	Thanksgiving 2022	Thanksgiving	Family Home - Middletown, NJ	2022-11-25	Annual Thanksgiving celebration for 2022	2022 Thanksgiving Menu	menu_1759281155202-724390428.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:08.056	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281155202-724390428.jpeg
28	Thanksgiving 2021	Thanksgiving	Family Home	2021-11-25	Annual Thanksgiving celebration for 2021	2021 Thanksgiving Menu	menu_1759281154763-406473456.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:08.208	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281154763-406473456.jpeg
1	Thanksgiving 1994	Thanksgiving	Family Home	1994-11-25	Annual Thanksgiving celebration for 1994	1994 Thanksgiving Menu	menu_1759281222319-218677684.jpeg	2025-10-03 12:16:16.972	2025-10-05 19:32:10.899	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/menu_1759281222319-218677684.jpeg
40	Thanksgiving 2005	Thanksgiving	Family Home - Middletown, NJ	2005-11-24	\N	Thanksgiving 2005	e629335d-3334-4578-ab6e-748be0dde277.jpg	2025-10-07 09:04:27.458	2025-10-07 09:04:27.458	https://thanksgiving-images-test.s3.us-east-1.amazonaws.com/menus/e629335d-3334-4578-ab6e-748be0dde277.jpg
\.


--
-- TOC entry 3593 (class 0 OID 0)
-- Dependencies: 227
-- Name: BlogPosts_blog_post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BlogPosts_blog_post_id_seq"', 8, true);


--
-- TOC entry 3594 (class 0 OID 0)
-- Dependencies: 231
-- Name: JournalContentItems_content_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."JournalContentItems_content_item_id_seq"', 10, true);


--
-- TOC entry 3595 (class 0 OID 0)
-- Dependencies: 229
-- Name: JournalPages_journal_page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."JournalPages_journal_page_id_seq"', 31, true);


--
-- TOC entry 3596 (class 0 OID 0)
-- Dependencies: 223
-- Name: Photos_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Photos_photo_id_seq"', 38, true);


--
-- TOC entry 3597 (class 0 OID 0)
-- Dependencies: 225
-- Name: Recipes_recipe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Recipes_recipe_id_seq"', 1, false);


--
-- TOC entry 3598 (class 0 OID 0)
-- Dependencies: 233
-- Name: ScrapbookContent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ScrapbookContent_id_seq"', 10, true);


--
-- TOC entry 3599 (class 0 OID 0)
-- Dependencies: 235
-- Name: ScrapbookFiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ScrapbookFiles_id_seq"', 2, true);


--
-- TOC entry 3600 (class 0 OID 0)
-- Dependencies: 218
-- Name: Users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_user_id_seq"', 6, true);


--
-- TOC entry 3601 (class 0 OID 0)
-- Dependencies: 221
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_event_id_seq', 40, true);


--
-- TOC entry 3386 (class 2606 OID 16475)
-- Name: BlogPosts BlogPosts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts"
    ADD CONSTRAINT "BlogPosts_pkey" PRIMARY KEY (blog_post_id);


--
-- TOC entry 3391 (class 2606 OID 24623)
-- Name: JournalContentItems JournalContentItems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JournalContentItems"
    ADD CONSTRAINT "JournalContentItems_pkey" PRIMARY KEY (content_item_id);


--
-- TOC entry 3388 (class 2606 OID 24611)
-- Name: JournalSections JournalPages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JournalSections"
    ADD CONSTRAINT "JournalPages_pkey" PRIMARY KEY (section_id);


--
-- TOC entry 3382 (class 2606 OID 16441)
-- Name: Photos Photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos"
    ADD CONSTRAINT "Photos_pkey" PRIMARY KEY (photo_id);


--
-- TOC entry 3384 (class 2606 OID 16464)
-- Name: Recipes Recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipes"
    ADD CONSTRAINT "Recipes_pkey" PRIMARY KEY (recipe_id);


--
-- TOC entry 3393 (class 2606 OID 24675)
-- Name: ScrapbookContent ScrapbookContent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScrapbookContent"
    ADD CONSTRAINT "ScrapbookContent_pkey" PRIMARY KEY (id);


--
-- TOC entry 3395 (class 2606 OID 24677)
-- Name: ScrapbookContent ScrapbookContent_year_display_order_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScrapbookContent"
    ADD CONSTRAINT "ScrapbookContent_year_display_order_key" UNIQUE (year, display_order);


--
-- TOC entry 3400 (class 2606 OID 24695)
-- Name: ScrapbookFiles ScrapbookFiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScrapbookFiles"
    ADD CONSTRAINT "ScrapbookFiles_pkey" PRIMARY KEY (id);


--
-- TOC entry 3402 (class 2606 OID 24697)
-- Name: ScrapbookFiles ScrapbookFiles_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScrapbookFiles"
    ADD CONSTRAINT "ScrapbookFiles_year_key" UNIQUE (year);


--
-- TOC entry 3378 (class 2606 OID 16421)
-- Name: Sessions Sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sessions"
    ADD CONSTRAINT "Sessions_pkey" PRIMARY KEY (session_id);


--
-- TOC entry 3375 (class 2606 OID 16413)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (user_id);


--
-- TOC entry 3372 (class 2606 OID 16397)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3380 (class 2606 OID 16430)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- TOC entry 3389 (class 1259 OID 24655)
-- Name: JournalSections_event_id_year_section_order_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "JournalSections_event_id_year_section_order_key" ON public."JournalSections" USING btree (event_id, year, section_order);


--
-- TOC entry 3373 (class 1259 OID 16443)
-- Name: Users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Users_email_key" ON public."Users" USING btree (email);


--
-- TOC entry 3376 (class 1259 OID 16442)
-- Name: Users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Users_username_key" ON public."Users" USING btree (username);


--
-- TOC entry 3396 (class 1259 OID 24679)
-- Name: idx_scrapbook_content_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrapbook_content_order ON public."ScrapbookContent" USING btree (year, display_order);


--
-- TOC entry 3397 (class 1259 OID 24680)
-- Name: idx_scrapbook_content_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrapbook_content_type ON public."ScrapbookContent" USING btree (content_type);


--
-- TOC entry 3398 (class 1259 OID 24678)
-- Name: idx_scrapbook_content_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrapbook_content_year ON public."ScrapbookContent" USING btree (year);


--
-- TOC entry 3403 (class 1259 OID 24700)
-- Name: idx_scrapbook_files_generated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrapbook_files_generated_at ON public."ScrapbookFiles" USING btree (generated_at);


--
-- TOC entry 3404 (class 1259 OID 24699)
-- Name: idx_scrapbook_files_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrapbook_files_status ON public."ScrapbookFiles" USING btree (status);


--
-- TOC entry 3405 (class 1259 OID 24698)
-- Name: idx_scrapbook_files_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrapbook_files_year ON public."ScrapbookFiles" USING btree (year);


--
-- TOC entry 3410 (class 2606 OID 16486)
-- Name: BlogPosts BlogPosts_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts"
    ADD CONSTRAINT "BlogPosts_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3411 (class 2606 OID 16491)
-- Name: BlogPosts BlogPosts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts"
    ADD CONSTRAINT "BlogPosts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3413 (class 2606 OID 24650)
-- Name: JournalContentItems JournalContentItems_journal_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JournalContentItems"
    ADD CONSTRAINT "JournalContentItems_journal_section_id_fkey" FOREIGN KEY (journal_section_id) REFERENCES public."JournalSections"(section_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3412 (class 2606 OID 24656)
-- Name: JournalSections JournalSections_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JournalSections"
    ADD CONSTRAINT "JournalSections_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3407 (class 2606 OID 16449)
-- Name: Photos Photos_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos"
    ADD CONSTRAINT "Photos_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3408 (class 2606 OID 16476)
-- Name: Recipes Recipes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipes"
    ADD CONSTRAINT "Recipes_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3409 (class 2606 OID 16481)
-- Name: Recipes Recipes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipes"
    ADD CONSTRAINT "Recipes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3406 (class 2606 OID 16444)
-- Name: Sessions Sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sessions"
    ADD CONSTRAINT "Sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2025-10-19 18:10:45 EDT

--
-- PostgreSQL database dump complete
--

\unrestrict VXj1opiuUBU1tDcp7uAaCsNMeLZrCY0Kw4hni2mmkkeJeErBLosEw94oayFeITX

