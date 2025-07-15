-- PostgreSQL Database Schema for CMS Project
-- Run this script to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    username character varying(100) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email_verified boolean DEFAULT false,
    last_login timestamp with time zone,
    role boolean NOT NULL DEFAULT false,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
)


-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (additional user information)
CREATE TABLE IF NOT EXISTS public.profiles
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    first_name character varying(100) COLLATE pg_catalog."default",
    middle_name character varying(100) COLLATE pg_catalog."default",
    last_name character varying(100) COLLATE pg_catalog."default",
    suffix character varying(50) COLLATE pg_catalog."default",
    date_of_birth date,
    sex character varying(20) COLLATE pg_catalog."default",
    phone character varying(20) COLLATE pg_catalog."default",
    country character varying(255) COLLATE pg_catalog."default",
    barangay character varying(255) COLLATE pg_catalog."default",
    city character varying(100) COLLATE pg_catalog."default",
    province character varying(100) COLLATE pg_catalog."default",
    sitio_purok_subdivision character varying(255) COLLATE pg_catalog."default",
    house_street character varying(100) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

-- Cases table
CREATE TABLE IF NOT EXISTS public.cases
(
    uuid_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    case_description text COLLATE pg_catalog."default" NOT NULL,
    status case_status DEFAULT 'pending'::case_status,
    case_type character varying(100) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at date,
    hearing_date timestamp with time zone,
    CONSTRAINT cases_pkey PRIMARY KEY (uuid_id),
    CONSTRAINT cases_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT cases_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying::text, 'in progress'::character varying::text, 'resolved'::character varying::text, 'open'::character varying::text, 'closed'::character varying::text]))
)


-- Respondents table (people being complained about)
CREATE TABLE IF NOT EXISTS public.respondents
(
    uuid_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    case_uuid uuid,
    first_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    middle_name character varying(100) COLLATE pg_catalog."default",
    last_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    suffix character varying(50) COLLATE pg_catalog."default",
    sitio_purok_subd character varying(255) COLLATE pg_catalog."default" NOT NULL,
    house_no_street character varying(255) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT respondents_pkey PRIMARY KEY (uuid_id),
    CONSTRAINT respondents_case_uuid_fkey FOREIGN KEY (case_uuid)
        REFERENCES public.cases (uuid_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

-- Case attachments table
CREATE TABLE IF NOT EXISTS public.case_attachments
(
    uuid_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    case_uuid uuid,
    file_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    file_type character varying(100) COLLATE pg_catalog."default",
    file_size bigint,
    storage_path character varying(500) COLLATE pg_catalog."default" NOT NULL,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT case_attachments_pkey PRIMARY KEY (uuid_id),
    CONSTRAINT case_attachments_case_uuid_fkey FOREIGN KEY (case_uuid)
        REFERENCES public.cases (uuid_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT case_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)


-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
CREATE INDEX IF NOT EXISTS idx_respondents_case_uuid ON respondents(case_uuid);
CREATE INDEX IF NOT EXISTS idx_case_attachments_case_uuid ON case_attachments(case_uuid);
CREATE INDEX IF NOT EXISTS idx_case_attachments_uploaded_by ON case_attachments(uploaded_by);


-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_respondents_updated_at BEFORE UPDATE ON respondents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 