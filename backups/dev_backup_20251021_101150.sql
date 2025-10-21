--
-- PostgreSQL database dump
--

\restrict X2Tx2DtSd5EClcyNsh2BeemZHvdSsJeM57oAS82j5jKbpSZBCpcegdRuDjJBiRW

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


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

--
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
    content_type public."ContentType" NOT NULL,
    content_id integer,
    custom_text text,
    heading_level integer DEFAULT 1,
    display_order integer NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    journal_section_id integer NOT NULL,
    manual_page_break boolean DEFAULT false NOT NULL,
    page_break_position integer DEFAULT 1
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
-- Name: JournalSections; Type: TABLE; Schema: public; Owner: bobmaguire
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
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."JournalSections" OWNER TO bobmaguire;

--
-- Name: JournalSections_section_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public."JournalSections_section_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."JournalSections_section_id_seq" OWNER TO bobmaguire;

--
-- Name: JournalSections_section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public."JournalSections_section_id_seq" OWNED BY public."JournalSections".section_id;


--
-- Name: PasswordResetTokens; Type: TABLE; Schema: public; Owner: bobmaguire
--

CREATE TABLE public."PasswordResetTokens" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PasswordResetTokens" OWNER TO bobmaguire;

--
-- Name: PasswordResetTokens_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public."PasswordResetTokens_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PasswordResetTokens_id_seq" OWNER TO bobmaguire;

--
-- Name: PasswordResetTokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public."PasswordResetTokens_id_seq" OWNED BY public."PasswordResetTokens".id;


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
-- Name: ScrapbookContent; Type: TABLE; Schema: public; Owner: bobmaguire
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
    CONSTRAINT "ScrapbookContent_content_type_check" CHECK ((content_type = ANY (ARRAY['title'::text, 'text-paragraph'::text, 'menu'::text, 'photo'::text, 'page-photo'::text, 'blog'::text, 'heading'::text])))
);


ALTER TABLE public."ScrapbookContent" OWNER TO bobmaguire;

--
-- Name: ScrapbookContent_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public."ScrapbookContent_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ScrapbookContent_id_seq" OWNER TO bobmaguire;

--
-- Name: ScrapbookContent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public."ScrapbookContent_id_seq" OWNED BY public."ScrapbookContent".id;


--
-- Name: ScrapbookFiles; Type: TABLE; Schema: public; Owner: bobmaguire
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


ALTER TABLE public."ScrapbookFiles" OWNER TO bobmaguire;

--
-- Name: ScrapbookFiles_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public."ScrapbookFiles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ScrapbookFiles_id_seq" OWNER TO bobmaguire;

--
-- Name: ScrapbookFiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public."ScrapbookFiles_id_seq" OWNED BY public."ScrapbookFiles".id;


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
-- Name: events; Type: TABLE; Schema: public; Owner: bobmaguire
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


ALTER TABLE public.events OWNER TO bobmaguire;

--
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON TABLE public.events IS 'Primary table for organizing family memories around events';


--
-- Name: COLUMN events.event_type; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.event_type IS 'Type of event (thanksgiving, christmas, etc.)';


--
-- Name: COLUMN events.event_date; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.event_date IS 'Date when the event occurs';


--
-- Name: COLUMN events.created_at; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.created_at IS 'Timestamp when event was created';


--
-- Name: COLUMN events.updated_at; Type: COMMENT; Schema: public; Owner: bobmaguire
--

COMMENT ON COLUMN public.events.updated_at IS 'Timestamp when event was last modified';


--
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: bobmaguire
--

CREATE SEQUENCE public.events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_event_id_seq OWNER TO bobmaguire;

--
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
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
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
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
-- Name: menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public.menus_id_seq OWNED BY public.menus.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: bobmaguire
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.schema_migrations OWNER TO bobmaguire;

--
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
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bobmaguire
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: BlogPosts blog_post_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BlogPosts" ALTER COLUMN blog_post_id SET DEFAULT nextval('public."BlogPosts_blog_post_id_seq"'::regclass);


--
-- Name: JournalContentItems content_item_id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalContentItems" ALTER COLUMN content_item_id SET DEFAULT nextval('public."JournalContentItems_content_item_id_seq"'::regclass);


--
-- Name: JournalSections section_id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalSections" ALTER COLUMN section_id SET DEFAULT nextval('public."JournalSections_section_id_seq"'::regclass);


--
-- Name: PasswordResetTokens id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."PasswordResetTokens" ALTER COLUMN id SET DEFAULT nextval('public."PasswordResetTokens_id_seq"'::regclass);


--
-- Name: Photos photo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos" ALTER COLUMN photo_id SET DEFAULT nextval('public."Photos_photo_id_seq"'::regclass);


--
-- Name: Recipes recipe_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipes" ALTER COLUMN recipe_id SET DEFAULT nextval('public."Recipes_recipe_id_seq"'::regclass);


--
-- Name: ScrapbookContent id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."ScrapbookContent" ALTER COLUMN id SET DEFAULT nextval('public."ScrapbookContent_id_seq"'::regclass);


--
-- Name: ScrapbookFiles id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."ScrapbookFiles" ALTER COLUMN id SET DEFAULT nextval('public."ScrapbookFiles_id_seq"'::regclass);


--
-- Name: Users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN user_id SET DEFAULT nextval('public."Users_user_id_seq"'::regclass);


--
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: menus id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menus ALTER COLUMN id SET DEFAULT nextval('public.menus_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Data for Name: BlogPosts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BlogPosts" (blog_post_id, event_id, user_id, title, content, excerpt, featured_image, tags, status, published_at, created_at, updated_at, images) FROM stdin;
9	15	1	2013 Thoughts:	Here are some of my thoughts from 2013:	\N	/api/blog-images/e514e6e3-f3a4-4c7c-994b-d2c93dbbae17.jpeg/preview	{}	draft	\N	2025-10-20 15:22:27.044	2025-10-20 15:22:27.044	{/api/blog-images/63a60653-fcdf-40f3-9600-3c1a10a64c41.jpeg/preview}
10	16	1	2014 Thoughts	Handwritten journal entry:	\N	/api/blog-images/e1fbb8b9-b93a-4eb0-a510-6202a16da43f.jpg/preview	{}	draft	\N	2025-10-20 22:35:38.712	2025-10-20 22:35:38.712	{}
11	26	1	2014	2014	\N	/api/blog-images/13e3b569-3641-4b8c-829f-98a7a7d717eb.jpg/preview	{}	draft	\N	2025-10-20 23:07:48.098	2025-10-20 23:07:48.098	{/api/blog-images/6437a2e9-5b0c-4092-a722-35fff9b84fbc.jpg/preview,/api/blog-images/e0c9e1c0-6eff-4312-8e88-ea840902b57d.jpg/preview}
12	26	1	2014 +	2014 +	\N	/api/blog-images/95f8dccd-ea9f-4f4c-b38d-02cefd0485d4.jpg/preview	{}	draft	\N	2025-10-20 23:08:15.748	2025-10-20 23:08:15.748	{/api/blog-images/1582f7b0-5295-4b54-88b9-561ceb2593cb.jpg/preview}
13	15	1	This is the title	This is text to test the formating.	\N	/api/blog-images/37f885de-4491-468f-8927-6dac1fbd6f04.jpg/preview	{}	draft	\N	2025-10-21 10:48:05.963	2025-10-21 10:48:05.963	{/api/blog-images/c1f1d5af-fdc0-4976-a280-8473fc2b55a9.jpg/preview,/api/blog-images/e52652b5-0c92-4c4d-aa51-a3a85b7a515a.jpg/preview,/api/blog-images/1294c385-a5dc-44d4-ba24-d72d2334ae64.jpg/preview,/api/blog-images/b3d3c3e2-ff7e-449c-b443-84e9f35da85d.jpg/preview,/api/blog-images/26e30d66-4922-4b34-bb4f-9a2082baeed9.jpg/preview,/api/blog-images/607d7f0a-aeae-400f-81eb-3c395979b0c0.jpg/preview}
\.


--
-- Data for Name: JournalContentItems; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public."JournalContentItems" (content_item_id, content_type, content_id, custom_text, heading_level, display_order, is_visible, created_at, updated_at, journal_section_id, manual_page_break, page_break_position) FROM stdin;
169	blog	13	\N	1	15	t	2025-10-21 10:50:25.641	2025-10-21 14:06:29.308	45	f	1
170	heading	\N	Testing the Heading	2	16	t	2025-10-21 10:53:00.801	2025-10-21 14:06:29.312	45	f	1
149	menu	40	\N	1	1	t	2025-10-20 15:40:57.243	2025-10-21 14:08:23.335	47	f	1
175	heading	\N	Test Heading	2	2	t	2025-10-21 13:52:27.911	2025-10-21 14:08:23.343	47	f	1
176	text	\N	There are strange things done in the midnight sun\n      By the men who moil for gold;\n  The Arctic trails have their secret tales\n      That would make your blood run cold;\n  The Northern Lights have seen queer sights,\n      But the queerest they ever did see\n  Was that night on the marge of Lake Lebarge\n      I cremated Sam McGee.\n\nNow Sam McGee was from Tennessee, where the cotton blooms and blows.\nWhy he left his home in the South to roam 'round the Pole, God only knows.\nHe was always cold, but the land of gold seemed to hold him like a spell;\nThough he'd often say in his homely way that 'he'd sooner live in hell'.	1	3	t	2025-10-21 13:53:46.323	2025-10-21 14:08:23.349	47	f	1
150	menu	16	\N	1	1	t	2025-10-20 22:36:34.535	2025-10-20 22:36:34.535	48	f	1
151	menu	6	\N	1	1	t	2025-10-20 22:40:07.025	2025-10-21 11:58:43.461	49	f	1
152	photo	114	\N	1	2	t	2025-10-20 22:40:07.035	2025-10-21 11:58:43.468	49	f	1
148	menu	26	\N	1	1	t	2025-10-20 15:29:00.905	2025-10-21 11:59:03.972	46	f	1
153	blog	11	\N	1	2	t	2025-10-20 23:10:37.42	2025-10-21 11:59:03.979	46	f	1
154	blog	12	\N	1	3	t	2025-10-20 23:10:37.431	2025-10-21 11:59:03.988	46	f	1
155	menu	15	\N	1	1	t	2025-10-21 00:55:57.001	2025-10-21 14:06:29.236	45	f	1
156	page_photo	112	\N	1	2	t	2025-10-21 00:55:57.008	2025-10-21 14:06:29.242	45	f	1
157	page_photo	111	\N	1	3	t	2025-10-21 00:55:57.012	2025-10-21 14:06:29.246	45	f	1
158	page_photo	110	\N	1	4	t	2025-10-21 00:55:57.015	2025-10-21 14:06:29.252	45	f	1
159	blog	9	\N	1	5	t	2025-10-21 00:55:57.019	2025-10-21 14:06:29.258	45	f	1
160	heading	\N	Photos	2	6	t	2025-10-21 10:50:25.614	2025-10-21 14:06:29.266	45	f	1
161	text	\N	These are random photos that I added to test how 7 photos actually end up.  I am adding this text block to see how that formats.	\N	7	t	2025-10-21 10:50:25.618	2025-10-21 14:06:29.271	45	f	1
162	photo	121	\N	1	8	t	2025-10-21 10:50:25.621	2025-10-21 14:06:29.276	45	f	1
163	photo	120	\N	1	9	t	2025-10-21 10:50:25.624	2025-10-21 14:06:29.28	45	f	1
164	photo	119	\N	1	10	t	2025-10-21 10:50:25.628	2025-10-21 14:06:29.284	45	f	1
165	photo	118	\N	1	11	t	2025-10-21 10:50:25.631	2025-10-21 14:06:29.29	45	f	1
166	photo	117	\N	1	12	t	2025-10-21 10:50:25.634	2025-10-21 14:06:29.295	45	f	1
167	photo	116	\N	1	13	t	2025-10-21 10:50:25.637	2025-10-21 14:06:29.299	45	f	1
168	photo	115	\N	1	14	t	2025-10-21 10:50:25.639	2025-10-21 14:06:29.303	45	f	1
\.


--
-- Data for Name: JournalSections; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public."JournalSections" (section_id, event_id, year, section_order, title, description, layout_config, is_published, created_at, updated_at) FROM stdin;
49	6	2004	1	2004 Menu	I think this might have been Grandma Maguire's last year.	\N	t	2025-10-20 22:39:24.694	2025-10-21 11:58:43.445
46	26	2024	1	2024 Maguire Thanksgiving	This year was dedicated to Grandma Goose and our memories of her.	\N	t	2025-10-20 15:27:38.661	2025-10-21 11:59:03.952
45	15	2013	1	2013 Maguire Thanksgiving	This year we honored Grandma Goose's passing.	\N	t	2025-10-20 15:22:43.939	2025-10-21 14:06:29.202
47	40	2025	1	2025 Maguire Thanksgiving	I'm really looking forward to this year.  First year with the website.	\N	t	2025-10-20 15:40:50.925	2025-10-21 14:08:23.309
48	16	2014	1	2014 Maguire Thanksgiving	\N	\N	f	2025-10-20 22:36:01.19	2025-10-20 22:36:34.516
\.


--
-- Data for Name: PasswordResetTokens; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public."PasswordResetTokens" (id, user_id, token, expires_at, used, created_at) FROM stdin;
1	1	2cdd822dc754b99540b975532891e060c6f9c9733f95e63524b0fb202de42283	2025-10-20 17:16:10.833	f	2025-10-20 16:16:10.835
2	4	4f9e4b538f45f7a3b80f03499ea21d12dffaca1e494e1396981f491245448c34	2025-10-20 17:19:57.678	t	2025-10-20 16:19:57.679
3	4	bcb324d78ed2bda95a1eb0e14fd786cedf83ce135ebfcec3bd321cb7361fa7db	2025-10-20 17:28:16.553	t	2025-10-20 16:28:16.554
4	4	4ae424d775056ba5d8872fd5cf8e702f2eaa0ff893d8b9d61649b6a62b5f3f89	2025-10-20 17:29:03.363	t	2025-10-20 16:29:03.364
5	4	2ccbefb8a6f2ec759599782be2a2944a7e2b6c9374a9254ffa0b47673653f035	2025-10-20 17:47:31.567	t	2025-10-20 16:47:31.568
6	4	6f6d86f812eb04940f2d92eda39c1c7d57d7ce12719d512298999132eafeda32	2025-10-20 18:00:37.139	t	2025-10-20 17:00:37.14
7	4	732c8791225a86fd0d7dd0b23f758185956811ebdb6445531d553ab30b6329b3	2025-10-20 21:16:01.174	t	2025-10-20 20:16:01.175
8	4	66a8af234147ee331b8f76c84860335b44b236a36422eaee5e48083868bea8b5	2025-10-20 21:17:59.821	t	2025-10-20 20:17:59.822
9	4	fb8614f182c230f2e4810c7bf022ef0753318c95cbcd66f10e9172bc421ce4aa	2025-10-20 21:19:49.35	t	2025-10-20 20:19:49.351
10	4	38156da8ff438a3b176cc149ce7ccb43df93f79e3c5c501b9ece47c48209cc53	2025-10-20 21:20:26.252	t	2025-10-20 20:20:26.253
11	4	a23a3ac85c85e45c809ba30c939855e39584b9a36d1526eb0dea98020f2b0638	2025-10-20 21:21:56.569	t	2025-10-20 20:21:56.57
12	4	875c5d15b17b37393e8bb4710ab2a5a2e1fafd1abdbc2386a4fca475753c7b0f	2025-10-20 21:24:56.182	t	2025-10-20 20:24:56.183
13	4	f1094093f119b525a7e900bf9647e5d5551f8fd1b0a20f929781021196f80372	2025-10-20 21:26:12.877	t	2025-10-20 20:26:12.878
14	4	cc8169303082b010c9074caa5e329a8647b991eb02d7d178cf6e8533c040c08d	2025-10-20 21:27:57.469	t	2025-10-20 20:27:57.47
15	4	864bcaa28c5d36122ba446996aa10f7507b2ba45fafdc326074cf84d7b1558ea	2025-10-20 21:33:49.003	t	2025-10-20 20:33:49.005
16	4	252ea030184ff826e9cb69791f6be44510775484b9a769db1bbc469695c1e294	2025-10-20 23:02:34.072	t	2025-10-20 22:02:34.073
17	4	c617785f8451bb93dc6b0f03eac38eb1b362e07574d5a7d22b3006ca05c833c6	2025-10-20 23:03:25.851	t	2025-10-20 22:03:25.853
18	4	43ef9e47389a7f68327448d3f9a8363485980bb0d3e963b7357f81b175451a33	2025-10-20 23:04:48.529	t	2025-10-20 22:04:48.531
19	4	bf599166803f009edf31050bb85ede089dadae9fa987cc42ca3ba1d6e022490f	2025-10-20 23:06:59.054	t	2025-10-20 22:06:59.055
\.


--
-- Data for Name: Photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Photos" (photo_id, event_id, filename, original_filename, description, caption, taken_date, file_size, mime_type, file_data, created_at, updated_at, s3_url, photo_type) FROM stdin;
112	15	3cd3a368-9feb-4f28-80ef-9b4c05f2f3a9.jpeg	IMG_6046.jpeg			2025-10-20 19:20:00	3218437	image/jpeg	\N	2025-10-20 15:20:42.496	2025-10-20 15:23:26.202	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/3cd3a368-9feb-4f28-80ef-9b4c05f2f3a9.jpeg	page
111	15	42760094-f214-441f-a5b1-b1c548d3d43d.jpeg	IMG_6045.jpeg			2025-10-20 19:20:00	2976458	image/jpeg	\N	2025-10-20 15:20:25.806	2025-10-20 15:23:35.614	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/42760094-f214-441f-a5b1-b1c548d3d43d.jpeg	page
110	15	9b91f7ab-027c-4757-bfaa-38de3ac4636f.jpeg	IMG_6044.jpeg			2025-10-20 19:20:00	1952635	image/jpeg	\N	2025-10-20 15:20:11.766	2025-10-20 15:23:45.24	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/9b91f7ab-027c-4757-bfaa-38de3ac4636f.jpeg	page
114	6	04ebd48c-7c25-48fc-8760-496cdc530e3a.jpg	img20251006_09133400.jpg	Look closely.  This was her last year.  See anything strange?	Grandma Maguire	2025-10-20 22:39:06.096	138249	image/jpeg	\N	2025-10-20 22:39:06.096	2025-10-20 22:39:06.096	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/04ebd48c-7c25-48fc-8760-496cdc530e3a.jpg	individual
115	15	d09f1e2e-65f6-49d8-aad0-2c76526827fd.jpg	Summer73Wakins.jpg	\N	\N	2025-10-21 10:46:03.668	156437	image/jpeg	\N	2025-10-21 10:46:03.668	2025-10-21 10:46:03.668	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/d09f1e2e-65f6-49d8-aad0-2c76526827fd.jpg	individual
116	15	534d722e-b941-4b2b-9872-dff2ecdb10d3.jpg	JoewithMaeveJosie.jpg	\N	\N	2025-10-21 10:46:15.322	282634	image/jpeg	\N	2025-10-21 10:46:15.322	2025-10-21 10:46:15.322	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/534d722e-b941-4b2b-9872-dff2ecdb10d3.jpg	individual
117	15	1ede8e87-bef8-4c87-b8a9-000f32c05d93.jpg	JoeOld.jpg	\N	\N	2025-10-21 10:46:26.376	174376	image/jpeg	\N	2025-10-21 10:46:26.376	2025-10-21 10:46:26.376	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/1ede8e87-bef8-4c87-b8a9-000f32c05d93.jpg	individual
118	15	95a90e70-83cc-4527-a6d9-5db365dc3079.jpg	ParentsWedding.jpg	\N	\N	2025-10-21 10:46:35.608	380795	image/jpeg	\N	2025-10-21 10:46:35.608	2025-10-21 10:46:35.608	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/95a90e70-83cc-4527-a6d9-5db365dc3079.jpg	individual
119	15	2f1198b2-ea24-4fed-8cce-85a13dd65fd5.jpg	Summer73Wakins.jpg	\N	\N	2025-10-21 10:46:47.95	156437	image/jpeg	\N	2025-10-21 10:46:47.95	2025-10-21 10:46:47.95	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/2f1198b2-ea24-4fed-8cce-85a13dd65fd5.jpg	individual
120	15	8a1f3814-27cb-4b4c-838a-b06dd45df7de.jpg	JoeOld.jpg	\N	\N	2025-10-21 10:47:05.465	174376	image/jpeg	\N	2025-10-21 10:47:05.465	2025-10-21 10:47:05.465	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/8a1f3814-27cb-4b4c-838a-b06dd45df7de.jpg	individual
121	15	9f549896-0686-4e30-89ef-8aa1f48bd697.jpg	Maeve Announcement.jpg	\N	\N	2025-10-21 10:47:20.664	4168694	image/jpeg	\N	2025-10-21 10:47:20.664	2025-10-21 10:47:20.664	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/photos/9f549896-0686-4e30-89ef-8aa1f48bd697.jpg	individual
\.


--
-- Data for Name: Recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Recipes" (recipe_id, event_id, user_id, title, description, ingredients, instructions, prep_time, cook_time, servings, difficulty_level, category, image_filename, is_featured, created_at, updated_at, image_s3_url) FROM stdin;
\.


--
-- Data for Name: ScrapbookContent; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public."ScrapbookContent" (id, year, content_type, content_reference, display_order, page_break_before, page_break_after, created_at) FROM stdin;
466	2004	title	{"title":"2004 Menu","description":"I think this might have been Grandma Maguire's last year."}	1	t	f	2025-10-21 11:58:45.877
467	2004	menu	menu_6	2	f	f	2025-10-21 11:58:45.877
468	2004	photo	photo_114	3	f	f	2025-10-21 11:58:45.877
469	2024	title	{"title":"2024 Maguire Thanksgiving","description":"This year was dedicated to Grandma Goose and our memories of her."}	1	t	f	2025-10-21 11:58:58.817
470	2024	menu	menu_26	2	f	f	2025-10-21 11:58:58.817
471	2024	blog	blog_11	3	f	f	2025-10-21 11:58:58.817
472	2024	blog	blog_12	4	f	f	2025-10-21 11:58:58.817
619	2013	title	{"title":"2013 Maguire Thanksgiving","description":"This year we honored Grandma Goose's passing."}	1	t	f	2025-10-21 14:07:49.277
620	2013	menu	menu_15	2	f	f	2025-10-21 14:07:49.277
621	2013	page-photo	page_photo_112	3	f	f	2025-10-21 14:07:49.277
622	2013	page-photo	page_photo_111	4	f	f	2025-10-21 14:07:49.277
623	2013	page-photo	page_photo_110	5	f	f	2025-10-21 14:07:49.277
624	2013	blog	blog_9	6	f	f	2025-10-21 14:07:49.277
625	2013	heading	Photos	7	f	f	2025-10-21 14:07:49.277
626	2013	text-paragraph	These are random photos that I added to test how 7 photos actually end up.  I am adding this text block to see how that formats.	8	f	f	2025-10-21 14:07:49.277
627	2013	photo	photo_121	9	f	f	2025-10-21 14:07:49.277
628	2013	photo	photo_120	10	f	f	2025-10-21 14:07:49.277
629	2013	photo	photo_119	11	f	f	2025-10-21 14:07:49.277
630	2013	photo	photo_118	12	f	f	2025-10-21 14:07:49.277
631	2013	photo	photo_117	13	f	f	2025-10-21 14:07:49.277
632	2013	photo	photo_116	14	f	f	2025-10-21 14:07:49.277
633	2013	photo	photo_115	15	f	f	2025-10-21 14:07:49.277
634	2013	blog	blog_13	16	f	f	2025-10-21 14:07:49.277
635	2013	heading	Testing the Heading	17	f	f	2025-10-21 14:07:49.277
636	2025	title	{"title":"2025 Maguire Thanksgiving","description":"I'm really looking forward to this year.  First year with the website."}	1	t	f	2025-10-21 14:08:24.488
637	2025	menu	menu_40	2	f	f	2025-10-21 14:08:24.488
638	2025	heading	Test Heading	3	f	f	2025-10-21 14:08:24.488
639	2025	text-paragraph	There are strange things done in the midnight sun\n      By the men who moil for gold;\n  The Arctic trails have their secret tales\n      That would make your blood run cold;\n  The Northern Lights have seen queer sights,\n      But the queerest they ever did see\n  Was that night on the marge of Lake Lebarge\n      I cremated Sam McGee.\n\nNow Sam McGee was from Tennessee, where the cotton blooms and blows.\nWhy he left his home in the South to roam 'round the Pole, God only knows.\nHe was always cold, but the land of gold seemed to hold him like a spell;\nThough he'd often say in his homely way that 'he'd sooner live in hell'.	4	f	f	2025-10-21 14:08:24.488
\.


--
-- Data for Name: ScrapbookFiles; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public."ScrapbookFiles" (id, year, filename, local_path, s3_url, s3_key, status, file_size, generated_at, last_accessed, access_count, error_message, created_at, updated_at) FROM stdin;
14	2004	2004.html	/Users/bobmaguire/repos/thanksgiving/public/scrapbooks/2004.html	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/scrapbooks/2004.html	scrapbooks/2004.html	generated	15697	2025-10-21 11:58:46.076	\N	0	\N	2025-10-20 22:40:12.845	2025-10-21 11:58:46.076
4	2024	2024.html	/Users/bobmaguire/repos/thanksgiving/public/scrapbooks/2024.html	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/scrapbooks/2024.html	scrapbooks/2024.html	generated	17012	2025-10-21 11:58:58.983	\N	0	\N	2025-10-19 20:37:31.37	2025-10-21 11:58:58.983
2	2013	2013.html	/Users/bobmaguire/repos/thanksgiving/public/scrapbooks/2013.html	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/scrapbooks/2013.html	scrapbooks/2013.html	generated	21485	2025-10-21 14:07:49.426	2025-10-19 14:39:50.935	5	\N	2025-10-19 14:31:10.869	2025-10-21 14:07:49.426
3	2025	2025.html	/Users/bobmaguire/repos/thanksgiving/public/scrapbooks/2025.html	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/scrapbooks/2025.html	scrapbooks/2025.html	generated	17486	2025-10-21 14:08:24.63	\N	0	\N	2025-10-19 20:32:36.929	2025-10-21 14:08:24.63
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
4	bibo85	bibo85@yahoo.com	$2a$10$e7UFJcwnbCEl4/9NKVxZLOsRtKTHNQRrqXHTmzG7kV18vXTFAd0mC	user	Bruce	Wayne	2025-10-20 16:19:26.488	2025-10-20 22:07:52.396
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
cc5d404d-fb85-42cc-addf-2d0cf62dfb77	4e089b24ca86788d67c357db0b45ce6934920e6c14d99295e84f6f978bee9374	\N	20251014150000_rename_journal_pages_to_sections	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251014150000_rename_journal_pages_to_sections\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "JournalPages" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"JournalPages\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(639), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251014150000_rename_journal_pages_to_sections"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20251014150000_rename_journal_pages_to_sections"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2025-10-14 14:55:34.265874-04	2025-10-14 14:55:21.76195-04	0
bc135867-d137-4e6f-8bac-c2e31627c073	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	2025-10-08 14:47:06.241053-04	0001_init	\N	\N	2025-10-08 14:47:06.233266-04	1
3d824d91-2c17-4adb-a9ce-5d496c2b888d	4e089b24ca86788d67c357db0b45ce6934920e6c14d99295e84f6f978bee9374	2025-10-14 14:55:34.266614-04	20251014150000_rename_journal_pages_to_sections		\N	2025-10-14 14:55:34.266614-04	0
34468ff2-a601-4898-9f07-402c46402cf8	87b0ae1779fe7fa09a60894ce9ccd9f7042ea3775294786dea0959324866b546	2025-10-08 14:47:06.24227-04	20251002214904_add_event_timestamps	\N	\N	2025-10-08 14:47:06.241303-04	1
68185c4e-8406-47b1-95d1-80fe6b55429b	bd0d4970f3bbba569bca73a87e3d709598c8482419ed3768dcc29a1210944ac2	2025-10-16 12:24:35.059362-04	20251016160000_add_manual_page_break_columns		\N	2025-10-16 12:24:35.059362-04	0
bac92d09-ebf5-49a4-976f-d873e54ba33e	b60f9c6c75f85e646720c242a31f483e4cbe7c4c5603da23c5cc8068628e037f	2025-10-08 14:47:06.243211-04	20251005145930_add_s3_url_fields	\N	\N	2025-10-08 14:47:06.242606-04	1
3d198980-ee3e-459e-85e3-8952b9aa29a4	9bcfb14530129c20d85b3f1d73cc74cc5b0a123f59edf371404a92a19b1d3d7d	2025-10-08 14:47:06.244222-04	20251008124037_add_blog_images_field	\N	\N	2025-10-08 14:47:06.243562-04	1
dc472201-b3ad-45bc-a56a-510608b9f783	90fb5a77f3d737f8fdc6d44c20f853824574f455d4879299b1cf2a529b7a82d5	2025-10-08 14:47:06.247726-04	20251008144637_add_journal_tables_and_photo_type	\N	\N	2025-10-08 14:47:06.24441-04	1
9da40ab3-ec75-4701-be89-c4334a948d42	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	\N	0001_init	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 0001_init\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "UserRole" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"UserRole\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1177), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="0001_init"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="0001_init"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2025-10-03 09:02:08.362115-04	2025-10-03 09:02:02.521929-04	0
60776147-0820-4e62-a097-b1e2ac2639cd	5e20919c06c8883283e956745e812b327e5dd0d41169ac09d9a73fce6fb79df3	2025-10-03 09:02:08.394511-04	0001_init		\N	2025-10-03 09:02:08.394511-04	0
4e2dfff4-9298-4c4e-9218-c2759da6c5c3	87b0ae1779fe7fa09a60894ce9ccd9f7042ea3775294786dea0959324866b546	2025-10-03 09:02:12.424267-04	20251002214904_add_event_timestamps	\N	\N	2025-10-03 09:02:12.346602-04	1
ba2e5804-685c-4820-96ef-250519df22a9	b60f9c6c75f85e646720c242a31f483e4cbe7c4c5603da23c5cc8068628e037f	2025-10-05 15:43:25.466851-04	20251005145930_add_s3_url_fields	\N	\N	2025-10-05 15:43:25.459998-04	1
ade19142-31de-43f6-bfc1-d02ec2d75fa3	9bcfb14530129c20d85b3f1d73cc74cc5b0a123f59edf371404a92a19b1d3d7d	2025-10-08 12:43:49.766325-04	20251008124037_add_blog_images_field	\N	\N	2025-10-08 12:43:49.755797-04	1
103a9083-d349-43d8-a4ef-bdb3228d2da7	7a1ad5d95b4a1f13ddd548b6e2e96097068776bdcf9faaded8144ac520cfc80c	2025-10-18 20:45:03.614492-04	20250116_add_scrapbook_content	\N	\N	2025-10-18 20:45:03.610308-04	1
dfa02ed0-5a8e-45cd-96cd-ec74c8ad149e	6ad1a236e61c3fe1fb0a3e6b02e3bdea76b05c4d01ea4c83e3e6afb89ca22af1	2025-10-09 15:45:54.360405-04	20251009194554_add_menu_relation_to_journal_content_items	\N	\N	2025-10-09 15:45:54.357679-04	1
9568328a-252d-4f33-af51-645c35488764	af567d73eff0ae3f8a23f7c22ca6caf1919f084e35f3af503e15b3aa73e97cae	2025-10-09 15:49:52.802124-04	20251009194952_remove_conflicting_foreign_keys	\N	\N	2025-10-09 15:49:52.800236-04	1
2e30bd73-5d72-40eb-974a-4afa05ee9b15	670ef3bc1c10b128d7f8177800a19f4101c64f824cf029eb552de0645b0f9ae5	2025-10-19 10:23:34.336979-04	20250119_add_scrapbook_files	\N	\N	2025-10-19 10:23:34.332398-04	1
a4b8b114-5b72-411e-a7a5-9b7e6c5253b6	8b60169f09c9a2bb1a617eb1d0cba3e24a894575cfcf29ac8084eac2307c69cc	2025-10-20 12:07:55.571604-04	20251020160000_add_password_reset_tokens	\N	\N	2025-10-20 12:07:55.566097-04	1
8148f765-0cb9-49b6-93fe-d683740731bb	a61fa2830e29da063dd04b351fb22d731c1a6d29f82fed98668bdef62d61fd04	2025-10-21 07:21:32.073237-04	20251021071859_add_heading_content_type	\N	\N	2025-10-21 07:21:32.070029-04	1
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public.events (event_id, event_name, event_type, event_location, event_date, event_description, menu_title, menu_image_filename, created_at, updated_at, menu_image_s3_url) FROM stdin;
2	Thanksgiving 1997	Thanksgiving	Family Home	1997-11-27	A special Thanksgiving gathering in 1997	Thanksgiving Menu 1997	1997_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.699	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/1997_Menu.jpeg
3	Thanksgiving 1999	Thanksgiving	Family Home	1999-11-25	A special Thanksgiving gathering in 1999	Thanksgiving Menu 1999	1999_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.701	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/1999_Menu.jpeg
4	Thanksgiving 2000	Thanksgiving	Family Home	2000-11-23	A special Thanksgiving gathering in 2000	Thanksgiving Menu 2000	2000_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.703	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2000_Menu.jpeg
5	Thanksgiving 2002	Thanksgiving	Family Home	2002-11-28	A special Thanksgiving gathering in 2002	Thanksgiving Menu 2002	2002_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.705	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2002_Menu.jpeg
6	Thanksgiving 2004	Thanksgiving	Family Home	2004-11-25	A special Thanksgiving gathering in 2004	Thanksgiving Menu 2004	2004_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.706	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2004_Menu.jpeg
8	Thanksgiving 2006	Thanksgiving	Family Home	2006-11-23	A special Thanksgiving gathering in 2006	Thanksgiving Menu 2006	2006_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.708	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2006_Menu.jpeg
9	Thanksgiving 2007	Thanksgiving	Family Home	2007-11-22	A special Thanksgiving gathering in 2007	Thanksgiving Menu 2007	2007_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.71	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2007_Menu.jpeg
10	Thanksgiving 2008	Thanksgiving	Family Home	2008-11-27	A special Thanksgiving gathering in 2008	Thanksgiving Menu 2008	2008_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.715	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2008_Menu.jpeg
13	Thanksgiving 2011	Thanksgiving	Family Home	2011-11-24	A special Thanksgiving gathering in 2011	Thanksgiving Menu 2011	2011_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.72	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2011_Menu.jpeg
14	Thanksgiving 2012	Thanksgiving	Family Home	2012-11-22	A special Thanksgiving gathering in 2012	Thanksgiving Menu 2012	2012_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.721	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2012_Menu.jpeg
15	Thanksgiving 2013	Thanksgiving	Family Home	2013-11-28	A special Thanksgiving gathering in 2013	Thanksgiving Menu 2013	2013_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.723	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2013_Menu.jpeg
16	Thanksgiving 2014	Thanksgiving	Family Home	2014-11-27	A special Thanksgiving gathering in 2014	Thanksgiving Menu 2014	2014_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.724	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2014_Menu.jpeg
17	Thanksgiving 2015	Thanksgiving	Family Home	2015-11-26	A special Thanksgiving gathering in 2015	Thanksgiving Menu 2015	2015_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.726	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2015_Menu.jpeg
18	Thanksgiving 2016	Thanksgiving	Family Home	2016-11-24	A special Thanksgiving gathering in 2016	Thanksgiving Menu 2016	2016_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.728	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2016_Menu.jpeg
19	Thanksgiving 2017	Thanksgiving	Family Home	2017-11-23	A special Thanksgiving gathering in 2017	Thanksgiving Menu 2017	2017_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.729	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2017_Menu.jpeg
20	Thanksgiving 2018	Thanksgiving	Family Home	2018-11-22	A special Thanksgiving gathering in 2018	Thanksgiving Menu 2018	2018_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.731	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2018_Menu.jpeg
23	Thanksgiving 2021	Thanksgiving	Family Home	2021-11-25	A special Thanksgiving gathering in 2021	Thanksgiving Menu 2021	2021_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.736	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2021_Menu.jpeg
24	Thanksgiving 2022	Thanksgiving	Family Home	2022-11-24	A special Thanksgiving gathering in 2022	Thanksgiving Menu 2022	2022_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.737	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2022_Menu.jpeg
25	Thanksgiving 2023	Thanksgiving	Family Home	2023-11-23	A special Thanksgiving gathering in 2023	Thanksgiving Menu 2023	2023_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.739	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2023_Menu.jpeg
26	Thanksgiving 2024	Thanksgiving	Family Home	2024-11-28	A special Thanksgiving gathering in 2024	Thanksgiving Menu 2024	2024_Menu.jpeg	2025-10-03 13:02:12.378	2025-10-05 21:24:06.741	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/2024_Menu.jpeg
40	Maguire Thanksgiving 2025	Thanksgiving	Family Home - Middletown, NJ	2025-11-27	\N	Maguire Thanksgiving 2025	83e5b123-d05c-413b-91d2-828c3b22d029.jpeg	2025-10-20 15:40:03.104	2025-10-20 15:40:03.104	https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/83e5b123-d05c-413b-91d2-828c3b22d029.jpeg
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public.menu_items (id, menu_id, name, category, description, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public.menus (id, event_id, year, title, image_path, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: bobmaguire
--

COPY public.schema_migrations (id, filename, executed_at) FROM stdin;
\.


--
-- Name: BlogPosts_blog_post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BlogPosts_blog_post_id_seq"', 13, true);


--
-- Name: JournalContentItems_content_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."JournalContentItems_content_item_id_seq"', 176, true);


--
-- Name: JournalSections_section_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."JournalSections_section_id_seq"', 55, true);


--
-- Name: PasswordResetTokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."PasswordResetTokens_id_seq"', 19, true);


--
-- Name: Photos_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Photos_photo_id_seq"', 123, true);


--
-- Name: Recipes_recipe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Recipes_recipe_id_seq"', 1, false);


--
-- Name: ScrapbookContent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."ScrapbookContent_id_seq"', 639, true);


--
-- Name: ScrapbookFiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public."ScrapbookFiles_id_seq"', 75, true);


--
-- Name: Users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_user_id_seq"', 4, true);


--
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public.events_event_id_seq', 42, true);


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 1, false);


--
-- Name: menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public.menus_id_seq', 26, true);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bobmaguire
--

SELECT pg_catalog.setval('public.schema_migrations_id_seq', 2, true);


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
-- Name: JournalSections JournalSections_event_id_year_section_order_key; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalSections"
    ADD CONSTRAINT "JournalSections_event_id_year_section_order_key" UNIQUE (event_id, year, section_order);


--
-- Name: JournalSections JournalSections_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalSections"
    ADD CONSTRAINT "JournalSections_pkey" PRIMARY KEY (section_id);


--
-- Name: PasswordResetTokens PasswordResetTokens_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."PasswordResetTokens"
    ADD CONSTRAINT "PasswordResetTokens_pkey" PRIMARY KEY (id);


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
-- Name: ScrapbookContent ScrapbookContent_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."ScrapbookContent"
    ADD CONSTRAINT "ScrapbookContent_pkey" PRIMARY KEY (id);


--
-- Name: ScrapbookContent ScrapbookContent_year_display_order_key; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."ScrapbookContent"
    ADD CONSTRAINT "ScrapbookContent_year_display_order_key" UNIQUE (year, display_order);


--
-- Name: ScrapbookFiles ScrapbookFiles_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."ScrapbookFiles"
    ADD CONSTRAINT "ScrapbookFiles_pkey" PRIMARY KEY (id);


--
-- Name: ScrapbookFiles ScrapbookFiles_year_key; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."ScrapbookFiles"
    ADD CONSTRAINT "ScrapbookFiles_year_key" UNIQUE (year);


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
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_filename_key; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_filename_key UNIQUE (filename);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: PasswordResetTokens_token_key; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE UNIQUE INDEX "PasswordResetTokens_token_key" ON public."PasswordResetTokens" USING btree (token);


--
-- Name: Users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Users_email_key" ON public."Users" USING btree (email);


--
-- Name: Users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Users_username_key" ON public."Users" USING btree (username);


--
-- Name: idx_events_created_at; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_events_created_at ON public.events USING btree (created_at);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_events_date ON public.events USING btree (event_date);


--
-- Name: idx_events_event_date; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_events_event_date ON public.events USING btree (event_date);


--
-- Name: idx_events_event_type; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_events_event_type ON public.events USING btree (event_type);


--
-- Name: idx_menu_items_menu_id; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_menu_items_menu_id ON public.menu_items USING btree (menu_id);


--
-- Name: idx_menus_event_id; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_menus_event_id ON public.menus USING btree (event_id);


--
-- Name: idx_menus_year; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_menus_year ON public.menus USING btree (year);


--
-- Name: idx_scrapbook_content_order; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_scrapbook_content_order ON public."ScrapbookContent" USING btree (year, display_order);


--
-- Name: idx_scrapbook_content_type; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_scrapbook_content_type ON public."ScrapbookContent" USING btree (content_type);


--
-- Name: idx_scrapbook_content_year; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_scrapbook_content_year ON public."ScrapbookContent" USING btree (year);


--
-- Name: idx_scrapbook_files_generated_at; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_scrapbook_files_generated_at ON public."ScrapbookFiles" USING btree (generated_at);


--
-- Name: idx_scrapbook_files_status; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_scrapbook_files_status ON public."ScrapbookFiles" USING btree (status);


--
-- Name: idx_scrapbook_files_year; Type: INDEX; Schema: public; Owner: bobmaguire
--

CREATE INDEX idx_scrapbook_files_year ON public."ScrapbookFiles" USING btree (year);


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: bobmaguire
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: JournalContentItems JournalContentItems_journal_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalContentItems"
    ADD CONSTRAINT "JournalContentItems_journal_section_id_fkey" FOREIGN KEY (journal_section_id) REFERENCES public."JournalSections"(section_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalSections JournalSections_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."JournalSections"
    ADD CONSTRAINT "JournalSections_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PasswordResetTokens PasswordResetTokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public."PasswordResetTokens"
    ADD CONSTRAINT "PasswordResetTokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: menu_items menu_items_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bobmaguire
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: bobmaguire
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict X2Tx2DtSd5EClcyNsh2BeemZHvdSsJeM57oAS82j5jKbpSZBCpcegdRuDjJBiRW

